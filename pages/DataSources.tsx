import React, { useEffect, useState, useCallback } from 'react';
import {
    Database,
    X,
    Check,
    Edit,
    Trash2,
    Loader2,
    Info,
    Trash,
    Activity
} from 'lucide-react';
import { dataSourcesService } from '../services/api';
import { DataSource, DataSourceCreateRequest } from '../types';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const DataSources: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // UI State
    const [dataSources, setDataSources] = useState<DataSource[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Data Sources State
    const [showDataSourceModal, setShowDataSourceModal] = useState(false);
    const [selectedSources, setSelectedSources] = useState<string[]>([]);
    const [isSavingDataSource, setIsLoadingSavingDataSource] = useState(false);
    const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
    const [formDataGroups, setFormDataGroups] = useState<DataSourceCreateRequest[]>([
        { platform: 'google_drive', resource_identifier: '', resource_name: '', resource_format: '', config: [] }
    ]);
    const [showConfig, setShowConfig] = useState<boolean[]>([false]);
    const [showName, setShowName] = useState<boolean[]>([false]);

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

    const fetchAllDataSources = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await dataSourcesService.listUser();
            setDataSources(data || []);
        } catch (err: any) {
            console.error('Failed to fetch data sources', err);
            setMessage({ type: 'error', text: err.message || 'Failed to fetch data sources' });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllDataSources();
    }, [fetchAllDataSources]);

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

    const handleSaveDataSources = async () => {
        setIsLoadingSavingDataSource(true);
        try {
            if (editingSourceId) {
                const source = dataSources.find(s => s.id === editingSourceId);
                const updatePayload = {
                    user_id: user?.id,
                    agent_id: source?.agent_id,
                    agent_name: source?.agent_name,
                    ...formDataGroups[0],
                    process_id: source?.process_id
                };
                await dataSourcesService.update(editingSourceId, updatePayload);
                setMessage({ type: 'success', text: 'Data source updated' });
            } else {
                // In this global page, we don't have a specific agent_id/process_id for NEW sources 
                // unless we add a dropdown. For now, let's assume it's for the "Update and Delete" request.
                // If they add a source here, it might lack agent context.
                // The request specifically asked for list, update and delete.
                setMessage({ type: 'error', text: 'Please add data sources via the Agent page' });
                return;
            }
            fetchAllDataSources();
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

    return (
        <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 dark:text-gray-100">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                            <Database className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                                Data Sources
                            </h1>
                            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-widest">
                                Manage all your ingestion pipelines
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {selectedSources.length > 0 && (
                        <button onClick={handleBulkDelete} className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-xl text-xs font-bold uppercase hover:bg-red-100 transition-all shadow-sm">
                            <Trash className="h-3.5 w-3.5" />
                            Delete Selected ({selectedSources.length})
                        </button>
                    )}
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

            {/* Data Sources Table */}
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center bg-gray-50/30 dark:bg-gray-900/10">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center">
                        <Activity className="h-4 w-4 mr-2 text-primary-500" />
                        Active Pipelines ({dataSources.length})
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-50 dark:divide-gray-700">
                        <thead className="bg-gray-50/50 dark:bg-gray-900/30">
                            <tr>
                                <th className="px-6 py-4 text-left w-10">
                                    <input type="checkbox" className="rounded border-gray-300 text-primary-600" onChange={(e) => setSelectedSources(e.target.checked ? dataSources.map(s => s.id) : [])} checked={selectedSources.length === dataSources.length && dataSources.length > 0} />
                                </th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Platform</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Resource Details</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Linked Agent</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <Loader2 className="h-8 w-8 text-primary-500 animate-spin mx-auto mb-4" />
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Resources...</p>
                                    </td>
                                </tr>
                            ) : dataSources.map((source) => (
                                <tr key={source.id} className={`${selectedSources.includes(source.id) ? 'bg-primary-50/30 dark:bg-primary-900/10' : ''} hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors`}>
                                    <td className="px-6 py-4"><input type="checkbox" className="rounded border-gray-300 text-primary-600" checked={selectedSources.includes(source.id)} onChange={() => toggleSourceSelection(source.id)} /></td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase ${source.platform === 'external_api' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                            source.platform === 'google_drive' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'}`}>
                                            {source.platform.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold truncate max-w-xs">{source.resource_name || 'Unnamed Resource'}</span>
                                            <span className="text-[10px] text-gray-400 font-mono truncate max-w-[200px]">{source.resource_identifier}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div
                                            onClick={() => navigate(`/agent/${source.process_id}`)}
                                            className="text-xs font-bold text-primary-600 hover:text-primary-700 cursor-pointer flex items-center gap-2 group"
                                        >
                                            {source.agent_name || 'General'}
                                            <Info className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button onClick={() => handleEditSource(source)} className="text-gray-400 hover:text-primary-500 p-1 transition-colors"><Edit className="h-4 w-4" /></button>
                                        <button onClick={() => handleDeleteDataSource(source.id)} className="text-gray-400 hover:text-red-500 p-1 transition-colors"><Trash2 className="h-4 w-4" /></button>
                                    </td>
                                </tr>
                            ))}
                            {!isLoading && dataSources.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
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
                                                    Configuration
                                                </h3>
                                            </div>

                                            <div className="p-6 rounded-3xl bg-gray-50 dark:bg-gray-900/50 border border-gray-50 dark:border-gray-700 space-y-4">
                                                <div>
                                                    <label className="block text-[8px] font-black text-gray-400 uppercase mb-2">Platform</label>
                                                    <select
                                                        disabled={!!editingSourceId}
                                                        value={group.platform}
                                                        onChange={(e) => handleDataSourceFieldChange(idx, 'platform', e.target.value)}
                                                        className="w-full bg-white dark:bg-gray-800 border-gray-200 rounded-xl px-4 py-3 text-xs font-bold disabled:opacity-50"
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
                                                            rows={8}
                                                            className="w-full bg-white dark:bg-gray-800 border-gray-200 rounded-xl px-4 py-3 text-[10px] font-mono"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-8 border-t border-gray-50 dark:border-gray-700 flex gap-4">
                                    <button
                                        onClick={() => setShowDataSourceModal(false)}
                                        className="flex-1 px-6 py-4 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveDataSources}
                                        disabled={isSavingDataSource}
                                        className="flex-3 px-6 py-4 bg-primary-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isSavingDataSource && <Loader2 className="h-4 w-4 animate-spin" />}
                                        {editingSourceId ? 'Update Resource' : 'Save Source'}
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
