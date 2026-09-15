import apiClient from "../config/client";
import {
  ApiResponse,
  SendSMSPayload,
  SMSLogEntry,
  PaginationParams,
  PaginatedResponse,
} from "../types";

export const smsEndpoint = {
  /**
   * Send SMS notification
   */
  send: (
    payload: SendSMSPayload,
  ): Promise<ApiResponse<{ messageId: string; status: string }>> => {
    return apiClient.post("/sms/send", payload);
  },

  /**
   * Get SMS logs with pagination
   */
  getLogs: (
    params?: PaginationParams,
  ): Promise<ApiResponse<PaginatedResponse<SMSLogEntry>>> => {
    return apiClient.get<PaginatedResponse<SMSLogEntry>>("/sms/logs", {
      params,
    });
  },

  /**
   * Get SMS logs for a specific loan
   */
  getLogsByLoanId: (
    loanId: string,
    params?: PaginationParams,
  ): Promise<ApiResponse<PaginatedResponse<SMSLogEntry>>> => {
    return apiClient.get<PaginatedResponse<SMSLogEntry>>(
      `/sms/logs/loan/${loanId}`,
      { params },
    );
  },
};
