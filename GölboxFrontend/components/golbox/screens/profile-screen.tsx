"use client"

import { useEffect, useState } from "react"
import { Screen } from "@/components/golbox/screen"
import { Gift, Heart, LogIn, LogOut, Ticket, Award, ChevronRight, Bell } from "lucide-react"
import { useGolbox } from "@/lib/golbox-context"
import { LoginScreen } from "@/components/golbox/screens/login-screen"
import { RewardsScreen } from "@/components/golbox/screens/rewards-screen"
import { CouponPass, isActiveCoupon } from "@/components/golbox/coupon-pass"
import { FavoritesScreen } from "@/components/golbox/screens/favorites-screen"
import { NotificationPreferencesSheet } from "@/components/golbox/notifications/notification-preferences-sheet"

function formatWhen(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
}

function ProfileUpdateSection() {
  const { user, updateProfileState, changePassword } = useGolbox()
  const [firstName, setFirstName] = useState(user?.firstName || "")
  const [lastName, setLastName] = useState(user?.lastName || "")
  const [email, setEmail] = useState(user?.email || "")
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [activeTab, setActiveTab] = useState<"info" | "password">("info")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "")
      setLastName(user.lastName || "")
      setEmail(user.email || "")
    }
  }, [user])

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    await updateProfileState(firstName, lastName)
    setIsSubmitting(false)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!oldPassword || !newPassword) return
    setIsSubmitting(true)
    const ok = await changePassword(oldPassword, newPassword)
    if (ok) {
      setOldPassword("")
      setNewPassword("")
    }
    setIsSubmitting(false)
  }

  return (
    <section aria-label="Profil Düzenle" className="rounded-[20px] border border-border/70 bg-card p-4 space-y-3.5 shadow-2xs">
      <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
        <h2 className="text-sm font-bold text-foreground">Hesap Ayarları</h2>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab("info")}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
              activeTab === "info" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            Bilgilerim
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("password")}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
              activeTab === "password" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            Şifre Değiştir
          </button>
        </div>
      </div>

      {activeTab === "info" ? (
        <form onSubmit={handleSaveInfo} className="space-y-3">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Ad</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Soyad</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1">E-Posta Adresi</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-2xs transition-all hover:bg-primary/95 active:scale-95"
          >
            Bilgileri Güncelle
          </button>
        </form>
      ) : (
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Mevcut Şifre</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Yeni Şifre</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="Yeni şifrenizi girin"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-2xs transition-all hover:bg-primary/95 active:scale-95"
          >
            Şifreyi Değiştir
          </button>
        </form>
      )}
    </section>
  )
}

export function ProfileScreen({
  onNavigateToMenu,
  onNavigateToCart,
  onOpenEvents,
  onOpenMissions
}: {
  onNavigateToMenu?: () => void
  onNavigateToCart?: () => void
  onOpenEvents?: () => void
  onOpenMissions?: () => void
}) {
  const { user, token, myCaptures, pointTransactions, claimedRewards, orders, logout, loadMyCaptures, favorites, toggleFavorite } = useGolbox()
  const [showLogin, setShowLogin] = useState(false)
  const [showRewards, setShowRewards] = useState(false)
  const [showFavorites, setShowFavorites] = useState(false)
  const [showNotifPrefs, setShowNotifPrefs] = useState(false)
  const [favoritesTab, setFavoritesTab] = useState<"products" | "recipes">("products")
  const [rewardsTab, setRewardsTab] = useState<"catalog" | "cart" | "coupons">("catalog")

  useEffect(() => {
    if (token) void loadMyCaptures()
  }, [token, loadMyCaptures])

  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() : "Misafir"
  const points = user?.pointsBalance ?? 0
  const activeCoupons = claimedRewards.filter(isActiveCoupon)
  const gpRows =
    token && pointTransactions.length > 0
      ? pointTransactions.slice(0, 8).map((pt) => ({
          id: pt.id,
          label: pt.description || "GölPuan",
          when: formatWhen(pt.createdDate),
          value: `${pt.amount > 0 ? "+" : ""}${pt.amount}`,
          kind: pt.amount >= 0 ? "earn" : "spend",
        }))
      : []

  if (showFavorites) {
    return (
      <FavoritesScreen
        onBack={() => setShowFavorites(false)}
        onNavigateToMenu={onNavigateToMenu || (() => {})}
        onNavigateToCart={onNavigateToCart}
        initialTab={favoritesTab}
      />
    )
  }

  if (showRewards) {
    return (
      <RewardsScreen
        onClose={() => setShowRewards(false)}
        closeLabel="Profile dön"
        initialTab={rewardsTab}
      />
    )
  }

  if (showLogin && !token) {
    return <LoginScreen onClose={() => setShowLogin(false)} closeLabel="Profile dön" />
  }

  return (
    <Screen>
      <header className="flex items-center gap-4">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary font-serif text-2xl text-primary-foreground">
          {displayName.charAt(0)}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Profil</p>
          <h1 className="truncate font-serif text-2xl leading-tight text-foreground">{displayName}</h1>
          <p className="text-sm text-muted-foreground">
            {user ? user.email : "Misafir görünümü · giriş yapınca bakiyen gelir"}
          </p>
        </div>
      </header>

      {token ? (
        <button
          type="button"
          onClick={() => {
            setRewardsTab("catalog")
            setShowRewards(true)
          }}
          className="flex w-full items-center justify-between rounded-[var(--gol-card)] bg-primary px-5 py-4 text-left text-primary-foreground"
        >
          <div>
            <p className="text-xs uppercase tracking-wide text-primary-foreground/70">GölPuan</p>
            <p className="font-serif text-3xl leading-tight text-[color:var(--color-gold)]">{points}</p>
          </div>
          <p className="max-w-[9rem] text-pretty text-right text-sm text-primary-foreground/90">
            Katalog ödülleri GölPuan ile alınır. Saha kutusu ayrıdır.
          </p>
        </button>
      ) : (
        <div className="rounded-[var(--gol-card)] bg-[color:var(--color-brand-900)] px-5 py-5 text-white">
          <p className="text-xs uppercase tracking-wide text-white/70">GölPuan</p>
          <p className="mt-1 font-serif text-2xl">Giriş yapınca bakiyen görünür</p>
        </div>
      )}

      {!token && (
        <button
          type="button"
          onClick={() => setShowLogin(true)}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3.5 text-sm font-semibold text-background"
        >
          <LogIn className="size-4.5" />
          Giriş yap
        </button>
      )}

      {token && (
        <ProfileUpdateSection />
      )}

      {/* GÖREVLERİM SIK KULLANILAN AKSİYON (PRD SECTION 4: Profil -> Görevlerim) */}
      <button
        type="button"
        onClick={onOpenMissions}
        className="flex w-full items-center justify-between rounded-2xl border border-amber-400/40 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4 shadow-2xs hover:border-amber-400 transition text-left group"
      >
        <div className="flex items-center gap-3.5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-amber-400 text-amber-950 font-black shrink-0 shadow-2xs">
            <Award className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-black text-foreground group-hover:text-primary transition-colors">Görevlerim</h3>
              <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[9px] font-black text-amber-700 dark:text-amber-300">
                4 Aktif
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
              Belediye etkinlikleri, şube ziyaretleri ve özel görev takibi
            </p>
          </div>
        </div>
        <ChevronRight className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
      </button>

      {/* BİLDİRİM TERCİHLERİ (PRD SECTION 236: Profil -> Bildirim Tercihleri) */}
      <button
        type="button"
        onClick={() => setShowNotifPrefs(true)}
        className="flex w-full items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-2xs hover:bg-accent/50 transition text-left group"
      >
        <div className="flex items-center gap-3.5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary font-black shrink-0">
            <Bell className="size-5" />
          </div>
          <div>
            <h3 className="text-xs font-black text-foreground group-hover:text-primary transition-colors">Bildirim Tercihleri</h3>
            <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
              Sipariş, etkinlik, GölPuan ve görev bildirim izinleri
            </p>
          </div>
        </div>
        <ChevronRight className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
      </button>

      {showNotifPrefs && (
        <NotificationPreferencesSheet onClose={() => setShowNotifPrefs(false)} />
      )}

      {/* FAVORİ LEZZETLERİM & BENİM GÖLBOX'IM SECTION */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <Heart className="size-4 text-rose-500 fill-rose-500" /> Favori Lezzetlerim & Benim GölBOX'ım
            </h2>
            <p className="text-xs text-muted-foreground">Sevdiğin ürünler ve sana özel kahve tariflerin.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setFavoritesTab("products")
              setShowFavorites(true)
            }}
            className="text-xs font-black text-primary hover:underline bg-primary/10 px-2.5 py-1 rounded-full"
          >
            Tümünü Gör
          </button>
        </div>
        {!token ? (
          <button
            type="button"
            onClick={() => setShowLogin(true)}
            className="gol-card w-full border-dashed px-4 py-6 text-sm text-muted-foreground"
          >
            Favorilerini görmek için giriş yapın.
          </button>
        ) : favorites.length === 0 ? (
          <div className="gol-card flex flex-col items-center gap-2 border-dashed px-4 py-6 text-center">
            <Heart className="size-8 text-muted-foreground/40" />
            <p className="text-xs font-bold text-foreground">Henüz favori ürününüz yok.</p>
            <p className="text-[11px] text-muted-foreground">Menü ekranından kalp ikonuna dokunarak lezzetleri favorilerinize ekleyebilirsiniz.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { id: "m-1", name: "GölBOX Özel Filtre Kahve", price: 35, imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=60" },
              { id: "m-2", name: "Karamel Macchiato", price: 65, imageUrl: "https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=400&auto=format&fit=crop&q=60" },
              { id: "m-3", name: "Caffè Latte", price: 55, imageUrl: "https://images.unsplash.com/photo-1534778101976-62847782c213?w=400&auto=format&fit=crop&q=60" },
              { id: "m-4", name: "Iced Vanilla Latte", price: 70, imageUrl: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&auto=format&fit=crop&q=60" },
              { id: "m-5", name: "GölBOX Iced Cold Brew", price: 60, imageUrl: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&auto=format&fit=crop&q=60" },
              { id: "m-6", name: "Bergamotlu Siyah Çay", price: 25, imageUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=60" },
              { id: "m-7", name: "Belçika Çikolatalı Cheesecake", price: 85, imageUrl: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400&auto=format&fit=crop&q=60" }
            ].filter(item => favorites.includes(item.id)).map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-2.5 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-muted">
                    <img src={item.imageUrl} alt={item.name} className="size-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="truncate text-xs font-bold text-foreground">{item.name}</h4>
                    <p className="text-xs font-extrabold text-primary mt-0.5">₺{item.price}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleFavorite(item.id)}
                  className="flex size-7 shrink-0 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-500 hover:bg-rose-100 transition"
                  title="Favorilerden Çıkar"
                >
                  <Heart className="size-4 fill-rose-500 text-rose-500" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Kuponlarım</h2>
            <p className="text-xs text-muted-foreground">Katalogdan alınan kişiye özel kuponlar. 1 yıl geçerli.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setRewardsTab("coupons")
              setShowRewards(true)
            }}
            className="text-sm font-medium text-primary"
          >
            Tümü
          </button>
        </div>
        {!token ? (
          <button
            type="button"
            onClick={() => setShowLogin(true)}
            className="gol-card w-full border-dashed px-4 py-6 text-sm text-muted-foreground"
          >
            Kuponlarını görmek için giriş yapın.
          </button>
        ) : activeCoupons.length === 0 ? (
          <button
            type="button"
            onClick={() => {
              setRewardsTab("catalog")
              setShowRewards(true)
            }}
            className="gol-card w-full border-dashed px-4 py-6 text-left text-sm text-muted-foreground"
          >
            <span className="mb-1 flex items-center gap-2 font-medium text-foreground">
              <Ticket className="size-4 text-primary" />
              Henüz kupon yok
            </span>
            Katalogdan sepete ekle, GölPuan ile al.
          </button>
        ) : (
          <div className="grid gap-3">
            {activeCoupons.slice(0, 2).map((coupon) => (
              <CouponPass key={coupon.claimId} coupon={coupon} compact />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Ismarlıyor Siparişlerim</h2>
        <p className="text-xs text-muted-foreground">Kafe ikram siparişlerin. Teslime Hazır olduğunda teslim kodunu göster.</p>
        {!token ? (
          <button
            type="button"
            onClick={() => setShowLogin(true)}
            className="gol-card w-full border-dashed px-4 py-6 text-sm text-muted-foreground"
          >
            Siparişlerini görmek için giriş yapın.
          </button>
        ) : orders.length === 0 ? (
          <div className="gol-card flex flex-col items-center gap-2 border-dashed px-4 py-6 text-center">
            <p className="text-xs text-muted-foreground">Henüz Ismarlıyor siparişiniz bulunmuyor.</p>
          </div>
        ) : (
          <ul className="gol-card divide-y divide-border">
            {orders.map((order) => {
              const statusMap: Record<string, { label: string; style: string }> = {
                Pending: { label: "Hazırlanıyor", style: "bg-amber-500/10 text-amber-700" },
                Preparing: { label: "Hazırlanıyor", style: "bg-amber-500/10 text-amber-700" },
                Ready: { label: "Teslime Hazır", style: "bg-emerald-500/10 text-emerald-700" },
                Completed: { label: "Teslim Edildi", style: "bg-muted text-muted-foreground" },
                Cancelled: { label: "İptal Edildi", style: "bg-destructive/10 text-destructive" },
              }
              const st = statusMap[order.status] ?? { label: order.status, style: "bg-muted text-muted-foreground" }
              const itemName = order.items?.[0]?.menuItemName || "İkram Siparişi"

              return (
                <li key={order.id} className="space-y-2 px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-card-foreground text-sm">{itemName}</p>
                      <p className="text-xs text-muted-foreground">{order.cafeName} · {formatWhen(order.createdDate)}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${st.style}`}>
                      {st.label}
                    </span>
                  </div>
                  {order.status === "Ready" && order.collectionCode ? (
                    <div className="mt-2 rounded-xl border border-dashed border-emerald-500/30 bg-emerald-50/50 p-2.5 text-center dark:bg-emerald-950/20">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-emerald-800 dark:text-emerald-300">Teslim Kodu (Kasaya Göster)</p>
                      <p className="mt-0.5 font-mono text-base font-bold tracking-widest text-emerald-900 dark:text-emerald-100">{order.collectionCode}</p>
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Toplanan kutular</h2>
        <p className="text-xs text-muted-foreground">Saha hediyeleri. Ismarlıyor ve katalog ödülü buraya karışmaz.</p>
        {!token ? (
          <button
            type="button"
            onClick={() => setShowLogin(true)}
            className="gol-card w-full border-dashed px-4 py-6 text-sm text-muted-foreground"
          >
            Toplanan kutuları görmek için giriş yapın.
          </button>
        ) : myCaptures.length === 0 ? (
          <div className="gol-card flex flex-col items-center gap-2 border-dashed px-4 py-6 text-center">
            <Gift className="size-6 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Henüz sahada kutu toplamadınız.</p>
            <p className="text-[11px] text-muted-foreground">Harita simgesine dokunarak yakınınızdaki hediyeleri keşfedin.</p>
          </div>
        ) : (
          <ul className="gol-card divide-y divide-border">
            {myCaptures.map((cap) => (
              <li key={cap.id} className="flex items-center gap-3 px-4 py-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                  <Gift className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-card-foreground">{cap.title}</p>
                  <p className="text-xs text-muted-foreground">{formatWhen(cap.createdDate)}</p>
                </div>
                <span className="font-serif text-base text-accent-foreground">+{cap.pointsGranted} GP</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {gpRows.length > 0 ? (
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Puan hareketleri</h2>
        <ul className="gol-card divide-y divide-border">
          {gpRows.map((row) => (
            <li key={row.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-card-foreground">{row.label}</p>
                <p className="text-xs text-muted-foreground">{row.when}</p>
              </div>
              <span
                className={
                  row.kind === "earn"
                    ? "font-serif text-base text-accent-foreground"
                    : "font-serif text-base text-muted-foreground"
                }
              >
                {row.value}
              </span>
            </li>
          ))}
        </ul>
      </section>
      ) : null}

      {token && (
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card py-3.5 text-sm font-semibold text-muted-foreground"
        >
          <LogOut className="size-4.5" />
          Çıkış yap
        </button>
      )}
    </Screen>
  )
}
