import React from 'react';
import { Loan, PaymentRecord } from '../types';
import { formatCurrency } from '../utils/loanUtils';
import { 
  Building2, 
  CheckCircle, 
  Printer, 
  X, 
  CreditCard,
  User,
  Calendar,
  DollarSign
} from 'lucide-react';

/* 
 * API Integration Call References (Kept for future backend integration):
 * 
 * const resendReceiptNotification = async (payload: {
 *   recipientPhone: string;
 *   paymentId: string;
 *   loanId: string;
 *   amount: number;
 *   remainingBalance: number;
 * }) => {
 *   return await fetch('/api/payments/receipt-notify', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify(payload)
 *   });
 * };
 */

interface PaymentReceiptModalProps {
  loan: Loan;
  payment: PaymentRecord;
  onClose: () => void;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  loan,
  payment,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200/80 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
        
        {/* Header Bar */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-xs block">Official Payment Receipt</span>
              <span className="text-[10px] text-slate-500 font-mono">{payment.id}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrint}
              className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 text-xs font-semibold flex items-center gap-1 transition shadow-2xs cursor-pointer"
              title="Print Official Receipt"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden sm:inline">Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Content */}
        <div className="p-5 space-y-4 text-xs">
          
          {/* Company Branding */}
          <div className="text-center pb-3 border-b border-slate-100 space-y-0.5">
            <div className="flex items-center justify-center gap-1.5 text-slate-900 font-bold text-sm">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>SMV HOLDINGS (PVT) LTD</span>
            </div>
            <p className="text-[10px] text-slate-500">Microfinance & SME Credit Division • Colombo, Sri Lanka</p>
          </div>

          {/* Core Amount Hero */}
          <div className="bg-slate-900 text-white p-4 rounded-xl text-center space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
              Payment Amount Received
            </span>
            <div className="text-2xl font-black font-mono tracking-tight text-emerald-400">
              {formatCurrency(payment.amount)}
            </div>
            <span className="text-[10px] text-slate-300 font-mono block">
              Date: {payment.paymentDate} • Ref: {payment.referenceNumber}
            </span>
          </div>

          {/* Allocation Breakdown */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60">
              <span className="text-[10px] text-slate-500 font-medium block">Principal Applied</span>
              <span className="font-bold text-slate-900 text-xs font-mono">{formatCurrency(payment.principalPortion)}</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60">
              <span className="text-[10px] text-slate-500 font-medium block">Interest Applied</span>
              <span className="font-bold text-slate-900 text-xs font-mono">{formatCurrency(payment.interestPortion)}</span>
            </div>
          </div>

          {/* Details Metadata List */}
          <div className="space-y-2 bg-slate-50/50 p-3 rounded-xl border border-slate-200/60 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500 flex items-center gap-1">
                <User className="w-3 h-3 text-slate-400" />
                Customer Name:
              </span>
              <span className="font-bold text-slate-900">{payment.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Loan Contract ID:</span>
              <span className="font-mono font-bold text-slate-800">{loan.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 flex items-center gap-1">
                <CreditCard className="w-3 h-3 text-slate-400" />
                Payment Method:
              </span>
              <span className="font-semibold text-slate-800">{payment.paymentMethod}</span>
            </div>
            {payment.notes && (
              <div className="flex justify-between pt-1 border-t border-slate-200/60 text-[10px]">
                <span className="text-slate-500">Remarks / Notes:</span>
                <span className="text-slate-700 italic">{payment.notes}</span>
              </div>
            )}
          </div>

          {/* Balance Remaining After Payment */}
          <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-emerald-900 font-bold block">Adjusted Outstanding Balance</span>
              <span className="text-[10px] text-slate-500">Total remaining on loan contract</span>
            </div>
            <div className="text-right">
              <span className="text-base font-extrabold text-emerald-800 block">
                {formatCurrency(loan.outstandingBalance)}
              </span>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center pt-1 border-t border-slate-200 text-[10px] text-slate-500">
            Received by: {payment.receivedBy} • Official SMV Holdings Microfinance Receipt
          </div>

        </div>

        {/* Action Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white font-bold rounded-lg text-xs hover:bg-slate-800 transition shadow-2xs cursor-pointer"
          >
            Done & Close
          </button>
        </div>

      </div>
    </div>
  );
};
