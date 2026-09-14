import React, { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';
import { ConfirmDialog } from './ConfirmDialog';

export function UnsavedGuard({
  dirty,
  message = 'Kaydedilmemiş değişiklikler var. Ayrılmak istiyor musunuz?'
}: {
  dirty: boolean;
  message?: string;
}) {
  const blocker = useBlocker(dirty);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  return (
    <ConfirmDialog
      open={blocker.state === 'blocked'}
      title="Kaydedilmemiş değişiklikler"
      message={message}
      confirmLabel="Ayrıl"
      cancelLabel="Kal"
      variant="warning"
      onConfirm={() => blocker.proceed?.()}
      onCancel={() => blocker.reset?.()}
    />
  );
}
