import React from 'react';
import { Button } from './Button';

export function Pagination({
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
  onPageSize?: (size: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(totalCount / Math.max(pageSize, 1)));
  return (
    <div className="admin-pagination" role="navigation" aria-label="Sayfalama">
      <div className="admin-muted">{totalCount} kayıt</div>
      <div className="admin-pagination-controls">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>Önceki</Button>
        <span aria-current="page">{page} / {pages}</span>
        <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>Sonraki</Button>
        {onPageSize ? (
          <>
            <label className="admin-sr-only" htmlFor="admin-page-size">Sayfa boyutu</label>
            <select
              id="admin-page-size"
              className="admin-input admin-input-sm"
              value={pageSize}
              onChange={(e) => onPageSize(Number(e.target.value))}
            >
              {[25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </>
        ) : null}
      </div>
    </div>
  );
}

export const PaginationBar = Pagination;
