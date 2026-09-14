import apiClient from "../config/client";
import {
  ApiResponse,
  PaginatedResponse,
  CustomerData,
  PaginationParams,
} from "../types";

export const customerEndpoint = {
  /**
   * Get all customers with pagination + filters
   */
  getAll: (
    params?: PaginationParams & {
      status?: string;
      isVerified?: boolean;
      kycStatus?: "All" | "Verified" | "Pending";
    },
  ): Promise<ApiResponse<PaginatedResponse<CustomerData>>> => {
    return apiClient.get<PaginatedResponse<CustomerData>>("/customers", {
      params,
    });
  },

  /**
   * Get a single customer by ID
   */
  getById: (id: string): Promise<ApiResponse<CustomerData>> => {
    return apiClient.get<CustomerData>(`/customers/${id}`);
  },

  /**
   * Get KYC verification counts (initial call only — no pagination)
   */
  getStats: (): Promise<
    ApiResponse<{ total: number; verified: number; pending: number }>
  > => {
    return apiClient.get<{ total: number; verified: number; pending: number }>(
      "/customers/stats",
    );
  },

  lookupByIdNumber: (
    idNumber: string,
  ): Promise<
    ApiResponse<
      { id: string; fullName: string; idNumber: string; phone: string }[]
    >
  > => {
    return apiClient.get<
      { id: string; fullName: string; idNumber: string; phone: string }[]
    >("/customers/lookup", { params: { idNumber } });
  },
};
