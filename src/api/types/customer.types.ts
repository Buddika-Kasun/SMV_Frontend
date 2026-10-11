/**
 * Fields allowed by the backend UpdateCustomerDto.
 * Everything is optional — send only what you're changing.
 */
export interface UpdateCustomerPayload {
  idNumber?: string;
  idType?: "NIC" | "Passport" | "Driver_License" | "Other";
  fullName?: string;
  phone?: string;
  email?: string;
  dateOfBirth?: string; // "YYYY-MM-DD"
  gender?: "Male" | "Female" | "Other";
  occupation?: string;
  employerName?: string;
  monthlyIncome?: number;
  addressLine?: string;
  city?: string;
}
