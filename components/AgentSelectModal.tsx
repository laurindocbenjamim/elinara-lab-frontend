import React, { useEffect, useState } from 'react';
import { Search, X, User, ArrowRight, Loader2, BrainCircuit } from 'lucide-react';
import { processesService } from '../services/api';
import { Process } from '../types';
import { useNavigate } from 'react-router-dom';

interface AgentSelectModalProps {
    isOpen: boolean;
    onClose: () => void;
    filesData: Array<{
        id: string;
        name: string;
        type: string;
        provider: string;
    }>;
}

export const AgentSelectModal: React.FC<AgentSelectModalProps> = ({ isOpen, onClose, filesData }) => {
    const navigate = useNavigate();
    const [processes, setProcesses] = useState<Process[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchProcesses();
        }
    }, [isOpen]);

    const fetchProcesses = async () => {
        setLoading(true);
        try {
            const data = await processesService.list();
            setProcesses(data || []);
        } catch (err) {
            console.error('Failed to fetch processes', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredProcesses = processes.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelectAgent = (process: Process) => {
        if (!filesData || filesData.length === 0) return;

        // Navigate to agent page with files data in state
        navigate(`/agent/${process.id}`, {
            state: {
                autoOpenDataSource: true,
                filesInfo: filesData
            }
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
                    <div className="absolute inset-0 bg-gray-500/75 dark:bg-black/60 backdrop-blur-sm"></div>
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full animate-in fade-in zoom-in duration-300">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                        <div>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                                <BrainCircuit className="h-5 w-5 text-primary-500" />
                                Select Agent
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Choose which agent should process this file.</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-full transition-colors">
                            <X className="h-6 w-6 text-gray-400" />
                        </button>
                    </div>

                    <div className="p-6">
                        <div className="relative mb-6">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search agents..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all dark:text-white"
                            />
                        </div>

                        <div className="space-y-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                                    <Loader2 className="h-8 w-8 animate-spin mb-2" />
                                    <p className="text-sm">Loading agents...</p>
                                </div>
                            ) : filteredProcesses.length > 0 ? (
                                filteredProcesses.map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={() => handleSelectAgent(p)}
                                        className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-800 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                                                <User className="h-5 w-5" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-bold text-gray-900 dark:text-white">{p.name}</p>
                                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{p.trigger_type}</p>
                                            </div>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                                    </button>
                                ))
                            ) : (
                                <div className="text-center py-10">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">No agents found matching your search.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-900/50 text-center">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
                            Selected Files: <span className="text-gray-600 dark:text-gray-300">{filesData.length} item(s)</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
