import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md';

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className = '',
  type = 'button',
  disabled,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`admin-btn admin-btn-${variant} admin-btn-${size} ${className}`.trim()}
      {...rest}
    >
      {loading ? <span className="admin-btn-spinner" aria-hidden="true" /> : icon}
      <span>{loading ? 'Kaydediliyor…' : children}</span>
    </button>
  );
}
