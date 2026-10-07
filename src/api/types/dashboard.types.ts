export interface DashboardHeader {
  totalDisbursedAmount: number;
  totalOutstanding: number;
  smsUnit: number;
}

export interface DashboardLoanRow {
  id: string;
  loanNumber: string;
  accountNumber: string | null;
  customerId: string;
  customerName: string;
  loanType: string;
  requestedAmount: number;
  disbursedAmount: number;
  totalPaidAmount: number;
  outstandingBalance: number;
  paidProgressPercent: number;
  status: string;
  requestedDate: string;
  nextDueDate?: string;
  nextDueAmount?: number;
}

export interface DashboardStats {
  totalDisbursedAmount: number;
  totalOutstanding: number;
  totalCollected: number;
  disbursedLoanCount: number;
  settledLoanCount: number;
  pendingActions: {
    total: number;
    pendingApproval: number;
    kycPending: number;
    pendingDisbursement: number;
  };
  latestLoans: DashboardLoanRow[];
}

// ---------------------------------------------------------
// Quick Search (lightweight loan row)
// ---------------------------------------------------------
export interface DashboardSearchLoan {
  id: string;
  loanNumber: string;
  status: string;
  requestedAmount: number;
  customer: {
    id: string;
    fullName: string;
    idNumber: string;
  };
}

export interface NavigationCounts {
  pendingApproval: number;
  pendingKyc: number;
  overdue: number;
}
