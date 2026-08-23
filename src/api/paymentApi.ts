import apiClient from './client';
import { PaymentRecord, Loan } from '../types';
import { RecordPaymentPayload } from '../types/api';

/**
 * Payments & Collections API Service
 * Dispatches payment registrations and receipts directly to backend.
 */
export const paymentApi = {
  /**
   * Record a loan installment or partial repayment
   */
  async recordPayment(payload: RecordPaymentPayload): Promise<Loan | null> {
    try {
      const response = await apiClient.post<{ success: boolean; loan: Loan }>(
        `/loans/${payload.loanId}/payment`,
        {
          amount: payload.amount,
          paymentMethod: payload.paymentMethod,
          referenceNumber: payload.referenceNumber,
          receivedBy: payload.receivedBy,
          notes: payload.notes,
          paymentDate: payload.paymentDate || new Date().toISOString().split('T')[0],
        }
      );
      return response.data.loan || null;
    } catch (err) {
      console.error('[Payment API Error] Failed to record payment:', err);
      throw err;
    }
  },

  /**
   * Fetch payment history for a specific loan
   */
  async getPaymentsByLoanId(loanId: string): Promise<PaymentRecord[]> {
    try {
      const response = await apiClient.get<{ success: boolean; loan: Loan }>(`/loans/${loanId}`);
      return response.data.loan?.payments || [];
    } catch (err) {
      console.error(`[Payment API Error] Failed to get payments for ${loanId}:`, err);
      return [];
    }
  },
};
