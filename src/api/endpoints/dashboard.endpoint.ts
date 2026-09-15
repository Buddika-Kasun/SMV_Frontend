import apiClient from "../config/client";
import { ApiResponse } from "../types";
import { DashboardHeader, DashboardSearchLoan, DashboardStats, NavigationCounts } from "../types/dashboard.types";

export const dashboardEndpoint = {
  /**
   * Get header stats (lightweight — total disbursed + total outstanding)
   */
  getHeader: (): Promise<ApiResponse<DashboardHeader>> => {
    return apiClient.get<DashboardHeader>("/dashboard/header");
  },

  /**
   * Get full dashboard (stats, pending actions, latest loans)
   */
  getDashboard: (): Promise<ApiResponse<DashboardStats>> => {
    return apiClient.get<DashboardStats>("/dashboard");
  },

  /**
   * Quick search across loans (name, NIC, phone, loan #, account #)
   */
  search: (
    q: string,
    limit = 8,
  ): Promise<ApiResponse<DashboardSearchLoan[]>> => {
    return apiClient.get<DashboardSearchLoan[]>("/dashboard/search", {
      params: { q, limit },
    });
  },

  getNavigationCounts: (): Promise<ApiResponse<NavigationCounts>> => {
    return apiClient.get<NavigationCounts>("/dashboard/navigation-counts");
  },

};
