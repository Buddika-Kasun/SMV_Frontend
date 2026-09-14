import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Base API URL configuration - can be overridden via environment variables
export const API_BASE_URL = (typeof import.meta !== 'undefined' && (import.meta as Record<string, any>).env?.VITE_API_BASE_URL) || '/api';

/**
 * Pre-configured Axios instance for SMV Holdings FinTech APIs.
 * Ready for backend connectivity with request/response interceptors,
 * auth token injection, and unified error handling.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor: Attach authentication tokens or tenancy headers when available
apiClient.interceptors.request.use(
  (config) => {
    // Example: Retrieve auth token from secure storage
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Centralized error handling and transformation
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    // Standardized error message extraction
    const errorMessage = 
      (error.response?.data as { message?: string })?.message ||
      error.message ||
      'An unexpected network error occurred';
    
    console.error(`[API Error]: ${error.config?.url} -> ${errorMessage}`);
    return Promise.reject(new Error(errorMessage));
  }
);

export default apiClient;
