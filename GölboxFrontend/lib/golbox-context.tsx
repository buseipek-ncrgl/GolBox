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
  pointTransactions: PointTransaction[]
  fieldDrops: FieldDropNearby[]
  myCaptures: FieldDropCapture[]
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  register: (data: any) => Promise<boolean>
  createOrder: (cafeId: string, menuItemId: string, quantity: number, paidWithPoints: boolean, imageUrl?: string) => Promise<boolean>
  claimReward: (rewardId: string) => Promise<boolean>
  uploadFile: (file: File) => Promise<string | null>
  refreshData: () => Promise<void>
  loadNearbyFieldDrops: (latitude: number, longitude: number) => Promise<void>
  loadMyCaptures: () => Promise<void>
  captureFieldDrop: (id: string, latitude: number, longitude: number) => Promise<boolean>
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
  const [pointTransactions, setPointTransactions] = useState<PointTransaction[]>([])
  const [fieldDrops, setFieldDrops] = useState<FieldDropNearby[]>([])
  const [myCaptures, setMyCaptures] = useState<FieldDropCapture[]>([])
  const [loading, setLoading] = useState(false)
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
    try {
      // 1. Fetch profile if token exists
      if (token) {
        const profileRes = await fetch(`${API_BASE_URL}/users/me`, { headers: authHeader })
        if (profileRes.ok) {
          const res = await profileRes.json()
          if (res.data) setUser(res.data)
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

      // 4. Fetch rewards
      const rewardsRes = await fetch(`${API_BASE_URL}/rewards`, { headers: authHeader })
      const defaultRewards: Reward[] = [
        { id: 'rew-1', title: '☕ Ücretsiz Filtre Kahve', description: 'Şehitkamil Kitap Kafelerde geçerli sıcak taze filtre kahve ikramı.', requiredPoints: 50, status: 'Active' },
        { id: 'rew-2', title: '🍰 Günün Dilim Pastası', description: 'Kitap Kafe günlük taze dilim pasta veya cheesecake ikramı.', requiredPoints: 100, status: 'Active' },
        { id: 'rew-3', title: '🥐 Sıcak Kruvasan & Taze Çay', description: 'Taze fırınlanmış kruvasan ve sınırsız demli çay ikramı.', requiredPoints: 75, status: 'Active' },
        { id: 'rew-4', title: '📚 %50 Kitap Satın Alma İndirim Kuponu', description: 'Gençlik Merkezleri ve Kitap Kafe kütüphanelerinde %50 indirim.', requiredPoints: 120, status: 'Active' }
      ]

      if (rewardsRes.ok) {
        const res = await rewardsRes.json()
        const items = res.data?.items || res.data || []
        setRewards(items.length > 0 ? items : defaultRewards)
      } else {
        setRewards(defaultRewards)
      }

      // 5. Fetch point transactions if token exists
      if (token) {
        const pointsRes = await fetch(`${API_BASE_URL}/points`, { headers: authHeader })
        if (pointsRes.ok) {
          const res = await pointsRes.json()
          const items = res.data?.items || res.data || []
          setPointTransactions(items)
        }

        const mineRes = await fetch(`${API_BASE_URL}/field-drops/mine`, { headers: authHeader })
        if (mineRes.ok) {
          const mineJson = await mineRes.json()
          setMyCaptures(Array.isArray(mineJson.data) ? mineJson.data : [])
        }
      }

    } catch (e) {
      console.error("Failed to load user session data", e)
    }
  }, [token])

  useEffect(() => {
    if (token) {
      refreshData()
    } else {
      setUser(null)
      setCafes([])
      setOrders([])
      setRewards([])
      setPointTransactions([])
      setFieldDrops([])
      setMyCaptures([])
    }
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
      showToast(`🔔 ${notification.collectionCode} kodlu siparişinizin durumu: '${notification.status}' olarak güncellendi!`)
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
        showToast("📷 Görsel sunucuya yüklendi!")
        return data.data.url
      } else {
        showToast(`❌ Görsel yüklenemedi: ${data.message || "Bilinmeyen hata"}`)
      }
    } catch (e) {
      showToast("❌ Görsel yükleme bağlantı hatası.")
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
        showToast(`✨ Hoş geldiniz, ${data.data.user.firstName}!`)
        setLoading(false)
        return true
      } else {
        showToast(`❌ ${data.message || "Giriş başarısız."}`)
      }
    } catch (e) {
      showToast("❌ Sunucu bağlantı hatası.")
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
        showToast("✨ Kayıt başarılı! Giriş yapabilirsiniz.")
        setLoading(false)
        return true
      } else {
        showToast(`❌ ${resData.message || "Kayıt başarısız."}`)
      }
    } catch (e) {
      showToast("❌ Sunucu bağlantı hatası.")
    }
    setLoading(false)
    return false
  }

  const logout = () => {
    localStorage.removeItem("mob_token")
    setToken(null)
    setUser(null)
    showToast("🔓 Oturum kapatıldı.")
  }

  const createOrder = async (
    cafeId: string,
    menuItemId: string,
    quantity: number,
    paidWithPoints: boolean,
    imageUrl?: string
  ) => {
    if (!user) return false
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
        showToast("✨ Ön siparişiniz alındı!")
        await refreshData()
        setLoading(false)
        return true
      } else {
        showToast(`❌ ${data.message || "Sipariş oluşturulamadı."}`)
      }
    } catch (e) {
      showToast("❌ Sipariş gönderilemedi.")
    }
    setLoading(false)
    return false
  }

  const claimReward = async (rewardId: string) => {
    if (!token) return false
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
        showToast("🎉 İkram kuponu başarıyla alındı!")
        await refreshData()
        setLoading(false)
        return true
      } else {
        showToast(`❌ ${data.message || "Ödül alınamadı."}`)
      }
    } catch (e) {
      showToast("❌ Ödül talebi gönderilemedi.")
    }
    setLoading(false)
    return false
  }

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
      setMyCaptures(Array.isArray(json.data) ? json.data : [])
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
        pointTransactions,
        fieldDrops,
        myCaptures,
        loading,
        login,
        logout,
        register,
        createOrder,
        claimReward,
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
