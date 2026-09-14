import React, { useState } from 'react';
import { MEDIA_FALLBACK, resolveMediaUrl } from '../../lib/mediaUrl';

export const SafeImg: React.FC<{ src?: string | null; alt?: string; style?: React.CSSProperties }> = ({ src, alt, style }) => {
  const [broken, setBroken] = useState(false);
  const resolved = resolveMediaUrl(src);
  if (!resolved || broken) {
    return <img src={MEDIA_FALLBACK} alt={alt || ''} style={style} />;
  }
  return <img src={resolved} alt={alt || ''} style={style} onError={() => setBroken(true)} />;
};

export const btnPrimary: React.CSSProperties = {
  background: '#1d5f60',
  color: '#fff',
  border: 'none',
  padding: '0.65rem 1.15rem',
  borderRadius: 10,
  fontWeight: 800,
  cursor: 'pointer',
  fontFamily: 'Manrope, system-ui, sans-serif'
};

export const btnDanger: React.CSSProperties = {
  ...btnPrimary,
  background: '#b91c1c'
};

export const btnNeutral: React.CSSProperties = {
  background: '#fff',
  color: '#1c2e2e',
  border: '1px solid #d7e3e0',
  padding: '0.65rem 1.15rem',
  borderRadius: 10,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'Manrope, system-ui, sans-serif'
};

export const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.6rem 0.8rem',
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  background: '#f8fafc',
  fontFamily: 'Manrope, system-ui, sans-serif'
};

export const cardStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: '1.25rem'
};
