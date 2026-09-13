"use client"

import React, { useState } from "react"
import { useGolbox } from "@/lib/golbox-context"
import { LogIn, UserPlus, ShieldCheck } from "lucide-react"

export function LoginScreen({
  onClose,
  closeLabel = "Geri",
}: {
  onClose?: () => void
  closeLabel?: string
}) {
  const { login, register, loading } = useGolbox()
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [age, setAge] = useState<number | "">("")
  const [educationLevel, setEducationLevel] = useState("Diğer")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isRegister) {
      const success = await register({
        email,
        password,
        firstName,
        lastName,
        age: age !== "" ? Number(age) : null,
        educationLevel
      })
      if (success) {
        setIsRegister(false)
      }
    } else {
      await login(email, password)
    }
  }

  return (
    <div className="gol-fade-up gol-screen flex h-full flex-col justify-center px-6">
      <div className="flex flex-col items-center mb-8">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
          <ShieldCheck className="size-8" strokeWidth={2} />
        </div>
        <h2 className="font-serif text-2xl text-foreground">Şehitkamil+</h2>
        <p className="mt-1.5 text-center text-xs text-muted-foreground px-4">
          Şehitkamil Belediyesi vatandaş uygulaması.
        </p>
        {onClose && (
          <button type="button" onClick={onClose} className="mt-3 text-sm font-medium text-primary">
            {closeLabel}
          </button>
        )}
      </div>

      <div className="mb-4">
        <button
          type="button"
          onClick={() => {
            setEmail("user@golbox.com")
            setPassword("User123!")
          }}
          className="w-full rounded-2xl border border-primary/20 bg-secondary p-2.5 text-xs font-semibold text-primary transition-colors"
        >
          Vatandaş girişi (user@golbox.com)
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isRegister && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Ad</label>
                <input
                  type="text"
                  required
                  className="mt-1 w-full rounded-2xl border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Ahmet"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Soyad</label>
                <input
                  type="text"
                  required
                  className="mt-1 w-full rounded-2xl border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Kaya"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Yaşınız</label>
                <input
                  type="number"
                  required
                  min={1}
                  className="mt-1 w-full rounded-2xl border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary"
                  value={age}
                  onChange={(e) => setAge(e.target.value !== "" ? Number(e.target.value) : "")}
                  placeholder="16"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Eğitim</label>
                <select
                  className="mt-1 w-full rounded-2xl border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary"
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                  style={{ height: "42px" }}
                >
                  <option value="Diğer">Diğer / Çalışan</option>
                  <option value="Lise">Lise Öğrencisi</option>
                  <option value="Üniversite">Üniversite Öğrencisi</option>
                </select>
              </div>
            </div>
          </>
        )}

        <div>
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">E-Posta Adresi</label>
          <input
            type="email"
            required
            className="mt-1 w-full rounded-2xl border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@golbox.com"
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Şifre</label>
          <input
            type="password"
            required
            className="mt-1 w-full rounded-2xl border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? (
            <span>İşlem yapılıyor...</span>
          ) : isRegister ? (
            <>
              <UserPlus className="size-4" />
              <span>Hesap Oluştur</span>
            </>
          ) : (
            <>
              <LogIn className="size-4" />
              <span>Giriş Yap</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={() => setIsRegister(!isRegister)}
          className="text-xs font-semibold text-primary hover:underline"
        >
          {isRegister ? "Zaten bir hesabınız var mı? Giriş Yapın" : "Hesabınız yok mu? Yeni Hesap Oluşturun"}
        </button>
      </div>
    </div>
  )
}
