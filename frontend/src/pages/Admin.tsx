import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { AdminAnalytics } from '../types';
import { 
  ShieldCheck, PlusCircle, Award, Activity, AlertCircle, CheckCircle, 
  Smartphone, Users, Coffee, Building2, Trash2, Edit3, Settings, 
  MapPin, Plus, ListCollapse, ChevronRight
} from 'lucide-react';

interface UserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  pointsBalance: number;
}

interface CafeListItem {
  id: string;
  name: string;
  address: string;
  categoryId: string;
}

interface MenuItemListItem {
  id: string;
  cafeId: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
}

interface RewardListItem {
  id: string;
  title: string;
  description: string;
  requiredPoints: number;
}

interface TaskListItem {
  id: string;
  title: string;
  description: string;
  pointsReward: number;
}

interface ActivityListItem {
  id: string;
  title: string;
  description: string;
  pointsReward: number;
  location: string;
}

export const Admin: React.FC = () => {
  const [activeMenu, setActiveMenu] = useState<'users' | 'cafes' | 'rewards' | 'tasks' | 'pos' | 'reports'>('users');
  
  // Data lists
  const [usersList, setUsersList] = useState<UserListItem[]>([]);
  const [cafesList, setCafesList] = useState<CafeListItem[]>([]);
  const [selectedCafeId, setSelectedCafeId] = useState<string | null>(null);
  const [menuItemsList, setMenuItemsList] = useState<MenuItemListItem[]>([]);
  const [rewardsList, setRewardsList] = useState<RewardListItem[]>([]);
  const [tasksList, setTasksList] = useState<TaskListItem[]>([]);
  const [activitiesList, setActivitiesList] = useState<ActivityListItem[]>([]);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Forms - Cafe
  const [cafeName, setCafeName] = useState('');
  const [cafeAddress, setCafeAddress] = useState('');

  // Forms - Product (MenuItem)
  const [productName, setProductName] = useState('');
  const [productDesc, setProductDesc] = useState('');
  const [productPrice, setProductPrice] = useState(45);

  // Forms - Reward
  const [rewardTitle, setRewardTitle] = useState('');
  const [rewardDesc, setRewardDesc] = useState('');
  const [rewardPoints, setRewardPoints] = useState(50);

  // Forms - Task
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPoints, setTaskPoints] = useState(25);
  const [taskStart, setTaskStart] = useState(new Date().toISOString().substring(0, 10));
  const [taskEnd, setTaskEnd] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10));

  // Forms - Activity
  const [actTitle, setActTitle] = useState('');
  const [actDesc, setActDesc] = useState('');
  const [actPoints, setActPoints] = useState(50);
  const [actLocation, setActLocation] = useState('');

  // Forms - Manual Points
  const [targetUserId, setTargetUserId] = useState('');
  const [grantAmount, setGrantAmount] = useState(50);
  const [grantDesc, setGrantDesc] = useState('Katılım ödül puanı');

  // Forms - QR Simulator
  const [scanQrToken, setScanQrToken] = useState('');
  const [scanCafeId, setScanCafeId] = useState('');
  const [scanAmount, setScanAmount] = useState(120);
  const [scanPaidPoints, setScanPaidPoints] = useState(false);
  const [scanRedeemCode, setScanRedeemCode] = useState('');
  const [scanResult, setScanResult] = useState<any>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const usersData = await api.getUsers();
      setUsersList(usersData);
      
      const cafesData = await api.getCafes();
      setCafesList(cafesData);
      if (cafesData.length > 0 && !selectedCafeId) {
        setSelectedCafeId(cafesData[0].id);
        setScanCafeId(cafesData[0].id);
      }

      const rewardsData = await api.getRewards(1, 100);
      setRewardsList(rewardsData.items);

      const tasksData = await api.getActiveTasks();
      setTasksList(tasksData);

      const actsData = await api.getActivities();
      setActivitiesList(actsData);

      const analyticsData = await api.getAdminAnalytics();
      setAnalytics(analyticsData);
    } catch (e) {
      console.error('Failed to load admin panel data', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuItems = async (cafeId: string) => {
    try {
      const items = await api.getMenuItems(cafeId);
      setMenuItemsList(items);
    } catch (e) {
      console.error('Failed to fetch menu items', e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedCafeId) {
      fetchMenuItems(selectedCafeId);
    }
  }, [selectedCafeId]);

  // Actions - Cafe
  const handleAddCafe = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      await api.createCafe({ name: cafeName, address: cafeAddress });
      setSuccess('Kafe başarıyla eklendi.');
      setCafeName('');
      setCafeAddress('');
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Kafe eklenemedi.');
    }
  };

  const handleDeleteCafe = async (id: string) => {
    if (!window.confirm('Bu kafeyi silmek istediğinizden emin misiniz?')) return;
    setError(null);
    setSuccess(null);
    try {
      await api.deleteCafe(id);
      setSuccess('Kafe başarıyla silindi.');
      if (selectedCafeId === id) setSelectedCafeId(null);
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Kafe silinemedi.');
    }
  };

  // Actions - MenuItem
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCafeId) return;
    setError(null);
    setSuccess(null);
    try {
      await api.createMenuItem(selectedCafeId, {
        name: productName,
        description: productDesc,
        price: productPrice
      });
      setSuccess('Ürün başarıyla eklendi.');
      setProductName('');
      setProductDesc('');
      await fetchMenuItems(selectedCafeId);
    } catch (err: any) {
      setError(err.message || 'Ürün eklenemedi.');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!selectedCafeId || !window.confirm('Bu ürünü silmek istediğinizden emin misiniz?')) return;
    setError(null);
    setSuccess(null);
    try {
      await api.deleteMenuItem(selectedCafeId, productId);
      setSuccess('Ürün başarıyla silindi.');
      await fetchMenuItems(selectedCafeId);
    } catch (err: any) {
      setError(err.message || 'Ürün silinemedi.');
    }
  };

  // Actions - Reward
  const handleAddReward = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      await api.createReward({
        title: rewardTitle,
        description: rewardDesc,
        requiredPoints: rewardPoints
      });
      setSuccess('İkram başarıyla eklendi.');
      setRewardTitle('');
      setRewardDesc('');
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'İkram eklenemedi.');
    }
  };

  const handleDeleteReward = async (id: string) => {
    if (!window.confirm('Bu ikramı silmek istediğinizden emin misiniz?')) return;
    setError(null);
    setSuccess(null);
    try {
      await api.deleteReward(id);
      setSuccess('İkram başarıyla silindi.');
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'İkram silinemedi.');
    }
  };

  // Actions - Task
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      await api.createTask({
        organizationId: '11111111-1111-1111-1111-111111111111',
        title: taskTitle,
        description: taskDesc,
        pointsReward: taskPoints,
        startDate: new Date(taskStart).toISOString(),
        endDate: new Date(taskEnd).toISOString(),
        maxCompletions: 1
      });
      setSuccess('Görev başarıyla eklendi.');
      setTaskTitle('');
      setTaskDesc('');
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Görev eklenemedi.');
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!window.confirm('Bu görevi silmek istediğinizden emin misiniz?')) return;
    setError(null);
    setSuccess(null);
    try {
      await api.deleteTask(id);
      setSuccess('Görev başarıyla silindi.');
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Görev silinemedi.');
    }
  };

  // Actions - Activity
  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      await api.createActivity({
        title: actTitle,
        description: actDesc,
        pointsReward: actPoints,
        location: actLocation,
        startDate: new Date(taskStart).toISOString(),
        endDate: new Date(taskEnd).toISOString(),
      });
      setSuccess('Etkinlik başarıyla eklendi.');
      setActTitle('');
      setActDesc('');
      setActLocation('');
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Etkinlik eklenemedi.');
    }
  };

  const handleDeleteActivity = async (id: string) => {
    if (!window.confirm('Bu etkinliği silmek istediğinizden emin misiniz?')) return;
    setError(null);
    setSuccess(null);
    try {
      await api.deleteActivity(id);
      setSuccess('Etkinlik başarıyla silindi.');
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Etkinlik silinemedi.');
    }
  };

  // Actions - Grant Points
  const handleGrantPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      await api.grantPoints({
        userId: targetUserId,
        amount: grantAmount,
        description: grantDesc
      });
      setSuccess('Vatandaş puanı başarıyla güncellendi.');
      setTargetUserId('');
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Puan güncellenemedi.');
    }
  };

  // Actions - POS scan
  const handleSimulateScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setScanResult(null);
    try {
      const result = await api.scanQr({
        qrToken: scanQrToken,
        cafeId: scanCafeId,
        amount: scanAmount,
        paidWithPoints: scanPaidPoints,
        redeemCode: scanRedeemCode || null
      });
      setScanResult(result);
      setSuccess('Kasa QR işlemi onaylandı.');
      setScanQrToken('');
      setScanRedeemCode('');
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'QR tarama/POS doğrulaması başarısız.');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 70px)', background: 'var(--bg-primary)' }}>
      
      {/* Sidebar Navigation */}
      <aside style={{
        width: '260px',
        backgroundColor: 'var(--accent-sidebar)',
        borderRight: 'none',
        padding: '1.5rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem'
      }}>
        <div style={{ padding: '0 0.75rem 1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={24} color="#3b82f6" />
          <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#ffffff' }}>GölBox Kontrol</span>
        </div>

        <button
          onClick={() => { setActiveMenu('users'); setError(null); setSuccess(null); }}
          className={`sidebar-link ${activeMenu === 'users' ? 'active' : ''}`}
          style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer' }}
        >
          <Users size={18} />
          <span>Vatandaş Yönetimi</span>
        </button>

        <button
          onClick={() => { setActiveMenu('cafes'); setError(null); setSuccess(null); }}
          className={`sidebar-link ${activeMenu === 'cafes' ? 'active' : ''}`}
          style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer' }}
        >
          <Building2 size={18} />
          <span>Kafe & Ürün Yönetimi</span>
        </button>

        <button
          onClick={() => { setActiveMenu('rewards'); setError(null); setSuccess(null); }}
          className={`sidebar-link ${activeMenu === 'rewards' ? 'active' : ''}`}
          style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer' }}
        >
          <Coffee size={18} />
          <span>İkram Kataloğu</span>
        </button>

        <button
          onClick={() => { setActiveMenu('tasks'); setError(null); setSuccess(null); }}
          className={`sidebar-link ${activeMenu === 'tasks' ? 'active' : ''}`}
          style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer' }}
        >
          <PlusCircle size={18} />
          <span>Görevler & Etkinlikler</span>
        </button>

        <button
          onClick={() => { setActiveMenu('pos'); setError(null); setSuccess(null); }}
          className={`sidebar-link ${activeMenu === 'pos' ? 'active' : ''}`}
          style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer' }}
        >
          <Smartphone size={18} />
          <span>Kasiyer / POS Terminali</span>
        </button>

        <button
          onClick={() => { setActiveMenu('reports'); setError(null); setSuccess(null); }}
          className={`sidebar-link ${activeMenu === 'reports' ? 'active' : ''}`}
          style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer' }}
        >
          <Activity size={18} />
          <span>Genel İstatistikler</span>
        </button>
      </aside>

      {/* Main Content Area */}
      <main style={{ flexGrow: 1, padding: '2rem' }}>
        
        {/* Messages */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: 'rgba(239, 68, 68, 0.06)',
            border: '1px solid rgba(239, 68, 68, 0.15)',
            borderRadius: '10px',
            padding: '0.85rem 1rem',
            color: '#ef4444',
            marginBottom: '1.5rem',
            fontSize: '0.85rem',
            textAlign: 'left'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: 'rgba(16, 185, 129, 0.06)',
            border: '1px solid rgba(16, 185, 129, 0.15)',
            borderRadius: '10px',
            padding: '0.85rem 1rem',
            color: 'var(--success)',
            marginBottom: '1.5rem',
            fontSize: '0.85rem',
            textAlign: 'left'
          }}>
            <CheckCircle size={16} />
            <span>{success}</span>
          </div>
        )}

        {/* 1. Vatandaş Yönetimi (Users) */}
        {activeMenu === 'users' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="glass-card" style={{ textAlign: 'left' }}>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.25rem' }}>Kayıtlı Vatandaşlar</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Sistemdeki aktif kullanıcılar ve anlık puan bakiyeleri.
              </p>
              
              <div style={{ overflowX: 'auto' }}>
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Vatandaş Ad Soyad</th>
                      <th>E-Posta</th>
                      <th>Güncel Bakiye</th>
                      <th style={{ textAlign: 'right' }}>Hızlı İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map((u) => (
                      <tr key={u.id}>
                        <td style={{ fontWeight: 600 }}>{u.firstName} {u.lastName}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                        <td style={{ fontWeight: 700, color: 'var(--accent-orange)' }}>{u.pointsBalance} GP</td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => {
                              setTargetUserId(u.id);
                              setGrantDesc('Belediye katılım ödülü');
                            }}
                            className="btn btn-secondary"
                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                          >
                            Puan Yükle
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Grant Points Form */}
            {targetUserId && (
              <div className="glass-card animate-fade-in" style={{ textAlign: 'left', maxWidth: '600px' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Award size={18} color="var(--accent-orange)" />
                  <span>Puan Yükleme/Düşme Formu</span>
                </h3>
                <form onSubmit={handleGrantPoints} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Kullanıcı ID (GUID)</label>
                    <input type="text" className="form-input" value={targetUserId} disabled />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Tutar (+/-)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={grantAmount}
                        onChange={(e) => setGrantAmount(Number(e.target.value))}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Açıklama</label>
                      <input
                        type="text"
                        className="form-input"
                        value={grantDesc}
                        onChange={(e) => setGrantDesc(e.target.value)}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => setTargetUserId('')} className="btn btn-secondary">İptal</button>
                    <button type="submit" className="btn btn-primary">Bakiyeyi Güncelle</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* 2. Kafe & Ürün Yönetimi (Cafes & Menu Items) */}
        {activeMenu === 'cafes' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="dashboard-grid">
            
            {/* Left Column: Cafes list and Add Cafe Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Add Cafe Form */}
              <div className="glass-card" style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Yeni Şube (Kafe) Ekle</h3>
                <form onSubmit={handleAddCafe} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Şube Adı</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={cafeName}
                      onChange={(e) => setCafeName(e.target.value)}
                      placeholder="Örn: Mogan Kitap Kafe"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Adres</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={cafeAddress}
                      onChange={(e) => setCafeAddress(e.target.value)}
                      placeholder="Şube açık adresi..."
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
                    Şubeyi Kaydet
                  </button>
                </form>
              </div>

              {/* Cafes Table */}
              <div className="glass-card" style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Aktif Şubeler</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {cafesList.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCafeId(c.id)}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: '10px',
                        border: '1px solid',
                        borderColor: selectedCafeId === c.id ? 'var(--accent-primary)' : 'var(--border-color)',
                        background: selectedCafeId === c.id ? 'rgba(37, 99, 235, 0.05)' : '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.2rem' }}>
                          <MapPin size={12} />
                          <span>{c.address}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteCafe(c.id); }}
                          style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--error)' }}
                        >
                          <Trash2 size={16} />
                        </button>
                        <ChevronRight size={16} color="var(--text-muted)" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Column: Menu Items list for selected Cafe */}
            <div className="glass-card" style={{ textAlign: 'left' }}>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.25rem' }}>Ismarlıyor Ürünleri</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                  {selectedCafeId 
                    ? `"${cafesList.find(c => c.id === selectedCafeId)?.name}" şubesinin menü listesi.`
                    : 'Lütfen sol taraftan bir kafe şubesi seçin.'
                  }
                </p>
              </div>

              {selectedCafeId && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  
                  {/* Add Product Form */}
                  <form onSubmit={handleAddProduct} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.75rem', alignItems: 'end', background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '10px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Ürün Adı</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        placeholder="Türk Kahvesi"
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Fiyat (TL)</label>
                      <input
                        type="number"
                        required
                        className="form-input"
                        value={productPrice}
                        onChange={(e) => setProductPrice(Number(e.target.value))}
                      />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem', display: 'flex', gap: '0.25rem' }}>
                      <Plus size={16} />
                      Ekle
                    </button>
                  </form>

                  {/* Products List */}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {menuItemsList.length === 0 ? (
                      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Bu şubeye henüz bir ürün eklenmemiş.
                      </div>
                    ) : (
                      menuItemsList.map((item) => (
                        <div key={item.id} className="action-item" style={{ padding: '0.75rem 0' }}>
                          <div>
                            <div style={{ fontWeight: 600 }}>{item.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.description || 'Açıklama yok'}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.price} TL</div>
                            <button
                              onClick={() => handleDeleteProduct(item.id)}
                              style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--error)' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                </div>
              )}
            </div>

          </div>
        )}

        {/* 3. İkram Kataloğu Yönetimi (Rewards) */}
        {activeMenu === 'rewards' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="dashboard-grid">
            
            {/* Add Reward Form */}
            <div className="glass-card" style={{ textAlign: 'left', height: 'fit-content' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>Yeni İkram Ödülü Tanımla</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Vatandaşların GölPuan'larını harcayarak alabileceği ikram kupon ödülü.
              </p>

              <form onSubmit={handleAddReward} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">İkram Başlığı</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={rewardTitle}
                    onChange={(e) => setRewardTitle(e.target.value)}
                    placeholder="Örn: Dilim Pasta"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Açıklama</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={rewardDesc}
                    onChange={(e) => setRewardDesc(e.target.value)}
                    placeholder="Ödül detay açıklaması..."
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Gerekli GölPuan</label>
                  <input
                    type="number"
                    required
                    className="form-input"
                    value={rewardPoints}
                    onChange={(e) => setRewardPoints(Number(e.target.value))}
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem', marginTop: '0.5rem' }}>
                  Kataloğa Ekle
                </button>
              </form>
            </div>

            {/* Rewards Table */}
            <div className="glass-card" style={{ textAlign: 'left' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>Katalogdaki Aktif İkramlar</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {rewardsList.map((r) => (
                  <div key={r.id} className="action-item">
                    <div>
                      <div style={{ fontWeight: 600 }}>{r.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{r.description}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--accent-orange)' }}>{r.requiredPoints} GP</div>
                      <button
                        onClick={() => handleDeleteReward(r.id)}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--error)' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* 4. Görevler & Etkinlikler (Tasks & Activities) */}
        {activeMenu === 'tasks' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="dashboard-grid">
            
            {/* Left Column: Tasks CRUD */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Task Form */}
              <div className="glass-card" style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Yeni Sadakat Görevi Tanımla</h3>
                <form onSubmit={handleAddTask} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Görev Başlığı</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      placeholder="Örn: 5 Sayfa Kitap Oku"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Açıklama</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={taskDesc}
                      onChange={(e) => setTaskDesc(e.target.value)}
                      placeholder="Yapılması gereken detay..."
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Puan Ödülü</label>
                    <input
                      type="number"
                      required
                      className="form-input"
                      value={taskPoints}
                      onChange={(e) => setTaskPoints(Number(e.target.value))}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem' }}>Görev Yayınla</button>
                </form>
              </div>

              {/* Tasks List */}
              <div className="glass-card" style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Aktif Görevler</h3>
                {tasksList.map((t) => (
                  <div key={t.id} className="action-item">
                    <div>
                      <div style={{ fontWeight: 600 }}>{t.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t.description}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--success)' }}>+{t.pointsReward} GP</div>
                      <button
                        onClick={() => handleDeleteTask(t.id)}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--error)' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>

            {/* Right Column: Activities CRUD */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Activity Form */}
              <div className="glass-card" style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Yeni Etkinlik Ekle</h3>
                <form onSubmit={handleAddActivity} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Etkinlik Adı</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={actTitle}
                      onChange={(e) => setActTitle(e.target.value)}
                      placeholder="Örn: Mogan Gölü Temizliği"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Açıklama</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={actDesc}
                      onChange={(e) => setActDesc(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Puan Ödülü</label>
                      <input
                        type="number"
                        required
                        className="form-input"
                        value={actPoints}
                        onChange={(e) => setActPoints(Number(e.target.value))}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Konum / Yer</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        value={actLocation}
                        onChange={(e) => setActLocation(e.target.value)}
                        placeholder="Mogan Amfi Tiyatro"
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem' }}>Etkinliği Yayınla</button>
                </form>
              </div>

              {/* Activities List */}
              <div className="glass-card" style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Yaklaşan Etkinlikler</h3>
                {activitiesList.map((a) => (
                  <div key={a.id} className="action-item">
                    <div>
                      <div style={{ fontWeight: 600 }}>{a.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{a.location} - {a.description}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ fontWeight: 700, color: '#8b5cf6' }}>+{a.pointsReward} GP</div>
                      <button
                        onClick={() => handleDeleteActivity(a.id)}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--error)' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>

          </div>
        )}

        {/* 5. Kasiyer / POS Terminali */}
        {activeMenu === 'pos' && (
          <div className="glass-card" style={{ textAlign: 'left', maxWidth: '800px', margin: '0 auto' }}>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Smartphone size={20} color="var(--accent-orange)" />
              <span>Kafe / Kasa Onay Ekranı</span>
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Kitap Kafe kasalarında vatandaşın dijital kimlik QR kodu veya ikram kodu ile yapılacak ödeme doğrulamaları.
            </p>

            <form onSubmit={handleSimulateScan} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Müşteri QR Kod Verisi (veya ID)</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={scanQrToken}
                    onChange={(e) => setScanQrToken(e.target.value)}
                    placeholder="Müşteri QR Kodu veya GUID"
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                    Normal Kullanıcı ID: 88888888-8888-8888-8888-888888888888
                  </span>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">İşlem Yapılan Kafe Şubesi</label>
                  <select
                    className="form-input"
                    value={scanCafeId}
                    onChange={(e) => setScanCafeId(e.target.value)}
                    style={{ height: '42px' }}
                  >
                    {cafesList.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Hesap / Alışveriş Tutarı (TL)</label>
                  <input
                    type="number"
                    required
                    className="form-input"
                    value={scanAmount}
                    onChange={(e) => setScanAmount(Number(e.target.value))}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Kupon / İkram Kodu (Opsiyonel)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={scanRedeemCode}
                    onChange={(e) => setScanRedeemCode(e.target.value)}
                    placeholder="GB-CLAIM-XXXXXX"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-tertiary)', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                <input
                  type="checkbox"
                  id="paidPoints"
                  checked={scanPaidPoints}
                  onChange={(e) => setScanPaidPoints(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="paidPoints" style={{ fontSize: '0.9rem', cursor: 'pointer', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Ödemeyi biriken sadakat puanları ile yap (Puanla Ödeme)
                </label>
              </div>

              <button type="submit" className="btn btn-primary" style={{ padding: '0.85rem' }}>
                Kasa QR İşlemini Gerçekleştir
              </button>
            </form>

            {/* Scan Results View */}
            {scanResult && (
              <div style={{
                marginTop: '1.5rem',
                padding: '1.25rem',
                background: 'rgba(16, 185, 129, 0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }}>
                <h4 style={{ margin: '0 0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--success)' }}>
                  <CheckCircle size={16} />
                  <span>Kasa Onay Raporu</span>
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <div>İşlem Tutarı: <strong>{scanResult.amount} TL</strong></div>
                  <div>Harcanan Puan: <strong style={{ color: 'var(--error)' }}>{scanResult.pointsDeducted} GP</strong></div>
                  <div>Kazanılan Puan: <strong style={{ color: 'var(--success)' }}>{scanResult.pointsEarned} GP</strong></div>
                  <div>Kullanıcı Yeni Bakiye: <strong>{scanResult.newPointsBalance} GP</strong></div>
                  <div>İşlem Durumu: <strong style={{ textTransform: 'uppercase' }}>{scanResult.status}</strong></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 6. Genel İstatistikler (Reports) */}
        {activeMenu === 'reports' && analytics && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
              <div className="glass-card" style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TOPLAM KAYITLI ÜYE</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem' }}>{analytics.totalUsersCount} Vatandaş</div>
              </div>
              <div className="glass-card" style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>DAĞITILAN PUAN</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--success)', marginTop: '0.25rem' }}>{analytics.totalPointsDistributed} GP</div>
              </div>
              <div className="glass-card" style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>HARCANAN PUAN</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--error)', marginTop: '0.25rem' }}>{analytics.totalPointsRedeemed} GP</div>
              </div>
            </div>

            {/* Popular lists */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="dashboard-grid">
              
              <div className="glass-card" style={{ textAlign: 'left' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Şubelere Göre Ziyaret ve Ciro</h3>
                {analytics.topCafes.map((tc, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ fontWeight: 500 }}>{tc.cafeName}</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{tc.visitCount} Ziyaret ({tc.totalSalesAmount} TL)</span>
                  </div>
                ))}
              </div>

              <div className="glass-card" style={{ textAlign: 'left' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>En Popüler İkram Talepleri</h3>
                {analytics.topRewards.map((tr, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ fontWeight: 500 }}>{tr.rewardTitle}</span>
                    <span style={{ fontWeight: 600, color: 'var(--accent-orange)' }}>{tr.claimCount} Adet</span>
                  </div>
                ))}
              </div>

            </div>

          </div>
        )}

      </main>

    </div>
  );
};
