import apiClient from "../config/client";
import {
  ApiResponse,
  Loan,
  CreateLoanPayload,
  RecordPaymentPayload,
  ExecuteSettlementPayload,
  PaginationParams,
  PaginatedResponse,
  KYCData,
  KYCPayload,
  PaymentRecord,
  LoanStateCounts,
} from "../types";

export const loanEndpoint = {
  /**
   * Get all loans with pagination and filters
   */
  getAll: (
    params?: PaginationParams & { status?: string },
  ): Promise<ApiResponse<PaginatedResponse<Loan>>> => {
    return apiClient.get<PaginatedResponse<Loan>>("/loans", { params });
  },

  /**
   * Get all payment loans with pagination and filters
   */
  getAllPayment: (
    params?: PaginationParams & { status?: string },
  ): Promise<ApiResponse<PaginatedResponse<Loan>>> => {
    return apiClient.get<PaginatedResponse<Loan>>("/loans/payment", { params });
  },

  /**
   * Get loan by ID
   */
  getById: (id: string): Promise<ApiResponse<Loan>> => {
    return apiClient.get<Loan>(`/loans/${id}`);
  },

  /**
   * Create a new loan application
   */
  create: (payload: CreateLoanPayload): Promise<ApiResponse<Loan>> => {
    return apiClient.post<Loan>("/loans", payload);
  },

  /**
   * Approve a loan (Pending Approval -> KYC Pending)
   */
  approve: (id: string, notes?: string): Promise<ApiResponse<Loan>> => {
    return apiClient.post<Loan>(`/loans/${id}/approve`, { notes });
  },

  /**
   * Reject a loan
   */
  reject: (id: string, reason: string): Promise<ApiResponse<Loan>> => {
    return apiClient.post<Loan>(`/loans/${id}/reject`, { reason });
  },

  /**
   * Update KYC information
   */
  updateKYC: (id: string, kycData: KYCPayload): Promise<ApiResponse<Loan>> => {
    return apiClient.put<Loan>(`/loans/${id}/kyc`, { kycData });
  },

  /**
   * Disburse loan amount
   */
  disburse: (
    id: string,
    deductedFee?: number,
    notes?: string,
  ): Promise<ApiResponse<Loan>> => {
    return apiClient.post<Loan>(`/loans/${id}/disburse`, {
      ...(deductedFee !== undefined && { deductedFee }),
      ...(notes !== undefined && { notes }),
    });
  },
  /**
   * Record a payment against a loan
   */
  recordPayment: (
    payload: RecordPaymentPayload,
  ): Promise<ApiResponse<PaymentRecord>> => {
    return apiClient.post<PaymentRecord>(
      `/loans/${payload.loanId}/payment`,
      payload,
    );
  },

  /**
   * Execute early settlement
   */
  earlySettle: (
    payload: ExecuteSettlementPayload,
  ): Promise<ApiResponse<Loan>> => {
    return apiClient.post<Loan>(
      `/loans/${payload.loanId}/early-settle`,
      payload,
    );
  },

  /**
   * Delete a loan
   */
  delete: (id: string): Promise<ApiResponse<null>> => {
    return apiClient.delete<null>(`/loans/${id}`);
  },

  /**
   * Get loan status counts
   */
  getStateCounts: (): Promise<ApiResponse<LoanStateCounts>> => {
    return apiClient.get<LoanStateCounts>("/loans/state-counts");
  },

  /**
   * Get loans list by status (no pagination)
   * Pass one or more statuses — they'll be comma-joined in the URL.
   */
  getListByStatus: (statuses: string[]): Promise<ApiResponse<Loan[]>> => {
    return apiClient.get<Loan[]>(`/loans/list/${statuses.join(",")}`);
  },

  /**
   * Step 1 — Request a presigned upload URL for a document.
   */
  presignDocument: (
    loanId: string,
    input: {
      fileName: string;
      contentType: string;
      documentType: string;
    },
  ): Promise<
    ApiResponse<{
      documentId: string;
      key: string;
      uploadUrl: string;
    }>
  > => {
    return apiClient.post<{
      documentId: string;
      key: string;
      uploadUrl: string;
    }>(`/loans/${loanId}/documents/presign`, input);
  },

  /**
   * Step 3 — Attach the uploaded document to the loan record.
   */
  attachDocument: (
    loanId: string,
    input: {
      documentId: string;
      key: string;
      documentType: string;
      fileName: string;
    },
  ): Promise<ApiResponse<Loan>> => {
    return apiClient.put<Loan>(`/loans/${loanId}/documents/attach`, input);
  },
};
