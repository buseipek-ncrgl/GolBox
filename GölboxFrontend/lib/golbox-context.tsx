"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useGolToast } from "@/components/golbox/gol-toast"
import * as signalR from "@microsoft/signalr"

const API_BASE_URL = "http://localhost:5155/api/v1"
const HUB_URL = "http://localhost:5155/hubs/orders"

export interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  pointsBalance: number
  age?: number
  educationLevel?: string
}

export interface Cafe {
  id: string
  name: string
  address: string
  categoryId: string
  categoryName?: string
  imageUrl?: string
  isActive?: boolean
  latitude?: number
  longitude?: number
  menuItems: MenuItem[]
}

export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  imageUrl?: string
  minAge?: number
  maxAge?: number
  requiredEducation?: string;
}

export interface Order {
  id: string
  userId: string
  userFullName: string
  cafeName: string
  totalAmount: number
  paidWithPoints: boolean
  pointsUsed: number
  status: string
  collectionCode: string
  imageUrl?: string
  createdDate: string
  items: {
    id: string
    menuItemId: string
    menuItemName: string
    menuItemImageUrl?: string
    quantity: number
    unitPrice: number
  }[]
}

export interface Reward {
  id: string
  title: string
  description: string
  requiredPoints: number
  status: string
  imageUrl?: string
}

export interface CartItem {
  rewardId: string
  quantity: number
}

export interface ClaimedReward {
  claimId: string
  rewardId: string
  rewardTitle: string
  rewardDescription?: string
  imageUrl?: string | null
  requiredPoints?: number
  redeemCode: string
  status: string
  holderName?: string
  personalizedFor?: string
  claimedAt: string
  expiresAt: string
  redeemedAt?: string | null
  isExpired: boolean
  daysRemaining: number
}

export interface FieldDropNearby {
  id: string
  title: string
  description: string
  latitude: number
  longitude: number
  radiusMeters: number
  pointsGranted: number
  imageUrl?: string
  modelGlbUrl?: string | null
  remainingStock: number | null
  inRange: boolean
  distanceMeters: number
}

export interface FieldDropCapture {
  id: string
  dropId: string
  title: string
  pointsGranted: number
  distanceMeters: number
  createdDate: string
  imageUrl?: string | null
}

export interface PointTransaction {
  id: string
  amount: number
  type: string
  description: string
  createdDate: string
}

interface GolboxContextType {
  token: string | null
  user: UserProfile | null
  cafes: Cafe[]
  orders: Order[]
  rewards: Reward[]
  claimedRewards: ClaimedReward[]
  cartItems: CartItem[]
  cartCount: number
  cartTotalPoints: number
  pointTransactions: PointTransaction[]
  fieldDrops: FieldDropNearby[]
  myCaptures: FieldDropCapture[]
  loading: boolean
  sessionReady: boolean
  sessionError: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  register: (data: any) => Promise<boolean>
  createOrder: (cafeId: string, menuItemId: string, quantity: number, paidWithPoints: boolean, imageUrl?: string) => Promise<boolean>
  claimReward: (rewardId: string) => Promise<boolean>
  addToCart: (rewardId: string) => boolean
  setCartQuantity: (rewardId: string, quantity: number) => void
  removeFromCart: (rewardId: string) => void
  checkoutCart: () => Promise<boolean>
  loadMyCoupons: () => Promise<void>
  uploadFile: (file: File) => Promise<string | null>
  refreshData: () => Promise<void>
  loadNearbyFieldDrops: (latitude: number, longitude: number) => Promise<void>
  loadMyCaptures: () => Promise<void>
  captureFieldDrop: (id: string, latitude: number, longitude: number) => Promise<boolean>
}

const CART_PREFIX = "gol_cart_"
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function cartKey(owner: string) {
  return `${CART_PREFIX}${owner}`
}

function readCart(owner: string): CartItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(cartKey(owner))
    const parsed = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((item: CartItem) => item && UUID_RE.test(item.rewardId) && item.quantity > 0)
      .map((item: CartItem) => ({
        rewardId: item.rewardId,
        quantity: Math.min(5, Math.max(1, Number(item.quantity) || 1)),
      }))
  } catch {
    return []
  }
}

function writeCart(owner: string, items: CartItem[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(cartKey(owner), JSON.stringify(items))
}

function mergeCart(a: CartItem[], b: CartItem[]): CartItem[] {
  const map = new Map<string, number>()
  for (const line of [...a, ...b]) {
    map.set(line.rewardId, Math.min(5, (map.get(line.rewardId) ?? 0) + line.quantity))
  }
  return [...map.entries()].map(([rewardId, quantity]) => ({ rewardId, quantity }))
}

const GolboxContext = createContext<GolboxContextType | null>(null)

export function useGolbox() {
  const context = useContext(GolboxContext)
  if (!context) throw new Error("useGolbox must be used within a GolboxProvider")
  return context
}

export function GolboxProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [cafes, setCafes] = useState<Cafe[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [claimedRewards, setClaimedRewards] = useState<ClaimedReward[]>([])
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [pointTransactions, setPointTransactions] = useState<PointTransaction[]>([])
  const [fieldDrops, setFieldDrops] = useState<FieldDropNearby[]>([])
  const [myCaptures, setMyCaptures] = useState<FieldDropCapture[]>([])
  const [loading, setLoading] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [sessionError, setSessionError] = useState(false)
  const showToast = useGolToast()

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("mob_token")
    if (savedToken) {
      setToken(savedToken)
    }
  }, [])

  const refreshData = useCallback(async () => {
    const authHeader: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}
    setSessionError(false)
    try {
      // 1. Fetch profile and collected field boxes first so Home/Profile
      // do not wait on cafe menus.
      if (token) {
        const profileRes = await fetch(`${API_BASE_URL}/users/me`, { headers: authHeader })
        if (profileRes.ok) {
          const res = await profileRes.json()
          if (res.data) setUser(res.data)
        }

        const mineRes = await fetch(`${API_BASE_URL}/field-drops/mine`, { headers: authHeader })
        if (mineRes.ok) {
          const mineJson = await mineRes.json()
          const payload = mineJson.data
          setMyCaptures(Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : [])
        }
      }

      // 2. Fetch cafes (public or authenticated)
      const cafesRes = await fetch(`${API_BASE_URL}/cafes`, { headers: authHeader })
      if (cafesRes.ok) {
        const res = await cafesRes.json()
        const fetchedCafes: Cafe[] = Array.isArray(res.data) ? res.data : []

        const enrichedCafes = await Promise.all(
          fetchedCafes.map(async (c) => {
            const menuRes = await fetch(`${API_BASE_URL}/cafes/${c.id}/menu`, { headers: authHeader })
            if (menuRes.ok) {
              const menuData = await menuRes.json()
              const menuPayload = menuData.data
              return { ...c, menuItems: Array.isArray(menuPayload) ? menuPayload : [] }
            }
            return { ...c, menuItems: [] }
          })
        )

        // Fallback default Şehitkamil cafes if empty
        const defaultCafes: Cafe[] = [
          {
            id: '33333333-3333-3333-3333-333333333333',
            name: 'Gaziantep Şehitkamil Merkez Kitap Kafe',
            address: 'İncilipınar Mah. Muammer Aksoy Bulv. No:12, Şehitkamil / Gaziantep',
            categoryId: '22222222-2222-2222-2222-222222222222',
            menuItems: [
              { id: 'm-1', name: 'Sıcak Filtre Kahve', description: 'Taze demlenmiş espresso blend filtre kahve', price: 25, minAge: 0, maxAge: 99, requiredEducation: 'Tüm Vatandaşlar' },
              { id: 'm-2', name: 'Türk Kahvesi & Lokum', description: 'Geleneksel közde pişirilmiş Türk kahvesi', price: 20, minAge: 0, maxAge: 99, requiredEducation: 'Tüm Vatandaşlar' },
              { id: 'm-3', name: 'Soğuk Brew Latte', description: 'Özel demlenmiş soğuk sütlü kahve', price: 35, minAge: 16, maxAge: 30, requiredEducation: 'Gençler & Öğrenciler' }
            ]
          },
          {
            id: '33333333-3333-3333-3333-444444444444',
            name: 'Şehitkamil Gençlik Kitap Kafe',
            address: 'Atatürk Mah. 15. Sok. No:4, Şehitkamil / Gaziantep',
            categoryId: '22222222-2222-2222-2222-222222222222',
            menuItems: [
              { id: 'm-4', name: 'Demli Çay & Simit', description: 'Taze fırın simidi ve sınırsız demli çay ikramı', price: 15 },
              { id: 'm-5', name: 'Bitki Çayı Çeşitleri', description: 'Ihlamur, adaçayı ve yeşil çay', price: 20 }
            ]
          }
        ]

        setCafes(enrichedCafes.length > 0 ? enrichedCafes : defaultCafes)
      } else {
        // Fallback default cafes if server unauthenticated
        setCafes([
          {
            id: '33333333-3333-3333-3333-333333333333',
            name: 'Gaziantep Şehitkamil Merkez Kitap Kafe',
            address: 'İncilipınar Mah. Muammer Aksoy Bulv. No:12, Şehitkamil / Gaziantep',
            categoryId: '22222222-2222-2222-2222-222222222222',
            menuItems: [
              { id: 'm-1', name: 'Sıcak Filtre Kahve', description: 'Taze demlenmiş espresso blend filtre kahve', price: 25 },
              { id: 'm-2', name: 'Türk Kahvesi & Lokum', description: 'Geleneksel közde pişirilmiş Türk kahvesi', price: 20 },
              { id: 'm-3', name: 'Soğuk Brew Latte', description: 'Özel demlenmiş soğuk sütlü kahve', price: 35 }
            ]
          }
        ])
      }

      // 3. Fetch user orders if token exists
      if (token) {
        const ordersRes = await fetch(`${API_BASE_URL}/orders`, { headers: authHeader })
        if (ordersRes.ok) {
          const res = await ordersRes.json()
          setOrders(Array.isArray(res.data) ? res.data : [])
        }
      }

      // 4. Fetch live catalog only — fake IDs cannot be checked out.
      const rewardsRes = await fetch(`${API_BASE_URL}/rewards`, { headers: authHeader })
      if (rewardsRes.ok) {
        const res = await rewardsRes.json()
        const items = res.data?.items || res.data || []
        setRewards(Array.isArray(items) ? items : [])
      } else {
        setRewards([])
      }

      if (token) {
        const claimedRes = await fetch(`${API_BASE_URL}/rewards/my-claimed`, { headers: authHeader })
        if (claimedRes.ok) {
          const claimedJson = await claimedRes.json()
          setClaimedRewards(Array.isArray(claimedJson.data) ? claimedJson.data : [])
        }
      } else {
        setClaimedRewards([])
      }

      // 5. Fetch point transactions if token exists
      if (token) {
        const pointsRes = await fetch(`${API_BASE_URL}/points`, { headers: authHeader })
        if (pointsRes.ok) {
          const res = await pointsRes.json()
          const items = res.data?.items || res.data || []
          setPointTransactions(items)
        }
      }

    } catch (e) {
      console.error("Failed to load user session data", e)
      setSessionError(true)
    } finally {
      setSessionReady(true)
    }
  }, [token])

  useEffect(() => {
    if (!token) {
      setUser(null)
      setOrders([])
      setPointTransactions([])
      setMyCaptures([])
      setClaimedRewards([])
    }
    void refreshData()
  }, [token, refreshData])

  // Real-time SignalR hub listener
  useEffect(() => {
    if (!token) return

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build()

    connection.on("OrderStatusUpdated", (notification: { orderId: string; status: string; collectionCode: string; userId: string }) => {
      console.log("⚡ SignalR OrderStatusUpdated:", notification)
      showToast(`${notification.collectionCode} kodlu sipariş: ${notification.status}`)
      refreshData()
    })

    connection.start().catch((err) => console.log("SignalR Connection Error:", err))

    return () => {
      connection.stop()
    }
  }, [token, refreshData, showToast])

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch(`${API_BASE_URL}/files/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      })

      const data = await res.json()
      if (res.ok && data.success) {
        showToast("Görsel sunucuya yüklendi.")
        return data.data.url
      } else {
        showToast(`Görsel yüklenemedi: ${data.message || "Bilinmeyen hata"}`)
      }
    } catch (e) {
      showToast("Görsel yükleme bağlantı hatası.")
    }
    return null
  }

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()
      if (res.ok && data.success) {
        localStorage.setItem("mob_token", data.data.accessToken)
        setToken(data.data.accessToken)
        showToast(`Hoş geldiniz, ${data.data.user.firstName}.`)
        setLoading(false)
        return true
      } else {
        showToast(data.message || "Giriş başarısız.")
      }
    } catch (e) {
      showToast("Sunucu bağlantı hatası.")
    }
    setLoading(false)
    return false
  }

  const register = async (data: any) => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          organizationId: "11111111-1111-1111-1111-111111111111" // Gölbaşı organization
        })
      })

      const resData = await res.json()
      if (res.ok && resData.success) {
        showToast("Kayıt başarılı. Giriş yapabilirsiniz.")
        setLoading(false)
        return true
      } else {
        showToast(resData.message || "Kayıt başarısız.")
      }
    } catch (e) {
      showToast("Sunucu bağlantı hatası.")
    }
    setLoading(false)
    return false
  }

  const logout = () => {
    localStorage.removeItem("mob_token")
    setToken(null)
    setUser(null)
    setClaimedRewards([])
    setCartItems(readCart("guest"))
    showToast("Oturum kapatıldı.")
  }

  const createOrder = async (
    cafeId: string,
    menuItemId: string,
    quantity: number,
    paidWithPoints: boolean,
    imageUrl?: string
  ) => {
    if (!user) {
      showToast("Profil yükleniyor. Biraz sonra tekrar deneyin.")
      return false
    }
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user.id,
          cafeId,
          paidWithPoints,
          imageUrl,
          items: [{ menuItemId, quantity }]
        })
      })

      const data = await res.json()
      if (res.ok && data.success) {
        showToast("Ismarlıyor listene eklendi.")
        await refreshData()
        setLoading(false)
        return true
      } else {
        showToast(data.message || "Sipariş oluşturulamadı.")
      }
    } catch (e) {
      showToast("Sipariş gönderilemedi.")
    }
    setLoading(false)
    return false
  }

  const cartOwner = user?.id ?? "guest"

  useEffect(() => {
    if (typeof window === "undefined") return
    if (user?.id) {
      const merged = mergeCart(readCart("guest"), readCart(user.id))
      writeCart(user.id, merged)
      localStorage.removeItem(cartKey("guest"))
      setCartItems(merged)
      return
    }
    setCartItems(readCart("guest"))
  }, [user?.id])

  const persistCart = (next: CartItem[]) => {
    setCartItems(next)
    writeCart(cartOwner, next)
  }

  const addToCart = (rewardId: string) => {
    if (!UUID_RE.test(rewardId)) {
      showToast("Bu ikram henüz katalogda değil.")
      return false
    }
    const current = readCart(cartOwner)
    const existing = current.find((line) => line.rewardId === rewardId)
    if (existing && existing.quantity >= 5) {
      showToast("Aynı ikramdan en fazla 5 adet eklenebilir.")
      persistCart(current)
      return false
    }
    const next = existing
      ? current.map((line) =>
          line.rewardId === rewardId ? { ...line, quantity: Math.min(5, line.quantity + 1) } : line,
        )
      : [...current, { rewardId, quantity: 1 }]
    persistCart(next)
    showToast("Sepete eklendi.")
    return true
  }

  const setCartQuantity = (rewardId: string, quantity: number) => {
    const nextQty = Math.min(5, Math.max(0, Math.floor(quantity)))
    const next =
      nextQty === 0
        ? cartItems.filter((line) => line.rewardId !== rewardId)
        : cartItems.map((line) => (line.rewardId === rewardId ? { ...line, quantity: nextQty } : line))
    persistCart(next)
  }

  const removeFromCart = (rewardId: string) => {
    persistCart(cartItems.filter((line) => line.rewardId !== rewardId))
  }

  const loadMyCoupons = useCallback(async () => {
    if (!token) {
      setClaimedRewards([])
      return
    }
    try {
      const res = await fetch(`${API_BASE_URL}/rewards/my-claimed`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        setClaimedRewards([])
        return
      }
      const json = await res.json()
      setClaimedRewards(Array.isArray(json.data) ? json.data : [])
    } catch {
      setClaimedRewards([])
    }
  }, [token])

  const claimReward = async (rewardId: string) => {
    if (!token) {
      showToast("Kupon almak için giriş yapın.")
      return false
    }
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/rewards/${rewardId}/claim`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const data = await res.json()
      if (res.ok && data.success) {
        showToast("Kişiye özel kupon cüzdanına işlendi. 1 yıl geçerli.")
        await refreshData()
        await loadMyCoupons()
        setLoading(false)
        return true
      } else {
        showToast(data.message || "Ödül alınamadı.")
      }
    } catch (e) {
      showToast("Ödül talebi gönderilemedi.")
    }
    setLoading(false)
    return false
  }

  const checkoutCart = async () => {
    if (!token) {
      showToast("Kupon almak için giriş yapın.")
      return false
    }
    if (cartItems.length === 0) {
      showToast("Sepet boş.")
      return false
    }
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/rewards/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: cartItems.map((line) => ({ rewardId: line.rewardId, quantity: line.quantity })),
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        persistCart([])
        showToast(data.message || "Kişiye özel kuponların 1 yıl geçerli.")
        await refreshData()
        await loadMyCoupons()
        setLoading(false)
        return true
      }
      showToast(data.message || "Sepet alınamadı.")
    } catch {
      showToast("Sepet gönderilemedi.")
    }
    setLoading(false)
    return false
  }

  const cartTotalPoints = cartItems.reduce((sum, line) => {
    const reward = rewards.find((item) => item.id === line.rewardId)
    return sum + (reward?.requiredPoints ?? 0) * line.quantity
  }, 0)
  const cartCount = cartItems.reduce((sum, line) => sum + line.quantity, 0)

  const loadNearbyFieldDrops = useCallback(async (latitude: number, longitude: number) => {
    try {
      const authHeader: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await fetch(
        `${API_BASE_URL}/field-drops/nearby?latitude=${latitude}&longitude=${longitude}`,
        { headers: authHeader }
      )
      if (!res.ok) {
        setFieldDrops([])
        return
      }
      const json = await res.json()
      const items = Array.isArray(json.data) ? json.data : []
      setFieldDrops(items)
    } catch {
      setFieldDrops([])
    }
  }, [token])

  const loadMyCaptures = useCallback(async () => {
    if (!token) {
      setMyCaptures([])
      return
    }
    try {
      const res = await fetch(`${API_BASE_URL}/field-drops/mine`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) {
        setMyCaptures([])
        return
      }
      const json = await res.json()
      const payload = json.data
      setMyCaptures(Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : [])
    } catch {
      setMyCaptures([])
    }
  }, [token])

  const captureFieldDrop = useCallback(async (id: string, latitude: number, longitude: number) => {
    if (!token) {
      showToast("Toplamak için giriş yapın.")
      return false
    }
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/field-drops/${id}/capture`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ latitude, longitude })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        const points = data.data?.pointsGranted ?? 0
        showToast(points ? `Saha hediyesi alındı. +${points} GP` : "Saha hediyesi alındı.")
        await refreshData()
        await loadNearbyFieldDrops(latitude, longitude)
        await loadMyCaptures()
        setLoading(false)
        return true
      }
      showToast(data.message || "Bu hediye alınamadı.")
    } catch {
      showToast("Toplama isteği gönderilemedi.")
    }
    setLoading(false)
    return false
  }, [token, showToast, refreshData, loadNearbyFieldDrops, loadMyCaptures])

  return (
    <GolboxContext.Provider
      value={{
        token,
        user,
        cafes,
        orders,
        rewards,
        claimedRewards,
        cartItems,
        cartCount,
        cartTotalPoints,
        pointTransactions,
        fieldDrops,
        myCaptures,
        loading,
        sessionReady,
        sessionError,
        login,
        logout,
        register,
        createOrder,
        claimReward,
        addToCart,
        setCartQuantity,
        removeFromCart,
        checkoutCart,
        loadMyCoupons,
        uploadFile,
        refreshData,
        loadNearbyFieldDrops,
        loadMyCaptures,
        captureFieldDrop
      }}
    >
      {children}
    </GolboxContext.Provider>
  )
}
