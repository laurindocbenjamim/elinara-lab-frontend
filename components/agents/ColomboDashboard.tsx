import React, { useState, useRef } from 'react';
import { ArrowLeft, Search, UploadCloud, RefreshCw, FileText, CheckCircle2, Trash2, ShieldCheck, Microscope, Database, Sparkles, Loader2, AlertTriangle, Download } from 'lucide-react';

interface DashboardProps {
    agentId: string;
    agentName: string;
    onBack: () => void;
}

export const ColomboDashboard: React.FC<DashboardProps> = ({ agentId, agentName, onBack }) => {
    const API_URL = 'http://localhost:8000/api/v1/auditoria/colombo';
    const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        setError(null);
        
        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const formData = new FormData();
                formData.append('file', file);
                
                const resp = await fetch(`${API_URL}/upload`, { 
                    method: 'POST', 
                    body: formData 
                });
                
                if (resp.ok) {
                    setUploadedFiles(prev => [...prev, file.name]);
                } else {
                    const errData = await resp.json().catch(() => ({}));
                    console.error("Upload failed for:", file.name, errData);
                }
            }
        } catch (err) {
            console.error("Upload network error:", err);
            setError("Erro de rede ao carregar ficheiros.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const runInvestigation = async () => {
        setIsProcessing(true);
        setError(null);
        setResult(null);
        
        try {
            const resp = await fetch(`${API_URL}/analyze`);
            const data = await resp.json();
            
            if (resp.ok && data && data.data) {
                setResult(data);
            } else {
                throw new Error(data.error || data.detail || "Falha na análise profunda.");
            }
        } catch (err: any) {
            console.error("Analysis error:", err);
            setError(err.message || "Erro desconhecido.");
        } finally {
            setIsProcessing(false);
        }
    };

    const clearSession = async () => {
        try {
            await fetch(`${API_URL}/clear`, { method: 'DELETE' });
        } catch (e) {}
        setUploadedFiles([]);
        setResult(null);
        setError(null);
    };

    const exportToWord = async () => {
        if (!result) return;
        try {
            const response = await fetch(`${API_URL}/generate-report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(result.data)
            });
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Relatorio_Colombo_${result.data.Identificação?.["Nome da empresa"] || 'Auditoria'}.docx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (error) {
            alert("Erro ao exportar documento.");
        }
    };

    const renderField = (val: any) => {
        if (!val) return "Informação não detectada.";
        if (typeof val === 'object') return JSON.stringify(val);
        return val.toString();
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
                                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Auditoria</span>
                            </div>
                        </div>
                        
                        {(result || error || uploadedFiles.length > 0) && (
                            <button 
                                onClick={clearSession} 
                                className="p-2 px-4 bg-white/5 border border-white/5 hover:bg-rose-500/10 text-zinc-500 hover:text-rose-500 rounded-xl transition-all text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"
                            >
                                <Trash2 size={14} /> Novo Caso
                            </button>
                        )}
                    </div>
                </header>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
                    
                    {/* Coluna Esquerda: Data Room (Agora em Azul) */}
                    <div className="xl:col-span-1 space-y-6">
                        <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden group shadow-2xl flex flex-col gap-6">
                            <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-all duration-700 pointer-events-none" />

                            <div className="relative z-10 space-y-6">
                                <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                                    <div className="p-4 rounded-3xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                                        <Microscope size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-lg">Data Room</h3>
                                        <p className="text-zinc-500 text-[10px] uppercase tracking-widest mt-1">Gestão de Evidências</p>
                                    </div>
                                </div>

                                <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                                
                                <div className="space-y-4">
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading || isProcessing}
                                        className={`w-full group/upload flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed rounded-[2rem] transition-all duration-300 ${
                                            isUploading 
                                            ? 'border-blue-500/50 bg-blue-500/5' 
                                            : 'border-white/10 hover:border-blue-500/30 bg-[#0a0a0a] hover:bg-white/[0.02]'
                                        }`}
                                    >
                                        <div className={`p-4 rounded-2xl transition-transform duration-300 group-hover/upload:scale-110 group-hover/upload:-translate-y-1 ${
                                            uploadedFiles.length > 0 ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-zinc-500'
                                        }`}>
                                            {isUploading ? <Loader2 size={32} className="animate-spin" /> : <UploadCloud size={32} />}
                                        </div>
                                        <div className="text-center space-y-1">
                                            <p className="text-sm font-bold text-white">
                                                {isUploading ? 'A carregar ficheiros...' : 'Adicionar Documentos'}
                                            </p>
                                            <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-tighter">PDF, DOCX ou Atas</p>
                                        </div>
                                    </button>

                                    {uploadedFiles.length > 0 && (
                                        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 max-h-[200px] overflow-y-auto custom-scrollbar space-y-2">
                                            {uploadedFiles.map((fname, idx) => (
                                                <div key={idx} className="flex items-center justify-between text-[11px] text-zinc-400 border-b border-white/5 pb-2 last:border-0 last:pb-0">
                                                    <div className="flex items-center gap-2 truncate pr-2">
                                                        <FileText size={12} className="text-blue-500/50" />
                                                        <span className="truncate">{fname}</span>
                                                    </div>
                                                    <CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0" />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <button
                                        onClick={runInvestigation}
                                        disabled={isProcessing || isUploading || uploadedFiles.length === 0}
                                        className={`w-full py-5 font-bold rounded-2xl transition-all flex items-center justify-center gap-3 text-sm tracking-[0.2em] relative overflow-hidden ${
                                            isProcessing || isUploading || uploadedFiles.length === 0
                                            ? 'bg-white/5 text-zinc-600 border border-white/5 cursor-not-allowed'
                                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_40px_rgba(37,99,235,0.3)]'
                                        }`}
                                    >
                                        {isProcessing ? (
                                            <>
                                                <RefreshCw size={18} className="animate-spin" />
                                                <span>INTERROGANDO...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Search size={18} />
                                                <span>INVESTIGAR CASO</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Coluna Direita: Relatório (Agora em Azul) */}
                    <div className="xl:col-span-2 flex flex-col min-h-[600px]">
                        <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex-1 flex flex-col overflow-hidden shadow-2xl relative">
                            
                            <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white uppercase tracking-tighter">Relatório de Inteligência</h3>
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Análise Consolidada via IA</p>
                                    </div>
                                </div>

                                {result && (
                                    <button 
                                        onClick={exportToWord}
                                        className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500 hover:text-white transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
                                    >
                                        <Download size={16} />
                                        <span className="hidden md:inline">Word</span>
                                    </button>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12 relative">
                                {isProcessing ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 text-zinc-500 bg-[#050505]/50 backdrop-blur-sm z-10">
                                        <div className="relative">
                                            <Database size={64} className="text-blue-500 animate-pulse relative z-10" />
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full animate-pulse" />
                                        </div>
                                        <div className="text-center space-y-2">
                                            <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-400">Motor Colombo Ativo</p>
                                            <p className="text-xs uppercase tracking-widest text-zinc-500">Interrogando documentos e cruzando dados...</p>
                                        </div>
                                    </div>
                                ) : error ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-6 animate-in fade-in">
                                        <AlertTriangle size={48} className="text-rose-500" />
                                        <div className="max-w-md">
                                            <h3 className="text-xl font-bold text-white mb-2 uppercase">Erro na Investigação</h3>
                                            <p className="text-sm text-zinc-500">{error}</p>
                                        </div>
                                        <button onClick={runInvestigation} className="px-8 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold uppercase transition-all">Tentar de novo</button>
                                    </div>
                                ) : result && result.data ? (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                        
                                        {/* Identificação */}
                                        <div className="bg-[#0a0a0a] p-8 rounded-3xl border border-white/5">
                                            <div className="flex items-center gap-3 text-blue-500/50 mb-6 uppercase text-[10px] font-black tracking-widest">
                                                <Database size={14} /> Identificação do Sujeito
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div>
                                                    <p className="text-[10px] text-zinc-600 uppercase font-bold mb-1">Nome da Empresa</p>
                                                    <p className="text-2xl font-bold text-white leading-tight">{renderField(result.data.Identificação?.["Nome da empresa"])}</p>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-[10px] text-zinc-600 uppercase font-bold mb-1">NIF</p>
                                                        <p className="text-lg font-bold text-zinc-300">{renderField(result.data.Identificação?.NIF)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-zinc-600 uppercase font-bold mb-1">Sede</p>
                                                        <p className="text-sm font-medium text-zinc-400">{renderField(result.data.Identificação?.Sede)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Atividade */}
                                            <div className="bg-[#0a0a0a] p-8 rounded-3xl border border-white/5">
                                                <div className="flex items-center gap-3 text-blue-500/50 mb-4 uppercase text-[10px] font-black tracking-widest">
                                                    <Sparkles size={14} /> Core Business
                                                </div>
                                                <p className="text-sm leading-relaxed text-zinc-300 italic">"{renderField(result.data["Core Business"])}"</p>
                                            </div>

                                            {/* Risco */}
                                            <div className="bg-rose-500/[0.03] p-8 rounded-3xl border border-rose-500/10">
                                                <div className="flex items-center gap-3 text-rose-500/50 mb-4 uppercase text-[10px] font-black tracking-widest">
                                                    <AlertTriangle size={14} /> Perfil de Risco
                                                </div>
                                                <p className="text-sm leading-relaxed text-rose-200 font-medium">{renderField(result.data["Perfil de Risco"])}</p>
                                            </div>
                                        </div>

                                        {/* Notas */}
                                        <div className="bg-[#0a0a0a] p-8 rounded-3xl border border-white/5">
                                            <div className="flex items-center gap-3 text-blue-500/50 mb-4 uppercase text-[10px] font-black tracking-widest">
                                                <FileText size={14} /> Notas do Investigador
                                            </div>
                                            <p className="text-sm leading-relaxed text-zinc-300 whitespace-pre-line font-medium">
                                                {renderField(result.data["Notas de Auditoria"])}
                                            </p>
                                        </div>

                                        <div className="py-6 flex items-center justify-center gap-4 opacity-30 border-t border-white/5">
                                            <ShieldCheck size={16} />
                                            <span className="text-[9px] font-black uppercase tracking-[0.4em]">Fontes validadas via Agente Colombo Intelligence</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center gap-8 text-center opacity-40 group">
                                        <div className="p-16 rounded-[4rem] bg-white/[0.01] border-2 border-dashed border-white/5 group-hover:border-blue-500/20 transition-all duration-700">
                                            <Search size={100} className="text-zinc-800 group-hover:text-blue-500/30 transition-colors" />
                                        </div>
                                        <div className="space-y-3">
                                            <h4 className="text-2xl font-bold text-zinc-700 uppercase tracking-[0.3em]">Ambiente de Investigação</h4>
                                            <p className="text-xs text-zinc-800 uppercase tracking-widest max-w-sm mx-auto leading-relaxed">
                                                Carregue as evidências na lateral para o Colombo iniciar o cruzamento de inteligência.
                                            </p>
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
