export type UserRole = "admin" | "manager" | "staff";

export interface User {
  id: string;
  password?: string;
  username: string;
  fullName: string;
  role: UserRole;
  designation: string;
  email?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface CreateUserPayload {
  username: string;
  password: string;
  fullName: string;
  role: UserRole;
  designation: string;
  email?: string;
  phone?: string;
}

export interface UpdateUserPayload {
  username?: string;
  password?: string;
  fullName?: string;
  role?: UserRole;
  designation?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
}
