import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { AgentTask } from '../types';
import { Activity, CheckCircle, Clock, XCircle, Calendar, Phone as PhoneIcon, FileText } from 'lucide-react';

export const AgentTasks: React.FC = () => {
    const { socket, isConnected } = useSocket();
    const [tasks, setTasks] = useState<AgentTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                // Assuming there's an endpoint to list all tasks, otherwise we'll just show the ones we track
                // For now, let's assume getTasks exists or we handle it via state
                // If not, we'll just wait for socket updates
                setLoading(false);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch tasks');
                setLoading(false);
            }
        };

        fetchTasks();
    }, []);

    useEffect(() => {
        if (socket) {
            socket.on('task_update', (updatedTask: AgentTask) => {
                setTasks((prevTasks) => {
                    const index = prevTasks.findIndex((t) => t.id === updatedTask.id);
                    if (index !== -1) {
                        const newTasks = [...prevTasks];
                        newTasks[index] = updatedTask;
                        return newTasks;
                    }
                    return [updatedTask, ...prevTasks];
                });
            });

            return () => {
                socket.off('task_update');
            };
        }
    }, [socket]);

    const getStatusIcon = (status: AgentTask['status']) => {
        switch (status) {
            case 'completed': return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'failed': return <XCircle className="h-5 w-5 text-red-500" />;
            case 'processing': return <Activity className="h-5 w-5 text-blue-500 animate-pulse" />;
            default: return <Clock className="h-5 w-5 text-gray-400" />;
        }
    };

    const getStatusClass = (status: AgentTask['status']) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            case 'processing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] dark:text-white">
                <div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full mb-4"></div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">Loading tasks...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 dark:text-gray-100">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Agent Tasks</h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Monitor the progress of FundingDetective matching cycles in real-time.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {isConnected ? 'Real-time connection active' : 'Offline - Updates will be delayed'}
                    </span>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg border border-red-100 dark:border-red-800">
                    {error}
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 shadow rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Task Info</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Progress</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {tasks.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        <Activity className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                        <p className="text-lg">No tasks found</p>
                                        <p className="text-sm">Trigger a manual task from the dashboard to start.</p>
                                    </td>
                                </tr>
                            ) : (
                                tasks.map((task) => (
                                    <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
                                                    <FileText className="h-5 w-5" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{task.filename}</div>
                                                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                                        <PhoneIcon className="h-3 w-3 mr-1" />
                                                        {task.phone}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-1 max-w-[150px]">
                                                <div
                                                    className="bg-primary-600 h-2.5 rounded-full transition-all duration-500"
                                                    style={{ width: `${task.progress}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">{task.progress}%</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(task.status)}`}>
                                                {getStatusIcon(task.status)}
                                                <span className="ml-1.5">{task.status.charAt(0).toUpperCase() + task.status.slice(1)}</span>
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <Calendar className="h-4 w-4 mr-1.5 opacity-60" />
                                                {new Date(task.created_at).toLocaleString()}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
