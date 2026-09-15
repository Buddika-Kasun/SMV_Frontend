import { InternalAxiosRequestConfig } from "axios";
import { TokenService } from "../services/token.service";
import { authEndpoint } from "../endpoints/auth.endpoint";

// Queue for pending requests
let refreshPromise: Promise<string> | null = null;

export const handleTokenRefresh = async (
  config: InternalAxiosRequestConfig,
): Promise<InternalAxiosRequestConfig> => {
  const token = TokenService.getAccessToken();

  if (!token) {
    return config;
  }

  // If token is expired, try to refresh
  if (TokenService.isTokenExpired()) {
    try {
      // If there's already a refresh in progress, wait for it
      if (refreshPromise) {
        const newToken = await refreshPromise;
        config.headers.Authorization = `Bearer ${newToken}`;
        return config;
      }

      // Start refresh
      refreshPromise = refreshToken();
      const newToken = await refreshPromise;
      config.headers.Authorization = `Bearer ${newToken}`;
      return config;
    } catch (error) {
      // Refresh failed - logout
      TokenService.clearTokens();
      window.dispatchEvent(new Event("auth:logout"));
      throw error;
    } finally {
      refreshPromise = null;
    }
  }

  return config;
};

const refreshToken = async (): Promise<string> => {
  const refreshToken = TokenService.getRefreshToken();

  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  try {
    const response = await authEndpoint.refreshToken(refreshToken);

    if (response.success && response.data) {
      TokenService.updateAccessToken(
        response.data.accessToken,
        response.data.expiresIn,
      );
      return response.data.accessToken;
    } else {
      throw new Error("Refresh failed");
    }
  } catch (error) {
    throw error;
  }
};
