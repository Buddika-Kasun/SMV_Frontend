import { customerEndpoint } from "../api/endpoints/customer.endpoint";
import { CustomerData } from "../api";

export class CustomerService {
  private static instance: CustomerService;

  static getInstance(): CustomerService {
    if (!CustomerService.instance) {
      CustomerService.instance = new CustomerService();
    }
    return CustomerService.instance;
  }

  /**
   * Paginated list of customers with filters
   */
  async listCustomers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    kycStatus?: "All" | "Verified" | "Pending";
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<{ items: CustomerData[]; meta: any }> {
    try {
      const response = await customerEndpoint.getAll(params);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || "Failed to fetch customers");
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      throw error;
    }
  }

  /**
   * Single customer
   */
  async getCustomerById(id: string): Promise<CustomerData> {
    try {
      const response = await customerEndpoint.getById(id);
      if (response.success && response.data) return response.data;
      throw new Error(response.message || "Customer not found");
    } catch (error) {
      console.error(`Failed to fetch customer ${id}:`, error);
      throw error;
    }
  }

  /**
   * KYC stats (initial call)
   */
  async getStats(): Promise<{
    total: number;
    verified: number;
    pending: number;
  }> {
    try {
      const response = await customerEndpoint.getStats();
      if (response.success && response.data) return response.data;
      throw new Error(response.message || "Failed to fetch customer stats");
    } catch (error) {
      console.error("Failed to fetch customer stats:", error);
      throw error;
    }
  }

  async lookupByIdNumber(
    idNumber: string,
  ): Promise<
    { id: string; fullName: string; idNumber: string; phone: string }[]
  > {
    try {
      const response = await customerEndpoint.lookupByIdNumber(idNumber);
      if (response.success && response.data) return response.data;
      return [];
    } catch {
      return [];
    }
  }
}

export const customerService = CustomerService.getInstance();
