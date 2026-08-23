import apiClient from './client';
import { SMSLogEntry } from '../types';
import { SendPaymentSMSParams, SMSResponse, smsService } from '../services/smsService';

/**
 * Text.lk SMS Gateway API Client
 */
export const smsApi = {
  /**
   * Send SMS for a newly recorded loan payment
   */
  async sendPaymentSMS(params: SendPaymentSMSParams): Promise<SMSResponse> {
    return smsService.sendPaymentNotification(params);
  },

  /**
   * Send custom SMS to any recipient
   */
  async sendCustomSMS(recipient: string, message: string): Promise<SMSResponse> {
    return smsService.sendCustomSMS(recipient, message);
  },

  /**
   * Get SMS delivery logs
   */
  async getLogs(): Promise<SMSLogEntry[]> {
    return smsService.getHistory();
  },
};
