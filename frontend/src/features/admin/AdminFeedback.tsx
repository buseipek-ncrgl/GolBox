import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';

type ConfirmOpts = {
  title?: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => Promise<void> | void;
};

type Feedback = {
  isAdmin: boolean;
  error: string | null;
  success: string | null;
  setError: (value: string | null) => void;
  setSuccess: (value: string | null) => void;
  savingKey: string | null;
  setSavingKey: (value: string | null) => void;
  confirm: (opts: ConfirmOpts) => void;
};

const Ctx = createContext<Feedback | null>(null);

export function AdminFeedbackProvider({ isAdmin, children }: { isAdmin: boolean; children: React.ReactNode }) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmOpts | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!success) return;
    const t = window.setTimeout(() => setSuccess(null), 4000);
    return () => window.clearTimeout(t);
  }, [success]);

  const confirm = useCallback((opts: ConfirmOpts) => setConfirmState(opts), []);

  const value = useMemo(() => ({
    isAdmin, error, success, setError, setSuccess, savingKey, setSavingKey, confirm
  }), [isAdmin, error, success, savingKey, confirm]);

  return (
    <Ctx.Provider value={value}>
      {error && (
        <div style={{ background: '#fef2f2', borderBottom: '1px solid #fecaca', color: '#991b1b', padding: '0.75rem 2rem', fontSize: '0.85rem' }}>{error}</div>
      )}
      {success && (
        <div style={{ background: '#f0fdf4', borderBottom: '1px solid #bbf7d0', color: '#166534', padding: '0.75rem 2rem', fontSize: '0.85rem' }}>{success}</div>
      )}
      {children}
      <ConfirmDialog
        open={!!confirmState}
        title={confirmState?.title}
        message={confirmState?.message || ''}
        confirmLabel={confirmState?.confirmLabel}
        danger={confirmState?.danger}
        pending={pending}
        onCancel={() => setConfirmState(null)}
        onConfirm={async () => {
          if (!confirmState) return;
          setPending(true);
          try {
            await confirmState.onConfirm();
            setConfirmState(null);
          } finally {
            setPending(false);
          }
        }}
      />
    </Ctx.Provider>
  );
}

export function useAdminFeedback() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('Admin feedback missing');
  return ctx;
}
