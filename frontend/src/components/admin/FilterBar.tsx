import React from 'react';

export function FilterBar({
  search,
  onSearch,
  searchPlaceholder = 'Ara',
  filters,
  activeCount,
  onClear,
  children
}: {
  search: string;
  onSearch: (value: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  activeCount: number;
  onClear: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '0.85rem 1rem' }}>
      <input
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder={searchPlaceholder}
        style={{ flex: '1 1 220px', minWidth: 180, padding: '0.55rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: 8 }}
      />
      {filters}
      {children}
      {activeCount > 0 && (
        <span style={{ background: '#e8f2f2', color: '#1d5f60', borderRadius: 999, padding: '4px 10px', fontSize: 12, fontWeight: 800 }}>
          {activeCount} filtre
        </span>
      )}
      <button type="button" onClick={onClear} style={{ border: '1px solid #cbd5e1', background: '#fff', borderRadius: 8, padding: '6px 12px', fontWeight: 700, cursor: 'pointer' }}>
        Temizle
      </button>
    </div>
  );
}

export function PaginationBar({
  page,
  pageSize,
  totalCount,
  onPage,
  onPageSize
}: {
  page: number;
  pageSize: number;
  totalCount: number;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(totalCount / pageSize));
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
      <div style={{ fontSize: 13, color: '#64748b' }}>{totalCount} kayıt</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>Önceki</button>
        <span style={{ fontSize: 13, fontWeight: 700 }}>{page} / {pages}</span>
        <button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>Sonraki</button>
        <select value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))} style={{ padding: '6px 8px', borderRadius: 8, border: '1px solid #cbd5e1' }}>
          {[25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
    </div>
  );
}

export function EmptyState({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div style={{ background: '#fff', border: '1px dashed #d7e3e0', borderRadius: 20, padding: '2rem', color: '#5b6f6e', textAlign: 'center' }}>
      <div style={{ fontWeight: 700, color: '#1c2e2e' }}>{title}</div>
      {actionLabel && onAction && (
        <button type="button" onClick={onAction} style={{ marginTop: 12, background: '#1d5f60', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 14px', fontWeight: 800, cursor: 'pointer' }}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function ListError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '1rem', color: '#991b1b', display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
      <span>{message}</span>
      <button type="button" onClick={onRetry} style={{ background: '#fff', border: '1px solid #fecaca', borderRadius: 8, padding: '6px 10px', fontWeight: 700, cursor: 'pointer' }}>Tekrar dene</button>
    </div>
  );
}

export function TableWrap({ children }: { children: React.ReactNode }) {
  return <div className="admin-table-wrap" style={{ overflowX: 'auto', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16 }}>{children}</div>;
}
