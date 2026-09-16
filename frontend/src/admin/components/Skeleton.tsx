import React from 'react';

export function Skeleton({ variant = 'table' }: { variant?: 'table' | 'card' | 'drawer' | 'detail' }) {
  if (variant === 'card') {
    return (
      <div className="admin-skel-grid" aria-busy="true" aria-label="Yükleniyor">
        {[1, 2, 3, 4].map((n) => <div key={n} className="admin-skel-card" />)}
      </div>
    );
  }
  if (variant === 'drawer' || variant === 'detail') {
    return (
      <div className="admin-skel-detail" aria-busy="true" aria-label="Yükleniyor">
        <div className="admin-skel-line wide" />
        <div className="admin-skel-line" />
        <div className="admin-skel-line mid" />
        <div className="admin-skel-block" />
      </div>
    );
  }
  return (
    <div className="admin-skel-table" aria-busy="true" aria-label="Tablo yükleniyor">
      <div className="admin-skel-line wide" />
      {[1, 2, 3, 4, 5].map((n) => <div key={n} className="admin-skel-row" />)}
    </div>
  );
}

export const AdminSkeletonCard = () => <div className="admin-skel-card" aria-hidden="true" />;
export const AdminSkeletonTable = ({ rows = 5 }: { rows?: number }) => (
  <div className="admin-skel-table" aria-busy="true" aria-label="Tablo yükleniyor">
    <div className="admin-skel-line wide" />
    {Array.from({ length: rows }).map((_, i) => <div key={i} className="admin-skel-row" />)}
  </div>
);
