import apiClient from './client';
import { ConsultancyAgreement, ConsultancyReturnRecord } from '../types';
import { CreateConsultancyPayload, ReturnConsultancyPayload, ApiResponse } from '../types/api';

/**
 * Consultancy Agreements & Fund Placement API Service
 * Drafted with Axios calls ready for backend activation.
 */
export const consultancyApi = {
  /**
   * Fetch all consultancy agreements
   */
  async getAllAgreements(params?: { status?: string; search?: string }): Promise<ConsultancyAgreement[]> {
    /* 
    // Backend API Call (Active once backend is connected):
    const response = await apiClient.get<ApiResponse<ConsultancyAgreement[]>>('/consultancy/agreements', { params });
    return response.data.data;
    */
    console.log('[API Call Drafted]: GET /consultancy/agreements', params);
    return [];
  },

  /**
   * Onboard a new consultancy agreement
   */
  async createAgreement(payload: CreateConsultancyPayload): Promise<ConsultancyAgreement | null> {
    /* 
    // Backend API Call:
    const response = await apiClient.post<ApiResponse<ConsultancyAgreement>>('/consultancy/agreements', payload);
    return response.data.data;
    */
    console.log('[API Call Drafted]: POST /consultancy/agreements', payload);
    return null;
  },

  /**
   * Return client funds and close the 6-month placement agreement
   */
  async returnFunds(payload: ReturnConsultancyPayload): Promise<ConsultancyAgreement | null> {
    /* 
    // Backend API Call:
    const response = await apiClient.post<ApiResponse<ConsultancyAgreement>>(
      `/consultancy/agreements/${payload.agreementId}/return-funds`,
      payload.returnRecord
    );
    return response.data.data;
    */
    console.log(`[API Call Drafted]: POST /consultancy/agreements/${payload.agreementId}/return-funds`, payload.returnRecord);
    return null;
  },

  /**
   * Upload bank passbook or last statement document
   */
  async uploadPassbookDocument(agreementId: string, file: File): Promise<any> {
    /* 
    // Backend API Call:
    const formData = new FormData();
    formData.append('passbook', file);
    const response = await apiClient.post<ApiResponse<any>>(`/consultancy/agreements/${agreementId}/passbook`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.data;
    */
    console.log(`[API Call Drafted]: POST /consultancy/agreements/${agreementId}/passbook`, file.name);
    return null;
  },
};
