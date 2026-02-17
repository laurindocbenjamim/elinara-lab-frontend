import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { configService, processesService } from '../services/api';
import { Process } from '../types';
import { Save, ArrowLeft, Clock, Mail, Calendar, Plus, X, Loader2, Check, Info, Cpu } from 'lucide-react';

export const AgentSettingsPage: React.FC = () => {
    const { processId } = useParams<{ processId: string }>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [currentProcess, setCurrentProcess] = useState<Process | null>(null);

    // Form State
    const [executionMode, setExecutionMode] = useState<'manual' | 'scheduled' | 'interval'>('manual');
    const [executionInterval, setExecutionInterval] = useState<number>(60);
    const [scheduledTime, setScheduledTime] = useState<string>('08:00');
    const [alertEmails, setAlertEmails] = useState<string[]>([]);
    const [newEmail, setNewEmail] = useState('');
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
                llm_model: llmModel
            });

            setMessage({ type: 'success', text: 'Settings saved successfully!' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to save settings.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="h-10 w-10 text-primary-600 animate-spin mb-4" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">Loading settings...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(`/agent/${processId}`)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <ArrowLeft className="h-6 w-6 text-gray-500" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                            Agent Settings
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">
                            {currentProcess?.name || 'Configure your agent behavior'}
                        </p>
                    </div>
                </div>
            </div>

            {message && (
                <div className={`mb-6 p-4 rounded-2xl border ${message.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'} flex items-center justify-between animate-in fade-in slide-in-from-top-2`}>
                    <div className="flex items-center gap-3">
                        {message.type === 'success' ? <Check className="h-5 w-5" /> : <Info className="h-5 w-5" />}
                        <p className="text-sm font-bold">{message.text}</p>
                    </div>
                    <button onClick={() => setMessage(null)}><X className="h-4 w-4" /></button>
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-8">
                {/* Execution Mode Section */}
                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20">
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Clock className="h-4 w-4" /> Execution Schedule
                        </h3>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {(['manual', 'scheduled', 'interval'] as const).map((mode) => (
                                <button
                                    key={mode}
                                    type="button"
                                    onClick={() => setExecutionMode(mode)}
                                    className={`p-4 rounded-2xl border-2 text-left transition-all ${executionMode === mode
                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
                                        : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
                                        }`}
                                >
                                    <div className={`text-xs font-black uppercase tracking-widest mb-1 ${executionMode === mode ? 'text-primary-600' : 'text-gray-400'}`}>
                                        {mode}
                                    </div>
                                    <div className="text-sm font-bold capitalize">
                                        {mode === 'manual' ? 'Run on demand' : mode === 'scheduled' ? 'Daily at time' : 'Regular intervals'}
                                    </div>
                                </button>
                            ))}
                        </div>

                        {executionMode === 'interval' && (
                            <div className="animate-in fade-in slide-in-from-left duration-300">
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Interval (minutes)</label>
                                <input
                                    type="number"
                                    value={executionInterval}
                                    onChange={(e) => setExecutionInterval(parseInt(e.target.value))}
                                    className="block w-full px-4 py-3 rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 focus:ring-primary-500 focus:border-primary-500 text-sm font-medium dark:text-white border"
                                    min="1"
                                />
                            </div>
                        )}

                        {executionMode === 'scheduled' && (
                            <div className="animate-in fade-in slide-in-from-left duration-300">
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Daily Execution Time</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-3.5 h-4 w-4 text-gray-400" />
                                    <input
                                        type="time"
                                        value={scheduledTime}
                                        onChange={(e) => setScheduledTime(e.target.value)}
                                        className="block w-full pl-11 pr-4 py-3 rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 focus:ring-primary-500 focus:border-primary-500 text-sm font-medium dark:text-white border"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* AI Configuration Section */}
                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20">
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Cpu className="h-4 w-4" /> AI Configuration
                        </h3>
                    </div>
                    <div className="p-6">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Model (Fixed)</label>
                        <div className="relative">
                            <Cpu className="absolute left-4 top-3.5 h-4 w-4 text-primary-500" />
                            <input
                                type="text"
                                value={llmModel}
                                readOnly
                                className="block w-full pl-11 pr-4 py-3 rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20 text-sm font-black dark:text-gray-300 border cursor-not-allowed opacity-80"
                            />
                        </div>
                        <p className="mt-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Selected model is locked by system administrator.</p>
                    </div>
                </div>

                {/* Alert Emails Section */}
                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20">
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Mail className="h-4 w-4" /> Notification Emails
                        </h3>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="flex flex-wrap gap-2">
                            {alertEmails.map((email) => (
                                <div key={email} className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 rounded-xl">
                                    <span className="text-xs font-bold text-primary-700 dark:text-primary-300">{email}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveEmail(email)}
                                        className="p-1 hover:bg-primary-100 dark:hover:bg-primary-800 rounded-full transition-colors"
                                    >
                                        <X className="h-3 w-3 text-primary-500" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Mail className="absolute left-4 top-3.5 h-4 w-4 text-gray-400" />
                                <input
                                    type="email"
                                    placeholder="Add email address..."
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddEmail())}
                                    className="block w-full pl-11 pr-4 py-3 rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 focus:ring-primary-500 focus:border-primary-500 text-sm font-medium dark:text-white border"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleAddEmail}
                                className="px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl font-bold text-sm transition-all flex items-center gap-2"
                            >
                                <Plus className="h-4 w-4" /> Add
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <button
                        type="button"
                        onClick={() => navigate(`/agent/${processId}`)}
                        className="px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-10 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-primary-500/30 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save Settings
                    </button>
                </div>
            </form>
        </div>
    );
};
