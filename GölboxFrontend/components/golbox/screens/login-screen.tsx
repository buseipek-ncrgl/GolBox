"use client"

import React, { useState } from "react"
import { useGolbox } from "@/lib/golbox-context"
import { LogIn, UserPlus } from "lucide-react"

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
        educationLevel,
      })
      if (success) {
        setIsRegister(false)
      }
    } else {
      await login(email, password)
    }
  }

  const fieldClass =
    "mt-1.5 min-h-11 w-full rounded-[14px] border border-border bg-card px-3.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"

  return (
    <div className="gol-fade-up gol-screen flex h-full flex-col justify-center px-6">
      <div className="mb-8 flex flex-col items-center">
        <span
          aria-hidden
          className="mb-3 flex size-12 items-center justify-center rounded-[14px] bg-primary font-serif text-xl text-primary-foreground"
        >
          +
        </span>
        <h1 className="font-serif text-[1.75rem] leading-none text-foreground">Şehitkamil+</h1>
        <p className="mt-2 max-w-[16rem] text-center text-[13px] leading-relaxed text-muted-foreground">
          Şehitkamil Belediyesi vatandaş uygulaması
        </p>
        {onClose ? (
          <button type="button" onClick={onClose} className="mt-3 min-h-11 text-sm font-semibold text-primary">
            {closeLabel}
          </button>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isRegister ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] font-medium text-foreground">Ad</label>
                <input
                  type="text"
                  required
                  autoComplete="given-name"
                  className={fieldClass}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[12px] font-medium text-foreground">Soyad</label>
                <input
                  type="text"
                  required
                  autoComplete="family-name"
                  className={fieldClass}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] font-medium text-foreground">Yaş</label>
                <input
                  type="number"
                  required
                  min={1}
                  className={fieldClass}
                  value={age}
                  onChange={(e) => setAge(e.target.value !== "" ? Number(e.target.value) : "")}
                />
              </div>
              <div>
                <label className="text-[12px] font-medium text-foreground">Eğitim</label>
                <select
                  className={fieldClass}
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                >
                  <option value="Diğer">Diğer / Çalışan</option>
                  <option value="Lise">Lise Öğrencisi</option>
                  <option value="Üniversite">Üniversite Öğrencisi</option>
                </select>
              </div>
            </div>
          </>
        ) : null}

        <div>
          <label className="text-[12px] font-medium text-foreground">E-posta</label>
          <input
            type="email"
            required
            autoComplete="email"
            className={fieldClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ornek@eposta.com"
          />
        </div>

        <div>
          <label className="text-[12px] font-medium text-foreground">Şifre</label>
          <input
            type="password"
            required
            autoComplete={isRegister ? "new-password" : "current-password"}
            className={fieldClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {loading ? (
            <span>İşlem yapılıyor...</span>
          ) : isRegister ? (
            <>
              <UserPlus className="size-4" />
              Hesap oluştur
            </>
          ) : (
            <>
              <LogIn className="size-4" />
              Giriş yap
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-[13px] text-muted-foreground">
        {isRegister ? "Zaten hesabın var mı?" : "Hesabın yok mu?"}{" "}
        <button
          type="button"
          onClick={() => setIsRegister(!isRegister)}
          className="min-h-11 font-semibold text-primary"
        >
          {isRegister ? "Giriş yap" : "Yeni hesap oluştur"}
        </button>
      </p>

      {process.env.NODE_ENV === "development" ? (
        <button
          type="button"
          onClick={() => {
            setEmail("user@golbox.com")
            setPassword("User123!")
            setIsRegister(false)
          }}
          className="mt-4 min-h-11 w-full text-center text-[11px] text-muted-foreground"
        >
          Geliştirici: test hesabını doldur
        </button>
      ) : null}
    </div>
  )
}
