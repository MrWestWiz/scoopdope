import axios from 'axios';
import { toast } from './toast';
import { useAuthStore } from '@/store/auth.store';

const SUPPORTED_API_VERSIONS = ['v1'];
const DEFAULT_API_VERSION = 'v1';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window === 'undefined') return config;
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;

  if (!config.headers['Accept-Version']) {
    config.headers['Accept-Version'] = DEFAULT_API_VERSION;
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    if (typeof window === 'undefined') return response;

    const apiVersion = response.headers['x-api-version'];
    const deprecated = response.headers['x-api-deprecated'];
    const sunset = response.headers['x-api-sunset'];

    if (deprecated) {
      console.warn(
        `API version ${apiVersion} is deprecated. Sunset: ${sunset || 'soon'}. ` +
        `Please migrate to a supported version: ${SUPPORTED_API_VERSIONS.join(', ')}`
      );
    }

    return response;
  },
  (error) => {
    if (typeof window === 'undefined') return Promise.reject(error);

    const status = error?.response?.status;

    if (status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    const message: string =
      error?.response?.data?.message ??
      error?.response?.data?.error ??
      error?.message ??
      'An unexpected error occurred.';

    toast.error(typeof message === 'string' ? message : JSON.stringify(message));

    return Promise.reject(error);
  }
);

export default api;
