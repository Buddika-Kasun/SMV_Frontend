export type RealtimeEventType =
  | "loans.changed"
  | "notification.created"
  | "payment.recorded"
  | "stats.changed"
  | "users.changed";

export interface RealtimeEvent {
  type: RealtimeEventType;
  payload: {
    action?: "created" | "approved" | "rejected" | "disbursed" | "settled";
    loanId?: string;
    paymentId?: string;
    amount?: number;
    [key: string]: any;
  };
  timestamp: string;
  userId?: string;
  roles?: string[];
}
