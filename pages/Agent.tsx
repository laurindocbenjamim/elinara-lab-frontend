import React, { useEffect, useState } from 'react';
import { Settings, Play, Square, Plus, Trash2, Loader2, Info, ChevronDown, ChevronUp, Database, X, Check, Edit, Trash, PlusCircle } from 'lucide-react';
import { agentService, configService, processesService, dataSourcesService } from '../services/api';
import { AgentStatus, Process, DataSource, DataSourceCreateRequest } from '../types';
import { useAuth } from '../context/AuthContext';
import { useParams, useLocation } from 'react-router-dom';

export const Agent: React.FC = () => {
    const { processId } = useParams<{ processId: string }>();
    const location = useLocation();
    const { user } = useAuth();
    const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
    const [currentProcess, setCurrentProcess] = useState<Process | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [connectionEmails, setConnectionEmails] = useState<string[]>([]);
    const [newEmail, setNewEmail] = useState('');
    const [selectedModel, setSelectedModel] = useState('gpt-4o');
    const [taskData, setTaskData] = useState({ filename: '', phone: '' });
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [showProcessDetails, setShowProcessDetails] = useState(false);

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

    // Data Sources State
    const [dataSources, setDataSources] = useState<DataSource[]>([]);
    const [showDataSourceModal, setShowDataSourceModal] = useState(false);
    const [selectedSources, setSelectedSources] = useState<string[]>([]);
    const [isSavingDataSource, setIsSavingDataSource] = useState(false);
    const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
    const [formDataGroups, setFormDataGroups] = useState<DataSourceCreateRequest[]>([
        { platform: 'google_drive', resource_identifier: '', resource_name: '', resource_format: '', config: [] }
    ]);
    const [showConfig, setShowConfig] = useState<boolean[]>([false]);
    const [showName, setShowName] = useState<boolean[]>([false]);
    const [showFormat, setShowFormat] = useState<boolean[]>([false]);

    useEffect(() => {
        fetchAgentData();
    }, [processId]);

    const fetchAgentData = async () => {
        setIsLoading(true);
        try {
            const promises: Promise<any>[] = [
                agentService.getStatus(),
                configService.getConnectionEmails(),
                processesService.list()
            ];

            if (processId) {
                promises.push(processesService.get(parseInt(processId)));
            }

            const results = await Promise.all(promises);

            setAgentStatus(results[0]);
            setConnectionEmails(results[1]?.connection_emails || []);
            // results[2] is allProcesses, we can use it to populate a list if we want, but if it's unused we could remove the state.
            // For now let's just log it to satisfy being "used" or remove it.
            console.log('Available processes:', results[2]?.length || 0);
            setSelectedModel(results[0]?.selected_model || 'gpt-4o');

            if (processId && results[3]) {
                setCurrentProcess(results[3]);
                fetchDataSources(processId);

                // Handle auto-opening from navigation state
                if (location.state?.autoOpenDataSource && (location.state?.fileInfo || location.state?.filesInfo)) {
                    const filesInfo = location.state.filesInfo || [location.state.fileInfo];
                    handleResetFormData();

                    // Pre-fill the form with files info
                    const newGroups = filesInfo.map((file: any) => ({
                        platform: file.provider === 'google' ? 'google_drive' : 'sharepoint',
                        resource_identifier: file.id,
                        resource_name: file.name,
                        resource_format: file.type,
                        config: []
                    }));

                    setFormDataGroups(newGroups.length > 0 ? newGroups : [
                        { platform: 'google_drive', resource_identifier: '', resource_name: '', resource_format: '', config: [] }
                    ]);
                    setShowConfig(new Array(Math.max(1, newGroups.length)).fill(false));
                    setShowName(new Array(Math.max(1, newGroups.length)).fill(true));
                    setShowFormat(new Array(Math.max(1, newGroups.length)).fill(true));

                    setShowDataSourceModal(true);

                    // Clear the state so it doesn't reopen on refresh
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
    };

    const fetchDataSources = async (pid: string) => {
        try {
            const data = await dataSourcesService.list(pid);
            setDataSources(data || []);
        } catch (err) {
            console.error('Failed to fetch data sources', err);
        }
    };

    const handleResetFormData = () => {
        setFormDataGroups([
            { platform: 'google_drive', resource_identifier: '', resource_name: '', resource_format: '', config: [] }
        ]);
        setShowConfig([false]);
        setShowName([false]);
        setShowFormat([false]);
        setEditingSourceId(null);
    };

    const handleDataSourceFieldChange = (index: number, field: string, value: any) => {
        const updatedGroups = [...formDataGroups];
        if (field === 'config') {
            try {
                updatedGroups[index].config = JSON.parse(value);
            } catch (e) {
                // Store raw string if invalid JSON for now
                (updatedGroups[index] as any).configRaw = value;
            }
        } else if (field === 'identifier') {
            updatedGroups[index].resource_identifier = value;
        } else if (field === 'name') {
            updatedGroups[index].resource_name = value;
        } else if (field === 'format') {
            updatedGroups[index].resource_format = value;
        } else if (field === 'platform') {
            updatedGroups[index].platform = value;
        }
        setFormDataGroups(updatedGroups);
    };

    const toggleName = (index: number) => {
        const updatedShow = [...showName];
        updatedShow[index] = !updatedShow[index];
        setShowName(updatedShow);
    };

    const toggleFormat = (index: number) => {
        const updatedShow = [...showFormat];
        updatedShow[index] = !updatedShow[index];
        setShowFormat(updatedShow);
    };
    const toggleConfig = (index: number) => {
        const updatedShow = [...showConfig];
        updatedShow[index] = !updatedShow[index];
        setShowConfig(updatedShow);

        // If enabling config for the first time or it's empty, set default
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
        setShowFormat([...showFormat, false]);
    };

    const handleRemoveGroup = (index: number) => {
        if (formDataGroups.length <= 1) return;
        const updatedGroups = formDataGroups.filter((_, i) => i !== index);
        const updatedShow = showConfig.filter((_, i) => i !== index);
        const updatedShowName = showName.filter((_, i) => i !== index);
        const updatedShowFormat = showFormat.filter((_, i) => i !== index);
        setFormDataGroups(updatedGroups);
        setShowConfig(updatedShow);
        setShowName(updatedShowName);
        setShowFormat(updatedShowFormat);
    };

    const validateForm = () => {
        const errors: string[] = [];
        const groupsToProcess = editingSourceId ? [formDataGroups[0]] : formDataGroups;

        groupsToProcess.forEach((group, idx) => {
            if (!group.resource_identifier) {
                errors.push(`Resource Identifier is required for Group ${idx + 1}.`);
            }
            if (group.platform === 'external_api' && group.resource_identifier && !group.resource_identifier.startsWith('http')) {
                try { new URL(group.resource_identifier); } catch (e) { errors.push(`Invalid URL in Group ${idx + 1}: ${group.resource_identifier}`); }
            }

            if ((group as any).configRaw) {
                try { JSON.parse((group as any).configRaw); } catch (e) { errors.push(`Configuration in Group ${idx + 1} must be a valid JSON array.`); }
            }
        });

        return errors.length > 0 ? errors.join(' ') : null;
    };

    // Ensure at least one storage and one API if not editing
    if (!editingSourceId) {
        const platforms = new Set(dataSources.map(s => s.platform));
        formDataGroups.forEach(g => {
            if (g.resource_identifier) platforms.add(g.platform);
        });
        const hasStorage = platforms.has('google_drive') || platforms.has('sharepoint');
        const hasAPI = platforms.has('external_api');
        if (dataSources.length > 0 && (!hasStorage || !hasAPI)) {
            console.warn("Validation warning: Agent should ideally have both storage and API sources.");
        }
    }

    const handleSaveDataSources = async () => {
        if (!processId) return;
        const error = validateForm();
        if (error) {
            setMessage({ type: 'error', text: error });
            return;
        }

        setIsSavingDataSource(true);
        try {
            if (editingSourceId) {
                const updatePayload = {
                    platform: formDataGroups[0].platform,
                    resource_identifier: formDataGroups[0].resource_identifier,
                    resource_name: formDataGroups[0].resource_name,
                    resource_format: formDataGroups[0].resource_format,
                    config: formDataGroups[0].config
                };
                console.log('Updating data source:', editingSourceId, updatePayload);
                await dataSourcesService.update(editingSourceId, updatePayload);
                setMessage({ type: 'success', text: 'Data source updated' });
            } else {
                console.log('Submitting data sources:', formDataGroups);
                // Save all groups (validation ensures they are all filled)
                const savePromises = formDataGroups
                    .map(group => dataSourcesService.create({
                        ...group,
                        process_id: processId
                    }));

                const responses = await Promise.all(savePromises);
                console.log('Data sources created successfully:', responses);
                setMessage({ type: 'success', text: 'Data sources added' });
            }
            fetchDataSources(processId);
            setShowDataSourceModal(false);
            handleResetFormData();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to save data source' });
        } finally {
            setIsSavingDataSource(false);
        }
    };

    const handleDeleteDataSource = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this data source?')) return;
        try {
            await dataSourcesService.delete(id);
            setDataSources(dataSources.filter((s: DataSource) => s.id !== id));
            setMessage({ type: 'success', text: 'Data source deleted' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to delete data source' });
        }
    };

    const handleBulkDelete = async () => {
        if (selectedSources.length === 0 || !window.confirm(`Delete ${selectedSources.length} sources?`)) return;
        try {
            // Since bulkDelete was removed from service, we delete one by one or implement it in backend later.
            // For now, let's keep it simple and assume the user wants single deletes or update backend.
            // Actually, I removed bulkDelete from service because the new structure didn't specify it.
            // I'll implement sequential delete for now.
            for (const id of selectedSources) {
                await dataSourcesService.delete(id);
            }
            setDataSources(dataSources.filter((s: DataSource) => !selectedSources.includes(s.id)));
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
        if (selectedSources.includes(id)) {
            setSelectedSources(selectedSources.filter((sid: string) => sid !== id));
        } else {
            setSelectedSources([...selectedSources, id]);
        }
    };

    const handleAgentControl = async (action: 'start' | 'stop' | 'pause') => {
        try {
            const res = await agentService.control(
                action,
                currentProcess?.user_id || undefined,
                currentProcess?.id || undefined,
                user?.email
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
            {/* Dashboard Headers */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                            <Settings className="h-5 w-5 text-white" />
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                            {currentProcess?.name || 'Agent Control'}
                        </h1>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Configure and monitor your AI process.</p>
                </div>

                {message && (
                    <div className={`p-4 rounded-2xl border ${message.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'} flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300`}>
                        {message.type === 'success' ? <Check className="h-5 w-5" /> : <Info className="h-5 w-5" />}
                        <p className="text-sm font-bold">{message.text}</p>
                        <button onClick={() => setMessage(null)} className="ml-4 p-1 hover:bg-black/5 rounded-full"><X className="h-4 w-4" /></button>
                    </div>
                )}

                <div className="flex items-center gap-3">
                    {currentProcess && (
                        <button
                            onClick={() => setShowProcessDetails(!showProcessDetails)}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all shadow-sm"
                        >
                            <Info className="h-4 w-4 text-primary-500" />
                            {showProcessDetails ? 'Hide Details' : 'Show Details'}
                            {showProcessDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                    )}
                    <button
                        onClick={() => {
                            handleResetFormData();
                            setShowDataSourceModal(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 dark:bg-primary-500 rounded-xl text-xs font-bold text-white hover:bg-primary-700 dark:hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/30"
                    >
                        <PlusCircle className="h-4 w-4" />
                        Add Datasource
                    </button>
                </div>

                <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-2 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    {agentStatus?.agent_status === 'active' ? (
                        <button
                            onClick={() => handleAgentControl('stop')}
                            className="flex items-center gap-2 py-3 px-6 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-500/20"
                        >
                            <Square className="h-4 w-4 fill-current rounded-sm" /> Stop
                        </button>
                    ) : (
                        <button
                            onClick={() => handleAgentControl('start')}
                            className="flex items-center gap-2 py-3 px-6 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg shadow-green-500/20"
                        >
                            <Play className="h-4 w-4 fill-current" /> Start
                        </button>
                    )}
                </div>
            </div>

            {isLoading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/50 dark:bg-gray-900/50 backdrop-blur-[1px]">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-10 w-10 text-primary-600 animate-spin" />
                        <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Loading Agent Data...</p>
                    </div>
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
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Created At</label>
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{new Date(currentProcess.created_at).toLocaleString()}</p>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Updated At</label>
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{new Date(currentProcess.updated_at || currentProcess.created_at).toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="mt-6">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Configuration Snapshot</label>
                            <pre className="mt-2 text-[10px] font-mono bg-white dark:bg-black/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 overflow-x-auto">
                                {JSON.stringify(currentProcess.config_snapshot, null, 2)}
                            </pre>
                        </div>
                    </div>
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

                        <div className="mb-8">
                            {agentStatus?.agent_status === 'active' ? (
                                <button
                                    onClick={() => handleAgentControl('stop')}
                                    className="w-full flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all group"
                                >
                                    <Square className="h-8 w-8 text-red-500 mb-2" />
                                    <span className="text-sm font-black text-red-700 dark:text-red-400 uppercase tracking-widest">Stop Agent</span>
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleAgentControl('start')}
                                    className="w-full flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-all group"
                                >
                                    <Play className="h-8 w-8 text-green-500 mb-2" />
                                    <span className="text-sm font-black text-green-700 dark:text-green-400 uppercase tracking-widest">Start Agent</span>
                                </button>
                            )}
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

            {/* Data Sources Table */}
            <div className="mt-8 mb-8 bg-white dark:bg-gray-800 shadow sm:rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                        <Database className="h-5 w-5 mr-2 text-primary-500" />
                        Configured Data Sources
                    </h3>
                    {selectedSources.length > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
                        >
                            <Trash className="h-3.5 w-3.5" />
                            Delete Selected ({selectedSources.length})
                        </button>
                    )}
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900/50">
                            <tr>
                                <th className="px-6 py-4 text-left">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedSources(dataSources.map(s => s.id));
                                            else setSelectedSources([]);
                                        }}
                                        checked={selectedSources.length === dataSources.length && dataSources.length > 0}
                                    />
                                </th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Platform</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Resource / Name</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Format</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {dataSources.map((source) => (
                                <tr key={source.id} className={`${selectedSources.includes(source.id) ? 'bg-primary-50/30 dark:bg-primary-900/10' : ''} hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors`}>
                                    <td className="px-6 py-4">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                                            checked={selectedSources.includes(source.id)}
                                            onChange={() => toggleSourceSelection(source.id)}
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${source.platform === 'external_api' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'}`}>
                                            {source.platform.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold dark:text-gray-200 truncate max-w-xs">{source.resource_name || 'Unnamed Resource'}</span>
                                            <span className="text-[10px] text-gray-500 font-mono">{source.resource_identifier}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">{source.resource_format || '-'}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                                        <button onClick={() => handleEditSource(source)} className="text-gray-400 hover:text-primary-500 p-1"><Edit className="h-4 w-4" /></button>
                                        <button onClick={() => handleDeleteDataSource(source.id)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 className="h-4 w-4" /></button>
                                    </td>
                                </tr>
                            ))}
                            {dataSources.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400 italic">
                                        No data sources configured for this agent yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Slide-over Modal (Right) */}
            {showDataSourceModal && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    <div className="absolute inset-0 bg-gray-500/75 dark:bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setShowDataSourceModal(false)} />
                    <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
                        <div className="w-screen max-w-md transform transition-all animate-in slide-in-from-right duration-500">
                            <div className="flex h-full flex-col bg-white dark:bg-gray-800 shadow-2xl">
                                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                                    <div>
                                        <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                                            {editingSourceId ? 'Edit DataSource' : 'Add Datasource'}
                                        </h2>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Configure how your agent accesses data.</p>
                                    </div>
                                    <button onClick={() => setShowDataSourceModal(false)} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-full transition-colors">
                                        <X className="h-6 w-6 text-gray-400" />
                                    </button>
                                </div>

                                <div className="p-6 flex-1 overflow-y-auto space-y-10">
                                    {message && (
                                        <div className={`p-4 rounded-2xl border ${message.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'} flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 mb-6`}>
                                            {message.type === 'success' ? <Check className="h-5 w-5" /> : <Info className="h-5 w-5" />}
                                            <p className="text-sm font-bold">{message.text}</p>
                                            <button onClick={() => setMessage(null)} className="ml-auto p-1 hover:bg-black/5 rounded-full"><X className="h-4 w-4" /></button>
                                        </div>
                                    )}
                                    {(editingSourceId ? [formDataGroups[0]] : formDataGroups).map((group, idx) => (
                                        <div key={idx} className="space-y-6">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                        {editingSourceId ? 'Configuration' : `Group ${idx + 1}`}
                                                    </h3>
                                                    {!editingSourceId && formDataGroups.length > 2 && (
                                                        <button
                                                            onClick={() => handleRemoveGroup(idx)}
                                                            className="text-red-500 hover:text-red-600 transition-colors p-1"
                                                            title="Remove Group"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {!showConfig[idx] && (
                                                        <button
                                                            onClick={() => toggleConfig(idx)}
                                                            className="flex items-center gap-1.5 text-[10px] font-black text-primary-600 uppercase tracking-widest hover:text-primary-700"
                                                        >
                                                            <PlusCircle className="h-4 w-4" />
                                                            Add Config
                                                        </button>
                                                    )}
                                                    {!showName[idx] && (
                                                        <button
                                                            onClick={() => toggleName(idx)}
                                                            className="flex items-center gap-1.5 text-[10px] font-black text-primary-600 uppercase tracking-widest hover:text-primary-700 transition-colors"
                                                        >
                                                            <PlusCircle className="h-4 w-4" />
                                                            Add Name
                                                        </button>
                                                    )}
                                                    {!showFormat[idx] && (
                                                        <button
                                                            onClick={() => toggleFormat(idx)}
                                                            className="flex items-center gap-1.5 text-[10px] font-black text-primary-600 uppercase tracking-widest hover:text-primary-700 transition-colors"
                                                        >
                                                            <PlusCircle className="h-4 w-4" />
                                                            Add Format
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="p-5 rounded-3xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 space-y-5">
                                                <div>
                                                    <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2">Platform</label>
                                                    <select
                                                        value={group.platform}
                                                        onChange={(e) => handleDataSourceFieldChange(idx, 'platform', e.target.value)}
                                                        className="block w-full px-4 py-3 rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-bold dark:text-white border focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                                    >
                                                        <option value="google_drive">Google Drive</option>
                                                        <option value="sharepoint">SharePoint</option>
                                                        <option value="external_api">External API</option>
                                                    </select>
                                                </div>

                                                <div className={showName[idx] ? "grid grid-cols-2 gap-4" : "w-full"}>
                                                    <div>
                                                        <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2">Resource Identifier <span className="text-red-500">*</span></label>
                                                        <input
                                                            type="text"
                                                            value={group.resource_identifier}
                                                            onChange={(e) => handleDataSourceFieldChange(idx, 'identifier', e.target.value)}
                                                            placeholder={group.platform === 'external_api' ? 'https://api.example.com/v1' : 'folder-id-or-path'}
                                                            className="block w-full px-4 py-3 rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-medium dark:text-white border focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                                        />
                                                    </div>
                                                    {showName[idx] && (
                                                        <div>
                                                            <div className="flex justify-between items-center mb-2">
                                                                <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest">Name</label>
                                                                <button onClick={() => toggleName(idx)} className="text-red-500 hover:text-red-600 transition-colors">
                                                                    <Trash2 className="h-3 w-3" />
                                                                </button>
                                                            </div>
                                                            <input
                                                                type="text"
                                                                value={group.resource_name || ''}
                                                                onChange={(e) => handleDataSourceFieldChange(idx, 'name', e.target.value)}
                                                                placeholder="e.g. My Document"
                                                                className="block w-full px-4 py-3 rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-medium dark:text-white border focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium"
                                                            />
                                                        </div>
                                                    )}
                                                </div>

                                                {showFormat[idx] && (
                                                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest">Format</label>
                                                            <button onClick={() => toggleFormat(idx)} className="text-red-500 hover:text-red-600 transition-colors">
                                                                <Trash2 className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={group.resource_format || ''}
                                                            onChange={(e) => handleDataSourceFieldChange(idx, 'format', e.target.value)}
                                                            placeholder="e.g. application/pdf"
                                                            className="block w-full px-4 py-3 rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-medium dark:text-white border focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium"
                                                        />
                                                    </div>
                                                )}

                                                {showConfig[idx] && (
                                                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest">Config (JSON Array)</label>
                                                            <button
                                                                onClick={() => toggleConfig(idx)}
                                                                className="text-[8px] font-black text-red-500 uppercase tracking-widest"
                                                            >
                                                                Remove Config
                                                            </button>
                                                        </div>
                                                        <textarea
                                                            value={typeof group.config === 'object' ? JSON.stringify(group.config, null, 2) : (group as any).configRaw || ''}
                                                            onChange={(e) => handleDataSourceFieldChange(idx, 'config', e.target.value)}
                                                            placeholder='[{"name": "test", "query_url": "..."}]'
                                                            rows={6}
                                                            className="block w-full px-4 py-3 rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[10px] font-mono dark:text-white border focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {!editingSourceId && (
                                        <button
                                            onClick={handleAddGroup}
                                            className="w-full py-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl flex items-center justify-center gap-2 text-gray-400 hover:text-primary-500 hover:border-primary-500 transition-all font-black text-[10px] uppercase tracking-widest"
                                        >
                                            <Plus className="h-5 w-5" />
                                            Add Group
                                        </button>
                                    )}
                                </div>

                                <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                                    <button
                                        onClick={handleSaveDataSources}
                                        disabled={isSavingDataSource}
                                        className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-primary-500/30 flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isSavingDataSource ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                                        {editingSourceId ? 'Update Data Source' : 'Save Config'}
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
