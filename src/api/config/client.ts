import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import { ApiResponse, ApiErrorResponse } from "../types";
import { TokenService } from "../services/token.service";
import { authEndpoint } from "../endpoints/auth.endpoint";

// Queue for pending requests while refreshing token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  config: InternalAxiosRequestConfig;
}> = [];

export const API_BASE_URL =
  (typeof import.meta !== "undefined" &&
    (import.meta as Record<string, any>).env?.VITE_API_BASE_URL) ||
  "/api";

class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - Add token to requests
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = TokenService.getAccessToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor - Handle token refresh
    this.axiosInstance.interceptors.response.use(
      (response) => {
        // If response has our ApiResponse structure, return it
        if (
          response.data &&
          typeof response.data === "object" &&
          "success" in response.data
        ) {
          return response;
        }
        // Otherwise wrap it
        return {
          ...response,
          data: {
            success: true,
            data: response.data,
            timestamp: new Date().toISOString(),
          },
        };
      },
      async (error: AxiosError<ApiErrorResponse>) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        // If error is 401 and not a retry, attempt to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
          // Don't attempt refresh for login or refresh endpoints
          if (
            originalRequest.url?.includes("/auth/login") ||
            originalRequest.url?.includes("/auth/refresh")
          ) {
            return Promise.reject(error);
          }

          // If refresh token is not available, reject
          if (!TokenService.getRefreshToken()) {
            this.handleLogout();
            return Promise.reject(error);
          }

          if (isRefreshing) {
            // Queue the request while token is being refreshed
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject, config: originalRequest });
            });
          }

          originalRequest._retry = true;
          isRefreshing = true;

          try {
            // Attempt to refresh token
            const refreshToken = TokenService.getRefreshToken();
            if (!refreshToken) {
              throw new Error("No refresh token available");
            }

            const response = await authEndpoint.refreshToken(refreshToken);

            if (response.success && response.data) {
              // Update tokens
              TokenService.updateAccessToken(
                response.data.accessToken,
                response.data.expiresIn,
              );

              // Retry failed queue requests
              this.processQueue(null, response.data.accessToken);

              // Retry the original request with new token
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
              }
              return this.axiosInstance(originalRequest);
            } else {
              // Refresh failed - logout
              this.handleLogout();
              this.processQueue(new Error("Refresh failed"), null);
              return Promise.reject(error);
            }
          } catch (refreshError) {
            // Refresh failed - logout
            this.handleLogout();
            this.processQueue(refreshError as Error, null);
            return Promise.reject(refreshError);
          } finally {
            isRefreshing = false;
          }
        }

        // Handle other errors
        const errorMessage =
          error.response?.data?.message || error.message || "An error occurred";
        const errorData = error.response?.data;

        return Promise.reject({
          success: false,
          message: errorMessage,
          error: errorData?.error || "Error",
          statusCode: error.response?.status || 500,
          data: errorData?.data,
        });
      },
    );
  }

  private processQueue(error: Error | null, token: string | null): void {
    failedQueue.forEach((promise) => {
      if (error) {
        promise.reject(error);
      } else if (token && promise.config.headers) {
        promise.config.headers.Authorization = `Bearer ${token}`;
        promise.resolve(this.axiosInstance(promise.config));
      }
    });
    failedQueue = [];
  }

  private handleLogout(): void {
    TokenService.clearTokens();
    window.dispatchEvent(new Event("auth:logout"));
    window.location.href = "/login";
  }

  // Public API methods
  public async get<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.get<ApiResponse<T>>(url, config);
    return response.data;
  }

  public async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.post<ApiResponse<T>>(
      url,
      data,
      config,
    );
    return response.data;
  }

  public async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.put<ApiResponse<T>>(
      url,
      data,
      config,
    );
    return response.data;
  }

  public async patch<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.patch<ApiResponse<T>>(
      url,
      data,
      config,
    );
    return response.data;
  }

  public async delete<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.delete<ApiResponse<T>>(
      url,
      config,
    );
    return response.data;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
