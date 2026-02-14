import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    BrainCircuit,
    ListTodo,
    HardDrive,
    CreditCard,
    Settings,
    ChevronRight,
    Plus,
    Loader2,
    Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { processesService } from '../services/api';
import { Process } from '../types';

export const Sidebar: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();

    const menuItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
        { name: 'Cloud Files', icon: HardDrive, path: '/drive' },
        { name: 'Billing', icon: CreditCard, path: '/billing' },
        { name: 'Settings', icon: Settings, path: '/profile' },
        { name: 'Agent Actions', icon: Activity, path: '/agent-actions' },
    ];

    const [processes, setProcesses] = React.useState<Process[]>([]);
    const [isCreating, setIsCreating] = React.useState(false);

    React.useEffect(() => {
        const fetchProcesses = async () => {
            try {
                const data = await processesService.list();
                setProcesses(Array.isArray(data) ? data : (data as any).processes || []);
            } catch (err) {
                console.error('Failed to fetch processes', err);
            }
        };
        fetchProcesses();
    }, []);

    const handleCreateAgent = async () => {
        setIsCreating(true);
        try {
            const newProcess = await processesService.create({
                name: `Agent ${processes.length + 1}`,
                trigger_type: 'manual',
                config_snapshot: {}
            });
            setProcesses([newProcess, ...processes]);
            navigate(`/agent/${newProcess.id}`);
        } catch (err) {
            console.error('Failed to create agent', err);
        } finally {
            setIsCreating(false);
        }
    };

    const [editingId, setEditingId] = React.useState<number | null>(null);
    const [editName, setEditName] = React.useState('');

    const handleStartEdit = (e: React.MouseEvent, process: Process) => {
        e.preventDefault();
        e.stopPropagation();
        setEditingId(process.id);
        setEditName(process.name);
    };

    const handleSaveEdit = async () => {
        if (!editingId) return;
        try {
            await processesService.update(editingId, { name: editName });
            setProcesses(processes.map(p => p.id === editingId ? { ...p, name: editName } : p));
            setEditingId(null);
        } catch (err) {
            console.error('Failed to update process name', err);
            setEditingId(null);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSaveEdit();
        } else if (e.key === 'Escape') {
            setEditingId(null);
        }
    };

    const isActive = (path: string) => {
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    return (
        <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 hidden lg:flex flex-col sticky top-16 h-[calc(100vh-4rem)] transition-colors duration-200 overflow-y-auto">
            <div className="p-6">
                <div className="flex items-center gap-3 mb-8">
                    <div className="h-10 w-10 rounded-xl bg-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
                        <BrainCircuit className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">Elite SaaS</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Workspace</p>
                    </div>
                </div>

                <nav className="space-y-1">
                    {menuItems.map((item) => {
                        const active = isActive(item.path);
                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group ${active
                                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                                    : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-gray-200'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon className={`h-5 w-5 ${active ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />
                                    <span className="text-sm font-medium">{item.name}</span>
                                </div>
                                {active && <ChevronRight className="h-4 w-4" />}
                            </Link>
                        );
                    })}

                    <div className="pt-4 pb-2">
                        <div className="flex items-center justify-between px-3 mb-2">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Your Agents</span>
                            <button
                                onClick={handleCreateAgent}
                                disabled={isCreating}
                                className="p-1 hover:bg-primary-50 dark:hover:bg-primary-900/30 text-primary-600 rounded-lg transition-colors disabled:opacity-50"
                                title="Create New Agent"
                            >
                                {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                            </button>
                        </div>
                        <div className="space-y-1">
                            {processes.map((process) => {
                                const path = `/agent/${process.id}`;
                                const active = isActive(path);
                                const isEditing = editingId === process.id;

                                return (
                                    <div
                                        key={process.id}
                                        onDoubleClick={(e) => handleStartEdit(e, process)}
                                        className="relative"
                                    >
                                        {isEditing ? (
                                            <div className="px-3 py-2">
                                                <input
                                                    autoFocus
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    onBlur={handleSaveEdit}
                                                    onKeyDown={handleKeyPress}
                                                    className="w-full bg-white dark:bg-gray-700 border border-primary-500 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:text-white shadow-sm"
                                                />
                                            </div>
                                        ) : (
                                            <Link
                                                to={path}
                                                className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group ${active
                                                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                                                    : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-gray-200'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <BrainCircuit className={`h-5 w-5 ${active ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />
                                                    <span className="text-sm font-medium truncate max-w-[120px]">{process.name}</span>
                                                </div>
                                                {active && <ChevronRight className="h-4 w-4" />}
                                            </Link>
                                        )}
                                    </div>
                                );
                            })}
                            {processes.length === 0 && !isCreating && (
                                <p className="px-3 py-2 text-xs text-gray-500 italic">No agents created yet.</p>
                            )}
                        </div>
                    </div>

                    <Link
                        to="/agent-tasks"
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group ${isActive('/agent-tasks')
                            ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                            : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-gray-200'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <ListTodo className={`h-5 w-5 ${isActive('/agent-tasks') ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />
                            <span className="text-sm font-medium">Agent Tasks</span>
                        </div>
                        {isActive('/agent-tasks') && <ChevronRight className="h-4 w-4" />}
                    </Link>
                </nav>
            </div>

            <div className="mt-auto p-6 border-t border-gray-200 dark:border-gray-700">
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold text-sm">
                            {user?.username?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{user?.username}</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate capitalize">{user?.role || 'User'}</p>
                        </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-2">
                        <div className="bg-primary-600 h-1.5 rounded-full w-2/3"></div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-medium text-gray-500 dark:text-gray-400">
                        <span>Quota Used</span>
                        <span>66%</span>
                    </div>
                </div>
            </div>
        </aside>
    );
};
