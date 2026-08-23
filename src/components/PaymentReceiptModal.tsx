import React, { useState } from 'react';
import { Loan, PaymentRecord } from '../types';
import { formatCurrency } from '../utils/loanUtils';
import { 
  Building2, 
  CheckCircle, 
  Printer, 
  X, 
  MessageSquare, 
  Send, 
  Phone, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw 
} from 'lucide-react';
import { smsService, generatePaymentSMSMessage } from '../services/smsService';
import toast from 'react-hot-toast';

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
  const [customPhone, setCustomPhone] = useState(loan.customerPhone || '');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [smsStatus, setSmsStatus] = useState<'SENT' | 'FAILED' | 'IDLE'>(
    payment.smsStatus === 'SENT' ? 'SENT' : payment.smsStatus === 'FAILED' ? 'FAILED' : 'SENT'
  );

  const handlePrint = () => {
    window.print();
  };

  const defaultSmsMessage = generatePaymentSMSMessage({
    customerName: payment.customerName,
    customerPhone: customPhone,
    amount: payment.amount,
    loanId: loan.id,
    referenceNumber: payment.referenceNumber,
    remainingBalance: loan.outstandingBalance,
    paymentDate: payment.paymentDate,
    isFullySettled: loan.outstandingBalance <= 0 || loan.status === 'Settled' || loan.status === 'Early Settled',
  });

  const handleResendSMS = async () => {
    if (!customPhone) {
      toast.error('Please enter a valid recipient phone number.');
      return;
    }

    setIsSendingSms(true);
    const toastId = toast.loading(`Dispatching SMS to ${customPhone} via Text.lk...`);
    try {
      const res = await smsService.sendPaymentNotification({
        customerName: payment.customerName,
        customerPhone: customPhone,
        amount: payment.amount,
        loanId: loan.id,
        referenceNumber: payment.referenceNumber,
        remainingBalance: loan.outstandingBalance,
        paymentDate: payment.paymentDate,
        isFullySettled: loan.outstandingBalance <= 0 || loan.status === 'Settled' || loan.status === 'Early Settled',
      });

      if (res.success) {
        setSmsStatus('SENT');
        toast.success(`SMS payment alert sent to ${res.recipient}!`, { id: toastId });
        setIsEditingPhone(false);
      } else {
        setSmsStatus('FAILED');
        toast.error(`SMS Failed: ${res.message || res.error}`, { id: toastId });
      }
    } catch (err: any) {
      setSmsStatus('FAILED');
      toast.error(`SMS dispatch error: ${err.message}`, { id: toastId });
    } finally {
      setIsSendingSms(false);
    }
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
              className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition border border-slate-200 shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-blue-600" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-5 space-y-3.5 text-slate-700 max-h-[75vh] overflow-y-auto" id="receipt-print-area">
          
          {/* Company & Receipt Metadata */}
          <div className="flex justify-between items-start pb-3 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span className="font-extrabold text-slate-900 text-sm tracking-tight">SMV Holdings</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Micro Finance & Consultancy Capital Services</p>
              <p className="text-[10px] text-slate-500">Colombo, Sri Lanka • LKR Accounts</p>
            </div>
            <div className="text-right">
              <span className="text-[9px] uppercase font-bold text-blue-600 tracking-wider block">RECEIPT</span>
              <span className="font-mono text-xs font-bold text-slate-800 block">{payment.id}</span>
              <span className="text-[10px] text-slate-500">{payment.paymentDate}</span>
            </div>
          </div>

          {/* Customer & Loan Overview */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Customer Name</span>
              <span className="font-bold text-slate-900 text-xs">{payment.customerName}</span>
              <span className="text-slate-500 block mt-0.5 font-mono text-[10px]">NIC: {loan.kyc.nationalIdNumber}</span>
              <span className="text-slate-500 block font-mono text-[10px]">Tel: {loan.customerPhone}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Loan Reference</span>
              <span className="font-bold text-slate-900 text-xs">{loan.id}</span>
              <span className="text-slate-500 block mt-0.5 text-[10px]">{loan.loanType}</span>
              <span className="text-slate-500 block font-mono text-[10px]">Acc: {loan.accountNumber}</span>
            </div>
          </div>

          {/* Payment Breakdown Table */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Payment Allocation</div>
            <div className="bg-slate-50 rounded-xl border border-slate-200/80 p-3 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600 font-medium">Total Amount Received:</span>
                <span className="font-extrabold text-slate-900 text-sm">{formatCurrency(payment.amount)}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Payment Method:</span>
                <span className="text-slate-800 font-medium">{payment.paymentMethod} ({payment.referenceNumber})</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Principal Allocation:</span>
                <span className="text-slate-800 font-medium">{formatCurrency(payment.allocatedPrincipal)}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Interest Portion:</span>
                <span className="text-slate-800 font-medium">{formatCurrency(payment.allocatedInterest)}</span>
              </div>
              {payment.allocatedLateFee > 0 && (
                <div className="flex justify-between text-amber-800 text-[11px]">
                  <span>Late Fee Paid:</span>
                  <span className="font-medium">{formatCurrency(payment.allocatedLateFee)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Installment Covered:</span>
                <span className="text-slate-800 font-medium">#{payment.installmentNumbersCovered.join(', #')}</span>
              </div>
            </div>
          </div>

          {/* Adjusted Loan Balance Summary */}
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

          {/* 
          SMS Notification Banner (Commented out for now as requested)
          <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
                <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                <span>Text.lk SMS Notification</span>
              </div>

              {smsStatus === 'SENT' ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  SMS Dispatched
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Dispatch Failed
                </span>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-slate-400" />
                {isEditingPhone ? (
                  <input
                    type="text"
                    value={customPhone}
                    onChange={e => setCustomPhone(e.target.value)}
                    placeholder="077XXXXXXX"
                    className="px-2 py-0.5 bg-white border border-slate-300 rounded font-mono text-xs w-32 focus:ring-1 focus:ring-blue-500 outline-hidden"
                  />
                ) : (
                  <span className="font-mono text-slate-700 font-semibold">{customPhone || 'No Phone Number'}</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingPhone(!isEditingPhone)}
                  className="text-slate-500 hover:text-slate-700 text-[10px] underline"
                >
                  {isEditingPhone ? 'Done' : 'Change Phone'}
                </button>
                <button
                  type="button"
                  onClick={handleResendSMS}
                  disabled={isSendingSms}
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded text-[10px] font-semibold transition flex items-center gap-1 shadow-2xs"
                >
                  {isSendingSms ? (
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                  ) : (
                    <Send className="w-2.5 h-2.5" />
                  )}
                  <span>{isSendingSms ? 'Sending...' : 'Resend SMS'}</span>
                </button>
              </div>
            </div>

            <div className="p-2 bg-white rounded-lg border border-blue-100 text-[10px] font-mono text-slate-600 leading-relaxed">
              "{defaultSmsMessage}"
            </div>
          </div>
          */}

          {/* Footer note */}
          <div className="text-center pt-1 border-t border-slate-200 text-[10px] text-slate-500">
            Received by: {payment.receivedBy} • Official SMV Holdings Microfinance Receipt
          </div>

        </div>

        {/* Action Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white font-bold rounded-lg text-xs hover:bg-slate-800 transition shadow-2xs"
          >
            Done & Close
          </button>
        </div>

      </div>
    </div>
  );
};
