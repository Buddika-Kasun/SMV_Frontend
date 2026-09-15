import apiClient from "../config/client";
import {
  ApiResponse,
  User,
  CreateUserPayload,
  UpdateUserPayload,
  PaginationParams,
  PaginatedResponse,
} from "../types";

export const userEndpoint = {
  /**
   * Get all users with pagination
   */
  getAll: (
    params?: PaginationParams & { role?: string },
  ): Promise<ApiResponse<PaginatedResponse<User>>> => {
    return apiClient.get<PaginatedResponse<User>>("/users", { params });
  },

  /**
   * Get user by ID
   */
  getById: (id: string): Promise<ApiResponse<User>> => {
    return apiClient.get<User>(`/users/${id}`);
  },

  /**
   * Create a new user
   */
  create: (payload: CreateUserPayload): Promise<ApiResponse<User>> => {
    return apiClient.post<User>("/users", payload);
  },

  /**
   * Update an existing user
   */
  update: (
    id: string,
    payload: UpdateUserPayload,
  ): Promise<ApiResponse<User>> => {
    return apiClient.put<User>(`/users/${id}`, payload);
  },

  /**
   * Delete a user
   */
  delete: (id: string): Promise<ApiResponse<null>> => {
    return apiClient.delete<null>(`/users/${id}`);
  },

  /**
   * Reset users to default baseline (admin only)
   */
  resetDefaults: (): Promise<ApiResponse<User[]>> => {
    return apiClient.post<User[]>("/users/reset-defaults");
  },
};
