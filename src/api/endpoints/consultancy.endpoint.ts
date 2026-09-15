import apiClient from "../config/client";
import {
  ApiResponse,
  ConsultancyAgreement,
  CreateConsultancyPayload,
  ReturnConsultancyPayload,
  PaginationParams,
  PaginatedResponse,
} from "../types";

export const consultancyEndpoint = {
  /**
   * Get all consultancy agreements with pagination
   */
  getAll: (
    params?: PaginationParams & { status?: string },
  ): Promise<ApiResponse<PaginatedResponse<ConsultancyAgreement>>> => {
    return apiClient.get<PaginatedResponse<ConsultancyAgreement>>(
      "/consultancy/agreements",
      { params },
    );
  },

  /**
   * Get consultancy agreement by ID
   */
  getById: (id: string): Promise<ApiResponse<ConsultancyAgreement>> => {
    return apiClient.get<ConsultancyAgreement>(`/consultancy/agreements/${id}`);
  },

  /**
   * Create a new consultancy agreement
   */
  create: (
    payload: CreateConsultancyPayload,
  ): Promise<ApiResponse<ConsultancyAgreement>> => {
    return apiClient.post<ConsultancyAgreement>(
      "/consultancy/agreements",
      payload,
    );
  },

  /**
   * Return funds (close agreement)
   */
  returnFunds: (
    id: string,
    payload: ReturnConsultancyPayload,
  ): Promise<ApiResponse<ConsultancyAgreement>> => {
    return apiClient.post<ConsultancyAgreement>(
      `/consultancy/agreements/${id}/return-funds`,
      payload,
    );
  },

  /**
   * Upload passbook document
   */
  uploadPassbook: (
    id: string,
    file: File,
  ): Promise<ApiResponse<ConsultancyAgreement>> => {
    const formData = new FormData();
    formData.append("passbook", file);
    return apiClient.post<ConsultancyAgreement>(
      `/consultancy/agreements/${id}/passbook`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
  },
};
