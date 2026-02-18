import React, { useEffect, useState } from 'react';
import { cloudService } from '../services/api';
import { CloudFilesResponse, CloudFile } from '../types';
import { File, Folder, HardDrive, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';
import '../styles/PageLayout.css';

export const CloudFiles: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<CloudFilesResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await cloudService.getAggregatedFiles();
            setData(response);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch cloud files');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="dashboard-page flex flex-col items-center justify-center h-screen bg-[#050505]">
                <div className="dash-loader mb-4"></div>
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Syncing Connections...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-page h-screen bg-[#050505] p-6 lg:p-12">
                <div className="max-w-5xl mx-auto w-full text-center">
                    <div className="bg-red-500/10 text-red-400 p-8 rounded-3xl border border-red-500/20 inline-block">
                        <AlertTriangle className="h-8 w-8 mx-auto mb-4" />
                        <p className="font-bold uppercase tracking-tight mb-4">{error}</p>
                        <button 
                            onClick={fetchData} 
                            className="px-6 py-2 bg-white/5 border border-white/10 text-white text-xs font-bold rounded-xl hover:bg-white/10 transition-all uppercase tracking-widest"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-page h-[calc(100vh-4rem)] overflow-hidden flex flex-col p-6 lg:p-12 bg-[#050505]">
            <div className="max-w-7xl mx-auto w-full flex-grow flex flex-col justify-start -mt-5 z-10 overflow-y-auto custom-scrollbar pr-2">
                
                {/* Header */}
                <header className="mb-8 flex justify-between items-center">
                    <div className="text-left">
                        <h2 className="text-3xl font-bold tracking-tighter bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent uppercase">
                            CONNECTIONS
                        </h2>
                    </div>
                    <button
                        onClick={fetchData}
                        className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-white text-xs font-bold rounded-2xl hover:bg-white/10 transition-all uppercase tracking-widest group"
                    >
                        <RefreshCw className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" /> 
                        <span>Refresh Sync</span>
                    </button>
                </header>

                <div className="space-y-12 pb-12">
                    {data?.data.map((providerData) => (
                        <div key={providerData.provider} className="bg-transparent">
                            <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                                <h3 className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                                    {providerData.provider === 'google' ? 'Google Workspace' : 
                                     providerData.provider === 'microsoft' ? 'Microsoft OneDrive' : 
                                     providerData.provider}
                                </h3>
                                
                                {providerData.status === 'error' ? (
                                    <span className="flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-widest">
                                        <AlertTriangle size={10} /> Sync Failed
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20 uppercase tracking-widest">
                                        Connected
                                    </span>
                                )}
                            </div>

                            {providerData.status === 'error' ? (
                                <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-8 text-center">
                                    <p className="text-zinc-500 text-sm mb-2">{providerData.message || 'Connection interrupted'}</p>
                                    <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">Verify credentials in dashboard settings</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {providerData.files && providerData.files.length > 0 ? (
                                        providerData.files.map((file) => (
                                            <a 
                                                key={file.id} 
                                                href={file.webViewLink} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="group bg-white/[0.03] border border-white/5 rounded-3xl p-6 hover:bg-white/[0.06] hover:border-white/10 transition-all duration-300 flex items-center gap-4"
                                            >
                                                <div className="flex-shrink-0 bg-white/5 p-3 rounded-2xl group-hover:scale-110 transition-transform duration-500">
                                                    {file.type.includes('folder') ? (
                                                        <Folder className="h-6 w-6 text-zinc-400" />
                                                    ) : (
                                                        <File className="h-6 w-6 text-zinc-400" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-white truncate uppercase tracking-tight">{file.name}</p>
                                                    <p className="text-[9px] font-bold text-zinc-500 truncate uppercase tracking-widest mt-1 opacity-60">
                                                        {file.type.split('.').pop() || 'File'}
                                                    </p>
                                                </div>
                                                <ExternalLink className="h-3 w-3 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </a>
                                        ))
                                    ) : (
                                        <div className="col-span-full py-12 text-center opacity-40">
                                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">No accessible objects in this repository</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {(!data?.data || data.data.length === 0) && (
                    <div className="flex flex-col items-center justify-center py-32 opacity-40">
                        <HardDrive size={48} className="text-zinc-500 mb-4" />
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest">No Cloud Nodes Connected</h3>
                    </div>
                )}
            </div>
        </div>
    );
};
