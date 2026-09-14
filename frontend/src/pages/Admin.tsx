import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../store/AuthContext';
import { HomeContentPanel } from './HomeContentPanel';
import { PlacesPanel } from './PlacesPanel';
import { SettingsPanel } from '../components/admin/SettingsPanel';
import { 
  LayoutDashboard, Users, Building2, Coffee, ShoppingBag, 
  History, Award, Sparkles, CheckSquare, Calendar, Bell, 
  UserCheck, ShieldAlert, FileSpreadsheet, Settings, FileText,
  LogOut, Plus, Search, Filter, AlertTriangle, ChevronRight,
  Upload, Image as ImageIcon, ShieldCheck, CheckCircle2, XCircle, 
  Download, MoreVertical, X, ChevronLeft, ChevronDown, Check, ArrowRight, RefreshCw,
  Clock, TrendingUp, HelpCircle, MapPin, Receipt, Gift, CreditCard, Megaphone, BarChart3, FileCheck, Trash2, Eye, Phone, Edit3, Save, Send, Shield, DollarSign, Layers, Heart, Tag, Landmark
} from 'lucide-react';

// Safe array extraction helper
const extractArray = (res: any): any[] => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (res.items && Array.isArray(res.items)) return res.items;
  if (res.data && Array.isArray(res.data)) return res.data;
  return [];
};

const createdId = (res: any): string | null => {
  if (!res) return null;
  if (typeof res === 'string') return res;
  if (typeof res === 'object') return res.id || res.orderId || null;
  return null;
};

const rewardPoints = (reward: any): number =>
  Number(reward?.requiredPoints ?? reward?.pointsRequired ?? 0);

const emptyNote = (text: string) => (
  <div style={{ background: '#fff', border: '1px dashed #d7e3e0', borderRadius: '20px', padding: '2rem', color: '#5b6f6e' }}>{text}</div>
);

const campaignTypeLabel = (type?: string) => {
  const map: Record<string, string> = {
    FixedBonus: 'Sabit bonus',
    DoublePoints: 'Çift puan',
    ProductDiscount: 'Ürün indirimi',
    FirstOrderBonus: 'İlk sipariş',
    BranchSpecial: 'Şube özel',
    TargetGroupSpecial: 'Hedef kitle'
  };
  return (type && map[type]) || type || '—';
};

const targetGroupLabel = (group?: string) => {
  const map: Record<string, string> = {
    All: 'Tüm vatandaşlar',
    HighSchool: 'Lise',
    University: 'Üniversite',
    AgeGroup: 'Yaş grubu'
  };
  return (group && map[group]) || group || '—';
};

export const Admin: React.FC = () => {
  const { logout, user: currentUser } = useAuth();
  const adminName = [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(' ') || currentUser?.email || 'Yönetici';
  const adminRole = currentUser?.role
    || (Array.isArray(currentUser?.roles) ? currentUser.roles[0] : null)
    || 'Admin';
  const isAdminUser = adminRole === 'Admin';
  const staffMenuIds = new Set(['overview', 'users', 'cafes', 'products', 'points', 'qr', 'fieldDrops', 'ismarliyor', 'events']);
  const adminInitials = `${currentUser?.firstName?.[0] || ''}${currentUser?.lastName?.[0] || ''}`.trim() || 'GB';
  
  // Sidebar Collapse State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // 14 Core Specification Sidebar Modules
  const [activeMenu, setActiveMenu] = useState<
    'overview' | 'users' | 'cafes' | 'products' | 'points' | 
    'qr' | 'rewards' | 'fieldDrops' | 'ismarliyor' | 'homeContent' | 'places' | 'campaigns' | 'events' | 
    'notifications' | 'reports' | 'roles' | 'audit' | 'settings'
  >('overview');

  useEffect(() => {
    if (!isAdminUser && !staffMenuIds.has(activeMenu)) {
      setActiveMenu('overview');
    }
  }, [isAdminUser, activeMenu]);

  // Data states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dashboard Overview state
  const [overviewData, setOverviewData] = useState<any>(null);
  const [reportsSummary, setReportsSummary] = useState<any>(null);

  // Data lists
  const [usersList, setUsersList] = useState<any[]>([]);
  const [cafesList, setCafesList] = useState<any[]>([]);
  const [menuItemsList, setMenuItemsList] = useState<any[]>([]);
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [pointsList, setPointsList] = useState<any[]>([]);
  const [rewardsList, setRewardsList] = useState<any[]>([]);
  const [campaignsList, setCampaignsList] = useState<any[]>([]);
  const [eventsList, setEventsList] = useState<any[]>([]);
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [auditLogsList, setAuditLogsList] = useState<any[]>([]);

  // Ismarlıyor Filter Pill State
  const [ismarliyorStatusFilter, setIsmarliyorStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Live' | 'Completed' | 'Rejected'>('All');

  // Modal / Drawer / Detail States
  const [selectedUserDrawer, setSelectedUserDrawer] = useState<any>(null);
  const [selectedCafeDetail, setSelectedCafeDetail] = useState<any>(null);
  const [previewProofImage, setPreviewProofImage] = useState<string | null>(null);

  // Cafe Edit State inside Detail Modal
  const [editCafeName, setEditCafeName] = useState('');
  const [editCafeAddress, setEditCafeAddress] = useState('');
  const [editCafeImageUrl, setEditCafeImageUrl] = useState('');
  const [savingCafeEdit, setSavingCafeEdit] = useState(false);

  // Point Adjustment Form State
  const [pointAdjustUserId, setPointAdjustUserId] = useState<string | null>(null);
  const [pointAmount, setPointAmount] = useState<number>(50);
  const [pointActionType, setPointActionType] = useState<'Add' | 'Deduct' | 'Reward' | 'Coupon'>('Add');
  const [pointReason, setPointReason] = useState<string>('');
  const [pointDescription, setPointDescription] = useState<string>('');

  // Push Notification Form State
  const [pushTitle, setPushTitle] = useState('');
  const [pushMessage, setPushMessage] = useState('');
  const [pushTargetGroup, setPushTargetGroup] = useState('All');
  const [pushMinAge, setPushMinAge] = useState('');
  const [pushMaxAge, setPushMaxAge] = useState('');
  const [pushEducation, setPushEducation] = useState('');
  const [pushUserId, setPushUserId] = useState('');

  // Image Upload State
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [uploadingFile, setUploadingFile] = useState<boolean>(false);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');

  // POS QR Scan State
  const [qrTokenInput, setQrTokenInput] = useState('');
  const [qrSelectedCafeId, setQrSelectedCafeId] = useState('');
  const [qrAmount, setQrAmount] = useState<number>(45);
  const [qrPaidWithPoints, setQrPaidWithPoints] = useState(false);
  const [qrScanResult, setQrScanResult] = useState<any>(null);
  const [qrScanLoading, setQrScanLoading] = useState(false);
  const [qrScanError, setQrScanError] = useState<string | null>(null);
  const [qrRedeemCode, setQrRedeemCode] = useState('');

  // Creation Modals
  const [showAddCafeModal, setShowAddCafeModal] = useState(false);
  const [newCafeName, setNewCafeName] = useState('');
  const [newCafeAddress, setNewCafeAddress] = useState('');
  const [newCafeImageUrl, setNewCafeImageUrl] = useState('');
  const [selectedProductIdsForCafe, setSelectedProductIdsForCafe] = useState<string[]>([]);

  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdPrice, setNewProdPrice] = useState<number>(45);
  const [newProdCafeId, setNewProdCafeId] = useState('');
  const [newProdReqEdu, setNewProdReqEdu] = useState('');

  const [showAddRewardModal, setShowAddRewardModal] = useState(false);
  const [newRewardTitle, setNewRewardTitle] = useState('');
  const [newRewardDesc, setNewRewardDesc] = useState('');
  const [newRewardPoints, setNewRewardPoints] = useState<number>(50);

  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('Şehitkamil Gençlik Merkezi');
  const [newEventPlaceId, setNewEventPlaceId] = useState('');
  const [eventPlacesList, setEventPlacesList] = useState<any[]>([]);
  const [newEventPoints, setNewEventPoints] = useState<number>(100);
  const [newEventQuota, setNewEventQuota] = useState<number>(50);

  // CAMPAIGN CREATION STATE
  const [showAddCampaignModal, setShowAddCampaignModal] = useState(false);
  const [newCampTitle, setNewCampTitle] = useState('');
  const [newCampDesc, setNewCampDesc] = useState('');
  const [newCampType, setNewCampType] = useState<'Percentage' | 'FixedAmount' | 'BonusPoints' | 'BuyOneGetOne'>('Percentage');
  const [newCampValue, setNewCampValue] = useState<number>(20);
  const [newCampStartDate, setNewCampStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [newCampEndDate, setNewCampEndDate] = useState(new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
  const [newCampTargetGroup, setNewCampTargetGroup] = useState('Students');
  const [newCampCafeId, setNewCampCafeId] = useState('ALL');
  const [newCampImageUrl, setNewCampImageUrl] = useState('');

  // ISMARLIYOR CREATION & TARGET CRITERIA STATE
  const [showAddIsmarliyorModal, setShowAddIsmarliyorModal] = useState(false);
  const [newIsmUserId, setNewIsmUserId] = useState('');
  const [newIsmCafeId, setNewIsmCafeId] = useState('');
  const [newIsmMenuItemId, setNewIsmMenuItemId] = useState('');
  const [newIsmItemName, setNewIsmItemName] = useState('');
  const [newIsmQuantity, setNewIsmQuantity] = useState<number>(1);
  const [newIsmAmount, setNewIsmAmount] = useState<number>(45);
  const [newIsmTargetCriteria, setNewIsmTargetCriteria] = useState('Gençler'); // Gençler, Öğrenciler, Emekliler, Herkese Açık
  const [newIsmProofUrl, setNewIsmProofUrl] = useState('');

  const [fieldDropsList, setFieldDropsList] = useState<any[]>([]);
  const [fieldCapturesList, setFieldCapturesList] = useState<any[]>([]);
  const [showFieldDropModal, setShowFieldDropModal] = useState(false);
  const [editingFieldDropId, setEditingFieldDropId] = useState<string | null>(null);
  const [selectedFieldDropId, setSelectedFieldDropId] = useState<string | null>(null);
  const [fdTitle, setFdTitle] = useState('');
  const [fdDescription, setFdDescription] = useState('');
  const [fdLat, setFdLat] = useState(37.0662);
  const [fdLng, setFdLng] = useState(37.3781);
  const [fdRadius, setFdRadius] = useState(40);
  const [fdPoints, setFdPoints] = useState(25);
  const [fdStock, setFdStock] = useState<number | ''>(100);
  const [fdPerUser, setFdPerUser] = useState(1);
  const [fdCafeId, setFdCafeId] = useState('');
  const [fdRewardId, setFdRewardId] = useState('');
  const [fdImageUrl, setFdImageUrl] = useState('');
  const [fdModelUrl, setFdModelUrl] = useState('');
  const [fdActive, setFdActive] = useState(true);
  const [fdStartsAt, setFdStartsAt] = useState('');
  const [fdEndsAt, setFdEndsAt] = useState('');
  const [savingFieldDrop, setSavingFieldDrop] = useState(false);

  const toLocalInput = (value?: string) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const resetFieldDropForm = () => {
    const start = new Date();
    const end = new Date(Date.now() + 30 * 86400000);
    setEditingFieldDropId(null);
    setFdTitle('');
    setFdDescription('');
    setFdLat(37.0662);
    setFdLng(37.3781);
    setFdRadius(40);
    setFdPoints(25);
    setFdStock(100);
    setFdPerUser(1);
    setFdCafeId('');
    setFdRewardId('');
    setFdImageUrl('');
    setFdModelUrl('');
    setFdActive(true);
    setFdStartsAt(toLocalInput(start.toISOString()));
    setFdEndsAt(toLocalInput(end.toISOString()));
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeMenu === 'overview') {
        const [data, orders, users, cafes, menu] = await Promise.all([
          api.getDashboardOverview(),
          api.getOrders().catch(() => []),
          api.getUsers().catch(() => []),
          api.getCafes().catch(() => []),
          api.getAllMenuItems().catch(() => []),
        ]);
        setOverviewData(data);
        setOrdersList(extractArray(orders));
        setUsersList(extractArray(users));
        setCafesList(extractArray(cafes));
        setMenuItemsList(extractArray(menu));
      } else if (activeMenu === 'users') {
        const users = await api.getUsers();
        setUsersList(extractArray(users));
      } else if (activeMenu === 'cafes') {
        const cafes = await api.getCafes();
        setCafesList(extractArray(cafes));
      } else if (activeMenu === 'products') {
        const [cafes, menu] = await Promise.all([
          api.getCafes(),
          api.getAllMenuItems().catch(() => []),
        ]);
        setCafesList(extractArray(cafes));
        setMenuItemsList(extractArray(menu));
      } else if (activeMenu === 'qr' || activeMenu === 'ismarliyor') {
        const [orders, cafes, users, menu] = await Promise.all([
          api.getOrders(),
          api.getCafes(),
          api.getUsers().catch(() => []),
          api.getAllMenuItems().catch(() => []),
        ]);
        setOrdersList(extractArray(orders));
        setCafesList(extractArray(cafes));
        setUsersList(extractArray(users));
        setMenuItemsList(extractArray(menu));
      } else if (activeMenu === 'points') {
        const pts = await api.getPointsLedger();
        setPointsList(extractArray(pts));
      } else if (activeMenu === 'rewards') {
        const r = await api.getRewards();
        setRewardsList(extractArray(r));
      } else if (activeMenu === 'fieldDrops') {
        const [drops, cafes, rewards] = await Promise.all([
          api.getFieldDrops(),
          api.getCafes().catch(() => []),
          api.getRewards().catch(() => []),
        ]);
        setFieldDropsList(extractArray(drops));
        setCafesList(extractArray(cafes));
        setRewardsList(extractArray(rewards));
        if (selectedFieldDropId) {
          const captures = await api.getFieldDropCaptures(selectedFieldDropId).catch(() => []);
          setFieldCapturesList(extractArray(captures));
        } else {
          setFieldCapturesList([]);
        }
      } else if (activeMenu === 'campaigns') {
        const c = await api.getCampaigns();
        setCampaignsList(extractArray(c));
      } else if (activeMenu === 'events') {
        const a = await api.getAdminActivities().catch(() => api.getActivities());
        setEventsList(extractArray(a));
        const places = await api.getAdminPlaces().catch(() => ({ items: [] }));
        setEventPlacesList(places?.items || extractArray(places));
      } else if (activeMenu === 'homeContent' || activeMenu === 'places') {
        // Panels load their own data.
      } else if (activeMenu === 'notifications') {
        const n = await api.getNotifications();
        setNotificationsList(extractArray(n));
      } else if (activeMenu === 'audit') {
        const logs = await api.getAuditLogs();
        setAuditLogsList(extractArray(logs));
      } else if (activeMenu === 'roles') {
        const users = await api.getUsers();
        setUsersList(extractArray(users));
      } else if (activeMenu === 'reports') {
        const [summary, users, pts, orders, drops, rewards] = await Promise.all([
          api.getReportsSummary(),
          api.getUsers().catch(() => []),
          api.getPointsLedger(1, 200).catch(() => []),
          api.getOrders().catch(() => []),
          api.getFieldDrops().catch(() => []),
          api.getRewards().catch(() => []),
        ]);
        setReportsSummary(summary);
        setUsersList(extractArray(users));
        setPointsList(extractArray(pts));
        setOrdersList(extractArray(orders));
        setFieldDropsList(extractArray(drops));
        setRewardsList(extractArray(rewards));
      }
    } catch (err: any) {
      setError(err.message || 'Veri yükleme hatası.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [activeMenu, selectedFieldDropId]);

  // Global Live Filtering Logic
  const getFilteredList = (list: any[]) => {
    const raw = extractArray(list);
    if (!searchQuery || !searchQuery.trim()) return raw;
    const q = searchQuery.toLowerCase().trim();
    return raw.filter((item: any) => {
      return (
        (item.name && String(item.name).toLowerCase().includes(q)) ||
        (item.title && String(item.title).toLowerCase().includes(q)) ||
        (item.email && String(item.email).toLowerCase().includes(q)) ||
        (item.firstName && String(item.firstName).toLowerCase().includes(q)) ||
        (item.lastName && String(item.lastName).toLowerCase().includes(q)) ||
        (item.userFullName && String(item.userFullName).toLowerCase().includes(q)) ||
        (item.cafeName && String(item.cafeName).toLowerCase().includes(q)) ||
        (item.collectionCode && String(item.collectionCode).toLowerCase().includes(q)) ||
        (item.description && String(item.description).toLowerCase().includes(q)) ||
        (item.address && String(item.address).toLowerCase().includes(q))
      );
    });
  };

  // Filtered Ismarlıyor List
  const getIsmarliyorList = () => {
    let list = getFilteredList(ordersList);
    if (ismarliyorStatusFilter === 'Pending') {
      return list.filter(o => o.status === 'Pending' || o.status === 'Submitted' || o.status === 'Created');
    }
    if (ismarliyorStatusFilter === 'Approved') {
      return list.filter(o => o.status === 'Approved' || o.status === 'Preparing');
    }
    if (ismarliyorStatusFilter === 'Live') {
      return list.filter(o => o.status === 'Ready');
    }
    if (ismarliyorStatusFilter === 'Completed') {
      return list.filter(o => o.status === 'Delivered' || o.status === 'Completed');
    }
    if (ismarliyorStatusFilter === 'Rejected') {
      return list.filter(o => o.status === 'Cancelled' || o.status === 'Rejected');
    }
    return list;
  };

  // Open Cafe Detail Modal
  const handleOpenCafeDetail = (cafe: any) => {
    setSelectedCafeDetail(cafe);
    setEditCafeName(cafe.name || '');
    setEditCafeAddress(cafe.address || '');
    setEditCafeImageUrl(cafe.imageUrl || '');
  };

  // File Upload Helper
  const handleFileUploadHelper = async (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    try {
      const url = await api.uploadFile(file);
      setter(url);
      setSuccess('Görsel sunucuya yüklendi!');
    } catch (err: any) {
      setError(err.message || 'Görsel yükleme hatası.');
    } finally {
      setUploadingFile(false);
    }
  };

  // Save Cafe Edits inside Detail Modal
  const handleSaveCafeEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCafeDetail) return;
    setSavingCafeEdit(true);
    try {
      await api.updateCafe(selectedCafeDetail.id, {
        name: editCafeName,
        address: editCafeAddress,
        imageUrl: editCafeImageUrl || undefined,
        categoryId: selectedCafeDetail.categoryId || '22222222-2222-2222-2222-222222222222'
      });
      setSuccess(`Göl Kafe '${editCafeName}' kaydedildi.`);
      setSelectedCafeDetail(null);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Göl Kafe güncellenemedi.');
    } finally {
      setSavingCafeEdit(false);
    }
  };

  // Creation Handlers
  const handleCreateCafe = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createCafe({
        name: newCafeName,
        address: newCafeAddress,
        imageUrl: newCafeImageUrl || uploadedImageUrl || undefined,
        categoryId: '22222222-2222-2222-2222-222222222222'
      });

      const cafeId = createdId(res);
      if (!cafeId) {
        throw new Error('Göl Kafe oluşturuldu ancak kimlik dönmedi.');
      }

      setSuccess(`Göl Kafe '${newCafeName}' eklendi.`);
      setShowAddCafeModal(false);
      setNewCafeName('');
      setNewCafeAddress('');
      setNewCafeImageUrl('');
      setUploadedImageUrl('');
      setSelectedProductIdsForCafe([]);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Göl Kafe eklenemedi.');
    }
  };

  const handleCreateMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetCafeId = newProdCafeId || 'ALL';
    const targetCafeObj = cafesList.find(c => c.id === targetCafeId);
    const cafeNameLabel = targetCafeId === 'ALL' ? 'Tüm Şubelerde Geçerli' : (targetCafeObj?.name || 'Göl Kafe Şubesi');

    const cafeId = targetCafeId === 'ALL' ? cafesList[0]?.id : targetCafeId;
    if (!cafeId) {
      setError('Menü ürünü eklemek için önce bir Göl Kafe ekleyin.');
      return;
    }

    try {
      const newItem = await api.createMenuItem(cafeId, {
        name: newProdName,
        description: newProdDesc,
        price: Number(newProdPrice),
        imageUrl: uploadedImageUrl || undefined,
        requiredEducation: undefined
      });

      if (!createdId(newItem)) {
        throw new Error('Ürün oluşturuldu ancak kimlik dönmedi.');
      }

      setSuccess(`Ürün '${newProdName}' menüye eklendi.`);
      setShowAddProductModal(false);
      setNewProdName('');
      setNewProdDesc('');
      setNewProdPrice(45);
      setUploadedImageUrl('');
      setNewProdCafeId('ALL');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Ürün eklenemedi.');
    }
  };

  const handleCreateReward = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createReward({
        title: newRewardTitle,
        description: newRewardDesc,
        requiredPoints: Number(newRewardPoints),
        imageUrl: uploadedImageUrl || undefined
      });

      if (!createdId(res)) {
        throw new Error('Ödül oluşturuldu ancak kimlik dönmedi.');
      }

      setSuccess(`Ödül '${newRewardTitle}' eklendi. ${newRewardPoints} GP`);
      setShowAddRewardModal(false);
      setNewRewardTitle('');
      setNewRewardDesc('');
      setNewRewardPoints(50);
      setUploadedImageUrl('');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Ödül eklenemedi.');
    }
  };

  // ADMIN ISMARLIYOR CREATION WITH TARGET CRITERIA
  const handleCreateIsmarliyor = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedCafeObj = cafesList.find(c => c.id === newIsmCafeId);
    const citizen = usersList.find((u: any) => u.id === newIsmUserId);
    const menuMatch = menuItemsList.find((m: any) => m.id === newIsmMenuItemId);
    if (!citizen?.id) {
      setError('İkram eden vatandaşı listeden seçin.');
      return;
    }
    if (!selectedCafeObj?.id) {
      setError('İkram şubesini seçin.');
      return;
    }
    if (!menuMatch?.id) {
      setError('İkram ürününü menüden seçin. Boş menü için önce ürün ekleyin.');
      return;
    }

    try {
      const created = await api.createOrder({
        userId: citizen.id,
        cafeId: selectedCafeObj.id,
        paidWithPoints: false,
        imageUrl: newIsmProofUrl || uploadedImageUrl || undefined,
        items: [
          {
            menuItemId: menuMatch.id,
            quantity: Number(newIsmQuantity) || 1
          }
        ]
      });

      if (!createdId(created)) {
        throw new Error('Ismarlıyor oluşturuldu ancak kimlik dönmedi.');
      }

      setSuccess(`Ismarlıyor yayınlandı (${created.collectionCode || createdId(created)}).`);
      setShowAddIsmarliyorModal(false);
      setNewIsmUserId('');
      setNewIsmCafeId('');
      setNewIsmMenuItemId('');
      setNewIsmItemName('');
      setNewIsmProofUrl('');
      setUploadedImageUrl('');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Ismarlıyor oluşturulamadı.');
    }
  };

  // FIX EVENT CREATION FUNCTION
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newAct = await api.createActivity({
        title: newEventTitle,
        description: newEventDesc,
        location: newEventLocation || 'Şehitkamil Gençlik Merkezi',
        placeId: newEventPlaceId || undefined,
        pointsReward: Number(newEventPoints),
        capacity: Number(newEventQuota) || undefined,
        imageUrl: uploadedImageUrl || undefined,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 86400000).toISOString()
      });
      
      if (!createdId(newAct) && !newAct?.id) {
        throw new Error('Etkinlik kaydedildi ancak kimlik dönmedi.');
      }

      setSuccess(`Etkinlik yayınlandı: ${newEventTitle}`);
      setShowAddEventModal(false);
      setNewEventTitle('');
      setNewEventDesc('');
      setNewEventLocation('');
      setNewEventPlaceId('');
      setNewEventPoints(100);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Etkinlik eklenemedi.');
    }
  };

  // DETAILED CAMPAIGN & DISCOUNT CREATION FUNCTION
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createCampaign({
        title: newCampTitle,
        description: newCampDesc,
        campaignType: newCampType,
        targetUserGroup: newCampTargetGroup,
        startDate: new Date(newCampStartDate).toISOString(),
        endDate: new Date(newCampEndDate).toISOString(),
        imageUrl: newCampImageUrl || uploadedImageUrl || undefined,
        cafeId: newCampCafeId === 'ALL' ? undefined : newCampCafeId
      });

      if (!res?.id && !createdId(res)) {
        throw new Error('Kampanya kaydedildi ancak kimlik dönmedi.');
      }

      setSuccess(`Kampanya yayınlandı: ${newCampTitle}`);
      setShowAddCampaignModal(false);
      setNewCampTitle('');
      setNewCampDesc('');
      setNewCampImageUrl('');
      setUploadedImageUrl('');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Kampanya oluşturulamadı.');
    }
  };

  const handleSendPushNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pushTitle || !pushMessage) {
      setError('Lütfen bildirim başlığı ve mesajı girin.');
      return;
    }
    try {
      await api.sendNotification({
        title: pushTitle,
        message: pushMessage,
        targetUserGroup: pushTargetGroup || 'All',
        notificationType: 'General',
        minAge: pushMinAge === '' ? undefined : Number(pushMinAge),
        maxAge: pushMaxAge === '' ? undefined : Number(pushMaxAge),
        educationLevel: pushEducation || undefined,
        targetUserId: pushUserId || undefined
      });
      setSuccess('Bildirim kaydedildi.');
      setPushTitle('');
      setPushMessage('');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Bildirim gönderilemedi.');
    }
  };

  // Single Click Order Status Update
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      await api.updateOrderStatus(orderId, status);
      setSuccess(`Sipariş ${status === 'Delivered' ? 'teslim edildi' : status}.`);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Sipariş durumu güncellenemedi.');
    }
  };

  // Open Citizen Detail Drawer
  const handleOpenUserDrawer = async (user: any) => {
    try {
      const detail = await api.getUserDetail(user.id);
      const profile = detail?.profile ? { ...detail.profile, ...detail } : (detail || user);
      setSelectedUserDrawer(profile);
    } catch (err: any) {
      setSelectedUserDrawer(user);
    }
  };

  // Submit Point/Reward Adjustment
  const handleAdjustPointsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pointAdjustUserId) return;
    if (!pointReason || pointReason.length < 3) {
      setError('Lütfen gerekçeli işlem nedenini açıkça yazın.');
      return;
    }

    try {
      await api.adjustUserPoints(pointAdjustUserId, {
        amount: pointAmount,
        actionType: pointActionType as any,
        reason: pointReason,
        description: pointDescription
      });
      setSuccess(`Gerekçeli işlem kaydedildi (${pointActionType}: ${pointAmount} GP).`);
      setPointAdjustUserId(null);
      setPointReason('');
      setPointDescription('');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Puan işlemi kaydedilemedi.');
    }
  };

  // POS QR Scan Submit
  const handleScanQrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setQrScanLoading(true);
    setQrScanError(null);
    setQrScanResult(null);

    try {
      if (!qrTokenInput.trim()) {
        setQrScanError('Vatandaş dinamik QR tokenını girin.');
        setQrScanLoading(false);
        return;
      }
      const selectedCafe = qrSelectedCafeId || cafesList[0]?.id;
      if (!selectedCafe) {
        setQrScanError('Önce bir tesis seçin.');
        setQrScanLoading(false);
        return;
      }
      const res = await api.scanQr({
        qrToken: qrTokenInput.trim(),
        cafeId: selectedCafe,
        amount: Number(qrAmount) || 0,
        paidWithPoints: qrPaidWithPoints,
        redeemCode: qrRedeemCode.trim() || null
      });
      setQrScanResult(res);
      setSuccess(`QR okundu. ${res.memberName || ''} · ${res.operation || 'işlem'}`);
      fetchData();
    } catch (err: any) {
      setQrScanError(err.message || 'QR Kod doğrulanamadı.');
    } finally {
      setQrScanLoading(false);
    }
  };

  const handleExportCsv = () => {
    const rows: string[][] = [
      ['Kaynak', 'Başlık', 'Detay', 'Değer'],
      ...usersList.map((u: any) => ['Vatandaş', `${u.firstName || ''} ${u.lastName || ''}`.trim(), u.email || '', String(u.pointsBalance ?? 0)]),
      ...ordersList.map((o: any) => ['Ismarlıyor', o.collectionCode || o.id, `${o.userFullName || ''} · ${o.cafeName || ''}`, o.status || '']),
      ...pointsList.map((p: any) => ['GölPuan', p.userFullName || p.description || '', p.description || '', String(p.amount ?? '')]),
      ...fieldDropsList.map((d: any) => ['Saha hediyesi', d.title || '', `${d.latitude}, ${d.longitude}`, String(d.capturedCount ?? 0)])
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `golbox-rapor-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setSuccess('Canlı kayıtlar CSV olarak indirildi.');
  };

  const openCreateFieldDrop = () => {
    resetFieldDropForm();
    setShowFieldDropModal(true);
  };

  const openEditFieldDrop = (drop: any) => {
    setEditingFieldDropId(drop.id);
    setFdTitle(drop.title || '');
    setFdDescription(drop.description || '');
    setFdLat(Number(drop.latitude) || 37.0662);
    setFdLng(Number(drop.longitude) || 37.3781);
    setFdRadius(Number(drop.radiusMeters) || 40);
    setFdPoints(Number(drop.pointsGranted) || 0);
    setFdStock(drop.totalStock ?? '');
    setFdPerUser(Number(drop.perUserLimit) || 1);
    setFdCafeId(drop.cafeId || '');
    setFdRewardId(drop.catalogRewardId || '');
    setFdImageUrl(drop.imageUrl || '');
    setFdModelUrl(drop.modelGlbUrl || '');
    setFdActive(drop.isActive !== false);
    setFdStartsAt(toLocalInput(drop.startsAt));
    setFdEndsAt(toLocalInput(drop.endsAt));
    setShowFieldDropModal(true);
  };

  const handleSaveFieldDrop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fdTitle.trim()) {
      setError('Saha hediyesi başlığı zorunludur.');
      return;
    }
    if (fdRadius < 10 || fdRadius > 500) {
      setError('Yarıçap 10 ile 500 metre arasında olmalıdır.');
      return;
    }
    setSavingFieldDrop(true);
    setError(null);
    try {
      const payload = {
        title: fdTitle.trim(),
        description: fdDescription.trim(),
        latitude: Number(fdLat),
        longitude: Number(fdLng),
        radiusMeters: Number(fdRadius),
        pointsGranted: Number(fdPoints),
        totalStock: fdStock === '' ? null : Number(fdStock),
        perUserLimit: Number(fdPerUser) || 1,
        cafeId: fdCafeId || null,
        catalogRewardId: fdRewardId || null,
        imageUrl: fdImageUrl || undefined,
        modelGlbUrl: fdModelUrl || undefined,
        isActive: fdActive,
        startsAt: fdStartsAt ? new Date(fdStartsAt).toISOString() : undefined,
        endsAt: fdEndsAt ? new Date(fdEndsAt).toISOString() : undefined
      };
      const res = editingFieldDropId
        ? await api.updateFieldDrop(editingFieldDropId, payload)
        : await api.createFieldDrop(payload);
      if (!createdId(res) && !editingFieldDropId) {
        throw new Error('Saha hediyesi kaydedildi ancak kimlik dönmedi.');
      }
      setSuccess(editingFieldDropId ? 'Saha hediyesi güncellendi.' : 'Saha hediyesi yayınlandı.');
      setShowFieldDropModal(false);
      resetFieldDropForm();
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Saha hediyesi kaydedilemedi.');
    } finally {
      setSavingFieldDrop(false);
    }
  };

  const handleDeleteFieldDrop = async (id: string) => {
    if (!window.confirm('Bu saha hediyesini kaldırmak istediğinize emin misiniz?')) return;
    try {
      await api.deleteFieldDrop(id);
      if (selectedFieldDropId === id) {
        setSelectedFieldDropId(null);
        setFieldCapturesList([]);
      }
      setSuccess('Saha hediyesi kaldırıldı.');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Saha hediyesi silinemedi.');
    }
  };

  const handleToggleFieldDrop = async (drop: any) => {
    try {
      await api.updateFieldDrop(drop.id, {
        title: drop.title,
        description: drop.description,
        latitude: drop.latitude,
        longitude: drop.longitude,
        radiusMeters: drop.radiusMeters,
        pointsGranted: drop.pointsGranted,
        totalStock: drop.totalStock,
        perUserLimit: drop.perUserLimit,
        cafeId: drop.cafeId,
        catalogRewardId: drop.catalogRewardId,
        imageUrl: drop.imageUrl,
        modelGlbUrl: drop.modelGlbUrl,
        isActive: !drop.isActive,
        startsAt: drop.startsAt,
        endsAt: drop.endsAt
      });
      setSuccess(drop.isActive ? 'Saha hediyesi durduruldu.' : 'Saha hediyesi yayına alındı.');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Durum güncellenemedi.');
    }
  };

  const getMenuLabel = (key: string) => {
    const labels: Record<string, string> = {
      overview: 'Genel Bakış',
      users: 'Vatandaşlar',
      cafes: 'Göl Kafeler',
      places: 'Tesisler',
      products: 'Menü ve Ürünler',
      points: 'GölPuan Defteri',
      qr: 'QR İşlemleri',
      rewards: 'Ödüller',
      fieldDrops: 'Saha Hediyeleri',
      ismarliyor: 'Ismarlıyor',
      homeContent: 'Ana Sayfa İçerikleri',
      campaigns: 'Kampanya İçerikleri',
      events: 'Etkinlikler',
      notifications: 'Duyurular / Bildirimler',
      reports: 'Raporlar',
      roles: 'Yetkilendirme',
      audit: 'Denetim',
      settings: 'Ayarlar'
    };
    return labels[key] || 'Yönetim';
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: '#f4f7f5',
      color: '#1c2e2e',
      fontFamily: 'Manrope, system-ui, sans-serif'
    }}>
      
      <aside style={{
        width: sidebarCollapsed ? '76px' : '270px',
        background: '#1d5f60',
        color: '#f4f7f5',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s ease',
        flexShrink: 0,
        zIndex: 50
      }}>
        <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: sidebarCollapsed ? 'center' : 'space-between', padding: '0 1.15rem' }}>
          {!sidebarCollapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '14px',
                background: '#ffffff',
                color: '#1d5f60',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1rem',
                fontFamily: 'Fraunces, Georgia, serif'
              }}>
                ŞB
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#ffffff', lineHeight: 1.2, fontFamily: 'Fraunces, Georgia, serif' }}>Şehitkamil+</div>
                <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.72)', fontWeight: 600 }}>Şehitkamil Belediyesi</div>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', padding: '6px', borderRadius: '10px', cursor: 'pointer', display: 'flex' }}
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <div style={{ flexGrow: 1, overflowY: 'auto', padding: '0.5rem 0.6rem' }}>
          {[
            {
              section: 'İşlem',
              items: [
                { id: 'overview', label: 'Genel Bakış', icon: LayoutDashboard },
                { id: 'users', label: 'Vatandaşlar', icon: Users },
                { id: 'places', label: 'Tesisler', icon: Landmark },
                { id: 'cafes', label: 'Göl Kafeler', icon: Building2 },
                { id: 'products', label: 'Menü ve Ürünler', icon: Coffee }
              ]
            },
            {
              section: 'Sadakat',
              items: [
                { id: 'points', label: 'GölPuan Defteri', icon: History },
                { id: 'qr', label: 'QR İşlemleri', icon: CreditCard },
                { id: 'rewards', label: 'Ödüller', icon: Award },
                { id: 'fieldDrops', label: 'Saha Hediyeleri', icon: MapPin },
                { id: 'ismarliyor', label: 'Ismarlıyor', icon: Gift }
              ]
            },
            {
              section: 'İletişim',
              items: [
                { id: 'homeContent', label: 'Ana Sayfa İçerikleri', icon: FileText },
                { id: 'campaigns', label: 'Kampanya İçerikleri', icon: Megaphone },
                { id: 'events', label: 'Etkinlikler', icon: Calendar },
                { id: 'notifications', label: 'Duyurular / Bildirimler', icon: Bell }
              ]
            },
            {
              section: 'Yönetim',
              items: [
                { id: 'reports', label: 'Raporlar', icon: BarChart3 },
                { id: 'roles', label: 'Yetkilendirme', icon: Shield },
                { id: 'audit', label: 'Denetim', icon: FileCheck },
                { id: 'settings', label: 'Ayarlar', icon: Settings }
              ]
            }
          ].map((grp, idx) => {
            const items = grp.items.filter((item) => isAdminUser || staffMenuIds.has(item.id));
            if (items.length === 0) return null;
            return (
            <div key={idx} style={{ marginBottom: '1.1rem' }}>
              {!sidebarCollapsed && (
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', padding: '0 0.75rem 0.4rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {grp.section}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeMenu === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveMenu(item.id as any)}
                      title={sidebarCollapsed ? item.label : undefined}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '14px',
                        background: isActive ? '#ffffff' : 'transparent',
                        color: isActive ? '#1d5f60' : 'rgba(255,255,255,0.82)',
                        border: 'none',
                        fontSize: '0.85rem',
                        fontWeight: isActive ? 700 : 500,
                        cursor: 'pointer',
                        fontFamily: 'Manrope, system-ui, sans-serif',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Icon size={18} color={isActive ? '#1d5f60' : 'rgba(255,255,255,0.82)'} />
                        {!sidebarCollapsed && <span>{item.label}</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            );
          })}
        </div>

        <div style={{ padding: sidebarCollapsed ? '0.75rem 0.5rem' : '0.9rem 1rem', borderTop: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '14px', background: '#ffffff', color: '#1d5f60', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0, fontFamily: 'Fraunces, Georgia, serif' }}>
            {adminInitials}
          </div>
          {!sidebarCollapsed && (
            <div style={{ minWidth: 0, flexGrow: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {adminName}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{adminRole}</div>
            </div>
          )}
          {!sidebarCollapsed && (
            <button onClick={logout} title="Çıkış" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.85)', cursor: 'pointer', padding: '6px' }}>
              <LogOut size={18} />
            </button>
          )}
        </div>
      </aside>

      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        
        <header style={{ height: '80px', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', position: 'sticky', top: 0, zIndex: 40 }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#5b6f6e', fontWeight: 600 }}>Şehitkamil Belediyesi</div>
            <h1 style={{ margin: 0, fontSize: '1.45rem', fontFamily: 'Fraunces, Georgia, serif', fontWeight: 700, color: '#1c2e2e' }}>{getMenuLabel(activeMenu)}</h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ position: 'relative', width: '260px' }}>
              <Search size={16} style={{ position: 'absolute', left: '14px', top: '12px', color: '#5b6f6e' }} />
              <input
                type="text"
                placeholder="Listede ara"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.9rem 0.6rem 2.5rem',
                  background: '#ffffff',
                  border: '1px solid #d7e3e0',
                  borderRadius: '999px',
                  color: '#1c2e2e',
                  fontSize: '0.85rem',
                  fontFamily: 'Manrope, system-ui, sans-serif',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <button
              onClick={() => setActiveMenu('notifications')}
              title="Duyurular / Bildirimler"
              style={{ background: '#fff', border: '1px solid #d7e3e0', cursor: 'pointer', padding: '8px', borderRadius: '14px', display: 'flex' }}
            >
              <Bell size={18} color="#1d5f60" />
            </button>
          </div>
        </header>

        {/* Global Alert Banners */}
        {error && (
          <div style={{ background: '#fef2f2', borderBottom: '1px solid #fecaca', color: '#991b1b', padding: '0.75rem 2rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#991b1b', cursor: 'pointer' }}><X size={16} /></button>
          </div>
        )}

        {success && (
          <div style={{ background: '#f0fdf4', borderBottom: '1px solid #bbf7d0', color: '#166534', padding: '0.75rem 2rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={18} />
              <span>{success}</span>
            </div>
            <button onClick={() => setSuccess(null)} style={{ background: 'none', border: 'none', color: '#166534', cursor: 'pointer' }}><X size={16} /></button>
          </div>
        )}

        {/* Main Workspace Body */}
        <main style={{ flexGrow: 1, padding: '2rem', overflowY: 'auto' }}>
          
          {/* ------------------------------------------------------------- */}
          {/* 1. DASHBOARD */}
          {/* ------------------------------------------------------------- */}
          {activeMenu === 'overview' && (
            <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0, fontFamily: 'Fraunces, Georgia, serif' }}>Genel bakış</h1>
                <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '4px' }}>Kayıtlı vatandaş, GölPuan ve bekleyen işlemler.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1d5f60', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Vatandaş</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>{overviewData?.totalUsers ?? overviewData?.metrics?.registeredCitizensCount ?? usersList.length ?? 0}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>Kayıtlı kullanıcı</div>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1d5f60', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Dağıtılan GölPuan</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>{overviewData?.todayEarnedPoints ?? overviewData?.metrics?.todayEarnedPoints ?? 0} GP</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>Bugün kazandırılan</div>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1d5f60', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Bekleyen Ismarlıyor</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>{overviewData?.pendingOrders ?? overviewData?.metrics?.pendingOrdersCount ?? getIsmarliyorList().filter((o: any) => o.status === 'Pending' || o.status === 'Preparing').length}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>Onay bekleyen</div>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1d5f60', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Bugünkü işlem</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>{overviewData?.todayOrders ?? overviewData?.metrics?.todayOrdersCount ?? 0}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>Sipariş / teslim</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem' }}>
                  <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Bekleyen Ismarlıyor</h3>
                  {ordersList.filter((o: any) => o.status === 'Pending' || o.status === 'Preparing' || o.status === 'Submitted' || o.status === 'Created').length === 0 ? (
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>Bekleyen kayıt yok.</p>
                  ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                        <th style={{ padding: '0.65rem' }}>Kod</th>
                        <th style={{ padding: '0.65rem' }}>Vatandaş</th>
                        <th style={{ padding: '0.65rem' }}>Hedef</th>
                        <th style={{ padding: '0.65rem' }}>Şube</th>
                        <th style={{ padding: '0.65rem', textAlign: 'right' }}>İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ordersList.filter((o: any) => o.status === 'Pending' || o.status === 'Preparing' || o.status === 'Submitted' || o.status === 'Created').slice(0, 4).map(o => (
                        <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.75rem 0.65rem', fontWeight: 800, color: '#b45309' }}>{o.collectionCode}</td>
                          <td style={{ padding: '0.75rem 0.65rem', fontWeight: 700 }}>{o.userFullName}</td>
                          <td style={{ padding: '0.75rem 0.65rem', color: '#64748b' }}>{o.targetCriteria || '—'}</td>
                          <td style={{ padding: '0.75rem 0.65rem', color: '#64748b' }}>{o.cafeName}</td>
                          <td style={{ padding: '0.75rem 0.65rem', textAlign: 'right' }}>
                            <button onClick={() => handleUpdateOrderStatus(o.id, 'Delivered')} style={{ padding: '4px 10px', background: '#1d5f60', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                              Onayla
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  )}
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Kısayollar</h3>
                  <button onClick={() => setShowAddIsmarliyorModal(true)} style={{ padding: '0.75rem', background: '#1d5f60', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Gift size={18} /> Yeni Ismarlıyor
                  </button>
                  <button onClick={() => setShowAddEventModal(true)} style={{ padding: '0.75rem', background: '#fff', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={18} /> Yeni etkinlik
                  </button>
                  <button onClick={() => setShowAddRewardModal(true)} style={{ padding: '0.75rem', background: '#fff', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Award size={18} /> Yeni ödül
                  </button>
                  <button onClick={() => setActiveMenu('fieldDrops')} style={{ padding: '0.75rem', background: '#fff', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MapPin size={18} /> Saha hediyeleri
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeMenu === 'users' && (
            <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Vatandaş & Kullanıcı Yönetimi</h1>
                <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '4px' }}>Gaziantep Şehitkamil ilçesi kayıtlı vatandaşlar ve puan hareketleri.</p>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', color: '#475569', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                      <th style={{ padding: '0.85rem 1rem' }}>Vatandaş</th>
                      <th style={{ padding: '0.85rem 1rem' }}>E-Posta & Tel</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Yaş</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Öğrenim Durumu</th>
                      <th style={{ padding: '0.85rem 1rem' }}>GölPuan Bakiyesi</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Hesap Durumu</th>
                      <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredList(usersList).length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: '1.5rem', color: '#64748b' }}>Vatandaş kaydı yok.</td>
                      </tr>
                    ) : getFilteredList(usersList).map((u) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#1d5f60', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
                              {u.firstName?.charAt(0) || 'V'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: '#0f172a' }}>{u.firstName} {u.lastName}</div>
                              <div style={{ fontSize: '0.725rem', color: '#64748b' }}>Kayıt: {new Date(u.createdDate || Date.now()).toLocaleDateString('tr-TR')}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>
                          <div>{u.email}</div>
                          <div style={{ fontSize: '0.725rem', color: '#94a3b8' }}>{u.phoneNumber || u.phone || '—'}</div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>{u.age ?? '—'}</td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{ background: '#e8f2f2', color: '#1d5f60', padding: '3px 10px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 700 }}>
                            {u.educationLevel || '—'}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#b45309', fontSize: '1rem' }}>
                          {u.pointsBalance} GP
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{ background: '#e8f2f2', color: '#1d5f60', padding: '3px 10px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 700 }}>
                            {u.role || u.status || 'Kayıtlı'}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => handleOpenUserDrawer(u)} style={{ padding: '5px 10px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700 }}>
                              Detay Drawer
                            </button>
                            <button onClick={() => setPointAdjustUserId(u.id)} style={{ padding: '5px 10px', background: '#1d5f60', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700 }}>
                              Puan/İkram Tanımla
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* 3. GÖL KAFELER */}
          {/* ------------------------------------------------------------- */}
          {activeMenu === 'cafes' && (
            <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Gaziantep Şehitkamil Göl Kafeler</h1>
                  <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '4px' }}>Kafe silindiğinde operasyon kaydı pasife alınır. Bağlı tesis (Place) silinmez, vatandaş görünümünden taslağa çekilir.</p>
                </div>
                <button onClick={() => setShowAddCafeModal(true)} style={{ background: '#1d5f60', color: '#fff', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '10px', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Plus size={18} />
                  <span>+ Yeni Şehitkamil Kafe Ekle</span>
                </button>
              </div>

              {getFilteredList(cafesList).length === 0 ? emptyNote('Kafe kaydı yok.') : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                {getFilteredList(cafesList).map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleOpenCafeDetail(c)}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)'
                    }}
                  >
                    {c.imageUrl ? (
                      <img src={c.imageUrl} alt={c.name} style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100px', background: '#1d5f60', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                        <Building2 size={36} />
                      </div>
                    )}
                    <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{c.name}</h3>
                        <span style={{ background: c.isActive === false ? '#fee2e2' : '#dcfce7', color: c.isActive === false ? '#b91c1c' : '#15803d', padding: '3px 8px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 700 }}>
                          {c.isActive === false ? 'Pasif' : 'Aktif'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={14} /> <span>{c.address}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* 4. MENÜ VE ÜRÜNLER (WITH PRO PHOTO UPLOAD & CREATION MODAL) */}
          {/* ------------------------------------------------------------- */}
          {activeMenu === 'products' && (
            <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Şehitkamil Menü & Ürün Kataloğu</h1>
                  <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '4px' }}>Kitap Kafe şubeleri için fotoğraflı ürün ekleme, fiyatlandırma ve kitle şartı yönetimi.</p>
                </div>

                <button
                  onClick={() => setShowAddProductModal(true)}
                  style={{
                    background: '#1d5f60',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.7rem 1.35rem',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 14px rgba(29, 95, 96, 0.25)'
                  }}
                >
                  <Coffee size={18} />
                  <span>+ Yeni Ürün / Menü Öğesi Ekle</span>
                </button>
              </div>

              {/* Cafe Branch Filter Selector */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: '#ffffff', padding: '0.85rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Filtrelenen Şube:</label>
                <select
                  value={newProdCafeId || 'ALL'}
                  onChange={(e) => setNewProdCafeId(e.target.value)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 700, color: '#0f172a', outline: 'none' }}
                >
                  <option value="ALL">Tüm Şubelerdeki Ürünler</option>
                  {extractArray(cafesList).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Pro Product Cards Grid */}
              {(() => {
                const productRows = getFilteredList(menuItemsList).filter((item: any) =>
                  !newProdCafeId || newProdCafeId === 'ALL' ? true : item.cafeId === newProdCafeId
                );
                if (productRows.length === 0) return emptyNote('Ürün kaydı yok.');
                return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                {productRows.map((item) => (
                  <div key={item.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)' }}>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '110px', background: '#1d5f60', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                        <Coffee size={36} />
                      </div>
                    )}
                    <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', flexGrow: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{item.name}</h3>
                          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b' }}>{item.description}</p>
                        </div>
                        <span style={{ background: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 800 }}>
                          {item.price} TL
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.725rem', background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                          {item.cafeName || 'Tesis'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
                );
              })()}
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* 7. İKRAMLAR VE ÖDÜLLER */}
          {/* ------------------------------------------------------------- */}
          {activeMenu === 'rewards' && (
            <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>GölPuan İkramlar & Ödüller Kataloğu</h1>
                  <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '4px' }}>Vatandaşların GölPuan ile Kitap Kafelerden ücretsiz alabileceği ikram hediyeleri.</p>
                </div>

                <button
                  onClick={() => setShowAddRewardModal(true)}
                  style={{
                    background: '#1d5f60',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.7rem 1.35rem',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 14px rgba(29, 95, 96, 0.25)'
                  }}
                >
                  <Award size={18} />
                  <span>+ GölPuan İkram Ödülü Ekle</span>
                </button>
              </div>

              {/* Rewards Cards Grid */}
              {getFilteredList(rewardsList).length === 0 ? emptyNote('Ödül kaydı yok.') : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                {getFilteredList(rewardsList).map((r) => (
                  <div key={r.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{r.title}</h3>
                      <span style={{ background: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 800 }}>
                        {rewardPoints(r)} GP
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>{r.description}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
                      <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '6px', fontSize: '0.725rem', fontWeight: 700 }}>{r.status || 'Kayıtlı'}</span>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </div>
          )}

          {activeMenu === 'fieldDrops' && (
            <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Saha Hediyeleri</h1>
                  <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '4px' }}>Konuma hediye bırakın. Vatandaş oraya gidince toplar. Katalog ödülü ve Ismarlıyor buradan ayrıdır.</p>
                </div>
                <button
                  onClick={openCreateFieldDrop}
                  style={{
                    background: '#1d5f60',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.7rem 1.35rem',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 14px rgba(29, 95, 96, 0.25)'
                  }}
                >
                  <MapPin size={18} />
                  <span>+ Konuma Hediye Bırak</span>
                </button>
              </div>

              {getFilteredList(fieldDropsList).length === 0 ? (
                <div style={{ background: '#fff', border: '1px dashed #cbd5e1', borderRadius: '16px', padding: '2rem', color: '#64748b' }}>
                  Henüz saha hediyesi yok. Sağ üstten konum pin’i oluşturun.
                </div>
              ) : getFilteredList(fieldDropsList).map((drop: any) => (
                <div key={drop.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>{drop.title}</h3>
                      <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: '#64748b' }}>{drop.description}</p>
                      <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#475569' }}>
                        {drop.cafeName ? `Tesis: ${drop.cafeName} · ` : ''}
                        {Number(drop.latitude).toFixed(5)}, {Number(drop.longitude).toFixed(5)} · {drop.radiusMeters} m yarıçap
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                      <span style={{ background: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: '100px', fontWeight: 800, fontSize: '0.85rem' }}>+{drop.pointsGranted} GP</span>
                      <span style={{ background: drop.isActive ? '#dcfce7' : '#fee2e2', color: drop.isActive ? '#15803d' : '#b91c1c', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                        {drop.isActive ? 'Yayında' : 'Durduruldu'}
                      </span>
                      {drop.modelGlbUrl ? (
                        <span style={{ background: '#ecfdf5', color: '#1d5f60', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>3D GLB</span>
                      ) : null}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Toplanan: {drop.capturedCount || 0}{drop.totalStock != null ? ` / ${drop.totalStock}` : ''}</span>
                    <button onClick={() => setSelectedFieldDropId(drop.id)} style={{ marginLeft: 'auto', padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 700, cursor: 'pointer' }}>Toplayanlar</button>
                    <button onClick={() => handleToggleFieldDrop(drop)} style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontWeight: 700, cursor: 'pointer' }}>{drop.isActive ? 'Durdur' : 'Yayınla'}</button>
                    <button onClick={() => openEditFieldDrop(drop)} style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontWeight: 700, cursor: 'pointer' }}>Düzenle</button>
                    <button onClick={() => handleDeleteFieldDrop(drop.id)} style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #fecaca', background: '#fef2f2', color: '#b91c1c', fontWeight: 700, cursor: 'pointer' }}>Kaldır</button>
                  </div>
                  {selectedFieldDropId === drop.id && (
                    <div style={{ marginTop: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.85rem' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: '0.5rem' }}>Toplayan vatandaşlar</div>
                      {fieldCapturesList.length === 0 ? (
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Henüz toplayan yok.</div>
                      ) : fieldCapturesList.map((cap: any) => (
                        <div key={cap.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '6px 0', borderBottom: '1px solid #f8fafc' }}>
                          <span>{cap.userFullName} · {cap.userEmail}</span>
                          <span>+{cap.pointsGranted} GP · {Math.round(cap.distanceMeters)} m</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* 8. ISMARLIYOR (DONATOR TARGET CRITERIA & ISMARLAYAN PHOTO) */}
          {/* ------------------------------------------------------------- */}
          {activeMenu === 'ismarliyor' && (
            <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Ismarlıyor Başvuruları & Yayınlama</h1>
                  <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '4px' }}>Şehitkamil Belediyesi hayırsever ikramları, hedef kitle kısıtlamaları (Gençler, Öğrenciler vb.) ve tek tıkla onay.</p>
                </div>

                <button
                  onClick={() => setShowAddIsmarliyorModal(true)}
                  style={{
                    background: '#1d5f60',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.7rem 1.35rem',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 14px rgba(29, 95, 96, 0.25)'
                  }}
                >
                  <Gift size={18} />
                  <span>+ Yeni Ismarlıyor (Kitle Kriterli) Ekle</span>
                </button>
              </div>

              {/* Status Filter Pills */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', background: '#ffffff', padding: '0.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                {[
                  { id: 'All', label: 'Tüm İkramlar' },
                  { id: 'Pending', label: 'İnceleme Bekleyenler' },
                  { id: 'Approved', label: 'Onaylananlar' },
                  { id: 'Live', label: 'Yayında (Hazır)' },
                  { id: 'Completed', label: 'Tamamlandı' }
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setIsmarliyorStatusFilter(st.id as any)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '0.825rem',
                      fontWeight: ismarliyorStatusFilter === st.id ? 700 : 500,
                      background: ismarliyorStatusFilter === st.id ? '#1d5f60' : 'transparent',
                      color: ismarliyorStatusFilter === st.id ? '#ffffff' : '#64748b',
                      cursor: 'pointer'
                    }}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Compact High-Density Table */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', color: '#475569', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                      <th style={{ padding: '0.85rem 1rem' }}>Kod</th>
                      <th style={{ padding: '0.85rem 1rem' }}>İkram Sahibi / Vatandaş</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Hedef Kriter</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Şube & Tutarı</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Ismarlayan Görseli</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Durum</th>
                      <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Otomatik Onay</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getIsmarliyorList().length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: '1.5rem', color: '#64748b' }}>Ismarlıyor kaydı yok.</td>
                      </tr>
                    ) : getIsmarliyorList().map((o) => (
                      <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#d97706' }}>{o.collectionCode}</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0f172a' }}>{o.userFullName}</td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '3px 10px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 700 }}>
                            {o.targetCriteria || '—'}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>{o.cafeName} ({o.totalAmount} TL)</td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          {o.imageUrl ? (
                            <button onClick={() => setPreviewProofImage(o.imageUrl)} style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                              Görsel Gör (#Önizle)
                            </button>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Görsel Yok</span>
                          )}
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{ padding: '4px 10px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 700, background: o.status === 'Delivered' ? '#dcfce7' : '#fef3c7', color: o.status === 'Delivered' ? '#15803d' : '#b45309' }}>
                            {o.status || '—'}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                          {o.status === 'Delivered' ? (
                            <span style={{ color: '#15803d', fontWeight: 700, fontSize: '0.75rem' }}>✓ Teslim Edildi</span>
                          ) : (
                            <button onClick={() => handleUpdateOrderStatus(o.id, 'Delivered')} style={{ padding: '6px 14px', background: '#16a34a', border: 'none', color: '#fff', borderRadius: '8px', fontSize: '0.775rem', fontWeight: 800, cursor: 'pointer' }}>
                              Tek Tıkla Onayla & İkram Et
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeMenu === 'places' && isAdminUser && (
            <PlacesPanel onError={setError} onSuccess={setSuccess} />
          )}

          {activeMenu === 'settings' && isAdminUser && (
            <SettingsPanel onError={setError} onSuccess={setSuccess} />
          )}

          {activeMenu === 'homeContent' && isAdminUser && (
            <HomeContentPanel onError={setError} onSuccess={setSuccess} />
          )}

          {/* ------------------------------------------------------------- */}
          {/* 9. KAMPANYALAR & İNDİRİMLER (PRO CREATION & DATES & CRITERIA) */}
          {/* ------------------------------------------------------------- */}
          {activeMenu === 'campaigns' && (
            <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Kampanya İçerikleri</h1>
                  <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '4px' }}>CMS kampanya içerikleri. Bu ekran bir ödül/bonus motoru değildir.</p>
                </div>

                <button
                  onClick={() => setShowAddCampaignModal(true)}
                  style={{
                    background: '#1d5f60',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.7rem 1.35rem',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 14px rgba(29, 95, 96, 0.25)'
                  }}
                >
                  <Tag size={18} />
                  <span>+ Yeni kampanya içeriği</span>
                </button>
              </div>

              {/* Campaigns Grid */}
              {getFilteredList(campaignsList).length === 0 ? emptyNote('Kampanya kaydı yok.') : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                {getFilteredList(campaignsList).map((c) => (
                  <div key={c.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)' }}>
                    {c.imageUrl ? (
                      <img src={c.imageUrl} alt={c.title} style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100px', background: '#1d5f60', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                        <Tag size={36} />
                      </div>
                    )}
                    <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', flexGrow: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{c.title}</h3>
                          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b' }}>{c.description}</p>
                        </div>
                        <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 800 }}>
                          {campaignTypeLabel(c.campaignType)}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: 'auto' }}>
                        <span style={{ fontSize: '0.725rem', background: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                          {targetGroupLabel(c.targetUserGroup)}
                        </span>
                        <span style={{ fontSize: '0.725rem', background: '#fef3c7', color: '#b45309', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                          {c.startDate ? new Date(c.startDate).toLocaleDateString('tr-TR') : '—'} - {c.endDate ? new Date(c.endDate).toLocaleDateString('tr-TR') : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* 10. ETKİNLİKLER VE GÖREVLER (FIXED EVENT CREATION) */}
          {/* ------------------------------------------------------------- */}
          {activeMenu === 'events' && (
            <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Gaziantep Şehitkamil Etkinlikleri & Görevler</h1>
                  <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '4px' }}>Saha etkinlikleri, gençlik faaliyetleri ve GölPuan ödülleri.</p>
                </div>
                <button onClick={() => setShowAddEventModal(true)} style={{ background: '#1d5f60', color: '#fff', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '10px', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Plus size={18} />
                  <span>+ Yeni Etkinlik Tanımla</span>
                </button>
              </div>

              {getFilteredList(eventsList).length === 0 ? emptyNote('Etkinlik kaydı yok.') : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
                {getFilteredList(eventsList).map((e) => (
                  <div key={e.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{e.title}</h3>
                      <span style={{ background: '#fef3c7', color: '#b45309', padding: '3px 10px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 800 }}>+{e.pointsReward} GP</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.825rem', color: '#64748b' }}>{e.description}</p>
                    <div style={{ fontSize: '0.75rem', color: '#0369a1', fontWeight: 600 }}>Konum: {e.placeName || e.location || '—'}</div>
                  </div>
                ))}
              </div>
              )}
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* 11. DUYURULAR VE BİLDİRİMLER */}
          {/* ------------------------------------------------------------- */}
          {activeMenu === 'notifications' && (
            <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Duyurular / Bildirimler</h1>
                <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '4px' }}>Şehitkamil Belediyesi mobil vatandaşlarına özel anlık Push Notification gönderimi.</p>
              </div>

              <form onSubmit={handleSendPushNotification} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '600px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Bildirim Başlığı</label>
                  <input type="text" placeholder="Örn: Şehitkamil Kitap Kafelerde Gençlere Özel +20 GP!" value={pushTitle} onChange={(e) => setPushTitle(e.target.value)} required style={{ width: '100%', padding: '0.65rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Bildirim Mesajı</label>
                  <textarea rows={3} placeholder="Duyuru detayını yazın..." value={pushMessage} onChange={(e) => setPushMessage(e.target.value)} required style={{ width: '100%', padding: '0.65rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Hedef kitle</label>
                  <select value={pushTargetGroup} onChange={(e) => setPushTargetGroup(e.target.value)} style={{ width: '100%', padding: '0.65rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                    <option value="All">Herkese</option>
                    <option value="AgeRange">Yaş aralığı</option>
                    <option value="EducationLevel">Eğitim seviyesi</option>
                    <option value="SingleUser">Belirli kullanıcı</option>
                  </select>
                </div>
                {pushTargetGroup === 'AgeRange' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                    <input type="number" placeholder="Min yaş" value={pushMinAge} onChange={(e) => setPushMinAge(e.target.value)} style={{ width: '100%', padding: '0.65rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                    <input type="number" placeholder="Max yaş" value={pushMaxAge} onChange={(e) => setPushMaxAge(e.target.value)} style={{ width: '100%', padding: '0.65rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                  </div>
                )}
                {pushTargetGroup === 'EducationLevel' && (
                  <select value={pushEducation} onChange={(e) => setPushEducation(e.target.value)} style={{ width: '100%', padding: '0.65rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                    <option value="">Seçin</option>
                    <option value="Lise">Lise</option>
                    <option value="Üniversite">Üniversite</option>
                  </select>
                )}
                {pushTargetGroup === 'SingleUser' && (
                  <input placeholder="Kullanıcı Id" value={pushUserId} onChange={(e) => setPushUserId(e.target.value)} style={{ width: '100%', padding: '0.65rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                )}
                <button type="submit" style={{ padding: '0.75rem', background: '#1d5f60', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <Send size={16} /> Toplu Anlık Bildirim Gönder
                </button>
              </form>
              {getFilteredList(notificationsList).length === 0 ? emptyNote('Gönderilmiş bildirim kaydı yok.') : (
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
                  {getFilteredList(notificationsList).map((n: any) => (
                    <div key={n.id} style={{ padding: '0.9rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ fontWeight: 700 }}>{n.title}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{n.message} · {n.status || '—'} · {n.sentCount ?? 0} alıcı</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* 12. STRATEJİK RAPORLAR */}
          {/* ------------------------------------------------------------- */}
          {activeMenu === 'reports' && (
            <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Raporlar</h1>
                  <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 0 }}>Canlı kayıtlardan özet. Dışa aktarım CSV üretir.</p>
                </div>
                <button onClick={handleExportCsv} style={{ padding: '0.65rem 1.25rem', background: '#1d5f60', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Download size={16} /> CSV indir
                </button>
              </div>
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
                {[
                  ['Vatandaş', reportsSummary?.citizens?.totalUsers ?? usersList.length],
                  ['GölPuan kazanılan', reportsSummary?.points?.totalEarnedPoints ?? 0],
                  ['GölPuan harcanan', reportsSummary?.points?.totalSpentPoints ?? 0],
                  ['Ismarlıyor / sipariş', reportsSummary?.orders?.totalOrders ?? ordersList.length],
                  ['Saha hediyesi', fieldDropsList.length],
                  ['Ödül', rewardsList.length]
                ].map(([label, count]) => (
                  <div key={String(label)} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.9rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ fontWeight: 700 }}>{label}</div>
                    <div style={{ fontWeight: 800, color: '#1d5f60' }}>{count}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeMenu === 'points' && (
            <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>GölPuan Defteri</h1>
              <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 0 }}>Tüm vatandaşların puan hareketleri.</p>
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
                {getFilteredList(pointsList).length === 0 ? (
                  <p style={{ padding: '1.5rem', color: '#64748b' }}>Henüz puan hareketi yok.</p>
                ) : getFilteredList(pointsList).map((pt: any) => (
                  <div key={pt.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.9rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{pt.userFullName || pt.description}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{pt.description} · {pt.type}</div>
                    </div>
                    <div style={{ fontWeight: 800, color: pt.amount >= 0 ? '#15803d' : '#b91c1c' }}>{pt.amount > 0 ? '+' : ''}{pt.amount} GP</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeMenu === 'qr' && (
            <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>QR & Teslim Kayıtları</h1>
              <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 0 }}>Kasa tarama: dinamik HMAC QR veya kupon RedeemCode.</p>

              <form onSubmit={handleScanQrSubmit} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569' }}>Dinamik QR token
                  <input required value={qrTokenInput} onChange={(e) => setQrTokenInput(e.target.value)} placeholder="GBQR:..." style={{ width: '100%', marginTop: 4, padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: 8 }} />
                </label>
                <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569' }}>Kupon RedeemCode (opsiyonel)
                  <input value={qrRedeemCode} onChange={(e) => setQrRedeemCode(e.target.value)} placeholder="Kişiye özel kupon kodu" style={{ width: '100%', marginTop: 4, padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: 8 }} />
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569' }}>Tesis
                    <select value={qrSelectedCafeId} onChange={(e) => setQrSelectedCafeId(e.target.value)} style={{ width: '100%', marginTop: 4, padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: 8 }}>
                      <option value="">Seçin</option>
                      {extractArray(cafesList).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </label>
                  <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569' }}>Tutar (TL)
                    <input type="number" min={0} value={qrAmount} onChange={(e) => setQrAmount(Number(e.target.value))} style={{ width: '100%', marginTop: 4, padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: 8 }} />
                  </label>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', fontWeight: 600 }}>
                  <input type="checkbox" checked={qrPaidWithPoints} onChange={(e) => setQrPaidWithPoints(e.target.checked)} />
                  GölPuan ile öde
                </label>
                {qrScanError && <p style={{ color: '#b91c1c', fontSize: '0.85rem', margin: 0 }}>{qrScanError}</p>}
                <button type="submit" disabled={qrScanLoading} style={{ padding: '10px', background: '#1d5f60', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                  {qrScanLoading ? 'Okunuyor...' : 'Kasa işlemini uygula'}
                </button>
                {qrScanResult && (
                  <div style={{ background: '#f8fafc', borderRadius: 12, padding: '0.85rem', fontSize: '0.85rem' }}>
                    <div><strong>Üye:</strong> {qrScanResult.memberName || '—'}</div>
                    <div><strong>İşlem:</strong> {qrScanResult.operation || '—'}</div>
                    <div><strong>Puan:</strong> −{qrScanResult.pointsDeducted ?? 0} / +{qrScanResult.pointsEarned ?? 0} · bakiye {qrScanResult.newPointsBalance ?? '—'}</div>
                    <div><strong>Kupon:</strong> {qrScanResult.couponTitle || qrScanResult.couponCode || '—'}</div>
                    <div><strong>Sonuç:</strong> {qrScanResult.status || 'Completed'}</div>
                  </div>
                )}
              </form>

              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
                {getFilteredList(ordersList).length === 0 ? (
                  <p style={{ padding: '1.5rem', color: '#64748b' }}>Kayıtlı teslim işlemi yok.</p>
                ) : getFilteredList(ordersList).map((o: any) => (
                  <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.9rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                      <div style={{ fontWeight: 800, color: '#1d5f60' }}>{o.collectionCode}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{o.userFullName} · {o.cafeName}</div>
                    </div>
                    <div style={{ fontWeight: 700 }}>{o.status}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeMenu === 'roles' && (
            <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Roller & Personel</h1>
              <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 0 }}>Kayıtlı kullanıcıların mevcut rolleri.</p>
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
                {getFilteredList(usersList).length === 0 ? (
                  <p style={{ padding: '1.5rem', color: '#64748b' }}>Kullanıcı kaydı yok.</p>
                ) : getFilteredList(usersList).map((u: any) => (
                  <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.9rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{u.firstName} {u.lastName}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{u.email}</div>
                    </div>
                    <div style={{ fontWeight: 700, color: '#1d5f60' }}>{u.role || 'User'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeMenu === 'audit' && (
            <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Denetim Kayıtları</h1>
              <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 0 }}>Kritik işlem izleri.</p>
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
                {getFilteredList(auditLogsList).length === 0 ? (
                  <p style={{ padding: '1.5rem', color: '#64748b' }}>Henüz denetim kaydı yok.</p>
                ) : getFilteredList(auditLogsList).map((log: any) => (
                  <div key={log.id} style={{ padding: '0.9rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ fontWeight: 700 }}>{log.actionType} · {log.moduleName || log.entityName}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{log.userEmail} · {log.reason || log.newValues}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>

      {showAddIsmarliyorModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleCreateIsmarliyor} style={{ width: '540px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ background: '#1d5f60', color: '#fff', padding: '8px', borderRadius: '10px', display: 'flex' }}>
                  <Gift size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Yeni Ismarlıyor / Askıda İkram Ekle</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Kitle hedef kısıtlamalı (Gençler, Öğrenciler vb.) ikram oluşturma.</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowAddIsmarliyorModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <div>
              <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>İkram Eden Vatandaş</label>
              <select
                value={newIsmUserId}
                onChange={(e) => setNewIsmUserId(e.target.value)}
                required
                style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', outline: 'none' }}
              >
                <option value="">Vatandaş seçin</option>
                {extractArray(usersList).map((u: any) => (
                  <option key={u.id} value={u.id}>{`${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email}</option>
                ))}
              </select>
              {extractArray(usersList).length === 0 ? (
                <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: '#64748b' }}>Kayıtlı vatandaş yok. Önce vatandaş ekleyin.</p>
              ) : null}
            </div>

            {/* TARGET CRITERIA SELECTION */}
            <div>
              <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#1d5f60', display: 'block', marginBottom: '4px' }}>Hedef İkram Kriteri / Kısıtlama Şartı</label>
              <select
                value={newIsmTargetCriteria}
                onChange={(e) => setNewIsmTargetCriteria(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#f8fafc', border: '2px solid #1d5f60', borderRadius: '8px', color: '#0f172a', outline: 'none', fontWeight: 700 }}
              >
                <option value="Tüm Vatandaşlara Açık (Şartsız)">Tüm Vatandaşlara Açık (Şartsız)</option>
                <option value="Gençler (18-25 Yaş)">Sadece Gençlere Özel (18-25 Yaş)</option>
                <option value="Öğrenciler (Lise & Üniversite)">Sadece Öğrencilere Özel (Lise & Üniversite)</option>
                <option value="Emekli Vatandaşlar (65+ Yaş)">Sadece Emekli Vatandaşlara Özel (65+ Yaş)</option>
                <option value="Kadın Vatandaşlar">Sadece Kadın Vatandaşlara Özel</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>İkram Yapılacak Şube</label>
                <select
                  value={newIsmCafeId}
                  onChange={(e) => setNewIsmCafeId(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', outline: 'none' }}
                >
                  {extractArray(cafesList).length === 0 ? (
                    <option value="">Kayıtlı şube yok</option>
                  ) : (
                    <>
                      <option value="">Şube seçin</option>
                      {extractArray(cafesList).map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>İkram Edilecek Ürün</label>
                <select
                  value={newIsmMenuItemId}
                  onChange={(e) => {
                    setNewIsmMenuItemId(e.target.value);
                    const match = menuItemsList.find((m: any) => m.id === e.target.value);
                    setNewIsmItemName(match?.name || '');
                  }}
                  required
                  style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', outline: 'none' }}
                >
                  {extractArray(menuItemsList).length === 0 ? (
                    <option value="">Menü boş — önce ürün ekleyin</option>
                  ) : (
                    <>
                      <option value="">Ürün seçin</option>
                      {extractArray(menuItemsList).map((m: any) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </>
                  )}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>İkram Adedi</label>
                <input
                  type="number"
                  min={1}
                  value={newIsmQuantity}
                  onChange={(e) => setNewIsmQuantity(Number(e.target.value))}
                  required
                  style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>İkram Tutarı (TL)</label>
                <input
                  type="number"
                  min={0}
                  value={newIsmAmount}
                  onChange={(e) => setNewIsmAmount(Number(e.target.value))}
                  required
                  style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', outline: 'none' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Ismarlayan Kişi Görseli Yükle</label>
              <label style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#f1f5f9', border: '1px dashed #cbd5e1', borderRadius: '8px', color: '#1d5f60', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Upload size={16} />
                <span>{uploadingFile ? 'Görsel Yükleniyor...' : newIsmProofUrl ? 'Ismarlayan Görseli Yüklendi ✓' : 'Ismarlayan Kişi Görseli Seç'}</span>
                <input type="file" accept="image/*" onChange={(e) => handleFileUploadHelper(e, setNewIsmProofUrl)} style={{ display: 'none' }} />
              </label>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="button" onClick={() => setShowAddIsmarliyorModal(false)} style={{ flex: 1, padding: '10px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '10px', color: '#0f172a', fontWeight: 600, cursor: 'pointer' }}>İptal</button>
              <button type="submit" style={{ flex: 1, padding: '10px', background: '#1d5f60', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Ismarlıyor Başvurusunu Yayınla</button>
            </div>
          </form>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* NEW PRO CAMPAIGN & DISCOUNT CREATION MODAL */}
      {/* ------------------------------------------------------------- */}
      {showAddCampaignModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleCreateCampaign} style={{ width: '560px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ background: '#1d5f60', color: '#fff', padding: '8px', borderRadius: '10px', display: 'flex' }}>
                  <Tag size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Yeni kampanya içeriği</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>CMS duyurusu. GölPuan bonus motoru yoktur.</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowAddCampaignModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <div>
              <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Kampanya Başlığı</label>
              <input
                type="text"
                placeholder="Örn: Şehitkamil Öğrencilerine %20 Kitap Kafe İndirimi"
                value={newCampTitle}
                onChange={(e) => setNewCampTitle(e.target.value)}
                required
                style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Kampanya Açıklaması & Şartları</label>
              <textarea
                rows={2}
                placeholder="Tüm Kitap Kafelerde geçerli öğrenci kartı ibrazında %20 indirim fırsatı..."
                value={newCampDesc}
                onChange={(e) => setNewCampDesc(e.target.value)}
                required
                style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', outline: 'none', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>İndirim Tipi</label>
                <select
                  value={newCampType}
                  onChange={(e: any) => setNewCampType(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', outline: 'none', fontWeight: 700 }}
                >
                  <option value="Percentage">Yüzde İndirim (%)</option>
                  <option value="FixedAmount">Sabit Tutar İndirimi (TL)</option>
                  <option value="BonusPoints">Ekstra GölPuan (+GP)</option>
                  <option value="BuyOneGetOne">1 Alana 1 Bedava</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#1d5f60', display: 'block', marginBottom: '4px' }}>
                  {newCampType === 'Percentage' ? 'İndirim Oranı (%)' :
                   newCampType === 'FixedAmount' ? 'İndirim Tutarı (TL)' :
                   newCampType === 'BonusPoints' ? 'Kazanılacak Ekstra GölPuan (+GP)' : 'İkram Fırsat Adedi'}
                </label>
                <input
                  type="number"
                  min={1}
                  value={newCampValue}
                  onChange={(e) => setNewCampValue(Number(e.target.value))}
                  required
                  style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#f8fafc', border: '2px solid #1d5f60', borderRadius: '8px', color: '#0f172a', outline: 'none', fontWeight: 700 }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Başlangıç Tarihi</label>
                <input
                  type="date"
                  value={newCampStartDate}
                  onChange={(e) => setNewCampStartDate(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Bitiş Tarihi</label>
                <input
                  type="date"
                  value={newCampEndDate}
                  onChange={(e) => setNewCampEndDate(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#1d5f60', display: 'block', marginBottom: '4px' }}>Hedef Kitle Kriteri</label>
                <select
                  value={newCampTargetGroup}
                  onChange={(e) => setNewCampTargetGroup(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', outline: 'none', fontWeight: 700 }}
                >
                  <option value="All">Tüm Vatandaşlar (Şartsız)</option>
                  <option value="Students">Sadece Öğrencilere Özel</option>
                  <option value="Youth">Sadece Gençler (18-25 Yaş)</option>
                  <option value="Seniors">Sadece Emekliler (65+ Yaş)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Şube Geçerliliği</label>
                <select
                  value={newCampCafeId}
                  onChange={(e) => setNewCampCafeId(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', outline: 'none' }}
                >
                  <option value="ALL">Tüm Şubelerde Geçerli</option>
                  {extractArray(cafesList).map((c) => (
                    <option key={c.id} value={c.id}>Sadece {c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Kampanya Görseli Yükle</label>
              <label style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#f1f5f9', border: '1px dashed #cbd5e1', borderRadius: '8px', color: '#1d5f60', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Upload size={16} />
                <span>{uploadingFile ? 'Görsel Yükleniyor...' : newCampImageUrl ? 'Kampanya Görseli Yüklendi ✓' : 'Kampanya Afiş Görseli Seç'}</span>
                <input type="file" accept="image/*" onChange={(e) => handleFileUploadHelper(e, setNewCampImageUrl)} style={{ display: 'none' }} />
              </label>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="button" onClick={() => setShowAddCampaignModal(false)} style={{ flex: 1, padding: '10px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '10px', color: '#0f172a', fontWeight: 600, cursor: 'pointer' }}>İptal</button>
              <button type="submit" style={{ flex: 1, padding: '10px', background: '#1d5f60', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Kampanyayı Yayınla</button>
            </div>
          </form>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* NEW PRO PRODUCT CREATION MODAL WITH PHOTO UPLOAD */}
      {/* ------------------------------------------------------------- */}
      {showAddProductModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleCreateMenuItem} style={{ width: '540px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ background: '#1d5f60', color: '#fff', padding: '8px', borderRadius: '10px', display: 'flex' }}>
                  <Coffee size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Yeni Ürün / Menü Öğesi Ekle</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Fotoğraflı ürün katalog yönetimi.</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowAddProductModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <div>
              <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Ürün Adı</label>
              <input
                type="text"
                placeholder="Örn: Soğuk Brew Filtre Kahve"
                value={newProdName}
                onChange={(e) => setNewProdName(e.target.value)}
                required
                style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Ürün Açıklaması</label>
              <textarea
                rows={2}
                placeholder="Özenle demlenmiş soğuk filtre kahve detayları..."
                value={newProdDesc}
                onChange={(e) => setNewProdDesc(e.target.value)}
                required
                style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', outline: 'none', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#1d5f60', display: 'block', marginBottom: '4px' }}>Şube / Konum Geçerliliği</label>
                <select
                  value={newProdCafeId}
                  onChange={(e) => setNewProdCafeId(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#f8fafc', border: '2px solid #1d5f60', borderRadius: '8px', color: '#0f172a', outline: 'none', fontWeight: 700 }}
                >
                  <option value="ALL">Tüm Şubelerde Geçerli (Bütün Şehitkamil Kafeler)</option>
                  {extractArray(cafesList).map((c) => (
                    <option key={c.id} value={c.id}>Sadece {c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#1d5f60', display: 'block', marginBottom: '4px' }}>Satış Fiyatı (TL)</label>
                <input
                  type="number"
                  min={0}
                  value={newProdPrice}
                  onChange={(e) => setNewProdPrice(Number(e.target.value))}
                  required
                  style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#f8fafc', border: '2px solid #1d5f60', borderRadius: '8px', color: '#0f172a', outline: 'none', fontWeight: 700 }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Ürün Fotoğrafı Yükle</label>
              <label style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#f1f5f9', border: '1px dashed #cbd5e1', borderRadius: '8px', color: '#1d5f60', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Upload size={16} />
                <span>{uploadingFile ? 'Fotoğraf Yükleniyor...' : uploadedImageUrl ? 'Ürün Görseli Yüklendi ✓' : 'Ürün Fotoğrafı Seç'}</span>
                <input type="file" accept="image/*" onChange={(e) => handleFileUploadHelper(e, setUploadedImageUrl)} style={{ display: 'none' }} />
              </label>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="button" onClick={() => setShowAddProductModal(false)} style={{ flex: 1, padding: '10px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '10px', color: '#0f172a', fontWeight: 600, cursor: 'pointer' }}>İptal</button>
              <button type="submit" style={{ flex: 1, padding: '10px', background: '#1d5f60', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Ürünü Menüye Ekle</button>
            </div>
          </form>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* NEW PRO CAFE CREATION MODAL WITH MENU ITEM SELECTION */}
      {/* ------------------------------------------------------------- */}
      {showAddCafeModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleCreateCafe} style={{ width: '560px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ background: '#1d5f60', color: '#fff', padding: '8px', borderRadius: '10px', display: 'flex' }}>
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Yeni Şehitkamil Kafe / Tesis Ekle</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Fotoğraflı şube yönetimi ve menü atama.</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowAddCafeModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <div>
              <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Tesis / Şube Adı</label>
              <input
                type="text"
                placeholder="Örn: Şehitkamil Sanat Kitap Kafe"
                value={newCafeName}
                onChange={(e) => setNewCafeName(e.target.value)}
                required
                style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Tesis Adresi & Konumu</label>
              <input
                type="text"
                placeholder="Örn: Atatürk Mah. 15. Sok. No:4, Şehitkamil / Gaziantep"
                value={newCafeAddress}
                onChange={(e) => setNewCafeAddress(e.target.value)}
                required
                style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', outline: 'none' }}
              />
            </div>

            {/* SELECTIONS FOR CAFE SPECIFIC MENU ITEMS */}
            <div>
              <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#1d5f60', display: 'block', marginBottom: '6px' }}>Bu Şubede Satılacak Menü Ürünlerini Seçin (Her Kafeye Özel Menü):</label>
              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0.75rem', maxHeight: '140px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {menuItemsList.length === 0 ? (
                  <div style={{ fontSize: '0.825rem', color: '#64748b' }}>Menü ürünü yok. Önce Menü ve Ürünler’den ekleyin.</div>
                ) : menuItemsList.map((item) => {
                  const isChecked = selectedProductIdsForCafe.includes(item.id);
                  return (
                    <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem', cursor: 'pointer', fontWeight: isChecked ? 700 : 500, color: isChecked ? '#1d5f60' : '#334155' }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProductIdsForCafe(prev => [...prev, item.id]);
                          } else {
                            setSelectedProductIdsForCafe(prev => prev.filter(id => id !== item.id));
                          }
                        }}
                      />
                      <span>{item.name} ({item.price} TL)</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Tesis Kapak Fotoğrafı Yükle</label>
              <label style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#f1f5f9', border: '1px dashed #cbd5e1', borderRadius: '8px', color: '#1d5f60', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Upload size={16} />
                <span>{uploadingFile ? 'Görsel Yükleniyor...' : (newCafeImageUrl || uploadedImageUrl) ? 'Tesis Fotoğrafı Yüklendi ✓' : 'Tesis Kapak Fotoğrafı Seç'}</span>
                <input type="file" accept="image/*" onChange={(e) => handleFileUploadHelper(e, setNewCafeImageUrl)} style={{ display: 'none' }} />
              </label>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="button" onClick={() => setShowAddCafeModal(false)} style={{ flex: 1, padding: '10px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '10px', color: '#0f172a', fontWeight: 600, cursor: 'pointer' }}>İptal</button>
              <button type="submit" style={{ flex: 1, padding: '10px', background: '#1d5f60', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Şubeyi Ekle ve Yayınla</button>
            </div>
          </form>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* NEW PRO REWARD CREATION MODAL */}
      {/* ------------------------------------------------------------- */}
      {showAddRewardModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleCreateReward} style={{ width: '520px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ background: '#1d5f60', color: '#fff', padding: '8px', borderRadius: '10px', display: 'flex' }}>
                  <Award size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Yeni GölPuan İkram Ödülü Ekle</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Vatandaş ikram ödül kataloğu tanımlama.</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowAddRewardModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <div>
              <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>İkram / Ödül Adı</label>
              <input
                type="text"
                placeholder="Örn: Sıcak Filtre Kahve İkramı"
                value={newRewardTitle}
                onChange={(e) => setNewRewardTitle(e.target.value)}
                required
                style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Ödül Açıklaması & Şartları</label>
              <textarea
                rows={2}
                placeholder="Şehitkamil Kitap Kafelerde geçerli taze demlenmiş filtre kahve..."
                value={newRewardDesc}
                onChange={(e) => setNewRewardDesc(e.target.value)}
                required
                style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', outline: 'none', resize: 'vertical' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#1d5f60', display: 'block', marginBottom: '4px' }}>Gerekli GölPuan Tutarı (GP)</label>
              <input
                type="number"
                min={10}
                value={newRewardPoints}
                onChange={(e) => setNewRewardPoints(Number(e.target.value))}
                required
                style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#f8fafc', border: '2px solid #1d5f60', borderRadius: '8px', color: '#0f172a', outline: 'none', fontWeight: 700 }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Ödül Görseli Yükle (İsteğe Bağlı)</label>
              <label style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#f1f5f9', border: '1px dashed #cbd5e1', borderRadius: '8px', color: '#1d5f60', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Upload size={16} />
                <span>{uploadingFile ? 'Görsel Yükleniyor...' : uploadedImageUrl ? 'Ödül Görseli Yüklendi ✓' : 'Ödül Kapak Görseli Seç'}</span>
                <input type="file" accept="image/*" onChange={(e) => handleFileUploadHelper(e, setUploadedImageUrl)} style={{ display: 'none' }} />
              </label>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="button" onClick={() => setShowAddRewardModal(false)} style={{ flex: 1, padding: '10px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '10px', color: '#0f172a', fontWeight: 600, cursor: 'pointer' }}>İptal</button>
              <button type="submit" style={{ flex: 1, padding: '10px', background: '#1d5f60', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Ödülü Yayınla</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: ADD EVENT (FIXED & POLISHED) */}
      {showAddEventModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleCreateEvent} style={{ width: '520px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ background: '#1d5f60', color: '#fff', padding: '8px', borderRadius: '10px', display: 'flex' }}>
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Yeni Etkinlik Tanımla</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Gaziantep Şehitkamil Belediyesi gençlik etkinliği.</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowAddEventModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <div>
              <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Etkinlik Başlığı</label>
              <input type="text" placeholder="Örn: Şehitkamil Gençlik Kitap Okuma Günleri" value={newEventTitle} onChange={(e) => setNewEventTitle(e.target.value)} required style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', outline: 'none' }} />
            </div>

            <div>
              <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Açıklama</label>
              <textarea rows={2} placeholder="Etkinlik detayları ve şartları..." value={newEventDesc} onChange={(e) => setNewEventDesc(e.target.value)} required style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', outline: 'none', resize: 'vertical' }} />
            </div>

            <div>
              <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Belediye tesisi (opsiyonel)</label>
              <select value={newEventPlaceId} onChange={(e) => setNewEventPlaceId(e.target.value)} style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', outline: 'none' }}>
                <option value="">Serbest konum / tesis yok</option>
                {eventPlacesList.map((place) => (
                  <option key={place.id} value={place.id}>{place.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Etkinlik Konumu</label>
                <input type="text" placeholder="Örn: Şehitkamil Gençlik Merkezi" value={newEventLocation} onChange={(e) => setNewEventLocation(e.target.value)} required style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', outline: 'none' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#1d5f60', display: 'block', marginBottom: '4px' }}>GölPuan Ödülü (GP)</label>
                <input type="number" min={10} value={newEventPoints} onChange={(e) => setNewEventPoints(Number(e.target.value))} required style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#f8fafc', border: '2px solid #1d5f60', borderRadius: '8px', color: '#0f172a', outline: 'none', fontWeight: 700 }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Kontenjan (opsiyonel)</label>
              <input type="number" min={0} value={newEventQuota} onChange={(e) => setNewEventQuota(Number(e.target.value))} style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="button" onClick={() => setShowAddEventModal(false)} style={{ flex: 1, padding: '10px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '10px', color: '#0f172a', fontWeight: 600, cursor: 'pointer' }}>İptal</button>
              <button type="submit" style={{ flex: 1, padding: '10px', background: '#1d5f60', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Etkinliği Yayınla</button>
            </div>
          </form>
        </div>
      )}

      {showFieldDropModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleSaveFieldDrop} style={{ width: '640px', maxHeight: '90vh', overflowY: 'auto', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '0.9rem', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>{editingFieldDropId ? 'Saha Hediyesini Düzenle' : 'Konuma Hediye Bırak'}</h3>
              <button type="button" onClick={() => setShowFieldDropModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>
            <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569' }}>Başlık
              <input required value={fdTitle} onChange={(e) => setFdTitle(e.target.value)} style={{ width: '100%', marginTop: 4, padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: 8 }} />
            </label>
            <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569' }}>Açıklama
              <textarea value={fdDescription} onChange={(e) => setFdDescription(e.target.value)} rows={2} style={{ width: '100%', marginTop: 4, padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: 8 }} />
            </label>
            <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569' }}>Bağlı tesis (opsiyonel)
              <select value={fdCafeId} onChange={(e) => {
                const id = e.target.value;
                setFdCafeId(id);
                const cafe = cafesList.find((c: any) => c.id === id);
                if (cafe?.latitude != null) setFdLat(Number(cafe.latitude));
                if (cafe?.longitude != null) setFdLng(Number(cafe.longitude));
              }} style={{ width: '100%', marginTop: 4, padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: 8 }}>
                <option value="">Serbest konum</option>
                {extractArray(cafesList).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem' }}>
              <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569' }}>Enlem
                <input required type="number" step="0.000001" value={fdLat} onChange={(e) => setFdLat(Number(e.target.value))} style={{ width: '100%', marginTop: 4, padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: 8 }} />
              </label>
              <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569' }}>Boylam
                <input required type="number" step="0.000001" value={fdLng} onChange={(e) => setFdLng(Number(e.target.value))} style={{ width: '100%', marginTop: 4, padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: 8 }} />
              </label>
              <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569' }}>Yarıçap (m)
                <input required type="number" min={10} max={500} value={fdRadius} onChange={(e) => setFdRadius(Number(e.target.value))} style={{ width: '100%', marginTop: 4, padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: 8 }} />
              </label>
            </div>
            <iframe
              title="Konum önizleme"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${fdLng-0.01}%2C${fdLat-0.01}%2C${fdLng+0.01}%2C${fdLat+0.01}&layer=mapnik&marker=${fdLat}%2C${fdLng}`}
              style={{ width: '100%', height: 180, border: '1px solid #e2e8f0', borderRadius: 12 }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem' }}>
              <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569' }}>GölPuan
                <input required type="number" min={0} value={fdPoints} onChange={(e) => setFdPoints(Number(e.target.value))} style={{ width: '100%', marginTop: 4, padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: 8 }} />
              </label>
              <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569' }}>Stok (boş = sınırsız)
                <input type="number" min={1} value={fdStock} onChange={(e) => setFdStock(e.target.value === '' ? '' : Number(e.target.value))} style={{ width: '100%', marginTop: 4, padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: 8 }} />
              </label>
              <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569' }}>Kişi başı limit
                <input required type="number" min={1} value={fdPerUser} onChange={(e) => setFdPerUser(Number(e.target.value))} style={{ width: '100%', marginTop: 4, padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: 8 }} />
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
              <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569' }}>Başlangıç
                <input type="datetime-local" value={fdStartsAt} onChange={(e) => setFdStartsAt(e.target.value)} style={{ width: '100%', marginTop: 4, padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: 8 }} />
              </label>
              <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569' }}>Bitiş
                <input type="datetime-local" value={fdEndsAt} onChange={(e) => setFdEndsAt(e.target.value)} style={{ width: '100%', marginTop: 4, padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: 8 }} />
              </label>
            </div>
            <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569' }}>Katalog ödülü (opsiyonel)
              <select value={fdRewardId} onChange={(e) => setFdRewardId(e.target.value)} style={{ width: '100%', marginTop: 4, padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: 8 }}>
                <option value="">Yalnızca GölPuan ver</option>
                {extractArray(rewardsList).map((r: any) => <option key={r.id} value={r.id}>{r.title} ({rewardPoints(r)} GP)</option>)}
              </select>
            </label>
            <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569' }}>3D model URL (GLB)
              <input value={fdModelUrl} onChange={(e) => setFdModelUrl(e.target.value)} placeholder="https://.../hediye.glb veya /models/hediye.glb" style={{ width: '100%', marginTop: 4, padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: 8 }} />
              <span style={{ display: 'block', marginTop: 4, fontWeight: 500, color: '#64748b' }}>Boş bırakılabilir. Boşsa vatandaş uygulaması çökmez; GPS Al çalışır. ARKit kullanılmaz.</span>
            </label>
            <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569' }}>Görsel
              <input type="file" accept="image/*" onChange={(e) => handleFileUploadHelper(e, setFdImageUrl)} />
            </label>
            {fdImageUrl && <img src={fdImageUrl} alt="" style={{ height: 80, objectFit: 'cover', borderRadius: 8 }} />}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', fontWeight: 700 }}>
              <input type="checkbox" checked={fdActive} onChange={(e) => setFdActive(e.target.checked)} /> Yayında
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" onClick={() => setShowFieldDropModal(false)} style={{ flex: 1, padding: 10, background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>İptal</button>
              <button type="submit" disabled={savingFieldDrop} style={{ flex: 1, padding: 10, background: '#1d5f60', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, cursor: 'pointer' }}>{savingFieldDrop ? 'Kaydediliyor...' : 'Kaydet'}</button>
            </div>
          </form>
        </div>
      )}

      {/* USER DETAIL DRAWER SHEET */}
      {selectedUserDrawer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'flex-end', zIndex: 1000 }}>
          <div style={{ width: '560px', height: '100%', background: '#ffffff', borderLeft: '1px solid #e2e8f0', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto', boxShadow: '-10px 0 30px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#1d5f60', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem' }}>
                  {selectedUserDrawer.firstName?.charAt(0) || 'V'}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{selectedUserDrawer.firstName} {selectedUserDrawer.lastName}</h3>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{selectedUserDrawer.email}</div>
                </div>
              </div>
              <button onClick={() => setSelectedUserDrawer(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>GÖLPUAN BAKİYESİ</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1d5f60' }}>{selectedUserDrawer.pointsBalance} GP</div>
              </div>
              <button onClick={() => setPointAdjustUserId(selectedUserDrawer.id)} style={{ padding: '8px 14px', background: '#1d5f60', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
                + Puan/İkram Yükle
              </button>
            </div>

            <div style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div><strong>Öğrenim Durumu:</strong> {selectedUserDrawer.educationLevel || 'Üniversite'}</div>
              <div><strong>Yaş:</strong> {selectedUserDrawer.age || 21}</div>
              <div><strong>Hesap Durumu:</strong> Doğrulanmış Şehitkamil Üye</div>
            </div>

            <button onClick={() => setSelectedUserDrawer(null)} style={{ marginTop: 'auto', padding: '10px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '10px', color: '#0f172a', fontWeight: 700, cursor: 'pointer' }}>
              Drawer Penceresini Kapat
            </button>
          </div>
        </div>
      )}

      {/* Proof Image Large Preview Modal */}
      {previewProofImage && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }} onClick={() => setPreviewProofImage(null)}>
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <img src={previewProofImage} alt="Ismarlayan Görseli" style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '16px' }} />
            <button onClick={() => setPreviewProofImage(null)} style={{ position: 'absolute', top: '-15px', right: '-15px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
          </div>
        </div>
      )}

    </div>
  );
};
