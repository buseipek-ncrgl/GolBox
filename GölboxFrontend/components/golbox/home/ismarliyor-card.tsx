"use client"

import { useState } from "react"
import { Coffee, CheckCircle2, Clock, Users, ArrowRight } from "lucide-react"
import { useGolbox } from "@/lib/golbox-context"

export interface IsmarliyorCampaign {
  id: string
  sponsorName: string
  sponsorTitle: string
  sponsorAvatar?: string
  itemName: string
  quotaText: string
  conditions: string[]
  endDateText: string
  isActive: boolean
}

const DEFAULT_CAMPAIGN: IsmarliyorCampaign = {
  id: "ism-1",
  sponsorName: "Umut Yılmaz",
  sponsorTitle: "Hayırsever Vatandaş",
  itemName: "500 Üniversite Öğrencisine Soğuk Kahve",
  quotaText: "500 Kişilik İkram",
  conditions: ["Üniversite öğrencisi olmak", "18–25 yaş arasında olmak"],
  endDateText: "Son 2 Gün",
  isActive: true,
}

export function IsmarliyorCard({
  campaign = DEFAULT_CAMPAIGN,
  onJoinSuccess,
}: {
  campaign?: IsmarliyorCampaign
  onJoinSuccess?: () => void
}) {
  const { token, addBonusPoints } = useGolbox()
  const [joined, setJoined] = useState(false)
  const [busy, setBusy] = useState(false)

  const handleJoin = () => {
    if (!token) return
    setBusy(true)
    setTimeout(() => {
      setJoined(true)
      setBusy(false)
      addBonusPoints(0, "Ismarlıyor Kahve İkramı Kazandın (Ödüllerim -> Kazandıklarım)")
      if (onJoinSuccess) onJoinSuccess()
    }, 600)
  }

  if (!campaign.isActive) return null

  return (
    <section aria-label="Ismarlıyor kampanyası" className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Coffee className="size-4 text-primary" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">Ismarlıyor</h2>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
          <Clock className="size-3 text-primary" />
          {campaign.endDateText}
        </span>
      </div>

      <div className="relative overflow-hidden rounded-[22px] border border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 p-4 shadow-xs">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm border border-primary/20">
              UY
            </div>
            <div>
              <p className="text-xs font-bold text-primary">{campaign.sponsorName} Ismarlıyor</p>
              <p className="text-[11px] text-muted-foreground">{campaign.sponsorTitle}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">
            <Users className="size-3" />
            {campaign.quotaText}
          </span>
        </div>

        <div className="mt-3.5 space-y-1.5">
          <h3 className="font-serif text-base font-bold leading-tight text-foreground">
            {campaign.itemName}
          </h3>
          <div className="space-y-1 pt-1">
            <p className="text-[11px] font-semibold text-muted-foreground">Katılım şartları:</p>
            <ul className="space-y-0.5">
              {campaign.conditions.map((cond, i) => (
                <li key={i} className="flex items-center gap-1.5 text-xs text-foreground/90">
                  <span className="size-1.5 rounded-full bg-primary" />
                  {cond}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end">
          {joined ? (
            <div className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600/15 px-3.5 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="size-4" />
              Katıldın · Hak Kazandın
            </div>
          ) : (
            <button
              type="button"
              onClick={handleJoin}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-2xs hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50"
            >
              {busy ? "İşleniyor..." : "Katıl ve İkram Kazan"}
              <ArrowRight className="size-3.5" />
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
