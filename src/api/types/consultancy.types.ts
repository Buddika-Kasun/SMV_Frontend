export type ConsultancyStatus =
  | "Active_Placed"
  | "Maturing_Soon"
  | "Maturity_Reached"
  | "Returned_Closed";

export interface ConsultancyAgreement {
  id: string;
  agreementNumber: string;
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
  maturityDate: string;
  termMonths: number;
  monthlyConsultancyFee?: number;
  status: ConsultancyStatus;
  notes?: string;
  createdDate: string;
  returnRecord?: {
    id: string;
    returnDate: string;
    returnedAmount: number;
    paymentMethod: "Bank_Transfer" | "Cheque" | "Cash" | "Direct_Deposit";
    referenceNumber: string;
    processedBy: string;
    notes?: string;
  };
}

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

export interface ReturnConsultancyPayload {
  agreementId: string;
  returnRecord: ConsultancyAgreement["returnRecord"];
}
