"use client"

import React, { useId, useState } from "react"
import { Coffee, Smartphone, Eye, EyeOff, AlertCircle, ArrowRight, ArrowLeft, FileText, CheckCircle2 } from "lucide-react"
import { useGolbox } from "@/lib/golbox-context"
import { GolboxBrandLogo } from "@/components/golbox/golbox-brand-logo"

export function LoginScreen({
  onClose,
  closeLabel = "Geri",
  onReplaySplash,
}: {
  onClose?: () => void
  closeLabel?: string
  onReplaySplash?: () => void
}) {
  const { login, register, loading } = useGolbox()
  const [isRegister, setIsRegister] = useState(false)
  const [isOtpStep, setIsOtpStep] = useState(false)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [birthDate, setBirthDate] = useState("")
  
  const [kvkkAccepted, setKvkkAccepted] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [marketingConsent, setMarketingConsent] = useState(false)

  const [otpDigits, setOtpDigits] = useState(["1", "2", "3", "4", "5", "6"])
  const [otpTimer, setOtpTimer] = useState(30)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showLegalModal, setShowLegalModal] = useState<"kvkk" | "terms" | null>(null)

  const formId = useId()

  const handlePhoneFormat = (text: string) => {
    let cleaned = text.replace(/\D/g, "")
    if (cleaned.startsWith("90")) cleaned = cleaned.substring(2)
    if (cleaned.startsWith("0")) cleaned = cleaned.substring(1)
    if (cleaned.length > 10) cleaned = cleaned.substring(0, 10)

    let formatted = "+90 "
    if (cleaned.length > 0) formatted += cleaned.substring(0, 3)
    if (cleaned.length >= 4) formatted += " " + cleaned.substring(3, 6)
    if (cleaned.length >= 7) formatted += " " + cleaned.substring(6, 8)
    if (cleaned.length >= 9) formatted += " " + cleaned.substring(8, 10)

    setPhone(formatted)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (isRegister) {
      if (!firstName || !lastName || !phone || !email || !password) {
        setErrorMessage("Lütfen zorunlu alanların tümünü doldurun.")
        return
      }
      if (!kvkkAccepted || !termsAccepted) {
        setErrorMessage("Devam etmek için KVKK ve Kullanıcı Sözleşmesi metinlerini onaylamalısınız.")
        return
      }
      setIsOtpStep(true)
    } else {
      const ok = await login(email, password)
      if (!ok) {
        setErrorMessage("Telefon numarası/e-posta veya şifre hatalı.")
      }
    }
  }

  const handleVerifyOtp = async () => {
    const code = otpDigits.join("")
    if (code.length < 6) {
      setErrorMessage("Lütfen 6 haneli doğrulama kodunu eksiksiz girin.")
      return
    }
    const success = await register({
      email,
      password,
      firstName,
      lastName,
      phoneNumber: phone,
      birthDate,
      kvkkAccepted,
      marketingConsent,
    })
    if (success) {
      setIsOtpStep(false)
      setIsRegister(false)
    }
  }

  const fieldClass =
    "mt-1.5 min-h-12 w-full rounded-[16px] border border-border bg-card px-3.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"

  if (isOtpStep) {
    return (
      <div className="gol-fade-up gol-screen flex h-full flex-col justify-center px-4 py-8">
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
            <Smartphone className="size-7" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Telefonunu Doğrula</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{phone || "+90 532 555 12 34"}</span> numarasına gönderdiğimiz 6 haneli kodu gir.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 flex items-center justify-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-semibold text-destructive text-center">
            <AlertCircle className="size-4 shrink-0" /> {errorMessage}
          </div>
        )}

        <div className="mb-6 flex justify-center gap-2">
          {otpDigits.map((digit, idx) => (
            <input
              key={idx}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => {
                const newArr = [...otpDigits]
                newArr[idx] = e.target.value
                setOtpDigits(newArr)
              }}
              className="size-12 rounded-xl border border-border bg-card text-center text-xl font-bold text-foreground outline-none focus:border-primary"
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleVerifyOtp}
          disabled={loading}
          className="flex min-h-12 w-full items-center justify-center gap-1.5 rounded-[16px] bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {loading ? "Doğrulanıyor..." : "Doğrula ve Başla"}
          <ArrowRight className="size-4" />
        </button>

        <button
          type="button"
          onClick={() => setIsOtpStep(false)}
          className="mt-4 flex items-center justify-center gap-1 min-h-11 w-full text-center text-xs font-medium text-muted-foreground"
        >
          <ArrowLeft className="size-4" /> Geri Dön
        </button>
      </div>
    )
  }

  return (
    <div className="gol-fade-up gol-screen flex h-full flex-col justify-start pt-6 px-2">
      <div className="mb-6 flex flex-col items-center text-center">
        <button
          type="button"
          onClick={onReplaySplash}
          title="Açılış ekranını (Splash) önizle"
          className="group cursor-pointer"
        >
          <GolboxBrandLogo size={90} className="mb-3 transition-transform group-hover:scale-105" />
        </button>
        <h1 className="font-serif text-[1.85rem] font-bold text-foreground">GölBOX'a Hoş Geldin</h1>
        <p className="mt-1 max-w-[18rem] text-xs font-medium text-emerald-700 dark:text-emerald-400 italic">
          "Kahveni seç, GölPuan kazan, sıra beklemeden Gel-Al."
        </p>
        {onReplaySplash && (
          <button
            type="button"
            onClick={onReplaySplash}
            className="mt-2.5 inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 px-3 py-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 transition cursor-pointer"
          >
            ✨ Açılış Ekranını (Splash) Önizle
          </button>
        )}
        {onClose ? (
          <button type="button" onClick={onClose} className="mt-2 text-xs font-semibold text-primary">
            {closeLabel}
          </button>
        ) : null}
      </div>

      {errorMessage && (
        <div className="mb-4 flex items-center justify-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-semibold text-destructive text-center">
          <AlertCircle className="size-4 shrink-0" /> {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {isRegister ? (
          <>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label htmlFor={`${formId}-first`} className="text-[12px] font-semibold text-foreground">
                  Ad *
                </label>
                <input
                  id={`${formId}-first`}
                  type="text"
                  required
                  placeholder="Ahmet"
                  className={fieldClass}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor={`${formId}-last`} className="text-[12px] font-semibold text-foreground">
                  Soyad *
                </label>
                <input
                  id={`${formId}-last`}
                  type="text"
                  required
                  placeholder="Yılmaz"
                  className={fieldClass}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor={`${formId}-phone`} className="text-[12px] font-semibold text-foreground">
                Telefon Numarası *
              </label>
              <input
                id={`${formId}-phone`}
                type="tel"
                required
                placeholder="+90 5XX XXX XX XX"
                className={fieldClass}
                value={phone}
                onChange={(e) => handlePhoneFormat(e.target.value)}
              />
            </div>
          </>
        ) : null}

        <div>
          <label htmlFor={`${formId}-email`} className="text-[12px] font-semibold text-foreground">
            {isRegister ? "E-posta Adresi *" : "Telefon Numarası veya E-posta *"}
          </label>
          <input
            id={`${formId}-email`}
            type="text"
            required
            className={fieldClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={isRegister ? "ornek@domain.com" : "05XX XXX XX XX veya e-posta"}
          />
        </div>

        {isRegister && (
          <div>
            <label htmlFor={`${formId}-birth`} className="text-[12px] font-semibold text-foreground">
              Doğum Tarihi (GG/AA/YYYY)
            </label>
            <input
              id={`${formId}-birth`}
              type="text"
              placeholder="14/05/1998"
              className={fieldClass}
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>
        )}

        <div>
          <label htmlFor={`${formId}-password`} className="text-[12px] font-semibold text-foreground">
            Şifre *
          </label>
          <div className="relative">
            <input
              id={`${formId}-password`}
              type={showPassword ? "text" : "password"}
              required
              className={fieldClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        {isRegister && (
          <div className="space-y-2 pt-1 text-xs text-muted-foreground">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={kvkkAccepted}
                onChange={(e) => setKvkkAccepted(e.target.checked)}
                className="mt-0.5 size-4 rounded border-border text-primary focus:ring-primary"
              />
              <span>
                <button type="button" onClick={() => setShowLegalModal("kvkk")} className="font-semibold underline text-primary">
                  KVKK Aydınlatma Metni
                </button>'ni okudum ve kabul ediyorum. *
              </span>
            </label>

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 size-4 rounded border-border text-primary focus:ring-primary"
              />
              <span>
                <button type="button" onClick={() => setShowLegalModal("terms")} className="font-semibold underline text-primary">
                  Kullanıcı Sözleşmesi
                </button> ve Gizlilik Politikası'nı kabul ediyorum. *
              </span>
            </label>

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={marketingConsent}
                onChange={(e) => setMarketingConsent(e.target.checked)}
                className="mt-0.5 size-4 rounded border-border text-primary focus:ring-primary"
              />
              <span>Kampanyalardan SMS/E-posta ile haberdar olmak istiyorum (Opsiyonel).</span>
            </label>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex min-h-12 w-full items-center justify-center gap-1.5 rounded-[16px] bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50 shadow-md"
        >
          {loading ? "İşlem yapılıyor..." : isRegister ? "Kayıt Ol ve Kodu Gönder" : "Giriş Yap"}
          <ArrowRight className="size-4" />
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        {isRegister ? "Zaten hesabın var mı?" : "Hesabın yok mu?"}{" "}
        <button
          type="button"
          onClick={() => {
            setIsRegister(!isRegister)
            setErrorMessage(null)
          }}
          className="font-bold text-primary underline"
        >
          {isRegister ? "Giriş Yap" : "Yeni Hesap Oluştur"}
        </button>
      </p>

      {/* LEGAL TEXT MODAL */}
      {showLegalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-2xl bg-card p-6 shadow-xl border border-border">
            <h3 className="flex items-center gap-2 text-lg font-bold text-foreground mb-3">
              <FileText className="size-5 text-emerald-600" />
              {showLegalModal === "kvkk" ? "KVKK Aydınlatma Metni" : "Kullanıcı Sözleşmesi"}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {showLegalModal === "kvkk"
                ? "Gaziantep Şehitkamil Belediyesi GölBOX uygulaması kapsamında kişisel verileriniz 6698 sayılı KVKK maddelerine uygun olarak işlenmektedir. Telefon numaranız ve e-posta adresiniz sadakat puanı ve Gel-Al teslim süreçlerinde kullanılmaktadır."
                : "GölBOX üzerinden oluşturulan Gel-Al siparişleri seçilen şubede 15 dakika içerisinde taze hazırlanmaktadır. İptal ve iade koşulları ürün hazırlanmaya başlamadan önce geçerlidir."}
            </p>
            <button
              type="button"
              onClick={() => setShowLegalModal(null)}
              className="mt-4 min-h-10 w-full rounded-xl bg-primary text-xs font-semibold text-primary-foreground"
            >
              Anladım
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
