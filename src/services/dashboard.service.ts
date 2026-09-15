import {
  dashboardEndpoint,
} from "../api/endpoints/dashboard.endpoint";
import { DashboardHeader, DashboardSearchLoan, DashboardStats, NavigationCounts } from "../api/types/dashboard.types";
import toast from "react-hot-toast";

export class DashboardService {
  private static instance: DashboardService;

  static getInstance(): DashboardService {
    if (!DashboardService.instance) {
      DashboardService.instance = new DashboardService();
    }
    return DashboardService.instance;
  }

  /**
   * Get header stats (lightweight — used frequently)
   */
  async getHeader(): Promise<DashboardHeader> {
    try {
      const response = await dashboardEndpoint.getHeader();
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || "Failed to fetch header stats");
    } catch (error: any) {
      console.error("Failed to fetch header stats:", error);
      // header is non-critical — swallow the toast
      throw error;
    }
  }

  /**
   * Get full dashboard data
   */
  async getDashboard(): Promise<DashboardStats> {
    try {
      const response = await dashboardEndpoint.getDashboard();
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || "Failed to fetch dashboard");
    } catch (error: any) {
      console.error("Failed to fetch dashboard:", error);
      toast.error(error.message || "Failed to load dashboard");
      throw error;
    }
  }

  /**
   * Quick search across loans (name, NIC, phone, loan #, account #)
   * Returns a lightweight result set for dropdowns / command palettes.
   */
  async search(q: string, limit = 8): Promise<DashboardSearchLoan[]> {
    try {
      if (!q.trim()) return [];

      const response = await dashboardEndpoint.search(q, limit);
      if (response.success && response.data) {
        return response.data.map((row: any) => ({
          id: row.id,
          loanNumber: row.loanNumber,
          status: row.status,
          requestedAmount: Number(row.requestedAmount),
          customer: {
            id: row.customer?.id ?? "",
            fullName: row.customer?.fullName ?? "",
            idNumber: row.customer?.idNumber ?? "",
          },
        }));
      }
      return [];
    } catch (error: any) {
      console.error("Dashboard search failed:", error);
      // Search is non-critical — swallow the toast, return empty
      return [];
    }
  }

  async getNavigationCounts(): Promise<NavigationCounts> {
    try {
      const response = await dashboardEndpoint.getNavigationCounts();
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || "Failed to fetch navigation counts");
    } catch (error) {
      console.error("Failed to fetch navigation counts:", error);
      // Nav badges are non-critical — return zeros so the UI doesn't break
      return { pendingApproval: 0, pendingKyc: 0, overdue: 0 };
    }
  }

}

export const dashboardService = DashboardService.getInstance();
