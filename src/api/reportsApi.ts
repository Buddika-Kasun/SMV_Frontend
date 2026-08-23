import apiClient from './client';
import { FinancialSummary } from '../types';
import { ApiResponse } from '../types/api';

/**
 * Reports & Portfolio Analytics API Service
 * Drafted with Axios calls ready for backend activation.
 */
export const reportsApi = {
  /**
   * Fetch portfolio financial overview metrics
   */
  async getFinancialSummary(): Promise<FinancialSummary | null> {
    /* 
    // Backend API Call (Active once backend is connected):
    const response = await apiClient.get<ApiResponse<FinancialSummary>>('/reports/financial-summary');
    return response.data.data;
    */
    console.log('[API Call Drafted]: GET /reports/financial-summary');
    return null;
  },

  /**
   * Fetch disbursement ledger records
   */
  async getDisbursementLedger(dateRange?: { startDate?: string; endDate?: string }): Promise<any[]> {
    /* 
    // Backend API Call:
    const response = await apiClient.get<ApiResponse<any[]>>('/reports/disbursement-ledger', { params: dateRange });
    return response.data.data;
    */
    console.log('[API Call Drafted]: GET /reports/disbursement-ledger', dateRange);
    return [];
  },

  /**
   * Fetch installment collections ledger
   */
  async getCollectionsLedger(dateRange?: { startDate?: string; endDate?: string }): Promise<any[]> {
    /* 
    // Backend API Call:
    const response = await apiClient.get<ApiResponse<any[]>>('/reports/collections-ledger', { params: dateRange });
    return response.data.data;
    */
    console.log('[API Call Drafted]: GET /reports/collections-ledger', dateRange);
    return [];
  },

  /**
   * Fetch Portfolio at Risk (PAR) aging buckets
   */
  async getPortfolioAtRisk(): Promise<any> {
    /* 
    // Backend API Call:
    const response = await apiClient.get<ApiResponse<any>>('/reports/portfolio-at-risk');
    return response.data.data;
    */
    console.log('[API Call Drafted]: GET /reports/portfolio-at-risk');
    return null;
  },
};
