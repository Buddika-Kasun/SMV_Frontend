import { loanEndpoint } from "../api/endpoints/loan.endpoint";
import toast from "react-hot-toast";
import { CreateLoanPayload, EarlySettlementQuote, Loan, PaymentRecord } from "../api";

export class LoanService {
  private static instance: LoanService;

  static getInstance(): LoanService {
    if (!LoanService.instance) {
      LoanService.instance = new LoanService();
    }
    return LoanService.instance;
  }

  /**
   * Fetch all loans with pagination and filters
   */
  async getAllLoans(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<Loan[]> {
    try {
      const response = await loanEndpoint.getAll(params);
      if (response.success && response.data) {
        return response.data.items;
      }
      throw new Error(response.message || "Failed to fetch loans");
    } catch (error) {
      console.error("Failed to fetch loans:", error);
      throw error;
    }
  }

  async listLoans(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<{ items: Loan[]; meta: any }> {
    try {
      const response = await loanEndpoint.getAll(params);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || "Failed to fetch loans");
    } catch (error) {
      console.error("Failed to fetch loans:", error);
      throw error;
    }
  }

  async listPaymentLoans(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<{ items: Loan[]; meta: any }> {
    try {
      const response = await loanEndpoint.getAllPayment(params);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || "Failed to fetch loans");
    } catch (error) {
      console.error("Failed to fetch loans:", error);
      throw error;
    }
  }

  /**
   * Get a single loan by ID
   */
  async getLoanById(id: string): Promise<Loan> {
    try {
      const response = await loanEndpoint.getById(id);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || "Loan not found");
    } catch (error) {
      console.error(`Failed to fetch loan ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new loan application
   */
  async createLoan(payload: CreateLoanPayload): Promise<Loan> {
    try {
      const response = await loanEndpoint.create(payload);
      if (response.success && response.data) {
        toast.success("Loan application created successfully!");
        return response.data;
      }
      throw new Error(response.message || "Failed to create loan");
    } catch (error: any) {
      console.error("Failed to create loan:", error);
      toast.error(error.message || "Failed to create loan");
      throw error;
    }
  }

  /**
   * Approve a loan (Pending Approval -> KYC Pending)
   */
  async approveLoan(id: string, notes?: string): Promise<Loan> {
    try {
      const response = await loanEndpoint.approve(id, notes);
      if (response.success && response.data) {
        toast.success(`Loan ${response.data?.loanNumber} approved!`);
        return response.data;
      }
      throw new Error(response.message || "Failed to approve loan");
    } catch (error: any) {
      console.error("Failed to approve loan:", error);
      toast.error(error.message || "Failed to approve loan");
      throw error;
    }
  }

  /**
   * Reject a loan
   */
  async rejectLoan(id: string, reason: string): Promise<Loan> {
    try {
      const response = await loanEndpoint.reject(id, reason);
      if (response.success && response.data) {
        toast.error(`Loan ${response.data?.loanNumber} rejected`);
        return response.data;
      }
      throw new Error(response.message || "Failed to reject loan");
    } catch (error: any) {
      console.error("Failed to reject loan:", error);
      toast.error(error.message || "Failed to reject loan");
      throw error;
    }
  }

  /**
   * Update KYC information
   */
  async updateKYC(id: string, kycData: any): Promise<Loan> {
    try {
      const response = await loanEndpoint.updateKYC(id, kycData);
      if (response.success && response.data) {
        toast.success("KYC updated successfully!");
        return response.data;
      }
      throw new Error(response.message || "Failed to update KYC");
    } catch (error: any) {
      console.error("Failed to update KYC:", error);
      toast.error(error.message || "Failed to update KYC");
      throw error;
    }
  }

  /**
   * Disburse a loan
   */
  async disburseLoan(
    id: string,
    deductedFee?: number,
    notes?: string,
  ): Promise<Loan> {
    try {
      const response = await loanEndpoint.disburse(id, deductedFee, notes);
      if (response.success && response.data) {
        toast.success(
          `Loan ${response.data?.loanNumber} disbursed successfully!`,
        );
        return response.data;
      }
      throw new Error(response.message || "Failed to disburse loan");
    } catch (error: any) {
      console.error("Failed to disburse loan:", error);
      toast.error(error.message || "Failed to disburse loan");
      throw error;
    }
  }

  /**
   * Record a payment against a loan
   */
  async recordPayment(
    loanId: string,
    amount: number,
    method: PaymentRecord["paymentMethod"],
    referenceNumber: string,
    receivedBy: string,
    notes: string,
    paymentDate: string,
  ): Promise<PaymentRecord> {
    try {
      const payload = {
        loanId,
        amount,
        paymentMethod: method,
        referenceNumber,
        receivedBy,
        notes,
        paymentDate,
      };

      const response = await loanEndpoint.recordPayment(payload);
      if (response.success && response.data) {
        toast.success("Payment recorded successfully!");
        return response.data;
      }
      throw new Error(response.message || "Failed to record payment");
    } catch (error: any) {
      console.error("Failed to record payment:", error);
      toast.error(error.message || "Failed to record payment");
      throw error;
    }
  }

  /**
   * Execute early settlement
   */
  async executeEarlySettlement(
    loanId: string,
    quote: EarlySettlementQuote,
    paymentMethod: PaymentRecord["paymentMethod"],
    referenceNumber: string,
    receivedBy: string,
    notes: string,
    settlementDate: string,
  ): Promise<Loan> {
    try {
      const payload = {
        loanId,
        quote,
        paymentMethod,
        referenceNumber,
        receivedBy,
        notes,
        settlementDate,
      };

      const response = await loanEndpoint.earlySettle(payload);
      if (response.success && response.data) {
        toast.success("Loan settled early successfully!");
        return response.data;
      }
      throw new Error(response.message || "Failed to settle loan early");
    } catch (error: any) {
      console.error("Failed to settle loan early:", error);
      toast.error(error.message || "Failed to settle loan early");
      throw error;
    }
  }

  /**
   * Delete a loan
   */
  async deleteLoan(id: string): Promise<void> {
    try {
      const response = await loanEndpoint.delete(id);
      if (response.success) {
        toast.success("Loan deleted successfully!");
        return;
      }
      throw new Error(response.message || "Failed to delete loan");
    } catch (error: any) {
      console.error("Failed to delete loan:", error);
      toast.error(error.message || "Failed to delete loan");
      throw error;
    }
  }

  /**
   * Get loans list by status (no pagination, minimal payload)
   */
  async getLoansListByStatus(status: string[]): Promise<Loan[]> {
    try {
      const response = await loanEndpoint.getListByStatus(status);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || "Failed to fetch loans by status");
    } catch (error: any) {
      console.error(`Failed to fetch loans with status "${status}":`, error);
      // toast.error(error.message || "Failed to fetch loans");
      throw error;
    }
  }

  async presignDocument(
    loanId: string,
    input: {
      fileName: string;
      contentType: string;
      documentType: string;
    },
  ): Promise<{ documentId: string; key: string; uploadUrl: string }> {
    const response = await loanEndpoint.presignDocument(loanId, input);
    if (response.success && response.data) return response.data;
    throw new Error(response.message || "Failed to get presigned URL");
  }

  async attachDocument(
    loanId: string,
    input: {
      documentId: string;
      key: string;
      documentType: string;
      fileName: string;
    },
  ): Promise<Loan> {
    const response = await loanEndpoint.attachDocument(loanId, input);
    if (response.success && response.data) return response.data;
    throw new Error(response.message || "Failed to attach document");
  }

  // ---------------------------------------------------------------------------
  // Local utility methods (for frontend calculations without API calls)
  // ---------------------------------------------------------------------------

  /**
   * Generate installment schedule locally (for preview)
   */
  // generateSchedule(
  //   principal: number,
  //   annualRate: number,
  //   termMonths: number,
  //   frequency: any,
  //   method: any,
  //   startDate?: string,
  // ) {
  //   return generateInstallmentSchedule(
  //     principal,
  //     annualRate,
  //     termMonths,
  //     frequency,
  //     method,
  //     startDate,
  //   );
  // }

  /**
   * Recalculate loan state locally
   */
  // recalculateState(loan: Loan): Loan {
  //   return recalculateLoanState(loan);
  // }

  /**
   * Format currency for display
   */
  formatCurrency(amount: number): string {
    const formatted = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount || 0);
    return `LKR ${formatted}`;
  }
}

export const loanService = LoanService.getInstance();
