import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { X, ArrowDownLeft, CheckCircle2 } from 'lucide-react';
import { ConsultancyAgreement, ConsultancyReturnRecord } from '../types';
import { formatCurrency } from '../utils/consultancyUtils';
import { ConfirmModal } from './common/ConfirmModal';

interface ReturnFundsModalProps {
  agreement: ConsultancyAgreement;
  onClose: () => void;
  onConfirmReturn: (agreementId: string, returnRecord: ConsultancyReturnRecord) => void;
}

export const ReturnFundsModal: React.FC<ReturnFundsModalProps> = ({
  agreement,
  onClose,
  onConfirmReturn,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [returnDate, setReturnDate] = useState(todayStr);
  const [returnedAmount, setReturnedAmount] = useState<number>(agreement.placedAmount);
  const [paymentMethod, setPaymentMethod] = useState<ConsultancyReturnRecord['paymentMethod']>('Bank Transfer');
  const [referenceNumber, setReferenceNumber] = useState(`TRF-CS-${Math.floor(10000 + Math.random() * 90000)}`);
  const [processedBy, setProcessedBy] = useState('Officer James Sterling');
  const [notes, setNotes] = useState('Full 6-month capital returned back to business account.');
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!returnedAmount || returnedAmount <= 0) {
      toast.error('Please enter a valid returned amount.');
      return;
    }

    setIsConfirmOpen(true);
  };

  const handleFinalConfirm = () => {
    const returnRecord: ConsultancyReturnRecord = {
      id: `RET-${Math.floor(1000 + Math.random() * 9000)}`,
      returnDate,
      returnedAmount: Number(returnedAmount),
      paymentMethod,
      referenceNumber,
      processedBy,
      notes,
    };

    setIsConfirmOpen(false);
    onConfirmReturn(agreement.id, returnRecord);
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="bg-white border border-slate-200/80 rounded-2xl max-w-lg w-full overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-150">
          
          {/* Header */}
          <div className="p-4 bg-emerald-50/80 border-b border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
                <ArrowDownLeft className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Return 6-Month Consultancy Funds</h3>
                <p className="text-[11px] text-emerald-800">
                  Record capital returned by {agreement.customerName} back to business
                </p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            
            {/* Summary Banner */}
            <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Agreement ID:</span>
                <span className="font-mono font-bold text-slate-800">{agreement.id} ({agreement.agreementNumber})</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Customer Name:</span>
                <span className="font-bold text-slate-900">{agreement.customerName}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Originally Placed Capital:</span>
                <span className="font-bold text-blue-700">{formatCurrency(agreement.placedAmount)}</span>
              </div>
              <div className="flex justify-between text-xs pt-1 border-t border-slate-200/60">
                <span className="text-slate-500">Bank Account:</span>
                <span className="font-mono text-slate-700">{agreement.bankName} • {agreement.accountNumber}</span>
              </div>
            </div>

            {/* Form Inputs */}
            <div>
              <label className="text-slate-700 font-bold block mb-1 text-[11px] text-emerald-900">
                Returned Capital Amount (LKR) *
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={returnedAmount}
                onChange={e => setReturnedAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-white text-slate-900 font-extrabold text-sm py-2 px-3 rounded-lg border border-emerald-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-mono"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-600 font-medium block mb-1 text-[10px]">Return Transaction Date *</label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={e => setReturnDate(e.target.value)}
                  className="w-full bg-white text-slate-800 py-1.5 px-3 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1 text-[10px]">Payment Method *</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as ConsultancyReturnRecord['paymentMethod'])}
                  className="w-full bg-white text-slate-800 py-1.5 px-3 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs"
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Direct Deposit">Direct Deposit</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-600 font-medium block mb-1 text-[10px]">Transaction Reference No. *</label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={e => setReferenceNumber(e.target.value)}
                  className="w-full bg-white text-slate-800 py-1.5 px-3 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1 text-[10px]">Processed By Officer</label>
                <input
                  type="text"
                  value={processedBy}
                  onChange={e => setProcessedBy(e.target.value)}
                  className="w-full bg-white text-slate-800 py-1.5 px-3 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-600 font-medium block mb-1 text-[10px]">Return Remarks / Confirmation</label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Verified deposit in master company account"
                className="w-full bg-white text-slate-800 py-1.5 px-3 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs"
              />
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-xs text-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirm Return & Close Contract</span>
              </button>
            </div>

          </form>
        </div>
      </div>

      {/* Warning / Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleFinalConfirm}
        title="Confirm Capital Return & Close Agreement"
        description="Are you sure you want to record the return of funds for this agreement? Once confirmed, the agreement will be marked as 'Returned & Closed'."
        confirmLabel="Confirm & Return Funds"
        cancelLabel="Review Details"
        variant="warning"
        details={[
          { label: 'Client', value: agreement.customerName },
          { label: 'Agreement ID', value: `${agreement.id} (${agreement.agreementNumber})` },
          { label: 'Returned Amount', value: formatCurrency(returnedAmount) },
          { label: 'Payment Method', value: paymentMethod },
          { label: 'Reference No.', value: referenceNumber },
          { label: 'Return Date', value: returnDate },
        ]}
      />
    </>
  );
};
