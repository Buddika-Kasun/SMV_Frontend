import React, { useState } from 'react';
import { 
  X, Building2, User, FileText, Calendar, CheckCircle2, 
  Clock, Download, Printer, ShieldCheck, CreditCard, ArrowDownLeft
} from 'lucide-react';
import { ConsultancyAgreement } from '../types';
import { formatCurrency, getDaysRemaining } from '../utils/consultancyUtils';

interface ConsultancyDetailsModalProps {
  agreement: ConsultancyAgreement;
  onClose: () => void;
  onOpenReturnModal: (agreement: ConsultancyAgreement) => void;
}

export const ConsultancyDetailsModal: React.FC<ConsultancyDetailsModalProps> = ({
  agreement,
  onClose,
  onOpenReturnModal,
}) => {
  const [showPassbookPreview, setShowPassbookPreview] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  const daysLeft = getDaysRemaining(agreement.maturityDate);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white border border-slate-200/80 rounded-2xl max-w-3xl w-full overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-150 my-6">
        
        {/* Header */}
        <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Building2 className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">{agreement.customerName}</h3>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  agreement.status === 'Returned & Closed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' :
                  agreement.status === 'Maturing Soon' ? 'bg-amber-50 text-amber-700 border border-amber-200/60' :
                  agreement.status === 'Maturity Reached' ? 'bg-rose-50 text-rose-700 border border-rose-200/60' :
                  'bg-blue-50 text-blue-700 border border-blue-200/60'
                }`}>
                  {agreement.status}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono">
                Agreement No: {agreement.agreementNumber} • Placed: {agreement.startDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-1.5 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-lg text-xs font-medium flex items-center gap-1"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button 
              onClick={onClose} 
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-5">
          
          {/* Key Metrics Header Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-100">
              <span className="text-[10px] text-blue-700 font-semibold uppercase tracking-wider block">Placed Capital (6 Months)</span>
              <span className="text-xl font-extrabold text-blue-900">{formatCurrency(agreement.placedAmount)}</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Deposited by business to client</span>
            </div>

            <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100">
              <span className="text-[10px] text-emerald-700 font-semibold uppercase tracking-wider block">Passbook Last Statement Balance</span>
              <span className="text-xl font-extrabold text-emerald-900">{formatCurrency(agreement.lastStatementBalance)}</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Verified on passbook copy</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Maturity Status</span>
              <div className="flex items-center gap-1.5 mt-1">
                <Clock className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-bold text-slate-900">
                  {agreement.status === 'Returned & Closed' 
                    ? 'Returned & Settled' 
                    : daysLeft > 0 ? `${daysLeft} Days Left` : 'Return Due Now'}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">Maturity Date: {agreement.maturityDate}</span>
            </div>
          </div>

          {/* Section 1: Customer & Bank Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer Details */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 space-y-2">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <User className="w-3.5 h-3.5 text-blue-600" />
                Customer Identity Details
              </h4>
              <div className="text-xs space-y-1.5 pt-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Full Name:</span>
                  <span className="font-semibold text-slate-800">{agreement.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">NIC / Passport:</span>
                  <span className="font-mono text-slate-800">{agreement.nationalIdNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone:</span>
                  <span className="text-slate-800">{agreement.customerPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email:</span>
                  <span className="text-slate-800 truncate max-w-[180px]">{agreement.customerEmail}</span>
                </div>
              </div>
            </div>

            {/* Bank Details & Passbook Document Box */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 space-y-2">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                Bank Passbook & Account Details
              </h4>
              <div className="text-xs space-y-1.5 pt-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Bank Name:</span>
                  <span className="font-semibold text-slate-800">{agreement.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Account Number:</span>
                  <span className="font-mono font-bold text-slate-800">{agreement.accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Statement Balance:</span>
                  <span className="font-bold text-emerald-700">{formatCurrency(agreement.lastStatementBalance)}</span>
                </div>

                {/* Attachment Status */}
                <div className="pt-2">
                  {agreement.passbookDocument ? (
                    <div className="bg-blue-50/60 border border-blue-200/80 p-2.5 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <div>
                          <span className="text-[11px] font-semibold text-slate-900 block truncate max-w-[180px]">
                            {agreement.passbookDocument.fileName}
                          </span>
                          <span className="text-[9px] text-slate-500">Passbook Statement Proof</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowPassbookPreview(!showPassbookPreview)}
                        className="text-[10px] font-semibold text-blue-700 bg-white hover:bg-blue-50 px-2 py-1 rounded border border-blue-200 transition"
                      >
                        {showPassbookPreview ? 'Hide Document' : 'View Passbook'}
                      </button>
                    </div>
                  ) : (
                    <div className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                      No passbook statement copy attached.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Passbook Preview Drawer if toggled */}
          {showPassbookPreview && agreement.passbookDocument && (
            <div className="bg-slate-900 text-white p-4 rounded-xl space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">
                    Attached Passbook Document Preview - {agreement.passbookDocument.fileName}
                  </span>
                </div>
                <button 
                  onClick={() => setShowPassbookPreview(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Close Preview
                </button>
              </div>

              {/* Passbook Document Render */}
              <div className="bg-white rounded-lg p-4 text-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div>
                    <h5 className="font-extrabold text-slate-900 text-sm">{agreement.bankName}</h5>
                    <p className="text-[10px] text-slate-500">Official Customer Bank Account Statement Passbook</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Verified Last Statement Balance</span>
                    <span className="text-base font-extrabold text-emerald-700">{formatCurrency(agreement.lastStatementBalance)}</span>
                  </div>
                </div>

                <div className="aspect-21/9 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 relative flex items-center justify-center">
                  {agreement.passbookDocument.fileUrl ? (
                    <img 
                      src={agreement.passbookDocument.fileUrl} 
                      alt="Bank Passbook Statement" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                      <p className="text-xs text-slate-600 font-medium">Bank Passbook PDF Statement Attached</p>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                    AUTHENTICATED STATEMENT
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 2: 6-Month Timeline Progress */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900">6-Month Consultancy Placement Timeline</span>
              <span className="text-slate-500">{agreement.startDate} → {agreement.maturityDate}</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div 
                className={`h-2.5 rounded-full transition-all ${
                  agreement.status === 'Returned & Closed' ? 'bg-emerald-600' :
                  daysLeft <= 0 ? 'bg-rose-600' :
                  daysLeft <= 30 ? 'bg-amber-500' : 'bg-blue-600'
                }`}
                style={{
                  width: agreement.status === 'Returned & Closed' ? '100%' : `${Math.min(100, Math.max(5, ((180 - daysLeft) / 180) * 100))}%`
                }}
              />
            </div>

            <div className="flex justify-between text-[11px] text-slate-500 pt-0.5">
              <span>Day 1 (Placement)</span>
              <span>
                {agreement.status === 'Returned & Closed' 
                  ? 'Returned & Settled' 
                  : daysLeft > 0 ? `${daysLeft} days until 6-month maturity` : '6 Months Reached'}
              </span>
              <span>Day 180 (Return Capital)</span>
            </div>
          </div>

          {/* Return Record if Settled */}
          {agreement.returnRecord && (
            <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-emerald-900 text-xs">Capital Returned & Contract Closed</span>
                </div>
                <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">
                  Ref: {agreement.returnRecord.referenceNumber}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                <div>
                  <span className="text-slate-500 text-[10px] block">Return Date</span>
                  <span className="font-semibold text-slate-800">{agreement.returnRecord.returnDate}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Returned Capital</span>
                  <span className="font-extrabold text-emerald-800">{formatCurrency(agreement.returnRecord.returnedAmount)}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Method</span>
                  <span className="font-medium text-slate-800">{agreement.returnRecord.paymentMethod}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Processed By</span>
                  <span className="font-medium text-slate-800">{agreement.returnRecord.processedBy}</span>
                </div>
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <span className="text-[10px] text-slate-400">
              InstaLend Finance Consultancy Module
            </span>

            <div className="flex items-center gap-2">
              {agreement.status !== 'Returned & Closed' && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenReturnModal(agreement);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-xs transition shadow-xs flex items-center gap-1.5"
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span>Process Return of Capital</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-xs transition"
              >
                Close
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
