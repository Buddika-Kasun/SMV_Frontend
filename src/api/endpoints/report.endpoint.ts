import apiClient from "../config/client";
import { ApiResponse, FinancialSummary, PortfolioReport } from "../types";

export const reportEndpoint = {
  /**
   * Get portfolio summary statistics
   */
  getSummary: (): Promise<ApiResponse<FinancialSummary>> => {
    return apiClient.get<FinancialSummary>("/reports/summary");
  },

  /**
   * Get detailed portfolio report
   */
  getDetailedReport: (params?: {
    from?: string;
    to?: string;
  }): Promise<ApiResponse<PortfolioReport>> => {
    return apiClient.get<PortfolioReport>("/reports/detailed", { params });
  },
};
