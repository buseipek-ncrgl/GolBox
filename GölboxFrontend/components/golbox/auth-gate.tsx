"use client"

import React from "react"
import { ShieldCheck, Coffee, Coins, Heart, Bell, Calendar, Award, LogIn, ArrowRight, X, Sparkles } from "lucide-react"

export type AuthGateContext =
  | "QR"
  | "LOYALTY"
  | "PROFILE"
  | "CHECKOUT"
  | "FAVORITES"
  | "NOTIFICATIONS"
  | "EVENT"
  | "MISSION"

interface AuthGateConfig {
  icon: React.ElementType
  title: string
  subtitle: string
  description: string
  bulletPoints: string[]
  primaryActionLabel: string
}

const AUTH_GATE_CONFIGS: Record<AuthGateContext, AuthGateConfig> = {
  QR: {
    icon: ShieldCheck,
    title: "GölBOX Dijital Kimlik",
    subtitle: "Kasa İşlemleri & Üye Tanıma",
    description: "GölBOX şubelerimizde üye tanıma, sipariş teslimatı ve puan kazanımı için dijital QR kodunuzu oluşturun.",
    bulletPoints: [
      "Şubelerde kasanıza özel anında üye tanıma",
      "Sipariş teslimatı ve Gel-Al kod doğrulaması",
      "Tamamlanan alışverişlerden GölPuan kazanımı",
    ],
    primaryActionLabel: "Giriş Yap veya Kayıt Ol",
  },
  LOYALTY: {
    icon: Coins,
    title: "GölPuan & Sadakat Hesabı",
    subtitle: "Puan Kazan & Ödülleri Topla",
    description: "Kahve alışverişlerinizden GölPuan kazanmak, hediye ürünler almak ve ödül kataloğunu kullanmak için giriş yapın.",
    bulletPoints: [
      "Her Gel-Al siparişinde otomatik GölPuan kazanımı",
      "Ücretsiz kahve ve tatlı ikram kataloğuna erişim",
      "2X GölPuan ve özel kampanya çarpanları",
    ],
    primaryActionLabel: "Giriş Yap veya Kayıt Ol",
  },
  PROFILE: {
    icon: ShieldCheck,
    title: "GölBOX Hesabınız",
    subtitle: "Kişisel Tercihler & Hesap Ayarları",
    description: "Kişisel tercihlerinizi, favorilerinizi, geçmiş siparişlerinizi ve hesap ayarlarınızı tek yerden yönetin.",
    bulletPoints: [
      "Geçmiş ve aktif sipariş durum takibi",
      "Favori şube ve özel kahve tariflerinizi kaydetme",
      "Bildirim tercihleri ve hesap güvenliği yönetimi",
    ],
    primaryActionLabel: "Giriş Yap veya Üye Ol",
  },
  CHECKOUT: {
    icon: Coffee,
    title: "Siparişinizi İletmek İçin Giriş Yapın",
    subtitle: "Gel-Al Sipariş Doğrulaması",
    description: "Gel-Al siparişinizin seçtiğiniz şubede hazırlanması ve canlı sipariş durumu bildirimi alabilmeniz için üye girişi gereklidir.",
    bulletPoints: [
      "Sepetinizdeki tüm lezzetler korunarak oturum açılır",
      "Sipariş durumunuz anlık olarak hesabınıza tanımlanır",
      "Ödemenizi kasada teslim alırken kolayca yaparsınız",
    ],
    primaryActionLabel: "Giriş Yapıp Siparişe Devam Et",
  },
  FAVORITES: {
    icon: Heart,
    title: "Favori Lezzetleriniz",
    subtitle: "Kişisel Favoriler & Tarifler",
    description: "Sevdiğiniz ürünleri ve özel kahve tariflerinizi kaydedip her zaman tek tıkla ulaşmak için giriş yapın.",
    bulletPoints: [
      "Favori ürünlerinize tüm cihazlarınızdan hızlı erişim",
      "Özel şurup, süt ve porsiyon seçimlerinizi kaydetme",
      "Tek tıkla sepete ekleme kolaylığı",
    ],
    primaryActionLabel: "Giriş Yap",
  },
  NOTIFICATIONS: {
    icon: Bell,
    title: "Bildirim Merkezi",
    subtitle: "Canlı Güncellemeler & Fırsatlar",
    description: "Canlı sipariş durum güncellemeleri, katıldığınız etkinlik hatırlatmaları ve size özel duyuruları takip etmek için giriş yapın.",
    bulletPoints: [
      "Sipariş hazırlandı ve teslime hazır canlı bildirimleri",
      "Etkinlik saati ve konum değişiklik duyuruları",
      "GölPuan hareketleri ve özel kampanya avantajları",
    ],
    primaryActionLabel: "Giriş Yap",
  },
  EVENT: {
    icon: Calendar,
    title: "Etkinlik Kaydı",
    subtitle: "Belediye & Gençlik Programları",
    description: "Şehitkamil Belediyesi ve GölBOX tarafından düzenlenen atölye ve gençlik etkinliklerine kayıt olmak için giriş yapın.",
    bulletPoints: [
      "Atölye ve teknoloji etkinliklerine ücretsiz kayıt",
      "Etkinlik günü hızlı QR check-in imkânı",
      "Doğrulanmış katılımlarla ekstra GölPuan kazanımı",
    ],
    primaryActionLabel: "Giriş Yap ve Kayıt Ol",
  },
  MISSION: {
    icon: Award,
    title: "Görevler & Ödüller",
    subtitle: "Şehir Keşfi & Bonus Puanlar",
    description: "Şube keşfi, etkinlik katılımı ve özel görevlere katılarak bonus GölPuan kazanmak için giriş yapın.",
    bulletPoints: [
      "Farklı şubeleri ziyaret ederek görevleri tamamlama",
      "Etkinlik katılımları ile seviye kaydetme",
      "Görev tamamlandığında anında +GP ödülü",
    ],
    primaryActionLabel: "Giriş Yap",
  },
}

export function AuthGate({
  context,
  onLogin,
  onClose,
}: {
  context: AuthGateContext
  onLogin: () => void
  onClose?: () => void
}) {
  const cfg = AUTH_GATE_CONFIGS[context] || AUTH_GATE_CONFIGS.PROFILE
  const Icon = cfg.icon

  return (
    <div className="w-full max-w-lg mx-auto p-4 space-y-5 animate-in fade-in duration-200">
      {onClose && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="flex size-9 items-center justify-center rounded-xl border border-border/80 bg-card text-foreground shadow-2xs hover:bg-accent transition"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* HERO CARD */}
      <div className="rounded-3xl border border-primary/20 bg-card p-6 shadow-2xs space-y-4 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
          <Icon className="size-7" />
        </div>

        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.16em] text-primary block">
            {cfg.subtitle}
          </span>
          <h2 className="text-xl font-bold tracking-tight text-foreground mt-1">
            {cfg.title}
          </h2>
          <p className="text-xs text-muted-foreground font-medium mt-2 leading-relaxed max-w-sm mx-auto">
            {cfg.description}
          </p>
        </div>

        {/* BULLET POINTS */}
        <div className="rounded-2xl border border-border/60 bg-accent/40 p-4 text-left space-y-2.5">
          {cfg.bulletPoints.map((pt, i) => (
            <div key={i} className="flex items-start gap-2.5 text-xs font-medium text-foreground">
              <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary mt-0.5 text-[10px] font-black">
                ✓
              </span>
              <span>{pt}</span>
            </div>
          ))}
        </div>

        {/* PRIMARY LOGIN CTA */}
        <button
          type="button"
          onClick={onLogin}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-xs font-black text-primary-foreground shadow-md hover:bg-primary/90 transition active:scale-95"
        >
          <LogIn className="size-4" />
          <span>{cfg.primaryActionLabel}</span>
          <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  )
}
