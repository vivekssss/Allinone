import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Switch this URL to your Vercel deployment URL when ready
const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const authAPI = {
  register: (data: { email: string; password: string; name: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
};

// Device Stats APIs
export const deviceStatsAPI = {
  save: (data: any) => api.post('/device-stats', data),
  getHistory: (days = 7, limit = 50) =>
    api.get(`/device-stats?days=${days}&limit=${limit}`),
};

// Snapshots API (detailed)
export const snapshotsAPI = {
  capture: (data: any) => api.post('/snapshots', data),
  getHistory: (limit = 20) => api.get(`/snapshots?limit=${limit}`),
};

// Apps API
export const appsAPI = {
  getAll: (filter?: string, sort?: string) => {
    const params = new URLSearchParams();
    if (filter) params.append('filter', filter);
    if (sort) params.append('sort', sort);
    return api.get(`/apps?${params.toString()}`);
  },
  sync: (apps: any[]) => api.post('/apps', { apps }),
  killApp: (packageName: string) => api.put('/apps', { packageName, action: 'kill' }),
  bulkKill: (level: 'dangerous' | 'moderate' | 'all-threats' = 'dangerous') =>
    api.delete(`/apps?level=${level}`),
};

// Optimization API
export const optimizationAPI = {
  run: (data: any) => api.post('/optimization', data),
  getHistory: (limit = 20, type?: string) => {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (type) params.append('type', type);
    return api.get(`/optimization?${params.toString()}`);
  },
};

// Photos API
export const photosAPI = {
  save: (data: any) => api.post('/photos', data),
  getAll: (limit = 50, favorites = false) =>
    api.get(`/photos?limit=${limit}&favorites=${favorites}`),
  update: (data: any) => api.put('/photos', data),
  delete: (photoId: string) => api.delete(`/photos?id=${photoId}`),
};

// Boost History APIs
export const boostAPI = {
  logBoost: (data: any) => api.post('/boost-history', data),
  getHistory: (limit = 20) => api.get(`/boost-history?limit=${limit}`),
};

// Media Metadata APIs
export const mediaAPI = {
  saveMetadata: (data: any) => api.post('/media-metadata', data),
  getLibrary: (type?: string, favorites?: boolean) => {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (favorites) params.append('favorites', 'true');
    return api.get(`/media-metadata?${params.toString()}`);
  },
  updateMedia: (data: any) => api.put('/media-metadata', data),
};

// User Preferences APIs
export const preferencesAPI = {
  get: () => api.get('/user-preferences'),
  update: (data: any) => api.put('/user-preferences', data),
};

// Battery Health APIs
export const batteryHealthAPI = {
  save: (data: any) => api.post('/battery-health', data),
  getHistory: (days = 30, limit = 30) =>
    api.get(`/battery-health?days=${days}&limit=${limit}`),
};

// Device Diagnostics APIs
export const diagnosticsAPI = {
  runScan: (components: any[]) => api.post('/diagnostics', { components }),
  getResults: (type?: string) => {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    return api.get(`/diagnostics?${params.toString()}`);
  },
};

// Downloads APIs
export const downloadsAPI = {
  queueDownload: (data: { url: string; title?: string; fileType?: string }) =>
    api.post('/downloads', data),
  getHistory: (limit = 50, status?: string) => {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (status) params.append('status', status);
    return api.get(`/downloads?${params.toString()}`);
  },
  updateProgress: (data: { id: string; status?: string; progress?: number }) =>
    api.put('/downloads', data),
  deleteDownload: (id: string) => api.delete(`/downloads?id=${id}`),
};

// Deep Clean APIs
export const deepCleanAPI = {
  saveScan: (data: any) => api.post('/deep-clean', data),
  getHistory: () => api.get('/deep-clean'),
};

export default api;
