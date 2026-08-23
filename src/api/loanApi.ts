import apiClient from './client';
import { Loan, LoanStatus, KYCData, EarlySettlementQuote } from '../types';
import { CreateLoanPayload, ApiResponse, PaginatedResponse } from '../types/api';

/**
 * Loans API Service
 * Note: Backend Axios API calls are drafted and commented out below,
 * ready to be activated when the live backend service is connected.
 */
export const loanApi = {
  /**
   * Fetch all loan applications and active contracts
   */
  async getAllLoans(params?: { status?: LoanStatus; search?: string }): Promise<Loan[]> {
    /* 
    // Backend API Call (Active once backend is connected):
    const response = await apiClient.get<ApiResponse<Loan[]>>('/loans', { params });
    return response.data.data;
    */
    console.log('[API Call Drafted]: GET /loans', params);
    return [];
  },

  /**
   * Fetch a single loan by its ID
   */
  async getLoanById(loanId: string): Promise<Loan | null> {
    /* 
    // Backend API Call:
    const response = await apiClient.get<ApiResponse<Loan>>(`/loans/${loanId}`);
    return response.data.data;
    */
    console.log(`[API Call Drafted]: GET /loans/${loanId}`);
    return null;
  },

  /**
   * Create a new loan application
   */
  async createLoan(payload: CreateLoanPayload): Promise<Loan | null> {
    /* 
    // Backend API Call:
    const response = await apiClient.post<ApiResponse<Loan>>('/loans', payload);
    return response.data.data;
    */
    console.log('[API Call Drafted]: POST /loans', payload);
    return null;
  },

  /**
   * Approve a pending loan application (transition to KYC Pending)
   */
  async approveLoan(loanId: string, notes?: string): Promise<Loan | null> {
    /* 
    // Backend API Call:
    const response = await apiClient.post<ApiResponse<Loan>>(`/loans/${loanId}/approve`, { notes });
    return response.data.data;
    */
    console.log(`[API Call Drafted]: POST /loans/${loanId}/approve`, { notes });
    return null;
  },

  /**
   * Reject a loan application with reason
   */
  async rejectLoan(loanId: string, reason?: string): Promise<Loan | null> {
    /* 
    // Backend API Call:
    const response = await apiClient.post<ApiResponse<Loan>>(`/loans/${loanId}/reject`, { reason });
    return response.data.data;
    */
    console.log(`[API Call Drafted]: POST /loans/${loanId}/reject`, { reason });
    return null;
  },

  /**
   * Update KYC information and document verification statuses
   */
  async updateKYC(loanId: string, kycData: KYCData): Promise<Loan | null> {
    /* 
    // Backend API Call:
    const response = await apiClient.put<ApiResponse<Loan>>(`/loans/${loanId}/kyc`, kycData);
    return response.data.data;
    */
    console.log(`[API Call Drafted]: PUT /loans/${loanId}/kyc`, kycData);
    return null;
  },

  /**
   * Upload a KYC verification document
   */
  async uploadKYCDocument(loanId: string, file: File, documentType: string): Promise<any> {
    /* 
    // Backend API Call:
    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentType', documentType);
    const response = await apiClient.post<ApiResponse<any>>(`/loans/${loanId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.data;
    */
    console.log(`[API Call Drafted]: POST /loans/${loanId}/documents`, { documentType, fileName: file.name });
    return null;
  },

  /**
   * Disburse approved loan funds to borrower
   */
  async disburseLoan(loanId: string, disbursementDate?: string): Promise<Loan | null> {
    /* 
    // Backend API Call:
    const response = await apiClient.post<ApiResponse<Loan>>(`/loans/${loanId}/disburse`, { 
      disbursementDate: disbursementDate || new Date().toISOString().split('T')[0] 
    });
    return response.data.data;
    */
    console.log(`[API Call Drafted]: POST /loans/${loanId}/disburse`, { disbursementDate });
    return null;
  },

  /**
   * Calculate real-time early settlement quote
   */
  async getEarlySettlementQuote(loanId: string, settlementDate: string): Promise<EarlySettlementQuote | null> {
    /* 
    // Backend API Call:
    const response = await apiClient.get<ApiResponse<EarlySettlementQuote>>(`/loans/${loanId}/early-settlement-quote`, {
      params: { settlementDate }
    });
    return response.data.data;
    */
    console.log(`[API Call Drafted]: GET /loans/${loanId}/early-settlement-quote`, { settlementDate });
    return null;
  },

  /**
   * Execute early payoff & settlement
   */
  async executeEarlySettlement(payload: {
    loanId: string;
    quote: EarlySettlementQuote;
    paymentMethod: string;
    referenceNumber: string;
    receivedBy: string;
    notes?: string;
  }): Promise<Loan | null> {
    /* 
    // Backend API Call:
    const response = await apiClient.post<ApiResponse<Loan>>(`/loans/${payload.loanId}/early-settle`, payload);
    return response.data.data;
    */
    console.log(`[API Call Drafted]: POST /loans/${payload.loanId}/early-settle`, payload);
    return null;
  },
};
