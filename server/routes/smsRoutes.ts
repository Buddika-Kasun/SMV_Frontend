import { Router } from 'express';
import axios from 'axios';
import { db } from '../db';
import { SMSLogEntry } from '../../src/types';

const router = Router();

function normalizePhoneNumber(rawPhone: string): string {
  if (!rawPhone) return '';
  let digits = rawPhone.replace(/\D/g, '');
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
 * POST /api/sms/send
 */
router.post('/send', async (req, res) => {
  try {
    const { recipient, message, loanId, customerName, amount, senderId } = req.body;

    if (!recipient || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: recipient and message are required.',
      });
    }

    const formattedRecipient = normalizePhoneNumber(recipient);
    const token = process.env.TEXT_LK_API_TOKEN || '3905|cMKJeozKbAaJ6RioaExZOTIHtrTdDFqcLGOkYIhj3fc213f1';

    let gatewayResult: any = null;
    let dispatchSuccess = false;
    let errorMessage = '';

    try {
      const v3Response = await axios.post(
        'https://app.text.lk/api/v3/sms/send',
        {
          recipient: formattedRecipient,
          message: message,
          ...(senderId ? { sender_id: senderId } : {}),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          timeout: 10000,
        }
      );
      gatewayResult = v3Response.data;
      dispatchSuccess = true;
    } catch (v3Error: any) {
      try {
        const httpResponse = await axios.post(
          'https://app.text.lk/api/http/sms/send',
          {
            api_token: token,
            recipient: formattedRecipient,
            message: message,
            ...(senderId ? { sender_id: senderId } : {}),
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            timeout: 10000,
          }
        );
        gatewayResult = httpResponse.data;
        dispatchSuccess = true;
      } catch (httpError: any) {
        errorMessage = httpError?.response?.data?.message || httpError?.message || 'Failed to dispatch via Text.lk';
        gatewayResult = httpError?.response?.data || null;
      }
    }

    const logEntry: SMSLogEntry = {
      id: `SMS-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toLocaleString('en-GB', { timeZone: 'Asia/Colombo' }),
      recipient: formattedRecipient,
      originalPhone: recipient,
      message,
      loanId,
      customerName,
      amount,
      status: dispatchSuccess ? 'SENT' : 'FAILED',
      gatewayResponse: gatewayResult,
      error: errorMessage || undefined,
    };

    await db.addSMSLog(logEntry);

    if (dispatchSuccess) {
      return res.json({
        success: true,
        message: 'SMS dispatched successfully via Text.lk',
        recipient: formattedRecipient,
        log: logEntry,
        data: gatewayResult,
      });
    } else {
      return res.status(502).json({
        success: false,
        error: errorMessage || 'Gateway error while dispatching SMS',
        recipient: formattedRecipient,
        log: logEntry,
        data: gatewayResult,
      });
    }
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error while processing SMS',
    });
  }
});

/**
 * GET /api/sms/logs
 */
router.get('/logs', async (req, res) => {
  try {
    const logs = await db.getSMSLogs();
    return res.json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/sms/test
 */
router.post('/test', async (req, res) => {
  const { testPhone } = req.body;
  const recipient = testPhone || '0771234567';
  const formatted = normalizePhoneNumber(recipient);
  const token = process.env.TEXT_LK_API_TOKEN || '3905|cMKJeozKbAaJ6RioaExZOTIHtrTdDFqcLGOkYIhj3fc213f1';

  try {
    const response = await axios.post(
      'https://app.text.lk/api/v3/sms/send',
      {
        recipient: formatted,
        message: `SMV Holdings SMS Gateway Test: Connection established at ${new Date().toLocaleTimeString()}.`,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        timeout: 8000,
      }
    );
    res.json({ success: true, response: response.data, formattedRecipient: formatted });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error?.response?.data || error.message,
      formattedRecipient: formatted,
    });
  }
});

export default router;
