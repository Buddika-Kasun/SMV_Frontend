import React from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  XCircle, 
  X, 
  Loader2 
} from 'lucide-react';

export type ConfirmVariant = 'danger' | 'warning' | 'info' | 'success';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  isLoading?: boolean;
  details?: { label: string; value: string | number | React.ReactNode }[];
}

/**
 * Reusable Confirmation / Warning Modal Dialog
 * Used for all critical operations: approvals, rejections, disbursements,
 * payments, early settlements, password updates, and deletions.
 */
export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'warning',
  isLoading = false,
  details,
}) => {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: <XCircle className="w-6 h-6 text-rose-600" />,
      bgIcon: 'bg-rose-100 border-rose-200',
      btnConfirm: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200 focus:ring-rose-500',
      borderHeader: 'border-rose-100',
    },
    warning: {
      icon: <AlertTriangle className="w-6 h-6 text-amber-600" />,
      bgIcon: 'bg-amber-100 border-amber-200',
      btnConfirm: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200 focus:ring-amber-500',
      borderHeader: 'border-amber-100',
    },
    info: {
      icon: <Info className="w-6 h-6 text-blue-600" />,
      bgIcon: 'bg-blue-100 border-blue-200',
      btnConfirm: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 focus:ring-blue-500',
      borderHeader: 'border-blue-100',
    },
    success: {
      icon: <CheckCircle2 className="w-6 h-6 text-emerald-600" />,
      bgIcon: 'bg-emerald-100 border-emerald-200',
      btnConfirm: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 focus:ring-emerald-500',
      borderHeader: 'border-emerald-100',
    },
  }[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden transform animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className={`p-5 flex items-start gap-3.5 border-b ${variantStyles.borderHeader}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${variantStyles.bgIcon}`}>
            {variantStyles.icon}
          </div>
          <div className="flex-1 pr-2">
            <h3 className="text-base font-bold text-slate-900 leading-snug">
              {title}
            </h3>
            <div className="text-xs text-slate-600 mt-1 leading-relaxed">
              {description}
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Optional Metadata Details Grid */}
        {details && details.length > 0 && (
          <div className="p-4 bg-slate-50 border-b border-slate-100">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Action Summary Details
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {details.map((d, idx) => (
                <div key={idx} className="bg-white p-2 rounded-lg border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 block font-medium">
                    {d.label}
                  </span>
                  <span className="font-semibold text-slate-800 break-words">
                    {d.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="p-4 bg-slate-50/50 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 ${variantStyles.btnConfirm}`}
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
