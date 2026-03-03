import React, { useState } from 'react';
import { ArrowLeft, Folder, HardDrive, Cloud, BrainCircuit, CheckCircle2, AlertTriangle, XCircle, FileText, ChevronRight, Play } from 'lucide-react';

interface DashboardProps {
    agentId: string;
    agentName: string;
    onBack: () => void;
}

interface Invoice {
    id: string;
    filename: string;
    status: 'GREEN' | 'YELLOW' | 'RED';
    extracted_date: string;
    reference_date: string;
    confidence_score: number;
    issues: { description: string }[];
}

const MOCK_INVOICES: Invoice[] = [
    { id: '1', filename: 'Fatura_Vodafone_Jan24.pdf', status: 'GREEN', extracted_date: '2024-01-15', reference_date: '2024-01-01', confidence_score: 0.98, issues: [] },
    { id: '2', filename: 'Recibo_Worten_Fev24.pdf', status: 'GREEN', extracted_date: '2024-02-03', reference_date: '2024-01-01', confidence_score: 0.96, issues: [] },
    { id: '3', filename: 'Fatura_Equipamento_Rasurada.pdf', status: 'YELLOW', extracted_date: '2024-03-10', reference_date: '2024-01-01', confidence_score: 0.65, issues: [{ description: 'Anotações manuais detetadas sobre o NIF.' }] },
    { id: '4', filename: 'Despesa_2023_ForaPrazo.pdf', status: 'RED', extracted_date: '2023-11-20', reference_date: '2024-01-01', confidence_score: 0.92, issues: [{ description: 'Data da fatura anterior à data de elegibilidade do projeto.' }] },
    { id: '5', filename: 'Fatura_Ilegivel_Digitalizacao.jpg', status: 'RED', extracted_date: '', reference_date: '2024-01-01', confidence_score: 0.20, issues: [{ description: 'Falha no OCR. Resolução muito baixa.' }] },
];

export const FaturasDashboard: React.FC<DashboardProps> = ({ agentId, agentName, onBack }) => {
    const [selectedSource, setSelectedSource] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [resultsAvailable, setResultsAvailable] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<'GREEN' | 'YELLOW' | 'RED' | null>(null);

    const handleProcess = () => {
        if (!selectedSource) return alert('Selecione uma pasta de origem primeiro.');
        setIsProcessing(true);
        setResultsAvailable(false);
        setSelectedCategory(null);
        
        // Simulate processing time
        setTimeout(() => {
            setIsProcessing(false);
            setResultsAvailable(true);
        }, 3000);
    };

    const greenInvoices = MOCK_INVOICES.filter(i => i.status === 'GREEN');
    const yellowInvoices = MOCK_INVOICES.filter(i => i.status === 'YELLOW');
    const redInvoices = MOCK_INVOICES.filter(i => i.status === 'RED');

    const displayedInvoices = selectedCategory ? MOCK_INVOICES.filter(i => i.status === selectedCategory) : [];

    return (
        <div className="dashboard-page h-[calc(100vh-4rem)] overflow-hidden flex flex-col p-4 lg:p-12 bg-[#050505]">
            <div className="max-w-6xl mx-auto w-full flex-grow flex flex-col justify-start -mt-5 z-10 min-h-0">
                
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
                            <span className="text-[10px] font-bold text-blue-400/80 uppercase tracking-widest">Incentivos</span>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-6">
                    
                    {/* Top Row: 3 Columns Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[320px]">
                        
                        {/* Column 1: Input Source */}
                        <div className="bg-white/[0.03] border border-white/5 rounded-[2rem] p-6 flex flex-col">
                            <div className="flex items-center gap-2 mb-6 text-zinc-500">
                                <Folder size={16} />
                                <span className="text-[11px] font-medium uppercase tracking-widest">Origem de Dados</span>
                            </div>
                            
                            <div className="flex-1 flex flex-col gap-3">
                                <button 
                                    onClick={() => setSelectedSource('sharepoint')}
                                    className={`p-4 rounded-2xl border transition-all flex items-center gap-4 text-left ${selectedSource === 'sharepoint' ? 'bg-blue-500/10 border-blue-500/30 text-white' : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10'}`}
                                >
                                    <Cloud size={24} className={selectedSource === 'sharepoint' ? 'text-blue-400' : ''} />
                                    <div>
                                        <div className="text-sm font-bold">SharePoint Elinara</div>
                                        <div className="text-[10px] text-zinc-500 uppercase tracking-wider">/Incentivos/Faturas_2024</div>
                                    </div>
                                </button>

                                <button 
                                    onClick={() => setSelectedSource('gdrive')}
                                    className={`p-4 rounded-2xl border transition-all flex items-center gap-4 text-left ${selectedSource === 'gdrive' ? 'bg-blue-500/10 border-blue-500/30 text-white' : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10'}`}
                                >
                                    <HardDrive size={24} className={selectedSource === 'gdrive' ? 'text-blue-400' : ''} />
                                    <div>
                                        <div className="text-sm font-bold">Google Drive do Cliente</div>
                                        <div className="text-[10px] text-zinc-500 uppercase tracking-wider">/Uploads/Docs_Pendentes</div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Column 2: Agent Brain */}
                        <div className="bg-white/[0.03] border border-white/5 rounded-[2rem] p-6 flex flex-col items-center justify-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                            
                            <div className="relative mb-8 mt-4">
                                <div className={`absolute inset-0 bg-blue-500/20 rounded-full blur-2xl transition-all duration-500 ${isProcessing ? 'scale-150 animate-pulse' : 'scale-100'}`} />
                                <div className={`p-6 rounded-full bg-white/5 border border-white/10 relative z-10 transition-all duration-500 ${isProcessing ? 'border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.3)]' : ''}`}>
                                    <BrainCircuit size={48} className={`${isProcessing ? 'text-blue-400 animate-pulse' : 'text-zinc-500'}`} />
                                </div>
                                {isProcessing && (
                                    <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 animate-[spin_3s_linear_infinite]" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(59,130,246,0.5)" strokeWidth="1" strokeDasharray="10 10" />
                                        <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(59,130,246,0.3)" strokeWidth="0.5" strokeDasharray="5 5" className="animate-[spin_4s_linear_infinite_reverse]" style={{ transformOrigin: 'center' }} />
                                    </svg>
                                )}
                            </div>

                            <button
                                onClick={handleProcess}
                                disabled={isProcessing}
                                className={`w-full py-4 font-bold rounded-2xl transition-all flex items-center justify-center gap-3 text-xs tracking-[0.2em] relative z-10 ${
                                    isProcessing 
                                    ? 'bg-white/5 text-zinc-500 cursor-not-allowed border border-white/5' 
                                    : 'bg-blue-500 hover:bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] border border-blue-400/50'
                                }`}
                            >
                                {isProcessing ? (
                                    <span>A PROCESSAR OCR...</span>
                                ) : (
                                    <>
                                        <Play size={14} className="fill-current" />
                                        <span>INICIAR TRIAGEM</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Column 3: Triagem Results */}
                        <div className="bg-white/[0.03] border border-white/5 rounded-[2rem] p-6 flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-widest">Caixas de Triagem</div>
                                {resultsAvailable && (
                                    <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold">
                                        {MOCK_INVOICES.length} Docs
                                    </span>
                                )}
                            </div>

                            <div className="flex-1 flex flex-col gap-3 justify-center opacity-100 transition-opacity duration-500">
                                <button 
                                    disabled={!resultsAvailable}
                                    onClick={() => setSelectedCategory('GREEN')}
                                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${!resultsAvailable ? 'opacity-30 cursor-not-allowed border-white/5 bg-white/5' : selectedCategory === 'GREEN' ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <CheckCircle2 size={20} className={resultsAvailable ? 'text-green-500' : 'text-zinc-500'} />
                                        <span className={`text-sm font-bold ${resultsAvailable ? 'text-green-500' : 'text-zinc-500'}`}>APROVADAS</span>
                                    </div>
                                    <span className="text-xl font-black text-white">{resultsAvailable ? greenInvoices.length : '-'}</span>
                                </button>

                                <button 
                                    disabled={!resultsAvailable}
                                    onClick={() => setSelectedCategory('YELLOW')}
                                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${!resultsAvailable ? 'opacity-30 cursor-not-allowed border-white/5 bg-white/5' : selectedCategory === 'YELLOW' ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <AlertTriangle size={20} className={resultsAvailable ? 'text-yellow-500' : 'text-zinc-500'} />
                                        <span className={`text-sm font-bold ${resultsAvailable ? 'text-yellow-500' : 'text-zinc-500'}`}>REVISÃO</span>
                                    </div>
                                    <span className="text-xl font-black text-white">{resultsAvailable ? yellowInvoices.length : '-'}</span>
                                </button>

                                <button 
                                    disabled={!resultsAvailable}
                                    onClick={() => setSelectedCategory('RED')}
                                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${!resultsAvailable ? 'opacity-30 cursor-not-allowed border-white/5 bg-white/5' : selectedCategory === 'RED' ? 'bg-red-500/10 border-red-500/30' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <XCircle size={20} className={resultsAvailable ? 'text-red-500' : 'text-zinc-500'} />
                                        <span className={`text-sm font-bold ${resultsAvailable ? 'text-red-500' : 'text-zinc-500'}`}>REJEITADAS</span>
                                    </div>
                                    <span className="text-xl font-black text-white">{resultsAvailable ? redInvoices.length : '-'}</span>
                                </button>
                            </div>
                        </div>

                    </div>

                    {/* Bottom Row: Detailed Results List */}
                    {selectedCategory && (
                        <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] overflow-hidden flex flex-col flex-1 min-h-[250px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="p-6 border-b border-white/5 flex items-center gap-3 bg-white/[0.01]">
                                {selectedCategory === 'GREEN' && <CheckCircle2 size={18} className="text-green-500" />}
                                {selectedCategory === 'YELLOW' && <AlertTriangle size={18} className="text-yellow-500" />}
                                {selectedCategory === 'RED' && <XCircle size={18} className="text-red-500" />}
                                <h3 className="text-sm font-bold text-white uppercase tracking-widest">
                                    Detalhes: Faturas {selectedCategory === 'GREEN' ? 'Aprovadas' : selectedCategory === 'YELLOW' ? 'em Revisão' : 'Rejeitadas'}
                                </h3>
                            </div>

                            <div className="overflow-y-auto custom-scrollbar p-2">
                                {displayedInvoices.length === 0 ? (
                                    <div className="p-12 text-center text-zinc-600 text-xs uppercase tracking-widest">
                                        Nenhuma fatura nesta categoria
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                                        {displayedInvoices.map((inv) => (
                                            <div key={inv.id} className="p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group cursor-pointer">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className="p-2 rounded-lg bg-black/50 text-blue-400 flex-shrink-0">
                                                            <FileText size={16} />
                                                        </div>
                                                        <span className="text-sm font-medium text-zinc-200 truncate" title={inv.filename}>{inv.filename}</span>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-zinc-500 px-2 py-1 bg-black/30 rounded-md">
                                                        {(inv.confidence_score * 100).toFixed(0)}% OCR
                                                    </span>
                                                </div>
                                                
                                                <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                                                    <div>
                                                        <span className="text-zinc-600 block mb-1">Data Fatura</span>
                                                        <span className="text-zinc-300 font-medium">{inv.extracted_date || 'N/D'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-zinc-600 block mb-1">Ref. Projeto</span>
                                                        <span className="text-zinc-300 font-medium">{inv.reference_date}</span>
                                                    </div>
                                                </div>

                                                {inv.issues.length > 0 && (
                                                    <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                                                        <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest block mb-1">Motivo:</span>
                                                        <ul className="text-xs text-red-400/90 list-disc pl-4 space-y-1">
                                                            {inv.issues.map((issue, idx) => (
                                                                <li key={idx}>{issue.description}</li>
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
                    )}
                </div>
            </div>
        </div>
    );
};
