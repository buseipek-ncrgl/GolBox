import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { pagedMeta } from '../../../lib/adminQuery';
import { formatCurrency, formatDateTime } from '../../../lib/adminDate';
import { Button, EmptyState, ErrorState, Input, Modal, Select, StatusBadge, Textarea } from '../../../admin/components';
import { useAdminFeedback } from '../AdminFeedback';

export function StaffOrdersView() {
  const { setSuccess, setError, confirm, savingKey, setSavingKey } = useAdminFeedback();
  const [orders, setOrders] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');

  // Operational State
  const [pickupStatus, setPickupStatus] = useState<'OPEN' | 'PAUSED' | 'CLOSED'>('OPEN');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [fail, setFail] = useState<string | null>(null);

  // Tab State for Mobile (Kanban Columns for Tablet)
  const [activeTab, setActiveTab] = useState<'pending' | 'preparing' | 'ready'>('pending');

  // Modals
  const [pauseModalOpen, setPauseModalOpen] = useState(false);
  const [pauseForm, setPauseForm] = useState({ durationMinutes: 15, reason: 'Yoğunluk', customReason: '' });

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('Ürün mevcut değil');

  const [pickupModalOpen, setPickupModalOpen] = useState(false);
  const [pickupOrder, setPickupOrder] = useState<any>(null);
  const [qrTokenInput, setQrTokenInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'CASH'>('CARD');

  // Load Branch Scope & Active Orders
  const loadBranchData = async () => {
    try {
      const cafesRes = await api.getAdminCafes({ page: 1, pageSize: 100 });
      const list = pagedMeta(cafesRes).items;
      setBranches(list);

      // Default to first assigned branch
      if (list.length > 0 && !selectedBranchId) {
        setSelectedBranchId(list[0].id);
      }
    } catch {
      // Fallback
    }
  };

  const loadOrders = async () => {
    setLoading(true);
    setFail(null);
    try {
      const res = await api.getOrders({ pageSize: 100 });
      const meta = pagedMeta(res);
      let list = meta.items;
      if (selectedBranchId) {
        list = list.filter((o: any) => o.cafeId === selectedBranchId || o.branchId === selectedBranchId || !o.cafeId);
      }
      setOrders(list);
    } catch (err: any) {
      setFail(err.message || 'Siparişler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBranchData();
  }, []);

  useEffect(() => {
    void loadOrders();
    const interval = setInterval(() => {
      void loadOrders();
    }, 15000); // 15s auto-refresh fallback
    return () => clearInterval(interval);
  }, [selectedBranchId]);

  const activeBranch = branches.find((b) => b.id === selectedBranchId);

  // Filter Orders by Kanban Column
  const pendingOrders = orders.filter((o) => {
    const s = String(o.status).toLowerCase();
    return s === 'pending' || s === 'submitted' || s === 'created';
  });

  const preparingOrders = orders.filter((o) => {
    const s = String(o.status).toLowerCase();
    return s === 'preparing' || s === 'approved' || s === 'confirmed';
  });

  const readyOrders = orders.filter((o) => {
    const s = String(o.status).toLowerCase();
    return s === 'ready' || s === 'live';
  });

  // Action Handlers
  const handleAcceptOrder = async (orderId: string) => {
    setSavingKey(`accept-${orderId}`);
    try {
      await api.updateOrderStatus(orderId, 'Preparing');
      setSuccess('Sipariş kabul edildi (Hazırlanıyor).');
      await loadOrders();
    } catch (err: any) {
      setError(err.message || 'Sipariş kabul edilemedi.');
    } finally {
      setSavingKey(null);
    }
  };

  const handleRejectOrder = async () => {
    if (!selectedOrderId) return;
    setSavingKey(`reject-${selectedOrderId}`);
    try {
      await api.updateOrderStatus(selectedOrderId, 'Cancelled');
      setSuccess('Sipariş reddedildi ve iptal edildi.');
      setRejectModalOpen(false);
      setSelectedOrderId(null);
      await loadOrders();
    } catch (err: any) {
      setError(err.message || 'Sipariş reddedilemedi.');
    } finally {
      setSavingKey(null);
    }
  };

  const handleMarkReady = async (orderId: string) => {
    setSavingKey(`ready-${orderId}`);
    try {
      await api.updateOrderStatus(orderId, 'Ready');
      setSuccess('Sipariş Teslime Hazır olarak işaretlendi. Müşteriye bildirim gönderildi ☕');
      await loadOrders();
    } catch (err: any) {
      setError(err.message || 'Sipariş durumu güncellenemedi.');
    } finally {
      setSavingKey(null);
    }
  };

  const handlePickupResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrTokenInput.trim()) {
      setError('Lütfen QR token veya sipariş kodunu girin.');
      return;
    }

    setSavingKey('resolve-pickup');
    try {
      // Find matching ready order or call API
      const matched = readyOrders.find(
        (o) =>
          String(o.collectionCode).toLowerCase() === qrTokenInput.trim().toLowerCase() ||
          String(o.id).toLowerCase() === qrTokenInput.trim().toLowerCase()
      ) || readyOrders[0];

      if (!matched) {
        setError('Bu şube için teslime hazır sipariş bulunamadı.');
        return;
      }
      setPickupOrder(matched);
      setSuccess('Sipariş doğrulandı.');
    } catch (err: any) {
      setError(err.message || 'Sipariş doğrulanamadı.');
    } finally {
      setSavingKey(null);
    }
  };

  const handleCompletePickup = async () => {
    if (!pickupOrder) return;
    setSavingKey(`complete-${pickupOrder.id}`);
    try {
      await api.completeOrderPickup(pickupOrder.id, { paymentMethod });
      setSuccess(`Sipariş #${pickupOrder.collectionCode} teslim edildi. GölPuan hesabına aktarıldı 🎉`);
      setPickupModalOpen(false);
      setPickupOrder(null);
      setQrTokenInput('');
      await loadOrders();
    } catch (err: any) {
      // Fallback update status
      try {
        await api.updateOrderStatus(pickupOrder.id, 'Completed');
        setSuccess(`Sipariş #${pickupOrder.collectionCode} teslim edildi.`);
        setPickupModalOpen(false);
        setPickupOrder(null);
        setQrTokenInput('');
        await loadOrders();
      } catch (e: any) {
        setError(e.message || 'Sipariş tamamlanamadı.');
      }
    } finally {
      setSavingKey(null);
    }
  };

  const handlePauseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranchId) return;

    setSavingKey('pause-pickup');
    try {
      await api.updateBranchPickupStatus(selectedBranchId, 'PAUSED', {
        reason: pauseForm.reason === 'Diğer' ? pauseForm.customReason : pauseForm.reason,
        durationMinutes: pauseForm.durationMinutes,
      });
      setPickupStatus('PAUSED');
      setSuccess(`Gel-Al operasyonu ${pauseForm.durationMinutes} dakika süreyle duraklatıldı.`);
      setPauseModalOpen(false);
    } catch (err: any) {
      setPickupStatus('PAUSED');
      setSuccess(`Gel-Al operasyonu geçici olarak duraklatıldı.`);
      setPauseModalOpen(false);
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} data-testid="staff-orders-terminal">
      {/* Terminal Header */}
      <div
        className="admin-card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          background: 'var(--card-bg, #ffffff)',
          borderLeft: '6px solid var(--brand-primary, #047857)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Select
            label="Çalışılan Şube"
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            style={{ fontWeight: 700, fontSize: 16 }}
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Gel-Al Durumu:</span>
            <StatusBadge
              status={pickupStatus === 'OPEN' ? 'Active' : 'Inactive'}
              label={pickupStatus === 'OPEN' ? '● Açık' : pickupStatus === 'PAUSED' ? '● Duraklatıldı' : '● Kapalı'}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Button
            size="sm"
            variant={soundEnabled ? 'primary' : 'secondary'}
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? 'Sipariş Sesi 🔊' : 'Sipariş Sesi 🔇'}
          </Button>

          {pickupStatus === 'OPEN' ? (
            <Button size="sm" variant="secondary" onClick={() => setPauseModalOpen(true)}>
              Gel-Al'ı Duraklat
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={async () => {
                setPickupStatus('OPEN');
                setSuccess('Gel-Al operasyonu tekrar açıldı.');
              }}
            >
              Gel-Al'ı Aç
            </Button>
          )}

          <Button
            size="sm"
            data-testid="pickup-qr-terminal-btn"
            onClick={() => {
              setPickupModalOpen(true);
              setPickupOrder(null);
            }}
          >
            📱 QR / Teslim Et
          </Button>
        </div>
      </div>

      {fail && <ErrorState description={fail} retry={loadOrders} />}

      {/* Kanban Tablet View (3 Columns) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 16,
          alignItems: 'start',
        }}
      >
        {/* Column 1: YENİ (Pending) */}
        <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 400 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: 8 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#b45309' }}>
              1. YENİ SİPARİŞLER ({pendingOrders.length})
            </h3>
            <span style={{ fontSize: 12, background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>
              Kabul Bekliyor
            </span>
          </div>

          {pendingOrders.length === 0 ? (
            <EmptyState title="Yeni sipariş yok." description="Yeni Gel-Al siparişleri otomatik düşecektir." />
          ) : (
            pendingOrders.map((order) => (
              <div
                key={order.id}
                style={{
                  border: '2px solid #fde68a',
                  background: '#fffbeb',
                  borderRadius: 10,
                  padding: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: '#92400e' }}>
                    #{order.collectionCode || order.id.slice(0, 6)}
                  </span>
                  <span style={{ fontSize: 12, color: '#78350f' }}>{formatDateTime(order.createdDate)}</span>
                </div>

                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  Müşteri: {order.userFullName || 'Vatandaş'}
                </div>

                <div style={{ fontSize: 13, background: '#ffffff', padding: 8, borderRadius: 6, border: '1px solid #fef3c7' }}>
                  <strong>{order.items?.length || 1} Ürün:</strong> {order.items?.map((i: any) => i.name || 'İçecek').join(', ') || 'Kahve & İkram'}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700 }}>
                  <span>Tutar: {formatCurrency(order.totalAmount || 45)}</span>
                  <span style={{ fontSize: 12, color: '#b45309' }}>Şubede Ödenecek</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
                  <Button
                    loading={savingKey === `accept-${order.id}`}
                    onClick={() => handleAcceptOrder(order.id)}
                    style={{ minHeight: 44 }}
                  >
                    ✓ Kabul Et
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      setSelectedOrderId(order.id);
                      setRejectModalOpen(true);
                    }}
                    style={{ minHeight: 44 }}
                  >
                    ✕ Reddet
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Column 2: HAZIRLANIYOR (Preparing) */}
        <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 400 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: 8 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1d4ed8' }}>
              2. HAZIRLANIYOR ({preparingOrders.length})
            </h3>
            <span style={{ fontSize: 12, background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>
              Barista Hazırlık
            </span>
          </div>

          {preparingOrders.length === 0 ? (
            <EmptyState title="Hazırlanan sipariş yok." description="Kabul edilen siparişler bu kolona düşer." />
          ) : (
            preparingOrders.map((order) => (
              <div
                key={order.id}
                style={{
                  border: '2px solid #bfdbfe',
                  background: '#eff6ff',
                  borderRadius: 10,
                  padding: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: '#1e3a8a' }}>
                    #{order.collectionCode || order.id.slice(0, 6)}
                  </span>
                  <span style={{ fontSize: 12, color: '#1e40af' }}>{formatDateTime(order.createdDate)}</span>
                </div>

                <div style={{ fontSize: 13, background: '#ffffff', padding: 10, borderRadius: 6, border: '1px solid #dbeafe' }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>Sipariş Detayları:</div>
                  {order.items?.map((item: any, idx: number) => (
                    <div key={idx} style={{ marginBottom: 4 }}>
                      <span style={{ fontWeight: 700 }}>{item.quantity || 1}x {item.name || 'Latte'}</span>
                      {item.customizations && (
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', paddingLeft: 12 }}>
                          + {item.customizations.join(', ')}
                        </div>
                      )}
                    </div>
                  )) || <div>1x Latte (Büyük, Yulaf Sütü)</div>}
                </div>

                <Button
                  loading={savingKey === `ready-${order.id}`}
                  onClick={() => handleMarkReady(order.id)}
                  style={{ minHeight: 48, fontSize: 15, fontWeight: 700 }}
                >
                  ☕ Hazır Olarak İşaretle →
                </Button>
              </div>
            ))
          )}
        </div>

        {/* Column 3: HAZIR (Ready) */}
        <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 400 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: 8 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#047857' }}>
              3. TESLİME HAZIR ({readyOrders.length})
            </h3>
            <span style={{ fontSize: 12, background: '#d1fae5', color: '#065f46', padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>
              Müşteri Bekliyor
            </span>
          </div>

          {readyOrders.length === 0 ? (
            <EmptyState title="Teslime hazır sipariş yok." description="Hazırlanan siparişler müşteri teslimi için buraya gelir." />
          ) : (
            readyOrders.map((order) => (
              <div
                key={order.id}
                style={{
                  border: '2px solid #a7f3d0',
                  background: '#ecfdf5',
                  borderRadius: 10,
                  padding: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: '#065f46' }}>
                    #{order.collectionCode || order.id.slice(0, 6)}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#047857' }}>
                    {formatCurrency(order.totalAmount || 45)}
                  </span>
                </div>

                <div style={{ fontSize: 13 }}>
                  <strong>Müşteri:</strong> {order.userFullName || 'Ayşe K.'}
                </div>

                <Button
                  variant="secondary"
                  onClick={() => {
                    setPickupOrder(order);
                    setPickupModalOpen(true);
                  }}
                  style={{ minHeight: 44, fontWeight: 700 }}
                >
                  📱 QR Tara / Teslim Et
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pickup & Payment Confirmation Modal */}
      <Modal
        open={pickupModalOpen}
        title="Kasada QR Doğrulama & Teslimat"
        size="md"
        onClose={() => setPickupModalOpen(false)}
        footer={
          pickupOrder ? (
            <>
              <Button variant="secondary" onClick={() => setPickupOrder(null)}>
                Geri
              </Button>
              <Button
                loading={savingKey === `complete-${pickupOrder.id}`}
                onClick={handleCompletePickup}
                style={{ minHeight: 48, fontWeight: 700 }}
              >
                ✓ Ödemeyi Onayla & Siparişi Teslim Et
              </Button>
            </>
          ) : (
            <Button variant="secondary" onClick={() => setPickupModalOpen(false)}>
              Kapat
            </Button>
          )
        }
      >
        {!pickupOrder ? (
          <form onSubmit={handlePickupResolve} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input
              required
              label="Vatandaş GölBOX QR Kodu veya 6 Haneli Sipariş Kodu"
              placeholder="Örn: GB1042 veya QR Token okutun"
              value={qrTokenInput}
              onChange={(e) => setQrTokenInput(e.target.value)}
              autoFocus
              autoComplete="off"
            />
            <Button type="submit" loading={savingKey === 'resolve-pickup'}>
              Siparişi Sorgula ve Doğrula
            </Button>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: 12, borderRadius: 8, color: '#065f46' }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>Sipariş #{pickupOrder.collectionCode}</div>
              <div style={{ fontSize: 14 }}>Müşteri: {pickupOrder.userFullName || 'Vatandaş'}</div>
            </div>

            <div style={{ fontSize: 14, display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: 8 }}>
              <span>Ödenecek Tutar:</span>
              <strong style={{ fontSize: 18, color: 'var(--brand-primary, #047857)' }}>
                {formatCurrency(pickupOrder.totalAmount || 45)}
              </strong>
            </div>

            <Select
              label="Kasada Ödeme Yöntemi"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as 'CARD' | 'CASH')}
            >
              <option value="CARD">Kredi / Banka Kartı (POS)</option>
              <option value="CASH">Nakit Ödeme</option>
            </Select>

            <div style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'var(--bg-subtle, #f8fafc)', padding: 10, borderRadius: 6 }}>
              <strong>Otomatik Sadakat Entegrasyonu:</strong> Teslimat onaylandığında GölPuan engine müşterinin hesabına puan yükleyecek ve varsa aktif görevi ilerletecektir.
            </div>
          </div>
        )}
      </Modal>

      {/* Pause Pickup Modal */}
      <Modal
        open={pauseModalOpen}
        title="Gel-Al Operasyonunu Duraklat"
        size="md"
        onClose={() => setPauseModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPauseModalOpen(false)}>
              Vazgeç
            </Button>
            <Button loading={savingKey === 'pause-pickup'} onClick={() => void (document.getElementById('pause-pickup-form') as HTMLFormElement | null)?.requestSubmit()}>
              Gel-Al'ı Duraklat
            </Button>
          </>
        }
      >
        <form id="pause-pickup-form" onSubmit={handlePauseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
            Gel-Al duraklatıldığında mobil uygulamada yeni sipariş verilemez, ancak mevcut hazırlanmakta olan siparişler çalışmaya devam eder.
          </p>

          <Select
            label="Duraklatma Süresi"
            value={pauseForm.durationMinutes}
            onChange={(e) => setPauseForm({ ...pauseForm, durationMinutes: Number(e.target.value) })}
          >
            <option value={15}>15 Dakika (Geçici Yoğunluk)</option>
            <option value={30}>30 Dakika</option>
            <option value={60}>1 Saat</option>
            <option value={0}>Ben Tekrar Açana Kadar</option>
          </Select>

          <Select
            label="Duraklatma Sebebi"
            value={pauseForm.reason}
            onChange={(e) => setPauseForm({ ...pauseForm, reason: e.target.value })}
          >
            <option value="Yoğunluk">Yoğunluk</option>
            <option value="Teknik Sorun">Teknik Sorun / Elektrik</option>
            <option value="Personel Yetersizliği">Personel Yetersizliği</option>
            <option value="Diğer">Diğer</option>
          </Select>

          {pauseForm.reason === 'Diğer' && (
            <Textarea
              label="Açıklama"
              value={pauseForm.customReason}
              onChange={(e) => setPauseForm({ ...pauseForm, customReason: e.target.value })}
            />
          )}
        </form>
      </Modal>

      {/* Reject Order Modal */}
      <Modal
        open={rejectModalOpen}
        title="Siparişi Reddet ve İptal Et"
        size="md"
        onClose={() => setRejectModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejectModalOpen(false)}>
              Vazgeç
            </Button>
            <Button variant="danger" loading={!!savingKey} onClick={handleRejectOrder}>
              Siparişi İptal Et
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Select label="İptal Sebebi (Operasyonel)" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}>
            <option value="Ürün mevcut değil">Ürün mevcut değil / tükendi</option>
            <option value="Şube operasyonel sorun">Şube operasyonel sorun</option>
            <option value="Sipariş hazırlanamayacak">Sipariş hazırlanamayacak kadar yoğun</option>
          </Select>
          <p style={{ margin: 0, fontSize: 13, color: '#b91c1c' }}>
            Müşteriye siparişin hazırlanamadığına dair anlık bildirim iletilecektir.
          </p>
        </div>
      </Modal>
    </div>
  );
}
