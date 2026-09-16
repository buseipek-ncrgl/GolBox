import React, { useCallback, useRef } from 'react';
import { useFocusTrap } from '../a11y';
import { Button } from './Button';

export type ConfirmDialogProps = {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  variant?: 'warning' | 'danger';
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title = 'Onay',
  message,
  confirmLabel = 'Devam et',
  cancelLabel = 'Vazgeç',
  danger = false,
  variant,
  pending = false,
  onConfirm,
  onCancel
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => {
    if (!pending) onCancel();
  }, [pending, onCancel]);
  useFocusTrap(open, ref, close);
  if (!open) return null;

  const isDanger = danger || variant === 'danger';
  const tone = isDanger ? 'danger' : 'warning';

  return (
    <div className="admin-overlay" onClick={close}>
      <div
        ref={ref}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="admin-confirm-title"
        aria-describedby="admin-confirm-message"
        className={`admin-modal admin-modal-sm admin-confirm admin-confirm-${tone}`}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="admin-confirm-title">{title}</h2>
        <p id="admin-confirm-message">{message}</p>
        <div className="admin-modal-foot">
          <Button variant="secondary" disabled={pending} onClick={onCancel}>{cancelLabel}</Button>
          <Button variant={isDanger ? 'danger' : 'primary'} loading={pending} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};
