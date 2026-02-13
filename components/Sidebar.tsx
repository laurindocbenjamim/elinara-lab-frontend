import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    BrainCircuit,
    ListTodo,
    HardDrive,
    CreditCard,
    Settings,
    ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
    const location = useLocation();
    const { user } = useAuth();

    const menuItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
        { name: 'FundingDetective', icon: BrainCircuit, path: '/agent' },
        { name: 'Agent Tasks', icon: ListTodo, path: '/agent-tasks' },
        { name: 'Cloud Files', icon: HardDrive, path: '/drive' },
        { name: 'Billing', icon: CreditCard, path: '/billing' },
        { name: 'Settings', icon: Settings, path: '/profile' },
    ];

    const isActive = (path: string) => {
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    return (
        <aside className="w-64 bg-[rgba(10,10,12,0.82)] backdrop-blur-xl border-r border-white/10 hidden lg:flex flex-col sticky top-16 h-[calc(100vh-4rem)] transition-colors duration-200 overflow-y-auto">
            <div className="p-6">
                <div className="flex items-center gap-3 mb-8">
                    <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-lg">
                        <BrainCircuit className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-white leading-tight">Elite SaaS</h2>
                        <p className="text-xs text-zinc-400">Workspace</p>
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

            <div className="mt-auto p-6 border-t border-white/10">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-8 w-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white font-bold text-sm">
                            {user?.username?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-zinc-100 truncate">{user?.username}</p>
                            <p className="text-[10px] text-zinc-500 truncate capitalize">{user?.role || 'User'}</p>
                        </div>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5 mb-2">
                        <div className="bg-white h-1.5 rounded-full w-2/3"></div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-medium text-zinc-500">
                        <span>Quota Used</span>
                        <span>66%</span>
                    </div>
                </div>
            </div>
        </aside>
    );
};
