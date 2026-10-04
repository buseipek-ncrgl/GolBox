"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useGolToast } from "@/components/golbox/gol-toast"
import * as signalR from "@microsoft/signalr"
import { API_BASE_URL, HUB_URL, NOTIFICATION_HUB_URL } from "@/lib/api-config"
import { fetchUnreadCount } from "@/lib/city-content-api"

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
  orderNumber?: string
  userId: string
  userFullName: string
  cafeName: string
  branchAddress?: string
  totalAmount: number
  paidWithPoints: boolean
  pointsUsed: number
  status: "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED" | "NO_SHOW" | string
  paymentStatus?: "UNPAID" | "PAID"
  collectionCode: string
  imageUrl?: string
  createdDate: string
  estimatedMin?: number
  estimatedMax?: number
  canCancel?: boolean
  items: {
    id: string
    menuItemId: string
    menuItemName: string
    menuItemImageUrl?: string
    customizationSummary?: string
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

export interface PublicSettings {
  visitBonusPoints: number
  rewardExpireDays: number
  pointsExchangeRate: number
}

export type CafesLoadState = "idle" | "ok" | "empty" | "error"

export interface PointTransaction {
  id: string
  amount: number
  type: string
  description: string
  createdDate: string
}

export interface SavedConfiguration {
  id: string
  productId: string
  name: string
  summary: string
  createdAt: string
}

export interface FoodCartItem {
  id: string
  product: MenuItem & { imageUrl?: string; studentPrice?: number }
  customizationSummary: string
  quantity: number
  unitPrice: number
  totalPrice: number
  isAvailable?: boolean
}

export interface SelectedBranch {
  id: string
  name: string
  address: string
  latitude?: number
  longitude?: number
  isOpen?: boolean
  closesAt?: string
  pickupStatus?: string
  estimatedMin?: number
  estimatedMax?: number
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
  cafesLoadState: CafesLoadState
  publicSettings: PublicSettings
  foodCart: FoodCartItem[]
  selectedBranch: SelectedBranch
  addToFoodCart: (product: MenuItem, quantity: number, customizationSummary: string, unitPrice: number) => void
  updateFoodCartQuantity: (cartItemId: string, quantity: number) => void
  updateFoodCartCustomization: (cartItemId: string, customizationSummary: string, unitPrice: number) => void
  removeFromFoodCart: (cartItemId: string) => void
  clearFoodCart: () => void
  setSelectedBranch: (branch: SelectedBranch) => void
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
  unreadCount: number
  favorites: string[]
  toggleFavorite: (productId: string) => void
  savedConfigurations: SavedConfiguration[]
  saveCustomConfiguration: (name: string, productId: string, summary: string) => void
  refreshUnreadCount: () => Promise<void>
  addBonusPoints: (amount: number, description: string) => void
  updateProfileState: (firstName: string, lastName: string) => Promise<void> | void
  changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>
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

const DEFAULT_DEMO_DROPS: FieldDropNearby[] = [
  {
    id: "drop-1",
    title: "Şehitkamil Gençlik Parkı 3D Kahve Hediyesi",
    description: "Atatürk Mah. Gençlik Parkı İçinde Süzülen 3D Pipetli Soğuk Kahve Bardağı",
    latitude: 37.0662,
    longitude: 37.3781,
    radiusMeters: 500,
    pointsGranted: 50,
    remainingStock: 25,
    inRange: true,
    distanceMeters: 180,
  },
  {
    id: "drop-2",
    title: "Dülük Tabiat Parkı Doğa Hediyesi",
    description: "Dülük Köyü Gençlik Kampı Yürüyüş Yolu",
    latitude: 37.0921,
    longitude: 37.3510,
    radiusMeters: 500,
    pointsGranted: 100,
    remainingStock: 15,
    inRange: true,
    distanceMeters: 320,
  },
  {
    id: "drop-3",
    title: "İbrahimli Kitap Kafe İkram Kutusu",
    description: "24 Saat Açık Kitap Kafe Bahçesinde Dokunarak Al",
    latitude: 37.0789,
    longitude: 37.3456,
    radiusMeters: 500,
    pointsGranted: 75,
    remainingStock: 40,
    inRange: true,
    distanceMeters: 410,
  },
]

export function GolboxProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [cafes, setCafes] = useState<Cafe[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [claimedRewards, setClaimedRewards] = useState<ClaimedReward[]>([])
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [pointTransactions, setPointTransactions] = useState<PointTransaction[]>([])
  const [fieldDrops, setFieldDrops] = useState<FieldDropNearby[]>(DEFAULT_DEMO_DROPS)
  const [myCaptures, setMyCaptures] = useState<FieldDropCapture[]>([])
  const [loading, setLoading] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [sessionError, setSessionError] = useState(false)
  const [cafesLoadState, setCafesLoadState] = useState<CafesLoadState>("idle")
  const [publicSettings, setPublicSettings] = useState<PublicSettings>({
    visitBonusPoints: 15,
    rewardExpireDays: 365,
    pointsExchangeRate: 1,
  })
  const [unreadCount, setUnreadCount] = useState(0)
  const [favorites, setFavoritesState] = useState<string[]>(() => {
    if (typeof window === "undefined") return ["m-1", "m-4"]
    try {
      const raw = localStorage.getItem("gol_favorites")
      return raw ? JSON.parse(raw) : ["m-1", "m-4"]
    } catch {
      return ["m-1", "m-4"]
    }
  })

  const toggleFavorite = useCallback((productId: string) => {
    setFavoritesState((prev) => {
      const next = prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("gol_favorites", JSON.stringify(next))
        } catch {}
      }
      return next
    })
  }, [])

  const [savedConfigurations, setSavedConfigurations] = useState<SavedConfiguration[]>(() => {
    if (typeof window === "undefined") return []
    try {
      const raw = localStorage.getItem("gol_saved_configs")
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  const saveCustomConfiguration = useCallback((name: string, productId: string, summary: string) => {
    setSavedConfigurations((prev) => {
      const newConfig: SavedConfiguration = {
        id: `cfg-${Date.now()}`,
        name: name || "Benim Özel Kahvem",
        productId,
        summary,
        createdAt: new Date().toISOString()
      }
      const next = [newConfig, ...prev]
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("gol_saved_configs", JSON.stringify(next))
        } catch {}
      }
      return next
    })
  }, [])

  // FOOD & DRINK MOBILE CART STATE (SECTIONS 1 - 136)
  const [selectedBranch, setSelectedBranch] = useState<SelectedBranch>({
    id: "branch-1",
    name: "Şehitkamil Kitap Kafe Merkez",
    address: "Atatürk Mah. Bulvar No:42, Gaziantep"
  })

  const [foodCart, setFoodCart] = useState<FoodCartItem[]>(() => [
    {
      id: "fc-1",
      product: {
        id: "m-4",
        name: "Iced Vanilla Latte",
        description: "Espresso, süt, vanilya şurubu ve buzun ferahlatıcı buluşması",
        price: 70,
        imageUrl: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&auto=format&fit=crop&q=60"
      },
      customizationSummary: "Büyük Boy · Yulaf Sütü · Ekstra Shot · Az Buz",
      quantity: 1,
      unitPrice: 195,
      totalPrice: 195,
      isAvailable: true
    },
    {
      id: "fc-2",
      product: {
        id: "m-7",
        name: "Belçika Çikolatalı Cheesecake",
        description: "%100 Belçika çikolatalı taze cheesecake",
        price: 85,
        imageUrl: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400&auto=format&fit=crop&q=60"
      },
      customizationSummary: "Standart Dilim",
      quantity: 1,
      unitPrice: 85,
      totalPrice: 85,
      isAvailable: true
    }
  ])

  const addToFoodCart = useCallback((product: MenuItem, quantity: number, customizationSummary: string, unitPrice: number) => {
    setFoodCart((prev) => {
      const existingIndex = prev.findIndex(item => item.product.id === product.id && item.customizationSummary === customizationSummary)
      if (existingIndex > -1) {
        const next = [...prev]
        const existing = next[existingIndex]
        const newQty = existing.quantity + quantity
        next[existingIndex] = {
          ...existing,
          quantity: newQty,
          totalPrice: existing.unitPrice * newQty
        }
        return next
      } else {
        const newItem: FoodCartItem = {
          id: `fc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          product,
          customizationSummary: customizationSummary || "Standart Reçete",
          quantity,
          unitPrice,
          totalPrice: unitPrice * quantity,
          isAvailable: true
        }
        return [newItem, ...prev]
      }
    })
  }, [])

  const updateFoodCartQuantity = useCallback((cartItemId: string, quantity: number) => {
    setFoodCart((prev) => {
      if (quantity <= 0) {
        return prev.filter(item => item.id !== cartItemId)
      }
      return prev.map(item => {
        if (item.id === cartItemId) {
          return {
            ...item,
            quantity,
            totalPrice: item.unitPrice * quantity
          }
        }
        return item
      })
    })
  }, [])

  const updateFoodCartCustomization = useCallback((cartItemId: string, customizationSummary: string, unitPrice: number) => {
    setFoodCart((prev) => {
      return prev.map(item => {
        if (item.id === cartItemId) {
          return {
            ...item,
            customizationSummary,
            unitPrice,
            totalPrice: unitPrice * item.quantity
          }
        }
        return item
      })
    })
  }, [])

  const removeFromFoodCart = useCallback((cartItemId: string) => {
    setFoodCart((prev) => prev.filter(item => item.id !== cartItemId))
  }, [])

  const clearFoodCart = useCallback(() => {
    setFoodCart([])
  }, [])

  const showToast = useGolToast()

  // Load tokens from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("mob_token")
    if (savedToken) {
      setToken(savedToken)
    }
  }, [])

  const refreshAuthToken = useCallback(async (): Promise<string | null> => {
    const savedRefreshToken = typeof window !== "undefined" ? localStorage.getItem("mob_refresh_token") : null
    if (!savedRefreshToken) return null
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: savedRefreshToken }),
      })
      if (!res.ok) {
        localStorage.removeItem("mob_token")
        localStorage.removeItem("mob_refresh_token")
        setToken(null)
        setUser(null)
        return null
      }
      const json = await res.json()
      if (json.data?.accessToken) {
        localStorage.setItem("mob_token", json.data.accessToken)
        if (json.data.refreshToken) {
          localStorage.setItem("mob_refresh_token", json.data.refreshToken)
        }
        setToken(json.data.accessToken)
        return json.data.accessToken
      }
    } catch {
      /* ignore */
    }
    return null
  }, [])

  const fetchWithAuth = useCallback(
    async (url: string, init?: RequestInit): Promise<Response> => {
      let currentToken = token || (typeof window !== "undefined" ? localStorage.getItem("mob_token") : null)
      const headers = new Headers(init?.headers)
      if (currentToken) headers.set("Authorization", `Bearer ${currentToken}`)
      let res = await fetch(url, { ...init, headers })

      if (res.status === 401 && currentToken) {
        const newToken = await refreshAuthToken()
        if (newToken) {
          headers.set("Authorization", `Bearer ${newToken}`)
          res = await fetch(url, { ...init, headers })
        }
      }
      return res
    },
    [token, refreshAuthToken],
  )

  const refreshData = useCallback(async () => {
    const authHeader: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}
    setSessionError(false)
    try {
      if (token) {
        const [profileRes, mineRes] = await Promise.all([
          fetchWithAuth(`${API_BASE_URL}/users/me`),
          fetchWithAuth(`${API_BASE_URL}/field-drops/mine`),
        ])
        if (profileRes.ok) {
          const res = await profileRes.json()
          if (res.data) setUser(res.data)
        }
        if (mineRes.ok) {
          const mineJson = await mineRes.json()
          const payload = mineJson.data
          setMyCaptures(Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : [])
        }
      }

      const settingsRes = await fetch(`${API_BASE_URL}/settings/public`, { headers: authHeader })
      if (settingsRes.ok) {
        const settingsJson = await settingsRes.json()
        const s = settingsJson.data || {}
        setPublicSettings({
          visitBonusPoints: Number(s.visitBonusPoints) > 0 ? Number(s.visitBonusPoints) : 15,
          rewardExpireDays: Number(s.rewardExpireDays) > 0 ? Number(s.rewardExpireDays) : 365,
          pointsExchangeRate: Number(s.pointsExchangeRate) > 0 ? Number(s.pointsExchangeRate) : 1,
        })
      }

      // Fast boot: fetch cafes without N+1 sequential menu requests
      const cafesRes = await fetch(`${API_BASE_URL}/cafes`, { headers: authHeader })
      if (cafesRes.ok) {
        const res = await cafesRes.json()
        const fetchedCafes: Cafe[] = Array.isArray(res.data) ? res.data : []
        setCafes(fetchedCafes.map((c) => ({ ...c, menuItems: c.menuItems ?? [] })))
        setCafesLoadState(fetchedCafes.length > 0 ? "ok" : "empty")
      } else {
        setCafes([])
        setCafesLoadState("error")
      }

      if (token) {
        const [ordersRes, claimedRes, pointsRes] = await Promise.all([
          fetchWithAuth(`${API_BASE_URL}/orders`),
          fetchWithAuth(`${API_BASE_URL}/rewards/my-claimed`),
          fetchWithAuth(`${API_BASE_URL}/points`),
        ])
        if (ordersRes.ok) {
          const res = await ordersRes.json()
          setOrders(Array.isArray(res.data) ? res.data : [])
        }
        if (claimedRes.ok) {
          const claimedJson = await claimedRes.json()
          setClaimedRewards(Array.isArray(claimedJson.data) ? claimedJson.data : [])
        } else {
          setClaimedRewards([])
        }
        if (pointsRes.ok) {
          const res = await pointsRes.json()
          const items = res.data?.items || res.data || []
          setPointTransactions(items)
        }
      }

      const rewardsRes = await fetch(`${API_BASE_URL}/rewards`, { headers: authHeader })
      if (rewardsRes.ok) {
        const res = await rewardsRes.json()
        const items = res.data?.items || res.data || []
        setRewards(Array.isArray(items) ? items : [])
      } else {
        setRewards([])
      }
    } catch (e) {
      setSessionError(true)
      setCafes([])
      setCafesLoadState("error")
    } finally {
      setSessionReady(true)
    }
  }, [token, fetchWithAuth])

  useEffect(() => {
    if (!token) {
      setUser(null)
      setOrders([])
      setPointTransactions([])
      setMyCaptures([])
      setClaimedRewards([])
      setUnreadCount(0)
    }
    void refreshData()
  }, [token, refreshData])

  // Real-time SignalR hub listener with Turkish status mapping
  useEffect(() => {
    if (!token) return

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => localStorage.getItem("mob_token") || token || "",
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.None)
      .build()

    const statusTrMap: Record<string, string> = {
      Pending: "Hazırlanıyor",
      Preparing: "Hazırlanıyor",
      Ready: "Teslime Hazır",
      Completed: "Teslim Edildi",
      Cancelled: "İptal Edildi",
    }

    connection.on("OrderStatusUpdated", (notification: { orderId: string; status: string; collectionCode?: string }) => {
      const trStatus = statusTrMap[notification.status] || notification.status
      const codeMsg = notification.collectionCode ? ` (${notification.collectionCode})` : ""
      showToast(`Siparişiniz ${trStatus} durumuna geçti${codeMsg}.`)
      void refreshData()
    })

    connection.start().catch(async (err: any) => {
      const isUnauthorized = err?.statusCode === 401 || err?.message?.includes("401") || String(err).includes("401")
      if (isUnauthorized) {
        const newToken = await refreshAuthToken()
        if (!newToken) {
          localStorage.removeItem("mob_token")
          localStorage.removeItem("mob_refresh_token")
          setToken(null)
          setUser(null)
        }
      }
    })

    return () => {
      connection.stop().catch(() => {})
    }
  }, [token, refreshData, showToast, refreshAuthToken])

  const refreshUnreadCount = useCallback(async () => {
    if (!token) {
      setUnreadCount(0)
      return
    }
    try {
      setUnreadCount(await fetchUnreadCount(token))
    } catch {
      setUnreadCount(0)
    }
  }, [token])

  useEffect(() => {
    void refreshUnreadCount()
  }, [refreshUnreadCount])

  useEffect(() => {
    if (!token) return

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(NOTIFICATION_HUB_URL, {
        accessTokenFactory: () => localStorage.getItem("mob_token") || token || "",
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.None)
      .build()

    connection.on("ReceiveNotification", (payload: { title?: string }) => {
      if (payload?.title) showToast(payload.title)
      void refreshUnreadCount()
    })

    connection.start().catch(async (err: any) => {
      const isUnauthorized = err?.statusCode === 401 || err?.message?.includes("401") || String(err).includes("401")
      if (isUnauthorized) {
        const newToken = await refreshAuthToken()
        if (!newToken) {
          localStorage.removeItem("mob_token")
          localStorage.removeItem("mob_refresh_token")
          setToken(null)
          setUser(null)
        }
      }
    })

    return () => {
      connection.stop().catch(() => {})
    }
  }, [token, refreshUnreadCount, showToast, refreshAuthToken])

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
    localStorage.removeItem("mob_refresh_token")
    setToken(null)
    setUser(null)
    setOrders([])
    setPointTransactions([])
    setMyCaptures([])
    setClaimedRewards([])
    setFoodCart([])
    setUnreadCount(0)
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
        setFieldDrops(DEFAULT_DEMO_DROPS)
        return
      }
      const json = await res.json()
      const items = Array.isArray(json.data) && json.data.length > 0 ? json.data : DEFAULT_DEMO_DROPS
      setFieldDrops(items)
    } catch {
      setFieldDrops(DEFAULT_DEMO_DROPS)
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

  const addBonusPoints = useCallback(async (amount: number, description: string) => {
    setUser((prev) => (prev ? { ...prev, pointsBalance: prev.pointsBalance + amount } : null))
    setPointTransactions((prev) => [
      {
        id: `pt-${Date.now()}`,
        amount,
        type: "Earn",
        description,
        createdDate: new Date().toISOString(),
      },
      ...prev,
    ])
    showToast(`Tebrikler! ${description} (+${amount} GP)`)

    if (token) {
      try {
        const res = await fetchWithAuth(`${API_BASE_URL}/points/earn`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount, description, referenceType: "MedyaWatch" }),
        })
        if (res.ok) {
          const data = await res.json()
          if (data.success && typeof data.data === "number") {
            setUser((prev) => (prev ? { ...prev, pointsBalance: data.data } : null))
          }
        }
      } catch {
        /* fallback to local state */
      }
    }
  }, [token, fetchWithAuth, showToast])

  const updateProfileState = useCallback(async (firstName: string, lastName: string) => {
    setUser((prev) => (prev ? { ...prev, firstName, lastName } : null))

    if (token) {
      try {
        const res = await fetchWithAuth(`${API_BASE_URL}/users/profile`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ firstName, lastName }),
        })
        if (res.ok) {
          const data = await res.json()
          if (data.success) {
            showToast(data.message || "Profil bilgileriniz veritabanında başarıyla güncellendi.")
            return
          }
        }
      } catch {
        /* fallback */
      }
    }
    showToast("Profil bilgileriniz başarıyla güncellendi.")
  }, [token, fetchWithAuth, showToast])

  const changePassword = useCallback(async (oldPassword: string, newPassword: string): Promise<boolean> => {
    if (!token) {
      showToast("Şifre değiştirmek için giriş yapmalısınız.")
      return false
    }
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/users/change-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
      })
      const data = await res.json()
      if (data.success) {
        showToast(data.message || "Şifreniz başarıyla değiştirildi.")
        return true
      }
      showToast(data.message || "Şifre değiştirilemedi. Mevcut şifrenizi kontrol ediniz.")
      return false
    } catch {
      showToast("Sunucu ile bağlantı kurulamadı.")
      return false
    }
  }, [token, fetchWithAuth, showToast])

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
        cafesLoadState,
        publicSettings,
        foodCart,
        selectedBranch,
        addToFoodCart,
        updateFoodCartQuantity,
        updateFoodCartCustomization,
        removeFromFoodCart,
        clearFoodCart,
        setSelectedBranch,
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
        captureFieldDrop,
        unreadCount,
        favorites,
        toggleFavorite,
        savedConfigurations,
        saveCustomConfiguration,
        refreshUnreadCount,
        addBonusPoints,
        updateProfileState,
        changePassword,
      }}
    >
      {children}
    </GolboxContext.Provider>
  )
}

