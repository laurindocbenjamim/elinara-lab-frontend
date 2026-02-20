import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { configService, processesService } from '../services/api';
import { Process } from '../types';
import { Save, ArrowLeft, Clock, Mail, Calendar, X, Loader2, Check, Info, Cpu, Edit3, Shield, Zap, Sparkles } from 'lucide-react';

const PROVIDERS = [
    { id: 'Gemini', name: 'Google Gemini', models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash-exp'] },
    { id: 'OpenAI', name: 'OpenAI ChatGPT', models: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
    { id: 'DeepSeek', name: 'DeepSeek AI', models: ['deepseek-chat', 'deepseek-coder'] },
    { id: 'Qwen', name: 'Alibaba Qwen', models: ['qwen-max', 'qwen-plus', 'qwen-turbo'] },
    { id: 'Kimi', name: 'Moonshot Kimi', models: ['moonshot-v1-8k', 'moonshot-v1-32k'] },
    { id: 'Anthropic', name: 'Anthropic Claude', models: ['claude-3-5-sonnet', 'claude-3-opus', 'claude-3-haiku'] },
    { id: 'Grok', name: 'xAI Grok', models: ['grok-1', 'grok-beta'] },
    { id: 'Cloud', name: 'Cloud Provider', models: ['base-model', 'instruct-model'] }
];

export const AgentSettingsPage: React.FC = () => {
    const { processId } = useParams<{ processId: string }>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditable, setIsEditable] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [currentProcess, setCurrentProcess] = useState<Process | null>(null);

    // Form State
    const [executionMode, setExecutionMode] = useState<'manual' | 'scheduled' | 'interval'>('manual');
    const [executionInterval, setExecutionInterval] = useState<number>(60);
    const [scheduledTime, setScheduledTime] = useState<string>('08:00');
    const [alertEmails, setAlertEmails] = useState<string[]>([]);
    const [newEmail, setNewEmail] = useState('');
    const [llmProvider, setLlmProvider] = useState('Gemini');
    const [llmModel, setLlmModel] = useState('gemini-1.5-pro');


    useEffect(() => {
        if (processId) {
            fetchData();
        }
    }, [processId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [settings, process] = await Promise.all([
                configService.get(processId),
                processesService.get(parseInt(processId!))
            ]);

            setCurrentProcess(process);
            setAlertEmails(settings.alert_emails || []);
            setExecutionMode(settings.execution_mode || 'manual');
            setExecutionInterval(settings.execution_interval || 60);
            setScheduledTime(settings.scheduled_time || '08:00');
            setLlmProvider(settings.llm_provider || 'Gemini');
            setLlmModel(settings.llm_model || 'gemini-1.5-pro');

        } catch (err: any) {
            console.error('Failed to fetch settings data', err);
            setMessage({ type: 'error', text: 'Failed to load settings.' });
        } finally {
            setLoading(false);
        }
    };

    const handleAddEmail = () => {
        if (newEmail && !alertEmails.includes(newEmail)) {
            setAlertEmails([...alertEmails, newEmail]);
            setNewEmail('');
        }
    };

    const handleRemoveEmail = (email: string) => {
        setAlertEmails(alertEmails.filter(e => e !== email));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);
        try {
            await configService.update(processId!, {
                alert_emails: alertEmails,
                execution_mode: executionMode,
                execution_interval: executionMode === 'interval' ? executionInterval : undefined,
                scheduled_time: executionMode === 'scheduled' ? scheduledTime : undefined,
                llm_provider: llmProvider,
                llm_model: llmModel
            });

            setMessage({ type: 'success', text: 'Settings saved and synchronized successfully!' });
            setIsEditable(false);
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to save settings.' });
        } finally {
            setSaving(false);
        }
    };

    const currentProviderModels = PROVIDERS.find(p => p.id === llmProvider)?.models || [];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="relative">
                    <div className="h-16 w-16 rounded-full border-4 border-primary-100 border-t-primary-600 animate-spin"></div>
                    <Cpu className="h-6 w-6 text-primary-600 absolute inset-0 m-auto animate-pulse" />
                </div>
                <p className="mt-4 text-gray-500 font-black uppercase tracking-widest text-xs">Decrypting configurations...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-8">
            {/* Header with Modern Look */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-gray-900 to-black p-8 rounded-[2.5rem] border border-gray-800 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-primary-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex items-center gap-6 relative z-10">
                    <button
                        onClick={() => navigate(`/agent/${processId}`)}
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10 text-white"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Shield className="h-3 w-3 text-primary-500" />
                            <span className="text-[10px] font-black text-primary-500 uppercase tracking-[0.3em]">Agent Security Console</span>
                        </div>
                        <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">
                            {currentProcess?.name || 'Settings'}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-3 relative z-10">
                    <button
                        onClick={() => setIsEditable(!isEditable)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${isEditable
                            ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                            : 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'}`}
                    >
                        {isEditable ? <X className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                        {isEditable ? 'Lock UI' : 'Unlock Settings'}
                    </button>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-2xl border ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'} flex items-center justify-between animate-in fade-in slide-in-from-top-2`}>
                    <div className="flex items-center gap-3">
                        {message.type === 'success' ? <Check className="h-5 w-5" /> : <Info className="h-5 w-5" />}
                        <p className="text-sm font-bold">{message.text}</p>
                    </div>
                    <button onClick={() => setMessage(null)}><X className="h-4 w-4" /></button>
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-8">
                {/* Execution Schedule Card */}
                <div className="bg-white dark:bg-[#0A0A0A] shadow-xl rounded-[2.5rem] border border-gray-100 dark:border-gray-800 overflow-hidden group/card transition-all hover:border-primary-500/20">
                    <div className="p-8 border-b border-gray-50 dark:border-gray-800 flex items-center gap-4 bg-gray-50/50 dark:bg-white/[0.02]">
                        <div className="h-12 w-12 rounded-2xl bg-primary-600/10 flex items-center justify-center border border-primary-600/20">
                            <Clock className="h-6 w-6 text-primary-600" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest leading-none">Execution Schedule</h3>
                            <p className="text-[10px] font-bold text-gray-500 uppercase mt-1">Configure automated task triggering</p>
                        </div>
                    </div>
                    <div className="p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {(['manual', 'scheduled', 'interval'] as const).map((mode) => (
                                <button
                                    key={mode}
                                    type="button"
                                    disabled={!isEditable}
                                    onClick={() => setExecutionMode(mode)}
                                    className={`p-6 rounded-3xl border-2 text-left transition-all relative overflow-hidden group ${executionMode === mode
                                        ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/10'
                                        : 'border-gray-50 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
                                        } ${!isEditable ? 'opacity-60 cursor-not-allowed' : ''}`}
                                >
                                    {executionMode === mode && (
                                        <div className="absolute -right-2 -top-2 h-8 w-8 bg-primary-500 rounded-full flex items-center justify-center text-white scale-75">
                                            <Check className="h-4 w-4" />
                                        </div>
                                    )}
                                    <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${executionMode === mode ? 'text-primary-600' : 'text-gray-400'}`}>
                                        {mode}
                                    </div>
                                    <div className="text-sm font-black dark:text-white capitalize">
                                        {mode === 'manual' ? 'Run on demand' : mode === 'scheduled' ? 'Daily at time' : 'Regular intervals'}
                                    </div>
                                </button>
                            ))}
                        </div>

                        {(executionMode === 'interval' || executionMode === 'scheduled') && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-gray-50 dark:bg-black/40 rounded-[2rem] border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-300">
                                {executionMode === 'interval' && (
                                    <div className="space-y-3">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <Zap className="h-3 w-3" /> Interval (minutes)
                                        </label>
                                        <input
                                            type="number"
                                            disabled={!isEditable}
                                            value={executionInterval}
                                            onChange={(e) => setExecutionInterval(parseInt(e.target.value))}
                                            className="block w-full px-5 py-4 rounded-2xl border-gray-200 dark:border-gray-800 bg-white dark:bg-black/50 focus:ring-2 focus:ring-primary-500 outline-none text-sm font-bold dark:text-white border transition-all"
                                            min="1"
                                        />
                                    </div>
                                )}

                                {executionMode === 'scheduled' && (
                                    <div className="space-y-3">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <Calendar className="h-3 w-3" /> Daily Execution Time
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="time"
                                                disabled={!isEditable}
                                                value={scheduledTime}
                                                onChange={(e) => setScheduledTime(e.target.value)}
                                                className="block w-full px-5 py-4 rounded-2xl border-gray-200 dark:border-gray-800 bg-white dark:bg-black/50 focus:ring-2 focus:ring-primary-500 outline-none text-sm font-bold dark:text-white border transition-all"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* AI Configuration Card */}
                <div className="bg-white dark:bg-[#0A0A0A] shadow-xl rounded-[2.5rem] border border-gray-100 dark:border-gray-800 overflow-hidden transition-all hover:border-primary-500/20">
                    <div className="p-8 border-b border-gray-50 dark:border-gray-800 flex items-center gap-4 bg-gray-50/50 dark:bg-white/[0.02]">
                        <div className="h-12 w-12 rounded-2xl bg-purple-600/10 flex items-center justify-center border border-purple-600/20">
                            <Sparkles className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest leading-none">Brain Configuration</h3>
                            <p className="text-[10px] font-bold text-gray-500 uppercase mt-1">Select LLM provider and specific model</p>
                        </div>
                    </div>
                    <div className="p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">LLM Provider</label>
                                <div className="relative group">
                                    <Cpu className="absolute left-5 top-5 h-4 w-4 text-primary-500 group-focus-within:animate-pulse" />
                                    <select
                                        disabled={!isEditable}
                                        value={llmProvider}
                                        onChange={(e) => {
                                            const newProvider = e.target.value;
                                            setLlmProvider(newProvider);
                                            // Auto-select first model of new provider
                                            const firstModel = PROVIDERS.find(p => p.id === newProvider)?.models[0];
                                            if (firstModel) setLlmModel(firstModel);
                                        }}
                                        className="block w-full pl-14 pr-5 py-4 rounded-2xl border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-black focus:ring-2 focus:ring-primary-500 outline-none text-sm font-black dark:text-white border transition-all"
                                    >
                                        {PROVIDERS.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Model Version</label>
                                <div className="relative group">
                                    <Zap className="absolute left-5 top-5 h-4 w-4 text-purple-500" />
                                    <select
                                        disabled={!isEditable}
                                        value={llmModel}
                                        onChange={(e) => setLlmModel(e.target.value)}
                                        className="block w-full pl-14 pr-5 py-4 rounded-2xl border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-black focus:ring-2 focus:ring-primary-500 outline-none text-sm font-black dark:text-white border transition-all"
                                    >
                                        {currentProviderModels.map(model => (
                                            <option key={model} value={model}>{model.toUpperCase()}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <p className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${isEditable ? 'text-primary-600' : 'text-gray-500'}`}>
                            {isEditable ? <Info className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                            {isEditable ? 'Settings are currently unlocked for modifications.' : 'Unlock the form to change high-performance model settings.'}
                        </p>
                    </div>
                </div>


                {/* Notifications Card */}
                <div className="bg-white dark:bg-[#0A0A0A] shadow-xl rounded-[2.5rem] border border-gray-100 dark:border-gray-800 overflow-hidden transition-all hover:border-primary-500/20">
                    <div className="p-8 border-b border-gray-50 dark:border-gray-800 flex items-center gap-4 bg-gray-50/50 dark:bg-white/[0.02]">
                        <div className="h-12 w-12 rounded-2xl bg-orange-600/10 flex items-center justify-center border border-orange-600/20">
                            <Mail className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest leading-none">Monitoring Alerts</h3>
                            <p className="text-[10px] font-bold text-gray-500 uppercase mt-1">Manage system status recipients</p>
                        </div>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="flex flex-wrap gap-3">
                            {alertEmails.map((email) => (
                                <div key={email} className="flex items-center gap-3 px-4 py-2 bg-gray-100 dark:bg-black/50 border border-gray-200 dark:border-gray-800 rounded-2xl group/tag hover:border-primary-500/30 transition-all">
                                    <span className="text-xs font-black dark:text-white uppercase tracking-tighter">{email}</span>
                                    {isEditable && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveEmail(email)}
                                            className="p-1 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {isEditable && (
                            <div className="flex gap-3 animate-in fade-in duration-500">
                                <div className="relative flex-1 group">
                                    <Mail className="absolute left-5 top-5 h-4 w-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                                    <input
                                        type="email"
                                        placeholder="Enter email address..."
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddEmail())}
                                        className="block w-full pl-14 pr-5 py-4 rounded-[1.5rem] border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black focus:ring-2 focus:ring-primary-500 outline-none text-sm font-bold dark:text-white border transition-all"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddEmail}
                                    className="px-8 bg-gray-900 dark:bg-white rounded-2xl font-black text-white dark:text-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all active:scale-95 shadow-lg"
                                >
                                    Register
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex justify-end gap-6 pt-12">
                    <button
                        type="button"
                        onClick={() => navigate(`/agent/${processId}`)}
                        className="px-10 py-5 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all"
                    >
                        Discard Changes
                    </button>
                    {isEditable && (
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-12 py-5 bg-primary-600 hover:bg-primary-700 text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-2xl shadow-primary-600/40 flex items-center justify-center gap-3 disabled:opacity-50 hover:scale-105 active:scale-95"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Save className="h-4 w-4 text-white" />}
                            Synchronize Settings
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};
