import React, { useCallback, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { useFocusTrap } from '../a11y';

export function Modal({
  open,
  title,
  size = 'md',
  children,
  footer,
  onClose
}: {
  open: boolean;
  title: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useFocusTrap(open, ref, onClose);
  if (!open) return null;

  return (
    <div className="admin-overlay" onClick={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`admin-modal admin-modal-${size}`}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-modal-head">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="admin-icon-btn" onClick={onClose} aria-label="Kapat">
            <X size={18} />
          </button>
        </div>
        <div className="admin-modal-body">{children}</div>
        {footer ? <div className="admin-modal-foot">{footer}</div> : null}
      </div>
    </div>
  );
}
