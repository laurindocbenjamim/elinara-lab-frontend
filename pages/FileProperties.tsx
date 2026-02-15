import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, File as FileIcon, Folder, Image as ImageIcon, Music, Video, FileText, Download, Info, Calendar, HardDrive, Tag, Star, Cpu } from 'lucide-react';
import { AgentSelectModal } from '../components/AgentSelectModal';
import { DriveFile } from '../types';

export const FileProperties: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // We try to get file from state first, but ideally we would fallback to fetching if not present
    // For now, we assume navigation comes from the Drive view with state
    const file = location.state?.file as DriveFile | undefined;
    const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);

    if (!file) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Info className="h-8 w-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">File Not Found</h2>
                    <p className="text-gray-500 mb-6">Could not load file properties. Please return to Drive and try again.</p>
                    <button
                        onClick={() => navigate('/drive')}
                        className="w-full bg-blue-600 text-white rounded-xl py-3 font-medium hover:bg-blue-700 transition-colors"
                    >
                        Back to Drive
                    </button>
                </div>
            </div>
        );
    }

    const formatSize = (bytes?: string) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(parseInt(bytes)) / Math.log(k));
        return parseFloat((parseInt(bytes) / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };


    const getFileIcon = (file: DriveFile) => {
        if (file.is_folder) return <Folder className="h-24 w-24 text-yellow-400 fill-yellow-100" />;
        const mime = file.mimeType.toLowerCase();
        if (mime.includes('image')) return <ImageIcon className="h-24 w-24 text-red-500" />;
        if (mime.includes('video')) return <Video className="h-24 w-24 text-red-600" />;
        if (mime.includes('audio')) return <Music className="h-24 w-24 text-purple-500" />;
        if (mime.includes('pdf')) return <FileText className="h-24 w-24 text-red-500" />;
        return <FileIcon className="h-24 w-24 text-blue-500" />;
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-12">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => navigate('/drive')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors group"
                >
                    <div className="p-2 bg-white rounded-full shadow-sm group-hover:shadow-md transition-all">
                        <ArrowLeft className="h-5 w-5" />
                    </div>
                    <span className="font-medium">Back to Drive</span>
                </button>

                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-32 md:h-48 relative">
                        <div className="absolute -bottom-16 left-8 md:left-12 p-2 bg-white rounded-3xl shadow-lg">
                            <div className="h-32 w-32 flex items-center justify-center bg-gray-50 rounded-2xl">
                                {getFileIcon(file)}
                            </div>
                        </div>
                    </div>

                    <div className="pt-20 px-8 md:px-12 pb-12">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2 truncate">{file.name}</h1>
                        <p className="text-gray-500 flex items-center gap-2 mb-8">
                            <span className="font-medium px-3 py-1 bg-gray-100 rounded-full text-xs uppercase tracking-wide">
                                {file.is_folder ? 'Folder' : file.mimeType.split('/').pop()}
                            </span>
                            {file.webViewLink && (
                                <a
                                    href={file.webViewLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-600 hover:underline text-sm"
                                >
                                    Open in Drive
                                </a>
                            )}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">Properties</h3>

                                <div className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                            <HardDrive className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Size</p>
                                            <p className="font-medium text-gray-900">{file.is_folder ? '-' : formatSize(file.size)}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                                            <Calendar className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Modified</p>
                                            <p className="font-medium text-gray-900">
                                                {file.modifiedTime ? new Date(file.modifiedTime).toLocaleString() : 'Unknown'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-green-50 rounded-lg text-green-600">
                                            <Tag className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Type</p>
                                            <p className="font-medium text-gray-900 break-all">{file.mimeType}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                                            <Cpu className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">ID</p>
                                            <p className="font-mono text-xs bg-gray-50 px-2 py-1 rounded border border-gray-100 text-gray-600 break-all">
                                                {file.id}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">Actions</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    {file.webViewLink && (
                                        <button
                                            onClick={() => window.open(file.webViewLink, '_blank')}
                                            className="flex items-center justify-center gap-3 w-full p-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all group"
                                        >
                                            <Download className="h-5 w-5 text-gray-600 group-hover:text-blue-600" />
                                            <span className="font-medium text-gray-700 group-hover:text-gray-900">Open / Download</span>
                                        </button>
                                    )}

                                    <button
                                        onClick={() => setIsAgentModalOpen(true)}
                                        className="flex items-center justify-center gap-3 w-full p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl shadow-lg shadow-indigo-200 hover:shadow-xl hover:scale-[1.02] transition-all"
                                    >
                                        <Star className="h-5 w-5" />
                                        <span className="font-medium">Send to Agent</span>
                                    </button>
                                </div>

                                <AgentSelectModal
                                    isOpen={isAgentModalOpen}
                                    onClose={() => setIsAgentModalOpen(false)}
                                    filesData={file ? [{
                                        id: file.id,
                                        name: file.name,
                                        type: file.mimeType,
                                        provider: 'google' // Defaulting to google as it's the primary drive for now
                                    }] : []}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
