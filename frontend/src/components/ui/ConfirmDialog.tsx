'use client';

import { useEffect } from 'react';
import { AlertTriangle, Trash2, XCircle, LucideIcon } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'warning';
  icon?: LucideIcon;
  loading?: boolean;
}

const variantMap = {
  danger: {
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    btn: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    defaultIcon: Trash2,
  },
  warning: {
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    btn: 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-400',
    defaultIcon: XCircle,
  },
};

export default function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title,
  message,
  confirmLabel = 'Confirm',
  variant = 'danger',
  icon: IconProp,
  loading = false,
}: ConfirmDialogProps) {
  const v = variantMap[variant];
  const Icon = IconProp ?? v.defaultIcon;

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter') onConfirm();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onCancel, onConfirm]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Top accent bar */}
        <div className={`h-1 w-full ${variant === 'danger' ? 'bg-red-500' : 'bg-amber-400'}`} />

        <div className="px-6 pt-6 pb-5">
          {/* Icon + title */}
          <div className="flex items-start gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${v.iconBg}`}>
              <Icon size={22} className={v.iconColor} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-gray-900 leading-snug">{title}</h3>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">{message}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              No, keep it
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-60 ${v.btn}`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Working…
                </span>
              ) : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
