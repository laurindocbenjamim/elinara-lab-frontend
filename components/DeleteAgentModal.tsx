import React, { useState } from 'react';
import { AlertTriangle, X, Loader2, Trash2 } from 'lucide-react';

interface DeleteAgentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    agentName: string;
    isLoading?: boolean;
}

export const DeleteAgentModal: React.FC<DeleteAgentModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    agentName,
    isLoading = false
}) => {
    const [confirmationName, setConfirmationName] = useState('');

    if (!isOpen) return null;

    const isMatch = confirmationName.trim() === agentName.trim();

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full overflow-hidden transform transition-all scale-100">
                {/* Header */}
                <div className="bg-red-50 dark:bg-red-900/20 px-6 py-4 border-b border-red-100 dark:border-red-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 dark:bg-red-800/30 rounded-full">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <h3 className="text-lg font-bold text-red-900 dark:text-red-100">Delete Agent</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <p className="text-gray-700 dark:text-gray-300 font-medium">
                        This action is permanent and cannot be undone. All data sources and history associated with this agent will be erased.
                    </p>
                    <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 uppercase font-black tracking-widest">
                            Please type the name of the agent to confirm:
                        </p>
                        <p className="text-sm font-black text-gray-900 dark:text-white mb-3">
                            {agentName}
                        </p>
                        <input
                            type="text"
                            value={confirmationName}
                            onChange={(e) => setConfirmationName(e.target.value)}
                            placeholder="Type agent name..."
                            className="w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all dark:text-white"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-700">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-6 py-3 text-sm font-black uppercase tracking-widest text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-all disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={!isMatch || isLoading}
                        className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-500/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Trash2 className="h-4 w-4" />
                        )}
                        {isLoading ? 'Deleting...' : 'Confirm Deletion'}
                    </button>
                </div>
            </div>
        </div>
    );
};
