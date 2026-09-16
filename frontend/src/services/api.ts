import { toQuery } from '../lib/adminQuery';

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ||
  (import.meta.env.DEV ? 'http://localhost:5155/api/v1' : '/api/v1');

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
  updateOrderStatus: (id: string, status: string) =>
    request<any>(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
  createOrder: (data: any) =>
    request<any>('/orders', {
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
