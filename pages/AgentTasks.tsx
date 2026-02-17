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
            case 'completed': return <CheckCircle className="h-4 w-4 text-green-400" />;
            case 'failed': return <XCircle className="h-4 w-4 text-red-400" />;
            case 'processing': return <Activity className="h-4 w-4 text-blue-400 animate-pulse" />;
            default: return <Clock className="h-4 w-4 text-zinc-500" />;
        }
    };

    const getStatusClass = (status: AgentTask['status']) => {
        switch (status) {
            case 'completed': return 'bg-green-500/10 text-green-400 border-green-500/20';
            case 'failed': return 'bg-red-500/10 text-red-400 border-red-500/20';
            case 'processing': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            default: return 'bg-white/5 text-zinc-500 border-white/10';
        }
    };

    if (loading) {
        return (
            <div className="dashboard-page flex flex-col items-center justify-center h-screen bg-[#050505]">
                <div className="dash-loader mb-4"></div>
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Querying Agent Matrix...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-page h-[calc(100vh-4rem)] overflow-hidden flex flex-col p-6 lg:p-12 bg-[#050505]">
            <div className="max-w-7xl mx-auto w-full flex-grow flex flex-col justify-start -mt-5 z-10">
                
                {/* Header Section */}
                <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="text-left">
                        <h2 className="text-3xl font-bold tracking-tighter bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent uppercase">
                            AGENT TASKS
                        </h2>
                        <p className="mt-1 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
                            Real-time synchronization with FundingDetective nodes
                        </p>
                    </div>

                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl">
                        <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`}></div>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                            {isConnected ? 'LIVE INTERFACE ACTIVE' : 'REMOTE NODE OFFLINE'}
                        </span>
                    </div>
                </header>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 text-red-400 rounded-2xl border border-red-500/20 text-xs font-medium uppercase tracking-wider">
                        {error}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden mb-8">
                        <table className="min-w-full">
                            <thead>
                                <tr className="border-b border-white/5">
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Matrix Instance</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Vector Progress</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Status</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                                {tasks.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-24 text-center">
                                            <Activity className="h-12 w-12 mx-auto mb-4 text-zinc-800" />
                                            <p className="text-xs font-bold text-zinc-600 uppercase tracking-[0.3em]">No active neural processes</p>
                                        </td>
                                    </tr>
                                ) : (
                                    tasks.map((task) => (
                                        <tr key={task.id} className="hover:bg-white/[0.04] transition-all group">
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-2xl bg-white/5 border border-white/5 text-zinc-400 group-hover:scale-110 transition-transform">
                                                        <FileText size={18} />
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-bold text-white uppercase tracking-tight">{task.filename}</div>
                                                        <div className="flex items-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                                                            <PhoneIcon size={10} className="mr-1.5 opacity-60" />
                                                            {task.phone}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div className="flex flex-col gap-2">
                                                    <div className="w-48 bg-white/5 rounded-full h-1.5 overflow-hidden">
                                                        <div
                                                            className="bg-white h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                                                            style={{ width: `${task.progress}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{task.progress}% COMPLETE</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-widest ${getStatusClass(task.status)}`}>
                                                    {getStatusIcon(task.status)}
                                                    {task.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div className="flex items-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                                    <Calendar size={12} className="mr-2 opacity-40" />
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

                {/* Footer Info */}
                <div className="mt-auto pt-6 flex justify-between items-center text-[9px] font-bold text-zinc-700 uppercase tracking-[0.3em]">
                    <span>ELINARA SYSTEMS v2.0.26</span>
                    <span className="flex items-center gap-2">
                        SECURE ENCRYPTED TUNNEL
                        <div className="h-1 w-1 rounded-full bg-zinc-800" />
                    </span>
                </div>
            </div>
        </div>
    );
};
