"use client"

import { Gift, Sparkles, CheckCircle2, AlertCircle } from "lucide-react"
import { useGolbox } from "@/lib/golbox-context"
import { useState } from "react"

export function RewardsScreen({ onClose }: { onClose?: () => void }) {
  const { user, rewards, claimReward, loading } = useGolbox()
  const [claimingId, setClaimingId] = useState<string | null>(null)

  const handleClaim = async (id: string) => {
    setClaimingId(id)
    await claimReward(id)
    setClaimingId(null)
  }

  return (
    <div className="gol-fade-up space-y-5 px-5 pb-6 pt-3">
      <header className="space-y-1">
        {onClose && (
          <button type="button" onClick={onClose} className="text-sm font-medium text-primary">
            Profile dön
          </button>
        )}
        <h1 className="font-serif text-2xl text-foreground">Ödül Kataloğu</h1>
        <p className="text-sm text-muted-foreground">GölPuan ile alınır. Saha kutusu ve Ismarlıyor buradan ayrıdır.</p>
      </header>

      {/* Puan Durum Kartı */}
      <div className="flex items-center justify-between rounded-3xl bg-primary px-5 py-4 text-primary-foreground shadow-md">
        <div>
          <p className="text-xs uppercase tracking-wide text-primary-foreground/70">Mevcut Bakiyen</p>
          <p className="font-serif text-3xl font-bold leading-tight">{user ? user.pointsBalance : 0} <span className="text-sm font-sans font-normal">GP</span></p>
        </div>
        <div className="flex size-10 items-center justify-center rounded-2xl bg-white/10">
          <Gift className="size-6 text-accent" />
        </div>
      </div>

      {/* Ödüller Listesi */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Kullanılabilir İkramlar</h2>
        
        {rewards.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-border bg-card px-6 py-10 text-center">
            <Gift className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Şu an aktif yayınlanan bir ikram bulunmuyor.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {rewards.map((reward) => {
              const canAfford = user ? user.pointsBalance >= reward.requiredPoints : false
              const isClaiming = claimingId === reward.id

              return (
                <div
                  key={reward.id}
                  className="flex items-center gap-4 rounded-3xl border border-border bg-card p-4 transition-all hover:border-primary/30"
                >
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary font-serif text-xl">
                    {reward.title.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-foreground truncate">{reward.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">{reward.description}</p>
                    <span className="mt-1 inline-block rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
                      {reward.requiredPoints} GölPuan
                    </span>
                  </div>

                  <button
                    onClick={() => handleClaim(reward.id)}
                    disabled={!canAfford || loading || isClaiming}
                    className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                      canAfford
                        ? "bg-primary text-primary-foreground hover:opacity-90 shadow-sm"
                        : "bg-muted text-muted-foreground cursor-not-allowed"
                    }`}
                  >
                    {isClaiming ? "İşleniyor..." : canAfford ? "Talep Et" : "Yetersiz GP"}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
