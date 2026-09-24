"use client"

import { useMemo, useState } from "react"
import { Gift, Search, QrCode, MapPin, CheckCircle2, ChevronDown, ChevronUp, Sparkles, Coffee } from "lucide-react"
import { Screen } from "@/components/golbox/screen"
import { LoginScreen } from "@/components/golbox/screens/login-screen"
import { QrUsageModal, type QrUsageItem } from "@/components/golbox/qr-usage-modal"
import { useGolbox } from "@/lib/golbox-context"

type MainTab = "discover" | "my-rewards"
type SourceFilter = "all" | "GolPuan" | "Ismarliyor" | "GiftHunt"
export type RewardsTabProp = "discover" | "my-rewards" | "catalog" | "coupons" | "cart"

export interface CombinedRewardClaim {
  id: string
  title: string
  description?: string
  sourceType: "GolPuan" | "Ismarliyor" | "GiftHunt"
  redeemCode: string
  status: "Claimed" | "Redeemed" | "Expired"
  facilities: string[]
  claimedAt: string
  expiresAt: string
}

const DEFAULT_DEMO_CLAIMS: CombinedRewardClaim[] = [
  {
    id: "claim-1",
    title: "Filtre Kahve İkramı",
    description: "Umut Yılmaz Ismarlıyor kampanyasından ücretsiz cold brew kahve ikramı.",
    sourceType: "Ismarliyor",
    redeemCode: "IS-SH-7890",
    status: "Claimed",
    facilities: ["Göl Kafe Anneler Parkı", "Göl Kafe Karataş", "Göl Kafe Alleben"],
    claimedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
  },
  {
    id: "claim-2",
    title: "Şehitkamil 3D Rozet & Kahve Kutusu",
    description: "Şehitkamil Gençlik Parkı 3D Hediye Avı noktasından kamerayla toplandı.",
    sourceType: "GiftHunt",
    redeemCode: "HA-SH-4521",
    status: "Claimed",
    facilities: ["Merkez Kitap Kafe", "Şehitkamil Gençlik Kitap Kafe"],
    claimedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 60 * 86400000).toISOString(),
  },
  {
    id: "claim-3",
    title: "Türk Kahvesi Kuponu",
    description: "40 GP harcanarak Ödül Kataloğu'ndan alındı.",
    sourceType: "GolPuan",
    redeemCode: "GP-SH-1102",
    status: "Claimed",
    facilities: ["Merkez Kitap Kafe", "Dülük Tabiat Parkı Kafe"],
    claimedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 90 * 86400000).toISOString(),
  },
]

export function RewardsScreen({
  onClose,
  closeLabel = "Geri",
  initialTab = "discover",
}: {
  onClose?: () => void
  closeLabel?: string
  initialTab?: RewardsTabProp
}) {
  const { user, token, rewards, claimedRewards, addBonusPoints } = useGolbox()
  const mappedInitial = initialTab === "coupons" || initialTab === "my-rewards" ? "my-rewards" : "discover"
  const [tab, setTab] = useState<MainTab>(mappedInitial)
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all")
  const [showLogin, setShowLogin] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedFacilityId, setExpandedFacilityId] = useState<string | null>(null)
  const [activeQrItem, setActiveQrItem] = useState<QrUsageItem | null>(null)
  const [localClaims, setLocalClaims] = useState<CombinedRewardClaim[]>(DEFAULT_DEMO_CLAIMS)

  const points = user?.pointsBalance ?? 0

  // Combine backend claimed rewards with demo claims
  const allClaims = useMemo(() => {
    const fromBackend: CombinedRewardClaim[] = claimedRewards.map((c) => ({
      id: c.claimId,
      title: c.rewardTitle,
      description: c.rewardDescription || undefined,
      sourceType: "GolPuan" as const,
      redeemCode: c.redeemCode,
      status: (c.status === "Claimed" ? "Claimed" : c.status === "Redeemed" ? "Redeemed" : "Expired") as CombinedRewardClaim["status"],
      facilities: ["Merkez Kitap Kafe", "Şehitkamil Gençlik Kitap Kafe"],
      claimedAt: c.claimedAt,
      expiresAt: c.expiresAt,
    }))
    return [...fromBackend, ...localClaims]
  }, [claimedRewards, localClaims])

  const filteredClaims = useMemo(() => {
    if (sourceFilter === "all") return allClaims
    return allClaims.filter((c) => c.sourceType === sourceFilter)
  }, [allClaims, sourceFilter])

  const filteredRewards = useMemo(() => {
    if (!searchQuery.trim()) return rewards
    const q = searchQuery.toLowerCase().trim()
    return rewards.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q)),
    )
  }, [rewards, searchQuery])

  const handleClaimWithPoints = (rewardTitle: string, pointsCost: number) => {
    if (!token) {
      setShowLogin(true)
      return
    }
    if (points < pointsCost) {
      alert(`Yetersiz bakiye. Bu ödül ${pointsCost} GP gerektiriyor. Bakiyeniz: ${points} GP.`)
      return
    }

    addBonusPoints(-pointsCost, `${rewardTitle} Ödülü Alındı`)
    const newClaim: CombinedRewardClaim = {
      id: `claim-${Date.now()}`,
      title: rewardTitle,
      description: `${pointsCost} GP karşılığında kataloğdan alındı.`,
      sourceType: "GolPuan",
      redeemCode: `GP-SH-${Math.floor(1000 + Math.random() * 9000)}`,
      status: "Claimed",
      facilities: ["Göl Kafe Anneler Parkı", "Göl Kafe Karataş", "Merkez Kitap Kafe"],
      claimedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 90 * 86400000).toISOString(),
    }
    setLocalClaims((prev) => [newClaim, ...prev])
    setTab("my-rewards")
  }

  if (showLogin && !token) {
    return <LoginScreen onClose={() => setShowLogin(false)} closeLabel="Ödüllere dön" />
  }

  return (
    <Screen className="space-y-4 pb-12">
      <header className="space-y-1">
        {onClose && (
          <button type="button" onClick={onClose} className="text-sm font-medium text-primary">
            {closeLabel}
          </button>
        )}
        <h1 className="font-serif text-2xl font-bold text-foreground">Ödüllerim</h1>
        <p className="text-xs text-muted-foreground">
          GölPuan kataloğunu keşfedin, kazandığınız tüm ikramları tesislerde QR ile kullanın.
        </p>
      </header>

      {/* Main 2-Tab Switcher: Keşfet | Kazandıklarım */}
      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-secondary p-1 shadow-2xs">
        <button
          type="button"
          onClick={() => setTab("discover")}
          className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all ${
            tab === "discover" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Gift className="size-4 text-primary" />
          Keşfet
        </button>
        <button
          type="button"
          onClick={() => setTab("my-rewards")}
          className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all ${
            tab === "my-rewards" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkles className="size-4 text-[color:var(--color-gold)]" />
          Kazandıklarım ({allClaims.length})
        </button>
      </div>

      {/* KEŞFET TAB */}
      {tab === "discover" && (
        <div className="space-y-4">
          {/* GölPuan Balance Card */}
          <div className="relative overflow-hidden rounded-[22px] bg-primary px-5 py-4 text-primary-foreground shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-primary-foreground/75">
                  GölPuan Bakiyeniz
                </p>
                <p className="font-serif text-3xl font-bold leading-tight mt-0.5">
                  {points.toLocaleString("tr-TR")}{" "}
                  <span className="font-sans text-xs font-semibold text-primary-foreground/80">GP</span>
                </p>
              </div>
              <div className="flex size-11 items-center justify-center rounded-2xl bg-white/15 text-[color:var(--color-gold)] backdrop-blur-md">
                <Gift className="size-6" />
              </div>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ödül kataloğunda ara..."
              className="w-full rounded-2xl border border-input bg-card px-4 py-2.5 pl-10 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <Search className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
          </div>

          {/* Rewards Catalog */}
          <div className="space-y-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">Ödül Kataloğu</h2>
            <div className="grid gap-3">
              {filteredRewards.map((reward) => (
                <div key={reward.id} className="flex items-center justify-between gap-3 rounded-[20px] border border-border/80 bg-card p-3.5 shadow-2xs">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-serif text-lg font-bold text-primary">
                    {reward.title.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-bold text-sm text-foreground">{reward.title}</h3>
                    <p className="line-clamp-1 text-xs text-muted-foreground">{reward.description}</p>
                    <span className="mt-1 inline-block rounded-md bg-[color:var(--color-gold)]/15 px-2 py-0.5 text-[11px] font-bold text-[color:var(--color-gold)]">
                      {reward.requiredPoints.toLocaleString("tr-TR")} GP
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleClaimWithPoints(reward.title, reward.requiredPoints)}
                    className="shrink-0 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-2xs hover:bg-primary/90 transition-all active:scale-95"
                  >
                    GölPuan ile Al
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* KAZANDIKLARIM TAB */}
      {tab === "my-rewards" && (
        <div className="space-y-4">
          {/* Source Filter Pills: Tümü · GölPuan · Ismarlıyor · Hediye Avı */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              ["all", "Tümü"],
              ["GolPuan", "GölPuan"],
              ["Ismarliyor", "Ismarlıyor"],
              ["GiftHunt", "Hediye Avı"],
            ].map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setSourceFilter(val as SourceFilter)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
                  sourceFilter === val
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Consolidated Claims List */}
          {filteredClaims.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
              Seçilen filtrede kazanılmış ödül bulunmuyor.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredClaims.map((claim) => {
                const isExpanded = expandedFacilityId === claim.id
                const badgeText =
                  claim.sourceType === "Ismarliyor"
                    ? "Ismarlıyor'dan kazandın"
                    : claim.sourceType === "GiftHunt"
                    ? "Hediye Avı'ndan kazandın"
                    : "GölPuan ile aldın"

                const badgeBg =
                  claim.sourceType === "Ismarliyor"
                    ? "bg-teal-500/15 text-teal-700 dark:text-teal-400"
                    : claim.sourceType === "GiftHunt"
                    ? "bg-[color:var(--color-gold)]/15 text-[color:var(--color-gold)]"
                    : "bg-primary/15 text-primary"

                return (
                  <div
                    key={claim.id}
                    className="relative overflow-hidden rounded-[22px] border border-border/80 bg-card p-4 shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${badgeBg}`}>
                          {badgeText}
                        </span>
                        <h3 className="mt-1 font-serif text-base font-bold text-foreground">{claim.title}</h3>
                        {claim.description && (
                          <p className="mt-0.5 text-xs text-muted-foreground">{claim.description}</p>
                        )}
                      </div>
                      <span className="shrink-0 rounded-full bg-emerald-600/15 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                        Kullanılabilir
                      </span>
                    </div>

                    {/* Expandable Valid Facilities Button */}
                    <div>
                      <button
                        type="button"
                        onClick={() => setExpandedFacilityId(isExpanded ? null : claim.id)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                      >
                        <MapPin className="size-3.5" />
                        <span>Nerede Kullanabilirim? ({claim.facilities.length} Tesis)</span>
                        {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 rounded-xl bg-secondary/60 p-3 text-xs space-y-1 animate-in fade-in duration-150">
                          <p className="text-[11px] font-bold text-muted-foreground uppercase">Geçerli Tesisler:</p>
                          <ul className="space-y-1">
                            {claim.facilities.map((fac, i) => (
                              <li key={i} className="flex items-center gap-1.5 font-medium text-foreground">
                                <CheckCircle2 className="size-3 text-emerald-600 shrink-0" />
                                {fac}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Action Button: QR ile Kullan */}
                    <div className="flex items-center justify-between border-t border-border/60 pt-3">
                      <span className="font-mono text-xs font-semibold text-muted-foreground tracking-wider">
                        Kod: {claim.redeemCode}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveQrItem({
                            id: claim.id,
                            title: claim.title,
                            sourceType: claim.sourceType,
                            redeemCode: claim.redeemCode,
                            facilities: claim.facilities,
                          })
                        }
                        className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-2xs hover:bg-primary/90 transition-all active:scale-95"
                      >
                        <QrCode className="size-4" />
                        QR ile Kullan
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* QR Usage Modal Overlay */}
      {activeQrItem && (
        <QrUsageModal item={activeQrItem} onClose={() => setActiveQrItem(null)} />
      )}
    </Screen>
  )
}
