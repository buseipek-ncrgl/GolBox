import React from 'react';
import { Trash2, X } from 'lucide-react';
import { Button } from './Button';

export function BulkSelectionBar({ count, actionLabel = 'Seçilenleri kaldır', onAction, onClear, danger = true }: { count: number; actionLabel?: string; onAction: () => void; onClear: () => void; danger?: boolean }) {
  if (!count) return null;
  return <div className="admin-bulk-bar" role="region" aria-label="Toplu işlemler"><strong>{count} kayıt seçildi</strong><Button size="sm" variant={danger ? 'danger' : 'secondary'} onClick={onAction}><Trash2 size={15} />{actionLabel}</Button><Button size="sm" variant="ghost" onClick={onClear}><X size={15} />Seçimi kaldır</Button></div>;
}

export function SelectionCheckbox({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return <label className="admin-selection-check"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span className="admin-sr-only">{label}</span></label>;
}
