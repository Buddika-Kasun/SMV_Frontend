import React, { useState } from "react";
// import { Loan, LoanType, RepaymentFrequency, InterestMethod } from "../types";
// import {
//   generateInstallmentSchedule,
//   formatCurrency,
// } from "../utils/loanUtils";
import {
  X,
  PlusCircle,
  Calculator,
  Sparkles,
  User,
  DollarSign,
  Calendar,
} from "lucide-react";
import { CreateLoanPayload, InterestMethod, LoanType, RepaymentFrequency } from "../api";
import { generateInstallmentSchedule } from "../utils/loanUtils";
import { formatCurrency } from "../utils/consultancyUtils";

interface NewLoanModalProps {
  onClose: () => void;
  onCreateLoan: (newLoan: CreateLoanPayload) => void;
}

const PROCCESSIN_FEE = 0.02;

export const NewLoanModal: React.FC<NewLoanModalProps> = ({ onClose, onCreateLoan }) => {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  // const [customerEmail, setCustomerEmail] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [loanType, setLoanType] = useState<LoanType>("Instant_Personal");

  // Use string for input, convert to number on submit/preview
  const [requestedAmount, setRequestedAmount] = useState<string>("");
  const [interestRatePerAnnum, setInterestRatePerAnnum] =
    useState<string>("14.0");
  const [termMonths, setTermMonths] = useState<string>("12");

  const [repaymentFrequency, setRepaymentFrequency] =
    useState<RepaymentFrequency>("Monthly");
  const [interestMethod, setInterestMethod] =
    useState<InterestMethod>("Reducing_Balance");
  const [purpose, setPurpose] = useState("");
  // const [creditScore, setCreditScore] = useState<number>(720);

  // Convert to numbers for preview calculations
  const numericAmount = parseFloat(requestedAmount) || 0;
  const numericRate = parseFloat(interestRatePerAnnum) || 0;
  const numericTerm = parseInt(termMonths) || 1;

  // Generate instant live schedule preview
  const previewSchedule = generateInstallmentSchedule(
    numericAmount,
    numericRate,
    numericTerm,
    repaymentFrequency,
    interestMethod,
  );

  const estimatedEMI =
    previewSchedule.length > 0 ? previewSchedule[0].totalInstallment : 0;
  const totalInterestCost = previewSchedule.reduce(
    (s, i) => s + i.interestAmount,
    0,
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || numericAmount <= 0) return;

    const newLoanId = `LN-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newLoan: CreateLoanPayload = {
      customerName,
      customerPhone,
      idNumber,
      loanType,
      requestedAmount: numericAmount,
      disbursedAmount: numericAmount,
      interestRatePerAnnum: numericRate,
      termMonths: numericTerm,
      repaymentFrequency,
      interestMethod,
      processingFee: Math.round(numericAmount * PROCCESSIN_FEE),
      earlySettlementPenaltyPercent: 2.5,
      purpose: purpose || "Personal Financial Assistance",
      // creditScore,
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
            <h3 className="font-bold text-slate-900 text-sm">
              New Loan Application Request
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-5 space-y-4 text-xs text-slate-700"
        >
          {/* Customer Personal Details */}
          <div>
            <h4 className="font-semibold text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-1.5 text-[10px]">
              <User className="w-3.5 h-3.5 text-blue-600" />
              1. Customer Profile
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="text-slate-600 font-medium block mb-1 text-[10px]">
                  NIC / Passport Number
                </label>
                <input
                  type="text"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="e.g. 981-22-1092"
                  className="w-full bg-white text-slate-800 py-1.5 px-2.5 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1 text-[10px]">
                  Customer Full Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-white text-slate-800 py-1.5 px-2.5 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1 text-[10px]">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-white text-slate-800 py-1.5 px-2.5 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
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
                <label className="text-slate-600 font-medium block mb-1 text-[10px]">
                  Loan Category
                </label>
                <select
                  value={loanType}
                  onChange={(e) => setLoanType(e.target.value as LoanType)}
                  className="w-full bg-white text-slate-800 py-1.5 px-2.5 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
                >
                  <option value="Instant_Personal">
                    Instant Personal Loan
                  </option>
                  <option value="Emergency_Quick">Emergency Quick Loan</option>
                  <option value="Standard_Personal">
                    Standard Personal Loan
                  </option>
                  <option value="Business_Expansion">Business Expansion</option>
                  <option value="Micro_Enterprise">Micro Enterprise</option>
                </select>
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1 text-[10px]">
                  Requested Amount (LKR)
                </label>
                <input
                  type="number"
                  value={requestedAmount}
                  onChange={(e) =>
                    setRequestedAmount(e.target.value)
                  }
                  placeholder="0"
                  className="w-full bg-white text-slate-900 font-bold py-1.5 px-2.5 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1 text-[10px]">
                  Interest Rate (% P.A.)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={interestRatePerAnnum}
                  onChange={(e) =>
                    setInterestRatePerAnnum(e.target.value)
                  }
                  className="w-full bg-white text-slate-800 py-1.5 px-2.5 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1 text-[10px]">
                  Term Duration (Months)
                </label>
                <input
                  type="number"
                  value={termMonths}
                  onChange={(e) => setTermMonths(e.target.value)}
                  className="w-full bg-white text-slate-800 py-1.5 px-2.5 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1 text-[10px]">
                  Repayment Frequency
                </label>
                <select
                  value={repaymentFrequency}
                  onChange={(e) =>
                    setRepaymentFrequency(e.target.value as RepaymentFrequency)
                  }
                  className="w-full bg-white text-slate-800 py-1.5 px-2.5 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Bi-Weekly">Bi-Weekly</option>
                  <option value="Weekly">Weekly</option>
                </select>
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1 text-[10px]">
                  Interest Calculation Method
                </label>
                <select
                  value={interestMethod}
                  onChange={(e) =>
                    setInterestMethod(e.target.value as InterestMethod)
                  }
                  className="w-full bg-white text-slate-800 py-1.5 px-2.5 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
                >
                  <option value="Reducing_Balance">
                    Reducing Balance (Standard)
                  </option>
                  <option value="Flat_Rate">Flat Rate Interest</option>
                </select>
              </div>
            </div>
          </div>

          {/* Purpose & Credit Score */}
          <div className="">
            <div>
              <label className="text-slate-600 font-medium block mb-1 text-[10px]">
                Loan Purpose
              </label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. Home Renovation, Equipment"
                className="w-full bg-white text-slate-800 py-1.5 px-2.5 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
              />
            </div>
            {/* <div>
              <label className="text-slate-600 font-medium block mb-1 text-[10px]">
                Applicant Credit Score
              </label>
              <input
                type="number"
                min="300"
                max="850"
                value={creditScore}
                onChange={(e) =>
                  setCreditScore(parseInt(e.target.value) || 600)
                }
                className="w-full bg-white text-slate-800 py-1.5 px-2.5 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs font-mono"
              />
            </div> */}
          </div>

          {/* Instant Calculation Preview */}
          <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-100/80 space-y-2">
            <div className="flex items-center gap-1.5 text-blue-700 font-semibold text-xs">
              <Calculator className="w-3.5 h-3.5 text-blue-600" />
              <span>Instant Schedule Calculation Preview</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-slate-700">
              <div>
                <span className="text-slate-500 block text-[10px]">
                  Estimated EMI:
                </span>
                <span className="font-extrabold text-blue-900 text-xs">
                  {formatCurrency(estimatedEMI)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">
                  Total Scheduled Interest:
                </span>
                <span className="font-bold text-amber-700 text-xs">
                  {formatCurrency(totalInterestCost)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">
                  Total Repayment Value:
                </span>
                <span className="font-bold text-emerald-800 text-xs">
                  {formatCurrency(numericAmount + totalInterestCost)}
                </span>
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
};;;
