import React from 'react';

export type ConfirmDialogProps = {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
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
  pending = false,
  onConfirm,
  onCancel
}) => {
  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1400
      }}
      onClick={pending ? undefined : onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '440px',
          maxWidth: '92vw',
          background: '#fff',
          borderRadius: 16,
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          boxShadow: '0 20px 40px rgba(0,0,0,0.12)'
        }}
      >
        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>{title}</h3>
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{message}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            type="button"
            disabled={pending}
            onClick={onCancel}
            style={{
              padding: '10px 14px',
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: 10,
              color: '#0f172a',
              fontWeight: 700,
              cursor: pending ? 'not-allowed' : 'pointer'
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={onConfirm}
            style={{
              padding: '10px 14px',
              background: danger ? '#b91c1c' : '#1d5f60',
              border: 'none',
              borderRadius: 10,
              color: '#fff',
              fontWeight: 700,
              cursor: pending ? 'not-allowed' : 'pointer'
            }}
          >
            {pending ? 'İşleniyor…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
