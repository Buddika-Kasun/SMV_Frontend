export const RefreshChannel = {
  /** Loan lists, single-loan detail, KYC queue */
  Loans: "loans",
  /** Payment lists, payment records */
  Payments: "payments",
  /** Settlement lists */
  Settlements: "settlements",
  /** Customer directory */
  Customers: "customers",
  /** Dashboard header numbers + dashboard stats */
  Stats: "stats",
  /** Sidebar nav badge counts */
  Nav: "nav",
  Users: "users",
} as const;

export type RefreshChannelKey =
  (typeof RefreshChannel)[keyof typeof RefreshChannel];
