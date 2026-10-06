import React, { useCallback, useRef } from 'react';
import { X } from 'lucide-react';
import { useFocusTrap } from '../a11y';

export function Drawer({
  open,
  title,
  children,
  onClose,
  labelledBy,
  wide = false
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  labelledBy?: string;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => onClose(), [onClose]);
  useFocusTrap(open, ref, close);
  if (!open) return null;

  return (
    <div className="admin-overlay admin-drawer-overlay" onClick={close}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy || 'admin-drawer-title'}
        className={`admin-drawer${wide ? ' admin-drawer-wide' : ''}`}
        tabIndex={-1}
        data-testid="citizen-drawer"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-modal-head">
          <h2 id={labelledBy || 'admin-drawer-title'}>{title}</h2>
          <button type="button" className="admin-icon-btn" onClick={close} aria-label="Kapat">
            <X size={18} />
          </button>
        </div>
        <div className="admin-drawer-body">{children}</div>
      </div>
    </div>
  );
}
