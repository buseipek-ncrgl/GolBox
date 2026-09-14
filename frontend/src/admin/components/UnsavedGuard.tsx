import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ConfirmDialog } from './ConfirmDialog';

export function UnsavedGuard({
  dirty,
  message = 'Kaydedilmemiş değişiklikler var. Ayrılmak istiyor musunuz?'
}: {
  dirty: boolean;
  message?: string;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingTo, setPendingTo] = useState<string | null>(null);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    if (!dirty) return;
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as HTMLElement | null)?.closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('#')) return;
      const url = new URL(href, window.location.origin);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === location.pathname) return;
      event.preventDefault();
      event.stopPropagation();
      setPendingTo(`${url.pathname}${url.search}${url.hash}`);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [dirty, location.pathname]);

  return (
    <ConfirmDialog
      open={!!pendingTo}
      title="Kaydedilmemiş değişiklikler"
      message={message}
      confirmLabel="Ayrıl"
      cancelLabel="Kal"
      variant="warning"
      onConfirm={() => {
        const to = pendingTo;
        setPendingTo(null);
        if (to) navigate(to);
      }}
      onCancel={() => setPendingTo(null)}
    />
  );
}
