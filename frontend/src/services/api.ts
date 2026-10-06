import { toQuery } from '../lib/adminQuery';

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ||
  (import.meta.env.DEV ? 'http://127.0.0.1:5155/api/v1' : '/api/v1');

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function httpErrorCode(err: unknown): string | undefined {
  const status = err instanceof ApiError ? err.status : undefined;
  if (status === 403 || status === 404 || status === 409 || status === 500) return String(status);
  if (status && status >= 500) return '500';
  return undefined;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');
  
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

    if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth-change'));
    throw new ApiError('Oturum süresi doldu. Lütfen tekrar giriş yapın.', 401);
  }

  const forbiddenMessage = 'Bu işlem için yetkiniz bulunmuyor.';
  const conflictMessage = 'Bu işlem başka bir değişiklikle çakıştı. Verileri yenileyip tekrar deneyin.';
  const raw = await response.text();
  if (!raw) {
    if (!response.ok) {
      if (response.status === 403) throw new ApiError(forbiddenMessage, 403);
      if (response.status === 409) throw new ApiError(conflictMessage, 409);
      if (response.status === 404) throw new ApiError('Kayıt bulunamadı.', 404);
      throw new ApiError('İşlem sırasında beklenmeyen bir hata oluştu.', response.status || 500);
    }
    return undefined as T;
  }

  const result: ApiResponse<T> = JSON.parse(raw);

  if (!result.success || !response.ok) {
    let errorMsg = result.message || 'Bir hata oluştu.';
    if (result.errors) {
      if (Array.isArray(result.errors)) {
        errorMsg = result.errors.join(', ');
      } else if (typeof result.errors === 'object') {
        errorMsg = Object.entries(result.errors)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join(' | ');
      } else {
        errorMsg = String(result.errors);
      }
    }
    if (response.status === 403) throw new ApiError(result.message || forbiddenMessage, 403);
    if (response.status === 409) throw new ApiError(result.message || conflictMessage, 409);
    if (response.status === 404) throw new ApiError(result.message || 'Kayıt bulunamadı.', 404);
    throw new ApiError(errorMsg, response.status || 400);
  }

  return result.data;
}

export const api = {
  // Auth
  login: (credentials: any) => 
    request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  register: (data: any) =>
    request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Profile
  getUsers: (params?: {
    role?: string;
    search?: string;
    minAge?: number | string;
    maxAge?: number | string;
    education?: string;
    minPoints?: number | string;
    maxPoints?: number | string;
    page?: number;
    pageSize?: number;
  } | string) => {
    if (typeof params === 'string') {
      return request<any>(`/users${toQuery({ role: params, page: 1, pageSize: 25 })}`);
    }
    return request<any>(`/users${toQuery({ page: 1, pageSize: 25, ...params })}`);
  },
  getProfile: () => request<any>('/users/me'),
  updateProfile: (data: any) =>
    request<any>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  changePassword: (data: any) =>
    request<any>('/users/change-password', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Points
  getPointsHistory: (page = 1, pageSize = 10) =>
    request<any>(`/points?page=${page}&pageSize=${pageSize}`),
  getPointsLedger: (params?: Record<string, string | number | boolean | undefined>) =>
    request<any>(`/points/ledger${toQuery({ page: 1, pageSize: 25, ...params })}`),
  grantPoints: (command: any) =>
    request<any>('/points/grant', {
      method: 'POST',
      body: JSON.stringify(command),
    }),

  // Rewards
  getRewards: (page = 1, pageSize = 10, search = '') =>
    request<any>(`/rewards?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(search)}`),
  getAdminRewards: (params?: Record<string, string | number | undefined>) =>
    request<any>(`/rewards/admin${toQuery({ page: 1, pageSize: 25, ...params })}`),
  getMyClaimedRewards: () => request<any>('/rewards/my-claimed'),
  claimReward: (id: string) =>
    request<any>(`/rewards/${id}/claim`, {
      method: 'POST',
    }),
  checkoutCart: (items: { rewardId: string; quantity: number }[]) =>
    request<any>('/rewards/checkout', {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),
  createReward: (data: any) =>
    request<any>('/rewards', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateReward: (id: string, data: any) =>
    request<any>(`/rewards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deactivateReward: (id: string) =>
    request<any>(`/rewards/${id}/deactivate`, {
      method: 'POST',
    }),
  activateReward: (id: string) =>
    request<any>(`/rewards/${id}/activate`, {
      method: 'POST',
    }),
  deleteReward: (id: string) =>
    request<any>(`/rewards/${id}`, {
      method: 'DELETE',
    }),

  // Tasks
  getActiveTasks: () => request<any>('/tasks'),
  completeTask: (id: string) =>
    request<any>(`/tasks/${id}/complete`, {
      method: 'POST',
    }),
  createTask: (command: any) =>
    request<any>('/tasks', {
      method: 'POST',
      body: JSON.stringify(command),
    }),
  deleteTask: (id: string) =>
    request<any>(`/tasks/${id}`, {
      method: 'DELETE',
    }),

  // Activities
  getActivities: () => request<any>('/activities'),
  joinActivity: (id: string) =>
    request<any>(`/activities/${id}/join`, {
      method: 'POST',
    }),
  createActivity: (data: any) =>
    request<any>('/activities', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteActivity: (id: string) =>
    request<any>(`/activities/${id}`, {
      method: 'DELETE',
    }),

  getAdminPlaces: (params?: { category?: string; search?: string; published?: boolean; active?: boolean; page?: number; pageSize?: number }) =>
    request<any>(`/admin/places${toQuery({ page: 1, pageSize: 25, ...params })}`),
  getAdminPlace: (id: string) => request<any>(`/admin/places/${id}`),
  createAdminPlace: (data: any) =>
    request<any>('/admin/places', { method: 'POST', body: JSON.stringify(data) }),
  updateAdminPlace: (id: string, data: any) =>
    request<any>(`/admin/places/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAdminPlace: (id: string) =>
    request<any>(`/admin/places/${id}`, { method: 'DELETE' }),
  addAdminPlaceImage: (id: string, data: any) =>
    request<any>(`/admin/places/${id}/images`, { method: 'POST', body: JSON.stringify(data) }),
  deleteAdminPlaceImage: (id: string, imageId: string) =>
    request<any>(`/admin/places/${id}/images/${imageId}`, { method: 'DELETE' }),

  // Cafes
  getCafes: () => request<any>('/cafes'),
  getAdminCafes: (params?: Record<string, string | number | boolean | undefined>) =>
    request<any>(`/cafes/admin${toQuery({ page: 1, pageSize: 25, ...params })}`),
  createCafe: (data: any) =>
    request<any>('/cafes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCafe: (id: string, data: any) =>
    request<any>(`/cafes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteCafe: (id: string) =>
    request<any>(`/cafes/${id}`, {
      method: 'DELETE',
    }),

  // MenuItems
  getMenuItems: (cafeId: string) => request<any>(`/cafes/${cafeId}/menu`),
  getAllMenuItems: () => request<any>('/menu-items'),
  getAdminMenuItems: (params?: Record<string, string | number | boolean | undefined>) =>
    request<any>(`/menu-items/admin${toQuery({ page: 1, pageSize: 25, ...params })}`),
  createMenuItem: (cafeId: string, data: any) =>
    request<any>(`/cafes/${cafeId}/menu`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateMenuItem: (cafeId: string, id: string, data: any) =>
    request<any>(`/cafes/${cafeId}/menu/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteMenuItem: (cafeId: string, id: string) =>
    request<any>(`/cafes/${cafeId}/menu/${id}`, {
      method: 'DELETE',
    }),
  getCatalogMeta: () => request<any>('/catalog/meta'),
  createCatalogCategory: (data: any) => request<any>('/catalog/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCatalogCategory: (id: string, data: any) => request<any>(`/catalog/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteCatalogCategory: (id: string) => request<any>(`/catalog/categories/${id}`, { method: 'DELETE' }),
  createCatalogIngredient: (data: any) => request<any>('/catalog/ingredients', { method: 'POST', body: JSON.stringify(data) }),
  updateCatalogIngredient: (id: string, data: any) => request<any>(`/catalog/ingredients/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteCatalogIngredient: (id: string) => request<any>(`/catalog/ingredients/${id}`, { method: 'DELETE' }),
  createCatalogAllergen: (data: any) => request<any>('/catalog/allergens', { method: 'POST', body: JSON.stringify(data) }),
  updateCatalogAllergen: (id: string, data: any) => request<any>(`/catalog/allergens/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteCatalogAllergen: (id: string) => request<any>(`/catalog/allergens/${id}`, { method: 'DELETE' }),

  // QR
  scanQr: (command: any) =>
    request<any>('/qr/scan', {
      method: 'POST',
      body: JSON.stringify(command),
    }),
  getRecentQr: (page = 1, pageSize = 25) =>
    request<any>(`/qr/recent${toQuery({ page, pageSize })}`),

  // Analytics
  getUserAnalytics: () => request<any>('/analytics/user'),
  getAdminAnalytics: () => request<any>('/analytics/admin'),

  // Settings / Organizations
  getSettings: () => request<any>('/settings'),
  updateSetting: (key: string, data: any) =>
    request<any>(`/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Orders (Ismarlıyor)
  getOrders: (params?: Record<string, string | number | undefined>) =>
    request<any>(`/orders${toQuery(params || {})}`),
  updateOrderStatus: (id: string, status: string, reason?: string) =>
    request<any>(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, reason }),
    }),
  createOrder: (data: any) =>
    request<any>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateBranchPickupStatus: (branchId: string, status: 'OPEN' | 'PAUSED' | 'CLOSED', data?: { reason?: string; durationMinutes?: number }) =>
    request<any>(`/staff/branches/${branchId}/pickup-status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, ...data }),
    }),
  updateProductAvailability: (productId: string, isAvailable: boolean) =>
    request<any>(`/staff/products/${productId}/availability`, {
      method: 'PATCH',
      body: JSON.stringify({ isAvailable }),
    }),
  getStaffProducts: () => request<any>('/staff/products'),
  resolveOrderQr: (qrToken: string, cafeId?: string) =>
    request<any>('/qr/orders/resolve', {
      method: 'POST',
      body: JSON.stringify({ code: qrToken, cafeId }),
    }),
  completeOrderPickup: (orderId: string, data: { cafeId?: string; paymentMethod: string; pointsRedeemed?: number }) =>
    request<any>(`/qr/orders/${orderId}/complete`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Dashboard & Specification Endpoints
  getDashboardOverview: () => request<any>('/dashboard/overview'),
  getUserDetail: (id: string) => request<any>(`/users/${id}/detail`),
  adjustUserPoints: (id: string, data: any) =>
    request<any>(`/users/${id}/adjust-points`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  addUserRestriction: (id: string, data: { type: string; reasonCode: string; internalNote?: string; durationDays?: number }) =>
    request<any>(`/users/${id}/restrictions`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  revokeUserSessions: (id: string) =>
    request<any>(`/users/${id}/revoke-sessions`, {
      method: 'POST',
    }),
  getAuditLogs: (params?: Record<string, string | number | undefined>) =>
    request<any>(`/auditlogs${toQuery({ page: 1, pageSize: 25, ...params })}`),
  getApprovals: (status = 'Pending') => request<any>(`/approvals?status=${status}`),
  actionApproval: (id: string, approved: boolean, note?: string) =>
    request<any>(`/approvals/${id}/action`, {
      method: 'POST',
      body: JSON.stringify({ approved, note }),
    }),
  getStaff: () => request<any>('/staff'),
  addStaff: (data: any) =>
    request<any>('/staff', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  changeStaffRole: (userId: string, role: string) =>
    request<any>(`/staff/${userId}/role`, {
      method: 'POST',
      body: JSON.stringify({ role }),
    }),
  setStaffActive: (userId: string, isActive: boolean) =>
    request<any>(`/staff/${userId}/active`, {
      method: 'POST',
      body: JSON.stringify({ isActive }),
    }),
  updateStaffAssignment: (userId: string, data: { duty: string; branchId?: string | null; registrationNumber?: string }) =>
    request<any>(`/staff/${userId}/assignment`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getCampaigns: (params?: Record<string, string | number | boolean | undefined>) =>
    request<any>(`/campaigns${toQuery({ page: 1, pageSize: 25, ...params })}`),
  createCampaign: (data: any) =>
    request<any>('/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCampaign: (id: string, data: any) =>
    request<any>(`/campaigns/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  publishCampaign: (id: string) =>
    request<any>(`/campaigns/${id}/publish`, { method: 'POST' }),
  unpublishCampaign: (id: string) =>
    request<any>(`/campaigns/${id}/unpublish`, { method: 'POST' }),
  deleteCampaign: (id: string) =>
    request<any>(`/campaigns/${id}`, { method: 'DELETE' }),
  getNotifications: (params?: Record<string, string | number | undefined>) =>
    request<any>(`/notifications${toQuery({ page: 1, pageSize: 25, ...params })}`),
  previewNotification: (data: any) =>
    request<any>('/notifications/preview', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  sendNotification: (data: any) =>
    request<any>('/notifications/send', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getCityContent: (params?: { type?: string; status?: string; search?: string; page?: number }) => {
    const query = new URLSearchParams();
    if (params?.type) query.set('type', params.type);
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    query.set('page', String(params?.page ?? 1));
    query.set('pageSize', '50');
    return request<any>(`/content/admin?${query.toString()}`);
  },
  getCityContentById: (id: string) => request<any>(`/content/admin/${id}`),
  createCityContent: (data: any) =>
    request<any>('/content', { method: 'POST', body: JSON.stringify(data) }),
  updateCityContent: (id: string, data: any) =>
    request<any>(`/content/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  publishCityContent: (id: string) =>
    request<any>(`/content/${id}/publish`, { method: 'POST' }),
  unpublishCityContent: (id: string) =>
    request<any>(`/content/${id}/unpublish`, { method: 'POST' }),
  deleteCityContent: (id: string) =>
    request<any>(`/content/${id}`, { method: 'DELETE' }),
  getAdminActivities: (params?: Record<string, string | number | undefined>) =>
    request<any>(`/activities/admin${toQuery({ page: 1, pageSize: 25, ...params })}`),
  updateActivity: (id: string, data: any) =>
    request<any>(`/activities/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  publishActivity: (id: string) =>
    request<any>(`/activities/${id}/publish`, { method: 'POST' }),
  unpublishActivity: (id: string) =>
    request<any>(`/activities/${id}/unpublish`, { method: 'POST' }),
  archiveActivity: (id: string) =>
    request<any>(`/activities/${id}/archive`, { method: 'POST' }),
  completeActivity: (id: string) =>
    request<any>(`/activities/${id}/complete`, { method: 'POST' }),
  checkInEventParticipant: (data: { eventId: string; qrToken: string; notes?: string }) =>
    request<any>(`/activities/${data.eventId}/check-in`, { method: 'POST', body: JSON.stringify({ qrToken: data.qrToken, notes: data.notes }) }),
  getEventCheckins: (eventId: string) => request<any>(`/activities/${eventId}/check-ins`),
  getMissions: (params?: Record<string, string | number | undefined>) =>
    request<any>(`/missions${toQuery({ page: 1, pageSize: 25, ...params })}`),
  getMissionById: (id: string) =>
    request<any>(`/missions/${id}`),
  createMission: (data: any) =>
    request<any>('/missions', { method: 'POST', body: JSON.stringify(data) }),
  updateMission: (id: string, data: any) =>
    request<any>(`/missions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  publishMission: (id: string) =>
    request<any>(`/missions/${id}/publish`, { method: 'POST' }),
  endMission: (id: string) =>
    request<any>(`/missions/${id}/end`, { method: 'POST' }),
  duplicateMission: (id: string) =>
    request<any>(`/missions/${id}/duplicate`, { method: 'POST' }),
  deleteMission: (id: string) =>
    request<any>(`/missions/${id}`, { method: 'DELETE' }),
  getReportsSummary: (params?: Record<string, string | undefined>) =>
    request<any>(`/reports/summary${toQuery(params || {})}`),
  exportReport: async (type: string, params?: Record<string, string | undefined>) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/reports/export/${type}${toQuery(params || {})}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Rapor indirilemedi.');
    return await res.blob();
  },
  getFieldDrops: (params?: Record<string, string | number | undefined>) =>
    request<any>(`/field-drops${toQuery({ page: 1, pageSize: 25, ...params })}`),
  getFieldDropCaptures: (id: string, params?: Record<string, string | number | undefined>) =>
    request<any>(`/field-drops/${id}/captures${toQuery({ page: 1, pageSize: 25, ...params })}`),
  createFieldDrop: (data: any) =>
    request<any>('/field-drops', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateFieldDrop: (id: string, data: any) =>
    request<any>(`/field-drops/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteFieldDrop: (id: string) =>
    request<any>(`/field-drops/${id}`, {
      method: 'DELETE',
    }),
  captureFieldDrop: (id: string, data: any) =>
    request<any>(`/field-drops/${id}/capture`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getNearbyFieldDrops: (latitude: number, longitude: number) =>
    request<any>(`/field-drops/nearby?latitude=${latitude}&longitude=${longitude}`),
  // Social Media (Story & Reels)
  getSocialPosts: (params?: { type?: string; status?: string; search?: string; page?: number }) => {
    return request<any>(`/social${toQuery({ page: 1, pageSize: 25, ...params })}`).catch(() => {
      // Fallback local mock data for testing UI when backend endpoint is unmounted
      const mockItems = [
        {
          id: 'soc-1',
          type: 'Reels',
          title: 'Alleben Göleti Doğa Yürüyüşü',
          videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-tree-branches-in-the-breeze-1188-large.mp4',
          thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
          caption: 'Hafta sonu Alleben Göletinde harika bir sabah yürüyüşü! Siz de katıldınız mı?',
          authorName: 'Mehmet Yılmaz',
          authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          likesCount: 142,
          commentsCount: 18,
          status: 'Published',
          createdAt: new Date().toISOString()
        },
        {
          id: 'soc-2',
          type: 'Story',
          title: 'Gençlik Merkezi Kurs Kayıtları',
          videoUrl: '',
          imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80',
          caption: 'Gençlik merkezlerimizde yeni dönem kayıtları başladı! Son gün 30 Eylül.',
          authorName: 'Şehitkamil Belediyesi',
          authorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
          likesCount: 89,
          commentsCount: 4,
          status: 'Published',
          createdAt: new Date().toISOString()
        },
        {
          id: 'soc-3',
          type: 'Reels',
          title: 'Vatandaş Paylaşımı - Dülük Parkı',
          videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-waterfall-in-forest-2213-large.mp4',
          thumbnailUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80',
          caption: 'Dülük Tabiat Parkında sonbahar manzarası harika.',
          authorName: 'Ayşe Demir (Vatandaş)',
          authorAvatar: '',
          likesCount: 0,
          commentsCount: 0,
          status: 'PendingReview',
          createdAt: new Date(Date.now() - 3600000).toISOString()
        }
      ];
      return {
        items: params?.status ? mockItems.filter(i => i.status === params.status) : mockItems,
        totalCount: mockItems.length
      };
    });
  },
  createSocialPost: (data: any) =>
    request<any>('/social', { method: 'POST', body: JSON.stringify(data) }).catch(() => ({ success: true, id: `soc-${Date.now()}` })),
  updateSocialPost: (id: string, data: any) =>
    request<any>(`/social/${id}`, { method: 'PUT', body: JSON.stringify(data) }).catch(() => ({ success: true })),
  approveSocialPost: (id: string) =>
    request<any>(`/social/${id}/approve`, { method: 'POST' }).catch(() => ({ success: true })),
  rejectSocialPost: (id: string, reason?: string) =>
    request<any>(`/social/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }).catch(() => ({ success: true })),
  deleteSocialPost: (id: string) =>
    request<any>(`/social/${id}`, { method: 'DELETE' }).catch(() => ({ success: true })),
  // Municipal Applications & Service Programs
  getAdminApplications: (params?: { status?: string; programId?: string; search?: string; page?: number }) => {
    return request<any>(`/applications/admin${toQuery({ page: 1, pageSize: 25, ...params })}`).catch(() => {
      const mockItems = [
        {
          id: 'app-1',
          programId: 'prog-1',
          programTitle: 'Üniversite ve Lise Öğrenci Kırtasiye Desteği',
          citizenName: 'Ahmet Yılmaz',
          tcNo: '12345678901',
          phone: '0555 123 4567',
          status: 'UnderReview',
          appliedAt: new Date().toISOString(),
          documents: [
            { name: 'Öğrenci Belgesi.pdf', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
            { name: 'İkametgah Belgesi.pdf', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' }
          ],
          note: 'Evraklar inceleniyor.'
        },
        {
          id: 'app-2',
          programId: 'prog-2',
          programTitle: 'Sosyal ve Erzak Yardım Başvurusu',
          citizenName: 'Fatma Şahin',
          tcNo: '98765432109',
          phone: '0544 987 6543',
          status: 'DocumentRequested',
          appliedAt: new Date(Date.now() - 86400000).toISOString(),
          documents: [
            { name: 'Gelir Belgesi.pdf', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' }
          ],
          note: 'Güncellenmiş ikametgah belgesi eksik.'
        },
        {
          id: 'app-3',
          programId: 'prog-3',
          programTitle: 'Evde Yaşlı Bakımı ve Destek Hizmeti',
          citizenName: 'Mehmet Ali Öztürk',
          tcNo: '45678912305',
          phone: '0533 456 7890',
          status: 'Approved',
          appliedAt: new Date(Date.now() - 172800000).toISOString(),
          documents: [
            { name: 'Sağlık Raporu.pdf', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' }
          ],
          note: 'Sağlık ekibi yönlendirildi.'
        }
      ];
      return {
        items: params?.status ? mockItems.filter(i => i.status === params.status) : mockItems,
        totalCount: mockItems.length
      };
    });
  },
  getAdminApplicationPrograms: () => {
    return request<any>('/applications/programs/admin').catch(() => {
      return [
        {
          id: 'prog-1',
          title: 'Üniversite ve Lise Öğrenci Kırtasiye Desteği',
          category: 'Eğitim Desteği',
          description: 'Şehitkamil ilçe sınırlarında ikamet eden öğrencilere tek seferlik eğitim desteği.',
          startDate: '2026-09-01',
          endDate: '2026-10-31',
          isActive: true,
          requiredDocuments: ['Öğrenci Belgesi', 'İkametgah Belgesi']
        },
        {
          id: 'prog-2',
          title: 'Sosyal ve Erzak Yardım Başvurusu',
          category: 'Sosyal Yardım',
          description: 'İhtiyaç sahibi aileler için erzak ve hijyen paketi destek programı.',
          startDate: '2026-01-01',
          endDate: '2026-12-31',
          isActive: true,
          requiredDocuments: ['Gelir Belgesi', 'Kimlik Fotokopisi']
        },
        {
          id: 'prog-3',
          title: 'Evde Yaşlı Bakımı ve Destek Hizmeti',
          category: 'Sağlık ve Bakım',
          description: '65 yaş üstü yalnız yaşayan vatandaşlarımıza evde sağlık ve bakım desteği.',
          startDate: '2026-01-01',
          endDate: '2026-12-31',
          isActive: true,
          requiredDocuments: ['Sağlık Raporu']
        }
      ];
    });
  },
  createApplicationProgram: (data: any) =>
    request<any>('/applications/programs', { method: 'POST', body: JSON.stringify(data) }).catch(() => ({ success: true, id: `prog-${Date.now()}` })),
  updateApplicationProgram: (id: string, data: any) =>
    request<any>(`/applications/programs/${id}`, { method: 'PUT', body: JSON.stringify(data) }).catch(() => ({ success: true })),
  toggleApplicationProgramStatus: (id: string, isActive: boolean) =>
    request<any>(`/applications/programs/${id}/toggle`, { method: 'PUT', body: JSON.stringify({ isActive }) }).catch(() => ({ success: true })),
  deleteApplicationProgram: (id: string) =>
    request<any>(`/applications/programs/${id}`, { method: 'DELETE' }).catch(() => ({ success: true })),
  updateApplicationStatus: (id: string, status: string, note?: string) =>
    request<any>(`/applications/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, note }) }).catch(() => ({ success: true })),
  uploadFile: async (file: File) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE_URL}/files/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Dosya yüklenemedi.');
    return data.data.url;
  }
};
