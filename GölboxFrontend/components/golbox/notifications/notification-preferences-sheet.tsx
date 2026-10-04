"use client"

import React, { useState } from "react"
import { OverlaySheet } from "@/components/golbox/overlay-sheet"
import { Bell, Coffee, Calendar, Award, Coins, Zap, ShieldCheck, Check } from "lucide-react"
import { useGolToast } from "@/components/golbox/gol-toast"
import type { CitizenNotificationPreferences } from "@/lib/city-content-api"

export function NotificationPreferencesSheet({
  onClose,
}: {
  onClose: () => void
}) {
  const showToast = useGolToast()
  const [preferences, setPreferences] = useState<CitizenNotificationPreferences>({
    orderUpdates: true,
    eventUpdates: true,
    loyaltyUpdates: true,
    missionUpdates: true,
    marketingUpdates: false,
  })
  const [isSaved, setIsSaved] = useState(false)

  const togglePref = (key: keyof CitizenNotificationPreferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = () => {
    setIsSaved(true)
    showToast("Bildirim tercihleriniz başarıyla güncellendi.")
    setTimeout(() => {
      onClose()
    }, 800)
  }

  return (
    <OverlaySheet title="Bildirim Tercihleri" onClose={onClose}>
      <div className="space-y-4 pb-6">
        <p className="text-xs text-muted-foreground font-medium leading-relaxed">
          GölBOX hesabınızla ilgili hangi bildirim türlerini almak istediğinizi özelleştirebilirsiniz. Sistem bildirimleri işletim sistemi bildirim izninden bağımsız olarak yönetilir.
        </p>

        <div className="space-y-2.5">
          {/* 1. SİPARİŞ BİLDİRİMLERİ */}
          <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-3.5 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                <Coffee className="size-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-foreground">Sipariş Durum Güncellemeleri</h4>
                <p className="text-[11px] text-muted-foreground">Sipariş onaylandı, hazırlanıyor ve hazır bildirimleri</p>
              </div>
            </div>
            <button
              onClick={() => togglePref("orderUpdates")}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                preferences.orderUpdates ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block size-5 rounded-full bg-white transition-transform ${
                  preferences.orderUpdates ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {/* 2. ETKİNLİK BİLDİRİMLERİ */}
          <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-3.5 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600">
                <Calendar className="size-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-foreground">Etkinlik & Atölye Hatırlatmaları</h4>
                <p className="text-[11px] text-muted-foreground">Kayıtlı etkinlik yaklaşma, saat ve konum değişiklikleri</p>
              </div>
            </div>
            <button
              onClick={() => togglePref("eventUpdates")}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                preferences.eventUpdates ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block size-5 rounded-full bg-white transition-transform ${
                  preferences.eventUpdates ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {/* 3. GÖLPUAN BİLDİRİMLERİ */}
          <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-3.5 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600">
                <Coins className="size-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-foreground">GölPuan & Ödül Bildirimleri</h4>
                <p className="text-[11px] text-muted-foreground">Kazanılan puanlar ve açılan katalog ödülleri</p>
              </div>
            </div>
            <button
              onClick={() => togglePref("loyaltyUpdates")}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                preferences.loyaltyUpdates ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block size-5 rounded-full bg-white transition-transform ${
                  preferences.loyaltyUpdates ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {/* 4. GÖREV BİLDİRİMLERİ */}
          <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-3.5 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600">
                <Award className="size-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-foreground">Görev İlerleme & Tamamlamaları</h4>
                <p className="text-[11px] text-muted-foreground">Tamamlanan görevler ve ödül yükleme durumları</p>
              </div>
            </div>
            <button
              onClick={() => togglePref("missionUpdates")}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                preferences.missionUpdates ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block size-5 rounded-full bg-white transition-transform ${
                  preferences.missionUpdates ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {/* 5. KAMPANYA BİLDİRİMLERİ */}
          <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-3.5 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600">
                <Zap className="size-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-foreground">Kampanya & Fırsat Duyuruları</h4>
                <p className="text-[11px] text-muted-foreground">Genel kampanya, indirim ve yeni menü haberleri</p>
              </div>
            </div>
            <button
              onClick={() => togglePref("marketingUpdates")}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                preferences.marketingUpdates ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block size-5 rounded-full bg-white transition-transform ${
                  preferences.marketingUpdates ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-xs font-black text-primary-foreground shadow-md hover:bg-primary/90 transition active:scale-95 mt-4"
        >
          {isSaved ? (
            <>
              <Check className="size-4" />
              <span>Kaydedildi</span>
            </>
          ) : (
            <span>Tercihleri Kaydet</span>
          )}
        </button>
      </div>
    </OverlaySheet>
  )
}
