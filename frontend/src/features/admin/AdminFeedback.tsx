import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { ConfirmDialog } from '../../admin/components/ConfirmDialog';
import { ToastProvider, useToast } from '../../admin/components/Toast';

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

function FeedbackInner({ isAdmin, children }: { isAdmin: boolean; children: React.ReactNode }) {
  const toast = useToast();
  const [error, setErrorState] = useState<string | null>(null);
  const [success, setSuccessState] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmOpts | null>(null);
  const [pending, setPending] = useState(false);

  const setError = useCallback((value: string | null) => {
    setErrorState(value);
    if (value) toast.push('error', value);
  }, [toast]);

  const setSuccess = useCallback((value: string | null) => {
    setSuccessState(value);
    if (value) toast.push('success', value);
  }, [toast]);

  const confirm = useCallback((opts: ConfirmOpts) => setConfirmState(opts), []);

  const value = useMemo(() => ({
    isAdmin, error, success, setError, setSuccess, savingKey, setSavingKey, confirm
  }), [isAdmin, error, success, savingKey, confirm, setError, setSuccess]);

  return (
    <Ctx.Provider value={value}>
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

export function AdminFeedbackProvider({ isAdmin, children }: { isAdmin: boolean; children: React.ReactNode }) {
  return (
    <ToastProvider>
      <FeedbackInner isAdmin={isAdmin}>{children}</FeedbackInner>
    </ToastProvider>
  );
}

export function useAdminFeedback() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('Admin feedback missing');
  return ctx;
}
