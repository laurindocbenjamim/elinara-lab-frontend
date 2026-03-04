import React, { useState, useEffect } from 'react';
import { 
    ArrowLeft, Zap, Link2, Link2Off, RefreshCw, Search, Sparkles, 
    ChevronRight, ChevronLeft, Play, Terminal, Copy, AlertCircle, CheckCircle2, Bot, Trash2
} from 'lucide-react';

interface DashboardProps {
    agentId: string;
    agentName: string;
    onBack: () => void;
}

interface Option { value: string; text: string; }
interface Field { id: string; label: string; type: string; options?: Option[]; }
interface Section { nome: string; campos: Field[]; }

export const CandidaturaDashboard: React.FC<DashboardProps> = ({ agentId, agentName, onBack }) => {
    const [sections, setSections] = useState<Section[]>([]);
    const [activeSectionIdx, setActiveSectionIdx] = useState(0);
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [isPortalOnline, setIsPortalOnline] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isMapping, setIsMapping] = useState(false);
    const [isInjecting, setIsInjecting] = useState(false);
    const [showBridgeModal, setShowBridgeModal] = useState(false);
    const [bridgeScript, setBridgeScript] = useState("");
    const [copied, setCopied] = useState(false);

    // 1. Monitorização do Portal e Estrutura
    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await fetch('http://localhost:8000/api/v1/incentivos/preencher_candidatura/check-portal');
                const data = await res.json();
                setIsPortalOnline(data.online);

                if (data.online) {
                    const structRes = await fetch('http://localhost:8000/api/v1/incentivos/preencher_candidatura/obter-estrutura');
                    const structData = await structRes.json();
                    if (structData.separadores) setSections(structData.separadores);
                }
            } catch (e) {}
        };

        const interval = setInterval(checkStatus, 3000);
        return () => clearInterval(interval);
    }, []);

    // 2. Setup Inicial
    useEffect(() => {
        const init = async () => {
            try {
                const res = await fetch('http://localhost:8000/api/v1/incentivos/preencher_candidatura/obter-scraper');
                const data = await res.json();
                setBridgeScript(data.script);
            } catch (e) {}
            setIsLoading(false);
        };
        init();
    }, []);

    const handleStartMapping = async () => {
        setIsMapping(true);
        await fetch('http://localhost:8000/api/v1/incentivos/preencher_candidatura/send-command', {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ command: 'NAVIGATE_AND_MAP' })
        });
    };

    const handleReset = async () => {
        if (!confirm("Deseja apagar a estrutura capturada?")) return;
        await fetch('http://localhost:8000/api/v1/incentivos/preencher_candidatura/reset-estrutura');
        setSections([]);
    };

    const handleInject = async () => {
        setIsInjecting(true);
        await fetch('http://localhost:8000/api/v1/incentivos/preencher_candidatura/send-command', {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ command: 'INJECT', payload: formData })
        });
        setTimeout(() => setIsInjecting(false), 3000);
    };

    if (isLoading) return <div className="h-screen bg-[#050505] flex items-center justify-center"><RefreshCw className="animate-spin text-blue-500" size={40} /></div>;

    const activeSection = sections[activeSectionIdx];

    return (
        <div className="min-h-screen bg-[#050505] flex overflow-hidden">
            
            <aside className="w-80 bg-white/[0.01] border-r border-white/5 flex flex-col p-6 overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                    <button onClick={onBack} className="p-2 bg-white/5 rounded-xl text-zinc-500 hover:text-white transition-all"><ArrowLeft size={18} /></button>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${isPortalOnline ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border-rose-500/20 bg-rose-500/10 text-rose-500'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${isPortalOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                        <span className="text-[9px] font-black uppercase tracking-widest">{isPortalOnline ? 'Link Ativo' : 'Offline'}</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                    <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">DNA da Candidatura</h3>
                    {sections.length === 0 ? (
                        <div className="py-12 flex flex-col items-center justify-center text-center opacity-30 grayscale"><Bot size={40} /><p className="text-[9px] font-bold uppercase mt-4">Vazio</p></div>
                    ) : (
                        sections.map((s, idx) => (
                            <button key={idx} onClick={() => { setActiveSectionIdx(idx); setIsMapping(false); }} className={`w-full text-left p-4 rounded-2xl transition-all flex items-center gap-4 ${activeSectionIdx === idx ? 'bg-blue-600/10 border border-blue-500/20 text-blue-400 shadow-lg shadow-blue-500/5' : 'text-zinc-500 hover:bg-white/5'}`}>
                                <span className="text-[10px] font-black">{idx + 1}</span>
                                <span className="text-[10px] font-bold truncate uppercase">{s.nome}</span>
                            </button>
                        ))
                    )}
                </div>

                <div className="mt-6 pt-6 border-t border-white/5 space-y-3">
                    {!isPortalOnline ? (
                        <button onClick={() => setShowBridgeModal(true)} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3">
                            <Zap size={14} fill="currentColor" /> Ligar ao Portal
                        </button>
                    ) : (
                        <button onClick={handleStartMapping} disabled={isMapping} className="w-full py-4 bg-white/5 hover:bg-white/10 text-blue-400 border border-blue-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3">
                            {isMapping ? <RefreshCw className="animate-spin" size={14} /> : <Search size={14} />}
                            {isMapping ? 'Processando...' : 'Mapear Tudo'}
                        </button>
                    )}
                    {sections.length > 0 && <button onClick={handleReset} className="w-full py-3 text-[9px] font-bold text-rose-500/50 hover:text-rose-500 uppercase tracking-widest flex items-center justify-center gap-2 transition-all"><Trash2 size={12} /> Limpar</button>}
                </div>
            </aside>

            <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.03),transparent)]">
                {activeSection ? (
                    <>
                        <header className="h-24 border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl flex items-center justify-between px-12 z-20">
                            <div>
                                <h2 className="text-xl font-bold tracking-tighter text-white uppercase">{activeSection.nome}</h2>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Sincronização em Tempo Real</p>
                            </div>
                            <button className="px-6 py-2.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-amber-500/20 transition-all">
                                <Sparkles size={14} /> Auditor IA
                            </button>
                        </header>

                        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                            <div className="max-w-4xl space-y-12">
                                {activeSection.campos.map((f) => (
                                    <div key={f.id} className="space-y-4 group">
                                        <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest block">{f.label}</label>
                                        
                                        {f.type === 'select' ? (
                                            <div className="relative">
                                                <select 
                                                    value={formData[f.id] || ''}
                                                    onChange={(e) => setFormData({...formData, [f.id]: e.target.value})}
                                                    className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-5 text-sm text-zinc-300 focus:outline-none focus:border-blue-500/30 appearance-none [color-scheme:dark]"
                                                >
                                                    <option value="">Selecione uma opção do portal...</option>
                                                    {f.options?.map(opt => <option key={opt.value} value={opt.value}>{opt.text}</option>)}
                                                </select>
                                                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-600"><ChevronRight size={16} className="rotate-90" /></div>
                                            </div>
                                        ) : f.type === 'textarea' ? (
                                            <textarea 
                                                value={formData[f.id] || ''}
                                                onChange={(e) => setFormData({...formData, [f.id]: e.target.value})}
                                                className="w-full bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 text-sm text-zinc-300 min-h-[250px] focus:outline-none focus:border-blue-500/30 resize-none leading-relaxed"
                                                placeholder="Texto livre..."
                                            />
                                        ) : (
                                            <input 
                                                type="text"
                                                value={formData[f.id] || ''}
                                                onChange={(e) => setFormData({...formData, [f.id]: e.target.value})}
                                                className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-5 text-sm text-zinc-300 focus:outline-none focus:border-blue-500/30"
                                                placeholder="Introduza o valor..."
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <footer className="h-24 border-t border-white/5 px-12 flex items-center justify-between bg-[#050505]">
                            <button disabled={activeSectionIdx === 0} onClick={() => setActiveSectionIdx(prev => prev - 1)} className="text-[10px] font-black text-zinc-500 hover:text-white flex items-center gap-2 uppercase tracking-widest disabled:opacity-20 transition-all"><ChevronLeft size={16} /> Anterior</button>
                            <button onClick={handleInject} disabled={!isPortalOnline || isInjecting} className="bg-blue-600 hover:bg-blue-500 text-white px-12 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_40px_rgba(37,99,235,0.3)] flex items-center gap-3 disabled:opacity-30 transition-all active:scale-95">
                                {isInjecting ? <RefreshCw className="animate-spin" size={14} /> : <Play size={14} fill="currentColor" />}
                                {isInjecting ? 'A Injetar...' : 'Injetar no Portal'}
                            </button>
                            <button disabled={activeSectionIdx === sections.length - 1} onClick={() => setActiveSectionIdx(prev => prev + 1)} className="text-[10px] font-black text-zinc-500 hover:text-white flex items-center gap-2 uppercase tracking-widest disabled:opacity-20 transition-all">Próximo <ChevronRight size={16} /></button>
                        </footer>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-10">
                        <Bot size={120} className="text-zinc-800" strokeWidth={0.5} />
                        <div className="max-w-md space-y-4">
                            <h2 className="text-3xl font-bold text-white uppercase tracking-tighter">{isPortalOnline ? 'Portal Ligado' : 'Aguardando Ligação'}</h2>
                            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.3em] leading-relaxed">
                                {isPortalOnline ? 'O Robô está pronto. Clique em "Mapear Tudo" para carregar a estrutura.' : 'Cole o script no Balcão dos Fundos para começar.'}
                            </p>
                        </div>
                        {!isPortalOnline && <button onClick={() => setShowBridgeModal(true)} className="px-12 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl transition-all">Obter Script 3.2</button>}
                    </div>
                )}
            </main>

            {showBridgeModal && (
                <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-6">
                    <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-2xl rounded-[3rem] p-12 space-y-10 animate-in zoom-in-95">
                        <header className="flex justify-between items-center">
                            <h3 className="text-2xl font-bold text-white uppercase tracking-tighter">Ativar Robô Elinara</h3>
                            <button onClick={() => setShowBridgeModal(false)} className="text-zinc-500 hover:text-white"><ArrowLeft size={24}/></button>
                        </header>
                        <div className="space-y-8">
                            <div className="bg-black/60 rounded-3xl p-8 font-mono text-[10px] text-zinc-600 border border-white/5 max-h-[250px] overflow-y-auto custom-scrollbar leading-relaxed">
                                <pre className="whitespace-pre-wrap">{bridgeScript}</pre>
                            </div>
                            <button onClick={() => { navigator.clipboard.writeText(bridgeScript); setCopied(true); setTimeout(()=>setCopied(false), 2000); }} className="w-full py-6 bg-white/5 hover:bg-white/10 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-widest border border-white/10 transition-all flex items-center justify-center gap-4">
                                {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                                {copied ? 'Copiado!' : 'Copiar Código v3.2'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
