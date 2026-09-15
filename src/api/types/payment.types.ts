export type PaymentMethod =
  | "Cash"
  | "Bank_Transfer"
  | "Debit_Credit_Card"
  | "Direct_Debit"
  | "Cheque";

export type SMSPaymentStatus = "SENT" | "FAILED" | "PENDING" | "SKIPPED";

export interface PaymentRecord {
  id: string;
  loanId: string;
  customerName: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  principalPortion: number;
  interestPortion: number;
  referenceNumber: string;
  receivedBy: string;
  notes?: string;
  allocatedPrincipal: number;
  allocatedInterest: number;
  allocatedLateFee: number;
  installmentNumbersCovered: number[];
  smsStatus?: SMSPaymentStatus;
  smsRecipient?: string;
  smsMessage?: string;
}

export interface RecordPaymentPayload {
  loanId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber: string;
  receivedBy: string;
  notes?: string;
  paymentDate?: string;
}
