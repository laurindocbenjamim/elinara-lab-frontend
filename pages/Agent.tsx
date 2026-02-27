import React, { useState } from 'react';
import { Bot, ArrowRight, ArrowLeft, Clock, FileText, Sparkles } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DefaultDashboard } from '../components/agents/DefaultDashboard';
import { IncentivosDashboard } from '../components/agents/IncentivosDashboard';
import { CronometroDashboard } from '../components/agents/CronometroDashboard';
import { FaturasDashboard } from '../components/agents/FaturasDashboard';
import { ParecerDashboard } from '../components/agents/ParecerDashboard';
import '../styles/PageLayout.css';

// Mock Agents - Refined for visual impact
const MOCK_AGENTS = [
    { id: 'incentivos', name: 'Agente Incentivos', icon: <Bot size={22} /> },
    { id: 'cronometro', name: 'Agente Cronómetro', icon: <Bot size={22} /> },
    { id: 'faturas', name: 'Agente Faturas', icon: <FileText size={22} /> },
    { id: 'parecer', name: 'Agente Parecer', icon: <Sparkles size={22} /> }
];

// Dashboard mapping
const AGENT_DASHBOARDS: Record<string, React.FC<any>> = {
    'incentivos': IncentivosDashboard,
    'cronometro': CronometroDashboard,
    'faturas': FaturasDashboard,
    'parecer': ParecerDashboard,
    // Other agents will use the DefaultDashboard by fallback
};

export const Agent: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [selectedAgent, setSelectedAgent] = useState<string | null>(location.state?.selectedAgent || null);

    // Selection View (Dashboard Inicial)
    if (!selectedAgent) {
        return (
            <div className="dashboard-page h-[calc(100vh-4rem)] overflow-hidden flex flex-col p-4 lg:p-12 bg-[#050505]">
                <div className="max-w-5xl mx-auto w-full flex-grow flex flex-col justify-start -mt-5 z-10 min-h-0 overflow-y-auto custom-scrollbar pr-2">
                    <header className="mb-8 text-left">
                        <h2 className="text-3xl font-bold tracking-tighter bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent">
                            AGENTS
                        </h2>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {MOCK_AGENTS.map((agent) => (
                            <button
                                key={agent.id}
                                onClick={() => setSelectedAgent(agent.id)}
                                className="relative overflow-hidden bg-white/[0.02] border border-white/5 rounded-3xl p-6 hover:bg-white/[0.04] hover:border-blue-500/20 transition-all duration-700 group text-left flex flex-col justify-between h-[200px]"
                            >
                                {/* Neural Mesh Background */}
                                <div className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-700">
                                    <svg width="100%" height="100%" className="absolute inset-0">
                                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
                                            <circle cx="0" cy="0" r="1" fill="white" />
                                        </pattern>
                                        <rect width="100%" height="100%" fill="url(#grid)" />
                                    </svg>
                                </div>

                                {/* Scanning Line */}
                                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                                    <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent absolute top-0 animate-[scan_4s_linear_infinite]" />
                                </div>

                                {/* Decorative Background Element */}
                                <div className="absolute top-0 right-0 -mt-4 -mr-4 h-40 w-40 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/15 transition-all duration-700" />

                                <div className="flex items-start justify-between z-10">
                                    <div className="relative p-3 rounded-2xl bg-white/5 border border-white/5 text-zinc-400 group-hover:text-blue-400 group-hover:border-blue-500/20 transition-all duration-500 shadow-xl overflow-hidden">
                                        <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/5 transition-colors duration-500" />
                                        {agent.icon}
                                    </div>

                                    {/* Abstract Activity Visual */}
                                    <div className="flex gap-1 items-end h-8">
                                        {[0.4, 0.7, 0.3, 0.9, 0.5].map((h, i) => (
                                            <div
                                                key={i}
                                                className="w-1 bg-blue-500/20 group-hover:bg-blue-400/40 transition-all duration-500 rounded-full"
                                                style={{
                                                    height: `${h * 100}%`,
                                                    animation: `pulse-height ${1 + i * 0.2}s ease-in-out infinite alternate`
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="z-10">
                                    <h3 className="text-2xl font-bold text-white uppercase tracking-tighter group-hover:translate-x-1 transition-transform duration-500">
                                        {agent.name}
                                    </h3>

                                    <div className="flex items-center gap-6 mt-5 pt-5 border-t border-white/5">
                                        {/* Original Visual Elements (No Text) */}
                                        <div className="flex gap-3 items-center">
                                            <div className="flex -space-x-1">
                                                {[1, 2, 3].map(i => (
                                                    <div key={i} className="w-2 h-2 rounded-full bg-zinc-800 border border-white/10 group-hover:border-blue-500/30 group-hover:bg-blue-500/20 transition-all duration-500" />
                                                ))}
                                            </div>
                                            <div className="h-[2px] w-12 bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-500/40 w-0 group-hover:w-full transition-all duration-1000 delay-300" />
                                            </div>
                                        </div>

                                        <div className="ml-auto opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
                                            <div className="p-2 rounded-full bg-blue-500/10 border border-blue-500/20">
                                                <ArrowRight size={14} className="text-blue-400" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Global Style for animations */}
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @keyframes scan {
                        0% { top: -10%; }
                        100% { top: 110%; }
                    }
                    @keyframes pulse-height {
                        0% { height: 20%; }
                        100% { height: 100%; }
                    }
                `}} />
            </div>
        );
    }

    // Dashboard View (Delegado aos componentes específicos)
    const activeAgent = MOCK_AGENTS.find(a => a.id === selectedAgent);
    const DashboardComponent = AGENT_DASHBOARDS[selectedAgent] || DefaultDashboard;

    return (
        <DashboardComponent
            agentId={selectedAgent}
            agentName={activeAgent?.name || 'AGENT PANEL'}
            onBack={() => setSelectedAgent(null)}
        />
    );
};
