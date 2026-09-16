import { PaymentMethod, PaymentRecord } from "./payment.types";

export type LoanType =
  | "Instant_Personal"
  | "Standard_Personal"
  | "Business_Expansion"
  | "Micro_Enterprise"
  | "Emergency_Quick";

export type LoanStatus =
  | "Pending_Approval"
  | "KYC_Pending"
  | "Approved_Pending_Disbursement"
  | "Active"
  | "Overdue"
  | "Settled"
  | "Early_Settled"
  | "Rejected";

export type InstallmentStatus =
  | "Paid"
  | "Pending"
  | "Overdue"
  | "Partially_Paid";

export type RepaymentFrequency = "Monthly" | "Bi-Weekly" | "Weekly";
export type InterestMethod = "Flat_Rate" | "Reducing_Balance";

export interface Installment {
  installmentNumber: number;
  dueDate: string;
  principalAmount: number;
  interestAmount: number;
  totalInstallment: number;
  paidAmount: number;
  remainingAmount: number;
  status: InstallmentStatus;
  paidDate?: string;
  lateFee: number;
}

export interface KYCDocument {
  id: string;
  type:
    | "National_ID_Passport"
    | "Proof_of_Address"
    | "Pay_Slip_Bank_Statement"
    | "Guarantor_ID"
    | "Business_Registration";
  fileName: string;
  fileUrl?: string;
  status: "Verified" | "Pending_Review" | "Rejected";
  uploadedAt: string;
}

export interface KYCData {
  idNumber: string;
  idType: "NIC" | "Passport" | "Driver_License";
  dateOfBirth: string;
  gender: string;
  occupation: string;
  employerName: string;
  monthlyIncome: number;
  addressLine: string;
  city: string;
  postalCode: string;
  guarantorName: string;
  guarantorPhone: string;
  guarantorRelation: string;
  bankName: string;
  accountNumber: string;
  documents: KYCDocument[];
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface KYCPayload {
  customer: Partial<CustomerData>;
  guarantor: Partial<GuarantorData>;
}

export type IdType = "NIC" | "Passport" | "Driver_License" | "Other";

export interface CustomerData {
  id: string;
  customerNumber: string;
  fullName: string;
  phone: string;
  email?: string;
  idNumber: string;
  idType: IdType;
  dateOfBirth?: string;
  gender?: string;
  occupation?: string;
  employerName?: string;
  monthlyIncome?: number;
  addressLine?: string;
  city?: string;
  postalCode?: string;
  isVerified?: boolean;
  loans?: Loan[];
  createdAt: string;
  updatedAt: string;
}

export interface GuarantorData {
  id: string;
  fullName: string;
  phone: string;
  relation?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EarlySettlementQuote {
  calculationDate: string;
  originalPrincipal: number;
  principalPaidToDate: number;
  outstandingPrincipalBalance: number;
  accruedInterestToDate: number;
  unearnedFutureInterestWaived: number;
  earlySettlementPenaltyPercent: number;
  earlySettlementPenaltyFee: number;
  totalSettlementAmount: number;
  totalSavingsForCustomer: number;
}

export interface AccountData {
  id: string;
  accountNumber: string;
  disbursedAmount: number;
  totalCollected: number;
  remainingBalance: number;
  createdAt: string;
  updatedAt: string;
}

export type DocumentType =
  | "National_ID_Passport"
  | "Proof_of_Address"
  | "Pay_Slip_Bank_Statement"
  | "Guarantor_ID"
  | "Business_Registration";

export type DocumentStatus = "Pending_Review" | "Verified" | "Rejected";

export interface LoanDocument {
  id: string;
  loanId: string;
  documentType: DocumentType;
  fileName: string;
  fileKey: string;
  fileUrl: string;
  status: DocumentStatus;
  uploadedAt: string;
  verifiedAt: string | null;
  verifiedBy: string | null;
  notes: string | null;
}

export interface Loan {
  id: string;
  loanNumber: string;
  // accountNumber: string;
  account?: AccountData;
  customer?: CustomerData;
  // customerName: string;
  // customerNumber: string;
  // customerPhone: string;
  // customerEmail: string;
  guarantor?: GuarantorData;
  loanType: LoanType;
  requestedAmount: number;
  // disbursedAmount: number;
  interestRatePerAnnum: number;
  termMonths: number;
  repaymentFrequency: RepaymentFrequency;
  interestMethod: InterestMethod;
  processingFee: number;
  earlySettlementPenaltyPercent: number;
  status: LoanStatus;
  requestedDate: string;
  approvedDate?: string;
  disbursedDate?: string;
  kyc?: KYCData;
  documents?: LoanDocument[];
  installments: Installment[];
  payments: PaymentRecord[];
  earlySettlementQuote?: EarlySettlementQuote;
  settledDate?: string;
  totalPaidAmount: number;
  outstandingBalance: number;
  nextDueDate?: string;
  nextDueAmount?: number;
  purpose: string;
  // creditScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLoanPayload {
  customerName: string;
  customerPhone: string;
  // customerEmail: string;
  idNumber: string;
  loanType: LoanType;
  requestedAmount: number;
  interestRatePerAnnum: number;
  termMonths: number;
  repaymentFrequency: string;
  interestMethod: InterestMethod;
  purpose: string;
  disbursedAmount: number;
  processingFee: number;
  earlySettlementPenaltyPercent: number;
  // monthlyIncome: number;
  // occupation: string;
  // employerName: string;
  // addressLine: string;
  // city: string;
  // postalCode: string;
  // guarantorName: string;
  // guarantorPhone: string;
  // guarantorRelation: string;
  // bankName: string;
  // accountNumber: string;
  // dateOfBirth?: string;
  // gender?: string;
}

export interface ExecuteSettlementPayload {
  loanId: string;
  quote: EarlySettlementQuote;
  paymentMethod: PaymentMethod;
  referenceNumber: string;
  receivedBy: string;
  notes?: string;
  settlementDate?: string;
}
