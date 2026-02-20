import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { config } from '../config';

import { AgentTask, AgentAction } from '../types';

interface PipelineStage {
    current: number;
    total: number;
    percentage: number;
    status: string;
}

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    events: any[];
    pipelineUpdates: Record<string, Record<string, PipelineStage>>;
    tasks: AgentTask[];
    actions: AgentAction[];
    countdown: Record<string, { remaining: number; next_run: string }>;
    clearEvents: () => void;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
    events: [],
    pipelineUpdates: {},
    tasks: [],
    actions: [],
    countdown: {},
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
    const [pipelineUpdates, setPipelineUpdates] = useState<Record<string, Record<string, PipelineStage>>>({});
    const [tasks, setTasks] = useState<AgentTask[]>([]);
    const [actions, setActions] = useState<AgentAction[]>([]);
    const [countdown, setCountdown] = useState<Record<string, { remaining: number; next_run: string }>>({});

    const clearEvents = () => setEvents([]);

    useEffect(() => {
        // Log connection attempt
        console.log(`Socket.io: Attempting connection to ${config.SOCKET_URL} with path /api/socket.io`);

        const socketInstance = io(config.SOCKET_URL, {
            path: '/api/socket.io',
            withCredentials: true,
            transports: ['websocket', 'polling'], // Prioritize websocket
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 2000,
            timeout: 20000,
        });

        socketInstance.on('connect', () => {
            console.log('Socket.io connected successfully');
            setIsConnected(true);
        });

        socketInstance.on('disconnect', (reason) => {
            console.log('Socket.io disconnected:', reason);
            setIsConnected(false);
            if (reason === 'io server disconnect') {
                // The disconnection was initiated by the server, you need to reconnect manually
                socketInstance.connect();
            }
        });

        socketInstance.on('connect_error', (error) => {
            console.error('Socket.io connection error:', error);
            // Some specific logging for common errors
            if (error.message === 'xhr poll error') {
                console.warn('Socket.io: XHR poll error. This often means the server is down or the path /api/socket.io is incorrect.');
            }
        });

        // Pipeline Updates
        socketInstance.on('pipeline_update', (data: any) => {
            if (data.process_id && data.pipeline) {
                setPipelineUpdates(prev => ({
                    ...prev,
                    [String(data.process_id)]: data.pipeline
                }));

                // Logic to push to events log if it's a significant change
                const stages = Object.entries(data.pipeline);
                const activeStage = [...stages].reverse().find(([_, info]: [any, any]) =>
                    info.status === 'tracking' || info.status === 'completed' || info.status === 'error'
                );

                if (activeStage) {
                    const [key, info]: [string, any] = activeStage;
                    setEvents(prev => {
                        // Avoid immediate duplicates for same stage/status
                        if (prev.length > 0 && prev[0].name === `Stage: ${key}` && prev[0].status === info.status && prev[0].agent_id === String(data.process_id)) {
                            return prev;
                        }
                        return [{
                            id: Date.now(),
                            agent_id: String(data.process_id),
                            time: new Date().toLocaleTimeString(),
                            name: `Stage: ${key}`,
                            source: 'Agent Pipeline',
                            status: info.status === 'error' ? 'error' : 'success'
                        }, ...prev].slice(0, 50); // Keep more events globally
                    });
                }
            }
        });

        // Task Updates
        socketInstance.on('task_update', (updatedTask: AgentTask) => {
            setTasks((prevTasks) => {
                const index = prevTasks.findIndex((t) => t.id === updatedTask.id);
                if (index !== -1) {
                    const newTasks = [...prevTasks];
                    newTasks[index] = updatedTask;
                    return newTasks;
                }
                return [updatedTask, ...prevTasks];
            });

            // Log as event too
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
        socketInstance.on('agent_action', (newAction: AgentAction) => {
            setActions(prev => [newAction, ...prev].slice(0, 100));
        });

        // Agent Countdown
        socketInstance.on('agent_countdown', (data: any) => {
            if (data.process_id) {
                setCountdown(prev => ({
                    ...prev,
                    [String(data.process_id)]: {
                        remaining: data.remaining_seconds,
                        next_run: data.next_run
                    }
                }));
            }
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.removeAllListeners();
            socketInstance.disconnect();
        };
    }, []);

    const value = {
        socket,
        isConnected,
        events,
        pipelineUpdates,
        tasks,
        actions,
        countdown,
        clearEvents
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};
