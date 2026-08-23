import { 
  Loan, 
  LoanStatus, 
  KYCData, 
  KYCDocument, 
  PaymentRecord, 
  EarlySettlementQuote, 
  ConsultancyAgreement, 
  ConsultancyReturnRecord,
  FinancialSummary 
} from '../types';

/**
 * Standard API Response envelope
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

/**
 * Paginated API Response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * New Loan Application Request Payload
 */
export interface CreateLoanPayload {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  nationalIdNumber: string;
  loanType: Loan['loanType'];
  requestedAmount: number;
  interestRatePerAnnum: number;
  termMonths: number;
  repaymentFrequency: Loan['repaymentFrequency'];
  interestMethod: Loan['interestMethod'];
  purpose: string;
  monthlyIncome: number;
  occupation: string;
  employerName: string;
  addressLine: string;
  city: string;
  postalCode: string;
  guarantorName: string;
  guarantorPhone: string;
  guarantorRelation: string;
  bankName: string;
  accountNumber: string;
}

/**
 * Payment Submission Request Payload
 */
export interface RecordPaymentPayload {
  loanId: string;
  amount: number;
  paymentMethod: PaymentRecord['paymentMethod'];
  referenceNumber: string;
  receivedBy: string;
  notes?: string;
  paymentDate: string;
}

/**
 * Early Settlement Execution Payload
 */
export interface ExecuteSettlementPayload {
  loanId: string;
  quote: EarlySettlementQuote;
  paymentMethod: PaymentRecord['paymentMethod'];
  referenceNumber: string;
  receivedBy: string;
  notes?: string;
  settlementDate: string;
}

/**
 * KYC Update Payload
 */
export interface UpdateKYCPayload {
  loanId: string;
  kyc: KYCData;
}

/**
 * Onboard Consultancy Agreement Payload
 */
export interface CreateConsultancyPayload {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  nationalIdNumber: string;
  bankName: string;
  accountNumber: string;
  lastStatementBalance: number;
  lastStatementDate?: string;
  placedAmount: number;
  startDate: string;
  monthlyConsultancyFee?: number;
  notes?: string;
}

/**
 * Return Consultancy Funds Payload
 */
export interface ReturnConsultancyPayload {
  agreementId: string;
  returnRecord: ConsultancyReturnRecord;
}
