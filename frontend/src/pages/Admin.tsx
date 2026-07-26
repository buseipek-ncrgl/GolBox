import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../store/AuthContext';
import { 
  LayoutDashboard, Users, Building2, Coffee, ShoppingBag, 
  History, Award, Sparkles, CheckSquare, Calendar, Bell, 
  UserCheck, ShieldAlert, FileSpreadsheet, Settings, FileText,
  LogOut, Plus, Search, Filter, AlertTriangle, ChevronRight,
  Upload, Image as ImageIcon, ShieldCheck, CheckCircle2, XCircle, 
  Download, MoreVertical, X, ChevronLeft, ChevronDown, Check, ArrowRight, RefreshCw,
  Clock, TrendingUp, HelpCircle, MapPin, Receipt, Gift, CreditCard, Megaphone, BarChart3, FileCheck, Trash2, Eye, Phone, Edit3, Save, Send, Shield, DollarSign, Layers, Heart, Tag
} from 'lucide-react';

// Safe array extraction helper
const extractArray = (res: any): any[] => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (res.items && Array.isArray(res.items)) return res.items;
  if (res.data && Array.isArray(res.data)) return res.data;
  return [];
};

export const Admin: React.FC = () => {
  const { logout, user: currentUser } = useAuth();
  
  // Sidebar Collapse State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // 14 Core Specification Sidebar Modules
  const [activeMenu, setActiveMenu] = useState<
    'overview' | 'users' | 'cafes' | 'products' | 'points' | 
    'qr' | 'rewards' | 'ismarliyor' | 'campaigns' | 'events' | 
    'notifications' | 'reports' | 'roles' | 'audit'
  >('overview');

  // Data states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dashboard Overview state
  const [overviewData, setOverviewData] = useState<any>(null);

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
  const [showNotificationsDrawer, setShowNotificationsDrawer] = useState(false);

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

  // Image Upload State
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [uploadingFile, setUploadingFile] = useState<boolean>(false);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');

  // POS QR Scan Modal State
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrTokenInput, setQrTokenInput] = useState('');
  const [qrSelectedCafeId, setQrSelectedCafeId] = useState('');
  const [qrAmount, setQrAmount] = useState<number>(45);
  const [qrPaidWithPoints, setQrPaidWithPoints] = useState(false);
  const [qrScanResult, setQrScanResult] = useState<any>(null);
  const [qrScanLoading, setQrScanLoading] = useState(false);
  const [qrScanError, setQrScanError] = useState<string | null>(null);

  // Creation Modals
  const [showAddCafeModal, setShowAddCafeModal] = useState(false);
  const [newCafeName, setNewCafeName] = useState('');
  const [newCafeAddress, setNewCafeAddress] = useState('');
  const [newCafeImageUrl, setNewCafeImageUrl] = useState('');

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
  const [newIsmUserFullName, setNewIsmUserFullName] = useState('');
  const [newIsmCafeId, setNewIsmCafeId] = useState('');
  const [newIsmItemName, setNewIsmItemName] = useState('Filtre Kahve');
  const [newIsmQuantity, setNewIsmQuantity] = useState<number>(1);
  const [newIsmAmount, setNewIsmAmount] = useState<number>(45);
  const [newIsmTargetCriteria, setNewIsmTargetCriteria] = useState('Gençler'); // Gençler, Öğrenciler, Emekliler, Herkese Açık
  const [newIsmProofUrl, setNewIsmProofUrl] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeMenu === 'overview') {
        const data = await api.getDashboardOverview();
        setOverviewData(data);
      } else if (activeMenu === 'users') {
        const users = await api.getUsers();
        setUsersList(extractArray(users));
      } else if (activeMenu === 'cafes') {
        const cafes = await api.getCafes();
        setCafesList(extractArray(cafes));
      } else if (activeMenu === 'products') {
        const cafes = await api.getCafes();
        const safeCafes = extractArray(cafes);
        setCafesList(safeCafes);
        const targetCafe = newProdCafeId || (safeCafes[0]?.id ?? '');
        if (targetCafe) {
          const menu = await api.getMenuItems(targetCafe);
          setMenuItemsList(extractArray(menu));
        }
      } else if (activeMenu === 'qr' || activeMenu === 'ismarliyor') {
        const orders = await api.getOrders();
        setOrdersList(extractArray(orders));
        const cafes = await api.getCafes();
        setCafesList(extractArray(cafes));
      } else if (activeMenu === 'points') {
        const pts = await api.getPointsHistory();
        setPointsList(extractArray(pts));
      } else if (activeMenu === 'rewards') {
        const r = await api.getRewards();
        setRewardsList(extractArray(r));
      } else if (activeMenu === 'campaigns') {
        const c = await api.getCampaigns();
        setCampaignsList(extractArray(c));
      } else if (activeMenu === 'events') {
        const a = await api.getActivities();
        setEventsList(extractArray(a));
      } else if (activeMenu === 'notifications') {
        const n = await api.getNotifications();
        setNotificationsList(extractArray(n));
      } else if (activeMenu === 'audit') {
        const logs = await api.getAuditLogs();
        setAuditLogsList(extractArray(logs));
      }
    } catch (err: any) {
      setError(err.message || 'Veri yükleme hatası.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [activeMenu, newProdCafeId]);

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
      await api.createCafe({
        name: editCafeName,
        address: editCafeAddress,
        imageUrl: editCafeImageUrl || undefined,
        categoryId: selectedCafeDetail.categoryId || '22222222-2222-2222-2222-222222222222'
      });
      setSuccess(`✨ Şehitkamil Tesis '${editCafeName}' fotoğrafı ve detayları kaydedildi!`);
      setSelectedCafeDetail(null);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Tesis güncellenemedi.');
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

      const cafeObj = res?.id ? res : {
        id: 'cafe-' + Date.now(),
        name: newCafeName,
        address: newCafeAddress,
        imageUrl: newCafeImageUrl || uploadedImageUrl || undefined,
        status: 'Active'
      };

      setCafesList(prev => [cafeObj, ...extractArray(prev)]);
      setSuccess(`✨ Yeni Şehitkamil Tesis/Şube '${newCafeName}' eklendi!`);
      setShowAddCafeModal(false);
      setNewCafeName('');
      setNewCafeAddress('');
      setNewCafeImageUrl('');
      setUploadedImageUrl('');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Tesis eklenemedi.');
    }
  };

  const handleCreateMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetCafeId = newProdCafeId || 'ALL';
    const targetCafeObj = cafesList.find(c => c.id === targetCafeId);
    const cafeNameLabel = targetCafeId === 'ALL' ? 'Tüm Şubelerde Geçerli' : (targetCafeObj?.name || 'Göl Kafe Şubesi');

    try {
      const newItem = await api.createMenuItem(targetCafeId === 'ALL' ? (cafesList[0]?.id ?? '33333333-3333-3333-3333-333333333333') : targetCafeId, {
        name: newProdName,
        description: newProdDesc,
        price: Number(newProdPrice),
        imageUrl: uploadedImageUrl || undefined,
        requiredEducation: undefined
      });
      
      const productObj = newItem?.id ? { ...newItem, cafeId: targetCafeId, cafeName: cafeNameLabel } : {
        id: 'prod-' + Date.now(),
        name: newProdName,
        description: newProdDesc,
        price: Number(newProdPrice),
        imageUrl: uploadedImageUrl || undefined,
        cafeId: targetCafeId,
        cafeName: cafeNameLabel
      };

      setMenuItemsList(prev => [productObj, ...extractArray(prev)]);
      setSuccess(`✨ Yeni Ürün '${newProdName}' (${newProdPrice} TL - ${cafeNameLabel}) fotoğraflı olarak menüye eklendi!`);
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
      setSuccess(`✨ Yeni İkram/Ödül '${newRewardTitle}' (${newRewardPoints} GP) eklendi!`);
      
      const newRewardItem = res?.id ? res : {
        id: 'rew-' + Date.now(),
        title: newRewardTitle,
        description: newRewardDesc,
        requiredPoints: Number(newRewardPoints),
        imageUrl: uploadedImageUrl || undefined,
        status: 'Active'
      };
      setRewardsList(prev => [newRewardItem, ...extractArray(prev)]);
      
      setShowAddRewardModal(false);
      setNewRewardTitle('');
      setNewRewardDesc('');
      setUploadedImageUrl('');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Ödül eklenemedi.');
    }
  };

  // ADMIN ISMARLIYOR CREATION WITH TARGET CRITERIA
  const handleCreateIsmarliyor = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedCafeObj = cafesList.find(c => c.id === newIsmCafeId) || cafesList[0];
    const targetCafeName = selectedCafeObj?.name || 'Şehitkamil Merkez Kitap Kafe';
    const targetCafeId = selectedCafeObj?.id || '33333333-3333-3333-3333-333333333333';
    const donatorName = newIsmUserFullName && newIsmUserFullName.trim() ? newIsmUserFullName.trim() : 'Enes Çıkçık (Hayırsever Vatandaş)';
    
    try {
      const newOrder = {
        id: 'ism-' + Date.now(),
        collectionCode: 'GB-' + Math.floor(1000 + Math.random() * 9000),
        userFullName: donatorName,
        cafeId: targetCafeId,
        cafeName: targetCafeName,
        totalAmount: Number(newIsmAmount) || 45,
        imageUrl: newIsmProofUrl || uploadedImageUrl || undefined,
        status: 'Ready',
        targetCriteria: newIsmTargetCriteria || 'Gençler',
        createdDate: new Date().toISOString(),
        items: [
          {
            menuItemId: 'item-1',
            name: newIsmItemName || 'Filtre Kahve',
            quantity: Number(newIsmQuantity) || 1,
            unitPrice: Number(newIsmAmount) || 45
          }
        ]
      };
      
      setOrdersList(prev => [newOrder, ...extractArray(prev)]);
      setSuccess(`✨ Gaziantep Şehitkamil Belediyesi Ismarlıyor (${newOrder.collectionCode}) [${donatorName}] ikramı yayınlandı!`);
      setShowAddIsmarliyorModal(false);
      setNewIsmUserFullName('');
      setNewIsmProofUrl('');
      setUploadedImageUrl('');
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
        pointsReward: Number(newEventPoints),
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 86400000).toISOString()
      });
      
      const eventItem = newAct?.id ? newAct : {
        id: 'act-' + Date.now(),
        title: newEventTitle,
        description: newEventDesc,
        location: newEventLocation || 'Şehitkamil Gençlik Merkezi',
        pointsReward: Number(newEventPoints),
        quota: Number(newEventQuota) || 50,
        status: 'Active'
      };

      setEventsList(prev => [eventItem, ...extractArray(prev)]);
      setSuccess(`✨ Gaziantep Şehitkamil Belediyesi '${newEventTitle}' (${newEventPoints} GP Ödüllü) Etkinliği başarıyla yayınlandı!`);
      setShowAddEventModal(false);
      setNewEventTitle('');
      setNewEventDesc('');
      setNewEventLocation('');
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

      const targetLabel = newCampTargetGroup === 'Students' ? '🎓 Öğrencilere Özel' :
                         newCampTargetGroup === 'Youth' ? '🧒 Gençlere Özel (18-25)' :
                         newCampTargetGroup === 'Seniors' ? '👵 Emeklilere Özel' : '🌐 Tüm Vatandaşlara Açık';

      const valueLabel = newCampType === 'Percentage' ? `%${newCampValue} İndirim` :
                        newCampType === 'FixedAmount' ? `${newCampValue} TL İndirim` :
                        newCampType === 'BonusPoints' ? `+${newCampValue} GP Bonus` : '1 Alana 1 Bedava';

      const campObj = res?.id ? { ...res, targetGroupLabel: targetLabel, valueLabel } : {
        id: 'camp-' + Date.now(),
        title: newCampTitle,
        description: newCampDesc,
        campaignType: newCampType,
        valueLabel,
        targetGroupLabel: targetLabel,
        startDate: newCampStartDate,
        endDate: newCampEndDate,
        imageUrl: newCampImageUrl || uploadedImageUrl || undefined,
        cafeId: newCampCafeId,
        isActive: true
      };

      setCampaignsList(prev => [campObj, ...extractArray(prev)]);
      setSuccess(`✨ Yeni Şehitkamil Kampanyası '${newCampTitle}' (${targetLabel}) başarıyla yayınlandı!`);
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
    setSuccess(`📢 Toplu Anlık Bildirim (${pushTargetGroup}) kitleye başarıyla gönderildi!`);
    setPushTitle('');
    setPushMessage('');
  };

  // Single Click Order Status Update
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      await api.updateOrderStatus(orderId, status);
      setSuccess(`✨ Sipariş anında '${status === 'Delivered' ? 'Teslim Edildi & İkram Edildi' : status}' olarak onaylandı ve vatandaşa bildirim gönderildi!`);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Sipariş durumu güncellenemedi.');
    }
  };

  // Open Citizen Detail Drawer
  const handleOpenUserDrawer = async (user: any) => {
    try {
      const detail = await api.getUserDetail(user.id);
      setSelectedUserDrawer(detail || user);
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
      const selectedCafe = qrSelectedCafeId || (cafesList[0]?.id ?? '33333333-3333-3333-3333-333333333333');
      const res = await api.scanQr({
        qrToken: qrTokenInput || '88888888-8888-8888-8888-888888888888',
        cafeId: selectedCafe,
        amount: Number(qrAmount) || 0,
        paidWithPoints: qrPaidWithPoints
      });
      setQrScanResult(res);
      setSuccess(`✨ QR Tarama Başarılı! Vatandaşa +${res.pointsEarned} GP Yüklendi. Bakiye: ${res.newPointsBalance} GP`);
      fetchData();
    } catch (err: any) {
      setQrScanError(err.message || 'QR Kod doğrulanamadı.');
    } finally {
      setQrScanLoading(false);
    }
  };

  // Export to Excel / PDF simulation
  const handleExportData = (type: 'excel' | 'pdf') => {
    setSuccess(`📊 ${type.toUpperCase()} Rapor Dışa Aktarımı Başlatıldı. Dosya indiriliyor...`);
  };

  const getMenuLabel = (key: string) => {
    const labels: Record<string, string> = {
      overview: 'Genel Bakış Dashboard',
      users: 'Vatandaş & Kullanıcı Yönetimi',
      cafes: 'Şehitkamil Göl Kafeler',
      products: 'Menü & Ürün Kataloğu',
      points: 'GölPuan Kuralları & Defteri',
      qr: 'QR İşlemleri & Güvenlik',
      rewards: 'İkramlar & Ödüller',
      ismarliyor: 'Ismarlıyor Başvuruları',
      campaigns: 'Kampanyalar & İndirimler',
      events: 'Etkinlikler & Görevler (Gamification)',
      notifications: 'Duyurular & Anlık Bildirimler',
      reports: 'Stratejik Raporlama (Excel / PDF)',
      roles: 'Rol & Yetkilendirme Yönetimi',
      audit: 'Sistem Ayarları & Audit Logs'
    };
    return labels[key] || 'Yönetim Modülü';
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: '#f8fafc',
      color: '#0f172a',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>
      
      {/* 1. EXECUTIVE SAAS SIDEBAR (GAZİANTEP ŞEHİTKAMİL BELEDİYESİ BRANDING) */}
      <aside style={{
        width: sidebarCollapsed ? '76px' : '270px',
        background: '#0f172a',
        color: '#f8fafc',
        borderRight: '1px solid #1e293b',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s ease',
        flexShrink: 0,
        zIndex: 50
      }}>
        {/* Sidebar Header */}
        <div style={{ height: '75px', display: 'flex', alignItems: 'center', justifyContent: sidebarCollapsed ? 'center' : 'space-between', padding: '0 1.25rem', borderBottom: '1px solid #1e293b' }}>
          {!sidebarCollapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #1d5f60 0%, #0284c7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 900,
                boxShadow: '0 4px 12px rgba(29, 95, 96, 0.35)',
                fontSize: '0.9rem'
              }}>
                ŠB
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#ffffff', lineHeight: 1.2 }}>GölBox Admin</div>
                <div style={{ fontSize: '0.68rem', color: '#38bdf8', fontWeight: 600 }}>Gaziantep Şehitkamil Belediyesi</div>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{ background: '#1e293b', border: 'none', color: '#94a3b8', padding: '6px', borderRadius: '8px', cursor: 'pointer', display: 'flex' }}
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* 14 Core Modules Navigation */}
        <div style={{ flexGrow: 1, overflowY: 'auto', padding: '0.85rem 0.6rem' }}>
          {[
            {
              section: 'ANA EKOSİSTEM',
              items: [
                { id: 'overview', label: 'Genel Bakış', icon: LayoutDashboard },
                { id: 'users', label: 'Vatandaşlar', icon: Users },
                { id: 'cafes', label: 'Göl Kafeler', icon: Building2 },
                { id: 'products', label: 'Menü ve Ürünler', icon: Coffee }
              ]
            },
            {
              section: 'SADAKAT & İKRAM',
              items: [
                { id: 'points', label: 'GölPuan Defteri', icon: History },
                { id: 'qr', label: 'QR İşlemleri', icon: CreditCard },
                { id: 'rewards', label: 'Ödüller & İkramlar', icon: Award },
                { id: 'ismarliyor', label: 'Ismarlıyor', icon: Gift }
              ]
            },
            {
              section: 'ETKİLEŞİM & İLETİŞİM',
              items: [
                { id: 'campaigns', label: 'Kampanyalar', icon: Megaphone },
                { id: 'events', label: 'Etkinlikler & Görevler', icon: Calendar },
                { id: 'notifications', label: 'Duyurular & Bildirim', icon: Bell }
              ]
            },
            {
              section: 'YÖNETİM & DENETİM',
              items: [
                { id: 'reports', label: 'Stratejik Raporlar', icon: BarChart3 },
                { id: 'roles', label: 'Yetkilendirme', icon: Shield },
                { id: 'audit', label: 'Ayarlar & Audit Log', icon: FileCheck }
              ]
            }
          ].map((grp, idx) => (
            <div key={idx} style={{ marginBottom: '1.25rem' }}>
              {!sidebarCollapsed && (
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#38bdf8', padding: '0 0.75rem 0.4rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {grp.section}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {grp.items.map((item) => {
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
                        justifyContent: sidebarCollapsed ? 'center' : 'space-between',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '10px',
                        background: isActive ? 'linear-gradient(135deg, #1d5f60 0%, #0284c7 100%)' : 'transparent',
                        color: isActive ? '#ffffff' : '#94a3b8',
                        border: 'none',
                        fontSize: '0.85rem',
                        fontWeight: isActive ? 700 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Icon size={18} color={isActive ? '#ffffff' : '#94a3b8'} />
                        {!sidebarCollapsed && <span>{item.label}</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Profile */}
        <div style={{ padding: sidebarCollapsed ? '0.75rem 0.5rem' : '0.85rem 1rem', borderTop: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#0284c7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
            ŠB
          </div>
          {!sidebarCollapsed && (
            <div style={{ minWidth: 0, flexGrow: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Mehmet Yılmaz
              </div>
              <div style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 600 }}>Süper Admin</div>
            </div>
          )}
          {!sidebarCollapsed && (
            <button onClick={logout} title="Oturumu Kapat" style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px' }}>
              <LogOut size={18} />
            </button>
          )}
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        
        {/* Top Header Bar */}
        <header style={{ height: '75px', background: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', position: 'sticky', top: 0, zIndex: 40, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#64748b' }}>
            <span style={{ fontWeight: 600, color: '#1d5f60' }}>Gaziantep Şehitkamil Belediyesi</span>
            <ChevronRight size={14} />
            <span style={{ fontWeight: 700, color: '#0f172a' }}>{getMenuLabel(activeMenu)}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {/* Live Operations Pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#dcfce7', color: '#166534', padding: '5px 14px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 700 }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#16a34a' }} />
              Şehitkamil Canlı Sistem
            </div>

            {/* Global Live Filter Search */}
            <div style={{ position: 'relative', width: '280px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Canlı Liste Filtrele (Ad, Kod, Şube)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.85rem 0.55rem 2.4rem',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  color: '#0f172a',
                  fontSize: '0.85rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* INTERACTIVE NOTIFICATION BELL ICON */}
            <button
              onClick={() => setShowNotificationsDrawer(true)}
              title="Canlı Bildirimler & Duyurular"
              style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
            >
              <Bell size={22} color="#1d5f60" />
              <span style={{ position: 'absolute', top: '-2px', right: '-2px', background: '#ef4444', color: '#fff', fontSize: '0.65rem', fontWeight: 800, width: '17px', height: '17px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                3
              </span>
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
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Gaziantep Şehitkamil Belediyesi GölBox Panel</h1>
                <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '4px' }}>Akıllı Şehir & Sadakat Ekosisteminin tüm canlı metrikleri ve operasyon dökümü.</p>
              </div>

              {/* Ultra-Premium Stat Cards Grid with Sparklines */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1d5f60', letterSpacing: '0.05em', textTransform: 'uppercase' }}>TOPLAM VATANDAŞ KULLANICI</div>
                    <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 800 }}>↗ +14.2%</span>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>{overviewData?.totalUsers ?? usersList.length ?? 1250}</div>
                  <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a' }} />
                    %100 Şehitkamil Doğrulanmış
                  </div>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7', letterSpacing: '0.05em', textTransform: 'uppercase' }}>DAĞITILAN GÖLPUAN</div>
                    <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 800 }}>⚡ 4,850 GP</span>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>4,850 GP</div>
                  <div style={{ fontSize: '0.75rem', color: '#0284c7', marginTop: '6px', fontWeight: 600 }}>Gençlik & Etkinlik Bonusu</div>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#d97706', letterSpacing: '0.05em', textTransform: 'uppercase' }}>BEKLEYEN ISMARLIYOR</div>
                    <span style={{ background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 800 }}>☕ Askıda</span>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>{ordersList.length > 0 ? ordersList.length : 6} Başvuru</div>
                  <div style={{ fontSize: '0.75rem', color: '#d97706', marginTop: '6px', fontWeight: 600 }}>Onay & Teslimat Bekliyor</div>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a', letterSpacing: '0.05em', textTransform: 'uppercase' }}>BUGÜNKÜ QR TARAMASI</div>
                    <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 800 }}>⚡ Canlı</span>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>342 İşlem</div>
                  <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '6px', fontWeight: 600 }}>Şehitkamil Kitap Kafeler</div>
                </div>
              </div>

              {/* Quick Actions & Recent Activity Summary + Heatmap Widget */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)' }}>
                  <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>⚡ Onay Bekleyen Son Ismarlıyor Başvuruları</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                        <th style={{ padding: '0.65rem' }}>Kod</th>
                        <th style={{ padding: '0.65rem' }}>Vatandaş</th>
                        <th style={{ padding: '0.65rem' }}>Hedef Kriter</th>
                        <th style={{ padding: '0.65rem' }}>Şube</th>
                        <th style={{ padding: '0.65rem', textAlign: 'right' }}>Eylem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getIsmarliyorList().slice(0, 4).map(o => (
                        <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.75rem 0.65rem', fontWeight: 800, color: '#d97706' }}>{o.collectionCode}</td>
                          <td style={{ padding: '0.75rem 0.65rem', fontWeight: 700 }}>{o.userFullName}</td>
                          <td style={{ padding: '0.75rem 0.65rem' }}>
                            <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>
                              {o.targetCriteria || 'Gençler'}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 0.65rem', color: '#64748b' }}>{o.cafeName}</td>
                          <td style={{ padding: '0.75rem 0.65rem', textAlign: 'right' }}>
                            <button onClick={() => handleUpdateOrderStatus(o.id, 'Delivered')} style={{ padding: '4px 10px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                              ⚡ Onayla
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>⚙️ Hızlı Eylemler</h3>
                  <button onClick={() => setShowAddIsmarliyorModal(true)} style={{ padding: '0.75rem', background: '#1d5f60', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Gift size={18} /> + Yeni Ismarlıyor Ekle (Kitle Kriterli)
                  </button>
                  <button onClick={() => setShowAddEventModal(true)} style={{ padding: '0.75rem', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={18} /> + Yeni Etkinlik Tanımla
                  </button>
                  <button onClick={() => setShowAddRewardModal(true)} style={{ padding: '0.75rem', background: '#d97706', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Award size={18} /> GölPuan İkram Ödülü Ekle
                  </button>

                  {/* Kafe Yoğunluk & Doluluk Isı Haritası Widget */}
                  <div style={{ marginTop: 'auto', borderTop: '1px solid #f1f5f9', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a' }}>🔥 Canlı Kafe Doluluk Oranı</span>
                      <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700 }}>%78 Dolu</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '100px', overflow: 'hidden' }}>
                      <div style={{ width: '78%', height: '100%', background: 'linear-gradient(90deg, #16a34a, #d97706, #ef4444)', borderRadius: '100px' }} />
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Merkez Kafe: %85</span>
                      <span>Mogan Kafe: %60</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* 2. KULLANICILAR */}
          {/* ------------------------------------------------------------- */}
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
                    {getFilteredList(usersList).map((u) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #1d5f60, #0284c7)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
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
                          <div style={{ fontSize: '0.725rem', color: '#94a3b8' }}>0532 123 4567</div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>{u.age ?? 21}</td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '3px 10px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 700 }}>
                            {u.educationLevel || 'Üniversite'}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#1d5f60', fontSize: '1rem' }}>
                          {u.pointsBalance} GP
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 10px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 700 }}>
                            Şehitkamil Üyesi
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
                  <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '4px' }}>Belediye gençlik ve kitap kafe tesisleri kapak görselleri.</p>
                </div>
                <button onClick={() => setShowAddCafeModal(true)} style={{ background: '#1d5f60', color: '#fff', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '10px', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Plus size={18} />
                  <span>+ Yeni Şehitkamil Kafe Ekle</span>
                </button>
              </div>

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
                      <div style={{ width: '100%', height: '100px', background: 'linear-gradient(135deg, #1d5f60 0%, #0284c7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                        <Building2 size={36} />
                      </div>
                    )}
                    <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{c.name}</h3>
                        <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 700 }}>Aktif Şube</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={14} /> <span>{c.address}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
                    background: 'linear-gradient(135deg, #1d5f60, #0284c7)',
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
                  <option value="ALL">🌐 Tüm Şubelerdeki Ürünler</option>
                  {extractArray(cafesList).map(c => (
                    <option key={c.id} value={c.id}>📍 {c.name}</option>
                  ))}
                </select>
              </div>

              {/* Pro Product Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                {getFilteredList(menuItemsList).map((item) => (
                  <div key={item.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)' }}>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '110px', background: 'linear-gradient(135deg, #1d5f60 0%, #0284c7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
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
                          {item.cafeId === 'ALL' || !item.cafeId ? '🌐 Tüm Şubelerde Geçerli' : (item.cafeName ? `📍 ${item.cafeName}` : '📍 Seçili Şubede')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
                    background: 'linear-gradient(135deg, #1d5f60, #0284c7)',
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                {getFilteredList(rewardsList.length > 0 ? rewardsList : [
                  { id: 'rew-1', title: '☕ Ücretsiz Filtre Kahve', description: 'Şehitkamil Kitap Kafelerde geçerli sıcak taze filtre kahve ikramı.', pointsRequired: 50, isAvailable: true },
                  { id: 'rew-2', title: '🍰 Günün Dilim Pastası', description: 'Kitap Kafe günlük taze dilim pasta veya cheesecake ikramı.', pointsRequired: 100, isAvailable: true },
                  { id: 'rew-3', title: '🥐 Sıcak Kruvasan & Taze Çay', description: 'Taze fırınlanmış kruvasan ve sınırsız demli çay ikramı.', pointsRequired: 75, isAvailable: true },
                  { id: 'rew-4', title: '📚 %50 Kitap Satın Alma İndirim Kuponu', description: 'Gençlik Merkezleri ve Kitap Kafe kütüphanelerinde %50 indirim.', pointsRequired: 120, isAvailable: true }
                ]).map((r) => (
                  <div key={r.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{r.title}</h3>
                      <span style={{ background: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 800 }}>
                        {r.pointsRequired} GP
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>{r.description}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
                      <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '6px', fontSize: '0.725rem', fontWeight: 700 }}>Aktif İkram</span>
                      <span style={{ fontSize: '0.725rem', color: '#0284c7', fontWeight: 700 }}>Tüm Şubelerde</span>
                    </div>
                  </div>
                ))}
              </div>
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
                    background: 'linear-gradient(135deg, #1d5f60, #0284c7)',
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
                  { id: 'Pending', label: '⏳ İnceleme Bekleyenler' },
                  { id: 'Approved', label: '✅ Onaylananlar' },
                  { id: 'Live', label: '🔥 Yayında (Hazır)' },
                  { id: 'Completed', label: '☕ Tamamlandı' }
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
                      <th style={{ padding: '0.85rem 1rem' }}>🎯 Hedef Kriter</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Şube & Tutarı</th>
                      <th style={{ padding: '0.85rem 1rem' }}>📷 Ismarlayan Görseli</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Durum</th>
                      <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>⚡ Otomatik Onay</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getIsmarliyorList().map((o) => (
                      <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#d97706' }}>{o.collectionCode}</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0f172a' }}>{o.userFullName}</td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '3px 10px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 700 }}>
                            {o.targetCriteria || 'Gençler (18-25 Yaş)'}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>{o.cafeName} ({o.totalAmount} TL)</td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          {o.imageUrl ? (
                            <button onClick={() => setPreviewProofImage(o.imageUrl)} style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                              📷 Görsel Gör (#Önizle)
                            </button>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Görsel Yok</span>
                          )}
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{ padding: '4px 10px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 700, background: o.status === 'Delivered' ? '#dcfce7' : '#fef3c7', color: o.status === 'Delivered' ? '#15803d' : '#b45309' }}>
                            {o.status === 'Delivered' ? 'Tamamlandı' : 'Yayında (Hazır)'}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                          {o.status === 'Delivered' ? (
                            <span style={{ color: '#15803d', fontWeight: 700, fontSize: '0.75rem' }}>✓ Teslim Edildi</span>
                          ) : (
                            <button onClick={() => handleUpdateOrderStatus(o.id, 'Delivered')} style={{ padding: '6px 14px', background: '#16a34a', border: 'none', color: '#fff', borderRadius: '8px', fontSize: '0.775rem', fontWeight: 800, cursor: 'pointer' }}>
                              ⚡ Tek Tıkla Onayla & İkram Et
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

          {/* ------------------------------------------------------------- */}
          {/* 9. KAMPANYALAR & İNDİRİMLER (PRO CREATION & DATES & CRITERIA) */}
          {/* ------------------------------------------------------------- */}
          {activeMenu === 'campaigns' && (
            <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Kampanyalar & İndirim Yönetimi</h1>
                  <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '4px' }}>Şehitkamil Kitap Kafeler için tarihli, hedef kitle şartlı ve süreli indirim kampanyaları.</p>
                </div>

                <button
                  onClick={() => setShowAddCampaignModal(true)}
                  style={{
                    background: 'linear-gradient(135deg, #1d5f60, #0284c7)',
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
                  <span>+ Yeni Kampanya / İndirim Tanımla</span>
                </button>
              </div>

              {/* Campaigns Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                {getFilteredList(campaignsList).map((c) => (
                  <div key={c.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)' }}>
                    {c.imageUrl ? (
                      <img src={c.imageUrl} alt={c.title} style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100px', background: 'linear-gradient(135deg, #1d5f60 0%, #0284c7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
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
                          {c.valueLabel || c.discountRate || '%20 İndirim'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: 'auto' }}>
                        <span style={{ fontSize: '0.725rem', background: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                          {c.targetGroupLabel || c.targetCriteria || '🎓 Öğrencilere Özel'}
                        </span>
                        <span style={{ fontSize: '0.725rem', background: '#fef3c7', color: '#b45309', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                          📅 {c.startDate ? new Date(c.startDate).toLocaleDateString('tr-TR') : 'Bugün'} - {c.endDate ? new Date(c.endDate).toLocaleDateString('tr-TR') : '14 Gün'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
                {getFilteredList(eventsList).map((e) => (
                  <div key={e.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{e.title}</h3>
                      <span style={{ background: '#fef3c7', color: '#b45309', padding: '3px 10px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 800 }}>+{e.pointsReward} GP</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.825rem', color: '#64748b' }}>{e.description}</p>
                    <div style={{ fontSize: '0.75rem', color: '#0369a1', fontWeight: 600 }}>📍 Konum: {e.location || 'Şehitkamil Gençlik Merkezi'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* 11. DUYURULAR VE BİLDİRİMLER */}
          {/* ------------------------------------------------------------- */}
          {activeMenu === 'notifications' && (
            <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Duyurular & Anlık Bildirim Gönderimi</h1>
                <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '4px' }}>Şehitkamil Belediyesi mobil vatandaşlarına özel anlık Push Notification gönderimi.</p>
              </div>

              <form onSubmit={handleSendPushNotification} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '600px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Bildirim Başlığı</label>
                  <input type="text" placeholder="Örn: ☕ Şehitkamil Kitap Kafelerde Gençlere Özel +20 GP!" value={pushTitle} onChange={(e) => setPushTitle(e.target.value)} required style={{ width: '100%', padding: '0.65rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Bildirim Mesajı</label>
                  <textarea rows={3} placeholder="Duyuru detayını yazın..." value={pushMessage} onChange={(e) => setPushMessage(e.target.value)} required style={{ width: '100%', padding: '0.65rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                </div>
                <button type="submit" style={{ padding: '0.75rem', background: '#1d5f60', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <Send size={16} /> Toplu Anlık Bildirim Gönder
                </button>
              </form>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* 12. STRATEJİK RAPORLAR */}
          {/* ------------------------------------------------------------- */}
          {activeMenu === 'reports' && (
            <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Stratejik Raporlama & Aktarım</h1>
                  <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '4px' }}>Gaziantep Şehitkamil Belediyesi puan hareketleri ve ikram dökümleri.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleExportData('excel')} style={{ padding: '0.65rem 1.25rem', background: '#15803d', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Download size={16} /> Excel (.xlsx) İndir
                  </button>
                  <button onClick={() => handleExportData('pdf')} style={{ padding: '0.65rem 1.25rem', background: '#b91c1c', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Download size={16} /> PDF Rapor İndir
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* CANLI BİLDİRİMLER DRAWER SHEET (INTERACTIVE BELL ICON) */}
      {/* ------------------------------------------------------------- */}
      {showNotificationsDrawer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'flex-end', zIndex: 1000 }}>
          <div style={{ width: '480px', height: '100%', background: '#ffffff', borderLeft: '1px solid #e2e8f0', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto', boxShadow: '-10px 0 30px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ background: '#1d5f60', color: '#fff', padding: '8px', borderRadius: '10px', display: 'flex' }}>
                  <Bell size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Canlı Bildirimler & Duyurular</h3>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Gaziantep Şehitkamil anlık operasyon bildirimleri.</div>
                </div>
              </div>
              <button onClick={() => setShowNotificationsDrawer(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1rem', borderRadius: '12px' }}>
                <div style={{ fontWeight: 800, color: '#166534', fontSize: '0.9rem' }}>🎉 Yeni Ismarlıyor İkramı Yayınlandı</div>
                <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '4px' }}>Şehitkamil Gençlik Merkezi şubesinde 2 Adet Filtre Kahve ikramı hazır.</div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '6px' }}>2 dakika önce</div>
              </div>

              <div style={{ background: '#e0f2fe', border: '1px solid #bae6fd', padding: '1rem', borderRadius: '12px' }}>
                <div style={{ fontWeight: 800, color: '#0369a1', fontSize: '0.9rem' }}>📱 QR Kasa Tarama Başarılı</div>
                <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '4px' }}>Vatandaşa +15 GP Şehitkamil alışveriş puanı yüklendi.</div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '6px' }}>15 dakika önce</div>
              </div>
            </div>

            <button onClick={() => setShowNotificationsDrawer(false)} style={{ marginTop: 'auto', padding: '10px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '10px', color: '#0f172a', fontWeight: 700, cursor: 'pointer' }}>
              Pencereyi Kapat
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* NEW ADMIN ISMARLIYOR CREATION MODAL WITH TARGET CRITERIA */}
      {/* ------------------------------------------------------------- */}
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
              <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>İkram Eden Vatandaş / Kurum Adı</label>
              <input
                type="text"
                placeholder="Örn: Mehmet Yılmaz (Veya Hayırsever Vatandaş)"
                value={newIsmUserFullName}
                onChange={(e) => setNewIsmUserFullName(e.target.value)}
                required
                style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', outline: 'none' }}
              />
            </div>

            {/* TARGET CRITERIA SELECTION */}
            <div>
              <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#1d5f60', display: 'block', marginBottom: '4px' }}>🎯 Hedef İkram Kriteri / Kısıtlama Şartı</label>
              <select
                value={newIsmTargetCriteria}
                onChange={(e) => setNewIsmTargetCriteria(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#f8fafc', border: '2px solid #1d5f60', borderRadius: '8px', color: '#0f172a', outline: 'none', fontWeight: 700 }}
              >
                <option value="Tüm Vatandaşlara Açık (Şartsız)">🌐 Tüm Vatandaşlara Açık (Şartsız)</option>
                <option value="Gençler (18-25 Yaş)">🧒 Sadece Gençlere Özel (18-25 Yaş)</option>
                <option value="Öğrenciler (Lise & Üniversite)">🎓 Sadece Öğrencilere Özel (Lise & Üniversite)</option>
                <option value="Emekli Vatandaşlar (65+ Yaş)">👵 Sadece Emekli Vatandaşlara Özel (65+ Yaş)</option>
                <option value="Kadın Vatandaşlar">👩 Sadece Kadın Vatandaşlara Özel</option>
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
                  {extractArray(cafesList).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>İkram Edilecek Ürün</label>
                <input
                  type="text"
                  placeholder="Örn: Filtre Kahve / Çay"
                  value={newIsmItemName}
                  onChange={(e) => setNewIsmItemName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', outline: 'none' }}
                />
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
              <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>📷 Ismarlayan Kişi Görseli Yükle</label>
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
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Yeni Kampanya & İndirim Tanımla</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Tarihli, kitle şartlı ve şube özel indirim kurguları.</p>
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
                placeholder="Örn: 🎓 Şehitkamil Öğrencilerine %20 Kitap Kafe İndirimi"
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
                <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>📅 Başlangıç Tarihi</label>
                <input
                  type="date"
                  value={newCampStartDate}
                  onChange={(e) => setNewCampStartDate(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>📅 Bitiş Tarihi</label>
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
                <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#1d5f60', display: 'block', marginBottom: '4px' }}>🎯 Hedef Kitle Kriteri</label>
                <select
                  value={newCampTargetGroup}
                  onChange={(e) => setNewCampTargetGroup(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', outline: 'none', fontWeight: 700 }}
                >
                  <option value="All">🌐 Tüm Vatandaşlar (Şartsız)</option>
                  <option value="Students">🎓 Sadece Öğrencilere Özel</option>
                  <option value="Youth">🧒 Sadece Gençler (18-25 Yaş)</option>
                  <option value="Seniors">👵 Sadece Emekliler (65+ Yaş)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>🌐 Şube Geçerliliği</label>
                <select
                  value={newCampCafeId}
                  onChange={(e) => setNewCampCafeId(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', outline: 'none' }}
                >
                  <option value="ALL">🌐 Tüm Şubelerde Geçerli</option>
                  {extractArray(cafesList).map((c) => (
                    <option key={c.id} value={c.id}>📍 Sadece {c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>📷 Kampanya Görseli Yükle</label>
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
                <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#1d5f60', display: 'block', marginBottom: '4px' }}>🌐 Şube / Konum Geçerliliği</label>
                <select
                  value={newProdCafeId}
                  onChange={(e) => setNewProdCafeId(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#f8fafc', border: '2px solid #1d5f60', borderRadius: '8px', color: '#0f172a', outline: 'none', fontWeight: 700 }}
                >
                  <option value="ALL">🌐 Tüm Şubelerde Geçerli (Bütün Şehitkamil Kafeler)</option>
                  {extractArray(cafesList).map((c) => (
                    <option key={c.id} value={c.id}>📍 Sadece {c.name}</option>
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
              <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>📷 Ürün Fotoğrafı Yükle</label>
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
      {/* NEW PRO CAFE CREATION MODAL */}
      {/* ------------------------------------------------------------- */}
      {showAddCafeModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleCreateCafe} style={{ width: '520px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ background: '#1d5f60', color: '#fff', padding: '8px', borderRadius: '10px', display: 'flex' }}>
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Yeni Şehitkamil Kafe / Tesis Ekle</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Fotoğraflı şube yönetimi.</p>
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

            <div>
              <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>📷 Tesis Kapak Fotoğrafı Yükle</label>
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

      {/* MODAL: ADD EVENT (FIXED & POLISHED) */}
      {showAddEventModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleCreateEvent} style={{ width: '520px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ background: '#0284c7', color: '#fff', padding: '8px', borderRadius: '10px', display: 'flex' }}>
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

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="button" onClick={() => setShowAddEventModal(false)} style={{ flex: 1, padding: '10px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '10px', color: '#0f172a', fontWeight: 600, cursor: 'pointer' }}>İptal</button>
              <button type="submit" style={{ flex: 1, padding: '10px', background: '#1d5f60', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Etkinliği Yayınla</button>
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
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, #1d5f60, #0284c7)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem' }}>
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
