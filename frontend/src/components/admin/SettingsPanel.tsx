import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { Button, NumberInput, Skeleton, UnsavedGuard } from '../../admin/components';

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
  const [saved, setSaved] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
        if (!cancelled) {
          setValues(next);
          setSaved(next);
        }
      } catch (err: any) {
        if (!cancelled) onError(err.message || 'Ayarlar yüklenemedi.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [onError]);

  const dirty = useMemo(
    () => RULES.some((rule) => (values[rule.key] ?? '') !== (saved[rule.key] ?? '')),
    [values, saved]
  );

  const validate = (key: string, raw: string): string | null => {
    const rule = RULES.find((r) => r.key === key);
    if (!rule) return 'Bu ayar yönetilemez.';
    const value = Number(raw);
    if (!Number.isFinite(value)) return 'Geçerli bir sayı girin.';
    if (key === 'pointsExchangeRate' && value <= 0) return 'Puan kuru 0’dan büyük olmalıdır.';
    if (value < rule.min || value > rule.max) return `${rule.label} ${rule.hint} aralığında olmalıdır.`;
    return null;
  };

  const saveAll = async () => {
    for (const rule of RULES) {
      const error = validate(rule.key, (values[rule.key] ?? '').trim());
      if (error) {
        onError(error);
        return;
      }
    }
    setSaving(true);
    try {
      for (const rule of RULES) {
        if ((values[rule.key] ?? '') === (saved[rule.key] ?? '')) continue;
        await api.updateSetting(rule.key, { value: (values[rule.key] ?? '').trim() });
      }
      setSaved(values);
      onSuccess('Ayarlar kaydedildi.');
    } catch (err: any) {
      onError(err.message || 'Ayar kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Skeleton variant="detail" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 640 }}>
      <UnsavedGuard dirty={dirty} />
      {RULES.map((rule) => (
        <div key={rule.key} className="admin-card">
          <NumberInput
            label={rule.label}
            helper={rule.hint}
            step={rule.step}
            min={rule.min}
            max={rule.max}
            value={values[rule.key] ?? ''}
            onChange={(e) => setValues((prev) => ({ ...prev, [rule.key]: e.target.value }))}
          />
        </div>
      ))}
      <div className="admin-sticky-save">
        <Button onClick={() => void saveAll()} loading={saving} disabled={!dirty}>
          Değişiklikleri Kaydet
        </Button>
        {dirty ? <span className="admin-muted">Kaydedilmemiş değişiklik var.</span> : <span className="admin-muted">Güncel.</span>}
      </div>
    </div>
  );
}
