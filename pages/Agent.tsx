import React, { useEffect, useState } from 'react';
import { Settings, Play, Square, Pause, Plus, List, Trash2 } from 'lucide-react';
import { agentService, configService } from '../services/api';
import { AgentStatus } from '../types';
import { useAuth } from '../context/AuthContext';

export const Agent: React.FC = () => {
    const { user } = useAuth();
    const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
    const [connectionEmails, setConnectionEmails] = useState<string[]>([]);
    const [newEmail, setNewEmail] = useState('');
    const [selectedModel, setSelectedModel] = useState('gpt-4o');
    const [taskData, setTaskData] = useState({ filename: '', phone: '' });
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchAgentData();
    }, []);

    const fetchAgentData = async () => {
        try {
            const [statusRes, emailRes] = await Promise.all([
                agentService.getStatus(),
                configService.getConnectionEmails()
            ]);
            setAgentStatus(statusRes);
            setConnectionEmails(emailRes.connection_emails);
            setSelectedModel(statusRes.selected_model);
        } catch (err) {
            console.error('Failed to fetch agent data', err);
        }
    };

    const handleAgentControl = async (action: 'start' | 'stop' | 'pause') => {
        try {
            const res = await agentService.control(action);
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
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">FundingDetective Agent</h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Configure and control your AI matching agent.
                    </p>
                </div>
            </div>

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

                        <div className="grid grid-cols-3 gap-4 mb-8">
                            <button
                                onClick={() => handleAgentControl('start')}
                                className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-transparent bg-gray-50 dark:bg-gray-900/50 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-200 dark:hover:border-green-800 transition-all group"
                            >
                                <Play className="h-6 w-6 text-gray-400 group-hover:text-green-500 mb-2" />
                                <span className="text-xs font-bold">Start</span>
                            </button>
                            <button
                                onClick={() => handleAgentControl('pause')}
                                className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-transparent bg-gray-50 dark:bg-gray-900/50 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:border-yellow-200 dark:hover:border-yellow-800 transition-all group"
                            >
                                <Pause className="h-6 w-6 text-gray-400 group-hover:text-yellow-500 mb-2" />
                                <span className="text-xs font-bold">Pause</span>
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
                            {connectionEmails.map((email) => (
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
