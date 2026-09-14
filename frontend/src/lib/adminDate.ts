const ISTANBUL = 'Europe/Istanbul';

const pad = (n: number) => String(n).padStart(2, '0');

export function formatDateTime(value?: string | Date | null): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: ISTANBUL,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || '';
  return `${get('day')}.${get('month')}.${get('year')} ${get('hour')}:${get('minute')}`;
}

export function formatDate(value?: string | Date | null): string {
  const full = formatDateTime(value);
  return full === '—' ? '—' : full.slice(0, 10);
}

export function formatTime(value?: string | Date | null): string {
  const full = formatDateTime(value);
  return full === '—' ? '—' : full.slice(11);
}

export function formatGp(value?: number | string | null): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0 GP';
  return `${n.toLocaleString('tr-TR')} GP`;
}

export function formatCurrency(value?: number | string | null): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return '₺0,00';
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n);
}

export function toLocalInput(value?: string) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: ISTANBUL,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}

export function rangePreset(preset: 'today' | '7d' | '30d' | 'custom') {
  return preset;
}
