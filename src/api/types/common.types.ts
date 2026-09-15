// Base API Response
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
  timestamp: string;
  path?: string;
  statusCode?: number;
  validationErrors?: string[];
}

export interface ApiErrorResponse {
  success: boolean;
  message: string;
  error: string;
  data?: any;
  timestamp: string;
  path: string;
  statusCode: number;
  validationErrors?: string[];
}

// Pagination Types
export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
