"use client"

import React, { useState } from "react"
import { Check, MapPin, Plus, Sparkles, X, ShoppingBag, Upload, Image as ImageIcon } from "lucide-react"
import { useGolbox } from "@/lib/golbox-context"
import { useGolToast } from "@/components/golbox/gol-toast"

export function CafeDetailSheet({ cafeId, onClose }: { cafeId: string; onClose: () => void }) {
  const { cafes, createOrder, uploadFile, user } = useGolbox()
  const cafe = cafes.find((c) => c.id === cafeId)
  const notify = useGolToast()
  
  // Selected product state for checkout modal
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [payWithPoints, setPayWithPoints] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [uploading, setUploading] = useState(false)

  if (!cafe) return null

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const uploadedUrl = await uploadFile(file)
    if (uploadedUrl) {
      setImageUrl(uploadedUrl)
    }
    setUploading(false)
  }

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem) return

    const success = await createOrder(cafe.id, selectedItem.id, quantity, payWithPoints, imageUrl || undefined)
    if (success) {
      setSelectedItem(null)
      setQuantity(1)
      setImageUrl("")
      onClose()
    }
  }

  return (
    <div className="absolute inset-0 z-40">
      <button
        aria-label="Kapat"
        onClick={onClose}
        className="gol-fade absolute inset-0 bg-foreground/40 backdrop-blur-[2px]"
      />
      <div className="gol-sheet-up absolute inset-x-0 bottom-0 top-10 flex flex-col overflow-hidden rounded-t-[2rem] bg-background">
        
        {/* görsel başlık */}
        <div className="relative h-44 w-full shrink-0">
          <img
            src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500&auto=format&fit=crop&q=60"
            alt={`${cafe.name}`}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />
          <button
            onClick={onClose}
            aria-label="Kapat"
            className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-background/85 text-foreground backdrop-blur"
          >
            <X className="size-5" />
          </button>
          <div className="absolute inset-x-5 bottom-3">
            <p className="font-serif text-2xl text-foreground">{cafe.name}</p>
          </div>
        </div>

        <div className="no-scrollbar flex-1 space-y-6 overflow-y-auto px-5 pb-40 pt-5">
          {/* konum */}
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
              <MapPin className="size-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-card-foreground">{cafe.address}</p>
            </div>
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
              Açık · 22:00
            </span>
          </div>

          {/* Menü Bölümü */}
          <section className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Şube Menüsü</h3>
              <p className="text-xs text-muted-foreground">
                Kafeye ait sipariş edilebilir ikramlıklar ve ürünler.
              </p>
            </div>

            <ul className="overflow-hidden rounded-2xl border border-border bg-card">
              {cafe.menuItems && cafe.menuItems.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Bu kafeye ait menü ürünü bulunmuyor.
                </div>
              ) : (
                cafe.menuItems?.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-0"
                  >
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="size-10 rounded-xl object-cover"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-card-foreground">
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{item.price} TL</p>
                      {item.requiredEducation && (
                        <span style={{ fontSize: '10px' }} className="rounded-full bg-primary/10 text-primary px-1.5 py-0.5 font-bold">
                          🔒 {item.requiredEducation} ({item.minAge ?? 0}-{item.maxAge ?? '+'} Yaş)
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedItem(item)}
                      aria-label={`${item.name} sipariş et`}
                      className="flex size-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                    >
                      <Plus className="size-4" />
                    </button>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>

        {/* Sipariş/Ödeme Onay Modal */}
        {selectedItem && (
          <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-[1px]">
            <div className="gol-sheet-up w-full rounded-t-[2rem] bg-background p-6 space-y-4 max-h-[90%] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h4 className="font-serif text-lg font-bold text-foreground">Ön Sipariş Talebi</h4>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="flex size-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="p-3 bg-secondary/30 rounded-2xl flex items-center gap-3">
                {selectedItem.imageUrl && (
                  <img
                    src={selectedItem.imageUrl}
                    alt={selectedItem.name}
                    className="size-12 rounded-xl object-cover"
                  />
                )}
                <div>
                  <p className="text-sm font-semibold">{selectedItem.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedItem.price} TL</p>
                </div>
              </div>

              <form onSubmit={handleOrderSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Miktar</label>
                    <input
                      type="number"
                      required
                      min={1}
                      className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Ödeme Yöntemi</label>
                    <select
                      className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none"
                      value={payWithPoints ? "points" : "cash"}
                      onChange={(e) => setPayWithPoints(e.target.value === "points")}
                      style={{ height: '37px' }}
                    >
                      <option value="cash">Nakit / Kart ({selectedItem.price * quantity} TL)</option>
                      <option value="points" disabled={!user || user.pointsBalance < (selectedItem.price * quantity)}>
                        GölPuan ({selectedItem.price * quantity} GP)
                      </option>
                    </select>
                  </div>
                </div>

                {/* Dosya Yükleme / Fiş Yükleme */}
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Kanıt / Fiş Görsel Yükle</label>
                  <div className="mt-1 flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer rounded-xl bg-secondary px-3 py-2 text-xs font-semibold text-secondary-foreground hover:bg-secondary/80">
                      <Upload className="size-4" />
                      <span>{uploading ? "Yükleniyor..." : "Fotoğraf Seç"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                    </label>
                    {imageUrl && (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold truncate">
                        <ImageIcon className="size-4" />
                        <span className="truncate max-w-[150px]">Fiş Yüklendi</span>
                      </div>
                    )}
                  </div>
                  {imageUrl && (
                    <div className="mt-2 relative w-full h-24 rounded-xl overflow-hidden border border-border">
                      <img src={imageUrl} alt="Yüklenen Fiş" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                >
                  <ShoppingBag className="size-4" />
                  Siparişi Onayla
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
