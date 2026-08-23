import apiClient from './client';
import { PaymentRecord } from '../types';
import { RecordPaymentPayload, ApiResponse } from '../types/api';

/**
 * Payments & Collections API Service
 * Drafted with Axios calls ready for backend activation.
 */
export const paymentApi = {
  /**
   * Record a loan installment or partial repayment
   */
  async recordPayment(payload: RecordPaymentPayload): Promise<PaymentRecord | null> {
    /* 
    // Backend API Call (Active once backend is connected):
    const response = await apiClient.post<ApiResponse<PaymentRecord>>('/payments', payload);
    return response.data.data;
    */
    console.log('[API Call Drafted]: POST /payments', payload);
    return null;
  },

  /**
   * Fetch payment history for a specific loan
   */
  async getPaymentsByLoanId(loanId: string): Promise<PaymentRecord[]> {
    /* 
    // Backend API Call:
    const response = await apiClient.get<ApiResponse<PaymentRecord[]>>(`/loans/${loanId}/payments`);
    return response.data.data;
    */
    console.log(`[API Call Drafted]: GET /loans/${loanId}/payments`);
    return [];
  },

  /**
   * Get printable receipt data by payment ID
   */
  async getPaymentReceipt(paymentId: string): Promise<any> {
    /* 
    // Backend API Call:
    const response = await apiClient.get<ApiResponse<any>>(`/payments/${paymentId}/receipt`);
    return response.data.data;
    */
    console.log(`[API Call Drafted]: GET /payments/${paymentId}/receipt`);
    return null;
  },
};
