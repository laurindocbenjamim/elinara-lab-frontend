import React, { useState, useRef } from 'react';
import { ArrowLeft, FileText, Sparkles, Brain, Coins, Wrench, Scale, Send, Loader2, Bot, HardDrive, Cloud, UploadCloud } from 'lucide-react';
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

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setSourceType('local');
        }
    };

    const handleProcess = async () => {
        if (sourceType === 'local' && !file) return alert("Por favor, seleciona um ficheiro PDF.");
        if (sourceType === 'drive' && !selectedDriveFile) return alert("Por favor, seleciona um ficheiro do Drive/SharePoint.");

        setIsLoading(true);
        setResult(null);

        const formData = new FormData();
        if (sourceType === 'local' && file) {
            formData.append('file', file);
        } else {
            formData.append('drive_file_id', selectedDriveFile || '');
        }
        formData.append('lente', lente);

        try {
            const response = await fetch('http://localhost:8000/api/v1/incentivos/sumaria_parecer/summarize', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                let errorMsg = "Falha na resposta do servidor.";
                try {
                    const errorData = await response.json();
                    if (errorData.detail) errorMsg = errorData.detail;
                } catch (e) {}
                throw new Error(errorMsg);
            }
            
            const data = await response.json();
            setResult(data);
        } catch (error: any) {
            console.error("Erro ao processar", error);
            alert(`Erro na ligação ao motor de sumarização: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] p-4 lg:p-8 overflow-y-auto custom-scrollbar">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <header className="flex items-center gap-6 text-left">
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

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">

                    {/* Coluna Esquerda: Configuração e Upload */}
                    <div className="xl:col-span-1 space-y-6">
                        
                        {/* Painel de Controlo */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden group shadow-2xl flex flex-col gap-6">
                            <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-all duration-700 pointer-events-none" />

                            <div className="relative z-10 space-y-6">
                                <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                                    <div className="p-4 rounded-3xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                                        <Bot size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-lg">Sumarização</h3>
                                        <p className="text-zinc-500 text-xs uppercase tracking-widest mt-1">Análise de Parecer</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest block px-1">Lente de Análise</label>
                                    <div className="grid grid-cols-1 gap-3">
                                        {[
                                            { id: 'financeiro', icon: <Coins size={18} />, label: 'Financeiro', desc: 'Foco em Despesas e Cortes' },
                                            { id: 'tecnico', icon: <Wrench size={18} />, label: 'Técnico', desc: 'Mérito e Parecer Global' },
                                            { id: 'recurso', icon: <Scale size={18} />, label: 'Legal', desc: 'Fundamentos p/ Recurso' },
                                        ].map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => setLente(item.id)}
                                                className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-4 ${
                                                    lente === item.id 
                                                    ? 'bg-blue-500/10 border-blue-500/30 text-white shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                                                    : 'bg-[#0a0a0a] border-white/5 text-zinc-500 hover:bg-white/[0.02] hover:border-white/10'
                                                }`}
                                            >
                                                <div className={`p-2 rounded-xl ${lente === item.id ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5'}`}>
                                                    {item.icon}
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold uppercase tracking-wider">{item.label}</div>
                                                    <div className="text-[10px] text-zinc-600 mt-0.5">{item.desc}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Origem do Documento */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 space-y-6 shadow-xl">
                            <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest block px-1">Origem do Documento</label>
                            
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <button
                                    onClick={() => setSourceType('local')}
                                    className={`p-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all ${sourceType === 'local' ? 'bg-white/10 border-white/20 text-white' : 'bg-white/5 border-white/5 text-zinc-500'}`}
                                >
                                    Local
                                </button>
                                <button
                                    onClick={() => setSourceType('drive')}
                                    className={`p-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all ${sourceType === 'drive' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-white/5 border-white/5 text-zinc-500'}`}
                                >
                                    Cloud Drive
                                </button>
                            </div>

                            {sourceType === 'local' ? (
                                <div className="relative group/upload">
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`w-full flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed rounded-[2rem] transition-all duration-300 ${
                                            file 
                                            ? 'border-blue-500/50 bg-blue-500/5' 
                                            : 'border-white/10 hover:border-blue-500/30 bg-[#0a0a0a] hover:bg-white/[0.02]'
                                        }`}
                                    >
                                        <div className={`p-4 rounded-2xl transition-transform duration-300 group-hover/upload:scale-110 group-hover/upload:-translate-y-1 ${
                                            file ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-zinc-500'
                                        }`}>
                                            <UploadCloud size={32} />
                                        </div>
                                        <div className="text-center space-y-1">
                                            <p className="text-sm font-bold text-white">
                                                {file ? 'Ficheiro Selecionado' : 'Carregar PDF Local'}
                                            </p>
                                            <p className="text-xs text-zinc-600 truncate max-w-[200px]">
                                                {file ? file.name : 'Clique para procurar'}
                                            </p>
                                        </div>
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setSelectedDriveFile('parecer_final_v1.pdf')}
                                    className={`w-full p-6 rounded-[2rem] border transition-all flex items-center gap-4 text-left ${selectedDriveFile === 'parecer_final_v1.pdf' ? 'bg-blue-500/10 border-blue-500/30 text-white' : 'bg-[#0a0a0a] border-white/5 text-zinc-400 hover:bg-white/[0.02] hover:border-white/10'}`}
                                >
                                    <div className={`p-3 rounded-xl ${selectedDriveFile ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-zinc-500'}`}>
                                        <Cloud size={24} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm font-bold truncate text-white">parecer_final_v1.pdf</div>
                                        <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">SharePoint / 2024</div>
                                    </div>
                                </button>
                            )}

                            <button
                                onClick={handleProcess}
                                disabled={isLoading || (sourceType === 'local' ? !file : !selectedDriveFile)}
                                className={`w-full py-5 font-bold rounded-2xl transition-all flex items-center justify-center gap-3 text-sm tracking-[0.2em] relative overflow-hidden mt-6 ${
                                    isLoading || (sourceType === 'local' ? !file : !selectedDriveFile)
                                    ? 'bg-white/5 text-zinc-600 border border-white/5 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_40px_rgba(37,99,235,0.3)] hover:shadow-[0_0_60px_rgba(37,99,235,0.4)]'
                                }`}
                            >
                                {isLoading && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[scan_2s_linear_infinite]" />
                                )}
                                {isLoading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        <span>A PROCESSAR...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={18} className="fill-current" />
                                        <span>GERAR RESUMO</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {result && (
                            <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 shadow-xl animate-in fade-in slide-in-from-left-4">
                                <div className="flex items-center gap-2 text-zinc-500 mb-4 border-b border-white/5 pb-4">
                                    <Brain size={16} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Consumo Gemini 2.5 Flash</span>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-[#0a0a0a] border border-white/5 p-3 rounded-xl text-center">
                                        <div className="text-sm font-black text-white">{result.usage.prompt_tokens}</div>
                                        <div className="text-[9px] text-zinc-600 uppercase tracking-widest mt-1">Input</div>
                                    </div>
                                    <div className="bg-[#0a0a0a] border border-white/5 p-3 rounded-xl text-center">
                                        <div className="text-sm font-black text-white">{result.usage.candidates_tokens}</div>
                                        <div className="text-[9px] text-zinc-600 uppercase tracking-widest mt-1">Output</div>
                                    </div>
                                    <div className="bg-[#0a0a0a] border border-white/5 p-3 rounded-xl text-center">
                                        <div className="text-sm font-black text-blue-400">{result.usage.total_tokens}</div>
                                        <div className="text-[9px] text-zinc-600 uppercase tracking-widest mt-1">Total</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Coluna Direita: Output de Markdown (2/3) */}
                    <div className="xl:col-span-2 flex flex-col h-full min-h-[600px]">
                        <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl relative">
                            <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-white">Resumo Inteligente</h3>
                                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">Parecer Oficial</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12 relative">
                                {isLoading ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 text-zinc-500 bg-[#050505]/50 backdrop-blur-sm z-10">
                                        <div className="relative">
                                            <Brain size={64} className="text-blue-500 animate-pulse relative z-10" />
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-500/20 blur-2xl rounded-full animate-pulse" />
                                        </div>
                                        <div className="text-center space-y-2">
                                            <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-400">Motor Neural Ativo</p>
                                            <p className="text-xs uppercase tracking-widest text-zinc-500">Analisando mérito e extraindo fundamentos...</p>
                                        </div>
                                    </div>
                                ) : result ? (
                                    <article className="prose prose-invert prose-lg prose-blue max-w-none 
                                        prose-p:text-zinc-300 prose-p:leading-relaxed 
                                        prose-headings:text-white prose-headings:font-bold 
                                        prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
                                        prose-strong:text-blue-400 
                                        prose-ul:text-zinc-300 prose-li:marker:text-blue-500
                                        prose-table:border prose-table:border-white/10 prose-table:rounded-xl prose-table:overflow-hidden
                                        prose-th:bg-white/5 prose-th:p-4 prose-th:text-left
                                        prose-td:p-4 prose-td:border-t prose-td:border-white/5">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {result.summary}
                                        </ReactMarkdown>
                                    </article>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center gap-6 text-center opacity-60">
                                        <div className="p-8 rounded-full bg-white/[0.02] border-2 border-dashed border-white/10">
                                            <Sparkles size={64} className="text-zinc-600" />
                                        </div>
                                        <div className="space-y-3">
                                            <h4 className="text-lg font-black text-zinc-400 uppercase tracking-[0.2em]">Aguardando Documento</h4>
                                            <p className="text-xs text-zinc-500 uppercase tracking-widest max-w-sm mx-auto leading-relaxed">
                                                Selecione uma lente de análise e carregue o PDF para extrair os pontos cruciais do parecer.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>

                {/* Global Style for animations */}
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @keyframes scan {
                        0% { transform: translateX(-100%); }
                        100% { transform: translateX(100%); }
                    }
                `}} />
            </div>
        </div>
    );
};
