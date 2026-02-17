import React, { useEffect, useState, useCallback } from 'react';
import {
    Settings,
    Play,
    Square,
    Loader2,
    Info,
    Database,
    X,
    Check,
    Edit,
    Trash2,
    PlusCircle,
    Zap,
    Cpu,
    Mail,
    Shuffle,
    Send,
    Terminal,
    Clock,
    Activity,
    Plus,
    Trash,
    ListTodo,
    Link as LinkIcon
} from 'lucide-react';
import { agentService, processesService, dataSourcesService, configService } from '../services/api';
import { AgentStatus, Process, DataSource, DataSourceCreateRequest } from '../types';
import { useAuth } from '../context/AuthContext';
import { useParams, useLocation, Link } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';


export const Agent: React.FC = () => {
    const { processId } = useParams<{ processId: string }>();
    const location = useLocation();
    const { user } = useAuth();
    const { socket, isConnected } = useSocket();

    // UI State
    const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
    const [currentProcess, setCurrentProcess] = useState<Process | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [llmModel, setLlmModel] = useState('gemini-1.5-pro');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [showProcessDetails, setShowProcessDetails] = useState(false);

    // Data Sources State
    const [dataSources, setDataSources] = useState<DataSource[]>([]);
    const [showDataSourceModal, setShowDataSourceModal] = useState(false);
    const [selectedSources, setSelectedSources] = useState<string[]>([]);
    const [isSavingDataSource, setIsLoadingSavingDataSource] = useState(false);
    const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
    const [formDataGroups, setFormDataGroups] = useState<DataSourceCreateRequest[]>([
        { platform: 'google_drive', resource_identifier: '', resource_name: '', resource_format: '', config: [] }
    ]);
    const [showConfig, setShowConfig] = useState<boolean[]>([false]);
    const [showName, setShowName] = useState<boolean[]>([false]);

    // Real-time Pipeline State (Updated to MONITORING_API.md spec)
    const INITIAL_JOB_PROGRESS = {
        establish_connection: { current: 0, total: 1, percentage: 0, status: 'pending' },
        loading_data: { current: 0, total: 1, percentage: 0, status: 'pending' },
        sending_email: { current: 0, total: 1, percentage: 0, status: 'pending' },
        cross_data: { current: 0, total: 1, percentage: 0, status: 'pending' },
        send_results: { current: 0, total: 1, percentage: 0, status: 'pending' },
        email_alert: { current: 0, total: 1, percentage: 0, status: 'pending' }
    };

    const [jobProgress, setJobProgress] = useState<Record<string, { current: number, total: number, percentage: number, status: string }>>(INITIAL_JOB_PROGRESS);

    const [events, setEvents] = useState<Array<{ id: number, time: string, name: string, source: string, status: string }>>([
        { id: 1, time: new Date().toLocaleTimeString(), name: 'System Initialized', source: 'Orchestrator', status: 'success' }
    ]);

    // Reset progress when agent changes
    useEffect(() => {
        setJobProgress(INITIAL_JOB_PROGRESS);
        setEvents([{ id: Date.now(), time: new Date().toLocaleTimeString(), name: 'Agent Context Switched', source: 'Orchestrator', status: 'success' }]);
    }, [processId]);

    const DEFAULT_CONFIG = [
        {
            "name": "",
            "query_url": "",
            "download_url": "",
            "payload": {
                "estadoAvisoId": 0,
                "page": 0
            }
        }
    ];

    const fetchDataSources = useCallback(async (pid: string) => {
        try {
            const data = await dataSourcesService.list(pid);
            setDataSources(data || []);
        } catch (err) {
            console.error('Failed to fetch data sources', err);
        }
    }, []);

    const fetchAgentData = useCallback(async () => {
        setIsLoading(true);
        try {
            const promises: Promise<any>[] = [
                agentService.getStatus(),
                processesService.list(),
                processId ? processesService.get(parseInt(processId)) : Promise.resolve(null),
                configService.get()
            ];

            const [agentStatus, , process, configSettings] = await Promise.all(promises);

            setAgentStatus(agentStatus);
            // Prioritize llm_model from unified config, fallback to gemini-1.5-pro
            setLlmModel(configSettings?.llm_model || agentStatus?.selected_model || 'gemini-1.5-pro');

            if (processId && process) {
                setCurrentProcess(process);
                fetchDataSources(processId);

                // Handle auto-opening from navigation state
                if (location.state?.autoOpenDataSource && (location.state?.fileInfo || location.state?.filesInfo)) {
                    console.log("Auto-opening data source modal with files:", location.state.filesInfo || location.state.fileInfo);
                    const filesInfo = location.state.filesInfo || [location.state.fileInfo];

                    // Clear state immediately to prevent re-triggering on accidental re-renders, 
                    // but we do it before setting state to be safe if we want, or after.
                    // Doing it after setFormDataGroups is safer to ensure it's used.

                    const newGroups = filesInfo.map((file: any) => ({
                        platform: (file.provider === 'google' || file.provider === 'google_drive') ? 'google_drive' : 'sharepoint',
                        resource_identifier: file.id,
                        resource_name: file.name,
                        resource_format: file.type || 'unknown',
                        config: []
                    }));

                    if (newGroups.length > 0) {
                        setFormDataGroups(newGroups);
                        setShowConfig(new Array(newGroups.length).fill(false));
                        setShowName(new Array(newGroups.length).fill(true));
                        setShowDataSourceModal(true);
                    }

                    // Clear history state to avoid loops
                    window.history.replaceState({}, document.title);
                }
            } else {
                setCurrentProcess(null);
                setDataSources([]);
            }
        } catch (err) {
            console.error('Failed to fetch agent data', err);
        } finally {
            setIsLoading(false);
        }
    }, [processId, location.state, fetchDataSources]);

    useEffect(() => {
        fetchAgentData();
    }, [fetchAgentData]);

    // Socket.io Integration
    useEffect(() => {
        if (!socket || !isConnected || !user || !processId) return;

        // Join specific agent room for granular tracking
        const agentRoom = `agent_${processId}`;
        console.log(`Joining room: ${agentRoom}`);
        socket.emit('join', { room: agentRoom });

        const handleAgentStatus = (data: any) => {
            if (String(data.agent_id) === String(processId)) {
                setAgentStatus(prev => prev ? { ...prev, agent_status: data.status } : null);
            }
        };

        const handlePipelineUpdate = (data: any) => {
            // Strict filtering by process_id
            const isTargetProcess = String(data.process_id) === String(processId);

            if (isTargetProcess && data.pipeline) {
                console.log(`Pipeline Update for Agent ${data.process_id}:`, data.pipeline);
                setJobProgress(data.pipeline);

                // Find the latest active/completed stage to log as an event
                const stages = Object.entries(data.pipeline);
                const activeStage = [...stages].reverse().find(([_, info]: [any, any]) => info.status === 'tracking' || info.status === 'completed');

                if (activeStage) {
                    const [key, info]: [string, any] = activeStage;
                    setEvents(prev => {
                        // Avoid duplicates for the same stage/status
                        if (prev.length > 0 && prev[0].name === `Stage: ${key}` && prev[0].status === info.status) {
                            return prev;
                        }
                        return [{
                            id: Date.now(),
                            time: new Date().toLocaleTimeString(),
                            name: `Stage: ${key}`,
                            source: 'Agent Pipeline',
                            status: info.status === 'error' ? 'error' : 'success'
                        }, ...prev].slice(0, 20);
                    });
                }
            }
        };

        socket.on('agent_status', handleAgentStatus);
        socket.on('pipeline_update', handlePipelineUpdate);

        return () => {
            socket.off('agent_status', handleAgentStatus);
            socket.off('pipeline_update', handlePipelineUpdate);
            socket.emit('leave', { room: agentRoom });
        };
    }, [socket, isConnected, user, processId]);

    const handleResetFormData = () => {
        setFormDataGroups([
            { platform: 'google_drive', resource_identifier: '', resource_name: '', resource_format: '', config: [] }
        ]);
        setShowConfig([false]);
        setShowName([false]);
        setEditingSourceId(null);
    };

    const handleDataSourceFieldChange = (index: number, field: string, value: any) => {
        const updatedGroups = [...formDataGroups];
        if (field === 'config') {
            try {
                updatedGroups[index].config = JSON.parse(value);
            } catch (e) {
                (updatedGroups[index] as any).configRaw = value;
            }
        } else if (field === 'identifier') {
            updatedGroups[index].resource_identifier = value;
        } else {
            (updatedGroups[index] as any)[field === 'name' ? 'resource_name' : field === 'format' ? 'resource_format' : field] = value;
        }
        setFormDataGroups(updatedGroups);
    };

    const toggleName = (index: number) => {
        const updatedShow = [...showName];
        updatedShow[index] = !updatedShow[index];
        setShowName(updatedShow);
    };

    const toggleConfig = (index: number) => {
        const updatedShow = [...showConfig];
        updatedShow[index] = !updatedShow[index];
        setShowConfig(updatedShow);

        if (updatedShow[index] && formDataGroups[index].config.length === 0) {
            const updatedGroups = [...formDataGroups];
            updatedGroups[index].config = DEFAULT_CONFIG;
            setFormDataGroups(updatedGroups);
        }
    };

    const handleAddGroup = () => {
        setFormDataGroups([...formDataGroups, { platform: 'google_drive', resource_identifier: '', resource_name: '', resource_format: '', config: [] }]);
        setShowConfig([...showConfig, false]);
        setShowName([...showName, false]);
    };

    const handleRemoveGroup = (index: number) => {
        if (formDataGroups.length <= 1) return;
        setFormDataGroups(formDataGroups.filter((_, i) => i !== index));
        setShowConfig(showConfig.filter((_, i) => i !== index));
        setShowName(showName.filter((_, i) => i !== index));
    };

    const handleSaveDataSources = async () => {
        if (!processId) return;
        setIsLoadingSavingDataSource(true);
        try {
            const metadata = {
                user_id: currentProcess?.user_id || user?.id,
                agent_id: processId,
                agent_name: currentProcess?.name || 'Unknown Agent'
            };

            if (editingSourceId) {
                const updatePayload = {
                    ...metadata,
                    ...formDataGroups[0],
                    process_id: processId
                };
                await dataSourcesService.update(editingSourceId, updatePayload);
                setMessage({ type: 'success', text: 'Data source updated' });
            } else {
                const savePayloads = formDataGroups.map(group => ({
                    ...group,
                    ...metadata,
                    process_id: processId
                }));
                await dataSourcesService.create(savePayloads);
                setMessage({ type: 'success', text: 'Data sources added' });
            }
            fetchDataSources(processId);
            setShowDataSourceModal(false);
            handleResetFormData();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to save data source' });
        } finally {
            setIsLoadingSavingDataSource(false);
        }
    };

    const handleDeleteDataSource = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this data source?')) return;
        try {
            await dataSourcesService.delete(id);
            setDataSources(dataSources.filter((s) => s.id !== id));
            setMessage({ type: 'success', text: 'Data source deleted' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to delete data source' });
        }
    };

    const handleBulkDelete = async () => {
        if (selectedSources.length === 0 || !window.confirm(`Delete ${selectedSources.length} sources?`)) return;
        try {
            await dataSourcesService.deleteBulk(selectedSources);
            setDataSources(dataSources.filter((s) => !selectedSources.includes(s.id)));
            setSelectedSources([]);
            setMessage({ type: 'success', text: 'Data sources deleted' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to delete data sources' });
        }
    };

    const handleEditSource = (source: DataSource) => {
        setEditingSourceId(source.id);
        setFormDataGroups([{
            platform: source.platform,
            resource_identifier: source.resource_identifier,
            resource_name: source.resource_name,
            resource_format: source.resource_format,
            config: source.config || []
        }]);
        setShowConfig([!!(source.config && source.config.length > 0)]);
        setShowDataSourceModal(true);
    };

    const toggleSourceSelection = (id: string) => {
        setSelectedSources(prev => prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]);
    };

    const handleAgentControl = async (action: 'start' | 'stop' | 'pause') => {
        if (action === 'start' && dataSources.length < 2) {
            setMessage({ type: 'error', text: `Minimum 2 data sources required (current: ${dataSources.length}).` });
            return;
        }
        try {
            const res = await agentService.control({
                action,
                user_id: currentProcess?.user_id || user?.id,
                email: user?.email || undefined,
                agent_id: processId,
                execution_mode: 'manual'
            });
            setMessage({ type: 'success', text: res.msg });
            fetchAgentData();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to control agent' });
        }
    };

    // AI Model is locked by system

    // Sub-components for visualization
    const HealthBadge = ({ label, icon: Icon, active }: { label: string, icon: any, active: boolean }) => (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-black/40 border border-gray-800 rounded-lg">
            <div className={`h-2 w-2 rounded-full ${active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`}></div>
            <Icon className="h-3 w-3 text-gray-400" />
            <span className="text-[10px] font-black uppercase text-gray-300 tracking-tighter">{label}</span>
        </div>
    );

    const JobTracker = ({ label, icon: Icon, stageKey, color }: { label: string, icon: any, stageKey: string, color: 'blue' | 'cyan' | 'indigo' | 'orange' | 'purple' | 'green' }) => {
        const data = jobProgress[stageKey] || { current: 0, total: 1, percentage: 0, status: 'pending' };
        const { current, total, percentage, status } = data;

        const colorClasses = {
            blue: { text: 'text-blue-500', bg: 'bg-blue-500', border: 'border-blue-500/50', light: 'text-blue-400' },
            cyan: { text: 'text-cyan-500', bg: 'bg-cyan-500', border: 'border-cyan-500/50', light: 'text-cyan-400' },
            indigo: { text: 'text-indigo-500', bg: 'bg-indigo-500', border: 'border-indigo-500/50', light: 'text-indigo-400' },
            orange: { text: 'text-orange-500', bg: 'bg-orange-500', border: 'border-orange-500/50', light: 'text-orange-400' },
            purple: { text: 'text-purple-500', bg: 'bg-purple-500', border: 'border-purple-500/50', light: 'text-purple-400' },
            green: { text: 'text-green-500', bg: 'bg-green-500', border: 'border-green-500/50', light: 'text-green-400' },
        };

        const theme = colorClasses[color];

        return (
            <div className="group space-y-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-xl bg-gray-900 flex items-center justify-center border border-gray-800 ${status === 'tracking' ? `${theme.border} shadow-[0_0_10px_rgba(0,0,0,0.3)]` : ''} transition-all`}>
                            <Icon className={`h-4 w-4 ${status === 'completed' ? theme.text : status === 'tracking' ? `${theme.light} animate-pulse` : status === 'error' ? 'text-red-500' : 'text-gray-700'}`} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">{label}</p>
                            <p className="text-sm font-black text-white">{current} / {total} <span className="text-gray-600">Tasks</span></p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-black text-white">{percentage}%</p>
                        <p className={`text-[10px] font-bold uppercase ${status === 'completed' ? theme.text : status === 'tracking' ? theme.light : status === 'error' ? 'text-red-500' : 'text-gray-600'}`}>
                            {status}
                        </p>
                    </div>
                </div>
                <div className="h-1.5 w-full bg-gray-900 rounded-full overflow-hidden border border-gray-800/50">
                    <div
                        className={`h-full ${status === 'error' ? 'bg-red-500' : theme.bg} shadow-[0_0_12px_rgba(50,50,50,0.4)] transition-all duration-1000 ease-out`}
                        style={{ width: `${percentage}%` }}
                    ></div>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 dark:text-gray-100">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                            <Activity className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                                {currentProcess?.name || 'Agent Control'}
                            </h1>
                            <div className="flex items-center gap-3 mt-1">
                                <HealthBadge label="Database" icon={Database} active={true} />
                                <HealthBadge label="Scheduler" icon={Clock} active={true} />
                                <HealthBadge label="Triggerer" icon={Zap} active={true} />
                                <HealthBadge label="Processor" icon={Cpu} active={agentStatus?.agent_status === 'active'} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {currentProcess && (
                        <button
                            onClick={() => setShowProcessDetails(!showProcessDetails)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all shadow-sm"
                        >
                            <Info className="h-4 w-4 text-primary-500" />
                            {showProcessDetails ? 'Hide' : 'Details'}
                        </button>
                    )}
                    {processId && (
                        <Link to={`/agent/${processId}/settings`} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all shadow-sm">
                            <Settings className="h-3.5 w-3.5 text-gray-500" />
                            Config
                        </Link>
                    )}
                    <button onClick={() => { handleResetFormData(); setShowDataSourceModal(true); }} className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 rounded-xl text-xs font-bold text-white hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/30">
                        <PlusCircle className="h-3.5 w-3.5" />
                        Pipeline
                    </button>
                    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm ml-2">
                        <button
                            disabled={isLoading}
                            onClick={() => handleAgentControl(agentStatus?.agent_status === 'active' ? 'stop' : 'start')}
                            className={`flex items-center gap-1.5 py-1.5 px-4 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all shadow-md ${agentStatus?.agent_status === 'active' ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' : 'bg-green-500 hover:bg-green-600 shadow-green-500/20'} text-white disabled:opacity-50`}
                        >
                            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : (agentStatus?.agent_status === 'active' ? <Square className="h-3 w-3 fill-current" /> : <Play className="h-3 w-3 fill-current" />)}
                            {agentStatus?.agent_status === 'active' ? 'Stop' : 'Start'}
                        </button>
                    </div>
                </div>
            </div>

            {message && (
                <div className={`mb-8 p-4 rounded-2xl border ${message.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'} flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                        {message.type === 'success' ? <Check className="h-5 w-5" /> : <Info className="h-5 w-5" />}
                        <p className="text-sm font-bold">{message.text}</p>
                    </div>
                    <button onClick={() => setMessage(null)} className="p-1 hover:bg-black/5 rounded-full"><X className="h-4 w-4" /></button>
                </div>
            )}

            {currentProcess && showProcessDetails && (
                <div className="mb-8 bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="p-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Process ID</label>
                                <p className="text-sm font-mono font-bold text-gray-700 dark:text-gray-300">#{currentProcess.id}</p>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">User ID</label>
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{currentProcess.user_id}</p>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Trigger Type</label>
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300 capitalize">{currentProcess.trigger_type}</p>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</label>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${currentProcess.status === 'running' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'}`}>
                                    {currentProcess.status}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-10">
                {/* Main Dashboard Panel */}
                <div className="md:col-span-8 bg-black dark:bg-[#0A0A0A] shadow-2xl rounded-[2.5rem] border border-gray-800 overflow-hidden relative group">
                    <div className="p-8 space-y-8">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-[10px] font-black text-primary-500 uppercase tracking-[0.3em] mb-1">Live Execution Tracker</h3>
                                <p className="text-xl font-black text-white uppercase tracking-tighter">ELT Agent Pipeline</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-gray-500 uppercase">Model</p>
                                    <p className="text-sm font-black text-white uppercase tracking-tighter">
                                        {llmModel}
                                    </p>
                                </div>
                                <div className="h-10 w-px bg-gray-800"></div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-gray-500 uppercase">Socket</p>
                                    <p className={`text-sm font-black ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
                                        {isConnected ? 'ONLINE' : 'OFFLINE'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Expanded Pipeline Steps */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
                            <JobTracker label="Establish Connection" icon={LinkIcon} stageKey="establish_connection" color="blue" />
                            <JobTracker label="Loading Data" icon={Database} stageKey="loading_data" color="cyan" />
                            <JobTracker label="Discovery Report" icon={Mail} stageKey="email_alert" color="indigo" />
                            <JobTracker label="Cross Data" icon={Shuffle} stageKey="cross_data" color="orange" />
                            <JobTracker label="Save Results" icon={Send} stageKey="send_results" color="purple" />
                            <JobTracker label="Final Alert" icon={Zap} stageKey="sending_email" color="green" />
                        </div>
                    </div>

                    <div className="px-8 py-4 bg-white/5 border-t border-gray-800/50 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-500">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1.5 text-xs">
                                <Activity className={`h-3 w-3 ${agentStatus?.agent_status === 'active' ? 'text-green-500 animate-spin-slow' : 'text-gray-600'}`} />
                                {agentStatus?.agent_status === 'active' ? 'Agent Pipeline Active' : 'Orchestrator Standby'}
                            </span>
                        </div>
                        <span className="text-gray-600 font-mono">Build v2.4.0-stable</span>
                    </div>
                </div>

                {/* Event Sidebar */}
                <div className="md:col-span-4 bg-white dark:bg-gray-800 shadow-sm rounded-[2rem] border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Terminal className="h-4 w-4" /> Agent Events
                        </h3>
                        <span className={`text-[10px] font-bold ${isConnected ? 'text-green-500 bg-green-50' : 'text-gray-400 bg-gray-100'} dark:bg-gray-700 px-2 py-0.5 rounded-full`}>Live</span>
                    </div>
                    <div className="p-4 space-y-4 overflow-y-auto max-h-[440px] scrollbar-thin">
                        {events.map(event => (
                            <div key={event.id} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700 group hover:border-primary-500/30 transition-all">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[9px] font-mono text-gray-400">{event.time}</span>
                                    <div className={`h-1.5 w-1.5 rounded-full ${event.status === 'success' ? 'bg-green-500' : event.status === 'error' ? 'bg-red-500' : 'bg-blue-500 animate-pulse'}`}></div>
                                </div>
                                <p className="text-xs font-black text-gray-900 dark:text-white truncate mb-1 uppercase tracking-tight">{event.name}</p>
                                <p className="text-[10px] font-medium text-gray-500 truncate">Source: {event.source}</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-auto p-4 bg-gray-50 dark:bg-gray-900/40 border-t border-gray-100 dark:border-gray-700 text-center">
                        <Link to="/agent-tasks" className="text-[10px] font-black uppercase text-primary-600 hover:text-primary-700 tracking-widest flex items-center justify-center gap-2">
                            Full Log History <ListTodo className="h-3 w-3" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Data Sources Table */}
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center">
                        <Database className="h-4 w-4 mr-2 text-primary-500" />
                        Data Sources ({dataSources.length})
                    </h3>
                    {selectedSources.length > 0 && (
                        <button onClick={handleBulkDelete} className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-[10px] font-black uppercase hover:bg-red-100 transition-colors">
                            <Trash className="h-3.5 w-3.5" />
                            Delete ({selectedSources.length})
                        </button>
                    )}
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-50 dark:divide-gray-700">
                        <thead className="bg-gray-50/50 dark:bg-gray-900/30">
                            <tr>
                                <th className="px-6 py-4 text-left w-10">
                                    <input type="checkbox" className="rounded border-gray-300 text-primary-600" onChange={(e) => setSelectedSources(e.target.checked ? dataSources.map(s => s.id) : [])} checked={selectedSources.length === dataSources.length && dataSources.length > 0} />
                                </th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Platform</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Internal Name</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {dataSources.map((source) => (
                                <tr key={source.id} className={`${selectedSources.includes(source.id) ? 'bg-primary-50/30' : ''} hover:bg-gray-50/50 transition-colors`}>
                                    <td className="px-6 py-4"><input type="checkbox" className="rounded border-gray-300 text-primary-600" checked={selectedSources.includes(source.id)} onChange={() => toggleSourceSelection(source.id)} /></td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase ${source.platform === 'external_api' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                            {source.platform.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold truncate max-w-xs">{source.resource_name || 'Unnamed Resource'}</span>
                                            <span className="text-[10px] text-gray-400 font-mono truncate max-w-[200px]">{source.resource_identifier}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button onClick={() => handleEditSource(source)} className="text-gray-400 hover:text-primary-500 p-1 transition-colors"><Edit className="h-4 w-4" /></button>
                                        <button onClick={() => handleDeleteDataSource(source.id)} className="text-gray-400 hover:text-red-500 p-1 transition-colors"><Trash2 className="h-4 w-4" /></button>
                                    </td>
                                </tr>
                            ))}
                            {dataSources.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-20 text-center">
                                        <Database className="h-10 w-10 text-gray-200 mx-auto mb-4" />
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No pipelines configured</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Slide-over Modal */}
            {showDataSourceModal && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowDataSourceModal(false)} />
                    <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
                        <div className="w-screen max-w-md transform transition-all animate-in slide-in-from-right duration-500">
                            <div className="flex h-full flex-col bg-white dark:bg-gray-800 shadow-2xl">
                                <div className="p-8 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center">
                                    <div>
                                        <h2 className="text-xl font-black uppercase tracking-tighter">{editingSourceId ? 'Edit Storage' : 'Add Pipeline'}</h2>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Configure data ingestion</p>
                                    </div>
                                    <button onClick={() => setShowDataSourceModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="h-6 w-6 text-gray-400" /></button>
                                </div>

                                <div className="p-8 flex-1 overflow-y-auto space-y-8">
                                    {formDataGroups.map((group, idx) => (
                                        <div key={idx} className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                                                    {editingSourceId ? 'Configuration' : `Cluster ${idx + 1}`}
                                                </h3>
                                                {!editingSourceId && formDataGroups.length > 1 && (
                                                    <button onClick={() => handleRemoveGroup(idx)} className="text-red-400 hover:text-red-500 transition-colors"><Trash2 className="h-4 w-4" /></button>
                                                )}
                                            </div>

                                            <div className="p-6 rounded-3xl bg-gray-50 dark:bg-gray-900/50 border border-gray-50 dark:border-gray-700 space-y-4">
                                                <div>
                                                    <label className="block text-[8px] font-black text-gray-400 uppercase mb-2">Platform</label>
                                                    <select
                                                        value={group.platform}
                                                        onChange={(e) => handleDataSourceFieldChange(idx, 'platform', e.target.value)}
                                                        className="w-full bg-white dark:bg-gray-800 border-gray-200 rounded-xl px-4 py-3 text-xs font-bold"
                                                    >
                                                        <option value="google_drive">Google Drive</option>
                                                        <option value="sharepoint">SharePoint</option>
                                                        <option value="external_api">Rest API</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[8px] font-black text-gray-400 uppercase mb-2">Resource Host / ID</label>
                                                    <input
                                                        type="text"
                                                        value={group.resource_identifier}
                                                        onChange={(e) => handleDataSourceFieldChange(idx, 'identifier', e.target.value)}
                                                        className="w-full bg-white dark:bg-gray-800 border-gray-200 rounded-xl px-4 py-3 text-xs font-medium"
                                                        placeholder="Enter identifier..."
                                                    />
                                                </div>

                                                {!showName[idx] ? (
                                                    <button onClick={() => toggleName(idx)} className="text-[8px] font-black text-primary-600 uppercase">+ Add Custom Name</button>
                                                ) : (
                                                    <div>
                                                        <div className="flex justify-between items-center mb-2">
                                                            <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest">Display Name</label>
                                                            <button onClick={() => toggleName(idx)}><X className="h-3 w-3 text-gray-400" /></button>
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={group.resource_name || ''}
                                                            onChange={(e) => handleDataSourceFieldChange(idx, 'name', e.target.value)}
                                                            className="w-full bg-white dark:bg-gray-800 border-gray-200 rounded-xl px-4 py-3 text-xs font-medium"
                                                        />
                                                    </div>
                                                )}

                                                {!showConfig[idx] ? (
                                                    <button onClick={() => toggleConfig(idx)} className="text-[8px] font-black text-primary-600 uppercase block">+ Add JSON Config</button>
                                                ) : (
                                                    <div>
                                                        <div className="flex justify-between items-center mb-2">
                                                            <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest">Configuration Payload</label>
                                                            <button onClick={() => toggleConfig(idx)}><X className="h-3 w-3 text-gray-400" /></button>
                                                        </div>
                                                        <textarea
                                                            value={typeof group.config === 'object' ? JSON.stringify(group.config, null, 2) : (group as any).configRaw || ''}
                                                            onChange={(e) => handleDataSourceFieldChange(idx, 'config', e.target.value)}
                                                            rows={4}
                                                            className="w-full bg-white dark:bg-gray-800 border-gray-200 rounded-xl px-4 py-3 text-[10px] font-mono"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {!editingSourceId && (
                                        <button onClick={handleAddGroup} className="w-full py-4 border-2 border-dashed border-gray-100 rounded-3xl flex items-center justify-center gap-2 text-gray-400 hover:text-primary-500 hover:border-primary-500 transition-all font-black text-[10px] uppercase">
                                            <Plus className="h-4 w-4" />
                                            Add Entry
                                        </button>
                                    )}
                                </div>

                                <div className="p-8 border-t border-gray-50 dark:border-gray-700">
                                    <button
                                        onClick={handleSaveDataSources}
                                        disabled={isSavingDataSource}
                                        className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-primary-500/30 flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isSavingDataSource ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                                        {editingSourceId ? 'Commit Changes' : 'Initialize Pipeline'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
