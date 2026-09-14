// import { Loan, Installment, PaymentRecord, EarlySettlementQuote } from '../types';

import {
  EarlySettlementQuote,
  Installment,
  InstallmentStatus,
  InterestMethod,
  Loan,
  LoanStatus,
} from "../api";

/**
 * Calculates payment schedule for a loan.
 */
export function generateInstallmentSchedule(
  principal: number,
  annualInterestRate: number,
  termMonths: number,
  frequency: "Monthly" | "Bi-Weekly" | "Weekly" = "Monthly",
  method: InterestMethod,
  startDateStr: string = new Date().toISOString().split("T")[0],
): Installment[] {
  const installments: Installment[] = [];
  const startDate = new Date(startDateStr);

  let numInstallments = termMonths;
  if (frequency === "Bi-Weekly") numInstallments = termMonths * 2;
  if (frequency === "Weekly") numInstallments = termMonths * 4;

  const periodicRate =
    annualInterestRate /
    100 /
    (frequency === "Monthly" ? 12 : frequency === "Bi-Weekly" ? 26 : 52);

  if (method === "Reducing_Balance") {
    // Equated Monthly Installment (EMI) formula
    const emi =
      periodicRate > 0
        ? (principal *
            periodicRate *
            Math.pow(1 + periodicRate, numInstallments)) /
          (Math.pow(1 + periodicRate, numInstallments) - 1)
        : principal / numInstallments;

    let remainingPrincipal = principal;

    for (let i = 1; i <= numInstallments; i++) {
      const dueDate = new Date(startDate);
      if (frequency === "Monthly") {
        dueDate.setMonth(dueDate.getMonth() + i);
      } else if (frequency === "Bi-Weekly") {
        dueDate.setDate(dueDate.getDate() + i * 14);
      } else {
        dueDate.setDate(dueDate.getDate() + i * 7);
      }

      const interestForPeriod =
        Math.round(remainingPrincipal * periodicRate * 100) / 100;
      let principalForPeriod =
        Math.round((emi - interestForPeriod) * 100) / 100;

      // Adjust last installment to prevent rounding errors
      if (i === numInstallments || principalForPeriod > remainingPrincipal) {
        principalForPeriod = Math.round(remainingPrincipal * 100) / 100;
      }

      const totalInstallmentAmount =
        Math.round((principalForPeriod + interestForPeriod) * 100) / 100;
      remainingPrincipal -= principalForPeriod;

      installments.push({
        installmentNumber: i,
        dueDate: dueDate.toISOString().split("T")[0],
        principalAmount: principalForPeriod,
        interestAmount: interestForPeriod,
        totalInstallment: totalInstallmentAmount,
        paidAmount: 0,
        remainingAmount: totalInstallmentAmount,
        status: "Pending",
        lateFee: 0,
      });
    }
  } else {
    // Flat Rate
    const totalInterest =
      principal * (annualInterestRate / 100) * (termMonths / 12);
    const flatInterestPerInstallment =
      Math.round((totalInterest / numInstallments) * 100) / 100;
    const flatPrincipalPerInstallment =
      Math.round((principal / numInstallments) * 100) / 100;
    const flatTotal =
      Math.round(
        (flatPrincipalPerInstallment + flatInterestPerInstallment) * 100,
      ) / 100;

    for (let i = 1; i <= numInstallments; i++) {
      const dueDate = new Date(startDate);
      if (frequency === "Monthly") {
        dueDate.setMonth(dueDate.getMonth() + i);
      } else if (frequency === "Bi-Weekly") {
        dueDate.setDate(dueDate.getDate() + i * 14);
      } else {
        dueDate.setDate(dueDate.getDate() + i * 7);
      }

      installments.push({
        installmentNumber: i,
        dueDate: dueDate.toISOString().split("T")[0],
        principalAmount: flatPrincipalPerInstallment,
        interestAmount: flatInterestPerInstallment,
        totalInstallment: flatTotal,
        paidAmount: 0,
        remainingAmount: flatTotal,
        status: "Pending",
        lateFee: 0,
      });
    }
  }

  return installments;
}

// /**
//  * Recalculates total paid, outstanding balance, status, and next due date for a loan.
//  */
// export function recalculateLoanState(loan: Loan): Loan {
//   const today = new Date().toISOString().split('T')[0];
//   let totalPaid = 0;

//   // Calculate sum of all payments
//   if (loan.payments && loan.payments.length > 0) {
//     totalPaid = loan.payments.reduce((sum, p) => sum + p.amount, 0);
//   }

//   // Update installments status based on payments
//   const updatedInstallments = loan.installments.map(inst => {
//     const isOverdue = inst.status !== 'Paid' && inst.dueDate < today;
//     let currentStatus = inst.status;

//     if (inst.paidAmount >= inst.totalInstallment + inst.lateFee - 0.01) {
//       currentStatus = 'Paid';
//     } else if (inst.paidAmount > 0) {
//       currentStatus = 'Partially Paid';
//     } else if (isOverdue) {
//       currentStatus = 'Overdue';
//     } else {
//       currentStatus = 'Pending';
//     }

//     return {
//       ...inst,
//       remainingAmount: Math.max(0, Math.round((inst.totalInstallment + inst.lateFee - inst.paidAmount) * 100) / 100),
//       status: currentStatus as Installment['status'],
//     };
//   });

//   // Calculate total contract value (principal + total scheduled interest)
//   const totalContractAmount = updatedInstallments.reduce((sum, inst) => sum + inst.totalInstallment + inst.lateFee, 0);
//   const outstandingBalance = Math.max(0, Math.round((totalContractAmount - totalPaid) * 100) / 100);

//   // Determine overall loan status
//   let loanStatus = loan.status;
//   if (loan.status === 'Active' || loan.status === 'Overdue') {
//     const hasOverdue = updatedInstallments.some(inst => inst.status === 'Overdue');
//     const allPaid = updatedInstallments.every(inst => inst.status === 'Paid');

//     if (allPaid) {
//       loanStatus = 'Settled';
//     } else if (hasOverdue) {
//       loanStatus = 'Overdue';
//     } else {
//       loanStatus = 'Active';
//     }
//   }

//   // Next Due Info
//   const nextPending = updatedInstallments.find(inst => inst.status === 'Pending' || inst.status === 'Overdue' || inst.status === 'Partially Paid');

//   return {
//     ...loan,
//     totalPaidAmount: Math.round(totalPaid * 100) / 100,
//     outstandingBalance,
//     status: loanStatus,
//     installments: updatedInstallments,
//     nextDueDate: nextPending ? nextPending.dueDate : undefined,
//     nextDueAmount: nextPending ? nextPending.remainingAmount : undefined,
//   };
// }

/**
 * Calculates Early Settlement Quote for an active loan.
 */
export function calculateEarlySettlementQuote(
  loan: Loan,
  settlementDateStr: string = new Date().toISOString().split("T")[0],
): EarlySettlementQuote {
  // Principal paid so far
  let principalPaidToDate = 0;

  loan.installments.forEach((inst) => {
    if (inst.status === "Paid") {
      principalPaidToDate += inst.principalAmount;
    } else if (inst.paidAmount > 0) {
      // Pro-rate paid amount between principal & interest
      const ratio = inst.principalAmount / inst.totalInstallment;
      principalPaidToDate += inst.paidAmount * ratio;
    }
  });

  principalPaidToDate = Math.round(principalPaidToDate * 100) / 100;
  const outstandingPrincipalBalance = Math.max(
    0,
    Math.round((loan.account?.disbursedAmount! - principalPaidToDate) * 100) / 100,
  );

  // Calculate accrued interest for current period
  // Simple accrued interest model: 1 month of interest on remaining principal
  const monthlyRate = loan.interestRatePerAnnum / 100 / 12;
  const accruedInterestToDate =
    Math.round(outstandingPrincipalBalance * monthlyRate * 100) / 100;

  // Unearned future interest being waived
  let totalFutureScheduledInterest = 0;
  loan.installments.forEach((inst) => {
    if (inst.status !== "Paid") {
      totalFutureScheduledInterest += inst.interestAmount;
    }
  });

  const unearnedFutureInterestWaived = Math.max(
    0,
    Math.round((totalFutureScheduledInterest - accruedInterestToDate) * 100) /
      100,
  );

  // Early settlement penalty fee (e.g., 2% of outstanding principal balance)
  const penaltyPercent = loan.earlySettlementPenaltyPercent || 2.5;
  const earlySettlementPenaltyFee =
    Math.round(outstandingPrincipalBalance * (penaltyPercent / 100) * 100) /
    100;

  // Total required settlement amount
  const totalSettlementAmount =
    Math.round(
      (outstandingPrincipalBalance +
        accruedInterestToDate +
        earlySettlementPenaltyFee) *
        100,
    ) / 100;

  // Total contract balance if paid month by month
  const totalContractRemaining = loan.installments
    .filter((inst) => inst.status !== "Paid")
    .reduce((sum, inst) => sum + inst.remainingAmount, 0);

  const totalSavingsForCustomer = Math.max(
    0,
    Math.round((totalContractRemaining - totalSettlementAmount) * 100) / 100,
  );

  return {
    calculationDate: settlementDateStr,
    originalPrincipal: loan.account?.disbursedAmount!,
    principalPaidToDate,
    outstandingPrincipalBalance,
    accruedInterestToDate,
    unearnedFutureInterestWaived,
    earlySettlementPenaltyPercent: penaltyPercent,
    earlySettlementPenaltyFee,
    totalSettlementAmount,
    totalSavingsForCustomer,
  };
}

// /**
//  * Applies a new payment to a loan and updates installments.
//  */
// export function applyPaymentToLoan(
//   loan: Loan,
//   paymentAmount: number,
//   paymentMethod: PaymentRecord['paymentMethod'],
//   referenceNumber: string,
//   receivedBy: string,
//   notes: string = '',
//   paymentDateStr: string = new Date().toISOString().split('T')[0]
// ): Loan {
//   let remainingPayment = paymentAmount;
//   let allocatedPrincipal = 0;
//   let allocatedInterest = 0;
//   let allocatedLateFee = 0;
//   const installmentNumbersCovered: number[] = [];

//   const updatedInstallments = loan.installments.map(inst => {
//     if (remainingPayment <= 0 || inst.status === 'Paid') {
//       return inst;
//     }

//     const neededToClear = inst.totalInstallment + inst.lateFee - inst.paidAmount;
//     const amountForThis = Math.min(remainingPayment, neededToClear);

//     remainingPayment -= amountForThis;
//     const newPaidAmount = inst.paidAmount + amountForThis;

//     // Estimate principal/interest breakdown for allocation log
//     const principalRatio = inst.principalAmount / inst.totalInstallment;
//     const interestRatio = inst.interestAmount / inst.totalInstallment;

//     allocatedPrincipal += amountForThis * principalRatio;
//     allocatedInterest += amountForThis * interestRatio;

//     installmentNumbersCovered.push(inst.installmentNumber);

//     const isCleared = newPaidAmount >= inst.totalInstallment + inst.lateFee - 0.01;

//     return {
//       ...inst,
//       paidAmount: Math.round(newPaidAmount * 100) / 100,
//       remainingAmount: Math.max(0, Math.round((inst.totalInstallment + inst.lateFee - newPaidAmount) * 100) / 100),
//       status: (isCleared ? 'Paid' : 'Partially Paid') as Installment['status'],
//       paidDate: isCleared ? paymentDateStr : inst.paidDate,
//     };
//   });

//   const newPaymentRecord: PaymentRecord = {
//     id: `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
//     loanId: loan.id,
//     customerName: loan.customerName,
//     amount: paymentAmount,
//     paymentDate: paymentDateStr,
//     paymentMethod,
//     referenceNumber: referenceNumber || `REF-${Math.floor(100000 + Math.random() * 900000)}`,
//     receivedBy,
//     notes,
//     allocatedPrincipal: Math.round(allocatedPrincipal * 100) / 100,
//     allocatedInterest: Math.round(allocatedInterest * 100) / 100,
//     allocatedLateFee,
//     installmentNumbersCovered,
//   };

//   const updatedLoan: Loan = {
//     ...loan,
//     installments: updatedInstallments,
//     payments: [newPaymentRecord, ...(loan.payments || [])],
//   };

//   return recalculateLoanState(updatedLoan);
// }

// /**
//  * Settles a loan early based on settlement quote.
//  */
// export function executeEarlySettlement(
//   loan: Loan,
//   quote: EarlySettlementQuote,
//   paymentMethod: PaymentRecord['paymentMethod'],
//   referenceNumber: string,
//   receivedBy: string,
//   notes: string = ''
// ): Loan {
//   const settlementPaymentRecord: PaymentRecord = {
//     id: `SETTLE-${Date.now()}`,
//     loanId: loan.id,
//     customerName: loan.customerName,
//     amount: quote.totalSettlementAmount,
//     paymentDate: quote.calculationDate,
//     paymentMethod,
//     referenceNumber: referenceNumber || `STL-${Math.floor(100000 + Math.random() * 900000)}`,
//     receivedBy,
//     notes: `FULL EARLY SETTLEMENT. Outstanding Principal: $${quote.outstandingPrincipalBalance}, Accrued Interest: $${quote.accruedInterestToDate}, Penalty Fee (${quote.earlySettlementPenaltyPercent}%): $${quote.earlySettlementPenaltyFee}. ${notes}`,
//     allocatedPrincipal: quote.outstandingPrincipalBalance,
//     allocatedInterest: quote.accruedInterestToDate,
//     allocatedLateFee: quote.earlySettlementPenaltyFee,
//     installmentNumbersCovered: loan.installments.filter(i => i.status !== 'Paid').map(i => i.installmentNumber),
//   };

//   // Mark all unpaid installments as Paid / Settled
//   const settledInstallments: Installment[] = loan.installments.map(inst => ({
//     ...inst,
//     paidAmount: inst.totalInstallment,
//     remainingAmount: 0,
//     status: 'Paid',
//     paidDate: quote.calculationDate,
//   }));

//   const updatedLoan: Loan = {
//     ...loan,
//     status: 'Early Settled',
//     settledDate: quote.calculationDate,
//     earlySettlementQuote: quote,
//     installments: settledInstallments,
//     payments: [settlementPaymentRecord, ...(loan.payments || [])],
//     outstandingBalance: 0,
//     nextDueDate: undefined,
//     nextDueAmount: undefined,
//     totalPaidAmount: Math.round((loan.totalPaidAmount + quote.totalSettlementAmount) * 100) / 100,
//   };

//   return updatedLoan;
// }

// /**
//  * Currency Formatter
//  */
// export function formatCurrency(amount: number): string {
//   const formatted = new Intl.NumberFormat('en-US', {
//     minimumFractionDigits: 0,
//     maximumFractionDigits: 2,
//   }).format(amount || 0);
//   return `LKR ${formatted}`;
// }

// ============================================================
// Loan Status Helper
// ============================================================

interface StatusConfig {
  label: string;
  className: string;
}

const LOAN_STATUS_MAP: Record<LoanStatus | string, StatusConfig> = {
  Active: {
    label: "Active",
    className: "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
  },
  Overdue: {
    label: "Overdue",
    className: "bg-amber-50 text-amber-700 border border-amber-200/60",
  },
  Settled: {
    label: "Settled",
    className: "bg-slate-100 text-slate-600 border border-slate-200/60",
  },
  Early_Settled: {
    label: "Early Settled",
    className: "bg-slate-100 text-slate-600 border border-slate-200/60",
  },
  KYC_Pending: {
    label: "Pending KYC",
    className: "bg-purple-50 text-purple-700 border border-purple-200/60",
  },
  Pending_Approval: {
    label: "Pending Approval",
    className: "bg-blue-50 text-blue-700 border border-blue-200/60",
  },
  Approved_Pending_Disbursement: {
    // label: "Approved - Pending Disbursement",
    label: "Pending Disbursement",
    className: "bg-indigo-50 text-indigo-700 border border-indigo-200/60",
  },
  Rejected: {
    label: "Rejected",
    className: "bg-rose-50 text-rose-700 border border-rose-200/60",
  },
};

/**
 * Get loan status configuration (label + className)
 */
export function getLoanStatusConfig(status: string): StatusConfig {
  return (
    LOAN_STATUS_MAP[status] || {
      label: status,
      className: "bg-slate-100 text-slate-600 border border-slate-200/60",
    }
  );
}

/**
 * Get loan status label only
 */
export function getLoanStatusLabel(status: string): string {
  return getLoanStatusConfig(status).label;
}

/**
 * Get loan status color className only
 */
export function getLoanStatusColor(status: string): string {
  return getLoanStatusConfig(status).className;
}

// ============================================================
// Installment Status Helper
// ============================================================

const INSTALLMENT_STATUS_MAP: Record<InstallmentStatus | string, StatusConfig> =
  {
    Paid: {
      label: "Paid",
      className: "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
    },
    Overdue: {
      label: "Overdue",
      className: "bg-amber-50 text-amber-700 border border-amber-200/60",
    },
    Partially_Paid: {
      label: "Partially Paid",
      className: "bg-blue-50 text-blue-700 border border-blue-200/60",
    },
    Pending: {
      label: "Pending",
      className: "bg-slate-100 text-slate-600 border border-slate-200/60",
    },
  };

/**
 * Get installment status configuration (label + className)
 */
export function getInstallmentStatusConfig(status: string): StatusConfig {
  return (
    INSTALLMENT_STATUS_MAP[status] || {
      label: status,
      className: "bg-slate-100 text-slate-600 border border-slate-200/60",
    }
  );
}

/**
 * Get installment status label only
 */
export function getInstallmentStatusLabel(status: string): string {
  return getInstallmentStatusConfig(status).label;
}

/**
 * Get installment status color className only
 */
export function getInstallmentStatusColor(status: string): string {
  return getInstallmentStatusConfig(status).className;
}

// ============================================================
// Payment Method Helper
// ============================================================

/**
 * Get payment method display label
 */
export function getPaymentMethodLabel(method: string): string {
  const map: Record<string, string> = {
    Cash: "Cash",
    Bank_Transfer: "Bank Transfer",
    Debit_Credit_Card: "Debit/Credit Card",
    Direct_Debit: "Direct Debit",
    Cheque: "Cheque",
  };
  return map[method] || method;
}

// ============================================================
// Loan Type Helper
// ============================================================

/**
 * Get loan type display label
 */
export function getLoanTypeLabel(type: string): string {
  const map: Record<string, string> = {
    Instant_Personal: "Instant Personal",
    Standard_Personal: "Standard Personal",
    Business_Expansion: "Business Expansion",
    Micro_Enterprise: "Micro Enterprise",
    Emergency_Quick: "Emergency Quick",
  };
  return map[type] || type;
}

// ============================================================
// Interest Method Helper
// ============================================================

/**
 * Get interest method display label
 */
export function getInterestMethodLabel(method: string): string {
  const map: Record<string, string> = {
    Flat_Rate: "Flat Rate",
    Reducing_Balance: "Reducing Balance",
  };
  return map[method] || method;
}

// Helper: ISO -> "YYYY-MM-DD" for <input type="date">
export function toDateInput(v?: string | null): string {
  return v ? new Date(v).toISOString().slice(0, 10) : "";
}

// ============================================================
// Repayment Frequency Helper
// ============================================================

/**
 * Get repayment frequency display label
 */
export function getRepaymentFrequencyLabel(frequency: string): string {
  const map: Record<string, string> = {
    Monthly: "Monthly",
    Bi_Weekly: "Bi-Weekly",
    Weekly: "Weekly",
  };
  return map[frequency] || frequency;
}