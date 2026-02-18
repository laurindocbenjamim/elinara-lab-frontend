import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Bot,
    ListTodo,
    HardDrive,
    Settings,
    ChevronRight,
    Orbit
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
    const location = useLocation();
    const { user } = useAuth();

    const fullName = `${user?.firstname || ''} ${user?.lastname || ''}`.trim() || user?.username || 'User';
    const companyName = user?.username || 'Workspace';

    const menuItems = [
        { name: 'Agents', icon: Bot, path: '/agent' },
        { name: 'Connections', icon: HardDrive, path: '/drive' },
        { name: 'Reports', icon: ListTodo, path: '/agent-tasks' },
        { name: 'Settings', icon: Settings, path: '/profile' },
    ];

    const isActive = (path: string) => {
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    return (
        <aside className="w-64 bg-[rgba(10,10,12,0.82)] backdrop-blur-xl border-r border-white/10 hidden lg:flex flex-col sticky top-16 h-[calc(100vh-4rem)] transition-colors duration-200 overflow-y-auto">
            <div className="p-6">
                <div className="flex items-center gap-3 mb-8">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                        <Orbit className="h-6 w-6 animate-[spin_10s_linear_infinite]" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-sm font-bold text-white leading-tight truncate uppercase tracking-tighter">{fullName}</h2>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest truncate">{companyName}</p>
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
                                    ? 'bg-white/10 text-white border border-white/15'
                                    : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon className={`h-5 w-5 ${active ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                                    <span className="text-sm font-medium">{item.name}</span>
                                </div>
                                {active && <ChevronRight className="h-4 w-4 text-zinc-300" />}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </aside>
    );
};
