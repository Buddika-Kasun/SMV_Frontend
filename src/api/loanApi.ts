import apiClient from './client';
import { Loan, LoanStatus, KYCData, EarlySettlementQuote, PaymentRecord } from '../types';
import { CreateLoanPayload, ApiResponse } from '../types/api';

/**
 * Real Backend Loan API Service
 * Makes HTTP REST calls directly to the Express + PostgreSQL backend.
 */
export const loanApi = {
  /**
   * Fetch all loan applications and active contracts from backend
   */
  async getAllLoans(params?: { status?: LoanStatus; search?: string }): Promise<Loan[]> {
    try {
      const response = await apiClient.get<{ success: boolean; count: number; loans: Loan[] }>('/loans', { params });
      if (response.data && response.data.loans) {
        return response.data.loans;
      }
      return [];
    } catch (err) {
      console.warn('[Loan API Error] Could not fetch loans from backend:', err);
      return [];
    }
  },

  /**
   * Fetch a single loan by its ID
   */
  async getLoanById(loanId: string): Promise<Loan | null> {
    try {
      const response = await apiClient.get<{ success: boolean; loan: Loan }>(`/loans/${loanId}`);
      return response.data.loan || null;
    } catch (err) {
      console.warn(`[Loan API Error] Could not fetch loan ${loanId}:`, err);
      return null;
    }
  },

  /**
   * Create a new loan application in database
   */
  async createLoan(payload: CreateLoanPayload | any): Promise<Loan | null> {
    try {
      const response = await apiClient.post<{ success: boolean; loan: Loan; message: string }>('/loans', payload);
      return response.data.loan || null;
    } catch (err) {
      console.error('[Loan API Error] Failed to create loan:', err);
      throw err;
    }
  },

  /**
   * Approve a pending loan application (transition to KYC Pending)
   */
  async approveLoan(loanId: string, notes?: string): Promise<Loan | null> {
    try {
      const response = await apiClient.post<{ success: boolean; loan: Loan }>(`/loans/${loanId}/approve`, { notes });
      return response.data.loan || null;
    } catch (err) {
      console.error(`[Loan API Error] Failed to approve loan ${loanId}:`, err);
      throw err;
    }
  },

  /**
   * Reject a loan application with reason
   */
  async rejectLoan(loanId: string, reason?: string): Promise<Loan | null> {
    try {
      const response = await apiClient.post<{ success: boolean; loan: Loan }>(`/loans/${loanId}/reject`, { reason });
      return response.data.loan || null;
    } catch (err) {
      console.error(`[Loan API Error] Failed to reject loan ${loanId}:`, err);
      throw err;
    }
  },

  /**
   * Update KYC information and document verification statuses
   */
  async updateKYC(loanId: string, kycData: KYCData): Promise<Loan | null> {
    try {
      const response = await apiClient.put<{ success: boolean; loan: Loan }>(`/loans/${loanId}/kyc`, { kycData });
      return response.data.loan || null;
    } catch (err) {
      console.error(`[Loan API Error] Failed to update KYC for ${loanId}:`, err);
      throw err;
    }
  },

  /**
   * Disburse approved loan funds to borrower
   */
  async disburseLoan(loanId: string, disbursementDate?: string): Promise<Loan | null> {
    try {
      const response = await apiClient.post<{ success: boolean; loan: Loan }>(`/loans/${loanId}/disburse`, { 
        disbursementDate: disbursementDate || new Date().toISOString().split('T')[0] 
      });
      return response.data.loan || null;
    } catch (err) {
      console.error(`[Loan API Error] Failed to disburse loan ${loanId}:`, err);
      throw err;
    }
  },

  /**
   * Record payment against a loan
   */
  async recordPayment(loanId: string, payment: PaymentRecord): Promise<Loan | null> {
    try {
      const response = await apiClient.post<{ success: boolean; loan: Loan }>(`/loans/${loanId}/payment`, payment);
      return response.data.loan || null;
    } catch (err) {
      console.error(`[Loan API Error] Failed to record payment on ${loanId}:`, err);
      throw err;
    }
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
    try {
      const response = await apiClient.post<{ success: boolean; loan: Loan }>(`/loans/${payload.loanId}/early-settle`, payload);
      return response.data.loan || null;
    } catch (err) {
      console.error(`[Loan API Error] Failed to execute early settlement for ${payload.loanId}:`, err);
      throw err;
    }
  },

  /**
   * Delete loan record
   */
  async deleteLoan(loanId: string): Promise<boolean> {
    try {
      const response = await apiClient.delete<{ success: boolean }>(`/loans/${loanId}`);
      return response.data.success;
    } catch (err) {
      console.error(`[Loan API Error] Failed to delete loan ${loanId}:`, err);
      return false;
    }
  }
};
