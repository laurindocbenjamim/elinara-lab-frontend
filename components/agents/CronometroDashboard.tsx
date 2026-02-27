import React, { useEffect, useState, useCallback } from 'react';
import { Play, Square, ArrowLeft, Clock, User, Briefcase, RefreshCw, Bot } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface DashboardProps {
    agentId: string;
    agentName: string;
    onBack: () => void;
}

interface HistoryItem {
    empresa: string;
    projeto: string;
    duracao_segundos: number;
    inicio?: string;
}

export const CronometroDashboard: React.FC<DashboardProps> = ({ agentId, agentName, onBack }) => {
    const { user } = useAuth();
    const API_URL = 'http://localhost:8005';
    const EMAIL = user?.email || 'consultor@elinara.pt';

    const [isRunning, setIsRunning] = useState(false);
    const [empresa, setEmpresa] = useState('');
    const [projeto, setProjeto] = useState('');
    const [startTime, setStartTime] = useState<Date | null>(null);
    const [timerDisplay, setTimerDisplay] = useState('00:00:00');
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [clients, setClients] = useState<string[]>([]);
    const [projects, setProjects] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchHistory = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/history/${EMAIL}`);
            const data = await res.json();
            setHistory(data);
        } catch (e) {
            console.error("Erro ao carregar histórico", e);
        }
    }, [EMAIL, API_URL]);

    const fetchSuggestions = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/suggestions/clients/${EMAIL}`);
            const data = await res.json();
            setClients(data);
        } catch (e) {}
    }, [EMAIL, API_URL]);

    const checkStatus = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/status/${EMAIL}`);
            const data = await res.json();
            if (data.is_running) {
                setIsRunning(true);
                setEmpresa(data.empresa);
                setProjeto(data.projeto);
                setStartTime(new Date(data.inicio));
            } else {
                setIsRunning(false);
                fetchHistory();
                fetchSuggestions();
            }
        } catch (e) {
            console.error("Erro ao verificar status", e);
        }
    }, [EMAIL, API_URL, fetchHistory, fetchSuggestions]);

    useEffect(() => {
        checkStatus();
    }, [checkStatus]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRunning && startTime) {
            interval = setInterval(() => {
                const now = new Date();
                const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);
                const h = Math.floor(diff / 3600).toString().padStart(2, '0');
                const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
                const s = (diff % 60).toString().padStart(2, '0');
                setTimerDisplay(`${h}:${m}:${s}`);
            }, 1000);
        } else {
            setTimerDisplay('00:00:00');
        }
        return () => clearInterval(interval);
    }, [isRunning, startTime]);

    const handleStart = async () => {
        if (!empresa || !projeto) return alert("Preencha o cliente e o projeto!");
        setIsLoading(true);
        try {
            await fetch(`${API_URL}/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ consultor_email: EMAIL, empresa, projeto })
            });
            await checkStatus();
        } catch (e) {
            alert("Erro ao iniciar cronómetro");
        } finally {
            setIsLoading(false);
        }
    };

    const handleStop = async () => {
        setIsLoading(true);
        try {
            await fetch(`${API_URL}/stop`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ consultor_email: EMAIL })
            });
            setIsRunning(false);
            setStartTime(null);
            setEmpresa('');
            setProjeto('');
            fetchHistory();
        } catch (e) {
            alert("Erro ao parar cronómetro");
        } finally {
            setIsLoading(false);
        }
    };

    const formatDuration = (sec: number) => {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        return `${h}h ${m}m`;
    };

    return (
        <div className="dashboard-page h-[calc(100vh-4rem)] overflow-hidden flex flex-col p-4 lg:p-12 bg-[#050505]">
            <div className="max-w-4xl mx-auto w-full flex-grow flex flex-col justify-start -mt-5 z-10 min-h-0">
                
                {/* Header */}
                <header className="mb-8 flex items-center gap-6 text-left">
                    <button
                        onClick={onBack}
                        className="p-2 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all text-zinc-500 hover:text-white"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tighter bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent truncate">
                            {agentName}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Instância:</span>
                            <span className="text-[10px] font-bold text-blue-400/80 uppercase tracking-widest">Administração</span>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
                    
                    {/* Timer Main Card */}
                    <div className="bg-white/[0.03] border border-white/5 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden group">
                        {/* Background decoration */}
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-all duration-700" />
                        
                        <div className="relative z-10 text-center">
                            {!isRunning ? (
                                <div className="space-y-8">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="p-4 rounded-3xl bg-white/5 border border-white/5 text-zinc-500">
                                            <Bot size={32} />
                                        </div>
                                        <p className="text-zinc-500 font-medium uppercase tracking-[0.2em] text-[10px]">Pronto para registar</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                                        <div className="text-left">
                                            <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2 px-1">Cliente</label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                                                <input 
                                                    type="text"
                                                    list="clients"
                                                    value={empresa}
                                                    onChange={(e) => setEmpresa(e.target.value)}
                                                    placeholder="Escolha o cliente..."
                                                    className="w-full bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:outline-none focus:border-blue-500/30 transition-all"
                                                />
                                                <datalist id="clients">
                                                    {clients.map(c => <option key={c} value={c} />)}
                                                </datalist>
                                            </div>
                                        </div>
                                        <div className="text-left">
                                            <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2 px-1">Projeto</label>
                                            <div className="relative">
                                                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                                                <input 
                                                    type="text"
                                                    value={projeto}
                                                    onChange={(e) => setProjeto(e.target.value)}
                                                    placeholder="Nome do projeto..."
                                                    className="w-full bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:outline-none focus:border-blue-500/30 transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleStart}
                                        disabled={isLoading}
                                        className="w-full max-w-sm py-5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-2xl transition-all shadow-[0_0_30px_rgba(59,130,246,0.2)] flex items-center justify-center gap-3 text-xs tracking-[0.2em] group mx-auto"
                                    >
                                        <Play size={16} className="fill-current" />
                                        <span>INICIAR SESSÃO TRABALHO</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                                        <span className="text-[10px] font-bold text-red-500 uppercase tracking-[0.2em]">A gravar atividade</span>
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <h3 className="text-white text-xl font-bold tracking-tight">{empresa}</h3>
                                        <p className="text-zinc-500 text-sm">{projeto}</p>
                                    </div>

                                    <div className="text-6xl md:text-8xl font-black text-white tracking-tighter tabular-nums py-4">
                                        {timerDisplay}
                                    </div>

                                    <button
                                        onClick={handleStop}
                                        disabled={isLoading}
                                        className="w-full max-w-xs py-5 bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-3 text-xs tracking-[0.2em] mx-auto"
                                    >
                                        <Square size={16} className="fill-current" />
                                        <span>PARAR E GUARDAR</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* History Section */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                            <div className="flex items-center gap-3">
                                <RefreshCw size={16} className="text-zinc-500" />
                                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Últimos Registos</h3>
                            </div>
                            <button 
                                onClick={fetchHistory}
                                className="text-[10px] font-bold text-blue-400/70 hover:text-blue-400 transition-colors uppercase tracking-widest"
                            >
                                Atualizar
                            </button>
                        </div>

                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                            {history.length === 0 ? (
                                <div className="p-12 text-center text-zinc-600 text-xs uppercase tracking-widest">
                                    Sem registos disponíveis
                                </div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {history.map((item, i) => (
                                        <div key={i} className="p-5 flex items-center justify-between hover:bg-white/[0.01] transition-colors">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-bold text-zinc-200">{item.empresa}</span>
                                                <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">{item.projeto}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[10px] font-bold text-zinc-400 tabular-nums">
                                                    {formatDuration(item.duracao_segundos)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
