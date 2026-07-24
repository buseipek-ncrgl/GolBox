"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useGolToast } from "@/components/golbox/gol-toast"
import * as signalR from "@microsoft/signalr"

const API_BASE_URL = "http://localhost:5150/api/v1"
const HUB_URL = "http://localhost:5150/hubs/orders"

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
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  register: (data: any) => Promise<boolean>
  createOrder: (cafeId: string, menuItemId: string, quantity: number, paidWithPoints: boolean, imageUrl?: string) => Promise<boolean>
  claimReward: (rewardId: string) => Promise<boolean>
  uploadFile: (file: File) => Promise<string | null>
  refreshData: () => Promise<void>
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
    if (!token) return
    try {
      // 1. Fetch profile
      const profileRes = await fetch(`${API_BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (profileRes.ok) {
        const res = await profileRes.json()
        setUser(res.data)
      }

      // 2. Fetch cafes
      const cafesRes = await fetch(`${API_BASE_URL}/cafes`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (cafesRes.ok) {
        const res = await cafesRes.json()
        const cafesList: Cafe[] = res.data || []

        // For each cafe, load menu items
        const enrichedCafes = await Promise.all(
          cafesList.map(async (c) => {
            const menuRes = await fetch(`${API_BASE_URL}/cafes/${c.id}/menu`, {
              headers: { Authorization: `Bearer ${token}` }
            })
            if (menuRes.ok) {
              const menuData = await menuRes.json()
              return { ...c, menuItems: menuData.data || [] }
            }
            return { ...c, menuItems: [] }
          })
        )
        setCafes(enrichedCafes)
      }

      // 3. Fetch user orders
      const ordersRes = await fetch(`${API_BASE_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (ordersRes.ok) {
        const res = await ordersRes.json()
        setOrders(res.data || [])
      }

      // 4. Fetch rewards
      const rewardsRes = await fetch(`${API_BASE_URL}/rewards`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (rewardsRes.ok) {
        const res = await rewardsRes.json()
        const items = res.data?.items || res.data || []
        setRewards(items)
      }

      // 5. Fetch point transactions
      const pointsRes = await fetch(`${API_BASE_URL}/points`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (pointsRes.ok) {
        const res = await pointsRes.json()
        const items = res.data?.items || res.data || []
        setPointTransactions(items)
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

  return (
    <GolboxContext.Provider
      value={{
        token,
        user,
        cafes,
        orders,
        rewards,
        pointTransactions,
        loading,
        login,
        logout,
        register,
        createOrder,
        claimReward,
        uploadFile,
        refreshData
      }}
    >
      {children}
    </GolboxContext.Provider>
  )
}
