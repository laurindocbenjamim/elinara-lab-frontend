import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Cloud, ChevronRight,
    Search, Folder, File, FileText, Image as ImageIcon,
    Music, Video, Grid, List,
    HardDrive, Download, Info, MoreVertical, Share2, LogOut, ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { oneDriveService, authService } from '../services/api';
import { DriveFile } from '../types';
import { ConfirmationModal } from '../components/ConfirmationModal';
import '../styles/Dashboard.css';

export const OneDrive: React.FC = () => {
    const { user, checkAuth } = useAuth();
    const [files, setFiles] = useState<DriveFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null, name: string }[]>([{ id: null, name: 'My Files' }]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);
    const [isDisconnecting, setIsDisconnecting] = useState(false);
    const [disconnectError, setDisconnectError] = useState<string | null>(null);

    const isConnected = user?.providers?.['microsoft']?.connected || false;
    const connectedEmail = user?.providers?.['microsoft']?.email;

    const navigate = useNavigate();
    const location = useLocation();


    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (activeMenuId && !target.closest('.drive-menu-trigger') && !target.closest('.drive-menu-content')) {
                setActiveMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeMenuId]);

    const handleLogin = () => {
        sessionStorage.setItem('pending_drive_provider', 'microsoft');
        sessionStorage.setItem('auth_return_url', location.pathname + location.search);
        authService.microsoftLogin();
    };

    const handleDisconnect = async () => {
        setIsDisconnecting(true);
        setDisconnectError(null);
        try {
            await authService.disconnectProvider('microsoft');
            await checkAuth();
            setFiles([]);
            setIsDisconnectModalOpen(false);
        } catch (e: any) {
            console.error(e);
            setDisconnectError(e.message || 'Failed to disconnect');
        } finally {
            setIsDisconnecting(false);
        }
    };

    const [forceShowConnect, setForceShowConnect] = useState(false);

    const fetchFiles = async (folderId: string | null) => {
        setLoading(true);
        setError(null);
        setForceShowConnect(false);
        try {
            const response = await oneDriveService.listFiles(folderId || undefined);

            if (response.success) {
                setFiles(response.files || []);
            } else {
                throw new Error('Failed to load files');
            }
        } catch (err: any) {
            if (
                err.isDriveAuthError ||
                err.response?.status === 401 ||
                err.message?.includes('401') ||
                err.message?.includes('403') ||
                (err.response && err.response.status === 403) ||
                err.message?.includes('access not authorized')
            ) {
                setForceShowConnect(true);
                setFiles([]);
            } else {
                let msg = err.message || 'Error connecting to OneDrive';

                if (msg.includes('invalid_grant') || msg.includes('expired or revoked')) {
                    msg = 'Your OneDrive session has expired. Please disconnect and reconnect.';
                    setForceShowConnect(true);
                } else if (msg.startsWith("('") && msg.includes("', {")) {
                    try {
                        const parts = msg.split("',");
                        if (parts.length > 0) {
                            msg = parts[0].replace(/^\('/, '');
                        }
                    } catch (e) {
                    }
                }

                setError(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles(currentFolderId);
    }, [currentFolderId]);

    const handleFileClick = (file: DriveFile) => {
        if (file.is_folder) {
            setCurrentFolderId(file.id);
            setBreadcrumbs([...breadcrumbs, { id: file.id, name: file.name }]);
            setSearchQuery('');
        } else if (file.webViewLink) {
            window.open(file.webViewLink, '_blank');
        }
    };

    const getFileIcon = (file: DriveFile) => {
        if (file.is_folder) return <Folder className="h-6 w-6 text-zinc-400" />;

        const mime = file.mimeType.toLowerCase();
        if (mime.includes('image')) return <ImageIcon className="h-6 w-6 text-zinc-400" />;
        if (mime.includes('video')) return <Video className="h-6 w-6 text-zinc-400" />;
        if (mime.includes('audio')) return <Music className="h-6 w-6 text-zinc-400" />;
        if (mime.includes('pdf')) return <FileText className="h-6 w-6 text-zinc-400" />;
        if (mime.includes('spreadsheet') || mime.includes('excel')) return <FileText className="h-6 w-6 text-zinc-400" />;
        if (mime.includes('presentation') || mime.includes('powerpoint')) return <FileText className="h-6 w-6 text-zinc-400" />;

        return <File className="h-6 w-6 text-zinc-400" />;
    };

    const formatSize = (bytes?: string) => {
        if (!bytes) return '--';
        const n = parseInt(bytes);
        if (isNaN(n)) return bytes;
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let i = 0;
        let num = n;
        while (num >= 1024 && i < units.length - 1) {
            num /= 1024;
            i++;
        }
        return `${num.toFixed(1)} ${units[i]}`;
    };

    const filteredFiles = useMemo(() => {
        if (!files || !Array.isArray(files)) return [];
        return files.filter((f: DriveFile) =>
            f && f.name && f.name.toLowerCase().includes((searchQuery || '').toLowerCase())
        );
    }, [files, searchQuery]);

    const showFiles = isConnected && !forceShowConnect;

    return (
        <div className="dashboard-page h-[calc(100vh-4rem)] overflow-hidden flex flex-col p-6 lg:p-12 bg-[#050505]">
            <div className="max-w-7xl mx-auto w-full flex-grow flex flex-col justify-start -mt-5 z-10">
                {/* Header Section */}
                <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="text-left">
                        <h2 className="text-3xl font-bold tracking-tighter bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent uppercase">
                            OneDrive
                        </h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        {/* Drive Switcher */}
                        <div className="flex bg-white/5 border border-white/10 p-1 rounded-2xl">
                            <button
                                onClick={() => navigate('/drive')}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all text-zinc-500 hover:text-white"
                            >
                                <Cloud size={14} /> GOOGLE
                            </button>
                            <button
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all bg-white/10 text-white border border-white/10 shadow-sm"
                            >
                                <HardDrive size={14} /> ONEDRIVE
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div className="relative group min-w-[300px]">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search size={16} className="text-zinc-500 group-focus-within:text-white transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search files..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/5 border border-white/5 focus:border-white/20 focus:bg-white/[0.08] outline-none rounded-2xl py-2.5 pl-12 pr-6 text-sm text-white transition-all"
                            />
                        </div>

                        {isConnected && (
                            <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-1 rounded-2xl">
                                {connectedEmail && (
                                    <span className="text-[10px] font-bold text-zinc-500 px-3 hidden md:inline-block">
                                        {connectedEmail}
                                    </span>
                                )}
                                <button
                                    onClick={() => setIsDisconnectModalOpen(true)}
                                    className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                                    title="Disconnect"
                                >
                                    <LogOut size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                {/* Content Explorer Area */}
                <div className="flex-1 flex flex-col min-h-0 bg-transparent">
                    {!showFiles ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="max-w-md w-full bg-white/[0.03] border border-white/5 rounded-3xl p-10 text-center hover:bg-white/[0.05] transition-all duration-500">
                                <div className="h-16 w-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <HardDrive size={32} className="text-zinc-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tight">Connect OneDrive</h3>
                                <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
                                    To browse your Microsoft Cloud files, you need to sign in with Microsoft permissions.
                                </p>

                                {error && (
                                    <div className="mb-6 p-4 bg-red-500/10 text-red-400 rounded-2xl border border-red-500/20 text-xs font-medium">
                                        {error}
                                    </div>
                                )}

                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-4">
                                        <div className="dash-loader mb-4" />
                                        <p className="text-xs text-zinc-500 uppercase tracking-widest">Initializing...</p>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleLogin}
                                        disabled={loading}
                                        className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-white/5 border border-white/10 text-white rounded-2xl font-bold hover:bg-white/10 hover:border-white/20 transition-all group"
                                    >
                                        <svg className="h-5 w-5 fill-current" viewBox="0 0 23 23">
                                            <path d="M0 0h11v11H0z" fill="#f25022" /><path d="M12 0h11v11H12z" fill="#7fba00" /><path d="M0 12h11v11H0z" fill="#00a4ef" /><path d="M12 12h11v11H12z" fill="#ffb900" />
                                        </svg>
                                        <span>SIGN IN WITH MICROSOFT</span>
                                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full">
                            {/* Navigation Bar */}
                            <div className="flex items-center justify-between mb-8">
                                <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
                                    {breadcrumbs.map((crumb, idx) => (
                                        <React.Fragment key={idx}>
                                            <button
                                                onClick={() => {
                                                    const newBreadcrumbs = breadcrumbs.slice(0, idx + 1);
                                                    setBreadcrumbs(newBreadcrumbs);
                                                    setCurrentFolderId(crumb.id);
                                                    setSearchQuery('');
                                                }}
                                                className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${idx === breadcrumbs.length - 1 ? 'text-white bg-white/10' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
                                            >
                                                {crumb.name}
                                            </button>
                                            {idx < breadcrumbs.length - 1 && <ChevronRight size={12} className="text-zinc-700 flex-shrink-0" />}
                                        </React.Fragment>
                                    ))}
                                </nav>

                                <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-1 rounded-2xl">
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    >
                                        <List size={16} />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    >
                                        <Grid size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-20">
                                        <div className="dash-loader mb-4" />
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Fetching Data...</p>
                                    </div>
                                ) : error ? (
                                    <div className="text-center py-16 bg-red-500/5 rounded-3xl border border-red-500/10">
                                        <p className="text-red-400 text-sm font-medium mb-6">{error}</p>
                                        <button
                                            onClick={() => fetchFiles(currentFolderId)}
                                            className="px-6 py-2 bg-white/5 border border-white/10 text-white text-xs font-bold rounded-xl hover:bg-white/10 transition-all uppercase tracking-widest"
                                        >
                                            Try Again
                                        </button>
                                    </div>
                                ) : filteredFiles.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-32 opacity-40">
                                        <Folder size={48} className="text-zinc-500 mb-4" />
                                        <h3 className="text-sm font-bold text-white uppercase tracking-widest">Empty Directory</h3>
                                    </div>
                                ) : viewMode === 'grid' ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-8">
                                        {filteredFiles.map((file) => (
                                            <div
                                                key={file.id}
                                                onClick={() => handleFileClick(file)}
                                                className="group relative bg-white/[0.03] border border-white/5 p-6 rounded-3xl hover:bg-white/[0.06] hover:border-white/10 transition-all duration-300 cursor-pointer"
                                            >
                                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveMenuId(activeMenuId === file.id ? null : file.id);
                                                        }}
                                                        className="drive-menu-trigger p-2 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white transition-all"
                                                    >
                                                        <MoreVertical size={16} />
                                                    </button>

                                                    {activeMenuId === file.id && (
                                                        <div className="absolute right-0 top-10 w-48 bg-[#111111] border border-white/10 rounded-2xl shadow-2xl py-2 z-50 drive-menu-content animate-in fade-in zoom-in-95">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigate(`/drive/file/${file.id}`, { state: { file } });
                                                                    setActiveMenuId(null);
                                                                }}
                                                                className="w-full text-left px-4 py-2.5 text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 flex items-center gap-3 transition-colors uppercase tracking-widest"
                                                            >
                                                                <Info size={14} /> Properties
                                                            </button>
                                                            {!file.is_folder && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        navigate('/drive/cross-reference', { state: { file } });
                                                                        setActiveMenuId(null);
                                                                    }}
                                                                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 flex items-center gap-3 transition-colors uppercase tracking-widest"
                                                                >
                                                                    <Share2 size={14} /> Cross Ref
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (file.webViewLink) window.open(file.webViewLink, '_blank');
                                                                    setActiveMenuId(null);
                                                                }}
                                                                className="w-full text-left px-4 py-2.5 text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 flex items-center gap-3 transition-colors uppercase tracking-widest"
                                                            >
                                                                <Download size={14} /> Download
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col items-center text-center">
                                                    <div className="h-16 flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-500">
                                                        {getFileIcon(file)}
                                                    </div>
                                                    <p className="text-xs font-bold text-white truncate w-full px-2 uppercase tracking-tight">{file.name}</p>
                                                    <p className="text-[10px] font-bold text-zinc-500 mt-2 uppercase tracking-widest">{file.is_folder ? 'Folder' : formatSize(file.size)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden mb-8">
                                        <table className="min-w-full">
                                            <thead>
                                                <tr className="border-b border-white/5">
                                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Name</th>
                                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Modified</th>
                                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Size</th>
                                                    <th className="px-6 py-4 text-right"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/[0.03]">
                                                {filteredFiles.map((file) => (
                                                    <tr
                                                        key={file.id}
                                                        onClick={() => handleFileClick(file)}
                                                        className="hover:bg-white/[0.04] transition-all cursor-pointer group"
                                                    >
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center gap-4">
                                                                <div className="flex-shrink-0">
                                                                    {getFileIcon(file)}
                                                                </div>
                                                                <div className="text-xs font-bold text-white truncate max-w-xs uppercase tracking-tight">{file.name}</div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                                            {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : '--'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                                            {file.is_folder ? '--' : formatSize(file.size)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (file.webViewLink) window.open(file.webViewLink, '_blank');
                                                                    }}
                                                                    className="p-2 hover:bg-white/10 rounded-xl text-zinc-500 hover:text-white transition-all"
                                                                >
                                                                    <Download size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        navigate(`/drive/file/${file.id}`, { state: { file } });
                                                                    }}
                                                                    className="p-2 hover:bg-white/10 rounded-xl text-zinc-500 hover:text-white transition-all"
                                                                >
                                                                    <Info size={14} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal remains separate but follows theme */}
            <ConfirmationModal
                isOpen={isDisconnectModalOpen}
                onClose={() => setIsDisconnectModalOpen(false)}
                onConfirm={handleDisconnect}
                title="Disconnect OneDrive"
                message="Are you sure you want to disconnect your OneDrive account? You will lose access to your files here until you reconnect."
                confirmText="Disconnect"
                type="danger"
                isLoading={isDisconnecting}
                error={disconnectError}
            />
        </div>
    );
};
