import apiClient from "../config/client";
import {
  ApiResponse,
  PaymentRecord,
  PaginationParams,
  PaginatedResponse,
} from "../types";

export const paymentEndpoint = {
  /**
   * Get all payments with pagination
   */
  getAll: (
    params?: PaginationParams & { loanId?: string },
  ): Promise<ApiResponse<PaginatedResponse<PaymentRecord>>> => {
    return apiClient.get<PaginatedResponse<PaymentRecord>>("/payments", {
      params,
    });
  },

  /**
   * Get payment by ID
   */
  getById: (id: string): Promise<ApiResponse<PaymentRecord>> => {
    return apiClient.get<PaymentRecord>(`/payments/${id}`);
  },

  /**
   * Get payments for a specific loan
   */
  getByLoanId: (
    loanId: string,
    params?: PaginationParams,
  ): Promise<ApiResponse<PaginatedResponse<PaymentRecord>>> => {
    return apiClient.get<PaginatedResponse<PaymentRecord>>(
      `/payments/loan/${loanId}`,
      { params },
    );
  },
};
