"use client"

import { useEffect, useMemo, useState } from "react"
import { Screen } from "@/components/golbox/screen"
import { Play, Eye, Heart, Share2, Sparkles, Tv, ChevronLeft, ChevronRight, X, ArrowRight, Plus, Clock, CheckCircle2, XCircle, FileVideo, Image as ImageIcon } from "lucide-react"
import { useGolbox } from "@/lib/golbox-context"

export interface ReelItem {
  id: string
  title: string
  category: string
  duration: string
  views: string
  likes: string
  imageUrl: string
  videoUrl?: string
  description: string
  author: string
}

export interface StorySlide {
  id: string
  title: string
  subtitle?: string
  imageUrl: string
  category: string
  date: string
  ctaText?: string
}

export interface StoryGroup {
  id: string
  name: string
  category: string
  avatarText: string
  slides: StorySlide[]
}

export interface CitizenSocialSubmission {
  id: string
  type: "Story" | "Reels"
  title: string
  category: string
  description?: string
  status: "Draft" | "PendingReview" | "Approved" | "Rejected" | "Published" | "Archived"
  submittedAt: string
  rejectionReason?: string
}

const CATEGORIES = ["Hepsi", "Gençlik ve Eğitim", "Spor ve Doğa", "GölBox Rehber", "Kültür ve Sanat"]

const DEMO_STORIES: StoryGroup[] = [
  {
    id: "story-gundem",
    name: "Gündem",
    category: "Haber",
    avatarText: "ŞK",
    slides: [
      {
        id: "s1",
        title: "Şehitkamil Kitap Kafelerde 24 Saat İkram Hizmeti",
        subtitle: "Gençlerin ders çalışma alanlarında sıcak ikramlar ücretsiz sunuluyor.",
        imageUrl: "/images/story-1.jpg",
        category: "Kütüphane",
        date: "Bugün",
        ctaText: "Detayları Oku",
      },
      {
        id: "s2",
        title: "Gençlik Kampında Hafta Sonu Heyecanı",
        subtitle: "Dülük Tabiat Parkında düzenlenen sporsal etkinliklerden kareler.",
        imageUrl: "/images/story-2.jpg",
        category: "Doğa Sporu",
        date: "Bugün",
      },
    ],
  },
  {
    id: "story-etkinlik",
    name: "Etkinlik",
    category: "Kültür",
    avatarText: "SANAT",
    slides: [
      {
        id: "s3",
        title: "Ücretsiz Sanat ve Müzik Kursları Başladı",
        subtitle: "Görsel sanatlar, piyano, gitar ve ney atölyelerine online başvuru yapabilirsiniz.",
        imageUrl: "/images/story-3.jpg",
        category: "Atölye",
        date: "Dün",
        ctaText: "Başvuru Yap",
      },
    ],
  },
  {
    id: "story-spor",
    name: "Spor Okulu",
    category: "Spor",
    avatarText: "SPOR",
    slides: [
      {
        id: "s4",
        title: "Alleben Yüzme Havuzunda Kış Dönemi",
        subtitle: "Çocuklar ve gençler için uluslararası standartlarda yüzme eğitimi.",
        imageUrl: "/images/story-4.jpg",
        category: "Yüzme",
        date: "Dün",
      },
      {
        id: "s5",
        title: "Gençlik Basketbol Turnuvası Finalleri",
        subtitle: "Şehitkamil Spor Salonunda düzenlenen coşkulu final maçları.",
        imageUrl: "/images/story-5.jpg",
        category: "Turnuva",
        date: "2 Gün Önce",
      },
    ],
  },
  {
    id: "story-golbox",
    name: "GölBox",
    category: "Ödül",
    avatarText: "GB",
    slides: [
      {
        id: "s6",
        title: "Yeni Saha Hediyeleri Haritada!",
        subtitle: "Şehrin 5 farklı noktasına yerleştirilen 3D hediye kutularını yakala, 100 GP kazan.",
        imageUrl: "/images/story-6.jpg",
        category: "GölBox",
        date: "Bugün",
        ctaText: "Haritayı Aç",
      },
    ],
  },
]

const DEMO_REELS: ReelItem[] = [
  {
    id: "reel-1",
    title: "Şehitkamil Kitap Kafelerde Gençler İçin 24 Saat Açık Hizmet",
    category: "Gençlik ve Eğitim",
    duration: "0:45",
    views: "14.250",
    likes: "1.840",
    imageUrl: "/images/reel-library.jpg",
    description: "Kütüphane ve kitap kafelerimizde sınırsız internet, sıcak ikramlar ve sessiz çalışma ortamı gençleri bekliyor.",
    author: "Şehitkamil Medya",
  },
  {
    id: "reel-2",
    title: "Dülük Tabiat Parkı Gençlik Spor Kampı Özet Görüntüleri",
    category: "Spor ve Doğa",
    duration: "1:15",
    views: "9.810",
    likes: "1.230",
    imageUrl: "/images/reel-camp.jpg",
    description: "Hafta sonu düzenlenen oryantiring ve gençlik doğa yürüyüşünden heyecan dolu anlar!",
    author: "Şehitkamil Spor",
  },
  {
    id: "reel-3",
    title: "GölBox İle QR Okutarak İkramını Nasıl Alırsın?",
    category: "GölBox Rehber",
    duration: "0:30",
    views: "22.500",
    likes: "3.410",
    imageUrl: "/images/reel-guide.jpg",
    description: "Uygulamadaki QR kodunuzu kitapkefe kasalarında okutarak GölPuan ikramınızı anında alabilirsiniz.",
    author: "GölBox Destek",
  },
  {
    id: "reel-4",
    title: "Şehitkamil Gençlik Sanat Merkezinde Kurslar",
    category: "Kültür ve Sanat",
    duration: "1:00",
    views: "7.620",
    likes: "950",
    imageUrl: "/images/reel-art.jpg",
    description: "Ücretsiz enstrüman ve görsel sanat atölyelerimize kayıtlar başladı.",
    author: "Kültür İşleri",
  },
]

export function ReelsScreen() {
  const { addBonusPoints, token, user } = useGolbox()
  const [activeReel, setActiveReel] = useState<ReelItem | null>(null)
  const [activeStoryGroupIndex, setActiveStoryGroupIndex] = useState<number | null>(null)
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0)
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({})
  const [watchedMap, setWatchedMap] = useState<Record<string, boolean>>({})
  const [selectedCategory, setSelectedCategory] = useState("Hepsi")
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [submissions, setSubmissions] = useState<CitizenSocialSubmission[]>([
    {
      id: "sub-1",
      type: "Reels",
      title: "Gençlik Parkı Sabah Koşusu Etkinliği",
      category: "Spor & Doğa",
      description: "Mahallemizdeki gençlerle sabah sporu videosu.",
      status: "PendingReview",
      submittedAt: "Bugün 10:30",
    },
  ])

  // New content upload state
  const [contentType, setContentType] = useState<"Story" | "Reels">("Reels")
  const [newTitle, setNewTitle] = useState("")
  const [newCategory, setNewCategory] = useState("Gençlik & Eğitim")
  const [newDescription, setNewDescription] = useState("")
  const [newMediaUrl, setNewMediaUrl] = useState("")
  const [uploadBusy, setUploadBusy] = useState(false)

  const toggleLike = async (id: string) => {
    const isLiked = !likedMap[id]
    setLikedMap((prev) => ({ ...prev, [id]: isLiked }))

    setReelsList((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const rawNum = parseInt(item.likes.replace(/[^0-9]/g, ""), 10) || 0
          const newLikes = isLiked ? rawNum + 1 : Math.max(0, rawNum - 1)
          return { ...item, likes: newLikes.toLocaleString("tr-TR") }
        }
        return item
      })
    )

    try {
      const endpoint = isLiked ? "like" : "unlike"
      await fetch(`http://localhost:5155/api/v1/social/${id}/${endpoint}`, { method: "POST" })
    } catch {}
  }

  const handleWatchVideo = async (item: ReelItem) => {
    setActiveReel(item)

    setReelsList((prev) =>
      prev.map((r) => {
        if (r.id === item.id) {
          const rawNum = parseInt(r.views.replace(/[^0-9]/g, ""), 10) || 0
          return { ...r, views: (rawNum + 1).toLocaleString("tr-TR") }
        }
        return r
      })
    )

    if (!watchedMap[item.id]) {
      setWatchedMap((prev) => ({ ...prev, [item.id]: true }))
      addBonusPoints(15, `"${item.title.slice(0, 20)}..." videosu izlendi`)
    }

    try {
      await fetch(`http://localhost:5155/api/v1/social/${item.id}/view`, { method: "POST" })
    } catch {}
  }

  const getDisplayViews = (item: ReelItem) => {
    return item.views
  }

  const [reelsList, setReelsList] = useState<ReelItem[]>(DEMO_REELS)

  useEffect(() => {
    const loadAdminSocial = async () => {
      try {
        let adminSocial: any[] = []
        const res = await fetch("http://localhost:5155/api/v1/social")
        if (res.ok) {
          const data = await res.json()
          adminSocial = data.items || []
        } else {
          const stored = localStorage.getItem("golbox_admin_social")
          if (stored) adminSocial = JSON.parse(stored)
        }

        if (Array.isArray(adminSocial) && adminSocial.length > 0) {
          const publishedOnly = adminSocial.filter((s: any) => s.status === "Published")
          if (publishedOnly.length > 0) {
            const mappedReels: ReelItem[] = publishedOnly.map((s: any) => {
              const likesVal = typeof s.likesCount === "number" ? s.likesCount : 142
              const viewsVal = typeof s.viewsCount === "number" ? s.viewsCount : 1850
              return {
                id: s.id || `reel-${Date.now()}`,
                title: s.title || s.caption || "Şehitkamil Belediyesi",
                category: s.locationTag || "Gençlik ve Eğitim",
                duration: "0:45",
                views: viewsVal.toLocaleString("tr-TR"),
                likes: likesVal.toLocaleString("tr-TR"),
                imageUrl: s.thumbnailUrl || s.imageUrl || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
                videoUrl: s.videoUrl,
                description: s.caption || s.title || "",
                author: s.authorName || "Şehitkamil Belediyesi",
              }
            })

            setReelsList([...mappedReels, ...DEMO_REELS.filter(d => !mappedReels.some(m => m.id === d.id))])
          }
        }
      } catch (e) {}
    }

    void loadAdminSocial()
  }, [])

  const filteredReels = useMemo(() => {
    if (selectedCategory === "Hepsi") return reelsList
    return reelsList.filter((item) => item.category === selectedCategory || selectedCategory === "Hepsi")
  }, [selectedCategory, reelsList])

  useEffect(() => {
    if (activeStoryGroupIndex === null) return
    const currentGroup = DEMO_STORIES[activeStoryGroupIndex]
    if (!currentGroup) return

    const timer = setTimeout(() => {
      if (activeSlideIndex < currentGroup.slides.length - 1) {
        setActiveSlideIndex((prev) => prev + 1)
      } else {
        if (activeStoryGroupIndex < DEMO_STORIES.length - 1) {
          setActiveStoryGroupIndex(activeStoryGroupIndex + 1)
          setActiveSlideIndex(0)
        } else {
          setActiveStoryGroupIndex(null)
          setActiveSlideIndex(0)
        }
      }
    }, 4500)

    return () => clearTimeout(timer)
  }, [activeStoryGroupIndex, activeSlideIndex])

  const openStoryGroup = (index: number) => {
    setActiveStoryGroupIndex(index)
    setActiveSlideIndex(0)
    const storyGroup = DEMO_STORIES[index]
    if (storyGroup && !watchedMap[storyGroup.id]) {
      setWatchedMap((prev) => ({ ...prev, [storyGroup.id]: true }))
      addBonusPoints(10, `"${storyGroup.name}" hikayesi izlendi`)
    }
  }

  const handleNextSlide = () => {
    if (activeStoryGroupIndex === null) return
    const currentGroup = DEMO_STORIES[activeStoryGroupIndex]
    if (activeSlideIndex < currentGroup.slides.length - 1) {
      setActiveSlideIndex((prev) => prev + 1)
    } else if (activeStoryGroupIndex < DEMO_STORIES.length - 1) {
      setActiveStoryGroupIndex(activeStoryGroupIndex + 1)
      setActiveSlideIndex(0)
    } else {
      setActiveStoryGroupIndex(null)
    }
  }

  const handlePrevSlide = () => {
    if (activeStoryGroupIndex === null) return
    if (activeSlideIndex > 0) {
      setActiveSlideIndex((prev) => prev - 1)
    } else if (activeStoryGroupIndex > 0) {
      const prevGroup = DEMO_STORIES[activeStoryGroupIndex - 1]
      setActiveStoryGroupIndex(activeStoryGroupIndex - 1)
      setActiveSlideIndex(prevGroup.slides.length - 1)
    }
  }

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    setUploadBusy(true)

    setTimeout(() => {
      const created: CitizenSocialSubmission = {
        id: `sub-${Date.now()}`,
        type: contentType,
        title: newTitle.trim(),
        category: newCategory,
        description: newDescription.trim() || undefined,
        status: "PendingReview",
        submittedAt: "Şimdi",
      }
      setSubmissions((prev) => [created, ...prev])
      setUploadBusy(false)
      setShowUploadModal(false)
      setNewTitle("")
      setNewDescription("")
      setNewMediaUrl("")
      alert("İçeriğiniz başarıyla gönderildi! Admin incelemesinin ardından onaylandığında yayına alınacaktır.")
    }, 600)
  }

  const currentStoryGroup = activeStoryGroupIndex !== null ? DEMO_STORIES[activeStoryGroupIndex] : null
  const currentStorySlide = currentStoryGroup ? currentStoryGroup.slides[activeSlideIndex] : null

  return (
    <Screen className="space-y-5 pb-12">
      <header className="pt-1 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
            Medya & Akış
          </span>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Tv className="size-6 text-primary" />
            Sosyal Medya
          </h1>
        </div>

        <button
          type="button"
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground shadow-2xs hover:bg-primary/90 transition-all active:scale-95"
        >
          <Plus className="size-4" />
          İçerik Paylaş
        </button>
      </header>

      {/* Stories Bar */}
      <section aria-label="Hikayeler" className="space-y-2">
        <p className="text-xs font-bold tracking-tight text-foreground">Günün Hikayeleri (+10 GP)</p>
        <div className="no-scrollbar flex items-center gap-3.5 overflow-x-auto py-1">
          {DEMO_STORIES.map((group, index) => (
            <button
              key={group.id}
              type="button"
              onClick={() => openStoryGroup(index)}
              className="group flex flex-col items-center gap-1.5 focus:outline-none"
            >
              <div className="relative flex size-15 items-center justify-center rounded-full border-2 border-[color:var(--color-gold)] p-0.5 shadow-2xs transition-transform group-hover:scale-105 active:scale-95">
                <div className="flex size-full items-center justify-center rounded-full bg-gradient-to-br from-[color:var(--color-brand-900)] to-primary text-xs font-bold text-white">
                  {group.avatarText}
                </div>
              </div>
              <span className="max-w-[4.2rem] truncate text-[11px] font-semibold text-foreground group-hover:text-primary transition-colors">
                {group.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Citizen Submissions Track Bar (Draft / PendingReview / Published) */}
      {submissions.length > 0 && (
        <section aria-label="Gönderdiğim İçerikler" className="space-y-2">
          <p className="text-xs font-bold tracking-tight text-foreground">Gönderdiğim İçerikler & Durumları</p>
          <div className="grid gap-2">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card p-3 shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-xs">
                    {sub.type === "Story" ? <ImageIcon className="size-4" /> : <FileVideo className="size-4" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-foreground line-clamp-1">{sub.title}</h3>
                    <p className="text-[10px] text-muted-foreground">{sub.type} · {sub.submittedAt}</p>
                  </div>
                </div>

                <div className="shrink-0">
                  {sub.status === "PendingReview" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                      <Clock className="size-3" />
                      Onay Bekliyor
                    </span>
                  )}
                  {sub.status === "Published" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/15 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="size-3" />
                      Yayında
                    </span>
                  )}
                  {sub.status === "Rejected" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-1 text-[10px] font-bold text-rose-700 dark:text-rose-400">
                      <XCircle className="size-3" />
                      Reddedildi
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Categories Filter Pills */}
      <section aria-label="Video Kategorileri" className="space-y-2">
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto py-1">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </section>

      {/* Video Reels Feed */}
      <div className="space-y-4 pt-1">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold tracking-tight text-foreground">
            {selectedCategory === "Hepsi" ? "Öne Çıkan Video Haberler" : `${selectedCategory} Videoları`}
          </p>
          <span className="text-[11px] font-semibold text-[color:var(--color-gold)]">Her Video +15 GP</span>
        </div>
        
        {filteredReels.map((item) => {
          const isLiked = Boolean(likedMap[item.id])
          const isWatched = Boolean(watchedMap[item.id])

          return (
            <article
              key={item.id}
              className="group relative overflow-hidden rounded-[22px] border border-border/70 bg-gradient-to-b from-card to-secondary/30 shadow-xs transition-all hover:border-primary/30"
            >
              <div 
                onClick={() => handleWatchVideo(item)}
                className="relative aspect-[16/9] w-full cursor-pointer overflow-hidden bg-[color:var(--color-brand-900)]"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 z-10" />
                
                <div className="absolute inset-0 z-20 flex items-center justify-center">
                  <span className="flex size-14 items-center justify-center rounded-full bg-white/25 text-white backdrop-blur-md transition-transform group-hover:scale-110">
                    <Play className="size-6 fill-white ml-0.5" />
                  </span>
                </div>

                <div className="absolute left-3 top-3 z-20 flex items-center gap-2">
                  <span className="rounded-md bg-black/50 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-md uppercase tracking-wider">
                    {item.category}
                  </span>
                  <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-md ${
                    isWatched ? "bg-[color:var(--color-success)]" : "bg-[color:var(--color-gold)]"
                  }`}>
                    {isWatched ? "İzlendi (+15 GP)" : "+15 GP İZLE"}
                  </span>
                </div>

                <div className="absolute right-3 top-3 z-20">
                  <span className="rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md">
                    {item.duration}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-semibold text-primary">{item.author}</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium">
                    <Eye className="size-3.5 text-primary" />
                    {getDisplayViews(item)} İzlenme
                  </span>
                </div>

                <h3 className="mt-1.5 text-base font-semibold leading-snug tracking-tight text-foreground group-hover:text-primary transition-colors">
                  {item.title}
                </h3>

                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                  {item.description}
                </p>

                <div className="mt-3.5 flex items-center justify-between border-t border-border/50 pt-2.5">
                  <button
                    type="button"
                    onClick={() => toggleLike(item.id)}
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                      isLiked ? "text-[color:var(--color-danger)]" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Heart className={`size-4 ${isLiked ? "fill-[color:var(--color-danger)] text-[color:var(--color-danger)]" : ""}`} />
                    <span>{item.likes} {isLiked ? "· Beğendiniz" : "Beğeni"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.share) {
                        void navigator.share({ title: item.title, text: item.description, url: window.location.href })
                      }
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Share2 className="size-3.5" />
                    <span>Paylaş</span>
                  </button>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {/* Create Content Modal (`CanCreateSocialContent`) */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <form
            onSubmit={handleCreateSubmit}
            className="relative w-full max-w-md rounded-t-[28px] border border-border bg-card p-6 shadow-2xl sm:rounded-[28px] space-y-4"
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h2 className="font-serif text-lg font-bold text-foreground">Yeni İçerik Oluştur</h2>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                aria-label="Kapat"
                className="flex size-8 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Type Selector: Story vs Reels */}
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-secondary p-1">
              <button
                type="button"
                onClick={() => setContentType("Story")}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all ${
                  contentType === "Story" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
                }`}
              >
                <ImageIcon className="size-3.5" />
                Story (24 Saatlik)
              </button>
              <button
                type="button"
                onClick={() => setContentType("Reels")}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all ${
                  contentType === "Reels" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
                }`}
              >
                <FileVideo className="size-3.5" />
                Reels (Video)
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-foreground mb-1">İçerik Başlığı</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="ör. Gençlik Spor Kampından Kareler"
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1">Kategori</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {CATEGORIES.filter((c) => c !== "Hepsi").map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1">Açıklama / Metin</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="İçerik hakkında kısa bilgi ekleyin..."
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1">Medya Görsel / Video Bağlantısı</label>
                <input
                  type="text"
                  value={newMediaUrl}
                  onChange={(e) => setNewMediaUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div className="rounded-xl bg-amber-500/10 p-3 text-[11px] text-amber-700 dark:text-amber-400">
              Gönderilen içerikler admin incelemesinden (PendingReview) geçtikten sonra onaylandığında yayınlanır.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="rounded-xl bg-secondary px-4 py-2.5 text-xs font-bold text-foreground"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                disabled={uploadBusy || !newTitle.trim()}
                className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-2xs hover:bg-primary/90 disabled:opacity-50"
              >
                {uploadBusy ? "Gönderiliyor..." : "Onaya Gönder"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Story Viewer */}
      {currentStoryGroup && currentStorySlide ? (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black text-white select-none">
          <div className="absolute top-3 inset-x-3 z-30 flex items-center gap-1.5">
            {currentStoryGroup.slides.map((slide, i) => (
              <div key={slide.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
                <div
                  className={`h-full bg-white transition-all duration-300 ${
                    i < activeSlideIndex
                      ? "w-full"
                      : i === activeSlideIndex
                      ? "w-full animate-pulse"
                      : "w-0"
                  }`}
                />
              </div>
            ))}
          </div>

          <div className="absolute top-7 inset-x-4 z-30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-[color:var(--color-brand-900)] to-primary text-xs font-bold text-white border border-white/40">
                {currentStoryGroup.avatarText}
              </div>
              <div>
                <p className="text-xs font-bold text-white leading-tight">{currentStoryGroup.name}</p>
                <p className="text-[10px] text-white/70">{currentStorySlide.date}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveStoryGroupIndex(null)}
              className="flex size-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/60"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="relative flex-1 bg-gradient-to-b from-[color:var(--color-brand-900)] via-[#0b1f20] to-black p-6 flex flex-col justify-end">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,#1d5f60_0%,#0b1f20_75%)] opacity-80" />

            <div
              onClick={handlePrevSlide}
              className="absolute left-0 top-16 bottom-24 w-1/3 z-20 cursor-pointer"
            />
            <div
              onClick={handleNextSlide}
              className="absolute right-0 top-16 bottom-24 w-2/3 z-20 cursor-pointer"
            />

            <div className="relative z-30 space-y-3 pb-8">
              <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--color-gold)] px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                <Sparkles className="size-3" />
                {currentStorySlide.category}
              </span>

              <h2 className="font-serif text-2xl font-bold leading-snug tracking-tight text-white">
                {currentStorySlide.title}
              </h2>

              {currentStorySlide.subtitle ? (
                <p className="text-xs text-white/85 leading-relaxed">
                  {currentStorySlide.subtitle}
                </p>
              ) : null}

              {currentStorySlide.ctaText ? (
                <button
                  type="button"
                  onClick={handleNextSlide}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[color:var(--color-brand-900)] shadow-md transition-all hover:bg-white/95 active:scale-95"
                >
                  <span>{currentStorySlide.ctaText}</span>
                  <ArrowRight className="size-3.5" />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* Video Modal Player */}
      {activeReel ? (
        <div className="fixed inset-0 z-[90] flex flex-col bg-black text-white">
          <div className="flex items-center justify-between p-4 z-20">
            <span className="text-xs font-semibold text-white/80">{activeReel.category}</span>
            <button
              type="button"
              onClick={() => setActiveReel(null)}
              className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white backdrop-blur-md"
            >
              Kapat
            </button>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center p-4 text-center max-w-md mx-auto w-full">
            {activeReel.videoUrl ? (
              <video
                src={activeReel.videoUrl}
                controls
                autoPlay
                className="w-full max-h-[60vh] rounded-2xl object-contain bg-black shadow-2xl"
              />
            ) : (
              <div className="relative flex size-20 items-center justify-center rounded-full bg-white/10 backdrop-blur-md">
                <Play className="size-10 fill-white" />
              </div>
            )}
            <h2 className="mt-4 font-serif text-lg font-bold">{activeReel.title}</h2>
            <p className="mt-2 text-xs text-white/70 max-w-xs">{activeReel.description}</p>
            
            <div className="mt-6 flex items-center gap-4">
              <button
                type="button"
                onClick={() => toggleLike(activeReel.id)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                  likedMap[activeReel.id]
                    ? "bg-[color:var(--color-danger)] text-white"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                <Heart className={`size-4 ${likedMap[activeReel.id] ? "fill-white" : ""}`} />
                <span>{activeReel.likes} {likedMap[activeReel.id] ? "· Beğendiniz" : "Beğeni"}</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </Screen>
  )
}
