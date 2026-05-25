import axios from 'axios';
import { useAuthStore } from '../hooks/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// raw axios without our interceptors for token refresh calls
const raw = axios.create({ baseURL: API_URL, headers: { 'Content-Type': 'application/json' } });

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      const { refreshToken, setTokens, logout } = useAuthStore.getState();
      if (refreshToken) {
        try {
          const { data } = await raw.post('/auth/refresh', { refreshToken });
          if (data?.data) {
            setTokens(data.data);
            original.headers = original.headers || {};
            original.headers.Authorization = `Bearer ${data.data.accessToken}`;
            return api(original);
          }
          throw new Error('Refresh failed');
        } catch {
          logout();
          window.location.href = '/login';
        }
      } else {
        logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
