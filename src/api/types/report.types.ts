export interface FinancialSummary {
  totalLoansDisbursed: number;
  totalDisbursedAmount: number;
  totalOutstandingBalance: number;
  totalCollectedAmount: number;
  activeLoansCount: number;
  overdueLoansCount: number;
  pendingApprovalCount: number;
  pendingKycCount: number;
  settledLoansCount: number;
  totalInterestEarned: number;
}

export interface PortfolioReport extends FinancialSummary {
  loansByType: {
    [key: string]: number;
  };
  loansByStatus: {
    [key: string]: number;
  };
  monthlyCollections: {
    month: string;
    amount: number;
  }[];
}
