import React, { useState, useEffect, createContext, useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  StatusBar,
  Alert,
  FlatList,
  Platform,
  Switch,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const API_BASE_URL = 'http://localhost:5155/api/v1';

// --- DATA TYPES & INTERFACES ---

export interface UserProfile {
  id: string;
  email: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  birthDate?: string;
  pointsBalance: number;
  isStudent: boolean;
  referralCode: string;
  role: 'Customer' | 'BranchStaff' | 'Admin';
  kvkkAccepted?: boolean;
  marketingConsent?: boolean;
}

export interface MenuItemOption {
  id: string;
  name: string;
  priceDelta: number;
}

export interface MenuItemOptionGroup {
  id: string;
  name: string;
  required: boolean;
  options: MenuItemOption[];
}

export interface MenuItem {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isAvailable: boolean;
  calories?: number;
  allergens?: string[];
  sizeOptions?: MenuItemOption[];
  milkOptions?: MenuItemOption[];
  extraOptions?: MenuItemOption[];
}

export interface Cafe {
  id: string;
  name: string;
  address: string;
  phone: string;
  workingHours: string;
  isOpen: boolean;
  gelAlAvailable: boolean;
  latitude: number;
  longitude: number;
  imageUrl: string;
}

export interface CartCustomization {
  size?: MenuItemOption;
  milk?: MenuItemOption;
  extras: MenuItemOption[];
}

export interface CartItem {
  cartItemId: string;
  menuItem: MenuItem;
  customization: CartCustomization;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export type OrderStatus = 'Pending' | 'Confirmed' | 'Preparing' | 'Ready' | 'Completed' | 'Cancelled';

export interface Order {
  id: string;
  orderNumber: string;
  userFullName: string;
  userPhone: string;
  cafeId: string;
  cafeName: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  pointsUsed: number;
  pointsEarned: number;
  totalAmount: number;
  paidWithPoints: boolean;
  paymentMethod: string;
  status: OrderStatus;
  collectionCode: string;
  estimatedPrepMinutes: number;
  createdAt: string;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  requiredPoints: number;
  category: string;
  status: 'Active' | 'Redeemed' | 'Expired';
  redeemCode?: string;
}

export interface PointTransaction {
  id: string;
  date: string;
  title: string;
  description: string;
  amount: number;
  type: 'Earn' | 'Spend';
  branchName?: string;
}

export interface Campaign {
  id: string;
  title: string;
  badge: string;
  description: string;
  code: string;
  discountPercent?: number;
  validUntil: string;
  imageUrl: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  type: 'order' | 'campaign' | 'points' | 'system';
}

// --- INITIAL MOCK DATA ---

const defaultCafes: Cafe[] = [
  {
    id: 'cafe-1',
    name: 'Şehitkamil Merkez Kitap Kafe',
    address: 'Atatürk Mahallesi, Gaziantep Bulvarı No:42, Şehitkamil / Gaziantep',
    phone: '0342 211 00 01',
    workingHours: '07:30 - 23:00',
    isOpen: true,
    gelAlAvailable: true,
    latitude: 37.0662,
    longitude: 37.3833,
    imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'cafe-2',
    name: 'İbrahimli Sosyal Tesis GölBOX',
    address: 'İbrahimli 2. Etap Park İçi GölBOX Büfe, Şehitkamil / Gaziantep',
    phone: '0342 211 00 02',
    workingHours: '08:00 - 22:30',
    isOpen: true,
    gelAlAvailable: true,
    latitude: 37.0815,
    longitude: 37.3520,
    imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'cafe-3',
    name: 'Gençlik Kitap Kafe GölBOX',
    address: 'Gazikent Gençlik Merkezi Yanı, Şehitkamil / Gaziantep',
    phone: '0342 211 00 03',
    workingHours: '08:30 - 22:00',
    isOpen: true,
    gelAlAvailable: true,
    latitude: 37.0950,
    longitude: 37.4120,
    imageUrl: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=500&auto=format&fit=crop&q=60'
  }
];

const defaultMenuItems: MenuItem[] = [
  {
    id: 'm-1',
    categoryId: 'c-hot',
    categoryName: 'Sıcak Kahveler',
    name: 'GölBOX Özel Filtre Kahve',
    description: '%100 Arabica taze çekilmiş yöresel Şehitkamil GölBOX demleme filtre kahve.',
    price: 35,
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=60',
    isAvailable: true,
    calories: 5,
    allergens: [],
    sizeOptions: [
      { id: 'sz-1', name: 'Küçük (250ml)', priceDelta: 0 },
      { id: 'sz-2', name: 'Orta (350ml)', priceDelta: 10 },
      { id: 'sz-3', name: 'Büyük (450ml)', priceDelta: 18 }
    ],
    milkOptions: [
      { id: 'ml-1', name: 'Tam Yağlı Süt', priceDelta: 0 },
      { id: 'ml-2', name: 'Yulaf Sütü', priceDelta: 12 },
      { id: 'ml-3', name: 'Laktozsuz Süt', priceDelta: 8 }
    ],
    extraOptions: [
      { id: 'ex-1', name: 'Ekstra Espresso Shot', priceDelta: 15 },
      { id: 'ex-2', name: 'Vani̇lya Şurubu', priceDelta: 10 },
      { id: 'ex-3', name: 'Karamel Şurubu', priceDelta: 10 }
    ]
  },
  {
    id: 'm-2',
    categoryId: 'c-hot',
    categoryName: 'Sıcak Kahveler',
    name: 'Karamel Macchiato',
    description: 'Yoğun espresso, kadifemsi sıcak süt ve zengin karamel sosu dokunuşu.',
    price: 65,
    imageUrl: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=400&auto=format&fit=crop&q=60',
    isAvailable: true,
    calories: 190,
    allergens: ['Süt'],
    sizeOptions: [
      { id: 'sz-1', name: 'Orta (350ml)', priceDelta: 0 },
      { id: 'sz-2', name: 'Büyük (450ml)', priceDelta: 15 }
    ],
    milkOptions: [
      { id: 'ml-1', name: 'Tam Yağlı Süt', priceDelta: 0 },
      { id: 'ml-2', name: 'Yulaf Sütü', priceDelta: 12 }
    ],
    extraOptions: [
      { id: 'ex-1', name: 'Ekstra Karamel Sosu', priceDelta: 10 }
    ]
  },
  {
    id: 'm-3',
    categoryId: 'c-hot',
    categoryName: 'Sıcak Kahveler',
    name: 'Caffè Latte',
    description: 'Zengin espresso ve buharla ısıtılmış yumuşak süt köpüğü.',
    price: 55,
    imageUrl: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=400&auto=format&fit=crop&q=60',
    isAvailable: true,
    calories: 140,
    allergens: ['Süt'],
    sizeOptions: [
      { id: 'sz-1', name: 'Orta (350ml)', priceDelta: 0 },
      { id: 'sz-2', name: 'Büyük (450ml)', priceDelta: 15 }
    ]
  },
  {
    id: 'm-4',
    categoryId: 'c-cold',
    categoryName: 'Soğuk Kahveler',
    name: 'Iced Vanilla Latte',
    description: 'Buzlu taze süt, vanilya aroması ve çift shot yoğun espresso.',
    price: 70,
    imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&auto=format&fit=crop&q=60',
    isAvailable: true,
    calories: 160,
    allergens: ['Süt'],
    sizeOptions: [
      { id: 'sz-1', name: 'Orta (350ml)', priceDelta: 0 },
      { id: 'sz-2', name: 'Büyük (450ml)', priceDelta: 16 }
    ]
  },
  {
    id: 'm-5',
    categoryId: 'c-cold',
    categoryName: 'Soğuk Kahveler',
    name: 'GölBOX Iced Cold Brew',
    description: '20 saat soğuk demleme özel harman sert ferahlatıcı soğuk kahve.',
    price: 60,
    imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&auto=format&fit=crop&q=60',
    isAvailable: true,
    calories: 10,
    allergens: []
  },
  {
    id: 'm-6',
    categoryId: 'c-tea',
    categoryName: 'Çaylar & Meşrubat',
    name: 'Demli Çay & Taze Simit',
    description: 'Rize yaprak çayı ve günlük taze susamlı Şehitkamil fırın simidi.',
    price: 25,
    imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=60',
    isAvailable: true,
    calories: 280,
    allergens: ['Gluten', 'Susam']
  },
  {
    id: 'm-7',
    categoryId: 'c-dessert',
    categoryName: 'Tatlılar & Atıştırmalıklar',
    name: 'Çikolatalı Cheesecake',
    description: 'GölBOX mutfağından taze günlük çikolatalı ve kıtır tabanlı cheesecake.',
    price: 85,
    imageUrl: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400&auto=format&fit=crop&q=60',
    isAvailable: true,
    calories: 420,
    allergens: ['Süt', 'Yumurta', 'Gluten']
  },
  {
    id: 'm-8',
    categoryId: 'c-dessert',
    categoryName: 'Tatlılar & Atıştırmalıklar',
    name: 'Tereyağlı Sıcak Kruvasan',
    description: 'Fransız usulü kat kat tereyağlı taze fırınlanmış sıcak kruvasan.',
    price: 55,
    imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&auto=format&fit=crop&q=60',
    isAvailable: true,
    calories: 310,
    allergens: ['Süt', 'Gluten']
  }
];

const defaultCampaigns: Campaign[] = [
  {
    id: 'camp-1',
    title: 'Pazartesi Kahve Fırsatı',
    badge: '⚡ %20 İNDİRİM',
    description: 'Her Pazartesi tüm GölBOX şubelerinde soğuk kahvelerde %20 indirim.',
    code: 'PAZARTESI20',
    discountPercent: 20,
    validUntil: '31.12.2026',
    imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'camp-2',
    title: 'GölBOX Özel Sınav Haftası',
    badge: '⭐ ÖZEL İNDİRİM',
    description: 'Doğrulanmış öğrenci hesaplarına Kitap Kafelerde sınırsız demli çay ikramı!',
    code: 'SINAV50',
    discountPercent: 30,
    validUntil: '15.11.2026',
    imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'camp-3',
    title: 'Arkadaşını Getir, 100 GP Kazan',
    badge: '🎁 100 GÖLPUAN',
    description: 'Davet kodunu arkadaşınla paylaş, ilk siparişinde ikiniz de 100 GölPuan kazanın.',
    code: 'ARKADAS100',
    validUntil: '31.12.2026',
    imageUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=500&auto=format&fit=crop&q=60'
  }
];

const defaultRewards: Reward[] = [
  { id: 'rew-1', title: '☕ Ücretsiz Filtre Kahve', description: 'Tüm Şehitkamil GölBOX Kafelerde geçerli sıcak taze filtre kahve ikramı.', requiredPoints: 150, category: 'Kahve', status: 'Active' },
  { id: 'rew-2', title: '🍰 Günün Dilim Pastası', description: 'GölBOX mutfağı taze günlük dilim pasta veya cheesecake.', requiredPoints: 300, category: 'Tatlı', status: 'Active' },
  { id: 'rew-3', title: '🥐 Sıcak Kruvasan & Taze Çay', description: 'Fırınlanmış tereyağlı kruvasan ve demli çay ikram menüsü.', requiredPoints: 220, category: 'Kahvaltı', status: 'Active' },
  { id: 'rew-4', title: '📚 %50 Kitap Alım Kuponu', description: 'Gençlik Merkezleri Kütüphanesi kitap satışlarında geçerli %50 indirim.', requiredPoints: 400, category: 'Eğitim', status: 'Active' }
];

const defaultNotifications: AppNotification[] = [
  { id: 'notif-1', title: '🎉 GölBOX\'a Hoş Geldin!', body: 'İlk siparişine özel %20 indirim kuponun PAZARTESI20 hesabına tanımlandı.', time: '10 dk önce', read: false, type: 'campaign' },
  { id: 'notif-2', title: '☕ Siparişin Hazırlanıyor', body: '#GB1028 numaralı siparişin baristalarımız tarafından hazırlanıyor.', time: '4 dk önce', read: false, type: 'order' },
  { id: 'notif-3', title: '⭐ +65 GölPuan Kazanıldı', body: 'Son Gel-Al siparişinden +65 GölPuan bakiyene eklendi.', time: 'Dün', read: true, type: 'points' }
];

const defaultPointHistory: PointTransaction[] = [
  { id: 'pt-1', date: '04.10.2026 14:20', title: 'Gel-Al Sipariş Kazanımı', description: 'GölBOX Kitap Kafe Gel-Al siparişi #GB-1082', amount: 65, type: 'Earn', branchName: 'Şehitkamil Merkez Kitap Kafe' },
  { id: 'pt-2', date: '02.10.2026 09:15', title: 'Filtre Kahve Ödül Kullanımı', description: 'Ücretsiz Filtre Kahve Ödülü Alındı', amount: -150, type: 'Spend', branchName: 'Gençlik Kitap Kafe' },
  { id: 'pt-3', date: '28.09.2026 16:45', title: 'Günlük QR Okutma Bonusu', description: 'Kasada QR Okutma Etkinliği', amount: 25, type: 'Earn', branchName: 'İbrahimli Sosyal Tesis' },
  { id: 'pt-4', date: '20.09.2026 11:30', title: 'Hoş Geldin Hediyesi', description: 'Mobil Uygulama İlk Kayıt Puanı', amount: 100, type: 'Earn' }
];

// --- APP CONTEXT ---

interface GolboxContextType {
  user: UserProfile | null;
  selectedBranch: Cafe;
  setSelectedBranch: (branch: Cafe) => void;
  cafes: Cafe[];
  menuItems: MenuItem[];
  cart: CartItem[];
  orders: Order[];
  rewards: Reward[];
  campaigns: Campaign[];
  notifications: AppNotification[];
  markNotificationAsRead: (id: string) => void;
  pointHistory: PointTransaction[];
  favorites: string[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: 'Customer' | 'BranchStaff' | 'Admin';
  setUserRole: (role: 'Customer' | 'BranchStaff' | 'Admin') => void;
  login: (emailOrPhone: string, pass: string) => Promise<boolean>;
  register: (data: { firstName: string; lastName: string; phone: string; email: string; birthDate: string; pass: string; kvkkAccepted: boolean; marketingConsent: boolean }) => Promise<boolean>;
  logout: () => void;
  addToCart: (item: MenuItem, customization: CartCustomization, quantity: number) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  toggleFavorite: (menuItemId: string) => void;
  createOrder: (paidWithPoints: boolean, couponCode?: string) => Promise<Order | null>;
  cancelOrder: (orderId: string) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  claimReward: (rewardId: string) => boolean;
  simulateQRScan: () => void;
  toggleStudentStatus: () => void;
}

const GolboxContext = createContext<GolboxContextType | null>(null);

function useGolbox() {
  const context = useContext(GolboxContext);
  if (!context) throw new Error('useGolbox, GolboxProvider içerisinde kullanılmalıdır.');
  return context;
}

// --- PROVIDER COMPONENT ---

function GolboxProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>({
    id: 'usr-101',
    email: 'ahmet.yilmaz@sehitkamil.bel.tr',
    phoneNumber: '0532 555 12 34',
    firstName: 'Ahmet',
    lastName: 'Yılmaz',
    birthDate: '1998-05-14',
    pointsBalance: 740,
    isStudent: true,
    referralCode: 'AHMET250',
    role: 'Customer',
    kvkkAccepted: true,
    marketingConsent: true
  });

  const [userRole, setUserRole] = useState<'Customer' | 'BranchStaff' | 'Admin'>('Customer');
  const [cafes, setCafes] = useState<Cafe[]>(defaultCafes);
  const [selectedBranch, setSelectedBranch] = useState<Cafe>(defaultCafes[0]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(defaultMenuItems);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>(defaultNotifications);
  const [orders, setOrders] = useState<Order[]>([
    {
      id: 'ord-1028',
      orderNumber: 'GB1028',
      userFullName: 'Ahmet Yılmaz',
      userPhone: '0532 555 12 34',
      cafeId: 'cafe-1',
      cafeName: 'Şehitkamil Merkez Kitap Kafe',
      items: [
        {
          cartItemId: 'ci-1',
          menuItem: defaultMenuItems[0],
          customization: {
            size: defaultMenuItems[0].sizeOptions![1],
            milk: defaultMenuItems[0].milkOptions![1],
            extras: [defaultMenuItems[0].extraOptions![0]]
          },
          quantity: 1,
          unitPrice: 62,
          totalPrice: 62
        }
      ],
      subtotal: 62,
      discount: 0,
      pointsUsed: 0,
      pointsEarned: 6,
      totalAmount: 62,
      paidWithPoints: false,
      paymentMethod: 'Kredi Kartı',
      status: 'Preparing',
      collectionCode: 'GB-4921',
      estimatedPrepMinutes: 4,
      createdAt: new Date().toISOString()
    }
  ]);
  const [rewards, setRewards] = useState<Reward[]>(defaultRewards);
  const [campaigns, setCampaigns] = useState<Campaign[]>(defaultCampaigns);
  const [pointHistory, setPointHistory] = useState<PointTransaction[]>(defaultPointHistory);
  const [favorites, setFavorites] = useState<string[]>(['m-1', 'm-4']);
  const [activeTab, setActiveTab] = useState('home');

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const login = async (emailOrPhone: string, pass: string) => {
    setUser({
      id: 'usr-101',
      email: emailOrPhone.includes('@') ? emailOrPhone : 'ahmet.yilmaz@sehitkamil.bel.tr',
      phoneNumber: emailOrPhone.includes('@') ? '0532 555 12 34' : emailOrPhone,
      firstName: emailOrPhone.toLowerCase().includes('admin') ? 'Yönetici' : 'Ahmet',
      lastName: emailOrPhone.toLowerCase().includes('admin') ? 'Merkez' : 'Yılmaz',
      birthDate: '1998-05-14',
      pointsBalance: 740,
      isStudent: true,
      referralCode: 'AHMET250',
      role: emailOrPhone.toLowerCase().includes('admin') ? 'Admin' : emailOrPhone.toLowerCase().includes('sube') ? 'BranchStaff' : 'Customer',
      kvkkAccepted: true,
      marketingConsent: true
    });
    return true;
  };

  const register = async (data: { firstName: string; lastName: string; phone: string; email: string; birthDate: string; pass: string; kvkkAccepted: boolean; marketingConsent: boolean }) => {
    setUser({
      id: `usr-${Date.now()}`,
      email: data.email,
      phoneNumber: data.phone,
      firstName: data.firstName,
      lastName: data.lastName,
      birthDate: data.birthDate,
      pointsBalance: 100, // Welcome Bonus
      isStudent: false,
      referralCode: `${data.firstName.toUpperCase()}${Math.floor(100 + Math.random() * 900)}`,
      role: 'Customer',
      kvkkAccepted: data.kvkkAccepted,
      marketingConsent: data.marketingConsent
    });

    setPointHistory(prev => [
      {
        id: `pt-${Date.now()}`,
        date: new Date().toLocaleDateString('tr-TR') + ' ' + new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        title: 'Hoş Geldin Hediyesi 🎉',
        description: 'Yeni üyelik 100 GölPuan hediye bakiyesi',
        amount: 100,
        type: 'Earn'
      },
      ...prev
    ]);

    return true;
  };

  const logout = () => {
    setUser(null);
    setCart([]);
  };

  const addToCart = (item: MenuItem, customization: CartCustomization, quantity: number) => {
    let extraPrice = 0;
    if (customization.size) extraPrice += customization.size.priceDelta;
    if (customization.milk) extraPrice += customization.milk.priceDelta;
    if (customization.extras && customization.extras.length > 0) {
      customization.extras.forEach(ex => { extraPrice += ex.priceDelta; });
    }

    const unitPrice = item.price + extraPrice;
    const totalPrice = unitPrice * quantity;

    const newItem: CartItem = {
      cartItemId: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      menuItem: item,
      customization,
      quantity,
      unitPrice,
      totalPrice
    };

    setCart(prev => [...prev, newItem]);
    Alert.alert('Sepete Eklendi 🛒', `${quantity}x ${item.name} sepetinize eklendi.`);
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(c => c.cartItemId !== cartItemId));
  };

  const clearCart = () => setCart([]);

  const toggleFavorite = (menuItemId: string) => {
    setFavorites(prev =>
      prev.includes(menuItemId) ? prev.filter(id => id !== menuItemId) : [...prev, menuItemId]
    );
  };

  const createOrder = async (paidWithPoints: boolean, couponCode?: string): Promise<Order | null> => {
    if (cart.length === 0) {
      Alert.alert('Sepet Boş', 'Lütfen sepete ürün ekleyin.');
      return null;
    }

    const subtotal = cart.reduce((acc, c) => acc + c.totalPrice, 0);
    let discount = 0;
    if (couponCode === 'PAZARTESI20' || couponCode === 'GOLBOX50') {
      discount = Math.round(subtotal * 0.2);
    }

    let pointsUsed = 0;
    let totalAmount = Math.max(0, subtotal - discount);

    if (paidWithPoints) {
      const requiredPoints = Math.round(totalAmount * 10);
      if ((user?.pointsBalance || 0) < requiredPoints) {
        Alert.alert('Yetersiz GölPuan', `Bu sipariş için ${requiredPoints} GölPuan gereklidir. Mevcut puanınız: ${user?.pointsBalance || 0}`);
        return null;
      }
      pointsUsed = requiredPoints;
      totalAmount = 0;
    }

    const pointsEarned = paidWithPoints ? 0 : Math.round(totalAmount * 0.1);

    const newOrderNumber = `GB${Math.floor(1000 + Math.random() * 9000)}`;
    const collectionCode = `GB-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: newOrderNumber,
      userFullName: user ? `${user.firstName} ${user.lastName}` : 'Misafir Müşteri',
      userPhone: user?.phoneNumber || '0532 000 00 00',
      cafeId: selectedBranch.id,
      cafeName: selectedBranch.name,
      items: [...cart],
      subtotal,
      discount,
      pointsUsed,
      pointsEarned,
      totalAmount,
      paidWithPoints,
      paymentMethod: paidWithPoints ? 'GölPuan' : 'Kredi Kartı',
      status: 'Pending',
      collectionCode,
      estimatedPrepMinutes: 6,
      createdAt: new Date().toISOString()
    };

    setOrders(prev => [newOrder, ...prev]);
    setCart([]);

    if (user) {
      const netPointsDiff = pointsEarned - pointsUsed;
      setUser(prev => prev ? { ...prev, pointsBalance: Math.max(0, prev.pointsBalance + netPointsDiff) } : null);

      if (pointsEarned > 0) {
        setPointHistory(prev => [
          {
            id: `pt-${Date.now()}`,
            date: new Date().toLocaleDateString('tr-TR') + ' ' + new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
            title: 'Gel-Al Sipariş Kazanımı',
            description: `Sipariş #${newOrderNumber} tutarı üzerinden puan kazanıldı`,
            amount: pointsEarned,
            type: 'Earn',
            branchName: selectedBranch.name
          },
          ...prev
        ]);
      }

      if (pointsUsed > 0) {
        setPointHistory(prev => [
          {
            id: `pt-${Date.now() + 1}`,
            date: new Date().toLocaleDateString('tr-TR') + ' ' + new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
            title: 'Sipariş Puan Harcaması',
            description: `Sipariş #${newOrderNumber} GölPuan ile ödendi`,
            amount: -pointsUsed,
            type: 'Spend',
            branchName: selectedBranch.name
          },
          ...prev
        ]);
      }
    }

    Alert.alert('🎉 Siparişiniz Alındı!', `Sipariş Kodu: ${collectionCode}\nŞube: ${selectedBranch.name}`);
    return newOrder;
  };

  const cancelOrder = (orderId: string) => {
    const target = orders.find(o => o.id === orderId);
    if (!target) return;
    if (target.status === 'Preparing' || target.status === 'Ready' || target.status === 'Completed') {
      Alert.alert('İptal Edilemez', 'Hazırlanmaya başlayan veya tamamlanan siparişler iptal edilemez.');
      return;
    }

    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'Cancelled' } : o));
    Alert.alert('Sipariş İptal Edildi', `#${target.orderNumber} numaralı siparişiniz iptal edildi.`);
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));

    if (status === 'Ready') {
      Alert.alert('🔔 Siparişin Hazır! 🎉', 'Siparişin GölBOX şubesinde seni bekliyor. Teslim kodunu kasada göstererek alabilirsin.');
    }
  };

  const claimReward = (rewardId: string): boolean => {
    const reward = rewards.find(r => r.id === rewardId);
    if (!reward || !user) return false;

    if (user.pointsBalance < reward.requiredPoints) {
      Alert.alert('Yetersiz GölPuan', `Bu ödül için ${reward.requiredPoints} GP gerekiyor. Bakiyeniz: ${user.pointsBalance} GP`);
      return false;
    }

    const redeemCode = `GB-REWARD-${Math.floor(1000 + Math.random() * 9000)}`;

    setUser(prev => prev ? { ...prev, pointsBalance: prev.pointsBalance - reward.requiredPoints } : null);
    setPointHistory(prev => [
      {
        id: `pt-${Date.now()}`,
        date: new Date().toLocaleDateString('tr-TR') + ' ' + new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        title: 'Ödül Kullanımı',
        description: `${reward.title} Ödülü Talep Edildi`,
        amount: -reward.requiredPoints,
        type: 'Spend'
      },
      ...prev
    ]);

    Alert.alert('🎉 Ödülünüz Hazır!', `Tebrikler! Teslimat Kodunuz: ${redeemCode}\nKasada QR Kodunuzu göstererek ikramınızı teslim alabilirsiniz.`);
    return true;
  };

  const simulateQRScan = () => {
    if (!user) return;
    setUser(prev => prev ? { ...prev, pointsBalance: prev.pointsBalance + 25 } : null);
    setPointHistory(prev => [
      {
        id: `pt-${Date.now()}`,
        date: new Date().toLocaleDateString('tr-TR') + ' ' + new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        title: 'Fiziksel Kasa QR Taraması',
        description: 'Şehitkamil Kitap Kafe kasada QR Okutma Bonusu',
        amount: 25,
        type: 'Earn',
        branchName: selectedBranch.name
      },
      ...prev
    ]);
    Alert.alert('⭐ Puan Yüklendi!', '+25 GölPuan hesabınıza eklendi. Keyifli vakitler dileriz!');
  };

  const toggleStudentStatus = () => {
    setUser(prev => prev ? { ...prev, isStudent: !prev.isStudent } : null);
    Alert.alert('GölBOX Sadakat', user?.isStudent ? 'Üye statüsü pasif yapıldı.' : '🎉 Sadakat ayrıcalıklarınız aktif.');
  };

  return (
    <GolboxContext.Provider
      value={{
        user,
        selectedBranch,
        setSelectedBranch,
        cafes,
        menuItems,
        cart,
        orders,
        rewards,
        campaigns,
        notifications,
        markNotificationAsRead,
        pointHistory,
        favorites,
        activeTab,
        setActiveTab,
        userRole,
        setUserRole,
        login,
        register,
        logout,
        addToCart,
        removeFromCart,
        clearCart,
        toggleFavorite,
        createOrder,
        cancelOrder,
        updateOrderStatus,
        claimReward,
        simulateQRScan,
        toggleStudentStatus
      }}
    >
      {children}
    </GolboxContext.Provider>
  );
}

// --- APP STAGES & CONTAINER ---

type AppStage = 'splash' | 'maintenance' | 'force_update' | 'network_error' | 'auth_gate' | 'login' | 'register' | 'otp' | 'forgot_password' | 'main';

export default function App() {
  return (
    <SafeAreaProvider>
      <GolboxProvider>
        <MainContainer />
      </GolboxProvider>
    </SafeAreaProvider>
  );
}

function MainContainer() {
  const {
    activeTab,
    setActiveTab,
    user,
    selectedBranch,
    setSelectedBranch,
    cafes,
    menuItems,
    cart,
    orders,
    rewards,
    campaigns,
    notifications,
    markNotificationAsRead,
    pointHistory,
    favorites,
    userRole,
    setUserRole,
    login,
    register,
    logout,
    addToCart,
    removeFromCart,
    clearCart,
    toggleFavorite,
    createOrder,
    cancelOrder,
    updateOrderStatus,
    claimReward,
    simulateQRScan,
    toggleStudentStatus
  } = useGolbox();

  // STAGE & CONTROL STATES
  const [appStage, setAppStage] = useState<AppStage>('splash');
  const [isRefreshingHome, setIsRefreshingHome] = useState(false);

  // LOGIN & REGISTER STATES
  const [loginPhoneOrEmail, setLoginPhoneOrEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regBirthDate, setRegBirthDate] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regKvkk, setRegKvkk] = useState(false);
  const [regTerms, setRegTerms] = useState(false);
  const [regMarketing, setRegMarketing] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  // OTP STATES
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(30);
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  // FORGOT PASS STATES
  const [forgotPhone, setForgotPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<'request' | 'verify' | 'new_pass'>('request');

  // MODALS
  const [showNotificationsSheet, setShowNotificationsSheet] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState<'kvkk' | 'terms' | null>(null);
  const [welcomeToast, setWelcomeToast] = useState<string | null>(null);

  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [selectedSize, setSelectedSize] = useState<MenuItemOption | undefined>(undefined);
  const [selectedMilk, setSelectedMilk] = useState<MenuItemOption | undefined>(undefined);
  const [selectedExtras, setSelectedExtras] = useState<MenuItemOption[]>([]);
  const [quantity, setQuantity] = useState<number>(1);

  const [showCartModal, setShowCartModal] = useState<boolean>(false);
  const [showBranchModal, setShowBranchModal] = useState<boolean>(false);
  const [showActiveOrderModal, setShowActiveOrderModal] = useState<boolean>(false);
  const [activeTrackingOrder, setActiveTrackingOrder] = useState<Order | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [couponCode, setCouponCode] = useState<string>('');
  const [usePointsPayment, setUsePointsPayment] = useState<boolean>(false);

  // Active Order Check (Top priority!)
  const activeOrders = orders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled');
  const latestActiveOrder = activeOrders.length > 0 ? activeOrders[0] : null;

  // 1. SPLASH SCREEN INITIAL CHECK (SECTION 1)
  useEffect(() => {
    let isMounted = true;
    const runSplashChecks = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1500)); // Smooth Splash presentation
        if (!isMounted) return;

        // Check backend app config (Mock/Real API call)
        const checkAppConfig = async () => {
          try {
            const res = await fetch(`${API_BASE_URL}/config/app-status`);
            if (res.ok) {
              const data = await res.json();
              if (data.data?.isMaintenanceMode) return 'maintenance';
              if (data.data?.isForceUpdateRequired) return 'force_update';
            }
          } catch {
            // Ignore API offline in dev, fall through to session check
          }
          return 'ok';
        };

        const configResult = await checkAppConfig();
        if (configResult === 'maintenance') {
          setAppStage('maintenance');
          return;
        }
        if (configResult === 'force_update') {
          setAppStage('force_update');
          return;
        }

        // Section 1.4: Session Check
        if (user) {
          setAppStage('main');
        } else {
          setAppStage('auth_gate');
        }
      } catch {
        if (isMounted) setAppStage('network_error');
      }
    };

    runSplashChecks();
    return () => { isMounted = false; };
  }, []);

  // OTP Countdown Timer
  useEffect(() => {
    if (appStage === 'otp' && otpTimer > 0) {
      const timer = setInterval(() => setOtpTimer(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [appStage, otpTimer]);

  // Section 31: Pull to Refresh
  const handleRefreshHome = async () => {
    setIsRefreshingHome(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshingHome(false);
  };

  // HANDLERS FOR AUTHENTICATION (SECTIONS 3-7)
  const handleLoginSubmit = async () => {
    setLoginError(null);
    if (!loginPhoneOrEmail || !loginPassword) {
      setLoginError('Lütfen telefon numarası/e-posta ve şifrenizi eksiksiz girin.');
      return;
    }
    setIsLoginLoading(true);
    try {
      await login(loginPhoneOrEmail, loginPassword);
      setIsLoginLoading(false);
      setAppStage('main');
    } catch {
      setIsLoginLoading(false);
      setLoginError('Telefon numarası/e-posta veya şifre hatalı.');
    }
  };

  const handlePhoneFormat = (text: string) => {
    // Format Turkey Phone: +90 5XX XXX XX XX
    let cleaned = text.replace(/\D/g, '');
    if (cleaned.startsWith('90')) cleaned = cleaned.substring(2);
    if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
    if (cleaned.length > 10) cleaned = cleaned.substring(0, 10);

    let formatted = '+90 ';
    if (cleaned.length > 0) formatted += cleaned.substring(0, 3);
    if (cleaned.length >= 4) formatted += ' ' + cleaned.substring(3, 6);
    if (cleaned.length >= 7) formatted += ' ' + cleaned.substring(6, 8);
    if (cleaned.length >= 9) formatted += ' ' + cleaned.substring(8, 10);

    setRegPhone(formatted);
  };

  const handleRegisterSubmit = async () => {
    setRegError(null);
    if (!regFirstName || !regLastName || !regPhone || !regEmail || !regPassword) {
      setRegError('Lütfen tüm zorunlu alanları doldurun.');
      return;
    }
    if (!regKvkk || !regTerms) {
      setRegError('Devam etmek için zorunlu yasal metinleri onaylamalısınız.');
      return;
    }

    // Direct to OTP stage
    setOtpTimer(30);
    setOtpDigits(['1', '2', '3', '4', '5', '6']); // Pre-filled mock OTP for smooth testing
    setAppStage('otp');
  };

  const handleVerifyOtp = async () => {
    setOtpError(null);
    const code = otpDigits.join('');
    if (code.length < 6) {
      setOtpError('Lütfen 6 haneli doğrulama kodunu eksiksiz girin.');
      return;
    }
    if (code === '999999') {
      setOtpError('Kodun süresi doldu. Yeni kod isteyebilirsin.');
      return;
    }

    setIsOtpLoading(true);
    await new Promise(r => setTimeout(r, 600));
    await register({
      firstName: regFirstName || 'Yeni',
      lastName: regLastName || 'Müşteri',
      phone: regPhone,
      email: regEmail,
      birthDate: regBirthDate || '2000-01-01',
      pass: regPassword,
      kvkkAccepted: regKvkk,
      marketingConsent: regMarketing
    });
    setIsOtpLoading(false);
    setAppStage('main');

    // Section 7: Post Registration Welcome Banner
    setWelcomeToast('GölBOX\'a hoş geldin! 🎉 İlk siparişine özel 100 GölPuan hediye bakiyen yüklendi.');
    setTimeout(() => setWelcomeToast(null), 6000);
  };

  const handleOpenCustomize = (item: MenuItem) => {
    setCustomizingItem(item);
    setSelectedSize(item.sizeOptions ? item.sizeOptions[0] : undefined);
    setSelectedMilk(item.milkOptions ? item.milkOptions[0] : undefined);
    setSelectedExtras([]);
    setQuantity(1);
  };

  const handleAddCustomizedToCart = () => {
    if (!customizingItem) return;
    addToCart(customizingItem, { size: selectedSize, milk: selectedMilk, extras: selectedExtras }, quantity);
    setCustomizingItem(null);
  };

  const unreadNotifCount = notifications.filter(n => !n.read).length;

  // --- STAGE SCREEN RENDERS ---

  // SECTION 1: SPLASH SCREEN
  if (appStage === 'splash') {
    return (
      <View style={styles.splashContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#022c22" />
        <View style={styles.splashContent}>
          <View style={styles.splashLogoCircle}>
            <Text style={{ fontSize: 52 }}>☕</Text>
          </View>
          <Text style={styles.splashBrandTitle}>GölBOX</Text>
          <Text style={styles.splashBrandSub}>ŞEHİTKAMİL BELEDİYESİ</Text>
          <Text style={styles.splashTagline}>Kahveni seç, GölPuan kazan, sıra beklemeden Gel-Al.</Text>

          <View style={{ marginTop: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#10b981" />
            <Text style={styles.splashLoadingText}>Oturum kontrol ediliyor...</Text>
          </View>
        </View>
      </View>
    );
  }

  // SECTION 1.8: MAINTENANCE MODE SCREEN
  if (appStage === 'maintenance') {
    return (
      <SafeAreaView style={styles.fullScreenNoticeBg}>
        <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
        <View style={styles.noticeCard}>
          <Text style={{ fontSize: 64, textAlign: 'center' }}>☕</Text>
          <Text style={styles.noticeTitle}>GölBOX kısa bir kahve molasında ☕</Text>
          <Text style={styles.noticeMessage}>
            Size daha iyi hizmet verebilmek için sistemlerimiz üzerinde çalışıyoruz. Kısa süre sonra tekrar deneyebilirsiniz.
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => setAppStage('splash')}>
            <Text style={styles.primaryBtnText}>Yenile 🔄</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // SECTION 1.7: FORCED UPDATE SCREEN
  if (appStage === 'force_update') {
    return (
      <SafeAreaView style={styles.fullScreenNoticeBg}>
        <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
        <View style={styles.noticeCard}>
          <Text style={{ fontSize: 64, textAlign: 'center' }}>🚀</Text>
          <Text style={styles.noticeTitle}>GölBOX'ın yeni sürümü hazır.</Text>
          <Text style={styles.noticeMessage}>
            Siparişlerinizi daha hızlı vermek ve yeni GölPuan kampanyalarından faydalanmak için uygulamayı güncelleyin.
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => Alert.alert('Güncelleniyor', 'Uygulama mağazasına yönlendiriliyorsunuz...')}>
            <Text style={styles.primaryBtnText}>Şimdi Güncelle 📲</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // SECTION 1.9: NETWORK ERROR SCREEN
  if (appStage === 'network_error') {
    return (
      <SafeAreaView style={styles.fullScreenNoticeBg}>
        <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
        <View style={styles.noticeCard}>
          <Text style={{ fontSize: 64, textAlign: 'center' }}>📡</Text>
          <Text style={styles.noticeTitle}>Bağlantı kurulamadı.</Text>
          <Text style={styles.noticeMessage}>İnternet bağlantını kontrol ederek tekrar deneyebilirsin.</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => setAppStage('splash')}>
            <Text style={styles.primaryBtnText}>Tekrar Dene 🔄</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // SECTION 2: KARŞILAMA / AUTH GATE SCREEN
  if (appStage === 'auth_gate') {
    return (
      <SafeAreaView style={styles.authGateContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#064e3b" />
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between', padding: 24 }}>
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <View style={styles.authGateBadge}>
              <Text style={{ fontSize: 44 }}>☕</Text>
            </View>
            <Text style={styles.authGateTitle}>GölBOX'a Hoş Geldin</Text>
            <Text style={styles.authGateSub}>Gaziantep Şehitkamil Belediyesi Dijital Kahve Ekosistemi</Text>
            <Text style={styles.authGateSlogan}>"Kahveni seç, GölPuan kazan, sıra beklemeden Gel-Al."</Text>
          </View>

          <View style={{ width: '100%', marginBottom: 24 }}>
            <TouchableOpacity style={styles.authPrimaryBtn} onPress={() => setAppStage('login')}>
              <Text style={styles.authPrimaryBtnText}>Giriş Yap ➔</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.authSecondaryBtn} onPress={() => setAppStage('register')}>
              <Text style={styles.authSecondaryBtnText}>Yeni Hesap Oluştur / Kayıt Ol</Text>
            </TouchableOpacity>

            <TouchableOpacity style={{ marginTop: 16, alignItems: 'center' }} onPress={() => setAppStage('main')}>
              <Text style={styles.guestLinkText}>Misafir Olarak Menüyü Keşfet</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // SECTION 3: GİRİŞ YAP SCREEN
  if (appStage === 'login') {
    return (
      <SafeAreaView style={styles.authFormContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <ScrollView contentContainerStyle={{ padding: 24 }}>
          <TouchableOpacity style={styles.backBtnRow} onPress={() => setAppStage('auth_gate')}>
            <Text style={{ fontSize: 18, color: '#1d5f60', fontWeight: '800' }}>← Geri</Text>
          </TouchableOpacity>

          <Text style={styles.formTitle}>Giriş Yap ☕</Text>
          <Text style={styles.formSub}>GölBOX hesabınıza erişerek Gel-Al siparişi verin ve GölPuan kazanın.</Text>

          {loginError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>⚠️ {loginError}</Text>
            </View>
          )}

          <Text style={styles.inputLabel}>Telefon Numarası veya E-posta *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="05XX XXX XX XX veya e-posta adresi"
            placeholderTextColor="#94a3b8"
            value={loginPhoneOrEmail}
            onChangeText={setLoginPhoneOrEmail}
            autoCapitalize="none"
          />

          <Text style={styles.inputLabel}>Şifre *</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextInput
              style={[styles.textInput, { flex: 1 }]}
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
              secureTextEntry={!showLoginPassword}
              value={loginPassword}
              onChangeText={setLoginPassword}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowLoginPassword(!showLoginPassword)}
            >
              <Text style={{ fontSize: 16 }}>{showLoginPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={{ alignSelf: 'flex-end', marginTop: 8 }} onPress={() => setAppStage('forgot_password')}>
            <Text style={styles.linkText}>Şifremi Unuttum?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryBtn, isLoginLoading && { opacity: 0.7 }]}
            onPress={handleLoginSubmit}
            disabled={isLoginLoading}
          >
            {isLoginLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Giriş Yap ➔</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // SECTION 4: KAYIT OL SCREEN
  if (appStage === 'register') {
    return (
      <SafeAreaView style={styles.authFormContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <ScrollView contentContainerStyle={{ padding: 24 }}>
          <TouchableOpacity style={styles.backBtnRow} onPress={() => setAppStage('auth_gate')}>
            <Text style={{ fontSize: 18, color: '#1d5f60', fontWeight: '800' }}>← Geri</Text>
          </TouchableOpacity>

          <Text style={styles.formTitle}>Hesap Oluştur 🎉</Text>
          <Text style={styles.formSub}>GölBOX ekosistemine katılın, ilk siparişinizde hediye GölPuan kazanın.</Text>

          {regError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>⚠️ {regError}</Text>
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Ad *</Text>
              <TextInput style={styles.textInput} placeholder="Ahmet" value={regFirstName} onChangeText={setRegFirstName} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Soyad *</Text>
              <TextInput style={styles.textInput} placeholder="Yılmaz" value={regLastName} onChangeText={setRegLastName} />
            </View>
          </View>

          <Text style={styles.inputLabel}>Telefon Numarası *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="+90 5XX XXX XX XX"
            keyboardType="phone-pad"
            value={regPhone}
            onChangeText={handlePhoneFormat}
          />

          <Text style={styles.inputLabel}>E-posta Adresi *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="ornek@domain.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={regEmail}
            onChangeText={setRegEmail}
          />

          <Text style={styles.inputLabel}>Doğum Tarihi (GG/AA/YYYY)</Text>
          <TextInput style={styles.textInput} placeholder="14/05/1998" value={regBirthDate} onChangeText={setRegBirthDate} />

          <Text style={styles.inputLabel}>Şifre *</Text>
          <TextInput style={styles.textInput} placeholder="En az 6 karakter" secureTextEntry value={regPassword} onChangeText={setRegPassword} />

          {/* SÖZLEŞMELER VE ONAYLAR (SECTION 4.3) */}
          <View style={{ marginTop: 16 }}>
            <TouchableOpacity style={styles.checkboxRow} onPress={() => setRegKvkk(!regKvkk)}>
              <View style={[styles.checkbox, regKvkk && styles.checkboxActive]}>
                {regKvkk && <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>✓</Text>}
              </View>
              <Text style={styles.checkboxText}>
                <Text style={{ fontWeight: 'bold', textDecorationLine: 'underline' }} onPress={() => setShowLegalModal('kvkk')}>KVKK Aydınlatma Metni</Text>'ni okudum ve kabul ediyorum. *
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.checkboxRow} onPress={() => setRegTerms(!regTerms)}>
              <View style={[styles.checkbox, regTerms && styles.checkboxActive]}>
                {regTerms && <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>✓</Text>}
              </View>
              <Text style={styles.checkboxText}>
                <Text style={{ fontWeight: 'bold', textDecorationLine: 'underline' }} onPress={() => setShowLegalModal('terms')}>Kullanıcı Sözleşmesi</Text> ve Gizlilik Politikası'nı kabul ediyorum. *
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.checkboxRow} onPress={() => setRegMarketing(!regMarketing)}>
              <View style={[styles.checkbox, regMarketing && styles.checkboxActive]}>
                {regMarketing && <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>✓</Text>}
              </View>
              <Text style={styles.checkboxText}>
                Kampanya, indirim ve özel fırsatlardan SMS/E-posta ile haberdar olmak istiyorum (Opsiyonel).
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={handleRegisterSubmit}>
            <Text style={styles.primaryBtnText}>Kayıt Ol ve Kodu Gönder ➔</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // SECTION 5: OTP DOĞRULAMA SCREEN
  if (appStage === 'otp') {
    return (
      <SafeAreaView style={styles.authFormContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={{ padding: 24, flex: 1, justifyContent: 'center' }}>
          <Text style={{ fontSize: 40, textAlign: 'center', marginBottom: 16 }}>📱</Text>
          <Text style={[styles.formTitle, { textAlign: 'center' }]}>Telefonunu Doğrula</Text>
          <Text style={[styles.formSub, { textAlign: 'center' }]}>
            {regPhone || '+90 532 555 12 34'} numarasına gönderdiğimiz 6 haneli doğrulama kodunu gir.
          </Text>

          {otpError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>⚠️ {otpError}</Text>
            </View>
          )}

          <View style={styles.otpRow}>
            {otpDigits.map((digit, idx) => (
              <TextInput
                key={idx}
                style={styles.otpBox}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={(val) => {
                  const newArr = [...otpDigits];
                  newArr[idx] = val;
                  setOtpDigits(newArr);
                }}
              />
            ))}
          </View>

          <View style={{ alignItems: 'center', marginVertical: 16 }}>
            {otpTimer > 0 ? (
              <Text style={styles.otpTimerText}>Kodu tekrar göndermek için {otpTimer} saniye bekle</Text>
            ) : (
              <TouchableOpacity onPress={() => { setOtpTimer(30); Alert.alert('Kod Gönderildi', 'Yeni 6 haneli SMS kodunuz gönderildi.'); }}>
                <Text style={styles.linkText}>Kodu Tekrar Gönder 🔄</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={handleVerifyOtp} disabled={isOtpLoading}>
            {isOtpLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Doğrula ve Başla ➔</Text>}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // SECTION 6: ŞİFREMİ UNUTTUM SCREEN
  if (appStage === 'forgot_password') {
    return (
      <SafeAreaView style={styles.authFormContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={{ padding: 24, flex: 1, justifyContent: 'center' }}>
          <TouchableOpacity style={styles.backBtnRow} onPress={() => setAppStage('login')}>
            <Text style={{ fontSize: 18, color: '#1d5f60', fontWeight: '800' }}>← Giriş Ekranına Dön</Text>
          </TouchableOpacity>

          <Text style={styles.formTitle}>Şifremi Unuttum 🔑</Text>
          <Text style={styles.formSub}>Kayıtlı telefon numaranızı girerek şifrenizi güvenle sıfırlayabilirsiniz.</Text>

          {forgotStep === 'request' ? (
            <>
              <Text style={styles.inputLabel}>Telefon Numarası *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="+90 5XX XXX XX XX"
                value={forgotPhone}
                onChangeText={setForgotPhone}
              />
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => {
                  if (!forgotPhone) { Alert.alert('Hata', 'Lütfen telefon numaranızı girin.'); return; }
                  setForgotStep('verify');
                  Alert.alert('SMS Gönderildi', `${forgotPhone} numarasına sıfırlama kodu gönderildi.`);
                }}
              >
                <Text style={styles.primaryBtnText}>Sıfırlama Kodu Gönder ➔</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.inputLabel}>Yeni Şifre *</Text>
              <TextInput style={styles.textInput} placeholder="En az 6 karakter" secureTextEntry value={newPassword} onChangeText={setNewPassword} />
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => {
                  Alert.alert('Başarılı! 🎉', 'Şifreniz yenilendi. Yeni şifrenizle giriş yapabilirsiniz.');
                  setAppStage('login');
                }}
              >
                <Text style={styles.primaryBtnText}>Şifreyi Güncelle ➔</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // SECTION 8 - 35: MAIN APPLICATION EXPERIENCE (ANA SAYFA, MENÜ, QR, GÖLPUAN, PROFİL)
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* TOP HEADER BAR */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.branchPicker} onPress={() => setShowBranchModal(true)}>
          <Text style={styles.branchPickerPin}>📍</Text>
          <View>
            <Text style={styles.branchPickerLabel}>GEL-AL ŞUBESİ</Text>
            <Text style={styles.branchPickerValue} numberOfLines={1}>
              {selectedBranch.name} ▾
            </Text>
          </View>
        </TouchableOpacity>

        {/* SECTION 10: BİLDİRİM MERKEZİ BUTONU & ROLE SWITCH */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity style={styles.notifIconBtn} onPress={() => setShowNotificationsSheet(true)}>
            <Text style={{ fontSize: 18 }}>🔔</Text>
            {unreadNotifCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{unreadNotifCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.roleSwitchRow}>
            <TouchableOpacity
              style={[styles.roleChip, userRole === 'Customer' && styles.roleChipActive]}
              onPress={() => setUserRole('Customer')}
            >
              <Text style={[styles.roleChipText, userRole === 'Customer' && styles.roleChipTextActive]}>Müşteri</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleChip, userRole === 'BranchStaff' && styles.roleChipActive]}
              onPress={() => setUserRole('BranchStaff')}
            >
              <Text style={[styles.roleChipText, userRole === 'BranchStaff' && styles.roleChipTextActive]}>Şube</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleChip, userRole === 'Admin' && styles.roleChipActive]}
              onPress={() => setUserRole('Admin')}
            >
              <Text style={[styles.roleChipText, userRole === 'Admin' && styles.roleChipTextActive]}>Yönetim</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* WELCOME TOAST BANNER */}
      {welcomeToast && (
        <View style={styles.toastBanner}>
          <Text style={styles.toastBannerText}>{welcomeToast}</Text>
        </View>
      )}

      {/* BODY CONTENT DEPENDING ON ROLE & ACTIVE TAB */}
      <View style={{ flex: 1 }}>
        {userRole === 'BranchStaff' ? (
          <BranchOperationsScreen />
        ) : userRole === 'Admin' ? (
          <AdminDashboardScreen />
        ) : (
          <>
            {/* ---------------- SECTION 8 - 35: ANA SAYFA ---------------- */}
            {activeTab === 'home' && (
              <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                  <RefreshControl refreshing={isRefreshingHome} onRefresh={handleRefreshHome} colors={['#1d5f60']} />
                }
              >
                {/* SECTION 11 & 28: 1. AKTİF SİPARİŞ KARTI (TOP PRIORITY WHEN EXISTS) */}
                {latestActiveOrder && (
                  <TouchableOpacity
                    style={styles.activeOrderBannerHighPriority}
                    onPress={() => {
                      setActiveTrackingOrder(latestActiveOrder);
                      setShowActiveOrderModal(true);
                    }}
                  >
                    <View style={styles.activeOrderBannerLeft}>
                      <View style={styles.activeOrderPillHeader}>
                        <Text style={styles.activeOrderBannerBadge}>SİPARİŞ #{latestActiveOrder.orderNumber}</Text>
                        <Text style={{ fontSize: 11, color: '#047857', fontWeight: '800' }}>Tahmini: 4 dk</Text>
                      </View>
                      <Text style={styles.activeOrderBannerStatus}>
                        {latestActiveOrder.status === 'Pending' ? 'Sipariş Alındı' : latestActiveOrder.status === 'Preparing' ? 'Siparişin Hazırlanıyor' : 'Siparişin Hazır!'}
                      </Text>
                      <Text style={styles.activeOrderBannerSub}>
                        {latestActiveOrder.cafeName} · Kod: {latestActiveOrder.collectionCode}
                      </Text>
                    </View>
                    <View style={styles.activeOrderBannerRight}>
                      <Text style={styles.activeOrderBannerBtn}>Takip Et ➔</Text>
                    </View>
                  </TouchableOpacity>
                )}

                {/* SECTION 9: 2. KARŞILAMA + ŞUBE */}
                <View style={styles.headerRow}>
                  <View>
                    <Text style={styles.subTitleText}>Gaziantep Şehitkamil Belediyesi</Text>
                    <Text style={styles.mainTitleText}>
                      Merhaba {user ? user.firstName : 'Ahmet'}
                    </Text>
                    <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '600', marginTop: 2 }}>
                      Bugün GölBOX'ta ne içmek istersin?
                    </Text>
                  </View>
                  {user?.isStudent && (
                    <View style={styles.studentBadgePill}>
                      <Text style={styles.studentBadgePillText}>GÖLBOX SADAKAT</Text>
                    </View>
                  )}
                </View>

                {/* SECTION 13: 3. GEL-AL ANA AKSİYON BUTONU */}
                <TouchableOpacity style={styles.primaryGelAlBtn} onPress={() => setActiveTab('menu')}>
                  <Text style={styles.primaryGelAlBtnText}>Gel-Al Sipariş Ver ➔</Text>
                </TouchableOpacity>

                {/* SECTION 14 & 15: 4. GÖLPUAN ÖZET KARTI & İLERLEME GÖSTERGESİ */}
                <View style={styles.userCard}>
                  <View style={styles.userCardHeader}>
                    <View style={styles.userAvatar}>
                      <Text style={styles.userAvatarText}>{user ? user.firstName.charAt(0) : 'A'}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.userWelcomeSub}>Mevcut GölPuanınız</Text>
                      <Text style={styles.userWelcomeName}>{user ? `${user.firstName} ${user.lastName}` : 'Misafir Müşteri'}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.gpLabel}>GÖLPUAN</Text>
                      <Text style={styles.gpValue}>{user ? user.pointsBalance : 0}</Text>
                    </View>
                  </View>

                  <View style={styles.progressContainer}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.progressText}>
                        {user && user.pointsBalance >= 1000
                          ? 'Tebrikler! Tüm ödül eşiklerini açtınız.'
                          : `${user ? user.pointsBalance : 0} / 1.000 GölPuan · Bir sonraki ödülüne ${1000 - (user?.pointsBalance || 0)} puan kaldı.`}
                      </Text>
                    </View>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${Math.min(100, ((user?.pointsBalance || 0) / 1000) * 100)}%` }]} />
                    </View>
                  </View>

                  <TouchableOpacity style={styles.viewRewardsBtn} onPress={() => setActiveTab('golpuan')}>
                    <Text style={styles.viewRewardsBtnText}>Ödülleri Gör ➔</Text>
                  </TouchableOpacity>
                </View>

                {/* SECTION 16: 5. KASADA QR HIZLI ERİŞİM */}
                <TouchableOpacity style={styles.qrQuickAccessStrip} onPress={() => setActiveTab('qr')}>
                  <Text style={{ fontSize: 24, marginRight: 12 }}>📱</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.qrQuickAccessTitle}>Kasada QR'ını göster, GölPuan kazan.</Text>
                    <Text style={styles.qrQuickAccessSub}>Fiziksel kasalarda anında puan yükletmek için tıkla.</Text>
                  </View>
                  <Text style={styles.qrQuickAccessArrow}>➔</Text>
                </TouchableOpacity>

                {/* SECTION 17 & 18: 6. KAMPANYA BANNER CAROUSEL */}
                <View style={{ marginTop: 24 }}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>🎉 Kampanyalar & Fırsatlar</Text>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16 }}>
                    {campaigns.map(camp => (
                      <TouchableOpacity
                        key={camp.id}
                        style={styles.campaignCard}
                        onPress={() => Alert.alert(`🎉 ${camp.title}`, `${camp.description}\n\nPromosyon Kodu: ${camp.code}\nGeçerlilik: ${camp.validUntil}`)}
                      >
                        <Image source={{ uri: camp.imageUrl }} style={styles.campaignImg} />
                        <View style={styles.campaignBody}>
                          <Text style={styles.campaignBadge}>{camp.badge}</Text>
                          <Text style={styles.campaignTitle}>{camp.title}</Text>
                          <Text style={styles.campaignDesc} numberOfLines={2}>{camp.description}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* SECTION 19: 7. HIZLI MENÜ / KATEGORİLER */}
                <View style={{ marginTop: 24 }}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>⚡ Hızlı Kategoriler</Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <TouchableOpacity style={styles.quickCatChip} onPress={() => setActiveTab('menu')}>
                      <Text style={styles.quickCatChipText}>☕ Sıcak Kahveler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickCatChip} onPress={() => setActiveTab('menu')}>
                      <Text style={styles.quickCatChipText}>🧊 Soğuk Kahveler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickCatChip} onPress={() => setActiveTab('menu')}>
                      <Text style={styles.quickCatChipText}>🍰 Tatlılar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickCatChip} onPress={() => setActiveTab('menu')}>
                      <Text style={styles.quickCatChipText}>🥪 Atıştırmalıklar</Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>

                {/* SECTION 21: 8. SON SİPARİŞ / TEKRAR SİPARİŞ */}
                {menuItems.length > 0 && (
                  <View style={{ marginTop: 24 }}>
                    <View style={styles.sectionHeaderRow}>
                      <Text style={styles.sectionTitle}>⚡ Son Sipariş / Tekrar Sipariş</Text>
                    </View>

                    <TouchableOpacity style={styles.reorderCard} onPress={() => handleOpenCustomize(menuItems[0])}>
                      <Image source={{ uri: menuItems[0].imageUrl }} style={styles.reorderImg} />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.reorderTitle}>{menuItems[0].name}</Text>
                        <Text style={styles.reorderSub}>Büyük Boy · Yulaf Sütü · Ekstra Shot</Text>
                        <Text style={styles.reorderPrice}>{menuItems[0].price} TL</Text>
                      </View>
                      <View style={styles.reorderBtn}>
                        <Text style={styles.reorderBtnText}>+ Tekrar Al</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                )}

                {/* SECTION 20: 9. FAVORİLERİN HORIZONTAL SCROLL & EMPTY STATE */}
                <View style={{ marginTop: 24 }}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>❤️ Favorilerin</Text>
                    {favorites.length > 0 && (
                      <TouchableOpacity onPress={() => setActiveTab('menu')}>
                        <Text style={styles.seeAllText}>Tümü ➔</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {favorites.length > 0 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16 }}>
                      {menuItems
                        .filter(item => favorites.includes(item.id))
                        .map(favItem => (
                          <TouchableOpacity
                            key={favItem.id}
                            style={styles.favHomeCard}
                            onPress={() => handleOpenCustomize(favItem)}
                          >
                            <Image source={{ uri: favItem.imageUrl }} style={styles.favHomeImg} />
                            <Text style={styles.favHomeTitle} numberOfLines={1}>{favItem.name}</Text>
                            <Text style={styles.favHomePrice}>{favItem.price} TL</Text>
                            <View style={styles.favHomeAddBtn}>
                              <Text style={styles.favHomeAddBtnText}>+ Ekle</Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                    </ScrollView>
                  ) : (
                    <View style={styles.emptyStateCard}>
                      <Text style={{ fontSize: 32 }}>❤️</Text>
                      <Text style={styles.emptyStateTitle}>Henüz favori ürünün yok</Text>
                      <Text style={styles.emptyStateSub}>Favori ürünlerini eklediğinde burada hızlı erişim için görebilirsin.</Text>
                      <TouchableOpacity style={styles.secondaryBtn} onPress={() => setActiveTab('menu')}>
                        <Text style={styles.secondaryBtnText}>Menüyü Keşfet ➔</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* SECTION 25 & 26: 10. GÖLBOX GENÇ & GAMIFICATION GÖREVLER */}
                <View style={{ marginTop: 24 }}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>🏆 Haftalık GölGörev & Genç Fırsatlar</Text>
                  </View>

                  <View style={styles.taskCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.taskBadge}>🎯 HAFTALIK GÖREV</Text>
                      <Text style={styles.taskReward}>+150 GP</Text>
                    </View>
                    <Text style={styles.taskTitle}>Bu Hafta 3 Kahve Al</Text>
                    <Text style={styles.taskSub}>GölBOX Kitap Kafelerden 3 adet kahve siparişi ver, 150 GölPuan kazan.</Text>
                    <View style={{ marginTop: 8 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 10, color: '#64748b' }}>İlerleme: 2 / 3 tamamlandı</Text>
                        <Text style={{ fontSize: 10, color: '#16a34a', fontWeight: 'bold' }}>%66</Text>
                      </View>
                      <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: '66%' }]} />
                      </View>
                    </View>
                  </View>
                </View>

                {/* SECTION 12: SEÇİLİ ŞUBE KARTI */}
                <View style={{ marginTop: 24, marginBottom: 24 }}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>📍 Teslim Alınacak GölBOX Şubesi</Text>
                    <TouchableOpacity onPress={() => setShowBranchModal(true)}>
                      <Text style={styles.seeAllText}>Değiştir ➔</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.cafeCard}>
                    <Image source={{ uri: selectedBranch.imageUrl }} style={styles.cafeCardImg} />
                    <View style={styles.cafeCardBody}>
                      <Text style={styles.cafeCardTitle}>{selectedBranch.name}</Text>
                      <Text style={styles.cafeCardAddr}>📍 {selectedBranch.address}</Text>
                      <View style={styles.cafeInfoBadgeRow}>
                        <View style={styles.statusPill}><Text style={styles.statusPillText}>Açık · {selectedBranch.workingHours}</Text></View>
                        <View style={styles.gelAlPill}><Text style={styles.gelAlPillText}>✓ Gel-Al Aktif</Text></View>
                      </View>
                    </View>
                  </View>
                </View>
              </ScrollView>
            )}

            {/* ---------------- MENÜ TAB ---------------- */}
            {activeTab === 'menu' && (
              <View style={styles.container}>
                <View style={styles.menuHeaderContainer}>
                  <Text style={styles.screenHeaderTitle}>GölBOX Dijital Menü</Text>
                  <Text style={styles.screenHeaderSub}>Lezzetinizi seçin, kişiselleştirin ve Gel-Al ile anında alın.</Text>

                  <View style={styles.searchInputRow}>
                    <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Kahve, tatlı veya atıştırmalık ara..."
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Text style={{ fontSize: 16, color: '#94a3b8' }}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
                    <TouchableOpacity
                      style={[styles.categoryChip, selectedCategory === 'all' && styles.categoryChipActive]}
                      onPress={() => setSelectedCategory('all')}
                    >
                      <Text style={[styles.categoryChipText, selectedCategory === 'all' && styles.categoryChipTextActive]}>Tümü</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.categoryChip, selectedCategory === 'c-hot' && styles.categoryChipActive]}
                      onPress={() => setSelectedCategory('c-hot')}
                    >
                      <Text style={[styles.categoryChipText, selectedCategory === 'c-hot' && styles.categoryChipTextActive]}>☕ Sıcak Kahveler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.categoryChip, selectedCategory === 'c-cold' && styles.categoryChipActive]}
                      onPress={() => setSelectedCategory('c-cold')}
                    >
                      <Text style={[styles.categoryChipText, selectedCategory === 'c-cold' && styles.categoryChipTextActive]}>🧊 Soğuk Kahveler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.categoryChip, selectedCategory === 'c-dessert' && styles.categoryChipActive]}
                      onPress={() => setSelectedCategory('c-dessert')}
                    >
                      <Text style={[styles.categoryChipText, selectedCategory === 'c-dessert' && styles.categoryChipTextActive]}>🍰 Tatlılar</Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>

                <FlatList
                  data={menuItems.filter(item => {
                    const matchCategory = selectedCategory === 'all' || item.categoryId === selectedCategory;
                    const matchQuery = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.description.toLowerCase().includes(searchQuery.toLowerCase());
                    return matchCategory && matchQuery;
                  })}
                  keyExtractor={item => item.id}
                  contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                  renderItem={({ item }) => (
                    <View style={styles.productCard}>
                      <Image source={{ uri: item.imageUrl }} style={styles.productCardImg} />
                      <View style={styles.productCardBody}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={styles.productCardTitle}>{item.name}</Text>
                          <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
                            <Text style={{ fontSize: 16 }}>{favorites.includes(item.id) ? '❤️' : '🤍'}</Text>
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.productCardDesc} numberOfLines={2}>{item.description}</Text>
                        <View style={styles.productCardFooter}>
                          <View>
                            <Text style={styles.productCardPrice}>{item.price} TL</Text>
                            {item.calories && <Text style={styles.productCardCal}>{item.calories} kcal</Text>}
                          </View>
                          <TouchableOpacity style={styles.customizeBtn} onPress={() => handleOpenCustomize(item)}>
                            <Text style={styles.customizeBtnText}>+ Kişiselleştir</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  )}
                />

                {/* FLOATING CART BAR */}
                {cart.length > 0 && (
                  <View style={styles.floatingCartBar}>
                    <View>
                      <Text style={styles.floatingCartCount}>{cart.reduce((a, b) => a + b.quantity, 0)} Ürün</Text>
                      <Text style={styles.floatingCartTotal}>{cart.reduce((a, b) => a + b.totalPrice, 0)} TL</Text>
                    </View>
                    <TouchableOpacity style={styles.floatingCartBtn} onPress={() => setShowCartModal(true)}>
                      <Text style={styles.floatingCartBtnText}>Sepeti Göre ➔</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* ---------------- SECTION 16: QR TAB ---------------- */}
            {activeTab === 'qr' && (
              <ScrollView style={styles.container} contentContainerStyle={{ padding: 24, alignItems: 'center' }}>
                <Text style={styles.screenHeaderTitle}>Kasada QR Okut</Text>
                <Text style={[styles.screenHeaderSub, { textAlign: 'center', marginBottom: 20 }]}>
                  GölBOX kasalarında bu QR kodunu göstererek siparişlerinize anında GölPuan yükletin.
                </Text>

                <View style={styles.qrCardContainer}>
                  <View style={styles.qrHeaderRow}>
                    <Text style={styles.qrCardTitle}>MÜŞTERİ SADAKAT QR KODU</Text>
                  </View>

                  <View style={styles.qrImageWrapper}>
                    <Image
                      source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=GOLBOX-${user?.id || 'GUEST'}` }}
                      style={{ width: 180, height: 180 }}
                    />
                  </View>

                  <Text style={styles.qrTokenText}>KOD: {user ? user.referralCode : 'GB-GUEST'}</Text>
                  <Text style={styles.qrTimerNotice}>QR kod her 60 saniyede bir otomatik yenilenir 🔄</Text>

                  <TouchableOpacity style={styles.simulateScanBtn} onPress={simulateQRScan}>
                    <Text style={styles.simulateScanBtnText}>⚡ Kasada Okutulmuş Gibi Simüle Et (+25 GP)</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}

            {/* ---------------- SECTION 14 & 15: GÖLPUAN TAB ---------------- */}
            {activeTab === 'golpuan' && (
              <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.screenHeaderTitle}>GölPuan & Ödül Kataloğu</Text>
                <Text style={styles.screenHeaderSub}>Kazandığınız GölPuanlar ile ücretsiz kahve ve ikramları teslim alın.</Text>

                <View style={styles.userCard}>
                  <Text style={styles.gpLabel}>MEVCUT BAKİYE</Text>
                  <Text style={[styles.gpValue, { fontSize: 36 }]}>{user ? user.pointsBalance : 0} GP</Text>
                  <Text style={{ fontSize: 11, color: '#e2e8f0', marginTop: 4 }}>10 GölPuan = 1.00 TL değerindedir.</Text>
                </View>

                <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>🎁 Alınabilir Ödüller</Text>
                {rewards.map(rew => (
                  <View key={rew.id} style={styles.rewardCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rewardCategoryTag}>{rew.category}</Text>
                      <Text style={styles.rewardTitle}>{rew.title}</Text>
                      <Text style={styles.rewardDesc}>{rew.description}</Text>
                      <View style={styles.gpBadge}>
                        <Text style={styles.gpBadgeText}>{rew.requiredPoints} GP</Text>
                      </View>
                    </View>

                    <TouchableOpacity style={styles.claimBtn} onPress={() => claimReward(rew.id)}>
                      <Text style={styles.claimBtnText}>Al ➔</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>📜 Puan Geçmişi</Text>
                {pointHistory.map(history => (
                  <View key={history.id} style={styles.historyRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyTitle}>{history.title}</Text>
                      <Text style={styles.historySub}>{history.description}</Text>
                      <Text style={styles.historyDate}>{history.date}</Text>
                    </View>
                    <Text style={[styles.historyAmount, history.type === 'Earn' ? styles.earnAmount : styles.spendAmount]}>
                      {history.type === 'Earn' ? `+${history.amount}` : `${history.amount}`} GP
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )}

            {/* ---------------- PROFİL TAB ---------------- */}
            {activeTab === 'profile' && (
              <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                <View style={{ alignItems: 'center', marginVertical: 20 }}>
                  <View style={styles.profileAvatarLarge}>
                    <Text style={{ fontSize: 36, color: '#fff', fontWeight: 'bold' }}>
                      {user ? user.firstName.charAt(0) : '🏛️'}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 20, fontWeight: '800', color: '#0f172a', marginTop: 12 }}>
                    {user ? `${user.firstName} ${user.lastName}` : 'Misafir Müşteri'}
                  </Text>
                  <Text style={{ fontSize: 13, color: '#64748b' }}>{user?.email || 'Giriş yapılmadı'}</Text>

                  {user && (
                    <TouchableOpacity style={styles.studentCardContainer} onPress={toggleStudentStatus}>
                      <Text style={{ fontSize: 24, marginRight: 10 }}>🎓</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.studentCardTitle}>GölBOX Sadakat Modu</Text>
                        <Text style={styles.studentCardSub}>
                          {user.isStudent ? '✓ Öğrenci statüsü aktif (%30 indirim)' : 'Öğrenci kimliğini doğrula ve indirimi kap!'}
                        </Text>
                      </View>
                      <Switch value={user.isStudent} onValueChange={toggleStudentStatus} />
                    </TouchableOpacity>
                  )}
                </View>

                {user && (
                  <View style={styles.referralBox}>
                    <Text style={styles.referralTitle}>👥 Arkadaşını Davet Et</Text>
                    <Text style={styles.referralSub}>Davet kodunla kaydolan arkadaşının ilk siparişinde 100 GP kazan.</Text>
                    <View style={styles.referralCodeRow}>
                      <Text style={styles.referralCodeText}>{user.referralCode}</Text>
                      <TouchableOpacity style={styles.copyBtn} onPress={() => Alert.alert('Kopyalandı', 'Davet kodu kopyalandı!')}>
                        <Text style={styles.copyBtnText}>Kopyala</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>🛍️ Sipariş Geçmişi</Text>
                {orders.map(ord => (
                  <View key={ord.id} style={styles.orderHistoryCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={styles.orderHistoryNum}>Sipariş #{ord.orderNumber}</Text>
                      <View style={styles.orderStatusPill}>
                        <Text style={styles.orderStatusPillText}>{ord.status}</Text>
                      </View>
                    </View>
                    <Text style={styles.orderHistoryCafe}>{ord.cafeName}</Text>
                    <Text style={styles.orderHistoryDate}>{new Date(ord.createdAt).toLocaleString('tr-TR')}</Text>
                  </View>
                ))}

                {user ? (
                  <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                    <Text style={styles.logoutBtnText}>Oturumu Kapat 🚪</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.primaryBtn} onPress={() => setAppStage('auth_gate')}>
                    <Text style={styles.primaryBtnText}>Giriş Yap / Kayıt Ol ➔</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </>
        )}
      </View>

      {/* SECTION 33: ALT NAVİGASYON (5 PRD TABS) */}
      {userRole === 'Customer' && (
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('home')}
          >
            <Text style={[styles.navIcon, activeTab === 'home' && styles.navIconActive]}>🏠</Text>
            <Text style={[styles.navText, activeTab === 'home' && styles.navTextActive]}>Ana Sayfa</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('menu')}
          >
            <Text style={[styles.navIcon, activeTab === 'menu' && styles.navIconActive]}>☕</Text>
            <Text style={[styles.navText, activeTab === 'menu' && styles.navTextActive]}>Menü</Text>
          </TouchableOpacity>

          {/* CENTRAL DYNAMIC QR BUTTON */}
          <TouchableOpacity
            style={styles.centerQrNavItem}
            onPress={() => setActiveTab('qr')}
          >
            <View style={styles.centerQrCircle}>
              <Text style={{ fontSize: 24 }}>📱</Text>
            </View>
            <Text style={[styles.navText, activeTab === 'qr' && styles.navTextActive]}>QR Okut</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('golpuan')}
          >
            <Text style={[styles.navIcon, activeTab === 'golpuan' && styles.navIconActive]}>⭐</Text>
            <Text style={[styles.navText, activeTab === 'golpuan' && styles.navTextActive]}>GölPuan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('profile')}
          >
            <Text style={[styles.navIcon, activeTab === 'profile' && styles.navIconActive]}>👤</Text>
            <Text style={[styles.navText, activeTab === 'profile' && styles.navTextActive]}>Profil</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* NOTIFICATIONS SHEET MODAL */}
      <Modal visible={showNotificationsSheet} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🔔 Bildirim Merkezi</Text>
              <TouchableOpacity onPress={() => setShowNotificationsSheet(false)}>
                <Text style={{ fontSize: 20, color: '#94a3b8' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView>
              {notifications.map(notif => (
                <TouchableOpacity
                  key={notif.id}
                  style={[styles.notifItemRow, !notif.read && styles.notifItemUnread]}
                  onPress={() => markNotificationAsRead(notif.id)}
                >
                  <Text style={{ fontSize: 24, marginRight: 12 }}>
                    {notif.type === 'order' ? '☕' : notif.type === 'campaign' ? '🎉' : '⭐'}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.notifItemTitle}>{notif.title}</Text>
                    <Text style={styles.notifItemBody}>{notif.body}</Text>
                    <Text style={styles.notifItemTime}>{notif.time}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* LEGAL DOCUMENT VIEW MODAL */}
      <Modal visible={showLegalModal !== null} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {showLegalModal === 'kvkk' ? '📄 KVKK Aydınlatma Metni' : '📄 Kullanıcı Sözleşmesi'}
              </Text>
              <TouchableOpacity onPress={() => setShowLegalModal(null)}>
                <Text style={{ fontSize: 20, color: '#94a3b8' }}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ marginVertical: 12 }}>
              <Text style={{ fontSize: 13, color: '#475569', lineHeight: 20 }}>
                {showLegalModal === 'kvkk'
                  ? 'Gaziantep Şehitkamil Belediyesi GölBOX mobil uygulaması kapsamında kişisel verileriniz 6698 sayılı KVKK maddelerine uygun olarak işlenmektedir. Telefon numaranız, e-posta adresiniz ve sipariş geçmişiniz sadakat puanı hesaplama ve sipariş teslim süreçlerinde kullanılmaktadır.'
                  : 'GölBOX mobil uygulaması üzerinden oluşturulan Gel-Al siparişleri seçilen şubede 15 dakika içerisinde taze hazırlanmaktadır. İptal ve iade koşulları ürün hazırlanmaya başlamadan önce geçerlidir.'}
              </Text>
            </ScrollView>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setShowLegalModal(null)}>
              <Text style={styles.primaryBtnText}>Okudum, Anladım</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* CUSTOMIZE MODAL */}
      {customizingItem && (
        <Modal visible animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{customizingItem.name}</Text>
                <TouchableOpacity onPress={() => setCustomizingItem(null)}>
                  <Text style={{ fontSize: 20, color: '#94a3b8' }}>✕</Text>
                </TouchableOpacity>
              </View>

              {customizingItem.sizeOptions && (
                <View style={{ marginBottom: 12 }}>
                  <Text style={styles.optionSectionTitle}>Boyut Seçin</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {customizingItem.sizeOptions.map(sz => (
                      <TouchableOpacity
                        key={sz.id}
                        style={[styles.optionChip, selectedSize?.id === sz.id && styles.optionChipActive]}
                        onPress={() => setSelectedSize(sz)}
                      >
                        <Text style={[styles.optionChipText, selectedSize?.id === sz.id && styles.optionChipTextActive]}>
                          {sz.name} {sz.priceDelta > 0 ? `(+${sz.priceDelta}TL)` : ''}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {customizingItem.milkOptions && (
                <View style={{ marginBottom: 12 }}>
                  <Text style={styles.optionSectionTitle}>Süt Tercihi</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {customizingItem.milkOptions.map(ml => (
                      <TouchableOpacity
                        key={ml.id}
                        style={[styles.optionChip, selectedMilk?.id === ml.id && styles.optionChipActive]}
                        onPress={() => setSelectedMilk(ml)}
                      >
                        <Text style={[styles.optionChipText, selectedMilk?.id === ml.id && styles.optionChipTextActive]}>
                          {ml.name} {ml.priceDelta > 0 ? `(+${ml.priceDelta}TL)` : ''}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.quantityRow}>
                <Text style={styles.optionSectionTitle}>Adet</Text>
                <View style={styles.quantityControl}>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(Math.max(1, quantity - 1))}>
                    <Text style={styles.qtyBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{quantity}</Text>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(quantity + 1)}>
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.primaryBtn} onPress={handleAddCustomizedToCart}>
                <Text style={styles.primaryBtnText}>Sepete Ekle 🛒</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* CART MODAL */}
      <Modal visible={showCartModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🛍️ Gel-Al Sepetiniz</Text>
              <TouchableOpacity onPress={() => setShowCartModal(false)}>
                <Text style={{ fontSize: 20, color: '#94a3b8' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView>
              <View style={styles.cartBranchCard}>
                <Text style={{ fontSize: 11, color: '#64748b', fontWeight: 'bold' }}>TESLİM ALINACAK ŞUBE</Text>
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#1d5f60' }}>📍 {selectedBranch.name}</Text>
              </View>

              {cart.map(item => (
                <View key={item.cartItemId} style={styles.cartItemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#0f172a' }}>
                      {item.quantity}x {item.menuItem.name}
                    </Text>
                    <Text style={{ fontSize: 11, color: '#64748b' }}>
                      {item.customization.size?.name} {item.customization.milk ? `· ${item.customization.milk.name}` : ''}
                    </Text>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#1d5f60', marginTop: 4 }}>
                      {item.totalPrice} TL
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => removeFromCart(item.cartItemId)}>
                    <Text style={{ fontSize: 18, color: '#ef4444' }}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              ))}

              <View style={{ marginTop: 16 }}>
                <Text style={styles.inputLabel}>Promosyon Kodu</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    style={[styles.textInput, { flex: 1 }]}
                    placeholder="PAZARTESI20"
                    value={couponCode}
                    onChangeText={setCouponCode}
                  />
                  <TouchableOpacity style={styles.applyCouponBtn} onPress={() => Alert.alert('Kupon Uygulandı', '%20 İndirim Sepete Yansıtıldı!')}>
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>Uygula</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.pointsToggleRow}>
                <View>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#0f172a' }}>GölPuan ile Öde ⭐</Text>
                  <Text style={{ fontSize: 11, color: '#64748b' }}>Mevcut Bakiyeniz: {user?.pointsBalance || 0} GP</Text>
                </View>
                <Switch value={usePointsPayment} onValueChange={setUsePointsPayment} />
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={async () => {
                const res = await createOrder(usePointsPayment, couponCode);
                if (res) setShowCartModal(false);
              }}
            >
              <Text style={styles.primaryBtnText}>Siparişi Onayla ve Gönder ➔</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ACTIVE ORDER TRACKER MODAL */}
      {activeTrackingOrder && (
        <Modal visible={showActiveOrderModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>☕ Canlı Sipariş Takibi</Text>
                <TouchableOpacity onPress={() => setShowActiveOrderModal(false)}>
                  <Text style={{ fontSize: 20, color: '#94a3b8' }}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.trackerCodeBox}>
                <Text style={{ fontSize: 11, color: '#64748b', fontWeight: 'bold' }}>KASA TESLİM KODU</Text>
                <Text style={styles.trackerCodeText}>{activeTrackingOrder.collectionCode}</Text>
              </View>

              <View style={styles.stepperContainer}>
                <View style={styles.stepperStep}>
                  <Text style={[styles.stepperIcon, styles.stepperActive]}>1</Text>
                  <Text style={styles.stepperText}>Alındı</Text>
                </View>
                <View style={styles.stepperStep}>
                  <Text style={[styles.stepperIcon, (activeTrackingOrder.status === 'Preparing' || activeTrackingOrder.status === 'Ready') && styles.stepperActive]}>2</Text>
                  <Text style={styles.stepperText}>Hazırlanıyor</Text>
                </View>
                <View style={styles.stepperStep}>
                  <Text style={[styles.stepperIcon, activeTrackingOrder.status === 'Ready' && styles.stepperActive]}>3</Text>
                  <Text style={styles.stepperText}>Hazır 🎉</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.cancelBtn} onPress={() => cancelOrder(activeTrackingOrder.id)}>
                <Text style={styles.cancelBtnText}>Siparişi İptal Et</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* BRANCH SELECTOR MODAL */}
      <Modal visible={showBranchModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📍 Şube Seçin</Text>
              <TouchableOpacity onPress={() => setShowBranchModal(false)}>
                <Text style={{ fontSize: 20, color: '#94a3b8' }}>✕</Text>
              </TouchableOpacity>
            </View>

            {cafes.map(cafe => (
              <TouchableOpacity
                key={cafe.id}
                style={[styles.branchSelectCard, selectedBranch.id === cafe.id && styles.branchSelectCardActive]}
                onPress={() => {
                  setSelectedBranch(cafe);
                  setShowBranchModal(false);
                }}
              >
                <Text style={styles.branchSelectTitle}>{cafe.name}</Text>
                <Text style={styles.branchSelectAddr}>{cafe.address}</Text>
                <Text style={styles.branchSelectHours}>Açık · {cafe.workingHours}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// --- SUB-SCREENS FOR ROLES ---

function BranchOperationsScreen() {
  const { orders, updateOrderStatus } = useGolbox();
  const pendingOrders = orders.filter(o => o.status === 'Pending' || o.status === 'Preparing');

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.screenHeaderTitle}>🏢 Barista & Şube Operasyon Ekranı</Text>
      <Text style={styles.screenHeaderSub}>Gelen Gel-Al siparişlerini görüntüleyin ve hazırlama durumunu güncelleyin.</Text>

      <Text style={styles.branchColTitle}>☕ Hazırlanacak Siparişler ({pendingOrders.length})</Text>
      {pendingOrders.map(ord => (
        <View key={ord.id} style={styles.branchOrderCard}>
          <View style={styles.branchOrderHeader}>
            <Text style={styles.branchOrderCode}>Sipariş #{ord.orderNumber} ({ord.collectionCode})</Text>
            <Text style={styles.branchOrderTime}>{ord.status}</Text>
          </View>
          <Text style={{ fontSize: 13, color: '#0f172a', fontWeight: 'bold', marginVertical: 4 }}>
            Müşteri: {ord.userFullName} ({ord.userPhone})
          </Text>

          {ord.items.map(item => (
            <Text key={item.cartItemId} style={{ fontSize: 12, color: '#475569' }}>
              • {item.quantity}x {item.menuItem.name} ({item.customization.size?.name})
            </Text>
          ))}

          {ord.status === 'Pending' ? (
            <TouchableOpacity style={styles.branchActionBtn} onPress={() => updateOrderStatus(ord.id, 'Preparing')}>
              <Text style={styles.branchActionBtnText}>Hazırlamaya Başla ➔</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.branchActionBtn, { backgroundColor: '#16a34a' }]} onPress={() => updateOrderStatus(ord.id, 'Ready')}>
              <Text style={styles.branchActionBtnText}>Sipariş Hazır İşaretle 🎉</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

function AdminDashboardScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.screenHeaderTitle}>🏛️ GölBOX Yönetim Paneli</Text>
      <Text style={styles.screenHeaderSub}>Şehitkamil Belediyesi genel satış, puan ve şube performans istatistikleri.</Text>

      <View style={styles.adminMetricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>BUGÜNKÜ GEL-AL SİPARİŞ</Text>
          <Text style={styles.metricValue}>1,428</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>TOPLAM KAZANDIRILAN PUAN</Text>
          <Text style={styles.metricValue}>142,500 GP</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>AKTİF KULLANICI SAYISI</Text>
          <Text style={styles.metricValue}>28,410</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>GÖLBOX SADAKAT ÜYELERİ</Text>
          <Text style={styles.metricValue}>12,850</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>📍 Şube Performansları</Text>
      {defaultCafes.map(cafe => (
        <View key={cafe.id} style={styles.adminBranchRow}>
          <View>
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#0f172a' }}>{cafe.name}</Text>
            <Text style={{ fontSize: 11, color: '#64748b' }}>Çalışma Saatleri: {cafe.workingHours}</Text>
          </View>
          <Text style={{ fontSize: 14, fontWeight: '800', color: '#1d5f60' }}>342 Sipariş/Gün</Text>
        </View>
      ))}
    </ScrollView>
  );
}

// --- STYLESHEET ---

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { padding: 16, paddingBottom: 100 },

  // SPLASH & NOTICE STYLES
  splashContainer: { flex: 1, backgroundColor: '#022c22', justifyContent: 'center', alignItems: 'center' },
  splashContent: { alignItems: 'center', paddingHorizontal: 32 },
  splashLogoCircle: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#064e3b', borderWidth: 2, borderColor: '#10b981', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  splashBrandTitle: { fontSize: 36, fontWeight: '900', color: '#ffffff', letterSpacing: 2 },
  splashBrandSub: { fontSize: 12, fontWeight: '800', color: '#34d399', letterSpacing: 3, marginTop: 4 },
  splashTagline: { fontSize: 13, color: '#a7f3d0', textAlign: 'center', marginTop: 16, lineHeight: 18 },
  splashLoadingText: { fontSize: 12, color: '#6ee7b7', marginTop: 12, fontWeight: '600' },

  fullScreenNoticeBg: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', padding: 24 },
  noticeCard: { backgroundColor: '#ffffff', borderRadius: 24, padding: 24, width: '100%', alignItems: 'center' },
  noticeTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginTop: 16, textAlign: 'center' },
  noticeMessage: { fontSize: 13, color: '#64748b', textAlign: 'center', marginTop: 8, lineHeight: 20 },

  // AUTH STYLES
  authGateContainer: { flex: 1, backgroundColor: '#064e3b' },
  authGateBadge: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#022c22', borderWidth: 2, borderColor: '#10b981', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  authGateTitle: { fontSize: 32, fontWeight: '900', color: '#ffffff' },
  authGateSub: { fontSize: 13, color: '#a7f3d0', textAlign: 'center', marginTop: 4 },
  authGateSlogan: { fontSize: 15, color: '#fbbf24', fontStyle: 'italic', marginTop: 20, textAlign: 'center' },
  authPrimaryBtn: { backgroundColor: '#10b981', borderRadius: 16, paddingVertical: 16, alignItems: 'center', width: '100%', marginBottom: 12 },
  authPrimaryBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
  authSecondaryBtn: { backgroundColor: '#ffffff', borderRadius: 16, paddingVertical: 16, alignItems: 'center', width: '100%' },
  authSecondaryBtnText: { color: '#064e3b', fontSize: 15, fontWeight: '800' },
  guestLinkText: { fontSize: 13, color: '#a7f3d0', textDecorationLine: 'underline', fontWeight: '600' },

  authFormContainer: { flex: 1, backgroundColor: '#ffffff' },
  backBtnRow: { marginBottom: 20 },
  formTitle: { fontSize: 28, fontWeight: '900', color: '#0f172a' },
  formSub: { fontSize: 13, color: '#64748b', marginTop: 4, marginBottom: 20 },
  errorBanner: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fca5a5', borderRadius: 12, padding: 12, marginBottom: 16 },
  errorBannerText: { fontSize: 12, color: '#b91c1c', fontWeight: '700' },
  eyeBtn: { position: 'absolute', right: 12 },
  linkText: { fontSize: 12, fontWeight: '800', color: '#1d5f60' },

  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 2, borderColor: '#cbd5e1', marginRight: 10, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  checkboxActive: { backgroundColor: '#1d5f60', borderColor: '#1d5f60' },
  checkboxText: { flex: 1, fontSize: 12, color: '#475569', lineHeight: 18 },

  otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 20 },
  otpBox: { width: 44, height: 54, borderWidth: 2, borderColor: '#cbd5e1', borderRadius: 12, textAlign: 'center', fontSize: 24, fontWeight: '800', color: '#0f172a' },
  otpTimerText: { fontSize: 12, color: '#64748b', fontWeight: '600' },

  toastBanner: { backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#a7f3d0', padding: 12, marginHorizontal: 16, marginTop: 8, borderRadius: 12 },
  toastBannerText: { fontSize: 12, color: '#047857', fontWeight: '800', textAlign: 'center' },

  // HEADER & TOP BAR STYLES
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  branchPicker: { flexDirection: 'row', alignItems: 'center' },
  branchPickerPin: { fontSize: 20, marginRight: 8 },
  branchPickerLabel: { fontSize: 9, fontWeight: '800', color: '#64748b' },
  branchPickerValue: { fontSize: 13, fontWeight: '800', color: '#1d5f60' },
  notifIconBtn: { position: 'relative', padding: 6, backgroundColor: '#f1f5f9', borderRadius: 10 },
  notifBadge: { position: 'absolute', top: 2, right: 2, backgroundColor: '#ef4444', borderRadius: 8, width: 16, height: 16, justifyContent: 'center', alignItems: 'center' },
  notifBadgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },

  roleSwitchRow: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 10, padding: 2 },
  roleChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  roleChipActive: { backgroundColor: '#1d5f60' },
  roleChipText: { fontSize: 10, fontWeight: '700', color: '#64748b' },
  roleChipTextActive: { color: '#ffffff' },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  subTitleText: { fontSize: 11, fontWeight: '800', color: '#1d5f60', letterSpacing: 1 },
  mainTitleText: { fontSize: 24, fontWeight: '900', color: '#0f172a', marginTop: 2 },
  studentBadgePill: { backgroundColor: '#e0e7ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  studentBadgePillText: { fontSize: 10, fontWeight: '800', color: '#3730a3' },

  // HOME SCREEN COMPONENTS (SECTIONS 8 - 35)
  activeOrderBannerHighPriority: { backgroundColor: '#ecfdf5', borderWidth: 2, borderColor: '#10b981', borderRadius: 20, padding: 16, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activeOrderPillHeader: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 4 },
  activeOrderBannerLeft: { flex: 1 },
  activeOrderBannerBadge: { fontSize: 10, fontWeight: '800', color: '#047857' },
  activeOrderBannerStatus: { fontSize: 16, fontWeight: '900', color: '#064e3b', marginTop: 2 },
  activeOrderBannerSub: { fontSize: 11, color: '#047857', marginTop: 2 },
  activeOrderBannerRight: { marginLeft: 12 },
  activeOrderBannerBtn: { backgroundColor: '#10b981', color: '#fff', fontSize: 11, fontWeight: '800', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },

  primaryGelAlBtn: { backgroundColor: '#1d5f60', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginBottom: 16, elevation: 4 },
  primaryGelAlBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '900' },

  userCard: { backgroundColor: '#1d5f60', borderRadius: 20, padding: 16, marginBottom: 16 },
  userCardHeader: { flexDirection: 'row', alignItems: 'center' },
  userAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  userAvatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  userWelcomeSub: { fontSize: 10, color: '#93c5fd', fontWeight: '600' },
  userWelcomeName: { fontSize: 16, fontWeight: '800', color: '#fff' },
  gpLabel: { fontSize: 9, fontWeight: '800', color: '#fef3c7' },
  gpValue: { fontSize: 24, fontWeight: '900', color: '#fbbf24' },

  progressContainer: { marginTop: 14 },
  progressText: { fontSize: 11, color: '#e0f2fe', fontWeight: '600', marginBottom: 6 },
  progressBarBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#fbbf24', borderRadius: 4 },
  viewRewardsBtn: { alignSelf: 'flex-end', marginTop: 10, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  viewRewardsBtnText: { color: '#fff', fontSize: 11, fontWeight: '800' },

  qrQuickAccessStrip: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  qrQuickAccessTitle: { fontSize: 13, fontWeight: '800', color: '#0f172a' },
  qrQuickAccessSub: { fontSize: 11, color: '#64748b', marginTop: 2 },
  qrQuickAccessArrow: { fontSize: 18, color: '#1d5f60', fontWeight: 'bold' },

  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  seeAllText: { fontSize: 12, fontWeight: '800', color: '#1d5f60' },

  campaignCard: { width: 260, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', marginRight: 12, overflow: 'hidden' },
  campaignImg: { width: '100%', height: 120 },
  campaignBody: { padding: 12 },
  campaignBadge: { alignSelf: 'flex-start', backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, fontSize: 10, fontWeight: '800', color: '#b45309', marginBottom: 4 },
  campaignTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  campaignDesc: { fontSize: 11, color: '#64748b', marginTop: 2 },

  quickCatChip: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginRight: 8 },
  quickCatChipText: { fontSize: 12, fontWeight: '700', color: '#0f172a' },

  reorderCard: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', padding: 12, flexDirection: 'row', alignItems: 'center' },
  reorderImg: { width: 64, height: 64, borderRadius: 12 },
  reorderTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  reorderSub: { fontSize: 11, color: '#64748b', marginTop: 2 },
  reorderPrice: { fontSize: 13, fontWeight: '800', color: '#1d5f60', marginTop: 4 },
  reorderBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  reorderBtnText: { fontSize: 11, fontWeight: '800', color: '#1d5f60' },

  favHomeCard: { width: 140, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', padding: 10, marginRight: 12 },
  favHomeImg: { width: '100%', height: 90, borderRadius: 10 },
  favHomeTitle: { fontSize: 12, fontWeight: '800', color: '#0f172a', marginTop: 6 },
  favHomePrice: { fontSize: 12, fontWeight: '800', color: '#1d5f60', marginTop: 2 },
  favHomeAddBtn: { marginTop: 6, backgroundColor: '#1d5f60', borderRadius: 6, paddingVertical: 4, alignItems: 'center' },
  favHomeAddBtnText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  emptyStateCard: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', padding: 20, alignItems: 'center' },
  emptyStateTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a', marginTop: 8 },
  emptyStateSub: { fontSize: 11, color: '#64748b', textAlign: 'center', marginTop: 4, marginBottom: 12 },

  taskCard: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', padding: 14 },
  taskBadge: { fontSize: 10, fontWeight: '800', color: '#2563eb' },
  taskReward: { fontSize: 12, fontWeight: '900', color: '#b45309' },
  taskTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a', marginTop: 2 },
  taskSub: { fontSize: 11, color: '#64748b', marginTop: 2 },

  cafeCard: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  cafeCardImg: { width: '100%', height: 110 },
  cafeCardBody: { padding: 12 },
  cafeCardTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  cafeCardAddr: { fontSize: 11, color: '#64748b', marginTop: 2 },
  cafeInfoBadgeRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  statusPill: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusPillText: { fontSize: 10, fontWeight: '700', color: '#475569' },
  gelAlPill: { backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  gelAlPillText: { fontSize: 10, fontWeight: '800', color: '#15803d' },

  // NOTIFICATION ITEM
  notifItemRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  notifItemUnread: { backgroundColor: '#f0fdf4' },
  notifItemTitle: { fontSize: 13, fontWeight: '800', color: '#0f172a' },
  notifItemBody: { fontSize: 11, color: '#64748b', marginTop: 2 },
  notifItemTime: { fontSize: 10, color: '#94a3b8', marginTop: 4 },

  // MENU STYLES
  menuHeaderContainer: { backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  screenHeaderTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  screenHeaderSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  searchInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginTop: 12 },
  searchInput: { flex: 1, fontSize: 13, color: '#0f172a' },
  categoryChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#f1f5f9', marginRight: 8 },
  categoryChipActive: { backgroundColor: '#1d5f60' },
  categoryChipText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  categoryChipTextActive: { color: '#ffffff' },

  productCard: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', padding: 12, marginBottom: 12, flexDirection: 'row' },
  productCardImg: { width: 80, height: 80, borderRadius: 12 },
  productCardBody: { flex: 1, marginLeft: 12, justifyContent: 'space-between' },
  productCardTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  productCardDesc: { fontSize: 11, color: '#64748b', marginTop: 2 },
  productCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  productCardPrice: { fontSize: 15, fontWeight: '800', color: '#1d5f60' },
  productCardCal: { fontSize: 10, color: '#94a3b8' },
  customizeBtn: { backgroundColor: '#1d5f60', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  customizeBtnText: { color: '#fff', fontSize: 11, fontWeight: '800' },

  floatingCartBar: { position: 'absolute', bottom: 16, left: 16, right: 16, backgroundColor: '#0f172a', borderRadius: 20, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 8 },
  floatingCartCount: { fontSize: 11, color: '#94a3b8' },
  floatingCartTotal: { fontSize: 18, fontWeight: '800', color: '#fbbf24' },
  floatingCartBtn: { backgroundColor: '#1d5f60', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  floatingCartBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },

  // QR & REWARD STYLES
  qrCardContainer: { backgroundColor: '#fff', borderRadius: 24, borderWidth: 1, borderColor: '#e2e8f0', padding: 24, width: '100%', alignItems: 'center' },
  qrHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  qrCardTitle: { fontSize: 12, fontWeight: '800', color: '#64748b' },
  qrImageWrapper: { padding: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 16 },
  qrTokenText: { fontSize: 13, fontWeight: '800', color: '#1d5f60', marginTop: 12 },
  qrTimerNotice: { fontSize: 10, color: '#64748b', marginTop: 4 },
  simulateScanBtn: { backgroundColor: '#1d5f60', width: '100%', borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  simulateScanBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },

  rewardCard: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  rewardCategoryTag: { fontSize: 9, fontWeight: '800', color: '#0284c7' },
  rewardTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  rewardDesc: { fontSize: 11, color: '#64748b', marginTop: 2 },
  gpBadge: { alignSelf: 'flex-start', backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 6 },
  gpBadgeText: { fontSize: 11, fontWeight: '800', color: '#b45309' },
  claimBtn: { backgroundColor: '#1d5f60', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, marginLeft: 12 },
  claimBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },

  historyRow: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', padding: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  historyTitle: { fontSize: 13, fontWeight: '800', color: '#0f172a' },
  historySub: { fontSize: 11, color: '#64748b' },
  historyDate: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  historyAmount: { fontSize: 15, fontWeight: '800' },
  earnAmount: { color: '#16a34a' },
  spendAmount: { color: '#dc2626' },

  profileAvatarLarge: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#1d5f60', justifyContent: 'center', alignItems: 'center' },
  studentCardContainer: { backgroundColor: '#e0e7ff', borderColor: '#c7d2fe', borderWidth: 1, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  studentCardTitle: { fontSize: 13, fontWeight: '800', color: '#3730a3' },
  studentCardSub: { fontSize: 11, color: '#4338ca', marginTop: 2 },

  referralBox: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', padding: 14, marginTop: 12 },
  referralTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  referralSub: { fontSize: 11, color: '#64748b', marginTop: 2 },
  referralCodeRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 10, padding: 8, marginTop: 8 },
  referralCodeText: { flex: 1, fontSize: 16, fontWeight: '800', color: '#1d5f60', letterSpacing: 2 },
  copyBtn: { backgroundColor: '#1d5f60', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  copyBtnText: { color: '#fff', fontSize: 11, fontWeight: '800' },

  orderHistoryCard: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', padding: 14, marginBottom: 10 },
  orderHistoryNum: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  orderStatusPill: { backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  orderStatusPillText: { fontSize: 10, fontWeight: '800', color: '#15803d' },
  orderHistoryCafe: { fontSize: 12, color: '#64748b', marginTop: 2 },
  orderHistoryDate: { fontSize: 11, color: '#94a3b8', marginTop: 2 },

  logoutBtn: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fca5a5', paddingVertical: 14, borderRadius: 16, alignItems: 'center', marginTop: 24 },
  logoutBtnText: { color: '#b91c1c', fontSize: 14, fontWeight: '800' },

  inputLabel: { fontSize: 11, fontWeight: '700', color: '#475569', marginBottom: 4, marginTop: 8 },
  textInput: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: '#0f172a' },
  primaryBtn: { backgroundColor: '#1d5f60', borderRadius: 14, paddingVertical: 12, alignItems: 'center', marginTop: 14 },
  primaryBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  secondaryBtn: { backgroundColor: '#f1f5f9', borderRadius: 14, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  secondaryBtnText: { color: '#1d5f60', fontSize: 13, fontWeight: '800' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },

  optionSectionTitle: { fontSize: 13, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  optionChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#cbd5e1', marginRight: 8, marginBottom: 8 },
  optionChipActive: { backgroundColor: '#1d5f60', borderColor: '#1d5f60' },
  optionChipText: { fontSize: 12, color: '#475569', fontWeight: '700' },
  optionChipTextActive: { color: '#ffffff' },

  quantityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 16 },
  quantityControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 10, padding: 4 },
  qtyBtn: { width: 32, height: 32, backgroundColor: '#fff', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  qtyBtnText: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  qtyText: { marginHorizontal: 16, fontSize: 15, fontWeight: '800', color: '#0f172a' },

  cartBranchCard: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 10, marginBottom: 12 },
  cartItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  applyCouponBtn: { backgroundColor: '#1d5f60', borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center' },

  pointsToggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fef3c7', borderRadius: 12, padding: 12, marginTop: 12 },

  branchSelectCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, padding: 12, marginBottom: 8 },
  branchSelectCardActive: { borderColor: '#1d5f60', backgroundColor: '#f0fdf4' },
  branchSelectTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  branchSelectAddr: { fontSize: 11, color: '#64748b', marginTop: 2 },
  branchSelectHours: { fontSize: 10, color: '#16a34a', fontWeight: '700', marginTop: 4 },

  trackerCodeBox: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#86efac', borderRadius: 16, padding: 14, alignItems: 'center' },
  trackerCodeText: { fontSize: 24, fontWeight: '800', color: '#15803d', letterSpacing: 2, marginTop: 4 },

  stepperContainer: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 20 },
  stepperStep: { alignItems: 'center' },
  stepperIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', textAlign: 'center', lineHeight: 36, fontSize: 16 },
  stepperActive: { backgroundColor: '#1d5f60', color: '#fff' },
  stepperText: { fontSize: 11, fontWeight: '700', color: '#0f172a', marginTop: 4 },

  cancelBtn: { backgroundColor: '#fef2f2', borderRadius: 12, paddingVertical: 10, alignItems: 'center', marginTop: 12 },
  cancelBtnText: { color: '#dc2626', fontSize: 12, fontWeight: '800' },

  bottomNav: { flexDirection: 'row', backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingVertical: 6, paddingBottom: Platform.OS === 'ios' ? 24 : 6, alignItems: 'flex-end' },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navIcon: { fontSize: 18, opacity: 0.5 },
  navIconActive: { opacity: 1 },
  navText: { fontSize: 10, color: '#64748b', marginTop: 2, fontWeight: '600' },
  navTextActive: { color: '#1d5f60', fontWeight: '800' },

  centerQrNavItem: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: -16 },
  centerQrCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#1d5f60', justifyContent: 'center', alignItems: 'center', elevation: 6 },

  branchColTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  branchOrderCard: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', padding: 12, marginTop: 8 },
  branchOrderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  branchOrderCode: { fontSize: 14, fontWeight: '800', color: '#1d5f60' },
  branchOrderTime: { fontSize: 11, color: '#94a3b8' },
  branchActionBtn: { backgroundColor: '#1d5f60', borderRadius: 10, paddingVertical: 8, alignItems: 'center', marginTop: 8 },
  branchActionBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },

  adminMetricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  metricCard: { width: '48%', backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', padding: 14 },
  metricLabel: { fontSize: 9, fontWeight: '800', color: '#64748b' },
  metricValue: { fontSize: 20, fontWeight: '800', color: '#1d5f60', marginTop: 4 },

  adminBranchRow: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }
});
