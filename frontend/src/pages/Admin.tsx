import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../store/AuthContext';
import { 
  ShieldCheck, Award, Activity, AlertCircle, CheckCircle, 
  Smartphone, Users, Coffee, Building2, Trash2, Settings, 
  MapPin, Plus, ChevronRight, LogOut, Calendar, PlusCircle,
  ShoppingBag, Eye
} from 'lucide-react';

interface UserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  pointsBalance: number;
  age?: number;
  educationLevel?: string;
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
  minAge?: number;
  maxAge?: number;
  requiredEducation?: string;
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
  const { logout, user: currentUser } = useAuth();
  const [activeMenu, setActiveMenu] = useState<'users' | 'cafes' | 'products' | 'rewards' | 'tasks' | 'activities' | 'settings' | 'pos' | 'orders'>('users');
  
  // Data lists
  const [usersList, setUsersList] = useState<UserListItem[]>([]);
  const [cafesList, setCafesList] = useState<CafeListItem[]>([]);
  const [selectedCafeId, setSelectedCafeId] = useState<string | null>(null);
  const [menuItemsList, setMenuItemsList] = useState<MenuItemListItem[]>([]);
  const [rewardsList, setRewardsList] = useState<RewardListItem[]>([]);
  const [tasksList, setTasksList] = useState<TaskListItem[]>([]);
  const [activitiesList, setActivitiesList] = useState<ActivityListItem[]>([]);
  const [ordersList, setOrdersList] = useState<any[]>([]);
  
  // Settings values
  const [rewardExpireDays, setRewardExpireDays] = useState('30');
  const [visitBonusPoints, setVisitBonusPoints] = useState('15');
  const [pointsExchangeRate, setPointsExchangeRate] = useState('1');
  const [spendEarnRatePercent, setSpendEarnRatePercent] = useState('10');

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
  const [productImageUrl, setProductImageUrl] = useState('');
  const [productMinAge, setProductMinAge] = useState<number | ''>('');
  const [productMaxAge, setProductMaxAge] = useState<number | ''>('');
  const [productReqEdu, setProductReqEdu] = useState('');

  // Forms - Manual Order Creation
  const [orderUserId, setOrderUserId] = useState('');
  const [orderCafeId, setOrderCafeId] = useState('');
  const [orderMenuItemId, setOrderMenuItemId] = useState('');
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderPaidWithPoints, setOrderPaidWithPoints] = useState(false);
  const [orderImageUrl, setOrderImageUrl] = useState('');
  const [orderCafeMenuItems, setOrderCafeMenuItems] = useState<MenuItemListItem[]>([]);

  // Forms - Reward Definition
  const [rewardTitle, setRewardTitle] = useState('');
  const [rewardDesc, setRewardDesc] = useState('');
  const [rewardPoints, setRewardPoints] = useState(50);

  // Forms - Task Definition
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPoints, setTaskPoints] = useState(25);
  const [taskStart, setTaskStart] = useState(new Date().toISOString().substring(0, 10));
  const [taskEnd, setTaskEnd] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10));

  // Forms - Activity Definition
  const [actTitle, setActTitle] = useState('');
  const [actDesc, setActDesc] = useState('');
  const [actPoints, setActPoints] = useState(50);
  const [actLocation, setActLocation] = useState('');

  // Forms - Manual Points Adjustment
  const [targetUserId, setTargetUserId] = useState('');
  const [grantAmount, setGrantAmount] = useState(50);
  const [grantDesc, setGrantDesc] = useState('Yönetici puan ayarı');

  // Forms - QR Scanner Check
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
      if (usersData.length > 0 && !orderUserId) {
        setOrderUserId(usersData[0].id);
      }
      
      const cafesData = await api.getCafes();
      setCafesList(cafesData);
      if (cafesData.length > 0) {
        if (!selectedCafeId) setSelectedCafeId(cafesData[0].id);
        if (!scanCafeId) setScanCafeId(cafesData[0].id);
        if (!orderCafeId) {
          setOrderCafeId(cafesData[0].id);
          fetchOrderCafeMenuItems(cafesData[0].id);
        }
      }

      const rewardsData = await api.getRewards(1, 100);
      setRewardsList(rewardsData.items);

      const tasksData = await api.getActiveTasks();
      setTasksList(tasksData);

      const actsData = await api.getActivities();
      setActivitiesList(actsData);

      const ordersData = await api.getOrders();
      setOrdersList(ordersData);

      const settingsData = await api.getSettings();
      const rx = settingsData.find((s: any) => s.key === 'rewardExpireDays');
      if (rx) setRewardExpireDays(rx.value);
      const vb = settingsData.find((s: any) => s.key === 'visitBonusPoints');
      if (vb) setVisitBonusPoints(vb.value);
      const pe = settingsData.find((s: any) => s.key === 'pointsExchangeRate');
      if (pe) setPointsExchangeRate(pe.value);
      const se = settingsData.find((s: any) => s.key === 'spendEarnRatePercent');
      if (se) setSpendEarnRatePercent(se.value);

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

  const fetchOrderCafeMenuItems = async (cafeId: string) => {
    try {
      const items = await api.getMenuItems(cafeId);
      setOrderCafeMenuItems(items);
      if (items.length > 0) {
        setOrderMenuItemId(items[0].id);
      } else {
        setOrderMenuItemId('');
      }
    } catch (e) {
      console.error('Failed to fetch menu items for order form', e);
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

  useEffect(() => {
    if (orderCafeId) {
      fetchOrderCafeMenuItems(orderCafeId);
    }
  }, [orderCafeId]);

  // Actions - Cafe CRUD
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

  // Actions - MenuItem CRUD
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCafeId) return;
    setError(null);
    setSuccess(null);
    try {
      await api.createMenuItem(selectedCafeId, {
        name: productName,
        description: productDesc,
        price: productPrice,
        imageUrl: productImageUrl || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&auto=format&fit=crop&q=60',
        minAge: productMinAge !== '' ? Number(productMinAge) : null,
        maxAge: productMaxAge !== '' ? Number(productMaxAge) : null,
        requiredEducation: productReqEdu || null
      });
      setSuccess('Ürün başarıyla menüye eklendi.');
      setProductName('');
      setProductDesc('');
      setProductImageUrl('');
      setProductMinAge('');
      setProductMaxAge('');
      setProductReqEdu('');
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
      setSuccess('Ürün başarıyla menüden silindi.');
      await fetchMenuItems(selectedCafeId);
    } catch (err: any) {
      setError(err.message || 'Ürün silinemedi.');
    }
  };

  // Actions - Reward Definition CRUD
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
      setSuccess('İkram tanımı başarıyla eklendi.');
      setRewardTitle('');
      setRewardDesc('');
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'İkram eklenemedi.');
    }
  };

  const handleDeleteReward = async (id: string) => {
    if (!window.confirm('Bu ikram tanımını silmek istediğinizden emin misiniz?')) return;
    setError(null);
    setSuccess(null);
    try {
      await api.deleteReward(id);
      setSuccess('İkram tanımı başarıyla silindi.');
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'İkram silinemedi.');
    }
  };

  // Actions - Task Definition CRUD
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
      setSuccess('Görev tanımı başarıyla eklendi.');
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

  // Actions - Activity Definition CRUD
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

  // Actions - Grant/Adjust Points
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
      setSuccess('Vatandaş puan bakiyesi başarıyla düzenlendi.');
      setTargetUserId('');
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Puan düzenleme başarısız.');
    }
  };

  // Actions - Settings modification
  const handleUpdateSettingValue = async (key: string, value: string) => {
    setError(null);
    setSuccess(null);
    try {
      await api.updateSetting(key, { value });
      setSuccess(`"${key}" sistem parametresi başarıyla güncellendi.`);
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Parametre güncellenemedi.');
    }
  };

  // Actions - QR check checkout scan
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

  // Actions - Order status modification
  const handleUpdateOrderStatus = async (id: string, status: string) => {
    setError(null);
    setSuccess(null);
    try {
      await api.updateOrderStatus(id, status);
      setSuccess(`Sipariş durumu '${status}' olarak güncellendi.`);
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Sipariş durumu güncellenemedi.');
    }
  };

  // Actions - Manually Create Order
  const handleCreateManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!orderUserId || !orderCafeId || !orderMenuItemId) {
      setError('Lütfen tüm sipariş bilgilerini eksiksiz doldurun.');
      return;
    }

    try {
      await api.createOrder({
        userId: orderUserId,
        cafeId: orderCafeId,
        paidWithPoints: orderPaidWithPoints,
        imageUrl: orderImageUrl || null,
        items: [
          {
            menuItemId: orderMenuItemId,
            quantity: orderQuantity
          }
        ]
      });

      setSuccess('Sipariş başarıyla oluşturuldu ve vatandaşın koşul şartları doğrulandı!');
      setOrderQuantity(1);
      setOrderImageUrl('');
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Sipariş oluşturma hatası.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      
      {/* Top Header Bar */}
      <header className="nav-bar">
        <div className="nav-logo">
          <ShieldCheck size={24} color="var(--accent-primary)" />
          <span>GölBox <strong>Süper Admin</strong></span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{
              background: 'rgba(37, 99, 235, 0.1)',
              color: 'var(--accent-primary)',
              padding: '0.2rem 0.5rem',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginRight: '0.5rem'
            }}>
              Belediye Yöneticisi
            </span>
            <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              {currentUser?.firstName} {currentUser?.lastName}
            </strong>
          </div>
          <button onClick={logout} className="btn btn-secondary" style={{ padding: '0.5rem 0.75rem', display: 'flex', gap: '0.4rem' }}>
            <LogOut size={16} />
            Çıkış Yap
          </button>
        </div>
      </header>

      {/* Main Flex Layout */}
      <div style={{ display: 'flex', flexGrow: 1 }}>
        
        {/* Left Sidebar Navigation */}
        <aside style={{
          width: '260px',
          backgroundColor: 'var(--accent-sidebar)',
          padding: '1.5rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35rem'
        }}>
          <button
            onClick={() => { setActiveMenu('users'); setError(null); setSuccess(null); }}
            className={`sidebar-link ${activeMenu === 'users' ? 'active' : ''}`}
          >
            <Users size={18} />
            <span>Vatandaş Yönetimi</span>
          </button>

          <button
            onClick={() => { setActiveMenu('cafes'); setError(null); setSuccess(null); }}
            className={`sidebar-link ${activeMenu === 'cafes' ? 'active' : ''}`}
          >
            <Building2 size={18} />
            <span>Kafe Yönetimi</span>
          </button>

          <button
            onClick={() => { setActiveMenu('products'); setError(null); setSuccess(null); }}
            className={`sidebar-link ${activeMenu === 'products' ? 'active' : ''}`}
          >
            <Coffee size={18} />
            <span>Ismarlıyor Menüsü</span>
          </button>

          <button
            onClick={() => { setActiveMenu('orders'); setError(null); setSuccess(null); }}
            className={`sidebar-link ${activeMenu === 'orders' ? 'active' : ''}`}
          >
            <ShoppingBag size={18} />
            <span>Ismarlıyor Siparişleri</span>
          </button>

          <button
            onClick={() => { setActiveMenu('rewards'); setError(null); setSuccess(null); }}
            className={`sidebar-link ${activeMenu === 'rewards' ? 'active' : ''}`}
          >
            <Award size={18} />
            <span>İkram Tanımlama</span>
          </button>

          <button
            onClick={() => { setActiveMenu('tasks'); setError(null); setSuccess(null); }}
            className={`sidebar-link ${activeMenu === 'tasks' ? 'active' : ''}`}
          >
            <Calendar size={18} />
            <span>Görev Tanımlama</span>
          </button>

          <button
            onClick={() => { setActiveMenu('activities'); setError(null); setSuccess(null); }}
            className={`sidebar-link ${activeMenu === 'activities' ? 'active' : ''}`}
          >
            <Activity size={18} />
            <span>Etkinlik Tanımlama</span>
          </button>

          <button
            onClick={() => { setActiveMenu('settings'); setError(null); setSuccess(null); }}
            className={`sidebar-link ${activeMenu === 'settings' ? 'active' : ''}`}
          >
            <Settings size={18} />
            <span>Sistem Limitleri</span>
          </button>

          <button
            onClick={() => { setActiveMenu('pos'); setError(null); setSuccess(null); }}
            className={`sidebar-link ${activeMenu === 'pos' ? 'active' : ''}`}
          >
            <Smartphone size={18} />
            <span>POS Kasa Terminali</span>
          </button>
        </aside>

        {/* Right Content Panel */}
        <main style={{ flexGrow: 1, padding: '2rem' }}>
          
          {/* Notification Messages */}
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.15)',
              borderRadius: '8px',
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
              background: 'rgba(16, 185, 129, 0.05)',
              border: '1px solid rgba(16, 185, 129, 0.15)',
              borderRadius: '8px',
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
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>Kayıtlı Vatandaş Listesi</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                  Mobil uygulamayı kullanan vatandaşlar ve güncel sadakat bakiyeleri.
                </p>
                
                <div style={{ overflowX: 'auto' }}>
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th>Ad Soyad</th>
                        <th>E-Posta</th>
                        <th>Yaş & Öğrenim</th>
                        <th>GölPuan Bakiyesi</th>
                        <th style={{ textAlign: 'right' }}>İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersList.map((u) => (
                        <tr key={u.id}>
                          <td style={{ fontWeight: 600 }}>{u.firstName} {u.lastName}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                          <td>
                            {u.age ? `${u.age} Yaş` : 'Bilinmiyor'} / {u.educationLevel || 'Diğer'}
                          </td>
                          <td style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{u.pointsBalance} GP</td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              onClick={() => {
                                setTargetUserId(u.id);
                                setGrantDesc('Özel belediye puan ayarı');
                              }}
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
                            >
                              Puan Düzenle
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Adjust Points Form */}
              {targetUserId && (
                <div className="glass-card animate-fade-in" style={{ textAlign: 'left', maxWidth: '600px' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Award size={18} color="var(--accent-primary)" />
                    <span>Puan Bakiyesi Düzenleme Formu</span>
                  </h3>
                  <form onSubmit={handleGrantPoints} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Kullanıcı ID (GUID)</label>
                      <input type="text" className="form-input" value={targetUserId} disabled />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Değişim Tutarı (+/-)</label>
                        <input
                          type="number"
                          className="form-input"
                          value={grantAmount}
                          onChange={(e) => setGrantAmount(Number(e.target.value))}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Güncelleme Gerekçesi</label>
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
                      <button type="submit" className="btn btn-primary">Değişikliği Uygula</button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* 2. Kafe Yönetimi (Cafes) */}
          {activeMenu === 'cafes' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem' }}>
              
              {/* Add Cafe Form */}
              <div className="glass-card" style={{ textAlign: 'left', height: 'fit-content' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Yeni Kitap Kafe Tanımla</h3>
                <form onSubmit={handleAddCafe} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Tesis Adı</label>
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
                    <label className="form-label">Açık Adres</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={cafeAddress}
                      onChange={(e) => setCafeAddress(e.target.value)}
                      placeholder="Şube adresi..."
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    Kafeyi Kaydet
                  </button>
                </form>
              </div>

              {/* Cafes List */}
              <div className="glass-card" style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>Aktif Kitap Kafeler</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {cafesList.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        background: '#ffffff',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>{c.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.2rem' }}>
                          <MapPin size={12} />
                          <span>{c.address}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteCafe(c.id)}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--error)' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* 3. Ismarlıyor Ürünleri (Products) */}
          {activeMenu === 'products' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem' }}>
              
              {/* Select Cafe List */}
              <div className="glass-card" style={{ textAlign: 'left', height: 'fit-content' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Şube Seçimi</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                  Menü ürünlerini görüntülemek istediğiniz kitap kafeyi seçin.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {cafesList.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCafeId(c.id)}
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '6px',
                        border: '1px solid',
                        borderColor: selectedCafeId === c.id ? 'var(--accent-primary)' : 'var(--border-color)',
                        background: selectedCafeId === c.id ? 'rgba(37, 99, 235, 0.05)' : '#ffffff',
                        cursor: 'pointer',
                        fontWeight: selectedCafeId === c.id ? 600 : 500,
                        color: selectedCafeId === c.id ? 'var(--accent-primary)' : 'var(--text-primary)'
                      }}
                    >
                      {c.name}
                    </div>
                  ))}
                </div>
              </div>

              {/* Menu items and Add Form */}
              <div className="glass-card" style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>Menü & Ürün Kontrolü</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                  {selectedCafeId 
                    ? `"${cafesList.find(c => c.id === selectedCafeId)?.name}" kafesinin aktif menü ögeleri.`
                    : 'Menüyü görmek için lütfen sol listeden bir şube seçin.'
                  }
                </p>

                {selectedCafeId && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    {/* Add product form under selected cafe */}
                    <form onSubmit={handleAddProduct} style={{ background: 'var(--bg-tertiary)', padding: '1.25rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.9rem' }}>Yeni Ürün Ekle</h4>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Ürün Adı</label>
                          <input
                            type="text"
                            required
                            className="form-input"
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                            placeholder="Filtre Kahve"
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
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Görsel URL'i (Unsplash vb.)</label>
                        <input
                          type="text"
                          className="form-input"
                          value={productImageUrl}
                          onChange={(e) => setProductImageUrl(e.target.value)}
                          placeholder="https://images.unsplash.com/..."
                        />
                      </div>

                      {/* Criteria Constraints fields */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '0.75rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Min Yaş Şartı</label>
                          <input
                            type="number"
                            className="form-input"
                            value={productMinAge}
                            onChange={(e) => setProductMinAge(e.target.value !== '' ? Number(e.target.value) : '')}
                            placeholder="Yok"
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Max Yaş Şartı</label>
                          <input
                            type="number"
                            className="form-input"
                            value={productMaxAge}
                            onChange={(e) => setProductMaxAge(e.target.value !== '' ? Number(e.target.value) : '')}
                            placeholder="Yok"
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Eğitim Şartı</label>
                          <select
                            className="form-input"
                            value={productReqEdu}
                            onChange={(e) => setProductReqEdu(e.target.value)}
                            style={{ height: '38px', padding: '0 0.5rem' }}
                          >
                            <option value="">Yok (Herkes)</option>
                            <option value="Lise">Sadece Lise Öğrencileri</option>
                            <option value="Üniversite">Sadece Üniversite Öğrencileri</option>
                          </select>
                        </div>
                      </div>

                      <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem', alignSelf: 'flex-end', width: '120px' }}>
                        Ürünü Ekle
                      </button>
                    </form>

                    {/* Products List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {menuItemsList.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                          Bu kafeye henüz herhangi bir menü ürünü eklenmemiş.
                        </div>
                      ) : (
                        menuItemsList.map((item) => (
                          <div key={item.id} className="action-item" style={{ padding: '0.6rem 0.85rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  style={{
                                    width: '44px',
                                    height: '44px',
                                    objectFit: 'cover',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-color)'
                                  }}
                                />
                              ) : (
                                <div style={{
                                  width: '44px',
                                  height: '44px',
                                  borderRadius: '6px',
                                  background: 'var(--bg-tertiary)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'var(--text-muted)',
                                  border: '1px solid var(--border-color)'
                                }}>
                                  <Coffee size={18} />
                                </div>
                              )}
                              <div>
                                <div style={{ fontWeight: 600 }}>{item.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  {item.requiredEducation || item.minAge || item.maxAge ? (
                                    <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                                      🔒 Şart: {item.requiredEducation || 'Tüm'} Öğrenciler {item.minAge && `(${item.minAge}-${item.maxAge || '+'} Yaş)`}
                                    </span>
                                  ) : (
                                    '🔓 Herkes Alabilir'
                                  )}
                                </div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                              <strong style={{ color: 'var(--text-primary)' }}>{item.price} TL</strong>
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

          {/* 4. Ismarlıyor Siparişleri (Orders) */}
          {activeMenu === 'orders' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Manual Order Creation Form */}
              <div className="glass-card" style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <PlusCircle size={18} color="var(--accent-primary)" />
                  <span>Yönetici Olarak Sipariş Oluştur (Ismarlıyor Ekle)</span>
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                  Admin paneli üzerinden vatandaş adına manuel ön sipariş kaydetme formu. Yaş ve okul şartları otomatik doğrulanır.
                </p>

                <form onSubmit={handleCreateManualOrder} style={{ background: 'var(--bg-tertiary)', padding: '1.25rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.5fr', gap: '0.75rem' }}>
                    
                    {/* User Selection */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Kim Ismarlıyor (Vatandaş Seçimi)</label>
                      <select
                        className="form-input"
                        value={orderUserId}
                        onChange={(e) => setOrderUserId(e.target.value)}
                        style={{ height: '38px', padding: '0 0.5rem' }}
                      >
                        {usersList.map(u => (
                          <option key={u.id} value={u.id}>
                            {u.firstName} {u.lastName} ({u.email}) — Yaş: {u.age || '?'}, Okul: {u.educationLevel || 'Diğer'}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Cafe Selection */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Nerede Hazırlanacak (Şube)</label>
                      <select
                        className="form-input"
                        value={orderCafeId}
                        onChange={(e) => setOrderCafeId(e.target.value)}
                        style={{ height: '38px', padding: '0 0.5rem' }}
                      >
                        {cafesList.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* MenuItem Selection */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Ne Ismarlıyor (Menü Ürünü)</label>
                      <select
                        className="form-input"
                        value={orderMenuItemId}
                        onChange={(e) => setOrderMenuItemId(e.target.value)}
                        style={{ height: '38px', padding: '0 0.5rem' }}
                        disabled={orderCafeMenuItems.length === 0}
                      >
                        {orderCafeMenuItems.length === 0 ? (
                          <option value="">Bu kafede ürün bulunamadı</option>
                        ) : (
                          orderCafeMenuItems.map(item => (
                            <option key={item.id} value={item.id}>
                              {item.name} — {item.price} TL {item.requiredEducation && `(Şart: ${item.requiredEducation})`}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '0.75rem', alignItems: 'end' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Adet / Miktar</label>
                      <input
                        type="number"
                        min={1}
                        required
                        className="form-input"
                        value={orderQuantity}
                        onChange={(e) => setOrderQuantity(Number(e.target.value))}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Sipariş Kanıt / Fiş Görseli URL'i</label>
                      <input
                        type="text"
                        className="form-input"
                        value={orderImageUrl}
                        onChange={(e) => setOrderImageUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', height: '38px' }}>
                      <input
                        type="checkbox"
                        id="orderPointsPay"
                        checked={orderPaidWithPoints}
                        onChange={(e) => setOrderPaidWithPoints(e.target.checked)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <label htmlFor="orderPointsPay" style={{ fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}>
                        GölPuan Kullan
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ alignSelf: 'flex-end', padding: '0.65rem 1.5rem' }}
                    disabled={orderCafeMenuItems.length === 0}
                  >
                    Siparişi Kaydet
                  </button>
                </form>
              </div>

              {/* Live Orders List */}
              <div className="glass-card" style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.25rem' }}>Ön Sipariş Takip Paneli</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                  Kitap Kafelerden vatandaşlar veya yöneticiler tarafından girilmiş olan aktif sipariş kayıtları.
                </p>

                <div style={{ overflowX: 'auto' }}>
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th>Sipariş Kodu</th>
                        <th>Alıcı (Kim)</th>
                        <th>Şube</th>
                        <th>İçerik (Ne Ismarlıyor)</th>
                        <th>Tutar (Ne Kadar)</th>
                        <th>Sipariş/Fiş Görseli</th>
                        <th>Durum</th>
                        <th style={{ textAlign: 'right' }}>İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ordersList.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                            Herhangi bir ön sipariş bulunmuyor.
                          </td>
                        </tr>
                      ) : (
                        ordersList.map((o) => (
                          <tr key={o.id}>
                            <td style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{o.collectionCode}</td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{o.userFullName}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{o.userEmail}</div>
                            </td>
                            <td>{o.cafeName}</td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                {o.items.map((item: any, idx: number) => (
                                  <div key={idx} style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    {item.menuItemImageUrl && (
                                      <img
                                        src={item.menuItemImageUrl}
                                        alt={item.menuItemName}
                                        style={{ width: '20px', height: '20px', objectFit: 'cover', borderRadius: '4px' }}
                                      />
                                    )}
                                    <span>{item.menuItemName} <strong style={{ color: 'var(--text-secondary)' }}>x{item.quantity}</strong></span>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 700 }}>{o.totalAmount} TL</div>
                              <div style={{ fontSize: '0.75rem', color: o.paidWithPoints ? 'var(--success)' : 'var(--text-muted)' }}>
                                {o.paidWithPoints ? `🪙 ${o.pointsUsed} Puan` : '💳 Nakit/Kart'}
                              </div>
                            </td>
                            <td>
                              {o.imageUrl ? (
                                <a
                                  href={o.imageUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    fontSize: '0.8rem',
                                    color: 'var(--accent-primary)',
                                    textDecoration: 'none',
                                    fontWeight: 600
                                  }}
                                >
                                  <Eye size={14} />
                                  Görüntüle
                                </a>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Görsel Yok</span>
                              )}
                            </td>
                            <td>
                              <span style={{
                                padding: '0.2rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                background: 
                                  o.status === 'Completed' ? 'rgba(16, 185, 129, 0.1)' :
                                  o.status === 'Ready' ? 'rgba(37, 99, 235, 0.1)' :
                                  o.status === 'Preparing' ? 'rgba(245, 158, 11, 0.1)' :
                                  o.status === 'Cancelled' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                                color:
                                  o.status === 'Completed' ? 'var(--success)' :
                                  o.status === 'Ready' ? 'var(--accent-primary)' :
                                  o.status === 'Preparing' ? '#d97706' :
                                  o.status === 'Cancelled' ? 'var(--error)' : 'var(--text-muted)'
                              }}>
                                {o.status === 'Pending' ? 'Bekliyor' :
                                 o.status === 'Preparing' ? 'Hazırlanıyor' :
                                 o.status === 'Ready' ? 'Hazır' :
                                 o.status === 'Completed' ? 'Teslim Edildi' : 'İptal Edildi'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                                {o.status === 'Pending' && (
                                  <button
                                    onClick={() => handleUpdateOrderStatus(o.id, 'Preparing')}
                                    className="btn btn-primary"
                                    style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem', background: '#f59e0b', borderColor: '#f59e0b' }}
                                  >
                                    Hazırla
                                  </button>
                                )}
                                {o.status === 'Preparing' && (
                                  <button
                                    onClick={() => handleUpdateOrderStatus(o.id, 'Ready')}
                                    className="btn btn-primary"
                                    style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                                  >
                                    Hazır Et
                                  </button>
                                )}
                                {o.status === 'Ready' && (
                                  <button
                                    onClick={() => handleUpdateOrderStatus(o.id, 'Completed')}
                                    className="btn btn-primary"
                                    style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem', background: 'var(--success)', borderColor: 'var(--success)' }}
                                  >
                                    Teslim Et
                                  </button>
                                )}
                                {o.status !== 'Completed' && o.status !== 'Cancelled' && (
                                  <button
                                    onClick={() => handleUpdateOrderStatus(o.id, 'Cancelled')}
                                    className="btn btn-secondary"
                                    style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem', color: 'var(--error)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                                  >
                                    İptal
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* 5. İkram Tanımlama (Rewards) */}
          {activeMenu === 'rewards' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem' }}>
              
              {/* Add Reward form */}
              <div className="glass-card" style={{ textAlign: 'left', height: 'fit-content' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Yeni İkram Ödülü Tanımla</h3>
                <form onSubmit={handleAddReward} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">İkram Adı</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={rewardTitle}
                      onChange={(e) => setRewardTitle(e.target.value)}
                      placeholder="Örn: Türk Kahvesi"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Açıklama / Detay</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={rewardDesc}
                      onChange={(e) => setRewardDesc(e.target.value)}
                      placeholder="Kupanın boyutu vb."
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Gerekli GölPuan (GP)</label>
                    <input
                      type="number"
                      required
                      className="form-input"
                      value={rewardPoints}
                      onChange={(e) => setRewardPoints(Number(e.target.value))}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    Kataloğa Kaydet
                  </button>
                </form>
              </div>

              {/* Rewards List */}
              <div className="glass-card" style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>Katalogdaki Aktif İkramlar</h3>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {rewardsList.map((r) => (
                    <div key={r.id} className="action-item">
                      <div>
                        <div style={{ fontWeight: 600 }}>{r.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{r.description}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{r.requiredPoints} GP</span>
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

          {/* 6. Görev Tanımlama (Tasks) */}
          {activeMenu === 'tasks' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem' }}>
              
              {/* Add Task form */}
              <div className="glass-card" style={{ textAlign: 'left', height: 'fit-content' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Yeni Sadakat Görevi Tanımla</h3>
                <form onSubmit={handleAddTask} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Görev Başlığı</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      placeholder="Örn: 20 Dakika Kitap Oku"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Görev Açıklaması</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={taskDesc}
                      onChange={(e) => setTaskDesc(e.target.value)}
                      placeholder="Görevin yapılış aşaması..."
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Kazanılacak GölPuan (GP)</label>
                    <input
                      type="number"
                      required
                      className="form-input"
                      value={taskPoints}
                      onChange={(e) => setTaskPoints(Number(e.target.value))}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    Görevi Yayınla
                  </button>
                </form>
              </div>

              {/* Tasks List */}
              <div className="glass-card" style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>Yayındaki Görev Tanımları</h3>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {tasksList.map((t) => (
                    <div key={t.id} className="action-item">
                      <div>
                        <div style={{ fontWeight: 600 }}>{t.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t.description}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--success)' }}>+{t.pointsReward} GP</span>
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

            </div>
          )}

          {/* 7. Etkinlik Tanımlama (Activities) */}
          {activeMenu === 'activities' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem' }}>
              
              {/* Add Activity form */}
              <div className="glass-card" style={{ textAlign: 'left', height: 'fit-content' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Yeni Belediye Etkinliği Ekle</h3>
                <form onSubmit={handleAddActivity} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Etkinlik Adı</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={actTitle}
                      onChange={(e) => setActTitle(e.target.value)}
                      placeholder="Örn: Mogan Gölü Çevre Temizliği"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Etkinlik Açıklaması</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={actDesc}
                      onChange={(e) => setActDesc(e.target.value)}
                      placeholder="Katılımcılara verilecek talimatlar..."
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
                      <label className="form-label">Etkinlik Alanı / Yer</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        value={actLocation}
                        onChange={(e) => setActLocation(e.target.value)}
                        placeholder="Örn: Mogan Amfi Parkı"
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                    Etkinliği Yayınla
                  </button>
                </form>
              </div>

              {/* Activities List */}
              <div className="glass-card" style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>Yayındaki Etkinlikler</h3>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {activitiesList.map((a) => (
                    <div key={a.id} className="action-item">
                      <div>
                        <div style={{ fontWeight: 600 }}>{a.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          📍 {a.location} — {a.description}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>+{a.pointsReward} GP</span>
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

          {/* 8. Sistem Limitleri (Settings) */}
          {activeMenu === 'settings' && (
            <div className="glass-card" style={{ textAlign: 'left', maxWidth: '650px', margin: '0 auto' }}>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Settings size={20} color="var(--accent-primary)" />
                <span>Sistem Parametre & Limit Yönetimi</span>
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '2rem' }}>
                GölBox sadakat programında suistimali önleyecek limitler ve kazanım oranları.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* 1. rewardExpireDays */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                  <div style={{ flexGrow: 1, paddingRight: '1rem' }}>
                    <div style={{ fontWeight: 600 }}>Kupon Geçerlilik Süresi</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Alınan ikram kupon kodlarının kullanım süresi (gün)</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="number"
                      className="form-input"
                      style={{ width: '80px', textAlign: 'center' }}
                      value={rewardExpireDays}
                      onChange={(e) => setRewardExpireDays(e.target.value)}
                    />
                    <button
                      onClick={() => handleUpdateSettingValue('rewardExpireDays', rewardExpireDays)}
                      className="btn btn-primary"
                      style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
                    >
                      Güncelle
                    </button>
                  </div>
                </div>

                {/* 2. visitBonusPoints */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                  <div style={{ flexGrow: 1, paddingRight: '1rem' }}>
                    <div style={{ fontWeight: 600 }}>Ziyaret Bonus Puanı</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>QR okutma başına kazanılan sabit bonus puan</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="number"
                      className="form-input"
                      style={{ width: '80px', textAlign: 'center' }}
                      value={visitBonusPoints}
                      onChange={(e) => setVisitBonusPoints(e.target.value)}
                    />
                    <button
                      onClick={() => handleUpdateSettingValue('visitBonusPoints', visitBonusPoints)}
                      className="btn btn-primary"
                      style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
                    >
                      Güncelle
                    </button>
                  </div>
                </div>

                {/* 3. pointsExchangeRate */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                  <div style={{ flexGrow: 1, paddingRight: '1rem' }}>
                    <div style={{ fontWeight: 600 }}>Puan Harcama Oranı (1 TL)</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Kasalarda 1 TL ödeme için harcanacak puan tutarı</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="number"
                      className="form-input"
                      style={{ width: '80px', textAlign: 'center' }}
                      value={pointsExchangeRate}
                      onChange={(e) => setPointsExchangeRate(e.target.value)}
                    />
                    <button
                      onClick={() => handleUpdateSettingValue('pointsExchangeRate', pointsExchangeRate)}
                      className="btn btn-primary"
                      style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
                    >
                      Güncelle
                    </button>
                  </div>
                </div>

                {/* 4. spendEarnRatePercent */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem' }}>
                  <div style={{ flexGrow: 1, paddingRight: '1rem' }}>
                    <div style={{ fontWeight: 600 }}>Nakit Harcamadan Puan Kazanım Oranı (%)</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ödenen nakit tutardan geri kazanılan puan yüzdesi</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="number"
                      className="form-input"
                      style={{ width: '80px', textAlign: 'center' }}
                      value={spendEarnRatePercent}
                      onChange={(e) => setSpendEarnRatePercent(e.target.value)}
                    />
                    <button
                      onClick={() => handleUpdateSettingValue('spendEarnRatePercent', spendEarnRatePercent)}
                      className="btn btn-primary"
                      style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
                    >
                      Güncelle
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* 9. POS Simülasyonu */}
          {activeMenu === 'pos' && (
            <div className="glass-card" style={{ textAlign: 'left', maxWidth: '750px', margin: '0 auto' }}>
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Smartphone size={20} color="var(--accent-primary)" />
                <span>Kasiyer / POS Kontrol Ekranı</span>
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Kitap Kafelerdeki entegre kasa doğrulamalarının simülasyonu.
              </p>

              <form onSubmit={handleSimulateScan} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Müşteri QR Verisi</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={scanQrToken}
                      onChange={(e) => setScanQrToken(e.target.value)}
                      placeholder="Okutulan QR Kodu veya GUID"
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                      Örn: 88888888-8888-8888-8888-888888888888
                    </span>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">İşlem Yapılan Kafe</label>
                    <select
                      className="form-input"
                      value={scanCafeId}
                      onChange={(e) => setScanCafeId(e.target.value)}
                      style={{ height: '38px', padding: '0 0.5rem' }}
                    >
                      {cafesList.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Toplam Hesap Tutarı (TL)</label>
                    <input
                      type="number"
                      required
                      className="form-input"
                      value={scanAmount}
                      onChange={(e) => setScanAmount(Number(e.target.value))}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">İkram Kupon Kodu (İstisnai)</label>
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
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="paidPoints" style={{ fontSize: '0.9rem', cursor: 'pointer', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Ödemeyi biriken puanlar ile yap (Puanla Ödeme)
                  </label>
                </div>

                <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem' }}>
                  Kasadan Doğrula ve Tamamla
                </button>
              </form>

              {scanResult && (
                <div style={{
                  marginTop: '1.5rem',
                  padding: '1.25rem',
                  background: 'rgba(16, 185, 129, 0.05)',
                  borderRadius: '8px',
                  border: '1px solid rgba(16, 185, 129, 0.2)'
                }}>
                  <h4 style={{ margin: '0 0 0.5rem', color: 'var(--success)' }}>İşlem Onay Raporu</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.85rem' }}>
                    <div>Hesap Tutarı: <strong>{scanResult.amount} TL</strong></div>
                    <div>Düşen Puan: <strong style={{ color: 'var(--error)' }}>{scanResult.pointsDeducted} GP</strong></div>
                    <div>Yüklenen Puan: <strong style={{ color: 'var(--success)' }}>{scanResult.pointsEarned} GP</strong></div>
                    <div>Güncel Kullanıcı Bakiyesi: <strong>{scanResult.newPointsBalance} GP</strong></div>
                  </div>
                </div>
              )}
            </div>
          )}

        </main>
      </div>

    </div>
  );
};
