import React, { useState, useRef } from 'react';
import { ArrowLeft, Folder, HardDrive, Cloud, BrainCircuit, CheckCircle2, AlertTriangle, XCircle, FileText, ChevronRight, Play, UploadCloud, RefreshCw, Layers, Calendar } from 'lucide-react';

interface DashboardProps {
    agentId: string;
    agentName: string;
    onBack: () => void;
}

interface Invoice {
    id: string;
    filename: string;
    status: 'GREEN' | 'YELLOW' | 'RED' | 'ERROR';
    extracted_date: string;
    reference_date: string;
    confidence_score: number;
    issues: { description: string }[];
}

export const FaturasDashboard: React.FC<DashboardProps> = ({ agentId, agentName, onBack }) => {
    const [selectedSource, setSelectedSource] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [referenceDate, setReferenceDate] = useState<string>(new Date().toISOString().split('T')[0]); // Default: Today
    const [isProcessing, setIsProcessing] = useState(false);
    const [resultsAvailable, setResultsAvailable] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<'GREEN' | 'YELLOW' | 'RED' | 'ALL'>('ALL');
    const [invoices, setInvoices] = useState<Invoice[]>([]);

    // Referência para o input de ficheiro oculto
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
            setSelectedSource('local');
        }
    };

    const handleProcess = async () => {
        if (!selectedFile) {
            return alert('Por favor, carregue uma fatura primeiro.');
        }

        setIsProcessing(true);

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('reference_date', referenceDate); // Envia a data selecionada

        try {
            const token = localStorage.getItem('token') || ''; 

            const response = await fetch('http://localhost:8000/api/v1/incentivos/pedidos_pagamento/process-invoice', {
                method: 'POST',
                headers: {},
                body: formData,
            });

            if (!response.ok) {
                let errorMsg = "Falha ao comunicar com o agente backend.";
                try {
                    const errorData = await response.json();
                    if (errorData.detail) errorMsg = errorData.detail;
                } catch (e) {}
                throw new Error(errorMsg);
            }

            const data = await response.json();

            const newInvoice: Invoice = {
                id: Math.random().toString(36).substring(7),
                filename: data.filename || selectedFile.name,
                status: data.status || 'ERROR',
                extracted_date: data.extracted_date || 'N/D',
                reference_date: data.reference_date || 'N/D',
                confidence_score: data.confidence_score || 0,
                issues: data.issues || []
            };

            setInvoices(prev => [newInvoice, ...prev]);
            setResultsAvailable(true);

            if (['GREEN', 'YELLOW', 'RED'].includes(newInvoice.status)) {
                setSelectedCategory(newInvoice.status as any);
            }

            setSelectedFile(null);
            setSelectedSource(null);
            if (fileInputRef.current) fileInputRef.current.value = '';

        } catch (error: any) {
            console.error(error);
            alert(`Erro durante a triagem: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const greenInvoices = invoices.filter(i => i.status === 'GREEN');
    const yellowInvoices = invoices.filter(i => i.status === 'YELLOW');
    const redInvoices = invoices.filter(i => i.status === 'RED');

    const displayedInvoices = selectedCategory === 'ALL' 
        ? invoices 
        : invoices.filter(i => i.status === selectedCategory);

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

                    {/* Coluna Esquerda: Zona de Upload e Triagem */}
                    <div className="xl:col-span-1 space-y-6">

                        {/* Caixa Principal de Upload */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden group shadow-2xl flex flex-col">
                            <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-all duration-700 pointer-events-none" />

                            <div className="relative z-10 flex-1 flex flex-col">
                                <div className="flex items-center gap-4 border-b border-white/5 pb-6 mb-6">
                                    <div className="p-4 rounded-3xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                                        <BrainCircuit size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-lg">Triagem OCR</h3>
                                        <p className="text-zinc-500 text-xs uppercase tracking-widest mt-1">Análise Documental</p>
                                    </div>
                                </div>

                                <input 
                                    type="file" 
                                    accept=".pdf,image/*" 
                                    className="hidden" 
                                    ref={fileInputRef} 
                                    onChange={handleFileChange} 
                                />

                                <div className="flex-1 flex flex-col justify-center gap-6">

                                    {/* Campo Data de Referência */}
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest block px-1">
                                            Data da Candidatura
                                        </label>
                                        <div className="relative">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                            <input 
                                                type="date"
                                                value={referenceDate}
                                                onChange={(e) => setReferenceDate(e.target.value)}
                                                className="w-full bg-[#0a0a0a] border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all [color-scheme:dark]"
                                            />
                                        </div>
                                    </div>

                                    {/* Upload Área Interativa */}
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`w-full group/upload flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed rounded-[2rem] transition-all duration-300 ${
                                            selectedFile 
                                            ? 'border-blue-500/50 bg-blue-500/5' 
                                            : 'border-white/10 hover:border-blue-500/30 bg-[#0a0a0a] hover:bg-white/[0.02]'
                                        }`}
                                    >
                                        <div className={`p-4 rounded-2xl transition-transform duration-300 group-hover/upload:scale-110 group-hover/upload:-translate-y-1 ${
                                            selectedFile ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-zinc-500'
                                        }`}>
                                            <UploadCloud size={32} />
                                        </div>
                                        <div className="text-center space-y-1">
                                            <p className="text-sm font-bold text-white">
                                                {selectedFile ? 'Ficheiro Selecionado' : 'Carregar Fatura Local'}
                                            </p>
                                            <p className="text-xs text-zinc-500 truncate max-w-[200px]">
                                                {selectedFile ? selectedFile.name : 'PDF, PNG ou JPG'}
                                            </p>
                                        </div>
                                    </button>

                                    <button
                                        onClick={handleProcess}
                                        disabled={isProcessing || !selectedFile}
                                        className={`w-full py-5 font-bold rounded-2xl transition-all flex items-center justify-center gap-3 text-sm tracking-[0.2em] relative overflow-hidden ${
                                            isProcessing || !selectedFile
                                            ? 'bg-white/5 text-zinc-600 border border-white/5 cursor-not-allowed'
                                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_40px_rgba(37,99,235,0.3)] hover:shadow-[0_0_60px_rgba(37,99,235,0.4)]'
                                        }`}
                                    >
                                        {isProcessing && (
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[scan_2s_linear_infinite]" />
                                        )}
                                        {isProcessing ? (
                                            <>
                                                <RefreshCw size={18} className="animate-spin" />
                                                <span>A PROCESSAR...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Play size={18} className="fill-current" />
                                                <span>INICIAR TRIAGEM</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Integrações Cloud (Design Secundário) */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6">
                            <div className="flex items-center gap-2 mb-4 text-zinc-500">
                                <Folder size={14} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Fontes Automáticas</span>
                            </div>
                            <button 
                                onClick={() => alert('Em breve: Conexão direta ao Google Drive do cliente.')}
                                className="w-full p-4 rounded-2xl border border-white/5 bg-[#0a0a0a] flex items-center gap-4 text-left hover:border-white/10 hover:bg-white/[0.02] transition-colors group"
                            >
                                <div className="p-2 bg-white/5 rounded-xl text-zinc-400 group-hover:text-blue-400 transition-colors">
                                    <HardDrive size={20} />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-zinc-300">Google Drive</div>
                                    <div className="text-[10px] text-zinc-600 uppercase tracking-wider mt-0.5">Sincronizar Pasta</div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Coluna Direita: Dashboard de Resultados (2/3) */}
                    <div className="xl:col-span-2 space-y-6 flex flex-col h-full">

                        {/* Estatísticas (Filtros Interativos) */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <button 
                                onClick={() => setSelectedCategory('ALL')}
                                className={`p-5 rounded-[2rem] border text-left transition-all flex flex-col justify-between min-h-[120px] ${
                                    selectedCategory === 'ALL' ? 'bg-white/10 border-white/20' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Layers size={16} className={selectedCategory === 'ALL' ? 'text-white' : 'text-zinc-500'} />
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${selectedCategory === 'ALL' ? 'text-white' : 'text-zinc-500'}`}>
                                        Total
                                    </span>
                                </div>
                                <span className="text-4xl font-black text-white">{invoices.length}</span>
                            </button>

                            <button 
                                onClick={() => setSelectedCategory('GREEN')}
                                className={`p-5 rounded-[2rem] border text-left transition-all flex flex-col justify-between min-h-[120px] ${
                                    selectedCategory === 'GREEN' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 size={16} className={selectedCategory === 'GREEN' ? 'text-emerald-400' : 'text-emerald-500/50'} />
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${selectedCategory === 'GREEN' ? 'text-emerald-400' : 'text-zinc-500'}`}>
                                        Aprovadas
                                    </span>
                                </div>
                                <span className={`text-4xl font-black ${selectedCategory === 'GREEN' ? 'text-emerald-400' : 'text-white'}`}>
                                    {greenInvoices.length}
                                </span>
                            </button>

                            <button 
                                onClick={() => setSelectedCategory('YELLOW')}
                                className={`p-5 rounded-[2rem] border text-left transition-all flex flex-col justify-between min-h-[120px] ${
                                    selectedCategory === 'YELLOW' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <AlertTriangle size={16} className={selectedCategory === 'YELLOW' ? 'text-amber-400' : 'text-amber-500/50'} />
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${selectedCategory === 'YELLOW' ? 'text-amber-400' : 'text-zinc-500'}`}>
                                        Revisão
                                    </span>
                                </div>
                                <span className={`text-4xl font-black ${selectedCategory === 'YELLOW' ? 'text-amber-400' : 'text-white'}`}>
                                    {yellowInvoices.length}
                                </span>
                            </button>

                            <button 
                                onClick={() => setSelectedCategory('RED')}
                                className={`p-5 rounded-[2rem] border text-left transition-all flex flex-col justify-between min-h-[120px] ${
                                    selectedCategory === 'RED' ? 'bg-rose-500/10 border-rose-500/30' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <XCircle size={16} className={selectedCategory === 'RED' ? 'text-rose-400' : 'text-rose-500/50'} />
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${selectedCategory === 'RED' ? 'text-rose-400' : 'text-zinc-500'}`}>
                                        Rejeitadas
                                    </span>
                                </div>
                                <span className={`text-4xl font-black ${selectedCategory === 'RED' ? 'text-rose-400' : 'text-white'}`}>
                                    {redInvoices.length}
                                </span>
                            </button>
                        </div>

                        {/* Lista de Faturas Detalhada */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex-1 min-h-[400px] flex flex-col overflow-hidden shadow-xl">
                            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                                <div className="flex items-center gap-3">
                                    <FileText size={20} className="text-zinc-500" />
                                    <h3 className="text-sm font-black text-zinc-200 uppercase tracking-widest">
                                        {selectedCategory === 'ALL' ? 'Todas as Faturas Processadas' : 
                                         selectedCategory === 'GREEN' ? 'Faturas Aprovadas' : 
                                         selectedCategory === 'YELLOW' ? 'Faturas em Revisão' : 'Faturas Rejeitadas'}
                                    </h3>
                                </div>
                                {displayedInvoices.length > 0 && (
                                    <span className="text-xs font-bold text-zinc-500 bg-white/5 px-3 py-1 rounded-lg">
                                        {displayedInvoices.length} Docs
                                    </span>
                                )}
                            </div>

                            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                                {displayedInvoices.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center text-zinc-600 gap-4">
                                        <div className="p-6 rounded-full bg-white/[0.02] border border-white/5">
                                            <Folder size={40} className="opacity-50" />
                                        </div>
                                        <p className="text-xs uppercase tracking-widest font-bold">Sem resultados para mostrar nesta categoria</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {displayedInvoices.map((inv) => (
                                            <div key={inv.id} className="p-6 rounded-3xl bg-[#0a0a0a] border border-white/5 flex flex-col gap-4 hover:border-white/10 transition-colors relative overflow-hidden group">

                                                {/* Color bar indicator */}
                                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                                                    inv.status === 'GREEN' ? 'bg-emerald-500' :
                                                    inv.status === 'YELLOW' ? 'bg-amber-500' :
                                                    inv.status === 'RED' ? 'bg-rose-500' : 'bg-zinc-500'
                                                }`} />

                                                <div className="flex justify-between items-start gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-bold text-white truncate" title={inv.filename}>
                                                            {inv.filename}
                                                        </h4>
                                                        <div className="flex gap-4 mt-2">
                                                            <div className="space-y-1">
                                                                <span className="text-[9px] text-zinc-500 uppercase tracking-widest block">Data</span>
                                                                <span className="text-xs text-zinc-300 font-medium">{inv.extracted_date || 'N/D'}</span>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <span className="text-[9px] text-zinc-500 uppercase tracking-widest block">Ref</span>
                                                                <span className="text-xs text-zinc-300 font-medium">{inv.reference_date || 'N/D'}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col items-end gap-2">
                                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-widest flex items-center gap-1.5 ${
                                                            inv.status === 'GREEN' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                            inv.status === 'YELLOW' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                            'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                                        }`}>
                                                            {inv.status === 'GREEN' && <CheckCircle2 size={12} />}
                                                            {inv.status === 'YELLOW' && <AlertTriangle size={12} />}
                                                            {inv.status === 'RED' && <XCircle size={12} />}
                                                            {inv.status}
                                                        </span>
                                                        <div className="text-[10px] font-bold text-zinc-500 flex flex-col items-end">
                                                            <span className="uppercase tracking-widest mb-0.5">Confiança</span>
                                                            <span className="text-blue-400">{(inv.confidence_score * 100).toFixed(0)}%</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {inv.issues && inv.issues.length > 0 && (
                                                    <div className="mt-2 p-3 rounded-xl bg-rose-500/5 border border-rose-500/10">
                                                        <span className="text-[9px] font-bold text-rose-500 uppercase tracking-widest block mb-1">Anomalias Detetadas:</span>
                                                        <ul className="text-xs text-rose-400/80 list-disc pl-4 space-y-1">
                                                            {inv.issues.map((issue, idx) => (
                                                                <li key={idx} className="leading-snug">{issue.description}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
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