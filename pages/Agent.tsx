import React, { useEffect, useState } from 'react';
import { Settings, Play, Square, Plus, Trash2, Cpu, Mail, Zap, ArrowRight, ArrowLeft, Bot } from 'lucide-react';
import { agentService, configService } from '../services/api';
import { AgentStatus } from '../types';
import '../styles/PageLayout.css';

// Mock Agents - Refined for visual impact
const MOCK_AGENTS = [
    { id: 'incentivos', name: 'Agente Incentivos', icon: <Bot size={22} /> },
    { id: 'sample-1', name: 'Sample Agent 1', icon: <Bot size={22} /> },
    { id: 'sample-2', name: 'Sample Agent 2', icon: <Bot size={22} /> },
    { id: 'sample-3', name: 'Sample Agent 3', icon: <Bot size={22} /> }
];

export const Agent: React.FC = () => {
    const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
    const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
    const [connectionEmails, setConnectionEmails] = useState<string[]>([]);
    const [newEmail, setNewEmail] = useState('');
    const [selectedModel, setSelectedModel] = useState('gpt-4o');
    const [taskData, setTaskData] = useState({ filename: '', phone: '' });
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (selectedAgent) {
            fetchAgentData();
        }
    }, [selectedAgent]);

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
            setTimeout(() => setMessage(null), 3000);
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
            setTimeout(() => setMessage(null), 3000);
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
            setMessage({ type: 'success', text: 'Email authorized' });
            setTimeout(() => setMessage(null), 3000);
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to add email' });
        }
    };

    const handleRemoveEmail = async (email: string) => {
        try {
            const updatedEmails = connectionEmails.filter(e => e !== email);
            await configService.updateConnectionEmails(updatedEmails);
            setConnectionEmails(updatedEmails);
            setMessage({ type: 'success', text: 'Access revoked' });
            setTimeout(() => setMessage(null), 3000);
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to remove' });
        }
    };

    const handleTriggerTask = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await agentService.triggerTask(taskData.filename, taskData.phone);
            setMessage({ type: 'success', text: res.msg });
            setTimeout(() => {
                window.location.hash = '/agent-tasks';
            }, 1000);
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Trigger failed' });
        }
    };

    // Selection View (Dashboard Inicial)
    if (!selectedAgent) {
        return (
            <div className="dashboard-page h-[calc(100vh-4rem)] overflow-hidden flex flex-col p-6 lg:p-12 bg-[#050505]">
                <div className="max-w-5xl mx-auto w-full flex-grow flex flex-col justify-start -mt-5 z-10 min-h-0 overflow-y-auto custom-scrollbar pr-2">
                    <header className="mb-8 text-left">
                        <h2 className="text-3xl font-bold tracking-tighter bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent">
                            AGENTS
                        </h2>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {MOCK_AGENTS.map((agent) => (
                            <button
                                key={agent.id}
                                onClick={() => setSelectedAgent(agent.id)}
                                className="relative overflow-hidden bg-white/[0.02] border border-white/5 rounded-3xl p-6 hover:bg-white/[0.04] hover:border-blue-500/20 transition-all duration-700 group text-left flex flex-col justify-between h-[200px]"
                            >
                                {/* Neural Mesh Background */}
                                <div className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-700">
                                    <svg width="100%" height="100%" className="absolute inset-0">
                                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
                                            <circle cx="0" cy="0" r="1" fill="white" />
                                        </pattern>
                                        <rect width="100%" height="100%" fill="url(#grid)" />
                                    </svg>
                                </div>

                                {/* Scanning Line */}
                                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                                    <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent absolute top-0 animate-[scan_4s_linear_infinite]" />
                                </div>

                                {/* Decorative Background Element */}
                                <div className="absolute top-0 right-0 -mt-4 -mr-4 h-40 w-40 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/15 transition-all duration-700" />

                                <div className="flex items-start justify-between z-10">
                                    <div className="relative p-3 rounded-2xl bg-white/5 border border-white/5 text-zinc-400 group-hover:text-blue-400 group-hover:border-blue-500/20 transition-all duration-500 shadow-xl overflow-hidden">
                                        <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/5 transition-colors duration-500" />
                                        {agent.icon}
                                    </div>

                                    {/* Abstract Activity Visual */}
                                    <div className="flex gap-1 items-end h-8">
                                        {[0.4, 0.7, 0.3, 0.9, 0.5].map((h, i) => (
                                            <div
                                                key={i}
                                                className="w-1 bg-blue-500/20 group-hover:bg-blue-400/40 transition-all duration-500 rounded-full"
                                                style={{
                                                    height: `${h * 100}%`,
                                                    animation: `pulse-height ${1 + i * 0.2}s ease-in-out infinite alternate`
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="z-10">
                                    <h3 className="text-2xl font-bold text-white uppercase tracking-tighter group-hover:translate-x-1 transition-transform duration-500">
                                        {agent.name}
                                    </h3>

                                    <div className="flex items-center gap-6 mt-5 pt-5 border-t border-white/5">
                                        {/* Original Visual Elements (No Text) */}
                                        <div className="flex gap-3 items-center">
                                            <div className="flex -space-x-1">
                                                {[1, 2, 3].map(i => (
                                                    <div key={i} className="w-2 h-2 rounded-full bg-zinc-800 border border-white/10 group-hover:border-blue-500/30 group-hover:bg-blue-500/20 transition-all duration-500" />
                                                ))}
                                            </div>
                                            <div className="h-[2px] w-12 bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-500/40 w-0 group-hover:w-full transition-all duration-1000 delay-300" />
                                            </div>
                                        </div>

                                        <div className="ml-auto opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
                                            <div className="p-2 rounded-full bg-blue-500/10 border border-blue-500/20">
                                                <ArrowRight size={14} className="text-blue-400" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Global Style for animations */}
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @keyframes scan {
                        0% { top: -10%; }
                        100% { top: 110%; }
                    }
                    @keyframes pulse-height {
                        0% { height: 20%; }
                        100% { height: 100%; }
                    }
                `}} />
            </div>
        );
    }

    // Control View (Conteúdo Atual)
    const activeAgent = MOCK_AGENTS.find(a => a.id === selectedAgent);

    return (
        <div className="dashboard-page h-[calc(100vh-4rem)] overflow-hidden flex flex-col p-6 lg:p-12 bg-[#050505]">
            <div className="max-w-5xl mx-auto w-full flex-grow flex flex-col justify-start -mt-5 z-10 min-h-0">

                {/* Header - Back Button Added */}
                <header className="mb-6 flex items-center gap-6 text-left">
                    <button
                        onClick={() => setSelectedAgent(null)}
                        className="p-2 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all text-zinc-500 hover:text-white"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tighter bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent">
                            {activeAgent?.name || 'AGENT PANEL'}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Instance:</span>
                            <span className="text-[10px] font-bold text-blue-400/80 uppercase tracking-widest">{selectedAgent}</span>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        {/* Status Card */}
                        <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 group">
                            <div className="flex items-center gap-2 mb-2 text-zinc-500">
                                <Zap size={14} />
                                <span className="text-[11px] font-medium uppercase tracking-wider">Neural Engine Status</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className={`h-2.5 w-2.5 rounded-full ${agentStatus?.agent_status === 'active' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : agentStatus?.agent_status === 'paused' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                                <span className="text-xl font-bold text-white uppercase tracking-tight">
                                    {agentStatus?.agent_status || 'OFFLINE'}
                                </span>
                            </div>
                        </div>

                        {/* Model Selector Card */}
                        <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 group">
                            <div className="flex items-center gap-2 mb-2 text-zinc-500">
                                <Cpu size={14} />
                                <span className="text-[11px] font-medium uppercase tracking-wider">Active Intelligence Model</span>
                            </div>
                            <select
                                value={selectedModel}
                                onChange={(e) => handleUpdateModel(e.target.value)}
                                className="w-full bg-transparent border-0 outline-none focus:ring-0 text-xl font-bold text-white appearance-none cursor-pointer"
                            >
                                <option value="gpt-4o" className="bg-[#111]">GPT-4o</option>
                                <option value="gpt-4-turbo" className="bg-[#111]">GPT-4 Turbo</option>
                                <option value="gemini-1.5-pro" className="bg-[#111]">Gemini 1.5 Pro</option>
                                <option value="claude-3-opus" className="bg-[#111]">Claude 3 Opus</option>
                            </select>
                        </div>

                        {/* Control Panel Card */}
                        <div className="md:col-span-2 bg-white/[0.03] border border-white/5 rounded-3xl p-6">
                            <div className="text-[11px] font-medium text-zinc-500 mb-6 uppercase tracking-widest">Master Control Interface</div>
                            <div className="flex justify-center">
                                <button
                                    onClick={() => handleAgentControl(agentStatus?.agent_status === 'active' ? 'stop' : 'start')}
                                    className={`w-full max-w-md flex flex-col items-center justify-center py-6 rounded-2xl bg-white/5 border border-white/5 transition-all group ${agentStatus?.agent_status === 'active'
                                        ? 'hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400'
                                        : 'hover:bg-green-500/10 hover:border-green-500/30 hover:text-green-400'
                                        }`}
                                >
                                    {agentStatus?.agent_status === 'active' ? (
                                        <>
                                            <Square className="h-6 w-6 mb-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Terminate</span>
                                        </>
                                    ) : (
                                        <>
                                            <Play className="h-6 w-6 mb-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Engage</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Authorized Access Card */}
                        <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 flex flex-col h-[320px]">
                            <div className="flex items-center gap-2 mb-4 text-zinc-500">
                                <Mail size={14} />
                                <span className="text-[11px] font-medium uppercase tracking-wider">Access Management</span>
                            </div>

                            <div className="flex-1 overflow-y-auto mb-4 space-y-2 custom-scrollbar pr-1">
                                {connectionEmails.map((email) => (
                                    <div key={email} className="flex justify-between items-center p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/[0.08] transition-colors">
                                        <span className="text-xs font-medium text-zinc-300 truncate">{email}</span>
                                        <button onClick={() => handleRemoveEmail(email)} className="text-zinc-600 hover:text-red-400 transition-colors">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    placeholder="Enter authorization email..."
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    className="flex-1 bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-white/20 transition-all"
                                />
                                <button
                                    onClick={handleAddEmail}
                                    className="p-2 bg-white/5 border border-white/5 hover:bg-white/10 rounded-xl transition-all text-white"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Manual Vector Trigger Card */}
                        <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 h-[320px]">
                            <div className="flex items-center gap-2 mb-6 text-zinc-500">
                                <Settings size={14} />
                                <span className="text-[11px] font-medium uppercase tracking-wider">Manual Task Initiation</span>
                            </div>

                            <form onSubmit={handleTriggerTask} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-medium text-zinc-500 uppercase tracking-widest mb-1.5 px-0.5">Source Filename</label>
                                    <input
                                        type="text"
                                        placeholder="leads_data.xlsx"
                                        value={taskData.filename}
                                        onChange={(e) => setTaskData({ ...taskData, filename: e.target.value })}
                                        className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/30 transition-all"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-medium text-zinc-500 uppercase tracking-widest mb-1.5 px-0.5">Target Vector</label>
                                    <input
                                        type="text"
                                        placeholder="+351912..."
                                        value={taskData.phone}
                                        onChange={(e) => setTaskData({ ...taskData, phone: e.target.value })}
                                        className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/30 transition-all"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full py-4 mt-2 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-blue-500/10 hover:border-blue-500/50 hover:text-blue-400 transition-all flex items-center justify-center gap-3 text-[11px] tracking-[0.2em] group"
                                >
                                    <span>RUN MATCHING CYCLE</span>
                                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </form>
                        </div>

                    </div>
                </div>

                {message && (
                    <div className={`mt-6 text-center text-[11px] font-bold uppercase tracking-widest ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                        {message.text}
                    </div>
                )}
            </div>
        </div>
    );
};
