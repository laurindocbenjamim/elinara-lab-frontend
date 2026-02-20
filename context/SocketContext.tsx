import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Socket } from 'socket.io-client';
import { socket as sharedSocket } from '../services/socket';

import { AgentTask, AgentAction } from '../types';

interface PipelineStage {
    current: number;
    total: number;
    percentage: number;
    status: string;
    label?: string;
}

export interface AgentState {
    pipeline: Record<string, PipelineStage>;
    model: string;
    provider: string;
    status: string;
    countdown: number | null;
    mode: string;
    lastUpdate: number;
}

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    events: any[];
    agentStates: Record<string, AgentState>;
    tasks: AgentTask[];
    actions: AgentAction[];
    clearEvents: () => void;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
    events: [],
    agentStates: {},
    tasks: [],
    actions: [],
    clearEvents: () => { },
});

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
    children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    // Global Persistent States
    const [events, setEvents] = useState<any[]>([]);
    const [agentStates, setAgentStates] = useState<Record<string, AgentState>>({});
    const [tasks, setTasks] = useState<AgentTask[]>([]);
    const [actions, setActions] = useState<AgentAction[]>([]);

    const clearEvents = () => setEvents([]);

    const updateAgentState = (agentId: string, updates: Partial<AgentState>) => {
        setAgentStates(prev => {
            const current = prev[agentId] || {
                pipeline: {},
                model: "N/A",
                provider: "N/A",
                status: "idle",
                countdown: null,
                mode: "manual",
                lastUpdate: Date.now()
            };
            return {
                ...prev,
                [agentId]: { ...current, ...updates, lastUpdate: Date.now() }
            };
        });
    };

    useEffect(() => {
        setSocket(sharedSocket);

        if (sharedSocket.connected) {
            setIsConnected(true);
        }

        sharedSocket.on('connect', () => {
            console.log('Socket.io connected successfully');
            setIsConnected(true);
        });

        sharedSocket.on('disconnect', (reason) => {
            console.log('Socket.io disconnected:', reason);
            setIsConnected(false);
            if (reason === 'io server disconnect') {
                sharedSocket.connect();
            }
        });

        sharedSocket.on('connect_error', (error) => {
            console.error('Socket.io connection error:', error);
            if (error.message === 'xhr poll error') {
                console.warn('Socket.io: XHR poll error.');
            }
        });

        // Pipeline Updates
        sharedSocket.on('pipeline_update', (data: any) => {
            if (data.process_id && data.pipeline) {
                const agentId = String(data.process_id);
                updateAgentState(agentId, {
                    pipeline: data.pipeline,
                    model: data.model || undefined,
                    provider: data.provider || undefined
                });

                const stages = Object.entries(data.pipeline);
                const activeStage = [...stages].reverse().find(([_, info]: [any, any]) =>
                    info.status === 'tracking' || info.status === 'completed' || info.status === 'error'
                );

                if (activeStage) {
                    const [key, info]: [string, any] = activeStage;
                    setEvents(prev => {
                        if (prev.length > 0 && prev[0].name === `Stage: ${key}` && prev[0].status === info.status && prev[0].agent_id === agentId) {
                            return prev;
                        }
                        return [{
                            id: Date.now(),
                            agent_id: agentId,
                            time: new Date().toLocaleTimeString(),
                            name: `Stage: ${key}`,
                            source: 'Agent Pipeline',
                            status: info.status === 'error' ? 'error' : 'success'
                        }, ...prev].slice(0, 50);
                    });
                }
            }
        });

        // Agent Status/Update
        const handleAgentUpdate = (data: any) => {
            const agentId = String(data.process_id || data.agent_id);
            if (agentId && agentId !== "undefined") {
                updateAgentState(agentId, {
                    status: data.status || data.agent_status,
                    model: data.model,
                    provider: data.provider
                });
            }
        };
        sharedSocket.on('agent_update', handleAgentUpdate);
        sharedSocket.on('agent_status', handleAgentUpdate);

        // Task Updates
        sharedSocket.on('task_update', (updatedTask: AgentTask) => {
            setTasks((prevTasks) => {
                const index = prevTasks.findIndex((t) => t.id === updatedTask.id);
                if (index !== -1) {
                    const newTasks = [...prevTasks];
                    newTasks[index] = updatedTask;
                    return newTasks;
                }
                return [updatedTask, ...prevTasks];
            });

            setEvents(prev => [{
                id: Date.now(),
                time: new Date().toLocaleTimeString(),
                name: `Task Update: ${updatedTask.status}`,
                source: 'Task Service',
                status: updatedTask.status === 'failed' ? 'error' : 'success',
                meta: updatedTask
            }, ...prev].slice(0, 50));
        });

        // Agent Actions (LLM Thoughts/Actions)
        sharedSocket.on('agent_action', (newAction: AgentAction) => {
            setActions(prev => [newAction, ...prev].slice(0, 100));
        });

        // Agent Countdown
        sharedSocket.on('agent_countdown', (data: any) => {
            const agentId = String(data.process_id);
            if (agentId && agentId !== "undefined") {
                updateAgentState(agentId, {
                    countdown: data.remaining_seconds,
                    mode: data.mode,
                    model: data.model
                });
            }
        });

        return () => {
            // Cleanup listeners omitted for persistence
        };
    }, []);

    const value = {
        socket,
        isConnected,
        events,
        agentStates,
        tasks,
        actions,
        clearEvents
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};
