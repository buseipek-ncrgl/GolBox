import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { BadgeCheck, Coins, Gift, MapPinCheck } from 'lucide-react';
import { Button, NumberInput, Skeleton, UnsavedGuard } from '../../admin/components';

const RULES = [
  { key: 'rewardExpireDays', label: 'Kupon geçerlilik (gün)', hint: 'Kazanılan kuponun kaç gün geçerli kalacağını belirler (1–3650).', min: 1, max: 3650, step: 1 },
  { key: 'visitBonusPoints', label: 'Ziyaret bonus GP', hint: 'QR ziyaret kaydında vatandaşa eklenecek GölPuan (0–10000).', min: 0, max: 10000, step: 1 },
  { key: 'pointsExchangeRate', label: '1 TL karşılığı GölPuan', hint: 'Nakit harcamada 1 TL için kazanılacak GölPuan miktarı. 0’dan büyük olmalıdır.', min: 0.01, max: 1000, step: 0.01 },
  { key: 'spendEarnRatePercent', label: 'Nakit harcamada GölPuan kazanım oranı (%)', hint: 'Nakit işlem tutarının yüzde kaçı GölPuan olarak kazandırılır (0–100).', min: 0, max: 100, step: 0.1 }
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
    if (key === 'pointsExchangeRate' && value <= 0) return '1 TL karşılığı GölPuan 0’dan büyük olmalıdır.';
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

  const icons: Record<string, React.ReactNode> = {
    rewardExpireDays: <Gift size={19} />,
    visitBonusPoints: <MapPinCheck size={19} />,
    pointsExchangeRate: <Coins size={19} />,
    spendEarnRatePercent: <BadgeCheck size={19} />
  };

  return (
    <div className="settings-page">
      <UnsavedGuard dirty={dirty} />
      <section className="settings-intro"><div><strong>Sadakat ve ödül kuralları</strong><p>Mobil uygulamadaki GölPuan kazanımı, ziyaret bonusu ve kupon süresini merkezi olarak yönetin.</p></div><span className={dirty ? 'is-dirty' : ''}>{dirty ? 'Kaydedilmemiş değişiklik' : 'Tüm ayarlar güncel'}</span></section>
      <div className="settings-grid">{RULES.map((rule) => (
        <section key={rule.key} className="settings-rule">
          <div className="settings-rule-icon">{icons[rule.key]}</div>
          <div className="settings-rule-content"><NumberInput label={rule.label} helper={rule.hint} step={rule.step} min={rule.min} max={rule.max} value={values[rule.key] ?? ''} onChange={(e) => setValues((prev) => ({ ...prev, [rule.key]: e.target.value }))} /></div>
        </section>
      ))}</div>
      <div className="settings-save-bar">
        <div><strong>Ayarları kaydet</strong><span>{dirty ? 'Değişiklikler henüz mobil uygulamaya yansımadı.' : 'Mevcut değerler mobil uygulama ile senkronize.'}</span></div>
        <Button onClick={() => void saveAll()} loading={saving} disabled={!dirty} data-testid="settings-save">
          Değişiklikleri kaydet
        </Button>
      </div>
    </div>
  );
}
