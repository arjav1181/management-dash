'use client';

import { create } from 'zustand';
import { cn } from '@/lib/utils/cn';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (type: ToastType, message: string) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (type, message) => {
    const id = Math.random().toString(36).slice(2);
    set((state) => ({ toasts: [...state.toasts, { id, type, message }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

const icons = {
  success: <CheckCircle size={18} />,
  error: <XCircle size={18} />,
  warning: <AlertTriangle size={18} />,
  info: <Info size={18} />,
};

const iconColors = {
  success: 'text-emerald',
  error: 'text-rose',
  warning: 'text-amber',
  info: 'text-info',
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl animate-fadeIn min-w-[300px] max-w-md',
            'bg-bg-secondary border-border-primary'
          )}
        >
          <span className={iconColors[toast.type]}>{icons[toast.type]}</span>
          <p className="flex-1 text-sm text-text-primary">{toast.message}</p>
          <button onClick={() => removeToast(toast.id)} className="text-text-muted hover:text-text-primary">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
