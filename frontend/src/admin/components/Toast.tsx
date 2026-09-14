import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

type Toast = { id: number; type: ToastType; message: string };

type Ctx = {
  push: (type: ToastType, message: string) => void;
};

const ToastCtx = createContext<Ctx | null>(null);

let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((type: ToastType, message: string) => {
    const id = nextId++;
    setToasts((prev) => [...prev.slice(-4), { id, type, message }]);
    const ms = type === 'error' ? 5000 : type === 'warning' ? 4500 : 3500;
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, ms);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="admin-toasts" aria-live="polite" aria-relevant="additions" aria-atomic="false">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`admin-toast admin-toast-${t.type}`}
            role={t.type === 'error' ? 'alert' : 'status'}
          >
            {t.message}
            <button
              type="button"
              className="admin-icon-btn"
              aria-label="Bildirimi kapat"
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('ToastProvider missing');
  return ctx;
}
