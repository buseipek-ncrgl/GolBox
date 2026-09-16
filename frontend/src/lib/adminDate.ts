const ISTANBUL = 'Europe/Istanbul';
export const ISTANBUL_TZ = ISTANBUL;
export const ISTANBUL_OFFSET = '+03:00';
export const CRITICAL_ORDER_MINUTES = 20;

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

export function splitIstanbulDateTime(value?: string | Date | null): { date: string; time: string } {
  const iso = !value ? '' : value instanceof Date ? value.toISOString() : value;
  const local = toLocalInput(iso);
  if (!local) return { date: '', time: '' };
  const [date, time] = local.split('T');
  return { date: date || '', time: (time || '').slice(0, 5) };
}

export function istanbulDateTimeToIso(date: string, time?: string): string {
  if (!date) return '';
  const hhmm = (time && time.length >= 5 ? time.slice(0, 5) : '00:00');
  return `${date}T${hhmm}:00${ISTANBUL_OFFSET}`;
}

export function istanbulDateToIsoStart(date: string): string {
  return istanbulDateTimeToIso(date, '00:00');
}

export function istanbulDateToIsoEnd(date: string): string {
  if (!date) return '';
  return `${date}T23:59:59${ISTANBUL_OFFSET}`;
}

export function rangePreset(preset: 'today' | '7d' | '30d' | 'custom') {
  return preset;
}
