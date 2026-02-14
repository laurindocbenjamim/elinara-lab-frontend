import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { Activity, Clock, Terminal, CheckCircle, XCircle } from 'lucide-react';

interface AgentAction {
    id: string;
    timestamp: string;
    type: 'action' | 'observation' | 'thought' | 'error';
    content: string;
    meta?: Record<string, any>;
}

export const AgentActions: React.FC = () => {
    const { socket, isConnected } = useSocket();
    const [actions, setActions] = useState<AgentAction[]>([]);

    useEffect(() => {
        // Placeholder for initial load of actions if backend supports it
        // For now, we'll rely on real-time updates via socket
        const mockActions: AgentAction[] = [
            {
                id: '1',
                timestamp: new Date().toISOString(),
                type: 'thought',
                content: 'Analyzing the provided leads spreadsheet to identify potential matches.'
            },
            {
                id: '2',
                timestamp: new Date(Date.now() - 5000).toISOString(),
                type: 'action',
                content: 'Searching for company profiles in the local database.'
            },
            {
                id: '3',
                timestamp: new Date(Date.now() - 10000).toISOString(),
                type: 'observation',
                content: 'Found 15 potential matching companies.'
            },
            {
                id: '4',
                timestamp: new Date(Date.now() - 15000).toISOString(),
                type: 'error',
                content: 'Failed to access LinkedIn profile for: TechCorp. Connection timeout.',
                meta: { company: 'TechCorp', error_code: 'TIMEOUT', retry: true }
            }
        ];

        setActions(mockActions);

        if (socket) {
            socket.on('agent_action', (newAction: AgentAction) => {
                setActions(prev => [newAction, ...prev]);
            });
            return () => {
                socket.off('agent_action');
            };
        }
    }, [socket]);

    const getActionTypeIcon = (type: AgentAction['type']) => {
        switch (type) {
            case 'action': return <Terminal className="h-4 w-4 text-blue-500" />;
            case 'observation': return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'thought': return <Clock className="h-4 w-4 text-amber-500" />;
            case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
            default: return <Activity className="h-4 w-4 text-gray-500" />;
        }
    };

    return (
        <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 dark:text-gray-100">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Activity className="h-8 w-8 text-primary-500" />
                        Agent Activity
                    </h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Real-time feed of actions and thoughts from the AI agent.
                    </p>
                </div>
                <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 capitalize">
                        {isConnected ? 'Stream Active' : 'Disconnected'}
                    </span>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Logs</span>
                    <span className="text-[10px] text-gray-400">{actions.length} activities recorded</span>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {actions.map((action, idx) => (
                        <div key={action.id || idx} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors flex gap-4">
                            <div className="mt-1.5">{getActionTypeIcon(action.type)}</div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold text-gray-400 font-mono">
                                        [{new Date(action.timestamp).toLocaleTimeString()}]
                                    </span>
                                    <span className={`text-[10px] uppercase font-black tracking-tighter px-2 py-0.5 rounded ${action.type === 'action' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                        action.type === 'thought' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                            action.type === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                        }`}>
                                        {action.type}
                                    </span>
                                </div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {action.content}
                                </p>
                                {action.meta && (
                                    <div className="mt-3 p-3 bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-100 dark:border-gray-800">
                                        <pre className="text-[10px] font-mono text-gray-500 dark:text-gray-400 overflow-x-auto">
                                            {JSON.stringify(action.meta, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {actions.length === 0 && (
                        <div className="py-20 flex flex-col items-center justify-center text-gray-400">
                            <Activity className="h-12 w-12 mb-4 opacity-10" />
                            <p className="text-sm font-medium">Waiting for agent activity...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
