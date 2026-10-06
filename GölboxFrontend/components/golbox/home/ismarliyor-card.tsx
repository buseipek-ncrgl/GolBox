"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Coffee, CheckCircle2, Clock, Users, ArrowRight } from "lucide-react"
import { useGolbox, type ClaimedReward } from "@/lib/golbox-context"
import { useGolToast } from "@/components/golbox/gol-toast"

export interface IsmarliyorCampaign {
  id: string
  sponsorName: string
  sponsorTitle: string
  sponsorAvatar?: string
  itemName: string
  quota: number
  claimed: number
  targetAudience: string
  endDateText: string
  isActive: boolean
}

const DEFAULT_CAMPAIGNS: IsmarliyorCampaign[] = [
  {
    id: "ism-1",
    sponsorName: "Umut Yılmaz",
    sponsorTitle: "Hayırsever Vatandaş",
    itemName: "500 Üniversite Öğrencisine Soğuk Kahve İkramı",
    quota: 500,
    claimed: 142,
    targetAudience: "Üniversite Öğrencileri (18–25 Yaş)",
    endDateText: "Son 2 Gün",
    isActive: true,
  },
  {
    id: "ism-2",
    sponsorName: "Şehitkamil Belediyesi",
    sponsorTitle: "Kurumsal İkram",
    itemName: "1000 Kişilik GölBOX Filtre Kahve İkramı",
    quota: 1000,
    claimed: 850,
    targetAudience: "Tüm Vatandaşlar",
    endDateText: "Son 5 Gün",
    isActive: true,
  }
]

export function IsmarliyorCard({
  onJoinSuccess,
}: {
  onJoinSuccess?: () => void
}) {
  const { token, refreshData } = useGolbox()
  const showToast = useGolToast()
  const [busy, setBusy] = useState(false)

  const [campaigns, setCampaigns] = useState<IsmarliyorCampaign[]>([])
  const [joinedIds, setJoinedIds] = useState<string[]>([])

  const loadLocalState = () => {
    if (typeof window === "undefined") return
    try {
      const savedCampaigns = localStorage.getItem("golbox-ismarliyor-campaigns")
      const parsedCampaigns: IsmarliyorCampaign[] = savedCampaigns
        ? JSON.parse(savedCampaigns)
        : DEFAULT_CAMPAIGNS

      setCampaigns(parsedCampaigns.filter((c) => c.isActive))

      const savedJoined = localStorage.getItem("gol_joined_ismarliyor")
      setJoinedIds(savedJoined ? JSON.parse(savedJoined) : [])
    } catch {
      setCampaigns(DEFAULT_CAMPAIGNS)
    }
  }

  useEffect(() => {
    loadLocalState()
  }, [])

  const activeCampaign = campaigns.length > 0 ? campaigns[0] : null

  if (!activeCampaign || !activeCampaign.isActive) return null

  const isJoined = joinedIds.includes(activeCampaign.id)
  const remainingQuota = Math.max(0, activeCampaign.quota - activeCampaign.claimed)
  const sponsorInitials = activeCampaign.sponsorName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toLocaleUpperCase("tr-TR"))
    .join("")

  const handleJoin = () => {
    if (!token) {
      showToast("İkram kazanmak için lütfen giriş yapın.")
      return
    }
    if (remainingQuota <= 0) {
      showToast("Üzgünüz, bu kampanyanın ikram kontenjanı tükenmiştir.")
      return
    }

    setBusy(true)

    setTimeout(() => {
      // 1. Update stock in localStorage
      const allCampaignsRaw = localStorage.getItem("golbox-ismarliyor-campaigns")
      let list: IsmarliyorCampaign[] = allCampaignsRaw ? JSON.parse(allCampaignsRaw) : DEFAULT_CAMPAIGNS
      list = list.map((c) =>
        c.id === activeCampaign.id ? { ...c, claimed: c.claimed + 1 } : c
      )
      localStorage.setItem("golbox-ismarliyor-campaigns", JSON.stringify(list))
      setCampaigns(list.filter((c) => c.isActive))

      // 2. Mark campaign as joined for user
      const nextJoined = [...joinedIds, activeCampaign.id]
      localStorage.setItem("gol_joined_ismarliyor", JSON.stringify(nextJoined))
      setJoinedIds(nextJoined)

      // 3. Add to claimed rewards
      const newClaim: ClaimedReward & { sourceType: string } = {
        claimId: `ISM-${Date.now()}`,
        rewardId: activeCampaign.id,
        rewardTitle: activeCampaign.itemName,
        rewardDescription: `${activeCampaign.sponsorName} Tarafından İkram Edildi (${activeCampaign.sponsorTitle})`,
        redeemCode: `ISM-${Math.floor(100000 + Math.random() * 900000)}`,
        status: "Claimed",
        claimedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
        isExpired: false,
        daysRemaining: 7,
        sourceType: "Ismarliyor",
      }

      const existingClaimsRaw = localStorage.getItem("gol_claimed_rewards")
      const existingClaims = existingClaimsRaw ? JSON.parse(existingClaimsRaw) : []
      localStorage.setItem("gol_claimed_rewards", JSON.stringify([newClaim, ...existingClaims]))

      setBusy(false)
      showToast("İkram kazandınız! Ödüllerim -> Kazandıklarım sekmesinden QR ile teslim alabilirsiniz.")
      void refreshData()
      if (onJoinSuccess) onJoinSuccess()
    }, 600)
  }

  return (
    <section aria-label="Ismarlıyor ikram kampanyası" className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Coffee className="size-4 text-emerald-700 dark:text-emerald-400" />
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
            Ismarlıyor · İkram Kahve
          </h2>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
          <Clock className="size-3" />
          {activeCampaign.endDateText}
        </span>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-emerald-600/30 bg-card p-4 shadow-2xs">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-emerald-500/30 bg-emerald-50 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
              {activeCampaign.sponsorAvatar ? (
                <Image
                  src={activeCampaign.sponsorAvatar}
                  alt={`${activeCampaign.sponsorName} profil fotoğrafı`}
                  fill
                  unoptimized
                  sizes="40px"
                  className="object-cover"
                />
              ) : (
                <span>{sponsorInitials}</span>
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                {activeCampaign.sponsorName} Ismarlıyor
              </p>
              <p className="text-[11px] text-muted-foreground">{activeCampaign.sponsorTitle}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-1 text-[10px] font-extrabold text-emerald-800 dark:text-emerald-200">
            <Users className="size-3 text-emerald-700 dark:text-emerald-400" />
            {remainingQuota} / {activeCampaign.quota} İkram Kaldı
          </span>
        </div>

        <div className="mt-3 space-y-2">
          <h3 className="text-sm font-bold tracking-tight text-foreground">
            {activeCampaign.itemName}
          </h3>

          <div className="rounded-xl border border-border/80 bg-muted/40 p-2.5 space-y-1">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Hedef Kitle & Şartlar</p>
            <p className="text-xs text-foreground/90 font-medium">
              • {activeCampaign.targetAudience}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-end">
          {isJoined ? (
            <div className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 px-3.5 py-2 text-xs font-bold text-emerald-800 dark:text-emerald-200">
              <CheckCircle2 className="size-4 text-emerald-600" />
              İkram Kazandın (QR'ım & Ödüllerim'de Saklı)
            </div>
          ) : remainingQuota <= 0 ? (
            <div className="inline-flex items-center gap-1.5 rounded-xl bg-muted px-3.5 py-2 text-xs font-bold text-muted-foreground">
              İkram Stokları Tükenmiştir
            </div>
          ) : (
            <button
              type="button"
              onClick={handleJoin}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 dark:bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition active:scale-95 cursor-pointer disabled:opacity-50"
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
