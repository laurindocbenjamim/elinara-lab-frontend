import React, { useEffect, useState } from 'react';
import { cloudService } from '../services/api';
import { CloudFilesResponse } from '../types';
import { File, Folder, HardDrive, AlertTriangle, ExternalLink, RefreshCw, Star } from 'lucide-react';
import { AgentSelectModal } from '../components/AgentSelectModal';

export const CloudFiles: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<CloudFilesResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<Array<{ id: string, name: string, type: string, provider: string }>>([]);
    const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);

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
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full mb-4"></div>
                <p className="text-gray-500 font-medium">Loading cloud files...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 text-center">
                <div className="bg-red-50 text-red-700 p-4 rounded-md inline-block">
                    <p>Error: {error}</p>
                    <button onClick={fetchData} className="mt-2 underline hover:text-red-900">Try Again</button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <HardDrive className="h-6 w-6 text-primary-600" />
                    Unified Cloud Storage
                </h1>
                <div className="flex items-center gap-4">
                    {selectedFiles.length > 0 && (
                        <button
                            onClick={() => setIsAgentModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary-500/30 animate-in fade-in slide-in-from-left-4 duration-300"
                        >
                            <Star className="h-4 w-4" />
                            Send to Agent ({selectedFiles.length})
                        </button>
                    )}
                    <button
                        onClick={fetchData}
                        className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-800"
                    >
                        <RefreshCw className="h-4 w-4" /> Refresh
                    </button>
                </div>
            </div>

            {data?.data.map((providerData) => (
                <div key={providerData.provider} className="mb-8 bg-white shadow sm:rounded-lg overflow-hidden border border-gray-100">
                    <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 capitalize flex items-center gap-2">
                            {/* Icons based on provider name - simple check */}
                            {providerData.provider === 'google' ? (
                                <span className="text-blue-500">Google Drive</span>
                            ) : providerData.provider === 'microsoft' ? (
                                <span className="text-blue-700">OneDrive</span>
                            ) : (
                                providerData.provider
                            )}
                        </h3>
                        {providerData.status === 'error' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Connection Error
                            </span>
                        )}
                        {providerData.status === 'success' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Connected
                            </span>
                        )}
                    </div>

                    <div className="px-4 py-5 sm:p-6">
                        {providerData.status === 'error' ? (
                            <div className="text-sm text-red-600">
                                {providerData.message || 'Unknown error occurred'}
                                <p className="mt-1 text-gray-500">Please check your connection settings in the Dashboard.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {providerData.files && providerData.files.length > 0 ? (
                                    providerData.files.map((file) => (
                                        <div
                                            key={file.id}
                                            className={`relative rounded-2xl border transition-all flex items-center space-x-3 p-5 ${selectedFiles.find(sf => sf.id === file.id)
                                                ? 'border-primary-500 bg-primary-50/30 ring-1 ring-primary-500'
                                                : 'border-gray-200 bg-white hover:border-gray-300'
                                                }`}
                                        >
                                            <div className="flex-shrink-0 flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={!!selectedFiles.find(sf => sf.id === file.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedFiles([...selectedFiles, {
                                                                id: file.id,
                                                                name: file.name,
                                                                type: file.type,
                                                                provider: providerData.provider
                                                            }]);
                                                        } else {
                                                            setSelectedFiles(selectedFiles.filter(sf => sf.id !== file.id));
                                                        }
                                                    }}
                                                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 mr-3 cursor-pointer"
                                                />
                                                {/* Simple icon logic */}
                                                {file.type.includes('folder') ? (
                                                    <Folder className="h-10 w-10 text-yellow-400" />
                                                ) : (
                                                    <File className="h-10 w-10 text-gray-400" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <a href={file.webViewLink} target="_blank" rel="noopener noreferrer" className="focus:outline-none">
                                                    <span className="absolute inset-0" aria-hidden="true" />
                                                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                                                    <p className="text-xs text-gray-500 truncate">{file.type}</p>
                                                </a>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <ExternalLink className="h-4 w-4 text-gray-300 hover:text-primary-500 cursor-pointer" onClick={() => window.open(file.webViewLink, '_blank')} />
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setSelectedFiles([{
                                                            id: file.id,
                                                            name: file.name,
                                                            type: file.type,
                                                            provider: providerData.provider
                                                        }]);
                                                        setIsAgentModalOpen(true);
                                                    }}
                                                    className="p-1 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded text-gray-400 hover:text-primary-500 transition-colors"
                                                    title="Send only this to Agent"
                                                >
                                                    <Star className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500 italic">No files found.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            ))}

            {(!data?.data || data.data.length === 0) && (
                <div className="text-center text-gray-500 py-10">
                    No providers connected. Please connect a provider in the Dashboard.
                </div>
            )}

            <AgentSelectModal
                isOpen={isAgentModalOpen}
                onClose={() => setIsAgentModalOpen(false)}
                filesData={selectedFiles}
            />
        </div>
    );
};
