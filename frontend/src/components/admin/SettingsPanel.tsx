import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { api } from '../../services/api';

const RULES = [
  { key: 'rewardExpireDays', label: 'Kupon geçerlilik (gün)', hint: '1–3650', min: 1, max: 3650, step: 1 },
  { key: 'visitBonusPoints', label: 'Ziyaret bonus GP', hint: '0–10000', min: 0, max: 10000, step: 1 },
  { key: 'pointsExchangeRate', label: 'Puan kuru (1 TL için GP)', hint: '0’dan büyük', min: 0.01, max: 1000, step: 0.01 },
  { key: 'spendEarnRatePercent', label: 'Nakit kazanç oranı (%)', hint: '0–100', min: 0, max: 100, step: 0.1 }
];

type SettingRow = { key: string; value: string; description?: string };

export function SettingsPanel({
  onError,
  onSuccess
}: {
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await api.getSettings();
        const rows: SettingRow[] = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        const next: Record<string, string> = {};
        for (const rule of RULES) {
          const found = rows.find((r) => r.key === rule.key);
          next[rule.key] = found?.value ?? '';
        }
        if (!cancelled) setValues(next);
      } catch (err: any) {
        if (!cancelled) onError(err.message || 'Ayarlar yüklenemedi.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [onError]);

  const validate = (key: string, raw: string): string | null => {
    const rule = RULES.find((r) => r.key === key);
    if (!rule) return 'Bu ayar yönetilemez.';
    const value = Number(raw);
    if (!Number.isFinite(value)) return 'Geçerli bir sayı girin.';
    if (key === 'pointsExchangeRate' && value <= 0) return 'pointsExchangeRate 0’dan büyük olmalıdır.';
    if (value < rule.min || value > rule.max) return `${rule.label} ${rule.hint} aralığında olmalıdır.`;
    return null;
  };

  const save = async (key: string) => {
    const current = (values[key] ?? '').trim();
    const error = validate(key, current);
    if (error) {
      onError(error);
      return;
    }
    setSaving(key);
    try {
      await api.updateSetting(key, { value: current });
      onSuccess('Ayar kaydedildi.');
    } catch (err: any) {
      onError(err.message || 'Ayar kaydedilemedi.');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return <div style={{ color: '#64748b' }}>Ayarlar yükleniyor…</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Ayarlar</h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 4 }}>
          GölPuan ve kupon süreleri. Yalnız yönetici değiştirebilir.
        </p>
      </div>
      <div style={{ display: 'grid', gap: '1rem', maxWidth: 640 }}>
        {RULES.map((rule) => (
          <div key={rule.key} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1.1rem 1.25rem' }}>
            <label style={{ display: 'block', fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>{rule.label}</label>
            <p style={{ margin: '0 0 8px', fontSize: '0.8rem', color: '#64748b' }}>{rule.hint}</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="number"
                step={rule.step}
                min={rule.min}
                max={rule.max}
                value={values[rule.key] ?? ''}
                onChange={(e) => setValues((prev) => ({ ...prev, [rule.key]: e.target.value }))}
                style={{ flex: 1, padding: '0.65rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: 8, background: '#f8fafc' }}
              />
              <button
                type="button"
                onClick={() => void save(rule.key)}
                disabled={saving === rule.key}
                style={{
                  background: '#1d5f60',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '0 1rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Save size={16} />
                Kaydet
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
