import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
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
  ActivityIndicator,
  Alert,
  FlatList,
  Platform
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const API_BASE_URL = 'http://localhost:5155/api/v1';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  pointsBalance: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
}

export interface Cafe {
  id: string;
  name: string;
  address: string;
  menuItems: MenuItem[];
}

export interface Order {
  id: string;
  userFullName: string;
  cafeName: string;
  totalAmount: number;
  paidWithPoints: boolean;
  status: string;
  collectionCode: string;
  createdDate: string;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  requiredPoints: number;
  status: string;
}

interface GolboxContextType {
  token: string | null;
  user: UserProfile | null;
  cafes: Cafe[];
  orders: Order[];
  rewards: Reward[];
  loading: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  createOrder: (cafeId: string, menuItemId: string, quantity: number) => Promise<boolean>;
  claimReward: (rewardId: string) => Promise<boolean>;
}

const GolboxContext = createContext<GolboxContextType | null>(null);

function useGolbox() {
  const context = useContext(GolboxContext);
  if (!context) throw new Error('useGolbox, GolboxProvider içinde kullanılmalıdır');
  return context;
}

const defaultCafes: Cafe[] = [
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Gaziantep Şehitkamil Merkez Kitap Kafe',
    address: 'İncilipınar Mah. Muammer Aksoy Bulv. No:12, Şehitkamil / Gaziantep',
    menuItems: [
      { id: 'm-1', name: 'Sıcak Filtre Kahve', description: 'Taze demlenmiş espresso blend filtre kahve', price: 25 },
      { id: 'm-2', name: 'Türk Kahvesi & Lokum', description: 'Geleneksel közde pişirilmiş Türk kahvesi', price: 20 },
      { id: 'm-3', name: 'Soğuk Brew Latte', description: 'Özel demlenmiş soğuk sütlü kahve', price: 35 }
    ]
  },
  {
    id: '33333333-3333-3333-3333-444444444444',
    name: 'Şehitkamil Gençlik Kitap Kafe',
    address: 'Atatürk Mah. 15. Sok. No:4, Şehitkamil / Gaziantep',
    menuItems: [
      { id: 'm-4', name: 'Demli Çay & Simit', description: 'Taze fırın simidi ve sınırsız demli çay ikramı', price: 15 },
      { id: 'm-5', name: 'Bitki Çayı Çeşitleri', description: 'Ihlamur, adaçayı ve yeşil çay', price: 20 }
    ]
  }
];

const defaultRewards: Reward[] = [
  { id: 'rew-1', title: '☕ Ücretsiz Filtre Kahve', description: 'Şehitkamil Kitap Kafelerde geçerli sıcak taze filtre kahve ikramı.', requiredPoints: 50, status: 'Active' },
  { id: 'rew-2', title: '🍰 Günün Dilim Pastası', description: 'Kitap Kafe günlük taze dilim pasta veya cheesecake ikramı.', requiredPoints: 100, status: 'Active' },
  { id: 'rew-3', title: '🥐 Sıcak Kruvasan & Taze Çay', description: 'Taze fırınlanmış kruvasan ve sınırsız demli çay ikramı.', requiredPoints: 75, status: 'Active' },
  { id: 'rew-4', title: '📚 %50 Kitap Satın Alma İndirim Kuponu', description: 'Gençlik Merkezleri ve Kitap Kafe kütüphanelerinde %50 indirim.', requiredPoints: 120, status: 'Active' }
];

function GolboxProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [cafes, setCafes] = useState<Cafe[]>(defaultCafes);
  const [orders, setOrders] = useState<Order[]>([]);
  const [rewards, setRewards] = useState<Reward[]>(defaultRewards);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        if (data.success) {
          setToken(data.data.accessToken);
          setUser(data.data.user);
          setLoading(false);
          return true;
        }
      }

      if (email === 'admin@golbox.gov.tr') {
        setUser({ id: 'admin-1', email: 'admin@golbox.gov.tr', firstName: 'Mehmet', lastName: 'Yılmaz', pointsBalance: 145 });
        setToken('demo-token-123');
        setLoading(false);
        return true;
      }

      Alert.alert('Giriş Hatası', 'Geçersiz e-posta veya şifre.');
    } catch (e) {
      Alert.alert('Bağlantı Hatası', 'Sunucuya erişilemedi.');
    }
    setLoading(false);
    return false;
  };

  const logout = () => { setToken(null); setUser(null); Alert.alert('Bilgi', 'Oturumunuz kapatıldı.'); };

  const createOrder = async (cafeId: string, menuItemId: string, quantity: number) => {
    setLoading(true);
    const newOrderObj: Order = {
      id: 'ism-' + Date.now(),
      collectionCode: 'GB-' + Math.floor(1000 + Math.random() * 9000),
      userFullName: user ? `${user.firstName} ${user.lastName}` : 'Enes Çıkçık (Hayırsever Vatandaş)',
      cafeName: cafes.find(c => c.id === cafeId)?.name || 'Şehitkamil Kitap Kafe',
      totalAmount: 35 * quantity,
      paidWithPoints: false,
      status: 'Ready',
      createdDate: new Date().toISOString()
    };
    setOrders(prev => [newOrderObj, ...prev]);
    Alert.alert('🎉 Sipariş Alındı', `Ön siparişiniz hazır! Kasa Kodunuz: ${newOrderObj.collectionCode}`);
    setLoading(false);
    return true;
  };

  const claimReward = async (rewardId: string) => {
    Alert.alert('🎉 Harika!', 'İkram kuponunuz tanımlandı. Kasada QR kodunuzu göstererek alabilirsiniz.');
    return true;
  };

  return (
    <GolboxContext.Provider value={{ token, user, cafes, orders, rewards, loading, activeTab, setActiveTab, login, logout, createOrder, claimReward }}>
      {children}
    </GolboxContext.Provider>
  );
}

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
  const { activeTab, setActiveTab, user, cafes, orders, rewards, login, logout, createOrder, claimReward, loading } = useGolbox();
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleQuickLogin = async () => {
    setEmail('admin@golbox.gov.tr');
    setPassword('123456');
    const ok = await login('admin@golbox.gov.tr', '123456');
    if (ok) setActiveTab('home');
  };

  const nearestCafe = cafes[0];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={{ flex: 1 }}>
        {activeTab === 'home' && (
          <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.subTitleText}>Gaziantep Şehitkamil Belediyesi</Text>
                <Text style={styles.mainTitleText}>GölBox Mobil</Text>
              </View>
              <View style={styles.badgePill}><Text style={styles.badgePillText}>⚡ CANLI</Text></View>
            </View>

            <View style={styles.userCard}>
              <View style={styles.userCardHeader}>
                <View style={styles.userAvatar}><Text style={styles.userAvatarText}>{user ? user.firstName.charAt(0) : '🏛️'}</Text></View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.userWelcomeSub}>Gaziantep Şehitkamil</Text>
                  <Text style={styles.userWelcomeName}>{user ? `${user.firstName} ${user.lastName}` : 'Hoş Geldiniz'}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.gpLabel}>GÖL PUAN</Text>
                  <Text style={styles.gpValue}>{user ? user.pointsBalance : 0} GP</Text>
                </View>
              </View>

              <View style={styles.progressContainer}>
                <Text style={styles.progressText}>
                  <Text style={{ fontWeight: '800', color: '#fbbf24' }}>50 puan</Text> sonra ücretsiz Filtre Kahve seni bekliyor.
                </Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: user ? `${Math.min(100, (user.pointsBalance / 100) * 100)}%` : '25%' }]} />
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.bannerCard} onPress={() => setActiveTab('rewards')}>
              <Text style={styles.bannerBadge}>🎁 BUGÜN SANA ÖZEL</Text>
              <Text style={styles.bannerTitle}>GölPuan Katlama Fırsatı</Text>
              <Text style={styles.bannerDesc}>Tüm Kitap Kafelerde QR taratan vatandaşlara hediye puanlar.</Text>
            </TouchableOpacity>

            {nearestCafe && (
              <View style={{ marginTop: 20 }}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Sana En Yakın Şube</Text>
                  <TouchableOpacity onPress={() => setActiveTab('cafes')}><Text style={styles.seeAllText}>Tümü ➔</Text></TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.cafeCard} onPress={() => setSelectedCafe(nearestCafe)}>
                  <Image source={{ uri: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500&auto=format&fit=crop&q=60' }} style={styles.cafeCardImg} />
                  <View style={styles.cafeCardBody}>
                    <Text style={styles.cafeCardTitle}>{nearestCafe.name}</Text>
                    <Text style={styles.cafeCardAddr}>📍 {nearestCafe.address}</Text>
                    <View style={styles.statusPill}><Text style={styles.statusPillText}>Açık · 22:00'a kadar</Text></View>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity style={styles.primaryBtn} onPress={() => setActiveTab('qr')}>
              <Text style={styles.primaryBtnText}>📱 Kasada Göstermek İçin QR Aç</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {activeTab === 'cafes' && (
          <View style={styles.container}>
            <View style={styles.screenHeader}>
              <Text style={styles.screenHeaderTitle}>Gaziantep Şehitkamil Göl Kafeler</Text>
              <Text style={styles.screenHeaderSub}>Belediye gençlik ve kitap kafe tesisleri kapak görselleri.</Text>
            </View>
            <FlatList
              data={cafes}
              keyExtractor={item => item.id}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.cafeCard} onPress={() => setSelectedCafe(item)}>
                  <Image source={{ uri: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500&auto=format&fit=crop&q=60' }} style={styles.cafeCardImg} />
                  <View style={styles.cafeCardBody}>
                    <Text style={styles.cafeCardTitle}>{item.name}</Text>
                    <Text style={styles.cafeCardAddr}>📍 {item.address}</Text>
                    <Text style={styles.menuCountText}>☕ {item.menuItems ? item.menuItems.length : 3} Adet Ürün Menüde</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {activeTab === 'ismarliyor' && (
          <View style={styles.container}>
            <View style={styles.screenHeader}>
              <Text style={styles.screenHeaderTitle}>Ismarlıyor / Askıda İkram</Text>
              <Text style={styles.screenHeaderSub}>Seni bekleyen hayırsever ikramları ve ön siparişlerin.</Text>
            </View>
            {orders.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={{ fontSize: 36, marginBottom: 10 }}>☕</Text>
                <Text style={styles.emptyTitle}>Aktif Ön Siparişiniz Bulunmuyor</Text>
                <Text style={styles.emptySub}>Şu an bekleyen bir askıda ikramınız yok. Kitap Kafelerden sipariş verebilirsiniz.</Text>
              </View>
            ) : (
              <FlatList
                data={orders}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 16 }}
                renderItem={({ item }) => (
                  <View style={styles.orderCard}>
                    <View style={styles.orderHeaderRow}>
                      <View style={styles.readyTag}><Text style={styles.readyTagText}>✓ Hazır / Yayında</Text></View>
                      <Text style={styles.codeText}>{item.collectionCode}</Text>
                    </View>
                    <Text style={styles.orderUserText}>İkram Eden: {item.userFullName}</Text>
                    <Text style={styles.orderCafeText}>📍 {item.cafeName}</Text>
                    <Text style={styles.orderDateText}>📅 {new Date(item.createdDate).toLocaleDateString('tr-TR')}</Text>
                  </View>
                )}
              />
            )}
          </View>
        )}

        {activeTab === 'qr' && (
          <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
            <Text style={styles.screenHeaderTitle}>Vatandaş QR Kodu</Text>
            <Text style={[styles.screenHeaderSub, { textAlign: 'center', marginTop: 4, marginBottom: 24 }]}>
              Gaziantep Şehitkamil Kitap Kafelerde kasaya okutarak GölPuan kazanın.
            </Text>
            <View style={styles.qrContainer}>
              <Image source={{ uri: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=GOLBOX-USER-9999' }} style={{ width: 180, height: 180 }} />
              <Text style={styles.qrCodeSub}>{user ? `${user.firstName} ${user.lastName}` : 'Misafir Vatandaş'}</Text>
              <Text style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>GB-7842-SEHITKAMIL</Text>
            </View>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => Alert.alert('Puan Yüklendi', '🎉 +15 GölPuan hesabınıza eklendi!')}>
              <Text style={styles.primaryBtnText}>⚡ QR Taramasını Simüle Et (+15 GP)</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'rewards' && (
          <View style={styles.container}>
            <View style={styles.screenHeader}>
              <Text style={styles.screenHeaderTitle}>GölPuan İkram Kataloğu</Text>
              <Text style={styles.screenHeaderSub}>Biriktirdiğiniz GölPuan'lar ile ücretsiz ikramlarınızı seçin.</Text>
            </View>
            <View style={[styles.userCard, { margin: 16, marginBottom: 8 }]}>
              <Text style={{ fontSize: 12, color: '#94a3b8', fontWeight: '700' }}>MEVCUT BAKİYENİZ</Text>
              <Text style={{ fontSize: 32, fontWeight: '800', color: '#fff', marginTop: 4 }}>
                {user ? user.pointsBalance : 0} <Text style={{ fontSize: 16, fontWeight: '400' }}>GP</Text>
              </Text>
            </View>
            <FlatList
              data={rewards}
              keyExtractor={item => item.id}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => (
                <View style={styles.rewardCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rewardTitle}>{item.title}</Text>
                    <Text style={styles.rewardDesc}>{item.description}</Text>
                    <View style={styles.gpBadge}><Text style={styles.gpBadgeText}>{item.requiredPoints} GölPuan</Text></View>
                  </View>
                  <TouchableOpacity style={styles.claimBtn} onPress={() => claimReward(item.id)}>
                    <Text style={styles.claimBtnText}>Talep Et</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>
        )}

        {activeTab === 'profile' && (
          <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
            {user ? (
              <>
                <View style={{ alignItems: 'center', marginVertical: 20 }}>
                  <View style={styles.profileAvatarLarge}><Text style={{ fontSize: 32, color: '#fff', fontWeight: 'bold' }}>{user.firstName.charAt(0)}</Text></View>
                  <Text style={{ fontSize: 22, fontWeight: '800', color: '#0f172a', marginTop: 12 }}>{user.firstName} {user.lastName}</Text>
                  <Text style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{user.email}</Text>
                </View>
                <View style={styles.infoCard}>
                  <View style={styles.infoRow}><Text style={styles.infoLabel}>Vatandaşlık Bölgesi</Text><Text style={styles.infoValue}>Gaziantep Şehitkamil</Text></View>
                  <View style={styles.infoRow}><Text style={styles.infoLabel}>Mevcut GölPuan</Text><Text style={[styles.infoValue, { color: '#1d5f60', fontWeight: '800' }]}>{user.pointsBalance} GP</Text></View>
                </View>
                <TouchableOpacity style={styles.logoutBtn} onPress={logout}><Text style={styles.logoutBtnText}>🔓 Oturumu Kapat</Text></TouchableOpacity>
              </>
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Text style={{ fontSize: 40, marginBottom: 12 }}>🏛️</Text>
                <Text style={styles.screenHeaderTitle}>Oturum Açın</Text>
                <Text style={[styles.screenHeaderSub, { textAlign: 'center', marginVertical: 12 }]}>GölPuan kazanmak ve sipariş vermek için giriş yapın.</Text>
                <TouchableOpacity style={styles.primaryBtn} onPress={() => setActiveTab('login')}><Text style={styles.primaryBtnText}>Giriş Yap / Kayıt Ol</Text></TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )}

        {activeTab === 'login' && (
          <ScrollView style={styles.container} contentContainerStyle={{ padding: 24, justifyContent: 'center', flexGrow: 1 }}>
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              <Text style={{ fontSize: 44, marginBottom: 8 }}>🏛️</Text>
              <Text style={styles.screenHeaderTitle}>GölBox Gaziantep Şehitkamil</Text>
              <Text style={[styles.screenHeaderSub, { textAlign: 'center', marginTop: 4 }]}>Şehitkamil Belediyesi Akıllı Şehir & Sadakat Portalı</Text>
            </View>

            <TouchableOpacity style={styles.quickLoginBtn} onPress={handleQuickLogin}>
              <Text style={styles.quickLoginBtnText}>⚡ Hızlı Vatandaş Girişi (admin@golbox.gov.tr)</Text>
            </TouchableOpacity>

            <View style={{ marginVertical: 12 }}>
              <Text style={styles.inputLabel}>E-Posta Adresi</Text>
              <TextInput style={styles.textInput} placeholder="admin@golbox.gov.tr" value={email} onChangeText={setEmail} autoCapitalize="none" />
              <Text style={styles.inputLabel}>Şifre</Text>
              <TextInput style={styles.textInput} placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry />
              <TouchableOpacity style={styles.primaryBtn} onPress={() => login(email, password).then(ok => ok && setActiveTab('home'))} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Giriş Yap</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>

      {/* Şube Detay Modalı */}
      {selectedCafe && (
        <Modal animationType="slide" transparent visible={!!selectedCafe} onRequestClose={() => setSelectedCafe(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedCafe.name}</Text>
                <TouchableOpacity onPress={() => setSelectedCafe(null)}><Text style={{ fontSize: 20, color: '#64748b', fontWeight: 'bold' }}>✕</Text></TouchableOpacity>
              </View>
              <Text style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>📍 {selectedCafe.address}</Text>

              <Text style={{ fontSize: 14, fontWeight: '800', color: '#0f172a', marginBottom: 8 }}>Şube Menüsü & İkramlıklar</Text>

              <ScrollView style={{ maxHeight: 300 }}>
                {selectedCafe.menuItems.map(item => (
                  <View key={item.id} style={styles.modalItemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a' }}>{item.name}</Text>
                      <Text style={{ fontSize: 12, color: '#64748b' }}>{item.description}</Text>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: '#1d5f60', marginTop: 2 }}>{item.price} TL</Text>
                    </View>
                    <TouchableOpacity style={styles.orderSmallBtn} onPress={async () => {
                      await createOrder(selectedCafe.id, item.id, 1);
                      setSelectedCafe(null);
                    }}>
                      <Text style={styles.orderSmallBtnText}>+ Sipariş Et</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Alt Navigasyon Barı */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('home')}>
          <Text style={[styles.navIcon, activeTab === 'home' && styles.navIconActive]}>🏠</Text>
          <Text style={[styles.navText, activeTab === 'home' && styles.navTextActive]}>Ana Sayfa</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('cafes')}>
          <Text style={[styles.navIcon, activeTab === 'cafes' && styles.navIconActive]}>☕</Text>
          <Text style={[styles.navText, activeTab === 'cafes' && styles.navTextActive]}>Kafeler</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('ismarliyor')}>
          <Text style={[styles.navIcon, activeTab === 'ismarliyor' && styles.navIconActive]}>🤝</Text>
          <Text style={[styles.navText, activeTab === 'ismarliyor' && styles.navTextActive]}>Ismarlıyor</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('rewards')}>
          <Text style={[styles.navIcon, activeTab === 'rewards' && styles.navIconActive]}>🎁</Text>
          <Text style={[styles.navText, activeTab === 'rewards' && styles.navTextActive]}>Ödüller</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('profile')}>
          <Text style={[styles.navIcon, activeTab === 'profile' && styles.navIconActive]}>👤</Text>
          <Text style={[styles.navText, activeTab === 'profile' && styles.navTextActive]}>Profil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  subTitleText: { fontSize: 12, fontWeight: '700', color: '#64748b', textTransform: 'uppercase' },
  mainTitleText: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  badgePill: { backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  badgePillText: { fontSize: 11, fontWeight: '800', color: '#15803d' },
  userCard: { backgroundColor: '#1d5f60', borderRadius: 24, padding: 20, elevation: 6 },
  userCardHeader: { flexDirection: 'row', alignItems: 'center' },
  userAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  userAvatarText: { fontSize: 20, color: '#fff', fontWeight: 'bold' },
  userWelcomeSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  userWelcomeName: { fontSize: 16, fontWeight: '800', color: '#fff' },
  gpLabel: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.6)' },
  gpValue: { fontSize: 22, fontWeight: '800', color: '#fbbf24' },
  progressContainer: { marginTop: 16 },
  progressText: { fontSize: 12, color: 'rgba(255,255,255,0.9)' },
  progressBarBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 100, marginTop: 8, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#fbbf24', borderRadius: 100 },
  bannerCard: { backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderWidth: 1, borderRadius: 20, padding: 16, marginTop: 16 },
  bannerBadge: { fontSize: 10, fontWeight: '800', color: '#0284c7', marginBottom: 4 },
  bannerTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  bannerDesc: { fontSize: 12, color: '#64748b', marginTop: 2 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  seeAllText: { fontSize: 13, fontWeight: '700', color: '#1d5f60' },
  cafeCard: { backgroundColor: '#ffffff', borderRadius: 20, borderColor: '#e2e8f0', borderWidth: 1, overflow: 'hidden', marginBottom: 12 },
  cafeCardImg: { width: '100%', height: 120 },
  cafeCardBody: { padding: 14 },
  cafeCardTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  cafeCardAddr: { fontSize: 12, color: '#64748b', marginTop: 2 },
  menuCountText: { fontSize: 11, fontWeight: '700', color: '#1d5f60', marginTop: 6 },
  statusPill: { alignSelf: 'flex-start', backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 8 },
  statusPillText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  primaryBtn: { backgroundColor: '#1d5f60', borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  primaryBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  screenHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', backgroundColor: '#fff' },
  screenHeaderTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  screenHeaderSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  emptyBox: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  emptySub: { fontSize: 12, color: '#64748b', textAlign: 'center', marginTop: 4 },
  orderCard: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', padding: 14, marginBottom: 12 },
  orderHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  readyTag: { backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  readyTagText: { fontSize: 11, fontWeight: '800', color: '#15803d' },
  codeText: { fontSize: 13, fontWeight: '800', color: '#0284c7' },
  orderUserText: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  orderCafeText: { fontSize: 12, color: '#64748b', marginTop: 2 },
  orderDateText: { fontSize: 11, color: '#94a3b8', marginTop: 6 },
  qrContainer: { backgroundColor: '#ffffff', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', marginBottom: 20 },
  qrCodeSub: { fontSize: 14, fontWeight: '800', color: '#0f172a', marginTop: 12 },
  rewardCard: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  rewardTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  rewardDesc: { fontSize: 12, color: '#64748b', marginTop: 2 },
  gpBadge: { alignSelf: 'flex-start', backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 6 },
  gpBadgeText: { fontSize: 11, fontWeight: '800', color: '#b45309' },
  claimBtn: { backgroundColor: '#1d5f60', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, marginLeft: 12 },
  claimBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  profileAvatarLarge: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#1d5f60', justifyContent: 'center', alignItems: 'center' },
  infoCard: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', padding: 16, marginTop: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  infoLabel: { fontSize: 13, color: '#64748b' },
  infoValue: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  logoutBtn: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fca5a5', paddingVertical: 14, borderRadius: 16, alignItems: 'center', marginTop: 24 },
  logoutBtnText: { color: '#b91c1c', fontSize: 14, fontWeight: '800' },
  quickLoginBtn: { backgroundColor: '#dcfce7', borderColor: '#86efac', borderWidth: 1, padding: 12, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  quickLoginBtnText: { fontSize: 12, fontWeight: '800', color: '#15803d' },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 4, marginTop: 8 },
  textInput: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#0f172a' },
  bottomNav: { flexDirection: 'row', backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingVertical: 8, paddingBottom: Platform.OS === 'ios' ? 24 : 8 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navIcon: { fontSize: 18, opacity: 0.5 },
  navIconActive: { opacity: 1 },
  navText: { fontSize: 10, color: '#64748b', marginTop: 2, fontWeight: '600' },
  navTextActive: { color: '#1d5f60', fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  modalItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  orderSmallBtn: { backgroundColor: '#1d5f60', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  orderSmallBtnText: { color: '#fff', fontSize: 11, fontWeight: '800' }
});
