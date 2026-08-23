import React, { useState } from 'react';
import { Loan, LoanType, RepaymentFrequency, InterestMethod } from '../types';
import { generateInstallmentSchedule, formatCurrency } from '../utils/loanUtils';
import { X, PlusCircle, Calculator, Sparkles, User, DollarSign, Calendar } from 'lucide-react';

interface NewLoanModalProps {
  onClose: () => void;
  onCreateLoan: (newLoan: Loan) => void;
}

export const NewLoanModal: React.FC<NewLoanModalProps> = ({
  onClose,
  onCreateLoan,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [nationalIdNumber, setNationalIdNumber] = useState('');
  const [loanType, setLoanType] = useState<LoanType>('Instant Personal');
  const [requestedAmount, setRequestedAmount] = useState<number>(500000);
  const [interestRatePerAnnum, setInterestRatePerAnnum] = useState<number>(14.0);
  const [termMonths, setTermMonths] = useState<number>(12);
  const [repaymentFrequency, setRepaymentFrequency] = useState<RepaymentFrequency>('Monthly');
  const [interestMethod, setInterestMethod] = useState<InterestMethod>('Reducing Balance');
  const [purpose, setPurpose] = useState('');
  const [creditScore, setCreditScore] = useState<number>(720);

  // Generate instant live schedule preview
  const previewSchedule = generateInstallmentSchedule(
    requestedAmount,
    interestRatePerAnnum,
    termMonths,
    repaymentFrequency,
    interestMethod
  );

  const estimatedEMI = previewSchedule.length > 0 ? previewSchedule[0].totalInstallment : 0;
  const totalInterestCost = previewSchedule.reduce((s, i) => s + i.interestAmount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || requestedAmount <= 0) return;

    const newLoanId = `LN-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newLoan: Loan = {
      id: newLoanId,
      accountNumber: `ACC-${Math.floor(100000 + Math.random() * 900000)}`,
      customerName,
      customerPhone: customerPhone || '+1 (555) 000-1122',
      customerEmail: customerEmail || `${customerName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      loanType,
      requestedAmount,
      disbursedAmount: requestedAmount,
      interestRatePerAnnum,
      termMonths,
      repaymentFrequency,
      interestMethod,
      processingFee: Math.round(requestedAmount * 0.02),
      earlySettlementPenaltyPercent: 2.5,
      status: 'Pending Approval',
      requestedDate: new Date().toISOString().split('T')[0],
      purpose: purpose || 'Personal Financial Assistance',
      creditScore,
      totalPaidAmount: 0,
      outstandingBalance: requestedAmount,
      kyc: {
        nationalIdNumber: nationalIdNumber || `${Math.floor(100 + Math.random() * 900)}-${Math.floor(10 + Math.random() * 90)}-${Math.floor(1000 + Math.random() * 9000)}`,
        idType: 'NIC',
        dateOfBirth: '1993-08-14',
        gender: 'Male',
        occupation: 'General Employee',
        employerName: 'Local Enterprise',
        monthlyIncome: 4500,
        addressLine: 'Main Avenue',
        city: 'Metro City',
        postalCode: '10001',
        guarantorName: 'Emergency Contact',
        guarantorPhone: '+1 (555) 999-0011',
        guarantorRelation: 'Relative',
        bankName: 'National Bank',
        accountNumber: '**** **** 8812',
        isVerified: false,
        documents: [],
      },
      installments: previewSchedule,
      payments: [],
    };

    onCreateLoan(newLoan);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white border border-slate-200/80 rounded-2xl max-w-3xl w-full overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-150">
        
        <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-600">
            <PlusCircle className="w-4 h-4" />
            <h3 className="font-bold text-slate-900 text-sm">New Loan Application Request</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs text-slate-700">
          
          {/* Customer Personal Details */}
          <div>
            <h4 className="font-semibold text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-1.5 text-[10px]">
              <User className="w-3.5 h-3.5 text-blue-600" />
              1. Customer Profile
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="text-slate-600 font-medium block mb-1 text-[10px]">Customer Full Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-white text-slate-800 py-1.5 px-2.5 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
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
                  className="w-full bg-white text-slate-800 py-1.5 px-2.5 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
                />
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1 text-[10px]">NIC / Passport Number</label>
                <input
                  type="text"
                  value={nationalIdNumber}
                  onChange={e => setNationalIdNumber(e.target.value)}
                  placeholder="e.g. 981-22-1092"
                  className="w-full bg-white text-slate-800 py-1.5 px-2.5 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs font-mono"
                  required
                />
              </div>
            </div>
          </div>

          {/* Loan Contract Configuration */}
          <div>
            <h4 className="font-semibold text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-1.5 text-[10px]">
              <DollarSign className="w-3.5 h-3.5 text-blue-600" />
              2. Loan Contract Terms
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="text-slate-600 font-medium block mb-1 text-[10px]">Loan Category</label>
                <select
                  value={loanType}
                  onChange={e => setLoanType(e.target.value as LoanType)}
                  className="w-full bg-white text-slate-800 py-1.5 px-2.5 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
                >
                  <option value="Instant Personal">Instant Personal Loan</option>
                  <option value="Emergency Quick">Emergency Quick Loan</option>
                  <option value="Standard Personal">Standard Personal Loan</option>
                  <option value="Business Expansion">Business Expansion</option>
                  <option value="Micro Enterprise">Micro Enterprise</option>
                </select>
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1 text-[10px]">Requested Amount (LKR)</label>
                <input
                  type="number"
                  value={requestedAmount}
                  onChange={e => setRequestedAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white text-slate-900 font-bold py-1.5 px-2.5 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1 text-[10px]">Interest Rate (% P.A.)</label>
                <input
                  type="number"
                  step="0.1"
                  value={interestRatePerAnnum}
                  onChange={e => setInterestRatePerAnnum(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white text-slate-800 py-1.5 px-2.5 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1 text-[10px]">Term Duration (Months)</label>
                <input
                  type="number"
                  value={termMonths}
                  onChange={e => setTermMonths(parseInt(e.target.value) || 1)}
                  className="w-full bg-white text-slate-800 py-1.5 px-2.5 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1 text-[10px]">Repayment Frequency</label>
                <select
                  value={repaymentFrequency}
                  onChange={e => setRepaymentFrequency(e.target.value as RepaymentFrequency)}
                  className="w-full bg-white text-slate-800 py-1.5 px-2.5 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Bi-Weekly">Bi-Weekly</option>
                  <option value="Weekly">Weekly</option>
                </select>
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1 text-[10px]">Interest Calculation Method</label>
                <select
                  value={interestMethod}
                  onChange={e => setInterestMethod(e.target.value as InterestMethod)}
                  className="w-full bg-white text-slate-800 py-1.5 px-2.5 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
                >
                  <option value="Reducing Balance">Reducing Balance (Standard)</option>
                  <option value="Flat Rate">Flat Rate Interest</option>
                </select>
              </div>
            </div>
          </div>

          {/* Purpose & Credit Score */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="text-slate-600 font-medium block mb-1 text-[10px]">Loan Purpose</label>
              <input
                type="text"
                value={purpose}
                onChange={e => setPurpose(e.target.value)}
                placeholder="e.g. Home Renovation, Equipment"
                className="w-full bg-white text-slate-800 py-1.5 px-2.5 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
              />
            </div>
            <div>
              <label className="text-slate-600 font-medium block mb-1 text-[10px]">Applicant Credit Score</label>
              <input
                type="number"
                min="300"
                max="850"
                value={creditScore}
                onChange={e => setCreditScore(parseInt(e.target.value) || 600)}
                className="w-full bg-white text-slate-800 py-1.5 px-2.5 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs font-mono"
              />
            </div>
          </div>

          {/* Instant Calculation Preview */}
          <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-100/80 space-y-2">
            <div className="flex items-center gap-1.5 text-blue-700 font-semibold text-xs">
              <Calculator className="w-3.5 h-3.5 text-blue-600" />
              <span>Instant Schedule Calculation Preview</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-slate-700">
              <div>
                <span className="text-slate-500 block text-[10px]">Estimated EMI:</span>
                <span className="font-extrabold text-blue-900 text-xs">{formatCurrency(estimatedEMI)}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Total Scheduled Interest:</span>
                <span className="font-bold text-amber-700 text-xs">{formatCurrency(totalInterestCost)}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Total Repayment Value:</span>
                <span className="font-bold text-emerald-800 text-xs">{formatCurrency(requestedAmount + totalInterestCost)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-xs text-xs transition"
            >
              Submit Loan Application
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
