import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) throw new Error('No refresh token');

        const response = await axios.post(`${API_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        useAuthStore.getState().setAccessToken(access);
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access}`;
        }
        return api(originalRequest);
      } catch {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login/', { email, password }),
  logout: (refresh: string) =>
    api.post('/auth/logout/', { refresh }),
  register: (data: { email: string; full_name: string; phone: string; address: string; password: string; confirm_password: string }) =>
    api.post('/auth/register/', data),
  refreshToken: (refresh: string) =>
    api.post('/auth/token/refresh/', { refresh }),
};

// Users API
export const usersApi = {
  list: (params?: Record<string, string | number>) =>
    api.get('/users/', { params }),
  get: (id: number) => api.get(`/users/${id}/`),
  create: (data: Record<string, unknown>) => api.post('/users/', data),
  update: (id: number, data: Record<string, unknown>) => api.patch(`/users/${id}/`, data),
  delete: (id: number) => api.delete(`/users/${id}/`),
  profile: () => api.get('/users/profile/'),
  updateProfile: (data: FormData) =>
    api.patch('/users/profile/', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  changePassword: (data: { old_password: string; new_password: string; confirm_password: string }) =>
    api.post('/users/change-password/', data),
  admins: () => api.get('/users/admins/'),
  activityLogs: () => api.get('/users/activity-logs/'),
};

// Orders API
export const ordersApi = {
  list: (params?: Record<string, string | number>) =>
    api.get('/orders/', { params }),
  get: (id: number) => api.get(`/orders/${id}/`),
  create: (data: Record<string, unknown>) => api.post('/orders/', data),
  update: (id: number, data: Record<string, unknown>) => api.patch(`/orders/${id}/`, data),
  delete: (id: number) => api.delete(`/orders/${id}/`),
  updateStatus: (id: number, data: { status?: string; payment_status?: string; notes?: string }) =>
    api.patch(`/orders/${id}/status/`, data),
  cancel: (id: number) => api.post(`/orders/${id}/cancel/`),
  settings: () => api.get('/orders/settings/'),
  updateSettings: (data: Record<string, unknown>) => api.patch('/orders/settings/', data),
  publicSettings: () => api.get('/orders/public-settings/'),
};

// Dashboard API
export const dashboardApi = {
  superAdmin: () => api.get('/dashboard/super-admin/'),
  admin: () => api.get('/dashboard/admin/'),
  exportReport: (params?: { date_from?: string; date_to?: string }) =>
    api.get('/dashboard/export/', { params, responseType: 'blob' }),
};
