const API_BASE_URL = 'http://localhost:5155/api/v1';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
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
    throw new Error('Oturum süresi doldu. Lütfen tekrar giriş yapın.');
  }

  const raw = await response.text();
  if (!raw) {
    if (!response.ok) {
      throw new Error('Bir hata oluştu.');
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
    throw new Error(errorMsg);
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
  getUsers: () => request<any>('/users'),
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
  getPointsLedger: (page = 1, pageSize = 50) =>
    request<any>(`/points/ledger?page=${page}&pageSize=${pageSize}`),
  grantPoints: (command: any) =>
    request<any>('/points/grant', {
      method: 'POST',
      body: JSON.stringify(command),
    }),

  // Rewards
  getRewards: (page = 1, pageSize = 10, search = '') =>
    request<any>(`/rewards?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(search)}`),
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

  // Cafes
  getCafes: () => request<any>('/cafes'),
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
  createMenuItem: (cafeId: string, data: any) =>
    request<any>(`/cafes/${cafeId}/menu`, {
      method: 'POST',
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
  getOrders: () => request<any>('/orders'),
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
  getAuditLogs: (module = 'All', search = '') =>
    request<any>(`/auditlogs?module=${module}&search=${encodeURIComponent(search)}`),
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
  getCampaigns: () => request<any>('/campaigns'),
  createCampaign: (data: any) =>
    request<any>('/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getNotifications: () => request<any>('/notifications'),
  sendNotification: (data: any) =>
    request<any>('/notifications/send', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getReportsSummary: () => request<any>('/reports/summary'),
  getFieldDrops: () => request<any>('/field-drops'),
  getFieldDropCaptures: (id: string) => request<any>(`/field-drops/${id}/captures`),
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
