import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Download, FileText, Activity } from 'lucide-react';
import { agentService } from '../services/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import '../styles/PageLayout.css';

interface AgentMatch {
    id: string;
    filename: string;
    phone: string;
    status: string;
    timestamp?: string;
    created_at?: string;
    progress?: number;
}

export const AgentHistory: React.FC = () => {
    const { id: agentId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [matches, setMatches] = useState<AgentMatch[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

    useEffect(() => {
        fetchHistory();
    }, [agentId]);

    const fetchHistory = async () => {
        setIsLoading(true);
        try {
            const data = await agentService.getMatches();
            setMatches(data);
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to load history' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadPDF = () => {
        if (matches.length === 0) return;

        const doc = new jsPDF();

        // Header
        doc.setFontSize(20);
        doc.text('Agent Execution History', 14, 22);

        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Instance: ${agentId || 'Unknown'}`, 14, 30);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 36);

        // Table
        const tableBody = matches.map(match => [
            match.filename || 'N/A',
            match.phone || 'N/A',
            match.status || 'Unknown',
            match.progress ? `${match.progress}%` : 'N/A',
            match.timestamp || match.created_at ? new Date(match.timestamp || match.created_at!).toLocaleString() : 'Unknown'
        ]);

        (doc as any).autoTable({
            startY: 45,
            head: [['Source File', 'Target Vector', 'Status', 'Progress', 'Timestamp']],
            body: tableBody,
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246] },
            styles: { fontSize: 9, cellPadding: 4 }
        });

        doc.save(`agent_${agentId}_history_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'completed': return 'text-green-400';
            case 'failed': return 'text-red-400';
            case 'processing': return 'text-blue-400';
            default: return 'text-zinc-500';
        }
    };

    return (
        <div className="dashboard-page h-[calc(100vh-4rem)] overflow-hidden flex flex-col p-4 lg:p-12 bg-[#050505]" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
            <div className="max-w-6xl mx-auto w-full flex-grow flex flex-col justify-start -mt-5 z-10 min-h-0">

                {/* Header */}
                <header className="mb-6 flex items-center justify-between text-left">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => navigate('/agent', { state: { selectedAgent: agentId } })}
                            className="p-2 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all text-zinc-500 hover:text-white"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white truncate">
                                Execution History
                            </h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[11px] font-medium text-zinc-500 tracking-wide uppercase">Instance:</span>
                                <span className="text-[11px] font-bold text-blue-400/80 tracking-wide uppercase">{agentId}</span>
                            </div>
                        </div>
                    </div>
                </header>

                {message && (
                    <div className="mb-6 p-4 rounded-xl border bg-red-500/10 border-red-500/20 text-red-400 flex items-center justify-between">
                        <span className="text-sm font-medium">{message.text}</span>
                    </div>
                )}

                {/* Main Content */}
                <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-3xl flex flex-col overflow-hidden">

                    {/* Toolbar */}
                    <div className="p-6 border-b border-white/5 flex flex-wrap gap-4 items-center justify-between bg-white/[0.01]">
                        <div className="flex items-center gap-3">
                            <Clock size={18} className="text-zinc-500" />
                            <h3 className="text-sm font-semibold text-zinc-200">Historical Records</h3>
                            <span className="px-2.5 py-0.5 rounded-full bg-white/5 text-xs font-medium text-zinc-400">
                                {matches.length} entries
                            </span>
                        </div>

                        <button
                            onClick={handleDownloadPDF}
                            disabled={matches.length === 0 || isLoading}
                            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${matches.length === 0 || isLoading
                                ? 'bg-white/5 text-zinc-500 cursor-not-allowed'
                                : 'bg-blue-500 hover:bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)]'
                                }`}
                        >
                            <Download size={16} />
                            Download PDF
                        </button>
                    </div>

                    {/* Table Area */}
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        {isLoading ? (
                            <div className="h-full flex items-center justify-center text-zinc-500 text-sm">Loading history...</div>
                        ) : matches.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-4">
                                <Activity size={48} className="text-white/5" />
                                <div className="text-center">
                                    <p className="text-sm font-medium text-zinc-400">No history found</p>
                                    <p className="text-xs mt-1">This agent hasn't logged any operations yet.</p>
                                </div>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/[0.02] text-xs font-semibold text-zinc-500 uppercase tracking-wider sticky top-0 z-10">
                                        <th className="p-4 font-medium pl-6">Source File</th>
                                        <th className="p-4 font-medium">Target Vector</th>
                                        <th className="p-4 font-medium">Status / Progress</th>
                                        <th className="p-4 font-medium text-right pr-6">Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {matches.map((match, i) => (
                                        <tr key={match.id || i} className="border-b border-white/5 transition-colors hover:bg-white/[0.02]">
                                            <td className="p-4 pl-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-white/5">
                                                        <FileText size={16} className="text-zinc-400" />
                                                    </div>
                                                    <span className="text-sm font-medium text-zinc-200">{match.filename || 'Unknown'}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-xs font-mono text-zinc-300">
                                                    {match.phone || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-[11px] font-bold uppercase tracking-wider ${getStatusColor(match.status)}`}>
                                                        {match.status || 'UNKNOWN'}
                                                    </span>
                                                    {match.progress !== undefined && (
                                                        <span className="text-xs text-zinc-500">
                                                            {match.progress}%
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right pr-6 text-xs text-zinc-500">
                                                {match.timestamp || match.created_at ? new Date(match.timestamp || match.created_at!).toLocaleString() : 'N/A'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
