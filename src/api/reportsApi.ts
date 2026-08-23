import apiClient from './client';
import { FinancialSummary } from '../types';

/**
 * Reports & Portfolio Analytics API Service
 */
export const reportsApi = {
  /**
   * Fetch portfolio financial overview metrics from backend
   */
  async getFinancialSummary(): Promise<FinancialSummary | null> {
    try {
      const response = await apiClient.get<{ success: boolean; summary: FinancialSummary }>('/reports/summary');
      return response.data.summary || null;
    } catch (err) {
      console.warn('[Reports API Error] Could not fetch summary from backend:', err);
      return null;
    }
  },
};
