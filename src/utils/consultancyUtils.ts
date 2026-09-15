// import { ConsultancyAgreement } from '../types';

import { ConsultancyAgreement } from "../api";

// import { ConsultancyAgreement } from "../api";

/**
 * Calculates maturity date by adding specified months (default 6) to a start YYYY-MM-DD date string.
 */
export function calculateMaturityDate(startDateStr: string, months = 6): string {
  if (!startDateStr) return '';
  const date = new Date(startDateStr);
  if (isNaN(date.getTime())) return '';
  
  date.setMonth(date.getMonth() + months);
  return date.toISOString().split('T')[0];
}

/**
 * Calculates remaining days until maturity date.
 */
export function getDaysRemaining(maturityDateStr: string): number {
  if (!maturityDateStr) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const maturity = new Date(maturityDateStr);
  maturity.setHours(0, 0, 0, 0);

  const diffTime = maturity.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Recalculates and dynamically assigns agreement status based on dates & return records.
 */
export function recalculateConsultancyStatus(agreement: ConsultancyAgreement): ConsultancyAgreement {
  if (agreement.returnRecord) {
    return { ...agreement, status: 'Returned_Closed' };
  }

  const daysLeft = getDaysRemaining(agreement.maturityDate);

  if (daysLeft <= 0) {
    return { ...agreement, status: 'Maturity_Reached' };
  } else if (daysLeft <= 30) {
    return { ...agreement, status: 'Maturing_Soon' };
  } else {
    return { ...agreement, status: 'Active_Placed' };
  }
}

/**
 * Formats currency values
 */
export function formatCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
  return `LKR ${formatted}`;
}
