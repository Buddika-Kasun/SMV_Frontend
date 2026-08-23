import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { X, Building2, User, Upload, CheckCircle2, FileText, AlertCircle, Calendar } from 'lucide-react';
import { ConsultancyAgreement, ConsultancyDocument } from '../types';
import { calculateMaturityDate, formatCurrency } from '../utils/consultancyUtils';

interface OnboardConsultancyModalProps {
  onClose: () => void;
  onOnboard: (agreement: ConsultancyAgreement) => void;
}

export const OnboardConsultancyModal: React.FC<OnboardConsultancyModalProps> = ({
  onClose,
  onOnboard,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [nationalIdNumber, setNationalIdNumber] = useState('');

  const [bankName, setBankName] = useState('Commercial Bank of Ceylon');
  const [accountNumber, setAccountNumber] = useState('');
  const [lastStatementBalance, setLastStatementBalance] = useState<number | ''>(500000);
  const [lastStatementDate, setLastStatementDate] = useState(todayStr);

  // File Attachment State
  const [attachedDoc, setAttachedDoc] = useState<ConsultancyDocument | null>({
    id: 'DOC-' + Date.now(),
    fileName: 'customer_bank_passbook_statement.pdf',
    fileType: 'application/pdf',
    fileSize: '1.4 MB',
    fileUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&q=80',
    uploadedAt: new Date().toLocaleString(),
  });
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [placedAmount, setPlacedAmount] = useState<number | ''>(1500000);
  const [startDate, setStartDate] = useState(todayStr);
  const [monthlyConsultancyFee, setMonthlyConsultancyFee] = useState<number | ''>(15000);
  const [notes, setNotes] = useState('');

  const maturityDate = calculateMaturityDate(startDate, 6);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('File size exceeds 10MB limit.');
        toast.error('File size exceeds 10MB limit.');
        return;
      }
      setUploadError(null);
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachedDoc({
          id: 'DOC-' + Date.now(),
          fileName: file.name,
          fileType: file.type || 'application/pdf',
          fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          fileUrl: event.target?.result as string,
          uploadedAt: new Date().toLocaleString(),
        });
        toast.success(`Attached ${file.name}`);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUseSamplePassbook = () => {
    setAttachedDoc({
      id: 'DOC-SAMPLE-' + Date.now(),
      fileName: 'verified_passbook_last_statement.pdf',
      fileType: 'application/pdf',
      fileSize: '2.1 MB',
      fileUrl: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=500&q=80',
      uploadedAt: new Date().toLocaleString(),
    });
    setUploadError(null);
    toast.success('Sample passbook attached');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName || !nationalIdNumber || !accountNumber || lastStatementBalance === '') {
      toast.error('Please complete all required customer, bank, and statement balance fields.');
      return;
    }

    if (!placedAmount || Number(placedAmount) <= 0) {
      toast.error('Please enter a valid placed amount for the 6-month consultancy.');
      return;
    }

    const newAgreement: ConsultancyAgreement = {
      id: `CS-2026-${Math.floor(8000 + Math.random() * 1000)}`,
      agreementNumber: `CAG-${Math.floor(1000 + Math.random() * 9000)}-6M`,
      customerName,
      customerPhone: customerPhone || '+1 (555) 000-0000',
      customerEmail: customerEmail || `${customerName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      nationalIdNumber,
      bankName,
      accountNumber,
      lastStatementBalance: Number(lastStatementBalance),
      lastStatementDate,
      passbookDocument: attachedDoc || undefined,
      placedAmount: Number(placedAmount),
      startDate,
      maturityDate,
      termMonths: 6,
      monthlyConsultancyFee: Number(monthlyConsultancyFee) || 0,
      status: 'Active Placed',
      notes: notes || '6-Month Consultancy Placement Agreement with attached bank passbook proof.',
      createdDate: new Date().toISOString().split('T')[0],
    };

    onOnboard(newAgreement);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white border border-slate-200/80 rounded-2xl max-w-3xl w-full overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-150 my-6">
        
        {/* Header */}
        <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Onboard Consultancy Client (6-Month Placement)</h3>
              <p className="text-[11px] text-slate-500">
                Deposit company funds into customer account for 6 months & attach passbook statement.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          
          {/* Section 1: Customer Profile */}
          <div>
            <h4 className="font-semibold text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-1.5 text-[10px]">
              <User className="w-3.5 h-3.5 text-blue-600" />
              1. Customer Personal Profile
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-slate-600 font-medium block mb-1 text-[10px]">Customer Full Name *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="e.g. Robert Vance"
                  className="w-full bg-white text-slate-800 py-1.5 px-3 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1 text-[10px]">National ID / NIC / Passport *</label>
                <input
                  type="text"
                  value={nationalIdNumber}
                  onChange={e => setNationalIdNumber(e.target.value)}
                  placeholder="e.g. 882-90-1120"
                  className="w-full bg-white text-slate-800 py-1.5 px-3 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1 text-[10px]">Phone Number</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-white text-slate-800 py-1.5 px-3 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Bank Passbook & Last Statement Details (Crucial User Requirement) */}
          <div className="bg-blue-50/40 p-4 rounded-xl border border-blue-100/80 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-blue-800 uppercase tracking-wider flex items-center gap-1.5 text-[10px]">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                2. Customer Bank Passbook & Statement Verification
              </h4>
              <span className="text-[10px] bg-blue-100 text-blue-800 font-medium px-2 py-0.5 rounded-full">
                Required Verification
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-slate-700 font-medium block mb-1 text-[10px]">Bank Name *</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={e => setBankName(e.target.value)}
                  placeholder="e.g. Chase Bank, Commercial Bank"
                  className="w-full bg-white text-slate-800 py-1.5 px-3 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-slate-700 font-medium block mb-1 text-[10px]">Customer Account Number *</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value)}
                  placeholder="e.g. 0918-2201-998"
                  className="w-full bg-white text-slate-800 py-1.5 px-3 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1 text-[10px] text-blue-900">
                  Passbook Last Statement Balance (LKR) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={lastStatementBalance}
                  onChange={e => setLastStatementBalance(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="e.g. 4250"
                  className="w-full bg-white text-blue-900 font-bold py-1.5 px-3 rounded-lg border border-blue-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs font-mono"
                  required
                />
              </div>
            </div>

            {/* Passbook Document File Upload Dropzone */}
            <div>
              <label className="text-slate-700 font-medium block mb-1 text-[10px]">
                Attach Bank Passbook / Last Statement Document
              </label>

              {attachedDoc ? (
                <div className="bg-white border border-blue-200 rounded-xl p-3 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900 text-xs block">{attachedDoc.fileName}</span>
                      <span className="text-[10px] text-slate-500">
                        Size: {attachedDoc.fileSize || '1.4 MB'} • Uploaded: {attachedDoc.uploadedAt}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAttachedDoc(null)}
                      className="text-xs text-rose-600 hover:text-rose-800 font-medium px-2 py-1 bg-rose-50 rounded-lg border border-rose-200/60"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-blue-200 bg-white hover:bg-blue-50/50 rounded-xl p-4 text-center transition">
                  <Upload className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                  <p className="text-xs font-medium text-slate-700">
                    Click to select or drag & drop customer bank passbook scan or last statement PDF
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Supports PDF, PNG, JPG (Max 10MB)</p>
                  
                  <div className="mt-3 flex items-center justify-center gap-3">
                    <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-3.5 py-1.5 rounded-lg transition shadow-2xs">
                      <span>Browse Files</span>
                      <input type="file" onChange={handleFileUpload} accept="image/*,.pdf" className="hidden" />
                    </label>
                    <span className="text-[10px] text-slate-400">or</span>
                    <button
                      type="button"
                      onClick={handleUseSamplePassbook}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs px-3 py-1.5 rounded-lg transition border border-slate-200/80"
                    >
                      Use Sample Verified Passbook
                    </button>
                  </div>
                </div>
              )}

              {uploadError && (
                <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {uploadError}
                </p>
              )}
            </div>
          </div>

          {/* Section 3: 6-Month Consultancy Placement Terms */}
          <div>
            <h4 className="font-semibold text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-1.5 text-[10px]">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              3. 6-Month Consultancy Funds Placement Terms
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-slate-600 font-medium block mb-1 text-[10px]">
                  Placed Capital Amount (LKR) *
                </label>
                <input
                  type="number"
                  min="100"
                  step="100"
                  value={placedAmount}
                  onChange={e => setPlacedAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="e.g. 1500000"
                  className="w-full bg-white text-slate-900 font-bold py-1.5 px-3 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1 text-[10px]">Placement Start Date *</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full bg-white text-slate-800 py-1.5 px-3 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1 text-[10px]">Contract Duration</label>
                <input
                  type="text"
                  value="6 Months (Fixed)"
                  disabled
                  className="w-full bg-slate-100 text-slate-600 font-semibold py-1.5 px-3 rounded-lg border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1 text-[10px]">Calculated Return Date</label>
                <input
                  type="text"
                  value={maturityDate}
                  disabled
                  className="w-full bg-emerald-50 text-emerald-800 font-bold py-1.5 px-3 rounded-lg border border-emerald-200 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="text-slate-600 font-medium block mb-1 text-[10px]">Monthly Consultancy Fee (LKR)</label>
                <input
                  type="number"
                  value={monthlyConsultancyFee}
                  onChange={e => setMonthlyConsultancyFee(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="e.g. 150"
                  className="w-full bg-white text-slate-800 py-1.5 px-3 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
                />
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1 text-[10px]">Agreement Notes / Clauses</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Return in full after 6 months to company main account"
                  className="w-full bg-white text-slate-800 py-1.5 px-3 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Terms Highlight Banner */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between text-xs text-slate-600">
            <div>
              <span className="font-semibold text-slate-900 block">6-Month Capital Return Contract</span>
              <span className="text-[11px] text-slate-500">
                Business deposits {formatCurrency(Number(placedAmount) || 0)} into customer's account on {startDate}. Full capital to be returned on {maturityDate}.
              </span>
            </div>
            <div className="text-right shrink-0 font-extrabold text-blue-700 text-sm">
              {formatCurrency(Number(placedAmount) || 0)}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-xs text-xs transition"
            >
              Confirm Onboarding & Place Funds
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
