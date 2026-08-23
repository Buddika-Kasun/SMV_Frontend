import { Router } from 'express';
import { db } from '../db';
import { FinancialSummary } from '../../src/types';

const router = Router();

/**
 * GET /api/reports/summary - Aggregate financial and portfolio summary
 */
router.get('/summary', async (req, res) => {
  try {
    const loans = await db.getLoans();

    const summary: FinancialSummary = {
      totalLoansDisbursed: loans.filter(l => l.status === 'Active' || l.status === 'Overdue' || l.status === 'Settled' || l.status === 'Early Settled').length,
      totalDisbursedAmount: loans.reduce((sum, l) => sum + (l.disbursedAmount || 0), 0),
      totalOutstandingBalance: loans.reduce((sum, l) => sum + (l.outstandingBalance || 0), 0),
      totalCollectedAmount: loans.reduce((sum, l) => sum + (l.totalPaidAmount || 0), 0),
      activeLoansCount: loans.filter(l => l.status === 'Active').length,
      overdueLoansCount: loans.filter(l => l.status === 'Overdue').length,
      pendingApprovalCount: loans.filter(l => l.status === 'Pending Approval').length,
      pendingKycCount: loans.filter(l => l.status === 'KYC Pending').length,
      settledLoansCount: loans.filter(l => l.status === 'Settled' || l.status === 'Early Settled').length,
      totalInterestEarned: loans.reduce((sum, l) => {
        const interestPaid = l.payments.reduce((pSum, p) => pSum + (p.allocatedInterest || 0), 0);
        return sum + interestPaid;
      }, 0),
    };

    return res.json({
      success: true,
      summary,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
