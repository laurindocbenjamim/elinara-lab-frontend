import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Cloud, ChevronRight, Plus, HelpCircle, Layout,
    Search, Folder, File, FileText, Image as ImageIcon,
    Music, Video, Grid, List,
    HardDrive, Download, Info, MoreVertical, Trash2, Globe, Star, Clock, Users, Share2, LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { driveService, authService } from '../services/api';
import { DriveFile } from '../types';
import { ConfirmationModal } from '../components/ConfirmationModal';

export const GoogleDrive: React.FC = () => {
    const { user, checkAuth } = useAuth();
    const [files, setFiles] = useState<DriveFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null, name: string }[]>([{ id: null, name: 'My Drive' }]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);
    const [isDisconnecting, setIsDisconnecting] = useState(false);
    const [disconnectError, setDisconnectError] = useState<string | null>(null);
    // const [isConnected, setIsConnected] = useState(false); // Rely on user.providers instead

    const isConnected = user?.providers?.['google']?.connected || false;
    const connectedEmail = user?.providers?.['google']?.email;

    const navigate = useNavigate();
    const location = useLocation();

    const activeProvider = 'google';

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
        sessionStorage.setItem('pending_drive_provider', 'google');
        sessionStorage.setItem('auth_return_url', location.pathname + location.search);
        authService.googleLogin();
    };

    const handleDisconnect = async () => {
        setIsDisconnecting(true);
        setDisconnectError(null);
        try {
            await authService.disconnectProvider('google');
            await checkAuth();
            setFiles([]);
            setIsDisconnectModalOpen(false);
        } catch (e: any) {
            console.error(e);
            setDisconnectError(e.message || 'Failed to disconnect'); // Could replace this with a toast notification later
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
            const response = await driveService.listFiles(folderId || undefined);

            if (response.success) {
                setFiles(response.files || []);
            } else {
                throw new Error('Failed to load files');
            }
        } catch (err: any) {
            // Check for specific drive auth error from api.ts or 401 status
            if (
                err.isDriveAuthError ||
                err.response?.status === 401 ||
                err.message?.includes('401') ||
                err.message?.includes('403') ||
                (err.response && err.response.status === 403)
            ) {
                // Show connect screen instead of error message
                setForceShowConnect(true);
                // Optionally clear files to be safe
                setFiles([]);
            } else {
                let msg = err.message || 'Error connecting to Google Drive';

                // Parse friendly message from raw backend tuple string if present
                if (msg.includes('invalid_grant') || msg.includes('expired or revoked')) {
                    msg = 'Your Google Drive connection has expired. Please reconnect.';
                    setForceShowConnect(true); // Also show connect screen for invalid grant
                } else if (typeof msg === 'string' && msg.includes("('") && msg.includes("', {")) {
                    try {
                        const match = msg.match(/^\('([^']+)',/);
                        if (match && match[1]) {
                            msg = match[1];
                        }
                    } catch (e) {
                        console.warn('Failed to parse error tuple:', e);
                    }
                }

                setError(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch on mount or folder change
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
        if (file.is_folder) return <Folder className="h-6 w-6 text-yellow-400 fill-yellow-100" />;

        const mime = file.mimeType.toLowerCase();
        if (mime.includes('image')) return <ImageIcon className="h-6 w-6 text-red-500" />;
        if (mime.includes('video')) return <Video className="h-6 w-6 text-red-600" />;
        if (mime.includes('audio')) return <Music className="h-6 w-6 text-blue-500" />;
        if (mime.includes('pdf')) return <FileText className="h-6 w-6 text-red-600" />;
        if (mime.includes('spreadsheet') || mime.includes('excel')) return <FileText className="h-6 w-6 text-green-600" />;
        if (mime.includes('presentation') || mime.includes('powerpoint')) return <FileText className="h-6 w-6 text-orange-500" />;

        return <File className="h-6 w-6 text-blue-600" />;
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
        <div className="flex h-screen bg-[#f8f9fa] dark:bg-gray-900 overflow-hidden -mt-16 pt-16">
            {/* Workspace Sidebar */}
            <aside className="w-64 flex flex-col pt-6 px-3 bg-gray-50/50 dark:bg-gray-800/50 border-r border-gray-200 dark:border-gray-700 hidden md:flex">
                {/* Drive Switcher */}
                <div className="px-2 mb-6">
                    <div className="bg-gray-200/50 dark:bg-gray-700/50 p-1 rounded-xl flex">
                        <button
                            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all bg-white dark:bg-gray-600 dark:text-white text-blue-600 shadow-sm"
                        >
                            <Cloud className="h-4 w-4" /> Google
                        </button>
                        <button
                            onClick={() => navigate('/drive/microsoft')}
                            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            <HardDrive className="h-4 w-4" /> OneDrive
                        </button>
                    </div>
                </div>

                <button className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 hover:shadow-md border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-medium transition-all mb-8 mx-2 text-gray-700 dark:text-gray-200">
                    <Plus className="h-5 w-5 text-blue-600" />
                    New
                </button>

                <nav className="space-y-1">
                    <button
                        onClick={() => { setCurrentFolderId(null); setBreadcrumbs([{ id: null, name: 'My Drive' }]); setSearchQuery(''); }}
                        className={`w-full flex items-center gap-4 px-4 py-2 text-sm font-medium rounded-full transition-colors ${currentFolderId === null ? 'bg-blue-100/50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50'}`}
                    >
                        <Layout className="h-5 w-5" />
                        Home
                    </button>
                    <button className="w-full flex items-center gap-4 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 rounded-full transition-colors">
                        <Users className="h-5 w-5" />
                        Shared with me
                    </button>
                    <button className="w-full flex items-center gap-4 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 rounded-full transition-colors">
                        <Clock className="h-5 w-5" />
                        Recent
                    </button>
                    <button className="w-full flex items-center gap-4 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 rounded-full transition-colors">
                        <Star className="h-5 w-5" />
                        Starred
                    </button>
                    <div className="py-2"></div>
                    <button className="w-full flex items-center gap-4 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 rounded-full transition-colors">
                        <Trash2 className="h-5 w-5" />
                        Trash
                    </button>
                    <button className="w-full flex items-center gap-4 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 rounded-full transition-colors">
                        <Cloud className="h-5 w-5" />
                        Storage
                    </button>
                </nav>
            </aside>

            {/* Main Workspace Area */}
            <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-900 md:rounded-tl-3xl border-l border-t border-gray-200 dark:border-gray-800 shadow-inner">
                {/* Workspace Header */}
                <header className="px-6 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
                    <div className="flex-1 max-w-2xl px-2">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-14 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search in Drive"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-[#f1f3f4] dark:bg-gray-800 border-transparent focus:bg-white dark:focus:bg-gray-700 focus:ring-0 focus:border-transparent rounded-full py-3 pl-14 pr-6 text-base dark:text-gray-200 transition-all group-hover:bg-[#e8eaed] dark:group-hover:bg-gray-700"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {isConnected && (
                            <div className="flex items-center gap-2 mr-2">
                                {connectedEmail && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400 hidden md:inline-block">
                                        {connectedEmail}
                                    </span>
                                )}
                                <button
                                    onClick={() => setIsDisconnectModalOpen(true)}
                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                    title="Disconnect Google Drive"
                                >
                                    <LogOut className="h-5 w-5" />
                                </button>
                                <ConfirmationModal
                                    isOpen={isDisconnectModalOpen}
                                    onClose={() => setIsDisconnectModalOpen(false)}
                                    onConfirm={handleDisconnect}
                                    title="Disconnect Google Drive"
                                    message="Are you sure you want to disconnect your Google Drive account? You will lose access to your files here until you reconnect."
                                    confirmText="Disconnect"
                                    type="danger"
                                    isLoading={isDisconnecting}
                                    error={disconnectError}
                                />
                            </div>
                        )}
                        <button className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"><HelpCircle className="h-6 w-6" /></button>
                        <button className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"><HelpCircle className="h-6 w-6" /></button>
                        <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold ml-2">
                            {user?.username?.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </header>

                {/* Content Explorer */}
                <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                    {/* Access Check: If no access, show connect screen INSIDE the layout instead of blocking */}
                    {!showFiles ? (
                        <div className="flex flex-col items-center justify-center h-full pt-10">
                            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl p-10 text-center border border-gray-100 dark:border-gray-700 shadow-sm">
                                <div className={`h-20 w-20 ${activeProvider === 'google' ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-sky-50 dark:bg-sky-900/20'} rounded-2xl flex items-center justify-center mx-auto mb-8`}>
                                    <Cloud className={`h-10 w-10 ${activeProvider === 'google' ? 'text-blue-600 dark:text-blue-400' : 'text-sky-700'}`} />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Connect {activeProvider === 'google' ? 'Google Drive' : 'OneDrive'}</h2>
                                <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                                    To browse your {activeProvider === 'google' ? 'Google Workspace' : 'Microsoft Cloud'} files, you need to sign in with {activeProvider === 'google' ? 'Google' : 'Microsoft'} permissions.
                                </p>

                                {error && (
                                    <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm">
                                        {error}
                                    </div>
                                )}

                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-6">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                                        <p className="text-sm text-gray-500">Connecting...</p>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleLogin}
                                        disabled={loading}
                                        className="w-full flex items-center justify-center gap-3 py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                        </svg>
                                        Connect with Google
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between mb-6">
                                <nav className="flex items-center text-lg font-medium text-gray-700 dark:text-gray-200">
                                    {breadcrumbs.map((crumb, idx) => (
                                        <React.Fragment key={idx}>
                                            <button
                                                onClick={() => {
                                                    const newBreadcrumbs = breadcrumbs.slice(0, idx + 1);
                                                    setBreadcrumbs(newBreadcrumbs);
                                                    setCurrentFolderId(crumb.id);
                                                    setSearchQuery('');
                                                }}
                                                className={`hover:text-blue-600 px-2 py-1 rounded-lg transition-colors ${idx === breadcrumbs.length - 1 ? 'text-gray-900 dark:text-white cursor-default hover:text-gray-900 dark:hover:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                                            >
                                                {crumb.name}
                                            </button>
                                            {idx < breadcrumbs.length - 1 && <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />}
                                        </React.Fragment>
                                    ))}
                                    {breadcrumbs.length > 1 && (
                                        <div className="ml-4 flex items-center border-l border-gray-300 pl-4 h-6">
                                            <button
                                                onClick={() => {
                                                    const parentCrumb = breadcrumbs[breadcrumbs.length - 2];
                                                    setBreadcrumbs(breadcrumbs.slice(0, -1));
                                                    setCurrentFolderId(parentCrumb.id);
                                                    setSearchQuery('');
                                                }}
                                                className="text-gray-500 dark:text-gray-400 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 rounded-lg transition-colors text-sm font-medium flex items-center gap-1"
                                            >
                                                <ChevronRight className="h-4 w-4 rotate-180" /> Back
                                            </button>
                                        </div>
                                    )}
                                </nav>
                                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                                    >
                                        <List className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                                    >
                                        <Grid className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                                    <p className="mt-4 text-gray-500 font-medium">Fetching items...</p>
                                </div>
                            ) : error ? (
                                <div className="text-center py-20 bg-red-50 dark:bg-red-900/20 rounded-3xl border border-red-100 dark:border-red-800">
                                    <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
                                    <div className="flex flex-col gap-2 items-center mt-4">
                                        <button
                                            onClick={() => fetchFiles(currentFolderId)}
                                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                        >
                                            Try Again
                                        </button>
                                        {(error?.includes('expired') || error?.includes('reconnect') || error?.includes('revoked')) && (
                                            <button
                                                onClick={() => setIsDisconnectModalOpen(true)}
                                                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition-colors"
                                            >
                                                Reconnect Account
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : filteredFiles.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-32">
                                    <div className="bg-yellow-50 dark:bg-yellow-900/20 h-32 w-32 rounded-full flex items-center justify-center mb-6">
                                        <Folder className="h-16 w-16 text-yellow-200 dark:text-yellow-500/50" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">No items found</h3>
                                    <p className="text-gray-500 dark:text-gray-400 mt-2">This folder is empty or matches no search results.</p>
                                </div>
                            ) : viewMode === 'grid' ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                    {filteredFiles.map((file) => (
                                        <div
                                            key={file.id}
                                            onClick={() => handleFileClick(file)}
                                            className="group relative bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4 rounded-2xl hover:shadow-xl hover:border-blue-100 dark:hover:border-blue-900 transition-all cursor-pointer"
                                        >
                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveMenuId(activeMenuId === file.id ? null : file.id);
                                                    }}
                                                    className="drive-menu-trigger p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 shadow-sm"
                                                >
                                                    <MoreVertical className="h-4 w-4" />
                                                </button>

                                                {activeMenuId === file.id && (
                                                    <div className="absolute right-0 top-8 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-1 z-50 animate-in fade-in zoom-in-95 duration-100 drive-menu-content">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                // Removed window.alert
                                                                navigate(`/drive/file/${file.id}`, { state: { file } });
                                                                setActiveMenuId(null);
                                                            }}
                                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                                                        >
                                                            <Info className="h-4 w-4" /> Properties
                                                        </button>
                                                        {!file.is_folder && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    // Removed window.alert
                                                                    navigate('/drive/cross-reference', { state: { file } });
                                                                    setActiveMenuId(null);
                                                                }}
                                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                                                            >
                                                                <Share2 className="h-4 w-4" /> Send to Cross
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (file.webViewLink) window.open(file.webViewLink, '_blank');
                                                                setActiveMenuId(null);
                                                            }}
                                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                                                        >
                                                            <Download className="h-4 w-4" /> Download
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col items-center text-center">
                                                <div className="h-20 flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-300">
                                                    {getFileIcon(file)}
                                                </div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate w-full px-2">{file.name}</p>
                                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{file.is_folder ? 'Folder' : formatSize(file.size)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                                    <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
                                        <thead className="bg-gray-50/50 dark:bg-gray-900/50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Modified</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Size</th>
                                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {filteredFiles.map((file) => (
                                                <tr
                                                    key={file.id}
                                                    onClick={() => handleFileClick(file)}
                                                    className="hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer group"
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 mr-3">
                                                                {getFileIcon(file)}
                                                            </div>
                                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate max-w-xs">{file.name}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                        {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : '--'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                        {file.is_folder ? '--' : formatSize(file.size)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (file.webViewLink) window.open(file.webViewLink, '_blank');
                                                                }}
                                                                className="p-1.5 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm rounded-lg text-gray-500 dark:text-gray-400"
                                                            >
                                                                <Download className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigate(`/drive/file/${file.id}`, { state: { file } });
                                                                }}
                                                                className="p-1.5 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm rounded-lg text-gray-500 dark:text-gray-400"
                                                            >
                                                                <Info className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main >

        </div >
    );
};
