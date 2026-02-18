import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { AgentTask } from '../types';
import { Activity, CheckCircle, Clock, XCircle, Calendar, Phone as PhoneIcon, FileText } from 'lucide-react';
import '../styles/PageLayout.css';

export const AgentTasks: React.FC = () => {
    const { socket, isConnected } = useSocket();
    const [tasks, setTasks] = useState<AgentTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
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

    const getStatusColor = (status: AgentTask['status']) => {
        switch (status) {
            case 'completed': return 'text-green-400';
            case 'failed': return 'text-red-400';
            case 'processing': return 'text-blue-400';
            default: return 'text-zinc-500';
        }
    };

    if (loading) {
        return (
            <div className="dashboard-page flex items-center justify-center h-screen bg-[#050505]">
                <div className="dash-loader" />
            </div>
        );
    }

    return (
        <div className="dashboard-page h-[calc(100vh-4rem)] overflow-hidden flex flex-col p-6 lg:p-12 bg-[#050505]">
            <div className="max-w-5xl mx-auto w-full flex-grow flex flex-col justify-start -mt-5 z-10">
                
                {/* Header - Identical to Profile.tsx */}
                <header className="mb-6 text-left">
                    <h2 className="text-3xl font-bold tracking-tighter bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent">
                        REPORTS
                    </h2>
                </header>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 text-red-400 rounded-2xl border border-red-500/20 text-[11px] font-medium uppercase tracking-wider">
                        {error}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        {tasks.length === 0 ? (
                            <div className="md:col-span-2 py-32 flex flex-col items-center justify-center bg-white/[0.01] border border-white/5 rounded-3xl">
                                <Activity className="h-8 w-8 mb-4 text-zinc-800" />
                                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.3em]">No active neural processes</p>
                            </div>
                        ) : (
                            tasks.map((task) => (
                                <div key={task.id} className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 hover:bg-white/[0.05] transition-all duration-500 group flex flex-col justify-between h-full">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2 text-zinc-500 group-hover:text-zinc-400 transition-colors">
                                                <FileText size={14} />
                                                <span className="text-[11px] font-medium uppercase tracking-wider">Matrix Instance</span>
                                            </div>
                                            <div className={`text-[10px] font-bold uppercase tracking-widest ${getStatusColor(task.status)}`}>
                                                {task.status}
                                            </div>
                                        </div>
                                        <div className="text-xl font-bold text-white uppercase truncate mb-4">
                                            {task.filename}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <div className="text-[10px] font-medium text-zinc-500 uppercase mb-1">Phone Vector</div>
                                                <div className="text-xs font-bold text-zinc-300">{task.phone}</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-medium text-zinc-500 uppercase mb-1">Timestamp</div>
                                                <div className="text-xs font-bold text-zinc-300">{new Date(task.created_at).toLocaleDateString()}</div>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-white/5">
                                            <div className="flex justify-between items-center mb-1.5">
                                                <span className="text-[10px] font-medium text-zinc-500 uppercase">Progress</span>
                                                <span className="text-[10px] font-bold text-white">{task.progress}%</span>
                                            </div>
                                            <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden">
                                                <div
                                                    className="bg-white h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                                                    style={{ width: `${task.progress}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
