import React, { useState } from 'react';
import { ArrowLeft, FileText, Sparkles, Brain, Coins, Wrench, Scale, Send, Loader2, Bot, HardDrive, Cloud } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface DashboardProps {
    agentId: string;
    agentName: string;
    onBack: () => void;
}

interface SummaryResponse {
    summary: string;
    usage: {
        prompt_tokens: number;
        candidates_tokens: number;
        total_tokens: number;
    };
}

export const ParecerDashboard: React.FC<DashboardProps> = ({ agentId, agentName, onBack }) => {
    const [file, setFile] = useState<File | null>(null);
    const [selectedDriveFile, setSelectedDriveFile] = useState<string | null>(null);
    const [sourceType, setSourceType] = useState<'local' | 'drive'>('local');
    const [lente, setLente] = useState('financeiro');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<SummaryResponse | null>(null);

    const handleProcess = async () => {
        if (sourceType === 'local' && !file) return alert("Por favor, seleciona um ficheiro PDF.");
        if (sourceType === 'drive' && !selectedDriveFile) return alert("Por favor, seleciona um ficheiro do Drive/SharePoint.");
        
        setIsLoading(true);
        setResult(null);

        const formData = new FormData();
        if (sourceType === 'local' && file) {
            formData.append('file', file);
        } else {
            // Simulação de envio de referência de ficheiro do drive
            formData.append('drive_file_id', selectedDriveFile || '');
        }
        formData.append('lente', lente);

        try {
            const response = await fetch('http://localhost:8010/summarize', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            setResult(data);
        } catch (error) {
            console.error("Erro ao processar", error);
            alert("Erro na ligação ao motor de sumarização.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="dashboard-page h-[calc(100vh-4rem)] overflow-hidden flex flex-col p-4 lg:p-12 bg-[#050505]">
            <div className="max-w-6xl mx-auto w-full flex-grow flex flex-col justify-start -mt-5 z-10 min-h-0">
                
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
                            <span className="text-[10px] font-bold text-blue-400/80 uppercase tracking-widest">Incentivos</span>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-6">
                    
                    {/* Left Panel: Configuration */}
                    <div className="w-full lg:w-[380px] flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-1">
                        <div className="bg-white/[0.03] border border-white/5 rounded-[2rem] p-6 space-y-6">
                            
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-zinc-500 mb-2">
                                    <FileText size={16} />
                                    <span className="text-[11px] font-medium uppercase tracking-widest">Origem do Parecer</span>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2">
                                    <button 
                                        onClick={() => setSourceType('local')}
                                        className={`p-3 rounded-xl border text-[10px] font-bold uppercase transition-all ${sourceType === 'local' ? 'bg-white/10 border-white/20 text-white' : 'bg-white/5 border-white/5 text-zinc-500'}`}
                                    >
                                        Upload Local
                                    </button>
                                    <button 
                                        onClick={() => setSourceType('drive')}
                                        className={`p-3 rounded-xl border text-[10px] font-bold uppercase transition-all ${sourceType === 'drive' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-white/5 border-white/5 text-zinc-500'}`}
                                    >
                                        Cloud Drive
                                    </button>
                                </div>
                            </div>

                            {sourceType === 'local' ? (
                                <div className="relative group">
                                    <input 
                                        type="file" 
                                        accept=".pdf"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                    />
                                    <div className={`p-8 border-2 border-dashed rounded-2xl transition-all flex flex-col items-center justify-center text-center gap-3 ${file ? 'border-blue-500/40 bg-blue-500/5' : 'border-white/5 bg-white/[0.02] group-hover:border-white/10 group-hover:bg-white/[0.04]'}`}>
                                        <div className={`p-3 rounded-xl ${file ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-zinc-500'}`}>
                                            <FileText size={24} />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-zinc-300">
                                                {file ? file.name : "Selecionar PDF Local"}
                                            </p>
                                            {!file && <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Arraste ou clique</p>}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <button 
                                        onClick={() => setSelectedDriveFile('parecer_final_v1.pdf')}
                                        className={`w-full p-4 rounded-2xl border transition-all flex items-center gap-4 text-left ${selectedDriveFile === 'parecer_final_v1.pdf' ? 'bg-blue-500/10 border-blue-500/30 text-white' : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10'}`}
                                    >
                                        <Cloud size={20} className={selectedDriveFile ? 'text-blue-400' : ''} />
                                        <div className="min-w-0">
                                            <div className="text-xs font-bold truncate">parecer_final_v1.pdf</div>
                                            <div className="text-[9px] text-zinc-500 uppercase">SharePoint / Projetos / 2024</div>
                                        </div>
                                    </button>
                                    <p className="text-[9px] text-zinc-600 text-center uppercase tracking-widest italic pt-1">
                                        Ficheiros detetados nas suas conexões
                                    </p>
                                </div>
                            )}

                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-1">Lente de Análise</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {[
                                        { id: 'financeiro', icon: <Coins size={14} />, label: 'Financeiro', desc: 'Dinheiro e Cortes' },
                                        { id: 'tecnico', icon: <Wrench size={14} />, label: 'Técnico', desc: 'Mérito e Parecer' },
                                        { id: 'recurso', icon: <Scale size={14} />, label: 'Legal', desc: 'Fundamentos p/ Recurso' },
                                    ].map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => setLente(item.id)}
                                            className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${lente === item.id ? 'bg-blue-500/10 border-blue-500/30 text-white' : 'bg-white/5 border-white/5 text-zinc-500 hover:bg-white/10'}`}
                                        >
                                            <div className={lente === item.id ? 'text-blue-400' : ''}>{item.icon}</div>
                                            <div>
                                                <div className="text-[11px] font-bold uppercase">{item.label}</div>
                                                <div className="text-[9px] text-zinc-600 uppercase tracking-tight">{item.desc}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleProcess}
                                disabled={isLoading || (sourceType === 'local' ? !file : !selectedDriveFile)}
                                className={`w-full py-4 font-bold rounded-2xl transition-all flex items-center justify-center gap-3 text-xs tracking-[0.2em] ${
                                    isLoading || (sourceType === 'local' ? !file : !selectedDriveFile)
                                    ? 'bg-white/5 text-zinc-600 cursor-not-allowed border border-white/5' 
                                    : 'bg-blue-500 hover:bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] border border-blue-400/50'
                                }`}
                            >
                                {isLoading ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <>
                                        <Sparkles size={14} className="fill-current" />
                                        <span>GERAR RESUMO</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {result && (
                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col gap-3 animate-in fade-in slide-in-from-left-4">
                                <div className="flex items-center gap-2 text-zinc-600">
                                    <Brain size={14} />
                                    <span className="text-[9px] font-bold uppercase tracking-widest">Métricas Gemini 2.5 Flash</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-black/20 p-2 rounded-lg text-center">
                                        <div className="text-[10px] font-black text-white">{result.usage.prompt_tokens}</div>
                                        <div className="text-[8px] text-zinc-600 uppercase">Input</div>
                                    </div>
                                    <div className="bg-black/20 p-2 rounded-lg text-center">
                                        <div className="text-[10px] font-black text-white">{result.usage.candidates_tokens}</div>
                                        <div className="text-[8px] text-zinc-600 uppercase">Output</div>
                                    </div>
                                    <div className="bg-black/20 p-2 rounded-lg text-center">
                                        <div className="text-[10px] font-black text-white">{result.usage.total_tokens}</div>
                                        <div className="text-[8px] text-zinc-600 uppercase">Total</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Panel: Output */}
                    <div className="flex-1 bg-white/[0.03] border border-white/5 rounded-[2rem] flex flex-col overflow-hidden relative">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                            <div className="flex items-center gap-3">
                                <Bot size={18} className="text-blue-400" />
                                <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-widest">Resumo Inteligente do Parecer</h3>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 lg:p-12">
                            {isLoading ? (
                                <div className="h-full flex flex-col items-center justify-center gap-4 text-zinc-500">
                                    <div className="relative">
                                        <Brain size={48} className="text-blue-500 animate-pulse" />
                                        <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
                                    </div>
                                    <div className="text-center space-y-1">
                                        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Motor Gemini em processamento</p>
                                        <p className="text-[10px] uppercase tracking-tighter opacity-50">Analisando mérito e fundamentos do parecer...</p>
                                    </div>
                                </div>
                            ) : result ? (
                                <article className="prose prose-invert prose-blue max-w-none prose-p:text-zinc-400 prose-headings:text-white prose-strong:text-blue-400 prose-table:border prose-table:border-white/10 prose-th:bg-white/5 prose-th:p-3 prose-td:p-3 prose-td:border-t prose-td:border-white/5">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {result.summary}
                                    </ReactMarkdown>
                                </article>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center gap-6 text-center">
                                    <div className="p-6 rounded-full bg-white/[0.02] border border-white/5">
                                        <FileText size={64} className="text-zinc-800" />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-[0.2em]">Aguardando Documento</h4>
                                        <p className="text-[10px] text-zinc-700 uppercase max-w-xs mx-auto leading-relaxed">
                                            Carregue o PDF do parecer oficial para extrair os pontos chave e fundamentos técnicos.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
