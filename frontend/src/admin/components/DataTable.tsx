import React from 'react';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { Skeleton } from './Skeleton';

export type Column<T> = {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  align?: 'left' | 'right';
};

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  loading,
  emptyTitle,
  emptyDescription,
  error,
  onRetry,
  actions,
  caption,
  stickyHeader
}: {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  error?: string | null;
  onRetry?: () => void;
  actions?: (row: T) => React.ReactNode;
  caption: string;
  stickyHeader?: boolean;
}) {
  if (loading) return <Skeleton variant="table" />;
  if (error) return <ErrorState description={error} retry={onRetry} />;
  if (!rows.length) return <EmptyState title={emptyTitle || 'Kayıt yok.'} description={emptyDescription} />;

  return (
    <div className={`admin-table-wrap${stickyHeader ? ' is-sticky' : ''}`}>
      <table className="admin-table">
        <caption className="admin-sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} scope="col" style={{ textAlign: col.align || 'left' }}>{col.header}</th>
            ))}
            {actions ? <th scope="col"><span className="admin-sr-only">İşlemler</span></th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowId(row)}>
              {columns.map((col) => (
                <td key={col.key} style={{ textAlign: col.align || 'left' }}>
                  {col.render ? col.render(row) : (row as any)[col.key]}
                </td>
              ))}
              {actions ? <td className="admin-table-actions">{actions(row)}</td> : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TableWrap({ children }: { children: React.ReactNode }) {
  return <div className="admin-table-wrap">{children}</div>;
}
