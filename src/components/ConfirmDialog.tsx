import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDanger = true,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-[#121212c4] backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl border border-gray-200 w-full max-w-md p-6 relative shadow-2xl text-left"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-150 mb-4">
              <div className="flex items-center gap-2">
                {isDanger && (
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                )}
                <h3 className="text-base font-black text-slate-800 tracking-tight leading-4">
                  {title}
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-neutral-400 hover:text-slate-800 rounded-full hover:bg-slate-50 transition border border-gray-150 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Message */}
            <p className="text-xs font-semibold text-slate-500 leading-relaxed mb-6">
              {message}
            </p>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-black text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer select-none"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`px-4 py-2 text-xs font-black text-white rounded-xl transition cursor-pointer select-none ${
                  isDanger
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
