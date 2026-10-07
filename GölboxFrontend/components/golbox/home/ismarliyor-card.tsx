"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Coffee, CheckCircle2, ArrowRight, Info, Gift } from "lucide-react"
import { useGolbox, type ClaimedReward } from "@/lib/golbox-context"
import { useGolToast } from "@/components/golbox/gol-toast"
import { OverlaySheet } from "@/components/golbox/overlay-sheet"
import { API_BASE_URL } from "@/lib/api-config"

export interface IsmarliyorCampaign {
  id: string
  sponsorName: string
  sponsorTitle: string
  sponsorAvatar?: string
  itemName: string
  quota: number
  claimed: number
  targetAudience: string
  endDateText?: string
  endDate?: string
  isActive: boolean
}

const DEFAULT_CAMPAIGNS: IsmarliyorCampaign[] = []

export function IsmarliyorCard({
  onJoinSuccess,
}: {
  onJoinSuccess?: () => void
}) {
  const { user, token, addClaimedReward } = useGolbox()
  const showToast = useGolToast()
  const [busy, setBusy] = useState(false)

  const [campaigns, setCampaigns] = useState<IsmarliyorCampaign[]>([])
  const [joinedIds, setJoinedIds] = useState<string[]>([])
  const [selectedDetail, setSelectedDetail] = useState<IsmarliyorCampaign | null>(null)

  const loadLocalState = () => {
    if (typeof window === "undefined") return
    try {
      const savedCampaigns = localStorage.getItem("gol_ismarliyor_campaigns") || localStorage.getItem("golbox-ismarliyor-campaigns")
      if (savedCampaigns) {
        const parsed: IsmarliyorCampaign[] = JSON.parse(savedCampaigns)
        setCampaigns(parsed.filter((c) => c.isActive))
      } else {
        setCampaigns([])
      }

      const joinedKey = user?.id ? `gol_joined_ismarliyor_${user.id}` : null
      const savedJoined = joinedKey ? localStorage.getItem(joinedKey) : null
      setJoinedIds(savedJoined ? JSON.parse(savedJoined) : [])
    } catch {
      setCampaigns([])
    }
  }

  const fetchBackendCampaigns = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/campaigns/ismarliyor`, { cache: "no-store" })
      if (res.ok) {
        const json = await res.json()
        const items = json?.data
        if (Array.isArray(items)) {
          setCampaigns(items.filter((c: IsmarliyorCampaign) => c.isActive))
          localStorage.setItem("gol_ismarliyor_campaigns", JSON.stringify(items))
          localStorage.setItem("golbox-ismarliyor-campaigns", JSON.stringify(items))
        }
      }
    } catch {}
  }

  useEffect(() => {
    loadLocalState()
    void fetchBackendCampaigns()

    const interval = setInterval(() => {
      void fetchBackendCampaigns()
    }, 3000)

    const handleStorageChange = () => {
      loadLocalState()
      void fetchBackendCampaigns()
    }
    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("focus", handleStorageChange)
    return () => {
      clearInterval(interval)
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("focus", handleStorageChange)
    }
  }, [user?.id])

  useEffect(() => {
    if (!token || !user?.id || campaigns.length === 0) return
    let cancelled = false
    const migrateLegacyClaims = async () => {
      const claimKey = `gol_claimed_rewards_${user.id}`
      let localClaims: ClaimedReward[] = []
      try { localClaims = JSON.parse(localStorage.getItem(claimKey) || "[]") } catch { return }
      for (const claim of localClaims) {
        const campaign = campaigns.find((item) => item.id === claim.rewardId)
        if (!campaign || claim.sourceType !== "Ismarliyor" || !/^ISM-\d{6}$/.test(claim.redeemCode)) continue
        try {
          const response = await fetch(`${API_BASE_URL}/campaigns/ismarliyor/${encodeURIComponent(campaign.id)}/claim?legacyCode=${encodeURIComponent(claim.redeemCode)}`, {
            method: "POST", headers: { Authorization: `Bearer ${token}` },
          })
          const body = await response.json()
          if (!cancelled && response.ok && body.success) addClaimedReward(body.data as ClaimedReward)
        } catch {}
      }
    }
    void migrateLegacyClaims()
    return () => { cancelled = true }
  }, [token, user?.id, campaigns, addClaimedReward])

  if (campaigns.length === 0) {
    return (
      <section aria-label="Ismarlıyor ikram kampanyası" className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Coffee className="size-4 text-emerald-700 dark:text-emerald-400" />
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
            Ismarlıyor · İkram Kahve
          </h2>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-emerald-600/30 bg-emerald-50/50 p-4 dark:bg-emerald-950/20">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/70 dark:text-emerald-300">
            <Gift className="size-5" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-foreground">Yeni ikramlar yakında burada</h3>
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
              Şu anda aktif bir Ismarlıyor ikramı yok. Yeni bir ikram yayınlandığında bu alandan katılabilirsin.
            </p>
          </div>
        </div>
      </section>
    )
  }

  const handleJoinCamp = async (camp: IsmarliyorCampaign) => {
    if (!token) {
      showToast("İkram kazanmak için lütfen giriş yapın.")
      return
    }
    const remainingQuota = Math.max(0, camp.quota - camp.claimed)
    if (remainingQuota <= 0) {
      showToast("Üzgünüz, bu kampanyanın ikram kontenjanı tükenmiştir.")
      return
    }

    setBusy(true)

    try {
      const response = await fetch(`${API_BASE_URL}/campaigns/ismarliyor/${encodeURIComponent(camp.id)}/claim`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      const body = await response.json()
      if (!response.ok || !body.success) throw new Error(body.message || "İkram alınamadı.")

      const nextJoined = [...joinedIds, camp.id]
      if (user?.id) {
        localStorage.setItem(`gol_joined_ismarliyor_${user.id}`, JSON.stringify(nextJoined))
      }
      setJoinedIds(nextJoined)

      addClaimedReward(body.data as ClaimedReward)
      setCampaigns((current) => current.map((item) => item.id === camp.id ? { ...item, claimed: item.claimed + 1 } : item))

      setSelectedDetail(null)
      showToast("İkram kazandınız! Ödüllerim -> Kazandıklarım sekmesinden QR ile teslim alabilirsiniz.")
      if (onJoinSuccess) onJoinSuccess()
    } catch (error) {
      showToast(error instanceof Error ? error.message : "İkram alınamadı.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <section aria-label="Ismarlıyor ikram kampanyası" className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Coffee className="size-4 text-emerald-700 dark:text-emerald-400" />
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
            Ismarlıyor · İkram Kahve ({campaigns.length})
          </h2>
        </div>
      </div>

      {/* Compact Horizontal Scroll Carousel for Clean Home Layout */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x">
        {campaigns.map((camp) => {
          const isJoined = joinedIds.includes(camp.id)
          const remainingQuota = Math.max(0, camp.quota - camp.claimed)
          const sponsorInitials = camp.sponsorName
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part.charAt(0).toLocaleUpperCase("tr-TR"))
            .join("")

          return (
            <div
              key={camp.id}
              className="snap-start shrink-0 w-[280px] overflow-hidden rounded-2xl border border-emerald-600/30 bg-card p-3.5 shadow-2xs flex flex-col justify-between gap-2.5 hover:border-emerald-600/50 transition-all"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-emerald-500/30 bg-emerald-50 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                    {camp.sponsorAvatar ? (
                      <Image
                        src={camp.sponsorAvatar}
                        alt={`${camp.sponsorName} profil fotoğrafı`}
                        fill
                        unoptimized
                        sizes="32px"
                        className="object-cover"
                      />
                    ) : (
                      <span>{sponsorInitials}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">
                      {camp.sponsorName}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">{camp.sponsorTitle || "İkram Sponsoru"}</p>
                  </div>
                </div>

                <span className="shrink-0 rounded-full bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800 dark:text-emerald-200">
                  {remainingQuota} / {camp.quota} Stok
                </span>
              </div>

              <div>
                <h3 className="text-xs font-extrabold text-foreground line-clamp-1">
                  {camp.itemName}
                </h3>
                <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                  {camp.targetAudience}
                </p>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => setSelectedDetail(camp)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground hover:text-foreground"
                >
                  <Info className="size-3.5" /> Detay
                </button>

                {isJoined ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="size-3.5" /> Kazandın
                  </span>
                ) : remainingQuota <= 0 ? (
                  <span className="text-[11px] font-semibold text-muted-foreground">Tükendi</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleJoinCamp(camp)}
                    disabled={busy}
                    className="inline-flex items-center gap-1 rounded-xl bg-emerald-700 dark:bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-xs hover:bg-emerald-800 transition active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    İkram Al <ArrowRight className="size-3" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Campaign Detail Sheet */}
      {selectedDetail && (
        <OverlaySheet title="İkram Kampanyası Detayı" onClose={() => setSelectedDetail(null)}>
          <div className="space-y-4 pb-6">
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-500/20">
              <div className="flex size-10 items-center justify-center rounded-full bg-emerald-700 text-white font-bold text-sm">
                {selectedDetail.sponsorName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">{selectedDetail.sponsorName} Ismarlıyor</h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">{selectedDetail.sponsorTitle || "İkram Sponsoru"}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-extrabold text-foreground">{selectedDetail.itemName}</h3>
              <div className="rounded-xl bg-muted/50 p-3 space-y-1">
                <p className="text-[11px] font-extrabold uppercase text-muted-foreground">Hedef Kitle & Şartlar</p>
                <p className="text-xs font-medium text-foreground">{selectedDetail.targetAudience}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-border p-3">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Kalan İkram Adedi</span>
                <p className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400 mt-0.5">
                  {Math.max(0, selectedDetail.quota - selectedDetail.claimed)} / {selectedDetail.quota} Adet
                </p>
              </div>
              <div className="rounded-xl border border-border p-3">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Geçerlilik Süresi</span>
                <p className="text-sm font-extrabold text-foreground mt-0.5">
                  {selectedDetail.endDateText || "Aktif Kampanya"}
                </p>
              </div>
            </div>

            <div className="pt-2">
              {joinedIds.includes(selectedDetail.id) ? (
                <div className="w-full text-center p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 font-bold text-xs">
                  ✓ Bu İkram Kampanyasına Katıldınız (QR'ım ve Ödüllerim Sekmesinde Saklı)
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleJoinCamp(selectedDetail)}
                  disabled={busy}
                  className="w-full py-3 rounded-xl bg-emerald-700 dark:bg-emerald-600 text-white font-extrabold text-xs shadow-md hover:bg-emerald-800 transition active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  Hemen Katıl ve İkram Kazan
                </button>
              )}
            </div>
          </div>
        </OverlaySheet>
      )}
    </section>
  )
}
