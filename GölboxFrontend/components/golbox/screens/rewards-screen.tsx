"use client"

import { Gift, Minus, Plus, ShoppingBag, Ticket } from "lucide-react"
import { Screen } from "@/components/golbox/screen"
import { CouponPass, isActiveCoupon } from "@/components/golbox/coupon-pass"
import { LoginScreen } from "@/components/golbox/screens/login-screen"
import { useGolbox } from "@/lib/golbox-context"
import { useMemo, useState } from "react"

type WalletTab = "catalog" | "cart" | "coupons"

export function RewardsScreen({
  onClose,
  closeLabel = "Geri",
  initialTab = "catalog",
}: {
  onClose?: () => void
  closeLabel?: string
  initialTab?: WalletTab
}) {
  const {
    user,
    token,
    rewards,
    claimedRewards,
    cartItems,
    cartCount,
    cartTotalPoints,
    addToCart,
    setCartQuantity,
    removeFromCart,
    checkoutCart,
    loading,
  } = useGolbox()
  const [tab, setTab] = useState<WalletTab>(initialTab)
  const [showLogin, setShowLogin] = useState(false)

  const points = user?.pointsBalance ?? 0
  const canPay = Boolean(token && cartItems.length > 0 && points >= cartTotalPoints)
  const activeCoupons = claimedRewards.filter(isActiveCoupon)
  const pastCoupons = claimedRewards.filter((coupon) => !isActiveCoupon(coupon))

  const cartRows = useMemo(
    () =>
      cartItems
        .map((line) => {
          const reward = rewards.find((item) => item.id === line.rewardId)
          return reward ? { ...line, reward } : null
        })
        .filter((row): row is NonNullable<typeof row> => Boolean(row)),
    [cartItems, rewards],
  )

  const handleCheckout = async () => {
    if (!token) {
      setShowLogin(true)
      return
    }
    const ok = await checkoutCart()
    if (ok) setTab("coupons")
  }

  if (showLogin && !token) {
    return <LoginScreen onClose={() => setShowLogin(false)} closeLabel="Kataloğa dön" />
  }

  return (
    <Screen className="space-y-5">
      <header className="space-y-1">
        {onClose && (
          <button type="button" onClick={onClose} className="text-sm font-medium text-primary">
            {closeLabel}
          </button>
        )}
        <h1 className="font-serif text-2xl text-foreground">Ödül Kataloğu</h1>
        <p className="text-sm text-muted-foreground">
          GölPuan ile sepete eklenir. Kazanılan kupon kişiye özeldir ve 1 yıl geçerlidir. Saha kutusu ve
          Ismarlıyor buradan ayrıdır.
        </p>
      </header>

      <div className="flex items-center justify-between rounded-3xl bg-primary px-5 py-4 text-primary-foreground shadow-md">
        <div>
          <p className="text-xs uppercase tracking-wide text-primary-foreground/70">Mevcut bakiyen</p>
          <p className="font-serif text-3xl font-bold leading-tight">
            {points} <span className="font-sans text-sm font-normal">GP</span>
          </p>
        </div>
        <div className="flex size-10 items-center justify-center rounded-2xl bg-white/10">
          <Gift className="size-6 text-accent" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-full bg-secondary p-1">
        {(
          [
            ["catalog", "Katalog"],
            ["cart", cartCount ? `Sepet (${cartCount})` : "Sepet"],
            ["coupons", "Kuponlarım"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
              tab === id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "catalog" && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Kullanılabilir ikramlar</h2>
          {rewards.length === 0 ? (
            <div className="gol-card flex flex-col items-center gap-2 border-dashed px-6 py-10 text-center">
              <Gift className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Şu an aktif yayınlanan bir ikram bulunmuyor.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {rewards.map((reward) => {
                const inCart = cartItems.find((line) => line.rewardId === reward.id)
                return (
                  <div key={reward.id} className="gol-card flex items-center gap-4 p-4">
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-secondary font-serif text-xl text-primary">
                      {reward.title.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold text-foreground">{reward.title}</h3>
                      <p className="line-clamp-1 text-xs text-muted-foreground">{reward.description}</p>
                      <span className="mt-1 inline-block rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
                        {reward.requiredPoints} GölPuan
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => addToCart(reward.id)}
                      className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm"
                    >
                      {inCart ? `Sepette ${inCart.quantity}` : "Sepete ekle"}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {tab === "cart" && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Sepet</h2>
          {cartRows.length === 0 ? (
            <div className="gol-card flex flex-col items-center gap-2 border-dashed px-6 py-10 text-center">
              <ShoppingBag className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Sepet boş. Katalogdan ikram ekleyin.</p>
            </div>
          ) : (
            <>
              <ul className="grid gap-3">
                {cartRows.map(({ reward, quantity, rewardId }) => (
                  <li key={rewardId} className="gol-card flex items-center gap-4 p-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold text-foreground">{reward.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {reward.requiredPoints} GP × {quantity} = {reward.requiredPoints * quantity} GP
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label="Azalt"
                        onClick={() => setCartQuantity(rewardId, quantity - 1)}
                        className="flex size-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-4 text-center text-sm font-semibold">{quantity}</span>
                      <button
                        type="button"
                        aria-label="Artır"
                        onClick={() => setCartQuantity(rewardId, quantity + 1)}
                        disabled={quantity >= 5}
                        className="flex size-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground disabled:opacity-40"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(rewardId)}
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Çıkar
                    </button>
                  </li>
                ))}
              </ul>

              <div className="gol-card space-y-3 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Toplam</span>
                  <span className="font-serif text-xl text-accent">{cartTotalPoints} GP</span>
                </div>
                {token && points < cartTotalPoints ? (
                  <p className="text-xs text-muted-foreground">
                    Yetersiz bakiye. Sepet {cartTotalPoints} GP, bakiyen {points} GP.
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={loading || cartRows.length === 0 || (Boolean(token) && !canPay)}
                  className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {token ? `GP ile al · ${cartTotalPoints} GP` : "Giriş yapıp kuponları al"}
                </button>
              </div>
            </>
          )}
        </section>
      )}

      {tab === "coupons" && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Kişiye özel kuponlar</h2>
          <p className="text-xs text-muted-foreground">
            Kasada üye QR veya kupon kodu gösterilir. Bu kuponlar saha kutusu ve Ismarlıyor ile karışmaz.
          </p>
          {!token ? (
            <button
              type="button"
              onClick={() => setShowLogin(true)}
              className="gol-card w-full border-dashed px-4 py-6 text-sm text-muted-foreground"
            >
              Kuponlarını görmek için giriş yapın.
            </button>
          ) : claimedRewards.length === 0 ? (
            <div className="gol-card flex flex-col items-center gap-2 border-dashed px-6 py-10 text-center">
              <Ticket className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Henüz kuponun yok. Katalogdan sepete ekle, GP ile al.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {activeCoupons.map((coupon) => (
                <CouponPass key={coupon.claimId} coupon={coupon} />
              ))}
              {pastCoupons.map((coupon) => (
                <CouponPass key={coupon.claimId} coupon={coupon} compact />
              ))}
            </div>
          )}
        </section>
      )}
    </Screen>
  )
}
