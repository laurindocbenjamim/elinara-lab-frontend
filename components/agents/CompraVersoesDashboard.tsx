import React, { useState, useRef } from 'react';
import { ArrowLeft, FileText, RefreshCw, LayoutTemplate, SplitSquareHorizontal, Layers, Play, Search, Check, X, Download } from 'lucide-react';

interface DashboardProps {
    agentId: string;
    agentName: string;
    onBack: () => void;
}

export const CompraVersoesDashboard: React.FC<DashboardProps> = ({ agentId, agentName, onBack }) => {
    const [fileV1, setFileV1] = useState<File | null>(null);
    const [fileV2, setFileV2] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // UI States
    const [diffLines, setDiffLines] = useState<string[]>([]);
    const [stats, setStats] = useState({ additions: 0, deletions: 0, total: 0 });
    const [currentChangeIndex, setCurrentChangeIndex] = useState(-1);
    
    // Referências
    const fileV1Ref = useRef<HTMLInputElement>(null);
    const fileV2Ref = useRef<HTMLInputElement>(null);
    const changeRefs = useRef<(HTMLSpanElement | null)[]>([]);

    const handleProcess = async () => {
        if (!fileV1 || !fileV2) {
            return alert("Por favor, carregue as duas versões (V1 e V2) do documento.");
        }

        setIsProcessing(true);
        setDiffLines([]);

        const formData = new FormData();
        formData.append('file_v1', fileV1);
        formData.append('file_v2', fileV2);

        try {
            const response = await fetch('http://localhost:8000/api/v1/auditoria/compra_versoes/compare', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                let errorMsg = "Falha ao processar os documentos.";
                try {
                    const errorData = await response.json();
                    if (errorData.detail) errorMsg = errorData.detail;
                } catch (e) {}
                throw new Error(errorMsg);
            }
            
            const data = await response.json();
            
            // Computar estatísticas
            let add = 0;
            let del = 0;
            data.diff_full.forEach((line: string) => {
                if (line.startsWith('+ ')) add++;
                if (line.startsWith('- ')) del++;
            });

            setStats({ additions: add, deletions: del, total: add + del });
            setDiffLines(data.diff_full);
            setCurrentChangeIndex(-1);

        } catch (error: any) {
            console.error(error);
            alert(`Erro na auditoria: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const scrollToChange = (index: number) => {
        if (index < 0 || index >= stats.total) return;
        setCurrentChangeIndex(index);
        
        const el = changeRefs.current[index];
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const nextChange = () => scrollToChange(currentChangeIndex + 1);
    const prevChange = () => scrollToChange(currentChangeIndex - 1);

    // Renderer do Diff
    const renderDocument = () => {
        let changeCounter = 0;

        return diffLines.map((line, idx) => {
            const type = line.charAt(0);
            const text = line.substring(2);

            if (type === '?') return null;

            if (type === ' ') {
                if (text.includes('--- PAGE')) {
                    return (
                        <div key={idx} className="my-8 py-4 border-t border-white/5 text-center w-full">
                            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.3em] bg-[#0a0a0a] px-4 rounded-full">
                                {text.replace(/-/g, '').trim()}
                            </span>
                        </div>
                    );
                } else if (text.startsWith('[TABELA]')) {
                    return (
                        <div key={idx} className="font-mono text-xs text-zinc-400 bg-white/[0.02] p-2 border border-white/5 rounded my-1 break-words w-full">
                            {text.replace('[TABELA] ', '') || '\u00A0'}
                        </div>
                    );
                } else {
                    return (
                        <div key={idx} className="min-h-[1.5em] text-zinc-300 leading-relaxed break-words w-full">
                            {text || '\u00A0'}
                        </div>
                    );
                }
            } else {
                const currentIndex = changeCounter;
                changeCounter++;
                const isAddition = type === '+';
                const isActive = currentIndex === currentChangeIndex;

                return (
                    <span 
                        key={idx} 
                        ref={el => changeRefs.current[currentIndex] = el}
                        className={`inline mr-1 my-0.5 rounded px-1 transition-all duration-300 break-words cursor-pointer ${
                            isAddition 
                            ? `bg-emerald-500/20 text-emerald-300 ${isActive ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-[#0a0a0a]' : ''}`
                            : `bg-rose-500/20 text-rose-300 line-through decoration-rose-500/50 ${isActive ? 'ring-2 ring-rose-400 ring-offset-2 ring-offset-[#0a0a0a]' : ''}`
                        }`}
                        onClick={() => setCurrentChangeIndex(currentIndex)}
                    >
                        {text}{' '}
                    </span>
                );
            }
        });
    };

    // Sidebar Items Renderer
    const renderSidebarChanges = () => {
        let changeCounter = 0;
        
        return diffLines.map((line, idx) => {
            const type = line.charAt(0);
            if (type === '+' || type === '-') {
                const text = line.substring(2);
                const currentIndex = changeCounter;
                changeCounter++;
                const isAddition = type === '+';
                const isActive = currentIndex === currentChangeIndex;

                return (
                    <button
                        key={idx}
                        onClick={() => scrollToChange(currentIndex)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 mb-3 block ${
                            isActive 
                            ? (isAddition ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30')
                            : 'bg-[#0a0a0a] border-white/5 hover:bg-white/[0.02]'
                        }`}
                    >
                        <div className={`text-[9px] font-black uppercase tracking-widest mb-2 px-2 py-0.5 inline-block rounded-md ${
                            isAddition ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                            {isAddition ? 'Adição' : 'Remoção'}
                        </div>
                        <div className="text-xs text-zinc-300 line-clamp-2 leading-relaxed font-medium break-words">
                            {text}
                        </div>
                    </button>
                );
            }
            return null;
        });
    };

    return (
        <div className="min-h-screen bg-[#050505] p-4 lg:p-8 overflow-y-auto custom-scrollbar">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header - Padrão Elinara Labs */}
                <header className="flex items-center gap-6 text-left">
                    <button
                        onClick={onBack}
                        className="p-2 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all text-zinc-500 hover:text-white"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div className="flex-1 flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold tracking-tighter bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent truncate">
                                {agentName}
                            </h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Instância:</span>
                                <span className="text-[10px] font-bold text-blue-400/80 uppercase tracking-widest">Auditoria</span>
                            </div>
                        </div>
                        
                        {diffLines.length > 0 && (
                            <div className="flex items-center gap-3">
                                <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-zinc-300">
                                    {currentChangeIndex + 1} / {stats.total}
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={prevChange} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
                                        <ArrowLeft size={16} />
                                    </button>
                                    <button onClick={nextChange} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
                                        <ArrowLeft size={16} className="rotate-180" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">

                    {/* Coluna Esquerda: Zona de Upload / Log de Alterações */}
                    <div className="xl:col-span-1 space-y-6">
                        
                        {/* Setup Card */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden group shadow-2xl flex flex-col">
                            <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-all duration-700 pointer-events-none" />

                            <div className="relative z-10 space-y-6">
                                <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                                    <div className="p-4 rounded-3xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                                        <SplitSquareHorizontal size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-lg">Documentos</h3>
                                        <p className="text-zinc-500 text-xs uppercase tracking-widest mt-1">Comparação de Versões</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <input type="file" accept=".pdf,.docx" ref={fileV1Ref} onChange={(e) => setFileV1(e.target.files?.[0] || null)} className="hidden" />
                                    <button onClick={() => fileV1Ref.current?.click()} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${fileV1 ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/10 bg-[#0a0a0a] hover:bg-white/[0.02]'}`}>
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`p-2 rounded-lg ${fileV1 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-zinc-500'}`}>
                                                <FileText size={16} />
                                            </div>
                                            <div className="text-left min-w-0">
                                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">V1 (Original)</p>
                                                <p className="text-xs font-bold truncate text-zinc-400 mt-0.5">{fileV1 ? fileV1.name : 'Selecionar Documento'}</p>
                                            </div>
                                        </div>
                                    </button>

                                    <input type="file" accept=".pdf,.docx" ref={fileV2Ref} onChange={(e) => setFileV2(e.target.files?.[0] || null)} className="hidden" />
                                    <button onClick={() => fileV2Ref.current?.click()} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${fileV2 ? 'border-blue-500/30 bg-blue-500/5' : 'border-white/10 bg-[#0a0a0a] hover:bg-white/[0.02]'}`}>
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`p-2 rounded-lg ${fileV2 ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-zinc-500'}`}>
                                                <Layers size={16} />
                                            </div>
                                            <div className="text-left min-w-0">
                                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">V2 (Atualizada)</p>
                                                <p className="text-xs font-bold truncate text-zinc-400 mt-0.5">{fileV2 ? fileV2.name : 'Selecionar Documento'}</p>
                                            </div>
                                        </div>
                                    </button>
                                </div>

                                <button
                                    onClick={handleProcess}
                                    disabled={isProcessing || !fileV1 || !fileV2}
                                    className={`w-full py-5 font-bold rounded-2xl transition-all flex items-center justify-center gap-3 text-sm tracking-[0.2em] group ${
                                        isProcessing || !fileV1 || !fileV2 
                                        ? 'bg-white/5 text-zinc-600 border border-white/5 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_40px_rgba(37,99,235,0.3)]'
                                    }`}
                                >
                                    {isProcessing ? <RefreshCw size={18} className="animate-spin" /> : <Play size={18} className="fill-current" />}
                                    <span>{isProcessing ? 'A PROCESSAR...' : 'COMPARAR AGORA'}</span>
                                </button>
                            </div>
                        </div>

                        {/* Log de Alterações (Mesmo estilo do Cronómetro) */}
                        {diffLines.length > 0 && (
                            <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex flex-col max-h-[500px] shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Log de Auditoria</h3>
                                    <div className="flex gap-2 text-[10px] font-bold">
                                        <span className="text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md">+{stats.additions}</span>
                                        <span className="text-rose-400 bg-rose-500/10 px-2 py-1 rounded-md">-{stats.deletions}</span>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                                    {renderSidebarChanges()}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Coluna Direita: O Visor (Visualizador Cirúrgico) */}
                    <div className="xl:col-span-2 flex flex-col min-h-[600px]">
                        <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl relative">
                            
                            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                                <div className="flex items-center gap-3">
                                    <LayoutTemplate size={18} className="text-zinc-500" />
                                    <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-widest">Visualizador de Documentos</h3>
                                </div>
                                
                                {diffLines.length > 0 && (
                                    <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-zinc-500">
                                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Adicionado</div>
                                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500" /> Removido</div>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12 bg-[#0a0a0a]/50 scroll-smooth">
                                {isProcessing ? (
                                    <div className="h-full flex flex-col items-center justify-center gap-6">
                                        <RefreshCw size={48} className="text-blue-500 animate-spin" />
                                        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 text-center">Detetando alterações nas versões...</p>
                                    </div>
                                ) : diffLines.length > 0 ? (
                                    <div className="max-w-4xl mx-auto bg-[#0a0a0a] border border-white/5 shadow-2xl p-10 md:p-16 rounded-xl text-sm leading-relaxed text-zinc-300 shadow-black/50">
                                        {renderDocument()}
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center gap-6 text-center opacity-50">
                                        <div className="p-8 rounded-full bg-white/[0.02] border border-white/5">
                                            <FileText size={64} className="text-zinc-800" />
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-[0.2em]">Aguardando Documentos</h4>
                                            <p className="text-[10px] text-zinc-700 uppercase max-w-xs mx-auto">Carregue V1 e V2 para iniciar a auditoria visual.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
