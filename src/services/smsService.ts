import axios from 'axios';
import { SMSLogEntry, Loan, PaymentRecord } from '../types';
import { formatCurrency } from '../utils/loanUtils';

export interface SendPaymentSMSParams {
  customerName: string;
  customerPhone: string;
  amount: number;
  loanId: string;
  referenceNumber: string;
  remainingBalance: number;
  paymentDate?: string;
  isFullySettled?: boolean;
  isEarlySettlement?: boolean;
}

export interface SMSResponse {
  success: boolean;
  message: string;
  recipient: string;
  log?: SMSLogEntry;
  error?: string;
}

const LOCAL_STORAGE_KEY = 'smv_holdings_sms_logs';

/**
 * Normalizes Sri Lankan phone number format
 */
export function formatSriLankanPhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0') && digits.length === 10) {
    return '94' + digits.substring(1);
  }
  if (digits.length === 9 && digits.startsWith('7')) {
    return '94' + digits;
  }
  if (digits.startsWith('94')) {
    return digits;
  }
  return digits;
}

/**
 * Formats a clean payment SMS notification message
 */
export function generatePaymentSMSMessage({
  customerName,
  amount,
  loanId,
  referenceNumber,
  remainingBalance,
  paymentDate,
  isFullySettled,
  isEarlySettlement,
}: SendPaymentSMSParams): string {
  const formattedAmount = `LKR ${Number(amount).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formattedBalance = `LKR ${Number(remainingBalance).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const dateStr = paymentDate || new Date().toISOString().split('T')[0];

  if (isFullySettled || isEarlySettlement || remainingBalance <= 0) {
    return `Dear ${customerName}, your payment of ${formattedAmount} for Loan #${loanId} (Ref: ${referenceNumber}) on ${dateStr} has been received. Your loan is now FULLY SETTLED! Clearance certificate ready. Thank you for choosing SMV Holdings.`;
  }

  return `Dear ${customerName}, your payment of ${formattedAmount} for Loan #${loanId} (Ref: ${referenceNumber}) on ${dateStr} has been successfully received. Remaining Balance: ${formattedBalance}. Thank you for choosing SMV Holdings.`;
}

/**
 * Gets saved SMS logs from localStorage
 */
export function getSavedSMSLogs(): SMSLogEntry[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Stores an SMS log entry
 */
export function saveSMSLog(log: SMSLogEntry) {
  try {
    const existing = getSavedSMSLogs();
    const updated = [log, ...existing].slice(0, 100);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save SMS log to localStorage', err);
  }
}

export const smsService = {
  /**
   * Send payment confirmation SMS to customer
   */
  async sendPaymentNotification(params: SendPaymentSMSParams): Promise<SMSResponse> {
    const message = generatePaymentSMSMessage(params);
    const recipient = params.customerPhone;

    if (!recipient || recipient.trim() === '') {
      const failedLog: SMSLogEntry = {
        id: `SMS-${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        recipient: 'NO_PHONE_NUMBER',
        originalPhone: '',
        message,
        loanId: params.loanId,
        customerName: params.customerName,
        amount: params.amount,
        status: 'FAILED',
        error: 'Customer does not have a valid mobile phone number registered.',
      };
      saveSMSLog(failedLog);
      return {
        success: false,
        message: 'No phone number available for customer.',
        recipient: '',
        log: failedLog,
        error: 'Missing phone number',
      };
    }

    try {
      const response = await axios.post<SMSResponse>('/api/sms/send', {
        recipient,
        message,
        loanId: params.loanId,
        customerName: params.customerName,
        amount: params.amount,
      });

      if (response.data && response.data.log) {
        saveSMSLog(response.data.log);
      }

      return response.data;
    } catch (error: any) {
      console.warn('[SMS Dispatch Error]:', error);
      
      const formattedRecipient = formatSriLankanPhone(recipient);
      const fallbackLog: SMSLogEntry = {
        id: `SMS-${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        recipient: formattedRecipient,
        originalPhone: recipient,
        message,
        loanId: params.loanId,
        customerName: params.customerName,
        amount: params.amount,
        status: 'FAILED',
        error: error.response?.data?.error || error.message || 'SMS transmission failed',
      };
      saveSMSLog(fallbackLog);

      return {
        success: false,
        message: error.response?.data?.error || 'Failed to dispatch SMS',
        recipient: formattedRecipient,
        log: fallbackLog,
        error: error.message,
      };
    }
  },

  /**
   * Send Custom / Test SMS message
   */
  async sendCustomSMS(recipient: string, message: string): Promise<SMSResponse> {
    try {
      const response = await axios.post<SMSResponse>('/api/sms/send', {
        recipient,
        message,
      });

      if (response.data && response.data.log) {
        saveSMSLog(response.data.log);
      }

      return response.data;
    } catch (error: any) {
      const formattedRecipient = formatSriLankanPhone(recipient);
      const errorLog: SMSLogEntry = {
        id: `SMS-${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        recipient: formattedRecipient,
        originalPhone: recipient,
        message,
        status: 'FAILED',
        error: error.response?.data?.error || error.message,
      };
      saveSMSLog(errorLog);

      return {
        success: false,
        message: error.response?.data?.error || 'Failed to dispatch SMS',
        recipient: formattedRecipient,
        log: errorLog,
        error: error.message,
      };
    }
  },

  /**
   * Fetch server and local SMS transmission history
   */
  async getHistory(): Promise<SMSLogEntry[]> {
    try {
      const response = await axios.get<{ logs: SMSLogEntry[] }>('/api/sms/logs');
      if (response.data && Array.isArray(response.data.logs)) {
        return response.data.logs;
      }
    } catch (err) {
      console.warn('Could not fetch server SMS logs, falling back to local storage', err);
    }
    return getSavedSMSLogs();
  },
};
