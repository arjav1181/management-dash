'use client';

import { create } from 'zustand';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  exiting?: boolean;
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
      set((state) => ({
        toasts: state.toasts.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
      }));
      setTimeout(() => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
      }, 200);
    }, 4000);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
    })),
}));

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    if (toast.exiting) {
      setRemoving(true);
      const timer = setTimeout(() => onRemove(toast.id), 200);
      return () => clearTimeout(timer);
    }
  }, [toast.exiting, toast.id, onRemove]);

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl min-w-[300px] max-w-md',
        'bg-bg-secondary/95 backdrop-blur-sm border-border-primary',
        removing ? 'animate-toastOut' : 'animate-toastIn'
      )}
    >
      <span className={iconColors[toast.type]}>{icons[toast.type]}</span>
      <p className="flex-1 text-sm text-text-primary">{toast.message}</p>
      <button
        onClick={() => setRemoving(true)}
        className="text-text-muted hover:text-text-primary transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}

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
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onRemove={removeToast} />
        </div>
      ))}
    </div>
  );
}
