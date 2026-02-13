import React, { useEffect, useState } from 'react';
import { cloudService } from '../services/api';
import { CloudFilesResponse, CloudFile } from '../types';
import { File, Folder, HardDrive, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';

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
                <button
                    onClick={fetchData}
                    className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-800"
                >
                    <RefreshCw className="h-4 w-4" /> Refresh
                </button>
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
                                        <div key={file.id} className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                                            <div className="flex-shrink-0">
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
                                            <ExternalLink className="h-4 w-4 text-gray-300" />
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
        </div>
    );
};
