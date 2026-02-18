import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/api';
import { AuthStatus } from '../types';
import { LogOut, User as UserIcon, Building2, Mail, Smartphone, ShieldCheck, ArrowRight, Eye, EyeOff } from 'lucide-react';
import '../styles/PageLayout.css';

export const Profile: React.FC = () => {
    const { user, status, logout, checkAuth } = useAuth();
    const [formData, setFormData] = useState({
        companyName: '',
        personName: '',
        email: '',
        phone: '',
        agentKey: ''
    });
    const [showKey, setShowKey] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (user) {
            setFormData({
                companyName: user.username || '',
                personName: `${user.firstname || ''} ${user.lastname || ''}`.trim() || user.username || '',
                email: user.email || '',
                phone: user.phone || '',
                agentKey: ''
            });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await userService.updateUser(user!.id, {
                email: formData.email,
                phone: formData.phone,
                firstname: formData.personName.split(' ')[0],
                lastname: formData.personName.split(' ').slice(1).join(' ')
            });
            setMessage({ type: 'success', text: 'Settings updated' });
            setTimeout(() => setMessage(null), 3000);
            await checkAuth();
        } catch (error: any) {
            setMessage({ type: 'error', text: 'Failed to save' });
        } finally {
            setLoading(false);
        }
    };

    if (status === AuthStatus.LOADING || status === AuthStatus.IDLE) {
        return <div className="dashboard-page flex items-center justify-center h-screen bg-[#050505]"><div className="dash-loader" /></div>;
    }

    return (
        <div className="dashboard-page h-[calc(100vh-4rem)] overflow-hidden flex flex-col p-6 lg:p-12 bg-[#050505]">
            <div className="max-w-5xl mx-auto w-full flex-grow flex flex-col justify-start -mt-5 z-10">
                
                {/* Header - Left Aligned Minimalist */}
                <header className="mb-6 text-left">
                    <h2 className="text-3xl font-bold tracking-tighter bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent">
                        SETTINGS
                    </h2>
                </header>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Name Card */}
                    <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 hover:bg-white/[0.05] transition-all duration-500 group">
                        <div className="flex items-center gap-2 mb-2 text-zinc-500 group-hover:text-zinc-400 transition-colors">
                            <UserIcon size={14} />
                            <span className="text-[11px] font-medium">Your Name</span>
                        </div>
                        <input 
                            name="personName" 
                            value={formData.personName} 
                            onChange={handleChange}
                            className="w-full bg-transparent border-0 outline-none focus:outline-none focus:ring-0 focus:border-0 shadow-none appearance-none p-0 m-0 text-xl font-bold text-white" 
                        />
                    </div>

                    {/* Company Card */}
                    <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 hover:bg-white/[0.05] transition-all duration-500 group">
                        <div className="flex items-center gap-2 mb-2 text-zinc-500 group-hover:text-zinc-400 transition-colors">
                            <Building2 size={14} />
                            <span className="text-[11px] font-medium">Company Name</span>
                        </div>
                        <input 
                            name="companyName" 
                            value={formData.companyName} 
                            onChange={handleChange}
                            className="w-full bg-transparent border-0 outline-none focus:outline-none focus:ring-0 focus:border-0 shadow-none appearance-none p-0 m-0 text-xl font-bold text-white" 
                        />
                    </div>

                    {/* Email Card */}
                    <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 hover:bg-white/[0.05] transition-all duration-500 group">
                        <div className="flex items-center gap-2 mb-2 text-zinc-500 group-hover:text-zinc-400 transition-colors">
                            <Mail size={14} />
                            <span className="text-[11px] font-medium">Email Address</span>
                        </div>
                        <input 
                            name="email" 
                            value={formData.email} 
                            onChange={handleChange}
                            className="w-full bg-transparent border-0 outline-none focus:outline-none focus:ring-0 focus:border-0 shadow-none appearance-none p-0 m-0 text-xl font-bold text-white" 
                        />
                    </div>

                    {/* Phone Card */}
                    <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 hover:bg-white/[0.05] transition-all duration-500 group">
                        <div className="flex items-center gap-2 mb-2 text-zinc-500 group-hover:text-zinc-400 transition-colors">
                            <Smartphone size={14} />
                            <span className="text-[11px] font-medium">Phone Number</span>
                        </div>
                        <input 
                            name="phone" 
                            value={formData.phone} 
                            onChange={handleChange}
                            className="w-full bg-transparent border-0 outline-none focus:outline-none focus:ring-0 focus:border-0 shadow-none appearance-none p-0 m-0 text-xl font-bold text-white" 
                        />
                    </div>

                    {/* Activation Key Card */}
                    <div className="md:col-span-2 bg-white/[0.03] border border-white/5 rounded-3xl p-6 group hover:border-blue-500/30 transition-all duration-500">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3 text-blue-400/80">
                                <ShieldCheck size={16} />
                                <span className="text-[11px] font-medium">Master Access Key</span>
                            </div>
                            <button 
                                type="button"
                                onClick={() => setShowKey(!showKey)}
                                className="text-zinc-500 hover:text-blue-400 transition-colors"
                            >
                                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        <input 
                            name="agentKey" 
                            type={showKey ? "text" : "password"}
                            value={formData.agentKey} 
                            onChange={handleChange}
                            className="w-full bg-transparent border-0 outline-none focus:outline-none focus:ring-0 focus:border-0 shadow-none appearance-none p-0 m-0 text-2xl font-mono font-bold text-white tracking-widest placeholder:text-zinc-800" 
                            placeholder="ELINARA-XXXX-XXXX"
                        />
                    </div>
                </form>

                {/* Footer Actions */}
                <div className="mt-8 flex items-center justify-between gap-6 w-full">
                    <button 
                        onClick={logout}
                        className="px-10 py-4 bg-white/5 border border-white/10 text-white font-medium rounded-2xl hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-500 transition-all flex items-center gap-3 text-sm group"
                    >
                        <LogOut size={18} className="group-hover:-translate-x-1 transition-transform"/>
                        <span>LOGOUT</span>
                    </button>

                    <button 
                        type="submit" 
                        onClick={handleSubmit}
                        className="px-10 py-4 bg-white/5 border border-white/10 text-white font-medium rounded-2xl hover:bg-green-500/10 hover:border-green-500/50 hover:text-green-500 transition-all flex items-center gap-3 text-sm group"
                    >
                        {loading ? 'Syncing...' : (
                            <>
                                <span>SAVE CHANGES</span>
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
                            </>
                        )}
                    </button>
                </div>

                {message && (
                    <div className={`mt-6 text-center text-xs font-medium ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                        {message.text}
                    </div>
                )}
            </div>
        </div>
    );
};
