// Export all types
export * from "./types";

// Export all endpoints
export * from "./endpoints";

// Export token service
export { TokenService } from "./services/token.service";

// Export config
export * from "./config/client";

// Export interceptors
export * from "./interceptors/token.interceptor";

// Combine all endpoints into a single object
import { authEndpoint } from "./endpoints/auth.endpoint";
import { userEndpoint } from "./endpoints/user.endpoint";
import { loanEndpoint } from "./endpoints/loan.endpoint";
import { paymentEndpoint } from "./endpoints/payment.endpoint";
import { consultancyEndpoint } from "./endpoints/consultancy.endpoint";
import { reportEndpoint } from "./endpoints/report.endpoint";
import { smsEndpoint } from "./endpoints/sms.endpoint";

export const api = {
  auth: authEndpoint,
  users: userEndpoint,
  loans: loanEndpoint,
  payments: paymentEndpoint,
  consultancy: consultancyEndpoint,
  reports: reportEndpoint,
  sms: smsEndpoint,
};

export default api;
