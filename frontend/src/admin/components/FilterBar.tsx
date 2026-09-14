import React from 'react';
import { Button } from './Button';

export function FilterBar({
  search,
  onSearch,
  searchPlaceholder = 'Ara',
  searchLabel = 'Ara',
  filters,
  activeCount,
  onClear,
  children,
  onSubmit
}: {
  search: string;
  onSearch: (value: string) => void;
  searchPlaceholder?: string;
  searchLabel?: string;
  filters?: React.ReactNode;
  activeCount: number;
  onClear: () => void;
  children?: React.ReactNode;
  onSubmit?: () => void;
}) {
  return (
    <form
      className="admin-filter"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
    >
      <div className="admin-filter-search">
        <label htmlFor="admin-filter-search" className="admin-sr-only">{searchLabel}</label>
        <input
          id="admin-filter-search"
          data-testid="admin-search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="admin-input"
        />
      </div>
      <div className="admin-filter-fields">{filters}{children}</div>
      {activeCount > 0 && <span className="admin-chip">{activeCount} filtre</span>}
      <Button type="button" variant="ghost" size="sm" onClick={onClear}>Temizle</Button>
    </form>
  );
}
