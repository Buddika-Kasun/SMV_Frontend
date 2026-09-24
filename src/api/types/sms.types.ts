export interface SMSLogEntry {
  id: string;
  timestamp: string;
  recipient: string;
  originalPhone: string;
  message: string;
  loanId?: string;
  customerName?: string;
  amount?: number;
  status: "DELIVERED" | "SENT" | "FAILED";
  gatewayResponse?: any;
  error?: string;
}

export interface SendSMSPayload {
  recipient: string;
  message: string;
  loanId?: string;
  customerName?: string;
  amount?: number;
}
