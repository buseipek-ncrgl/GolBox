"use client"

import { useEffect, useState } from "react"
import { Screen } from "@/components/golbox/screen"
import { 
  FileText, 
  GraduationCap, 
  HeartHandshake, 
  Flame, 
  ShoppingBag, 
  Trophy, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  XCircle, 
  ChevronRight, 
  X,
  Send,
  Upload,
  Calendar,
  UserCheck,
  Trash2,
  Edit3
} from "lucide-react"
import { useGolbox } from "@/lib/golbox-context"
import { API_BASE_URL } from "@/lib/api-config"

export interface SupportType {
  id: string
  title: string
  description: string
  category: string
  icon: typeof FileText
  minAge?: number
  maxAge?: number
  requiredEducation?: string
  deadline: string
  documentsNeeded: string[]
}

export interface UserApplication {
  id: string
  applicationTypeId: string
  title: string
  category: string
  status: "Draft" | "Submitted" | "UnderReview" | "DocumentRequested" | "Approved" | "Rejected" | "Completed"
  submittedAt: string
  adminNote?: string
  documentsUrl?: string
  documentName?: string
  applicantNote?: string
}

const DEFAULT_SUPPORT_TYPES: SupportType[] = [
  {
    id: "sup-sosyal",
    title: "Genel Sosyal Yardım Desteği",
    description: "Şehitkamil ilçe sınırları içerisinde yaşayan dar gelirli ailelere nakdi ve ayni sosyal yardım.",
    category: "Sosyal Yardım",
    icon: HeartHandshake,
    minAge: 18,
    deadline: "31 Aralık 2026",
    documentsNeeded: ["T.C. Kimlik Fotokopisi / Beyanı", "İkametgah Belgesi (e-Devlet Barkodlu)", "Gelir Belgesi / Maaş Bordrosu"],
  },
  {
    id: "sup-gida",
    title: "Gıda Desteği ve İkram Kartı",
    description: "Düzenli gıda paketi ve belediye anlaşmalı ikram yerlerinde geçerli alışveriş kuponu desteği.",
    category: "Gıda Desteği",
    icon: ShoppingBag,
    deadline: "15 Kasım 2026",
    documentsNeeded: ["T.C. Kimlik Fotokopisi / Beyanı", "Aile Nüfus Kayıt Örneği"],
  },
  {
    id: "sup-egitim",
    title: "Üniversite ve Gençlik Burs Desteği",
    description: "Lisans ve önlisans eğitimine devam eden genç sporsever ve başarılı öğrencilere burs yardımı.",
    category: "Öğrenci Desteği",
    icon: GraduationCap,
    minAge: 18,
    maxAge: 25,
    requiredEducation: "Üniversite",
    deadline: "30 Ekim 2026",
    documentsNeeded: ["Öğrenci Belgesi (e-Devlet / Transkript)", "İkametgah Belgesi (e-Devlet Barkodlu)", "Banka İBAN / Hesap Dekontu"],
  },
  {
    id: "sup-yakacak",
    title: "Kış Dönemi Yakacak Desteği",
    description: "Soğuk kış aylarında ihtiyaç sahibi hanelere katı yakacak ve odun/kömür yardımı.",
    category: "Yakacak Desteği",
    icon: Flame,
    deadline: "20 Kasım 2026",
    documentsNeeded: ["Fatura / İkametgah Teyit Belgesi", "Gelir Belgesi / Maaş Bordrosu"],
  },
  {
    id: "sup-spor",
    title: "Spor Okulları ve Akademi Kaydı",
    description: "Alleben yüzme havuzları, futbol, basketbol ve tenis akademilerine ücretsiz kayıt desteği.",
    category: "Spor ve Kültür",
    icon: Trophy,
    minAge: 7,
    maxAge: 24,
    deadline: "Sürekli Açık",
    documentsNeeded: ["Sağlık Kurulu / Engelli Raporu", "Veli İzin Belgesi (18 Yaş Altı)"],
  },
]

const DEFAULT_USER_APPLICATIONS: UserApplication[] = [
  {
    id: "app-101",
    applicationTypeId: "sup-egitim",
    title: "Üniversite ve Gençlik Burs Desteği",
    category: "Öğrenci Desteği",
    status: "UnderReview",
    submittedAt: "22 Eylül 2026",
    adminNote: "Başvurunuz ön incelemeden geçti. Gelir belgeniz ve ikametgahınız kontrol ediliyor.",
    documentName: "Ogrenci_Belgesi_Ahmet_Yilmaz.pdf",
  },
  {
    id: "app-102",
    applicationTypeId: "sup-gida",
    title: "Gıda Desteği ve İkram Kartı",
    category: "Gıda Desteği",
    status: "DocumentRequested",
    submittedAt: "15 Eylül 2026",
    adminNote: "Lütfen güncel ikametgah belgenizi e-Devlet uzerinden indirip PDF olarak yukleyin.",
    documentName: "Kimlik_Fotokopisi.pdf",
  },
]

export function ApplicationsScreen({
  onNavigate,
}: {
  onNavigate?: (tab: any) => void
}) {
  const { user, token } = useGolbox()
  const [tab, setTab] = useState<"supports" | "my-applications">("supports")
  const [supportTypes, setSupportTypes] = useState<SupportType[]>(DEFAULT_SUPPORT_TYPES)
  const [selectedSupport, setSelectedSupport] = useState<SupportType | null>(null)
  const [myApps, setMyApps] = useState<UserApplication[]>(DEFAULT_USER_APPLICATIONS)
  const [applicantNote, setApplicantNote] = useState("")
  const [attachedFileName, setAttachedFileName] = useState("")
  const [submitting, setSubmitting] = useState(false)
  
  // Modals
  const [docUploadModalApp, setDocUploadModalApp] = useState<UserApplication | null>(null)
  const [editingApp, setEditingApp] = useState<UserApplication | null>(null)
  const [docFileText, setDocFileText] = useState("")

  // DYNAMICALLY LOAD ADMIN-CREATED PROGRAMS (Sync with Admin Panel)
  useEffect(() => {
    const loadAdminPrograms = async () => {
      try {
        let adminProgs: any[] = []
        const stored = localStorage.getItem("golbox_admin_programs")
        if (stored) {
          adminProgs = JSON.parse(stored)
        } else {
          const res = await fetch(`${API_BASE_URL}/applications/programs/admin`)
          if (res.ok) {
            adminProgs = await res.json()
          }
        }

        if (Array.isArray(adminProgs) && adminProgs.length > 0) {
          const today = new Date().toISOString().slice(0, 10)
          const activeOnly = adminProgs.filter((p: any) => p.isActive !== false && (!p.endDate || p.endDate >= today))

          if (activeOnly.length > 0) {
            const mapped: SupportType[] = activeOnly.map((p: any) => ({
              id: p.id || `prog-${Math.random()}`,
              title: p.title,
              description: p.description,
              category: p.category || "Sosyal Yardım",
              icon: p.category?.includes("Eğitim") ? GraduationCap : p.category?.includes("Sağlık") ? UserCheck : HeartHandshake,
              deadline: p.endDate ? p.endDate : "Sürekli Açık",
              documentsNeeded: Array.isArray(p.requiredDocuments) && p.requiredDocuments.length > 0
                ? p.requiredDocuments
                : ["T.C. Kimlik Fotokopisi / Beyanı", "İkametgah Belgesi (e-Devlet Barkodlu)"],
            }))

            setSupportTypes([...mapped, ...DEFAULT_SUPPORT_TYPES.filter(d => !mapped.some(m => m.id === d.id))])
          }
        }
      } catch (e) {}
    }

    void loadAdminPrograms()
  }, [])

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSupport) return
    setSubmitting(true)

    setTimeout(() => {
      const newApp: UserApplication = {
        id: `app-${Date.now()}`,
        applicationTypeId: selectedSupport.id,
        title: selectedSupport.title,
        category: selectedSupport.category,
        status: "Submitted",
        submittedAt: "Bugün",
        adminNote: "Başvurunuz sistem tarafından alındı ve inceleme sırasına eklendi.",
        applicantNote: applicantNote || undefined,
        documentName: attachedFileName || "Basvuru_Evraki.pdf",
      }
      setMyApps((prev) => [newApp, ...prev])
      setSubmitting(false)
      setSelectedSupport(null)
      setApplicantNote("")
      setAttachedFileName("")
      setTab("my-applications")
      alert("Başvurunuz ve yüklenen belgeleriniz başarıyla alındı! 'Başvurularım' sekmesinden takip edebilirsiniz.")
    }, 600)
  }

  const handleDocUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!docUploadModalApp) return

    setMyApps((prev) =>
      prev.map((app) =>
        app.id === docUploadModalApp.id
          ? {
              ...app,
              status: "UnderReview",
              adminNote: "Ek belgeniz alındı. İnceleme belediye ekibimiz tarafından tekrar başlatıldı.",
              documentName: docFileText || app.documentName || "Guncellenmis_Belge.pdf",
            }
          : app
      )
    )
    setDocUploadModalApp(null)
    setDocFileText("")
    alert("Ek belge başarıyla yüklendi! Başvuru durumunuz 'İnceleniyor' olarak güncellendi.")
  }

  const handleCancelApplication = (app: UserApplication) => {
    if (confirm(`"${app.title}" başvurunuzu iptal etmek ve silmek istediğinize emin misiniz?`)) {
      setMyApps((prev) => prev.filter((a) => a.id !== app.id))
      alert("Başvurunuz iptal edildi.")
    }
  }

  const handleSaveEditedApp = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingApp) return

    setMyApps((prev) =>
      prev.map((app) => (app.id === editingApp.id ? { ...editingApp } : app))
    )
    setEditingApp(null)
    alert("Başvuru notu ve belgeleri güncellendi.")
  }

  return (
    <Screen className="space-y-4 pb-12">
      <header className="pt-1 space-y-1">
        <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
          Belediye Hizmetleri
        </span>
        <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <FileText className="size-6 text-primary" />
          Başvuru
        </h1>
        <p className="text-xs text-muted-foreground">
          Sosyal yardım, gıda, eğitim ve belediye desteklerine başvurun veya mevcut başvurularınızı takip edin.
        </p>
      </header>

      {/* Main 2-Tab Switcher: Destekler | Başvurularım */}
      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-secondary p-1 shadow-2xs">
        <button
          type="button"
          onClick={() => setTab("supports")}
          className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all ${
            tab === "supports" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <HeartHandshake className="size-4 text-primary" />
          Destekler ({supportTypes.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("my-applications")}
          className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all ${
            tab === "my-applications" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Clock className="size-4 text-[color:var(--color-gold)]" />
          Başvurularım ({myApps.length})
        </button>
      </div>

      {/* TAB 1: DESTEKLER */}
      {tab === "supports" && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">Açık Başvuru Türleri</h2>

          <div className="grid gap-3">
            {supportTypes.map((support) => {
              const Icon = support.icon || HeartHandshake
              return (
                <div
                  key={support.id}
                  className="group relative overflow-hidden rounded-[22px] border border-border/80 bg-card p-4 shadow-2xs space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                        {support.category}
                      </span>
                      <h3 className="font-serif text-base font-bold text-foreground leading-snug">
                        {support.title}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                        {support.description}
                      </p>
                    </div>
                  </div>

                  {/* Badges / Conditions */}
                  <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] font-semibold">
                    {support.minAge && (
                      <span className="rounded-md bg-secondary px-2 py-0.5 text-foreground">
                        Yaş: {support.minAge}{support.maxAge ? `–${support.maxAge}` : "+"}
                      </span>
                    )}
                    {support.requiredEducation && (
                      <span className="rounded-md bg-secondary px-2 py-0.5 text-foreground">
                        Eğitim: {support.requiredEducation}
                      </span>
                    )}
                    <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-amber-700 dark:text-amber-400">
                      Son Gün: {support.deadline}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-border/60 pt-3">
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {support.documentsNeeded.length} Gerekli Belge
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedSupport(support)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-2xs hover:bg-primary/90 transition-all active:scale-95"
                    >
                      Başvuru Yap
                      <ChevronRight className="size-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* TAB 2: BAŞVURULARIM (DURUM AKIŞI, DÜZENLEME, SİLME, SONUÇ) */}
      {tab === "my-applications" && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">Başvuru Geçmişim ve Durumu</h2>

          {myApps.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
              Henüz yapmış olduğunuz bir başvuru bulunmuyor.
            </div>
          ) : (
            <div className="space-y-3">
              {myApps.map((app) => {
                const statusLabel =
                  app.status === "Submitted"
                    ? "Gönderildi"
                    : app.status === "UnderReview"
                    ? "İnceleniyor"
                    : app.status === "DocumentRequested"
                    ? "Ek Belge Bekleniyor"
                    : app.status === "Approved"
                    ? "Onaylandı"
                    : app.status === "Rejected"
                    ? "Reddedildi"
                    : app.status === "Completed"
                    ? "Tamamlandı"
                    : "Taslak"

                const statusColor =
                  app.status === "DocumentRequested"
                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
                    : app.status === "Approved" || app.status === "Completed"
                    ? "bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                    : app.status === "Rejected"
                    ? "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30"
                    : "bg-primary/15 text-primary border-primary/30"

                return (
                  <div
                    key={app.id}
                    className="relative overflow-hidden rounded-[22px] border border-border/80 bg-card p-4 shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                          {app.category}
                        </span>
                        <h3 className="font-serif text-base font-bold text-foreground leading-snug">
                          {app.title}
                        </h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Tarih: {app.submittedAt} {app.documentName ? `· 📄 ${app.documentName}` : ""}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusColor}`}>
                        {statusLabel}
                      </span>
                    </div>

                    {/* Status Flow Stepper */}
                    <div className="rounded-xl bg-secondary/50 p-3 space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Süreç Akışı
                      </p>
                      <div className="grid grid-cols-4 gap-1 text-center">
                        <div className={`rounded-lg py-1.5 text-[10px] font-bold ${app.status !== "Draft" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                          1. Alındı
                        </div>
                        <div className={`rounded-lg py-1.5 text-[10px] font-bold ${app.status === "UnderReview" || app.status === "DocumentRequested" || app.status === "Approved" || app.status === "Completed" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                          2. İnceleniyor
                        </div>
                        <div className={`rounded-lg py-1.5 text-[10px] font-bold ${app.status === "DocumentRequested" ? "bg-amber-500 text-white" : app.status === "Approved" || app.status === "Completed" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                          3. Belge/Kontrol
                        </div>
                        <div className={`rounded-lg py-1.5 text-[10px] font-bold ${app.status === "Approved" || app.status === "Completed" ? "bg-emerald-600 text-white" : app.status === "Rejected" ? "bg-rose-500 text-white" : "bg-muted text-muted-foreground"}`}>
                          4. Sonuç
                        </div>
                      </div>
                    </div>

                    {/* Admin Note / Değerlendirme Notu */}
                    {app.adminNote && (
                      <div className="rounded-xl bg-card border border-border/80 p-3 text-xs text-foreground space-y-1">
                        <p className="text-[10px] font-bold uppercase text-primary">Belediye İnceleme Notu:</p>
                        <p className="text-muted-foreground">{app.adminNote}</p>
                      </div>
                    )}

                    {/* ACTIONS: Belge Yükleme, Düzenleme, İptal Et */}
                    <div className="flex flex-wrap items-center justify-between border-t border-border/60 pt-3 gap-2">
                      {app.status === "DocumentRequested" ? (
                        <button
                          type="button"
                          onClick={() => setDocUploadModalApp(app)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-amber-600 active:scale-95"
                        >
                          <Upload className="size-3.5" />
                          Eksik Belge Yükle
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditingApp({ ...app })}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-secondary px-3 py-1.5 text-xs font-bold text-foreground hover:bg-secondary/80"
                        >
                          <Edit3 className="size-3.5 text-primary" />
                          Düzenle
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleCancelApplication(app)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline"
                      >
                        <Trash2 className="size-3.5" />
                        Başvuruyu İptal Et
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Application Submission Form Modal */}
      {selectedSupport && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <form
            onSubmit={handleApplySubmit}
            className="relative w-full max-w-md rounded-t-[28px] border border-border bg-card p-6 shadow-2xl sm:rounded-[28px] space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <span className="text-[10px] font-bold text-primary uppercase">{selectedSupport.category}</span>
                <h2 className="font-serif text-lg font-bold text-foreground">{selectedSupport.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSupport(null)}
                aria-label="Kapat"
                className="flex size-8 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-xl bg-secondary/60 p-3 space-y-1">
                <p className="font-bold text-foreground">İstenen Evraklar (İşaretli Şartlar):</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                  {selectedSupport.documentsNeeded.map((doc, idx) => (
                    <li key={idx} className="font-medium text-foreground/90">📄 {doc}</li>
                  ))}
                </ul>
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1">Ad Soyad (Başvuru Sahibi)</label>
                <input
                  type="text"
                  required
                  defaultValue={user ? `${user.firstName} ${user.lastName}` : "Ahmet Yılmaz"}
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1">Evrak / PDF Belge Yükle (.pdf / Görsel)</label>
                <div className="flex flex-col gap-2">
                  <label className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-3.5 py-3 text-xs font-bold text-primary hover:bg-primary/10 transition-colors">
                    <Upload className="size-4" />
                    <span>{attachedFileName ? `Yüklendi: ${attachedFileName}` : "Cihazdan PDF Evrak Seç"}</span>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setAttachedFileName(file.name);
                        }
                      }}
                    />
                  </label>
                  {attachedFileName && (
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      ✓ {attachedFileName} ekleme için hazırlandı.
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1">İletişim / Beyan Notu</label>
                <textarea
                  rows={3}
                  value={applicantNote}
                  onChange={(e) => setApplicantNote(e.target.value)}
                  placeholder="Başvuru gerekçeniz veya belediyeye iletmek istediğiniz açıklamanız..."
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedSupport(null)}
                className="rounded-xl bg-secondary px-4 py-2.5 text-xs font-bold text-foreground"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-2xs hover:bg-primary/90 disabled:opacity-50"
              >
                <Send className="size-3.5" />
                {submitting ? "Gönderiliyor..." : "Başvuruyu Tamamla"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Upload Missing Document Modal */}
      {docUploadModalApp && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <form
            onSubmit={handleDocUploadSubmit}
            className="relative w-full max-w-md rounded-t-[28px] border border-border bg-card p-6 shadow-2xl sm:rounded-[28px] space-y-4"
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h2 className="font-serif text-base font-bold text-foreground">Eksik Belge Yükle</h2>
              <button
                type="button"
                onClick={() => setDocUploadModalApp(null)}
                aria-label="Kapat"
                className="flex size-8 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-muted-foreground">
                <strong>{docUploadModalApp.title}</strong> için belediye görevlisinin talep ettiği eksik evrağı seçin:
              </p>

              <div>
                <label className="block font-bold text-foreground mb-1">PDF Dosyası veya Görsel Yükle</label>
                <label className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-amber-500/50 bg-amber-500/10 px-3.5 py-3 text-xs font-bold text-amber-700 dark:text-amber-400 w-full">
                  <Upload className="size-4" />
                  <span>{docFileText ? `Dosya: ${docFileText}` : "Bilgisayardan PDF veya Görsel Dosyası Seç"}</span>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setDocFileText(file.name);
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDocUploadModalApp(null)}
                className="rounded-xl bg-secondary px-4 py-2.5 text-xs font-bold text-foreground"
              >
                İptal
              </button>
              <button
                type="submit"
                className="rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-white shadow-2xs hover:bg-amber-600"
              >
                Belgeyi Gönder
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Application Modal */}
      {editingApp && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <form
            onSubmit={handleSaveEditedApp}
            className="relative w-full max-w-md rounded-t-[28px] border border-border bg-card p-6 shadow-2xl sm:rounded-[28px] space-y-4"
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h2 className="font-serif text-base font-bold text-foreground">Başvuru Bilgilerini Düzenle</h2>
              <button
                type="button"
                onClick={() => setEditingApp(null)}
                aria-label="Kapat"
                className="flex size-8 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-foreground mb-1">Açıklama / Beyan Notu</label>
                <textarea
                  rows={3}
                  value={editingApp.applicantNote || ""}
                  onChange={(e) => setEditingApp({ ...editingApp, applicantNote: e.target.value })}
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1">Belgeyi Yenile / Güncelle (.pdf)</label>
                <label className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-3.5 py-2.5 text-xs font-bold text-primary w-full">
                  <Upload className="size-4" />
                  <span>{editingApp.documentName || "Yeni PDF Dosyası Seç"}</span>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setEditingApp({ ...editingApp, documentName: file.name });
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingApp(null)}
                className="rounded-xl bg-secondary px-4 py-2.5 text-xs font-bold text-foreground"
              >
                İptal
              </button>
              <button
                type="submit"
                className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-2xs hover:bg-primary/90"
              >
                Kaydet
              </button>
            </div>
          </form>
        </div>
      )}
    </Screen>
  )
}
