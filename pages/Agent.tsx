import React, { useEffect, useState } from 'react';
import { Settings, Play, Square, Plus, Trash2, Loader2, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { agentService, configService, processesService } from '../services/api';
import { AgentStatus, Process } from '../types';
import { useAuth } from '../context/AuthContext';
import { useParams } from 'react-router-dom';

export const Agent: React.FC = () => {
    const { processId } = useParams<{ processId: string }>();
    const { } = useAuth();
    const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
    const [process, setProcess] = useState<Process | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [connectionEmails, setConnectionEmails] = useState<string[]>([]);
    const [newEmail, setNewEmail] = useState('');
    const [selectedModel, setSelectedModel] = useState('gpt-4o');
    const [taskData, setTaskData] = useState({ filename: '', phone: '' });
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [showProcessDetails, setShowProcessDetails] = useState(false);

    useEffect(() => {
        fetchAgentData();
    }, [processId]);

    const fetchAgentData = async () => {
        setIsLoading(true);
        try {
            const promises: Promise<any>[] = [
                agentService.getStatus(),
                configService.getConnectionEmails()
            ];

            if (processId) {
                promises.push(processesService.get(parseInt(processId)));
            }

            const results = await Promise.all(promises);

            setAgentStatus(results[0]);
            setConnectionEmails(results[1]?.connection_emails || []);
            setSelectedModel(results[0]?.selected_model || 'gpt-4o');
            if (processId && results[2]) {
                setProcess(results[2]);
            } else {
                setProcess(null);
            }
        } catch (err) {
            console.error('Failed to fetch agent data', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAgentControl = async (action: 'start' | 'stop' | 'pause') => {
        try {
            const res = await agentService.control(
                action,
                process?.user_id || undefined,
                process?.id || undefined
            );
            setMessage({ type: 'success', text: res.msg });
            fetchAgentData();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to control agent' });
        }
    };

    const handleUpdateModel = async (model: string) => {
        try {
            const res = await agentService.updateConfig(model);
            setSelectedModel(res.selected_model);
            setMessage({ type: 'success', text: res.msg });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to update model' });
        }
    };

    const handleAddEmail = async () => {
        if (!newEmail) return;
        try {
            const updatedEmails = [...connectionEmails, newEmail];
            await configService.updateConnectionEmails(updatedEmails);
            setConnectionEmails(updatedEmails);
            setNewEmail('');
            setMessage({ type: 'success', text: 'Email added successfully' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to add email' });
        }
    };

    const handleRemoveEmail = async (email: string) => {
        try {
            const updatedEmails = connectionEmails.filter(e => e !== email);
            await configService.updateConnectionEmails(updatedEmails);
            setConnectionEmails(updatedEmails);
            setMessage({ type: 'success', text: 'Email removed' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to remove email' });
        }
    };

    const handleTriggerTask = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await agentService.triggerTask(taskData.filename, taskData.phone);
            setMessage({ type: 'success', text: res.msg });
            window.location.hash = '/agent-tasks';
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to trigger task' });
        }
    };

    return (
        <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 dark:text-gray-100">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {process ? process.name : 'FundingDetective Agent'}
                    </h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {process ? `Managing agent for process: ${process.name}` : 'Configure and control your AI matching agent.'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {process && (
                        <button
                            onClick={() => setShowProcessDetails(!showProcessDetails)}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all shadow-sm"
                        >
                            <Info className="h-4 w-4 text-primary-500" />
                            {showProcessDetails ? 'Hide Details' : 'Show Details'}
                            {showProcessDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                    )}
                    {isLoading && <Loader2 className="h-6 w-6 animate-spin text-primary-500" />}
                </div>
            </div>

            {process && showProcessDetails && (
                <div className="mb-8 bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="p-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Process ID</label>
                                <p className="text-sm font-mono font-bold text-gray-700 dark:text-gray-300">#{process.id}</p>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">User ID</label>
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{process.user_id}</p>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Trigger Type</label>
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300 capitalize">{process.trigger_type}</p>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</label>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${process.status === 'running' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'}`}>
                                    {process.status}
                                </span>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Created At</label>
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{new Date(process.created_at).toLocaleString()}</p>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Updated At</label>
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{new Date(process.updated_at || process.created_at).toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="mt-6">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Configuration Snapshot</label>
                            <pre className="mt-2 text-[10px] font-mono bg-white dark:bg-black/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 overflow-x-auto">
                                {JSON.stringify(process.config_snapshot, null, 2)}
                            </pre>
                        </div>
                    </div>
                </div>
            )}

            {message && (
                <div className={`mb-6 p-4 rounded-xl border ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' : 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'}`}>
                    {message.text}
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
                {/* Agent Status & Control */}
                <div className="bg-white dark:bg-gray-800 shadow sm:rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center mb-6">
                            <Settings className="h-5 w-5 mr-2 text-primary-500" />
                            Agent Controls
                        </h3>

                        <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-900/50 rounded-2xl mb-8 border border-gray-100 dark:border-gray-700">
                            <div>
                                <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Current Status</div>
                                <div className="flex items-center">
                                    <div className={`h-2.5 w-2.5 rounded-full mr-2 ${agentStatus?.agent_status === 'active' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : agentStatus?.agent_status === 'paused' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                                    <span className="text-xl font-black text-gray-900 dark:text-white capitalize">{agentStatus?.agent_status || 'Offline'}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Plan</div>
                                <div className="text-xl font-black text-primary-600 dark:text-primary-400">{agentStatus?.plan || 'Standard'}</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <button
                                onClick={() => handleAgentControl('start')}
                                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-transparent transition-all group ${agentStatus?.agent_status === 'active' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-gray-900/50 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-200 dark:hover:border-green-800'}`}
                            >
                                {agentStatus?.agent_status === 'active' ? (
                                    <Loader2 className="h-6 w-6 text-green-500 mb-2 animate-spin" />
                                ) : (
                                    <Play className="h-6 w-6 text-gray-400 group-hover:text-green-500 mb-2" />
                                )}
                                <span className={`text-xs font-bold ${agentStatus?.agent_status === 'active' ? 'text-green-700 dark:text-green-400' : ''}`}>
                                    {agentStatus?.agent_status === 'active' ? 'Running' : 'Start'}
                                </span>
                            </button>
                            <button
                                onClick={() => handleAgentControl('stop')}
                                className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-transparent bg-gray-50 dark:bg-gray-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-800 transition-all group"
                            >
                                <Square className="h-6 w-6 text-gray-400 group-hover:text-red-500 mb-2" />
                                <span className="text-xs font-bold">Stop</span>
                            </button>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Preferred AI Model</label>
                            <select
                                value={selectedModel}
                                onChange={(e) => handleUpdateModel(e.target.value)}
                                className="block w-full px-4 py-3 rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 focus:ring-primary-500 focus:border-primary-500 text-sm font-medium dark:text-white border"
                            >
                                <option value="gpt-4o">GPT-4o (Standard)</option>
                                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                                <option value="claude-3-opus">Claude 3 Opus</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Config & Task Trigger */}
                <div className="space-y-6">
                    {/* Connection Emails */}
                    <div className="bg-white dark:bg-gray-800 shadow sm:rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Authorized Emails</h3>
                        <div className="space-y-3 mb-6 max-h-48 overflow-y-auto pr-1">
                            {(connectionEmails || []).map((email) => (
                                <div key={email} className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700">
                                    <span className="text-sm font-medium truncate mr-2">{email}</span>
                                    <button onClick={() => handleRemoveEmail(email)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                            {connectionEmails.length === 0 && (
                                <div className="text-center py-6">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">No emails authorized yet.</p>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                placeholder="Add authorized email..."
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                className="flex-1 block w-full px-4 py-2.5 rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 focus:ring-primary-500 focus:border-primary-500 text-sm border dark:text-white"
                            />
                            <button
                                onClick={handleAddEmail}
                                className="p-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-all shadow-lg shadow-primary-500/30"
                            >
                                <Plus className="h-6 w-6" />
                            </button>
                        </div>
                    </div>

                    {/* Manual Task Trigger */}
                    <div className="bg-white dark:bg-gray-800 shadow sm:rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Trigger Manual Task</h3>
                        <form onSubmit={handleTriggerTask} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Source Filename</label>
                                <input
                                    type="text"
                                    placeholder="e.g. leads_2024.xlsx"
                                    value={taskData.filename}
                                    onChange={(e) => setTaskData({ ...taskData, filename: e.target.value })}
                                    className="block w-full px-4 py-2.5 rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 focus:ring-primary-500 focus:border-primary-500 text-sm border dark:text-white"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Target Phone</label>
                                <input
                                    type="text"
                                    placeholder="e.g. +351912..."
                                    value={taskData.phone}
                                    onChange={(e) => setTaskData({ ...taskData, phone: e.target.value })}
                                    className="block w-full px-4 py-2.5 rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 focus:ring-primary-500 focus:border-primary-500 text-sm border dark:text-white"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary-500/30 flex items-center justify-center gap-2"
                            >
                                <Play className="h-5 w-5" />
                                Start Matching Cycle
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};
