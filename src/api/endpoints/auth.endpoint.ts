import apiClient from "../config/client";
import {
  ApiResponse,
  LoginPayload,
  LoginResponse,
  RefreshTokenResponse,
  User,
} from "../types";
import { TokenService } from "../services/token.service";

export const authEndpoint = {
  /**
   * Authenticate user and get tokens
   */
  login: async (payload: LoginPayload): Promise<ApiResponse<LoginResponse>> => {
    const response = await apiClient.post<LoginResponse>(
      "/auth/login",
      payload,
    );

    if (response.success && response.data) {
      // Store tokens and user data
      TokenService.setTokens(
        response.data.accessToken,
        response.data.refreshToken,
        response.data.expiresIn,
      );
      TokenService.setUser(response.data.user);
    }

    return response;
  },

  /**
   * Refresh access token
   */
  refreshToken: async (
    refreshToken: string,
  ): Promise<ApiResponse<RefreshTokenResponse>> => {
    return apiClient.post<RefreshTokenResponse>("/auth/refresh", {
      refreshToken,
    });
  },

  /**
   * Get current authenticated user details
   */
  getMe: (): Promise<ApiResponse<User>> => {
    return apiClient.get<User>("/auth/me");
  },

  /**
   * Logout user - clear all stored data
   */
  logout: (): void => {
    TokenService.clearTokens();
    window.dispatchEvent(new Event("auth:logout"));
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    const token = TokenService.getAccessToken();
    if (!token) return false;
    return !TokenService.isTokenExpired();
  },

  /**
   * Get stored user
   */
  getStoredUser: (): User | null => {
    return TokenService.getUser();
  },

  /**
   * Get stored token
   */
  getStoredToken: (): string | null => {
    return TokenService.getAccessToken();
  },

  /**
   * Check if token needs refresh (expiring soon)
   */
  shouldRefreshToken: (): boolean => {
    return TokenService.isTokenExpiringSoon();
  },
};
