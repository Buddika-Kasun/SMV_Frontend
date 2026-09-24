import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { loanService } from "../services/loan.service";
import toast from "react-hot-toast";
import { CreateLoanPayload, EarlySettlementQuote, Loan, PaymentRecord } from "../api";

interface LoanContextType {
  loans: Loan[];
  loading: boolean;
  pendingApprovalsCount: number;
  pendingKycCount: number;
  overdueCount: number;
  approveLoan: (loanId: string) => Promise<void>;
  rejectLoan: (loanId: string, reason: string) => Promise<void>;
  updateKYC: (loanId: string, updatedKYC: Loan["kyc"]) => Promise<void>;
  disburseLoan: (loanId: string, userFullName: string) => Promise<void>;
  // recordPayment: (
  //   loanId: string,
  //   amount: number,
  //   method: PaymentRecord["paymentMethod"],
  //   referenceNumber: string,
  //   receivedBy: string,
  //   notes: string,
  //   paymentDate: string,
  // ) => Promise<PaymentRecord | null>;
  // executeEarlySettlement: (
  //   loanId: string,
  //   quote: EarlySettlementQuote,
  //   paymentMethod: PaymentRecord["paymentMethod"],
  //   referenceNumber: string,
  //   receivedBy: string,
  //   notes: string,
  //   sattleDate: string,
  // ) => Promise<void>;
  createLoan: (payload: CreateLoanPayload) => Promise<void>;
  resetLoans: () => Promise<void>;
  getLoanById: (id: string) => Promise<Loan | undefined>;
  refreshLoans: () => Promise<void>;
}

const LoanContext = createContext<LoanContextType | undefined>(undefined);

export const LoanProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(false);

  // Load loans from API on mount
  useEffect(() => {
    refreshLoans();
  }, []);

  const refreshLoans = useCallback(async () => {
    // setLoading(true);
    // try {
    //   const fetchedLoans = await loanService.getAllLoans({ limit: 10 });
    //   setLoans(fetchedLoans);
    // } catch (error) {
    //   console.error("Failed to refresh loans:", error);
    //   toast.error("Failed to load loans");
    // } finally {
    //   setLoading(false);
    // }
  }, []);

  // Counts for badges
  const pendingApprovalsCount = loans.filter(
    (l) => l.status === "Pending_Approval",
  ).length;
  const pendingKycCount = loans.filter(
    (l) => l.status === "KYC_Pending",
  ).length;
  const overdueCount = loans.filter((l) => l.status === "Overdue").length;

  const approveLoan = useCallback(async (loanId: string) => {
    try {
      const updatedLoan = await loanService.approveLoan(loanId);
      setLoans((prev) => prev.map((l) => (l.id === loanId ? updatedLoan : l)));
    } catch (error) {
      // Error already handled in service
    }
  }, []);

  const rejectLoan = useCallback(async (loanId: string, reason: string) => {
    try {
      const updatedLoan = await loanService.rejectLoan(loanId, reason);
      setLoans((prev) => prev.map((l) => (l.id === loanId ? updatedLoan : l)));
    } catch (error) {
      // Error already handled in service
    }
  }, []);

  const updateKYC = useCallback(
    async (loanId: string, updatedKYC: Loan["kyc"]) => {
      try {
        const updatedLoan = await loanService.updateKYC(loanId, updatedKYC);
        setLoans((prev) =>
          prev.map((l) => (l.id === loanId ? updatedLoan : l)),
        );
      } catch (error) {
        // Error already handled in service
      }
    },
    [],
  );

  const disburseLoan = useCallback(
    async (loanId: string, userFullName: string) => {
      try {
        const updatedLoan = await loanService.disburseLoan(loanId);
        setLoans((prev) =>
          prev.map((l) => (l.id === loanId ? updatedLoan : l)),
        );
        toast.success(`Loan ${loanId} disbursed!`);
      } catch (error) {
        // Error already handled in service
      }
    },
    [],
  );

  // const recordPayment = useCallback(
  //   async (
  //     loanId: string,
  //     amount: number,
  //     method: PaymentRecord["paymentMethod"],
  //     referenceNumber: string,
  //     receivedBy: string,
  //     notes: string,
  //     paymentDate: string,
  //   ): Promise<PaymentRecord | null> => {
  //     try {
  //       const updatedLoan = await loanService.recordPayment(
  //         loanId,
  //         amount,
  //         method,
  //         referenceNumber,
  //         receivedBy,
  //         notes,
  //         paymentDate,
  //       );
  //       setLoans((prev) =>
  //         prev.map((l) => (l.id === loanId ? updatedLoan : l)),
  //       );
  //       return updatedLoan.payments?.[0] || null;
  //     } catch (error) {
  //       // Error already handled in service
  //       return null;
  //     }
  //   },
  //   [],
  // );

  const executeEarlySettlement = useCallback(
    async (
      loanId: string,
      quote: EarlySettlementQuote,
      paymentMethod: PaymentRecord["paymentMethod"],
      referenceNumber: string,
      receivedBy: string,
      notes: string,
      sattleDate: string,
    ) => {
      try {
        const updatedLoan = await loanService.executeEarlySettlement(
          loanId,
          quote,
          paymentMethod,
          referenceNumber,
          receivedBy,
          notes,
          sattleDate
        );
        setLoans((prev) =>
          prev.map((l) => (l.id === loanId ? updatedLoan : l)),
        );
      } catch (error) {
        // Error already handled in service
      }
    },
    [],
  );

  const createLoan = useCallback(async (payload: CreateLoanPayload) => {
    try {
      const newLoan = await loanService.createLoan(payload);
      // setLoans((prev) => [newLoan, ...prev]);
      await refreshLoans();
    } catch (error) {
      // Error already handled in service
    }
  }, []);

  const resetLoans = useCallback(async () => {
    try {
      // Refresh from API instead of resetting to initial
      await refreshLoans();
      toast.success("Loans refreshed from server");
    } catch (error) {
      // Error already handled
    }
  }, [refreshLoans]);

  // const getLoanById = useCallback(
  //   (id: string) => {
  //     return loans.find((l) => l.id === id);
  //   },
  //   [loans],
  // );
  const getLoanById = useCallback(async(id: string) => {
      try {
        const loan = await loanService.getLoanById(id);
        return loan;
      } catch (error) {
        // Error already handled in service
      }
    },
    [],
  );

  const value = {
    loans,
    loading,
    pendingApprovalsCount,
    pendingKycCount,
    overdueCount,
    approveLoan,
    rejectLoan,
    updateKYC,
    disburseLoan,
    // recordPayment,
    // executeEarlySettlement,
    createLoan,
    resetLoans,
    getLoanById,
    refreshLoans,
  };

  return <LoanContext.Provider value={value}>{children}</LoanContext.Provider>;
};

export const useLoans = () => {
  const context = useContext(LoanContext);
  if (!context) {
    throw new Error("useLoans must be used within LoanProvider");
  }
  return context;
};
