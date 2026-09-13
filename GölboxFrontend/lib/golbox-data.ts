export type TabId = "home" | "qr" | "map" | "profile"

// Mock user/cafe fixtures are unused in production UI.
// Keep TabId here so navigation imports stay stable.

export const user = {
  name: "Enes",
  fullName: "Enes Yılmaz",
  memberSince: "2024",
  points: 680,
  // İlerleme, bir sonraki ödüle göre gösterilir (puan değil, hedef)
  reward: {
    title: "Ücretsiz Filtre Kahve",
    tierStart: 500,
    target: 800,
  },
  qrId: "GB-4827-1193",
}

export function rewardProgress() {
  const { points } = user
  const { tierStart, target } = user.reward
  const pct = Math.max(0, Math.min(1, (points - tierStart) / (target - tierStart)))
  const remaining = Math.max(0, target - points)
  return { pct, remaining }
}

export type Cafe = {
  id: string
  name: string
  category: string
  distance: string
  walk: string
  image: string
  open: boolean
  closeAt: string
  address: string
  hint?: string
  menu: { section: string; items: { name: string; price: string }[] }[]
  campaign?: string
}

export const cafes: Cafe[] = [
  {
    id: "sahil",
    name: "Göl Kafe · Sahil",
    category: "Üçüncü Nesil Kahve",
    distance: "280 m",
    walk: "4 dk yürüme",
    image: "/cafes/golkafe-sahil.png",
    open: true,
    closeAt: "23:00",
    address: "Sahil Caddesi No.12, Göl Mahallesi",
    hint: "Sana en yakın şube",
    campaign: "Bugün filtre kahvede 2 kat Göl Puan",
    menu: [
      {
        section: "Sıcak Kahveler",
        items: [
          { name: "Filtre Kahve", price: "₺55" },
          { name: "Flat White", price: "₺75" },
          { name: "Cortado", price: "₺70" },
        ],
      },
      {
        section: "Soğuk",
        items: [
          { name: "Cold Brew", price: "₺80" },
          { name: "Ice Latte", price: "₺78" },
        ],
      },
    ],
  },
  {
    id: "merkez",
    name: "Göl Kafe · Merkez",
    category: "Kahve & Fırın",
    distance: "1,1 km",
    walk: "14 dk yürüme",
    image: "/cafes/golkafe-merkez.png",
    open: true,
    closeAt: "22:00",
    address: "Cumhuriyet Meydanı No.4",
    menu: [
      {
        section: "Sıcak Kahveler",
        items: [
          { name: "Espresso", price: "₺45" },
          { name: "Latte", price: "₺72" },
          { name: "Türk Kahvesi", price: "₺50" },
        ],
      },
      {
        section: "Fırın",
        items: [
          { name: "Tereyağlı Kruvasan", price: "₺60" },
          { name: "San Sebastian", price: "₺95" },
        ],
      },
    ],
  },
  {
    id: "park",
    name: "Göl Kafe · Park",
    category: "Kahve & Kahvaltı",
    distance: "2,3 km",
    walk: "Araçla 8 dk",
    image: "/cafes/golkafe-park.png",
    open: false,
    closeAt: "09:00",
    address: "Millet Parkı Girişi",
    menu: [
      {
        section: "Sıcak Kahveler",
        items: [
          { name: "Filtre Kahve", price: "₺55" },
          { name: "Cappuccino", price: "₺70" },
        ],
      },
    ],
  },
]

// Ana sayfa: "Bugün seni bekleyen" tek öne çıkan fırsat
export const todayHighlight = {
  kicker: "Bugün sana uygun",
  title: "Filtre kahvende çift puan",
  detail: "Göl Kafe Sahil'de bugün geçerli. Kasada tek QR yeter.",
  cafe: "Göl Kafe · Sahil",
}

// Ismarlıyor: hazırlık alanındaki aktif ikramlar (sipariş değil)
export type PrepItem = {
  id: string
  title: string
  cafe: string
  status: "hazir" | "hazirlaniyor"
  note: string
  items: string[]
}

export const activePreps: PrepItem[] = [
  {
    id: "p1",
    title: "Seni bekleyen ikram",
    cafe: "Göl Kafe · Sahil",
    status: "hazir",
    note: "Kasada QR'ını göster, hemen hazır.",
    items: ["Filtre Kahve", "Tereyağlı Kruvasan"],
  },
]

// Profil / Ana sayfa: son puan hareketleri
export const activity = [
  { id: "a1", label: "Günlük giriş", value: "+15", when: "Bugün 08:24", kind: "earn" as const },
  { id: "a2", label: "Göl Kafe Sahil · kahve", value: "+40", when: "Dün 17:10", kind: "earn" as const },
  { id: "a3", label: "Ücretsiz kruvasan", value: "-200", when: "3 gün önce", kind: "spend" as const },
  { id: "a4", label: "Etkinlik katılımı", value: "+60", when: "5 gün önce", kind: "earn" as const },
]

// Yaklaşan ödüller (ilerleme hissi için)
export const rewards = [
  { id: "r1", title: "Ücretsiz Filtre Kahve", target: 800, image: "/rewards/latte.png" },
  { id: "r2", title: "Ücretsiz San Sebastian", target: 1200, image: "/rewards/latte.png" },
]
