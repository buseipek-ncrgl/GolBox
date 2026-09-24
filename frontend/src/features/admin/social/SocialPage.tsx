import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { Button, EmptyState, ErrorState, FilterBar, Input, Modal, NumberInput, Select, Textarea, UnsavedGuard } from '../../../admin/components';
import { SafeImg } from '../../../components/admin/adminUi';
import { useAdminFeedback } from '../AdminFeedback';
import { formatDate } from '../../../lib/adminDate';
import { Video, Film, CheckCircle, XCircle, Trash2, Plus, Play, Edit3, Power, Eye } from 'lucide-react';

export function SocialPage() {
  const { isAdmin, confirm, setError, setSuccess, savingKey, setSavingKey } = useAdminFeedback();
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Published' | 'PendingReview' | 'Draft'>('All');
  const [fail, setFail] = useState<unknown>(null);
  const [form, setForm] = useState<any>(null);
  const [snapshot, setSnapshot] = useState('');
  const [previewMedia, setPreviewMedia] = useState<any>(null);

  const load = async () => {
    try {
      const res = await api.getSocialPosts({
        page,
        status: activeTab === 'All' ? undefined : activeTab,
        search: search || undefined,
      });
      setItems(res.items || []);
      setFail(null);
    } catch (err: any) {
      setFail(err);
    }
  };

  useEffect(() => {
    void load();
  }, [page, activeTab]);

  const dirty = !!form && JSON.stringify(form) !== snapshot;
  const open = (next: any) => {
    setForm(next);
    setSnapshot(JSON.stringify(next));
  };
  const close = () => {
    if (dirty) {
      confirm({
        title: 'Kaydedilmemiş değişiklikler',
        message: 'Sosyal medya formundaki değişiklikler kaydedilmedi. Kapatılsın mı?',
        confirmLabel: 'Kapat',
        danger: true,
        onConfirm: () => setForm(null),
      });
    } else {
      setForm(null);
    }
  };

  const handleApprove = (post: any) => {
    confirm({
      title: 'İçeriği Onayla ve Yayına Al',
      message: `"${post.title || 'Videoyu'}" yayına almak istediğinize emin misiniz?`,
      confirmLabel: 'Yayına Al',
      onConfirm: async () => {
        setSavingKey(`approve-${post.id}`);
        try {
          await api.approveSocialPost(post.id);
          setItems(prev => prev.map(i => i.id === post.id ? { ...i, status: 'Published' } : i));
          setSuccess('İçerik onaylandı ve yayına alındı.');
        } catch (err: any) {
          setError(err.message || 'Onaylanırken hata oluştu.');
        } finally {
          setSavingKey(null);
        }
      },
    });
  };

  const handleToggleStatus = (post: any) => {
    const newStatus = post.status === 'Published' ? 'Draft' : 'Published';
    confirm({
      title: newStatus === 'Published' ? 'Yayına Al' : 'Yayından Kaldır (Pasife Al)',
      message: `"${post.title || 'İçeriği'}" ${newStatus === 'Published' ? 'yayına almak' : 'yayından kaldırmak'} istediğinize emin misiniz?`,
      confirmLabel: newStatus === 'Published' ? 'Yayına Al' : 'Yayından Kaldır',
      danger: newStatus !== 'Published',
      onConfirm: async () => {
        setSavingKey(`toggle-${post.id}`);
        try {
          await api.updateSocialPost(post.id, { ...post, status: newStatus });
          setItems(prev => prev.map(i => i.id === post.id ? { ...i, status: newStatus } : i));
          setSuccess(`İçerik ${newStatus === 'Published' ? 'yayına alındı' : 'yayından kaldırıldı (pasife alındı)'}.`);
        } catch (err: any) {
          setError(err.message || 'Durum güncellenirken hata oluştu.');
        } finally {
          setSavingKey(null);
        }
      },
    });
  };

  const handleReject = (post: any) => {
    confirm({
      title: 'İçeriği Reddet',
      message: `"${post.title || 'Videoyu'}" reddetmek istediğinize emin misiniz?`,
      confirmLabel: 'Reddet',
      danger: true,
      onConfirm: async () => {
        setSavingKey(`reject-${post.id}`);
        try {
          await api.rejectSocialPost(post.id, 'Belediye yayın ilkesine uygun değil');
          setItems(prev => prev.map(i => i.id === post.id ? { ...i, status: 'Rejected' } : i));
          setSuccess('İçerik reddedildi.');
        } catch (err: any) {
          setError(err.message || 'Reddedilirken hata oluştu.');
        } finally {
          setSavingKey(null);
        }
      },
    });
  };

  const handleDelete = (post: any) => {
    confirm({
      title: 'İçeriği Sil',
      message: `"${post.title || 'Videoyu'}" kaldırmak ve tamamen silmek istediğinize emin misiniz?`,
      confirmLabel: 'Evet, Sil',
      danger: true,
      onConfirm: async () => {
        setSavingKey(`del-${post.id}`);
        try {
          await api.deleteSocialPost(post.id);
          setItems(prev => prev.filter(i => i.id !== post.id));
          setSuccess('İçerik silindi.');
        } catch (err: any) {
          setError(err.message || 'Silinirken hata oluştu.');
        } finally {
          setSavingKey(null);
        }
      },
    });
  };

  const filteredItems = items.filter((post) => {
    if (activeTab !== 'All' && post.status !== activeTab) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        post.title?.toLowerCase().includes(q) ||
        post.caption?.toLowerCase().includes(q) ||
        post.authorName?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <UnsavedGuard dirty={dirty} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <p className="admin-muted" style={{ margin: 0, maxWidth: 640 }}>
          Bu alandan Şehitkamil+ mobil uygulamasında yer alan <strong>Story</strong> ve <strong>Reels Video</strong> içeriklerini yükleyebilir, düzenleyebilir, pasife alabilir veya silebilirsiniz.
        </p>
        {isAdmin && (
          <Button
            data-testid="social-create-btn"
            onClick={() =>
              open({
                id: undefined,
                type: 'Reels',
                title: '',
                videoUrl: '',
                thumbnailUrl: '',
                imageUrl: '',
                caption: '',
                locationTag: 'Gaziantep / Şehitkamil',
                authorName: 'Şehitkamil Belediyesi',
                publishImmediately: true,
              })
            }
          >
            <Plus size={16} style={{ marginRight: 6 }} /> Yeni Video / Reels Yükle
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--admin-border)', paddingBottom: 8 }}>
        <button
          type="button"
          className={`admin-btn ${activeTab === 'All' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
          onClick={() => setActiveTab('All')}
        >
          Tüm İçerikler ({items.length})
        </button>
        <button
          type="button"
          className={`admin-btn ${activeTab === 'Published' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
          onClick={() => setActiveTab('Published')}
        >
          Yayındakiler
        </button>
        <button
          type="button"
          className={`admin-btn ${activeTab === 'PendingReview' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
          onClick={() => setActiveTab('PendingReview')}
        >
          Onay Bekleyenler
        </button>
        <button
          type="button"
          className={`admin-btn ${activeTab === 'Draft' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
          onClick={() => setActiveTab('Draft')}
        >
          Pasif / Taslak
        </button>
      </div>

      <FilterBar
        search={search}
        onSearch={setSearch}
        activeCount={search ? 1 : 0}
        onClear={() => setSearch('')}
        onSubmit={() => {
          setPage(1);
          void load();
        }}
        filters={<Button type="submit" size="sm">Filtrele</Button>}
      />

      {fail ? <ErrorState error={fail} retry={load} /> : null}

      {filteredItems.length === 0 ? (
        <EmptyState
          title="Sosyal medya içeriği bulunamadı."
          description="Mobil uygulamada gösterilmek üzere yeni bir Reels videosu veya Story görseli yükleyebilirsiniz."
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filteredItems.map((post) => (
            <div key={post.id} className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ position: 'relative', width: '100%', height: 180, borderRadius: 8, overflow: 'hidden', backgroundColor: '#0f172a' }}>
                  <SafeImg
                    src={post.thumbnailUrl || post.imageUrl || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80'}
                    alt={post.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{ position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.7)', color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {post.type === 'Reels' ? <Film size={12} /> : <Video size={12} />}
                    <span>{post.type}</span>
                  </div>

                  {post.videoUrl && (
                    <button
                      type="button"
                      onClick={() => setPreviewMedia(post)}
                      style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 44, height: 44, borderRadius: '50%', backgroundColor: 'rgba(29, 95, 96, 0.9)', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      title="Videoyu Oynat"
                    >
                      <Play size={20} style={{ marginLeft: 2 }} />
                    </button>
                  )}

                  <div
                    style={{
                      position: 'absolute',
                      bottom: 8,
                      right: 8,
                      backgroundColor: post.status === 'Published' ? '#16a34a' : post.status === 'PendingReview' ? '#eab308' : '#64748b',
                      color: '#fff',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {post.status === 'Published' ? 'Yayında' : post.status === 'PendingReview' ? 'Onay Bekliyor' : post.status === 'Rejected' ? 'Reddedildi' : 'Pasif / Taslak'}
                  </div>
                </div>

                <div>
                  <strong style={{ fontSize: 16 }}>{post.title || post.caption?.slice(0, 30) || 'Sosyal Medya Gönderisi'}</strong>
                  <p style={{ fontSize: 13, color: 'var(--admin-muted)', margin: '4px 0 8px 0', lineHeight: 1.4 }}>
                    {post.caption}
                  </p>
                  <div style={{ fontSize: 12, color: 'var(--admin-muted)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Yükleyen: {post.authorName || 'Şehitkamil Belediyesi'}</span>
                    <span>{formatDate(post.createdAt)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 12, fontWeight: 600, color: 'var(--admin-text)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', padding: '2px 8px', borderRadius: 12 }}>
                      ❤️ {(post.likesCount || 0).toLocaleString('tr-TR')} Beğeni
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, backgroundColor: 'rgba(14, 165, 233, 0.1)', color: '#0284c7', padding: '2px 8px', borderRadius: 12 }}>
                      👁️ {(post.viewsCount || 0).toLocaleString('tr-TR')} İzlenme
                    </span>
                  </div>
                </div>
              </div>

              {/* ADMIN CONTROL ACTIONS */}
              <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--admin-border)', paddingTop: 10, flexWrap: 'wrap', justifyContent: 'space-between' }}>
                {post.status === 'PendingReview' ? (
                  <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                    <Button size="sm" style={{ flex: 1 }} loading={savingKey === `approve-${post.id}`} onClick={() => handleApprove(post)}>
                      <CheckCircle size={14} style={{ marginRight: 4 }} /> Onayla
                    </Button>
                    <Button size="sm" variant="danger" style={{ flex: 1 }} loading={savingKey === `reject-${post.id}`} onClick={() => handleReject(post)}>
                      <XCircle size={14} style={{ marginRight: 4 }} /> Reddet
                    </Button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 6, width: '100%', flexWrap: 'wrap' }}>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        open({
                          id: post.id,
                          type: post.type || 'Reels',
                          title: post.title || '',
                          videoUrl: post.videoUrl || '',
                          thumbnailUrl: post.thumbnailUrl || '',
                          imageUrl: post.imageUrl || '',
                          caption: post.caption || '',
                          locationTag: post.locationTag || '',
                          authorName: post.authorName || 'Şehitkamil Belediyesi',
                          publishImmediately: post.status === 'Published',
                        })
                      }
                    >
                      <Edit3 size={13} style={{ marginRight: 4 }} /> Düzenle
                    </Button>

                    <Button
                      size="sm"
                      variant={post.status === 'Published' ? 'secondary' : 'primary'}
                      loading={savingKey === `toggle-${post.id}`}
                      onClick={() => handleToggleStatus(post)}
                    >
                      <Power size={13} style={{ marginRight: 4 }} />
                      {post.status === 'Published' ? 'Pasife Al' : 'Yayına Al'}
                    </Button>

                    <Button
                      size="sm"
                      variant="danger"
                      loading={savingKey === `del-${post.id}`}
                      onClick={() => handleDelete(post)}
                    >
                      <Trash2 size={13} style={{ marginRight: 4 }} /> Sil
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video Preview Modal */}
      <Modal open={!!previewMedia} title={previewMedia?.title || 'Video Önizleme'} size="md" onClose={() => setPreviewMedia(null)}>
        {previewMedia && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
            {previewMedia.videoUrl ? (
              <video src={previewMedia.videoUrl} controls autoPlay style={{ width: '100%', maxHeight: 400, borderRadius: 8, backgroundColor: '#000' }} />
            ) : (
              <img src={previewMedia.imageUrl || previewMedia.thumbnailUrl} alt={previewMedia.title} style={{ width: '100%', maxHeight: 400, objectFit: 'contain', borderRadius: 8 }} />
            )}
            <p style={{ alignSelf: 'flex-start', margin: 0 }}>{previewMedia.caption}</p>
          </div>
        )}
      </Modal>

      {/* Upload / Edit Modal */}
      <Modal
        open={!!form}
        title={form?.id ? 'Sosyal Medya İçeriğini Düzenle' : 'Yeni Reels / Story Yükle'}
        size="lg"
        onClose={close}
        footer={
          <>
            <Button variant="secondary" onClick={close}>
              Vazgeç
            </Button>
            <Button loading={!!savingKey} onClick={() => void (document.getElementById('social-form') as HTMLFormElement | null)?.requestSubmit()}>
              {form?.id ? 'Güncelle' : 'Yayınla'}
            </Button>
          </>
        }
      >
        {form && (
          <form
            id="social-form"
            style={{ display: 'grid', gap: 12 }}
            onSubmit={async (e) => {
              e.preventDefault();
              setSavingKey('social');
              try {
                const payload = {
                  id: form.id,
                  type: form.type,
                  title: form.title,
                  videoUrl: form.videoUrl,
                  thumbnailUrl: form.thumbnailUrl,
                  imageUrl: form.imageUrl,
                  caption: form.caption,
                  locationTag: form.locationTag,
                  authorName: form.authorName,
                  status: form.publishImmediately ? 'Published' : 'Draft',
                };

                if (form.id) {
                  await api.updateSocialPost(form.id, payload);
                  setItems(prev => prev.map(i => i.id === form.id ? { ...i, ...payload } : i));
                  setSuccess('Sosyal medya içeriği başarıyla güncellendi.');
                } else {
                  const res = await api.createSocialPost(payload);
                  const newPost = { ...payload, id: res.id || `soc-${Date.now()}`, createdAt: new Date().toISOString() };
                  setItems(prev => [newPost, ...prev]);
                  setSuccess('Yeni Reels videosu başarıyla yüklendi.');
                }
                setForm(null);
              } catch (err: any) {
                setError(err.message || 'İşlem başarısız.');
              } finally {
                setSavingKey(null);
              }
            }}
          >
            <Select label="İçerik Türü" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="Reels">Video Reels (Dikey Video)</option>
              <option value="Story">Story (Dikey Görsel / Kısa Video)</option>
            </Select>

            <Input required label="Başlık" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Örn: Alleben Göleti Bahar Şenlikleri" />

            <Input
              required={form.type === 'Reels'}
              label="Video Bağlantısı / URL (MP4)"
              value={form.videoUrl || ''}
              onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
              placeholder="https://domain.com/videos/sample.mp4 veya Dosya Seç"
              helper="MP4 video dosyasını bilgisayarınızdan yükleyebilir veya bağlantı yapıştırabilirsiniz."
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -8 }}>
              <label className="admin-btn admin-btn-secondary admin-btn-sm" style={{ cursor: 'pointer', margin: 0, height: 36, display: 'inline-flex', alignItems: 'center' }}>
                📁 Bilgisayardan Video Seç (.mp4)
                <input
                  type="file"
                  accept="video/mp4,video/mov,video/webm"
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setSavingKey('uploading-video');
                    try {
                      const url = await api.uploadFile(file);
                      setForm((prev: any) => ({ ...prev, videoUrl: url }));
                      setSuccess('Video dosyası başarıyla yüklendi.');
                    } catch (err: any) {
                      setError(err.message || 'Video yüklenemedi.');
                    } finally {
                      setSavingKey(null);
                    }
                  }}
                />
              </label>
            </div>

            <Input
              label="Kapak / Önizleme Görseli URL"
              value={form.thumbnailUrl || ''}
              onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })}
              placeholder="https://domain.com/images/cover.jpg veya Görsel Seç"
              helper="Video yüklenirken ilk ekranda görünecek dikey kapak görseli."
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -8 }}>
              <label className="admin-btn admin-btn-secondary admin-btn-sm" style={{ cursor: 'pointer', margin: 0, height: 36, display: 'inline-flex', alignItems: 'center' }}>
                🖼️ Kapak Resmi Seç
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setSavingKey('uploading-thumb');
                    try {
                      const url = await api.uploadFile(file);
                      setForm((prev: any) => ({ ...prev, thumbnailUrl: url }));
                      setSuccess('Kapak görseli yüklendi.');
                    } catch (err: any) {
                      setError(err.message || 'Görsel yüklenemedi.');
                    } finally {
                      setSavingKey(null);
                    }
                  }}
                />
              </label>
            </div>

            <Textarea label="Açıklama / Metin" value={form.caption || ''} onChange={(e) => setForm({ ...form, caption: e.target.value })} placeholder="Videoya ilişkin vatandaşların göreceği açıklama metni..." />

            <Input label="Konum Etiketi" value={form.locationTag || ''} onChange={(e) => setForm({ ...form, locationTag: e.target.value })} placeholder="Örn: Dülük Tabiat Parkı" />

            <Input label="Paylaşan Kişi / Kurum" value={form.authorName || ''} onChange={(e) => setForm({ ...form, authorName: e.target.value })} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <NumberInput
                id="social-likes-count"
                label="Başlangıç Beğeni Sayısı"
                value={form.likesCount ?? 0}
                onChange={(e) => setForm({ ...form, likesCount: parseInt(e.target.value, 10) || 0 })}
              />
              <NumberInput
                id="social-views-count"
                label="Başlangıç İzlenme Sayısı"
                value={form.viewsCount ?? 0}
                onChange={(e) => setForm({ ...form, viewsCount: parseInt(e.target.value, 10) || 0 })}
              />
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
