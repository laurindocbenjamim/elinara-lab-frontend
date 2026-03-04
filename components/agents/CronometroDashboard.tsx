import React, { useEffect, useState, useCallback } from 'react';
import { Play, Square, ArrowLeft, Clock, User, Briefcase, RefreshCw, Bot, ListTree, Edit2, Check, X, Download } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import * as XLSX from 'xlsx';

interface DashboardProps {
    agentId: string;
    agentName: string;
    onBack: () => void;
}

interface HistoryItem {
    id: number;
    empresa: string;
    projeto: string;
    duracao_segundos: number;
    inicio?: string;
}

interface ActiveTimer {
    id: number;
    empresa: string;
    projeto: string;
    inicio: string;
}

export const CronometroDashboard: React.FC<DashboardProps> = ({ agentId, agentName, onBack }) => {
    const { user } = useAuth();
    const API_URL = 'http://localhost:8000/api/v1/administracao/cronometro';
    const EMAIL = user?.email || 'consultor@elinara.pt';

    const [empresa, setEmpresa] = useState('');
    const [projeto, setProjeto] = useState('');
    
    const [activeTimers, setActiveTimers] = useState<ActiveTimer[]>([]);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    
    const [clients, setClients] = useState<string[]>([]);
    const [projects, setProjects] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    const [now, setNow] = useState<Date>(new Date());

    // Edição Manual
    const [editingTimerId, setEditingTimerId] = useState<number | null>(null);
    const [editHours, setEditHours] = useState(0);
    const [editMinutes, setEditMinutes] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    const fetchHistory = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/history/${EMAIL}`);
            if (res.ok) {
                const data = await res.json();
                setHistory(data);
            }
        } catch (e) {
            console.error("Erro ao carregar histórico", e);
        }
    }, [EMAIL, API_URL]);

    const fetchSuggestions = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/suggestions/${EMAIL}`);
            if (res.ok) {
                const data = await res.json();
                setClients(data.empresas || []);
                setProjects(data.projetos || []);
            }
        } catch (e) {
            console.error("Erro ao carregar sugestões", e);
        }
    }, [EMAIL, API_URL]);

    const checkStatus = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/status/${EMAIL}`);
            if (res.ok) {
                const data = await res.json();
                setActiveTimers(Array.isArray(data) ? data : []);
            }
        } catch (e) {
            console.error("Erro ao verificar status", e);
        }
        fetchHistory();
        fetchSuggestions();
    }, [EMAIL, API_URL, fetchHistory, fetchSuggestions]);

    useEffect(() => {
        checkStatus();
    }, [checkStatus]);

    const handleStart = async () => {
        if (!empresa || !projeto) return alert("Preencha o cliente e o projeto!");
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ consultor_email: EMAIL, empresa, projeto })
            });
            if (!res.ok) {
               const err = await res.json();
               alert(err.detail || "Erro ao iniciar cronómetro");
            } else {
               setEmpresa('');
               setProjeto('');
            }
            await checkStatus();
        } catch (e) {
            alert("Erro ao conectar ao servidor. Verifique se o backend está a correr.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleStop = async (timerId: number) => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/stop`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ consultor_email: EMAIL, timer_id: timerId })
            });
            if (!res.ok) {
               const err = await res.json();
               alert(err.detail || "Erro ao parar cronómetro");
            }
            await checkStatus();
        } catch (e) {
            alert("Erro ao conectar ao servidor. Verifique se o backend está a correr.");
        } finally {
            setIsLoading(false);
        }
    };

    const startEditing = (item: HistoryItem) => {
        setEditingTimerId(item.id);
        setEditHours(Math.floor(item.duracao_segundos / 3600));
        setEditMinutes(Math.floor((item.duracao_segundos % 3600) / 60));
    };

    const cancelEditing = () => {
        setEditingTimerId(null);
    };

    const saveEditing = async (timerId: number) => {
        const totalSegundos = (editHours * 3600) + (editMinutes * 60);
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/edit`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ consultor_email: EMAIL, timer_id: timerId, duracao_segundos: totalSegundos })
            });
            if (!res.ok) {
               const err = await res.json();
               alert(err.detail || "Erro ao atualizar cronómetro");
            }
            setEditingTimerId(null);
            await checkStatus();
        } catch (e) {
            alert("Erro ao conectar ao servidor para editar.");
        } finally {
            setIsLoading(false);
        }
    };

    const formatDuration = (sec: number) => {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        return `${h}h ${m}m`;
    };

    const getElapsedDisplay = (inicioStr: string) => {
        const start = new Date(inicioStr).getTime();
        const diff = Math.max(0, Math.floor((now.getTime() - start) / 1000));
        const h = Math.floor(diff / 3600).toString().padStart(2, '0');
        const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
        const s = (diff % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    const exportToExcel = () => {
        if (history.length === 0) return alert('Não há registos para exportar.');

        // Preparar os dados para o Excel
        const dataParaExportar = history.map(item => {
            const dataInicio = item.inicio ? new Date(item.inicio) : null;
            return {
                'Cliente / Empresa': item.empresa,
                'Projeto / Tarefa': item.projeto,
                'Data': dataInicio ? dataInicio.toLocaleDateString('pt-PT') : 'N/D',
                'Hora de Início': dataInicio ? dataInicio.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : 'N/D',
                'Duração (Horas e Minutos)': formatDuration(item.duracao_segundos),
                'Duração (Decimal)': Number((item.duracao_segundos / 3600).toFixed(2)) // Útil para cálculos no Excel
            };
        });

        // Criar uma Worksheet a partir do JSON
        const ws = XLSX.utils.json_to_sheet(dataParaExportar);
        
        // Criar um novo Workbook e adicionar a Worksheet
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Registos_Tempo");
        
        // Gerar o ficheiro Excel e despoletar o download
        XLSX.writeFile(wb, `Elinara_Tempos_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    // Organizar histórico por empresa
    const groupedHistory = history.reduce((acc, item) => {
        if (!acc[item.empresa]) acc[item.empresa] = [];
        acc[item.empresa].push(item);
        return acc;
    }, {} as Record<string, HistoryItem[]>);

    return (
        <div className="min-h-screen bg-[#050505] p-4 lg:p-8 overflow-y-auto custom-scrollbar">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Header */}
                <header className="mb-6 flex items-center gap-6 text-left">
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

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
                    
                    {/* Coluna Esquerda: Novo Registo */}
                    <div className="xl:col-span-1 space-y-6">
                        <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden group shadow-2xl">
                            <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-all duration-700 pointer-events-none" />
                            
                            <div className="relative z-10 space-y-8">
                                <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                                    <div className="p-4 rounded-3xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                                        <Bot size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-lg">Nova Sessão</h3>
                                        <p className="text-zinc-500 text-xs uppercase tracking-widest mt-1">Iniciar contagem</p>
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-3 px-1">Cliente / Empresa</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                            <input 
                                                type="text"
                                                list="clients"
                                                value={empresa}
                                                onChange={(e) => setEmpresa(e.target.value)}
                                                placeholder="Escreva ou selecione..."
                                                className="w-full bg-[#0a0a0a] border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-zinc-700"
                                            />
                                            <datalist id="clients">
                                                {clients.map(c => <option key={c} value={c} />)}
                                            </datalist>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-3 px-1">Projeto / Tarefa</label>
                                        <div className="relative">
                                            <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                            <input 
                                                type="text"
                                                list="projects"
                                                value={projeto}
                                                onChange={(e) => setProjeto(e.target.value)}
                                                placeholder="Escreva ou selecione..."
                                                className="w-full bg-[#0a0a0a] border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-zinc-700"
                                            />
                                            <datalist id="projects">
                                                {projects.map(p => <option key={p} value={p} />)}
                                            </datalist>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleStart}
                                    disabled={isLoading || !empresa || !projeto}
                                    className={`w-full py-5 font-bold rounded-2xl transition-all flex items-center justify-center gap-3 text-sm tracking-[0.2em] group ${
                                        isLoading || !empresa || !projeto 
                                        ? 'bg-white/5 text-zinc-600 border border-white/5 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_40px_rgba(37,99,235,0.3)] hover:shadow-[0_0_60px_rgba(37,99,235,0.4)]'
                                    }`}
                                >
                                    <Play size={18} className="fill-current" />
                                    <span>INICIAR</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Coluna Direita: Timers Ativos e Histórico */}
                    <div className="xl:col-span-2 space-y-8">
                        
                        {/* Secção de Timers Ativos */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 shadow-xl">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className={`h-3 w-3 rounded-full ${activeTimers.length > 0 ? 'bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-zinc-700'}`} />
                                    <h3 className="text-sm font-black text-zinc-200 uppercase tracking-widest">
                                        Trabalhos em Curso
                                    </h3>
                                    {activeTimers.length > 0 && (
                                        <span className="bg-white/10 text-white px-3 py-1 rounded-full text-xs font-bold">{activeTimers.length}</span>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {activeTimers.length === 0 ? (
                                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-zinc-600 gap-4 border-2 border-dashed border-white/5 rounded-3xl">
                                        <Clock size={40} className="opacity-50" />
                                        <p className="text-xs uppercase tracking-[0.2em] font-bold opacity-70">Nenhum projeto ativo</p>
                                    </div>
                                ) : (
                                    activeTimers.map((timer) => (
                                        <div key={timer.id} className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 relative overflow-hidden group hover:border-emerald-500/50 transition-all flex flex-col justify-between min-h-[160px] shadow-lg">
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-emerald-400" />
                                            
                                            <div className="flex-1 space-y-1 pr-4">
                                                <h4 className="text-white font-bold text-lg leading-tight break-words">{timer.empresa}</h4>
                                                <p className="text-zinc-400 text-sm break-words">{timer.projeto}</p>
                                            </div>

                                            <div className="flex items-end justify-between mt-6">
                                                <div className="text-4xl font-black text-emerald-400 tracking-tighter tabular-nums drop-shadow-md">
                                                    {getElapsedDisplay(timer.inicio)}
                                                </div>
                                                <button
                                                    onClick={() => handleStop(timer.id)}
                                                    disabled={isLoading}
                                                    className="p-4 bg-red-500/10 hover:bg-red-500 border border-red-500/30 hover:border-red-500 text-red-500 hover:text-white rounded-2xl transition-all shadow-lg group/btn flex-shrink-0"
                                                    title="Parar e Guardar"
                                                >
                                                    <Square size={20} className="fill-current group-hover/btn:scale-90 transition-transform" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Secção de Histórico Organizado (Dashboard Geral) */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 shadow-xl">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 border-b border-white/5 pb-6 gap-4">
                                <div className="flex items-center gap-3">
                                    <ListTree size={20} className="text-zinc-500" />
                                    <h3 className="text-sm font-black text-zinc-200 uppercase tracking-widest">Registos Guardados</h3>
                                </div>
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <button 
                                        onClick={exportToExcel}
                                        disabled={history.length === 0}
                                        className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-xs font-bold text-emerald-400 transition-colors uppercase tracking-widest rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Exportar dados para Excel (.xlsx)"
                                    >
                                        <Download size={14} />
                                        Excel
                                    </button>
                                    <button 
                                        onClick={fetchHistory}
                                        className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-zinc-300 transition-colors uppercase tracking-widest"
                                    >
                                        <RefreshCw size={14} />
                                        Atualizar
                                    </button>
                                </div>
                            </div>

                            {Object.keys(groupedHistory).length === 0 ? (
                                <div className="py-16 text-center text-zinc-600 text-xs uppercase tracking-widest font-bold">
                                    Sem registos históricos disponíveis
                                </div>
                            ) : (
                                <div className="space-y-10">
                                    {Object.entries(groupedHistory).map(([empresaName, items]) => {
                                        // Calcular total de horas por empresa
                                        const totalSegundos = items.reduce((acc, curr) => acc + curr.duracao_segundos, 0);
                                        
                                        return (
                                        <div key={empresaName} className="space-y-4">
                                            <div className="flex items-center justify-between bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                                                <h4 className="text-lg font-black text-white flex items-center gap-3 break-words">
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                                    {empresaName}
                                                </h4>
                                                <div className="text-right">
                                                    <span className="text-xs text-zinc-500 uppercase tracking-widest block mb-1">Total Cliente</span>
                                                    <span className="text-sm font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-lg">
                                                        {formatDuration(totalSegundos)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 md:pl-8 border-l-2 border-white/5">
                                                {items.map((item) => (
                                                    <div key={item.id} className="p-5 rounded-2xl bg-[#0a0a0a] border border-white/5 flex flex-col justify-between gap-4 hover:border-white/10 transition-colors shadow-sm relative group">
                                                        
                                                        <div className="flex-1">
                                                            <div className="text-sm font-bold text-zinc-200 break-words pr-8 leading-snug">{item.projeto}</div>
                                                            {item.inicio && (
                                                                <div className="text-[10px] text-zinc-500 uppercase mt-2 font-medium">
                                                                    {new Date(item.inicio).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                                    {' • '}
                                                                    {new Date(item.inicio).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {editingTimerId === item.id ? (
                                                            <div className="flex items-center gap-2 mt-2 pt-4 border-t border-white/5">
                                                                <input 
                                                                    type="number" 
                                                                    value={editHours} 
                                                                    onChange={e => setEditHours(Number(e.target.value))} 
                                                                    className="w-16 bg-white/5 border border-white/20 rounded-lg p-2 text-white text-center font-bold text-sm focus:outline-none focus:border-blue-500"
                                                                    min="0"
                                                                />
                                                                <span className="text-zinc-500 font-bold text-xs">h</span>
                                                                
                                                                <input 
                                                                    type="number" 
                                                                    value={editMinutes} 
                                                                    onChange={e => setEditMinutes(Number(e.target.value))} 
                                                                    className="w-16 bg-white/5 border border-white/20 rounded-lg p-2 text-white text-center font-bold text-sm focus:outline-none focus:border-blue-500"
                                                                    min="0" max="59"
                                                                />
                                                                <span className="text-zinc-500 font-bold text-xs">m</span>

                                                                <div className="flex items-center gap-1 ml-auto">
                                                                    <button onClick={() => saveEditing(item.id)} className="p-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition-colors">
                                                                        <Check size={16} />
                                                                    </button>
                                                                    <button onClick={cancelEditing} className="p-2 bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white rounded-lg transition-colors">
                                                                        <X size={16} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center justify-between mt-2 pt-4 border-t border-white/5">
                                                                <span className="text-lg font-black text-zinc-300 tabular-nums">
                                                                    {formatDuration(item.duracao_segundos)}
                                                                </span>
                                                                
                                                                <button 
                                                                    onClick={() => startEditing(item)}
                                                                    className="opacity-0 group-hover:opacity-100 p-2 bg-white/5 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-all flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest"
                                                                >
                                                                    <Edit2 size={12} />
                                                                    Ajustar
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )})}
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};