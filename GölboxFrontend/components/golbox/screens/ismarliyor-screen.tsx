"use client"

import { useState } from "react"
import { Check, Clock, Coffee, Plus, Upload, X, ShieldCheck, Sparkles } from "lucide-react"
import type { TabId } from "@/lib/golbox-data"
import { useGolbox } from "@/lib/golbox-context"

export function IsmarliyorScreen({ onNavigate }: { onNavigate: (tab: TabId) => void }) {
  const { orders, cafes, createOrder, uploadFile } = useGolbox()

  // Modal State for New Ismarlıyor Order
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedCafeId, setSelectedCafeId] = useState("")
  const [selectedItemId, setSelectedItemId] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [paidWithPoints, setPaidWithPoints] = useState(false)
  const [proofImageUrl, setProofImageUrl] = useState("")
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  // Filter active orders
  const activeOrders = orders.filter(o => o.status !== "Completed" && o.status !== "Cancelled")

  // Selected Cafe's Menu Items
  const currentCafe = cafes.find(c => c.id === selectedCafeId) || cafes[0]

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadFile(file)
      if (url) {
        setProofImageUrl(url)
        setStatusMessage("Fiş/Görsel başarıyla yüklendi!")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    const cafeId = selectedCafeId || (cafes[0]?.id ?? "")
    const menuItemId = selectedItemId || (currentCafe?.menuItems?.[0]?.id ?? "")

    if (!cafeId || !menuItemId) {
      setStatusMessage("Lütfen bir tesis ve ürün seçin.")
      return
    }

    setSubmitting(true)
    try {
      const ok = await createOrder(cafeId, menuItemId, quantity, paidWithPoints, proofImageUrl || undefined)
      if (ok) {
        setStatusMessage("✨ Ismarlıyor ön siparişiniz başarıyla oluşturuldu!")
        setShowCreateModal(false)
        setProofImageUrl("")
        setQuantity(1)
      } else {
        setStatusMessage("Sipariş oluşturulamadı.")
      }
    } catch (err: any) {
      setStatusMessage(err.message || "Hata oluştu.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="gol-fade-up space-y-5 px-5 pb-6 pt-3">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-foreground">Ismarlıyor</h1>
          <p className="text-xs text-muted-foreground">Seni bekleyen ikram ön siparişlerin.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-md transition-transform active:scale-95"
        >
          <Plus className="size-4" />
          <span>Sipariş Ver</span>
        </button>
      </header>

      {statusMessage && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600 font-semibold">
          {statusMessage}
        </div>
      )}

      {activeOrders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border bg-card px-6 py-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
            <Coffee className="size-6" />
          </div>
          <p className="text-sm text-muted-foreground">
            Şu an bekleyen aktif bir ön siparişiniz yok.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-1 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-md"
          >
            + Hemen Ismarlıyor Siparişi Ver
          </button>
        </div>
      ) : (
        <ul className="space-y-4">
          {activeOrders.map((order) => (
            <li
              key={order.id}
              className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm"
            >
              <div className="flex items-center gap-2 border-b border-border bg-secondary/50 px-4 py-3">
                <span
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    order.status === "Ready"
                      ? "bg-emerald-600 text-white"
                      : order.status === "Preparing"
                      ? "bg-amber-500 text-white"
                      : "bg-gray-500 text-white"
                  }`}
                >
                  {order.status === "Ready" ? (
                    <>
                      <Check className="size-3.5" /> Hazır
                    </>
                  ) : order.status === "Preparing" ? (
                    <>
                      <Clock className="size-3.5" /> Hazırlanıyor
                    </>
                  ) : (
                    <>
                      <Clock className="size-3.5" /> Onay Bekliyor
                    </>
                  )}
                </span>
                <span className="ml-auto text-xs font-bold text-primary">{order.collectionCode}</span>
              </div>
              <div className="space-y-3 p-4">
                <p className="text-xs text-muted-foreground">Şube: <strong className="text-foreground">{order.cafeName}</strong></p>
                <ul className="flex flex-wrap gap-2">
                  {order.items.map((it) => (
                    <li
                      key={it.id}
                      className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground"
                    >
                      {it.menuItemName} x{it.quantity}
                    </li>
                  ))}
                </ul>
                
                {order.imageUrl && (
                  <div className="mt-2">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase block mb-1">Yüklenen Fiş Görseli</span>
                    <img src={order.imageUrl} alt="fiş" style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '12px' }} />
                  </div>
                )}

                <button
                  onClick={() => onNavigate("qr")}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-xs font-semibold text-primary-foreground shadow-sm"
                >
                  Kasada Göstermek İçin QR Aç
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* NEW ISMARLIYOR ORDER MODAL SHEET */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs p-0 sm:items-center">
          <form
            onSubmit={handleSubmitOrder}
            className="w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Sparkles className="size-4" />
                </div>
                <h3 className="font-serif text-lg font-bold text-foreground">Yeni Ismarlıyor Siparişi</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-full p-1 text-muted-foreground hover:bg-secondary"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">Tesis / Kafe Seçin</label>
              <select
                value={selectedCafeId}
                onChange={(e) => setSelectedCafeId(e.target.value)}
                className="w-full rounded-2xl border border-border bg-background p-3 text-xs font-medium text-foreground outline-none"
              >
                {cafes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">İkram / Ürün Seçin</label>
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full rounded-2xl border border-border bg-background p-3 text-xs font-medium text-foreground outline-none"
              >
                {(currentCafe?.menuItems || []).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} - {m.price} TL {m.requiredEducation ? `(${m.requiredEducation})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">Adet</label>
                <input
                  type="number"
                  min={1}
                  max={2}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full rounded-2xl border border-border bg-background p-3 text-xs font-medium text-foreground outline-none"
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="ptsCheck"
                  checked={paidWithPoints}
                  onChange={(e) => setPaidWithPoints(e.target.checked)}
                  className="size-4 rounded accent-primary"
                />
                <label htmlFor="ptsCheck" className="text-xs font-bold text-foreground cursor-pointer">
                  GölPuan Kullan
                </label>
              </div>
            </div>

            {/* Proof Image Upload */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">Fiş / Görsel Kanıtı (Opsiyonel)</label>
              <div className="flex items-center gap-2">
                <label className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-secondary/40 p-3 text-xs font-semibold text-primary cursor-pointer hover:bg-secondary">
                  <Upload className="size-4" />
                  <span>{uploading ? "Yükleniyor..." : proofImageUrl ? "Kanıt Yüklendi ✓" : "Fiş Yükle"}</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-2xl bg-secondary/50 p-3 text-[11px] text-muted-foreground">
              <ShieldCheck className="size-4 shrink-0 text-emerald-600" />
              <span>Günlük max 2 ön sipariş kısıtlaması sistem tarafından uygulanmaktadır.</span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-primary py-3 text-xs font-bold text-primary-foreground shadow-md"
            >
              {submitting ? "Gönderiliyor..." : "Siparişi Onaya Gönder"}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
