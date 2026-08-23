import { Router } from 'express';
import { db } from '../db';
import { Loan, LoanStatus, KYCData, PaymentRecord, EarlySettlementQuote } from '../../src/types';
import { 
  generateInstallmentSchedule, 
  recalculateLoanState, 
  applyPaymentToLoan, 
  executeEarlySettlement 
} from '../../src/utils/loanUtils';

const router = Router();

/**
 * GET /api/loans - Retrieve all loans
 */
router.get('/', async (req, res) => {
  try {
    const { status, search } = req.query;
    let loans = await db.getLoans();

    if (status && typeof status === 'string' && status !== 'all') {
      loans = loans.filter(l => l.status === status);
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      loans = loans.filter(l =>
        l.accountNumber.toLowerCase().includes(q) ||
        l.customerName.toLowerCase().includes(q) ||
        l.customerPhone.includes(q) ||
        l.kyc.nationalIdNumber.toLowerCase().includes(q)
      );
    }

    return res.json({
      success: true,
      count: loans.length,
      loans,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/loans/:id - Get single loan
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const loan = await db.getLoanById(id);

    if (!loan) {
      return res.status(404).json({ success: false, error: `Loan ${id} not found.` });
    }

    return res.json({ success: true, loan });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/loans - Create new loan application
 */
router.post('/', async (req, res) => {
  try {
    const payload = req.body;

    if (!payload.customerName || !payload.requestedAmount) {
      return res.status(400).json({ success: false, error: 'Customer Name and Requested Amount are required.' });
    }

    const loanId = `LN-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const termMonths = Number(payload.termMonths) || 12;
    const interestRate = Number(payload.interestRatePerAnnum) || 14;
    const requestedAmount = Number(payload.requestedAmount);

    const installments = generateInstallmentSchedule(
      requestedAmount,
      interestRate,
      termMonths,
      payload.repaymentFrequency || 'Monthly',
      payload.interestMethod || 'Reducing Balance',
      payload.startDate || new Date().toISOString().split('T')[0]
    );

    const initialKYC: KYCData = {
      nationalIdNumber: payload.nationalIdNumber || '',
      idType: payload.idType || 'NIC',
      dateOfBirth: payload.dateOfBirth || '',
      gender: payload.gender || 'Other',
      occupation: payload.occupation || '',
      employerName: payload.employerName || '',
      monthlyIncome: Number(payload.monthlyIncome) || 0,
      addressLine: payload.addressLine || '',
      city: payload.city || '',
      postalCode: payload.postalCode || '',
      guarantorName: payload.guarantorName || '',
      guarantorPhone: payload.guarantorPhone || '',
      guarantorRelation: payload.guarantorRelation || '',
      bankName: payload.bankName || '',
      accountNumber: payload.accountNumber || '',
      documents: [],
      isVerified: false,
    };

    const newLoan: Loan = {
      id: loanId,
      accountNumber: `ACC-8800-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      customerEmail: payload.customerEmail || '',
      loanType: payload.loanType || 'Standard Personal',
      requestedAmount,
      disbursedAmount: 0,
      interestRatePerAnnum: interestRate,
      termMonths,
      repaymentFrequency: payload.repaymentFrequency || 'Monthly',
      interestMethod: payload.interestMethod || 'Reducing Balance',
      processingFee: Number(payload.processingFee) || Math.round(requestedAmount * 0.015),
      earlySettlementPenaltyPercent: Number(payload.earlySettlementPenaltyPercent) || 2.5,
      status: 'Pending Approval',
      requestedDate: new Date().toISOString().split('T')[0],
      purpose: payload.purpose || 'Personal / General Use',
      creditScore: Number(payload.creditScore) || 720,
      kyc: initialKYC,
      installments,
      payments: [],
      totalPaidAmount: 0,
      outstandingBalance: 0,
    };

    const saved = await db.saveLoan(newLoan);

    return res.status(201).json({
      success: true,
      message: `Loan application ${saved.id} submitted successfully.`,
      loan: saved,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/loans/:id/approve - Approve pending loan application
 */
router.post('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const loan = await db.getLoanById(id);
    if (!loan) return res.status(404).json({ success: false, error: 'Loan not found.' });

    const updated: Loan = {
      ...loan,
      status: 'KYC Pending',
      approvedDate: new Date().toISOString().split('T')[0],
    };

    const saved = await db.saveLoan(updated);
    return res.json({ success: true, message: `Loan ${id} approved for KYC verification.`, loan: saved });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/loans/:id/reject - Reject loan application
 */
router.post('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const loan = await db.getLoanById(id);
    if (!loan) return res.status(404).json({ success: false, error: 'Loan not found.' });

    const updated: Loan = {
      ...loan,
      status: 'Rejected',
      purpose: reason ? `${loan.purpose} (Rejected: ${reason})` : loan.purpose,
    };

    const saved = await db.saveLoan(updated);
    return res.json({ success: true, message: `Loan ${id} marked as rejected.`, loan: saved });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/loans/:id/disburse - Disburse funds & activate contract
 */
router.post('/:id/disburse', async (req, res) => {
  try {
    const { id } = req.params;
    const loan = await db.getLoanById(id);
    if (!loan) return res.status(404).json({ success: false, error: 'Loan not found.' });

    const todayStr = new Date().toISOString().split('T')[0];

    const freshSchedule = generateInstallmentSchedule(
      loan.requestedAmount,
      loan.interestRatePerAnnum,
      loan.termMonths,
      loan.repaymentFrequency,
      loan.interestMethod,
      todayStr
    );

    const updated: Loan = {
      ...loan,
      status: 'Active',
      disbursedAmount: loan.requestedAmount,
      disbursedDate: todayStr,
      installments: freshSchedule,
    };

    const saved = await db.saveLoan(updated);
    return res.json({ success: true, message: `Loan ${id} disbursed and activated.`, loan: saved });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/loans/:id/kyc - Update KYC and mark verified
 */
router.put('/:id/kyc', async (req, res) => {
  try {
    const { id } = req.params;
    const { kycData } = req.body;
    const loan = await db.getLoanById(id);
    if (!loan) return res.status(404).json({ success: false, error: 'Loan not found.' });

    const isNowVerified = kycData.isVerified ?? loan.kyc.isVerified;
    const nextStatus: LoanStatus = isNowVerified && loan.status === 'KYC Pending' 
      ? 'Approved - Pending Disbursement' 
      : loan.status;

    const updated: Loan = {
      ...loan,
      kyc: {
        ...loan.kyc,
        ...kycData,
        isVerified: isNowVerified,
      },
      status: nextStatus,
    };

    const saved = await db.saveLoan(updated);
    return res.json({ success: true, message: 'KYC records updated successfully.', loan: saved });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/loans/:id/payment - Record and allocate payment
 */
router.post('/:id/payment', async (req, res) => {
  try {
    const { id } = req.params;
    const paymentPayload: PaymentRecord = req.body;
    const loan = await db.getLoanById(id);
    if (!loan) return res.status(404).json({ success: false, error: 'Loan not found.' });

    const updatedLoan = applyPaymentToLoan(
      loan,
      paymentPayload.amount,
      paymentPayload.paymentMethod,
      paymentPayload.referenceNumber,
      paymentPayload.receivedBy,
      paymentPayload.notes || '',
      paymentPayload.paymentDate || new Date().toISOString().split('T')[0]
    );
    const saved = await db.saveLoan(updatedLoan);

    return res.json({
      success: true,
      message: `Payment of LKR ${paymentPayload.amount.toLocaleString()} applied to ${id}.`,
      loan: saved,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/loans/:id/early-settle - Execute early settlement
 */
router.post('/:id/early-settle', async (req, res) => {
  try {
    const { id } = req.params;
    const { quote, paymentMethod, referenceNumber, receivedBy, notes } = req.body;
    const loan = await db.getLoanById(id);
    if (!loan) return res.status(404).json({ success: false, error: 'Loan not found.' });

    const updatedLoan = executeEarlySettlement(
      loan,
      quote,
      paymentMethod || 'Bank Transfer',
      referenceNumber || `SETTLE-${Date.now().toString().slice(-4)}`,
      receivedBy || 'Finance Manager',
      notes
    );

    const saved = await db.saveLoan(updatedLoan);

    return res.json({
      success: true,
      message: `Early payoff executed for loan ${id}. Clearance generated.`,
      loan: saved,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/loans/:id - Delete loan record
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.deleteLoan(id);
    if (!deleted) return res.status(404).json({ success: false, error: 'Loan not found.' });

    return res.json({ success: true, message: `Loan ${id} deleted.` });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
