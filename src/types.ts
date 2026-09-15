// export type LoanType = 'Instant Personal' | 'Standard Personal' | 'Business Expansion' | 'Micro Enterprise' | 'Emergency Quick';

// export type UserRole = 'admin' | 'manager' | 'staff';

// export interface User {
//   id: string;
//   username: string;
//   password?: string;
//   fullName: string;
//   role: UserRole;
//   designation: string;
//   email?: string;
//   phone?: string;
//   isActive: boolean;
//   createdAt: string;
//   lastLogin?: string;
// }

export type TabType = 
  | 'dashboard' 
  | 'applications' 
  | 'kyc' 
  | 'payments' 
  | 'settlement' 
  | 'customers' 
  // | 'consultancy' // Commented out for now as requested
  | 'users'
  | 'reports';

// export type ConsultancyStatus = 
//   | 'Active Placed' 
//   | 'Maturing Soon' 
//   | 'Maturity Reached' 
//   | 'Returned & Closed';

// export interface ConsultancyDocument {
//   id: string;
//   fileName: string;
//   fileType: string;
//   fileSize?: string;
//   fileUrl?: string; // Data URL or external image URL
//   uploadedAt: string;
// }

// export interface ConsultancyReturnRecord {
//   id: string;
//   returnDate: string;
//   returnedAmount: number;
//   paymentMethod: 'Bank Transfer' | 'Cheque' | 'Cash' | 'Direct Deposit';
//   referenceNumber: string;
//   processedBy: string;
//   notes?: string;
// }

// export interface ConsultancyAgreement {
//   id: string;
//   agreementNumber: string;
//   customerName: string;
//   customerPhone: string;
//   customerEmail: string;
//   nationalIdNumber: string;
  
//   // Bank Passbook & Last Statement Info
//   bankName: string;
//   accountNumber: string;
//   lastStatementBalance: number;
//   lastStatementDate?: string;
//   passbookDocument?: ConsultancyDocument;

//   // Placement & Terms
//   placedAmount: number;
//   startDate: string; // Placement / Onboarding date
//   maturityDate: string; // Exactly 6 months from startDate
//   termMonths: number; // Always 6 months
//   monthlyConsultancyFee?: number;
  
//   status: ConsultancyStatus;
//   notes?: string;
//   createdDate: string;
  
//   returnRecord?: ConsultancyReturnRecord;
// }

// export type RepaymentFrequency = 'Monthly' | 'Bi-Weekly' | 'Weekly';

// export type InterestMethod = 'Flat Rate' | 'Reducing Balance';

// export type LoanStatus = 
//   | 'Pending Approval' 
//   | 'KYC Pending' 
//   | 'Approved - Pending Disbursement' 
//   | 'Active' 
//   | 'Overdue' 
//   | 'Settled' 
//   | 'Early Settled' 
//   | 'Rejected';

// export type InstallmentStatus = 'Paid' | 'Pending' | 'Overdue' | 'Partially Paid';

// export interface KYCDocument {
//   id: string;
//   type: 'National ID / Passport' | 'Proof of Address' | 'Pay Slip / Bank Statement' | 'Guarantor ID' | 'Business Registration';
//   fileName: string;
//   fileUrl?: string;
//   status: 'Verified' | 'Pending Review' | 'Rejected';
//   uploadedAt: string;
// }

// export interface KYCData {
//   nationalIdNumber: string;
//   idType: 'NIC' | 'Passport' | 'Driver License';
//   dateOfBirth: string;
//   gender: string;
//   occupation: string;
//   employerName: string;
//   monthlyIncome: number;
//   addressLine: string;
//   city: string;
//   postalCode: string;
//   guarantorName: string;
//   guarantorPhone: string;
//   guarantorRelation: string;
//   // bankName: string;
//   // accountNumber: string;
//   documents: KYCDocument[];
//   isVerified: boolean;
//   verifiedBy?: string;
//   verifiedAt?: string;
// }

// export interface Installment {
//   installmentNumber: number;
//   dueDate: string;
//   principalAmount: number;
//   interestAmount: number;
//   totalInstallment: number;
//   paidAmount: number;
//   remainingAmount: number;
//   status: InstallmentStatus;
//   paidDate?: string;
//   lateFee: number;
// }

// export interface PaymentRecord {
//   id: string;
//   loanId: string;
//   customerName: string;
//   amount: number;
//   paymentDate: string;
//   paymentMethod: 'Cash' | 'Bank Transfer' | 'Debit/Credit Card' | 'Direct Debit' | 'Cheque';
//   referenceNumber: string;
//   receivedBy: string;
//   notes?: string;
//   allocatedPrincipal: number;
//   allocatedInterest: number;
//   allocatedLateFee: number;
//   installmentNumbersCovered: number[];
// }

// export interface EarlySettlementQuote {
//   calculationDate: string;
//   originalPrincipal: number;
//   principalPaidToDate: number;
//   outstandingPrincipalBalance: number;
//   accruedInterestToDate: number;
//   unearnedFutureInterestWaived: number;
//   earlySettlementPenaltyPercent: number;
//   earlySettlementPenaltyFee: number;
//   totalSettlementAmount: number;
//   totalSavingsForCustomer: number;
// }

// export interface Loan {
//   id: string;
//   accountNumber: string;
//   customerName: string;
//   customerPhone: string;
//   customerEmail?: string;
//   loanType: LoanType;
//   requestedAmount: number;
//   disbursedAmount: number;
//   interestRatePerAnnum: number;
//   termMonths: number;
//   repaymentFrequency: RepaymentFrequency;
//   interestMethod: InterestMethod;
//   processingFee: number;
//   earlySettlementPenaltyPercent: number; // e.g., 2% to 5%
//   status: LoanStatus;
//   requestedDate: string;
//   approvedDate?: string;
//   disbursedDate?: string;
//   kyc: KYCData;
//   installments: Installment[];
//   payments: PaymentRecord[];
//   earlySettlementQuote?: EarlySettlementQuote;
//   settledDate?: string;
//   totalPaidAmount: number;
//   outstandingBalance: number;
//   nextDueDate?: string;
//   nextDueAmount?: number;
//   purpose: string;
//   // creditScore: number;
// }

// export interface FinancialSummary {
//   totalLoansDisbursed: number;
//   totalDisbursedAmount: number;
//   totalOutstandingBalance: number;
//   totalCollectedAmount: number;
//   activeLoansCount: number;
//   overdueLoansCount: number;
//   pendingApprovalCount: number;
//   pendingKycCount: number;
//   settledLoansCount: number;
//   totalInterestEarned: number;
// }
