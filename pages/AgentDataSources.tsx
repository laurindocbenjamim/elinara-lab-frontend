import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Database, Plus, Trash2, Server, Folder, File, HardDrive, X } from 'lucide-react';
import { agentService } from '../services/api';
import '../styles/PageLayout.css';

interface DataSource {
    id: string;
    process_id: string;
    platform: string;
    resource_identifier: string;
    resource_name: string;
    config?: any[];
}

export const AgentDataSources: React.FC = () => {
    const { id: agentId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [dataSources, setDataSources] = useState<DataSource[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Form Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newSource, setNewSource] = useState({
        platform: 'google_drive',
        resource_identifier: '',
        resource_name: ''
    });

    useEffect(() => {
        if (agentId) {
            fetchDataSources();
        }
    }, [agentId]);

    const fetchDataSources = async () => {
        setIsLoading(true);
        try {
            const sources = await agentService.getDataSources(agentId!);
            setDataSources(sources);
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to load data sources' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(new Set(dataSources.map(ds => ds.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectOne = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleDeleteSelected = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`Are you sure you want to delete ${selectedIds.size} data source(s)?`)) return;

        try {
            await agentService.deleteDataSources(Array.from(selectedIds));
            setMessage({ type: 'success', text: `Successfully deleted ${selectedIds.size} source(s)` });
            setSelectedIds(new Set());
            fetchDataSources();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to delete data sources' });
        }
    };

    const handleAddSource = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await agentService.createDataSource({
                process_id: agentId!,
                ...newSource
            });
            setMessage({ type: 'success', text: 'Data source added successfully' });
            setIsAddModalOpen(false);
            setNewSource({ platform: 'google_drive', resource_identifier: '', resource_name: '' });
            fetchDataSources();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to add data source' });
        }
    };

    const getPlatformIcon = (platform: string) => {
        switch (platform.toLowerCase()) {
            case 'google_drive': return <HardDrive size={16} className="text-blue-400" />;
            case 'microsoft_onedrive': return <Folder size={16} className="text-blue-300" />;
            default: return <Database size={16} className="text-zinc-400" />;
        }
    };

    const formatPlatformName = (platform: string) => {
        return platform.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    return (
        <div className="dashboard-page h-[calc(100vh-4rem)] overflow-hidden flex flex-col p-4 lg:p-12 bg-[#050505]" style={{ fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
            <div className="max-w-6xl mx-auto w-full flex-grow flex flex-col justify-start -mt-5 z-10 min-h-0">

                {/* Header */}
                <header className="mb-6 flex items-center justify-between text-left">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => navigate('/agent')}
                            className="p-2 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all text-zinc-500 hover:text-white"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white truncate">
                                Data Sources
                            </h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[11px] font-medium text-zinc-500 tracking-wide uppercase">Instance:</span>
                                <span className="text-[11px] font-bold text-blue-400/80 tracking-wide uppercase">{agentId}</span>
                            </div>
                        </div>
                    </div>
                </header>

                {message && (
                    <div className={`mb-6 p-4 rounded-xl border ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'} flex items-center justify-between`}>
                        <span className="text-sm font-medium">{message.text}</span>
                        <button onClick={() => setMessage(null)} className="opacity-50 hover:opacity-100"><X size={16} /></button>
                    </div>
                )}

                {/* Main Content Card */}
                <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-3xl flex flex-col overflow-hidden">

                    {/* Toolbar */}
                    <div className="p-6 border-b border-white/5 flex flex-wrap gap-4 items-center justify-between bg-white/[0.01]">
                        <div className="flex items-center gap-3">
                            <Server size={18} className="text-zinc-500" />
                            <h3 className="text-sm font-semibold text-zinc-200">Connected Resources</h3>
                            <span className="px-2.5 py-0.5 rounded-full bg-white/5 text-xs font-medium text-zinc-400">
                                {dataSources.length} total
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            {selectedIds.size > 0 && (
                                <button
                                    onClick={handleDeleteSelected}
                                    className="px-4 py-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40 text-red-500 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
                                >
                                    <Trash2 size={16} />
                                    Delete ({selectedIds.size})
                                </button>
                            )}
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)]"
                            >
                                <Plus size={16} />
                                Add Source
                            </button>
                        </div>
                    </div>

                    {/* Table Area */}
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        {isLoading ? (
                            <div className="h-full flex items-center justify-center text-zinc-500 text-sm">Loading data sources...</div>
                        ) : dataSources.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-4">
                                <Database size={48} className="text-white/5" />
                                <div className="text-center">
                                    <p className="text-sm font-medium text-zinc-400">No data sources configured</p>
                                    <p className="text-xs mt-1">Add a source to provide context to this agent instance.</p>
                                </div>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/[0.02] text-xs font-semibold text-zinc-500 uppercase tracking-wider sticky top-0 z-10">
                                        <th className="p-4 w-12 text-center align-middle">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.size === dataSources.length && dataSources.length > 0}
                                                onChange={handleSelectAll}
                                                className="w-4 h-4 rounded border-white/20 bg-black/50 text-blue-500 focus:ring-blue-500/50 cursor-pointer accent-blue-500"
                                            />
                                        </th>
                                        <th className="p-4 font-medium">Resource Name</th>
                                        <th className="p-4 font-medium">Platform</th>
                                        <th className="p-4 font-medium">Identifier</th>
                                        <th className="p-4 font-medium">ID</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dataSources.map((source) => (
                                        <tr
                                            key={source.id}
                                            className={`border-b border-white/5 transition-colors hover:bg-white/[0.02] ${selectedIds.has(source.id) ? 'bg-blue-500/5' : ''}`}
                                            onClick={() => handleSelectOne(source.id)}
                                        >
                                            <td className="p-4 text-center align-middle" onClick={e => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(source.id)}
                                                    onChange={() => handleSelectOne(source.id)}
                                                    className="w-4 h-4 rounded border-white/20 bg-black/50 text-blue-500 focus:ring-blue-500/50 cursor-pointer accent-blue-500"
                                                />
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-white/5">
                                                        <File size={16} className="text-zinc-400" />
                                                    </div>
                                                    <span className="text-sm font-medium text-zinc-200">{source.resource_name}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    {getPlatformIcon(source.platform)}
                                                    <span className="text-sm text-zinc-400">{formatPlatformName(source.platform)}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-xs font-mono text-zinc-500 bg-black/30 px-2 py-1 rounded truncate max-w-[200px] inline-block">
                                                    {source.resource_identifier}
                                                </span>
                                            </td>
                                            <td className="p-4 text-xs text-zinc-600 font-mono">
                                                {source.id.substring(0, 8)}...
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Source Modal Overlay */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0a0a0c] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
                        <div className="flex items-center justify-between p-6 border-b border-white/5">
                            <h3 className="text-xl font-bold text-white">Add Data Source</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleAddSource} className="p-6 space-y-5">
                            <div>
                                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Platform</label>
                                <select
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer"
                                    value={newSource.platform}
                                    onChange={(e) => setNewSource({ ...newSource, platform: e.target.value })}
                                >
                                    <option value="google_drive" className="bg-[#111]">Google Drive</option>
                                    <option value="microsoft_onedrive" className="bg-[#111]">Microsoft OneDrive</option>
                                    <option value="local_file" className="bg-[#111]">Local File System</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Resource Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Q3 Marketing Plans"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors placeholder:text-zinc-600"
                                    value={newSource.resource_name}
                                    onChange={(e) => setNewSource({ ...newSource, resource_name: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Resource Identifier (ID/URI)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 1B2M2Y8AsgTpgAmY7PhCfg"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-zinc-300 focus:outline-none focus:border-blue-500 transition-colors placeholder:text-zinc-600 font-sans"
                                    value={newSource.resource_identifier}
                                    onChange={(e) => setNewSource({ ...newSource, resource_identifier: e.target.value })}
                                    required
                                />
                                <p className="text-[10px] text-zinc-500 mt-2">Enter the cloud folder ID, file ID, or external URI for the agent to index.</p>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-white font-medium hover:bg-white/5 transition-colors text-sm">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 px-4 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors text-sm shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                                    Add Source
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};
