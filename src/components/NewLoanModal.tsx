import React, { useState, useEffect, useRef } from "react";
import {
  X,
  PlusCircle,
  Calculator,
  User,
  DollarSign,
  Loader2,
  Lock,
} from "lucide-react";
import {
  CreateLoanPayload,
  InterestMethod,
  LoanType,
  RepaymentFrequency,
} from "../api";
import { generateInstallmentSchedule } from "../utils/loanUtils";
import { formatCurrency } from "../utils/consultancyUtils";
import { customerService } from "../services/customer.service";
import { useDebounce } from "../hooks/useDebounce";
import { useUI } from "../contexts/UIContext";
import { loanService } from "../services/loan.service";

interface NewLoanModalProps {
  onClose: () => void;
  onRefresh: () => void;
}

const PROCCESSIN_FEE = 0.00;

interface CustomerSuggestion {
  id: string;
  fullName: string;
  idNumber: string;
  phone: string;
}

export const NewLoanModal: React.FC<NewLoanModalProps> = ({
  onClose,
  onRefresh,
}) => {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [loanType, setLoanType] = useState<LoanType>("Instant_Personal");

  const [requestedAmount, setRequestedAmount] = useState<string>("");
  const [interestRatePerAnnum, setInterestRatePerAnnum] =
    useState<string>("14.0");
  const [termMonths, setTermMonths] = useState<string>("12");

  const [repaymentFrequency, setRepaymentFrequency] =
    useState<RepaymentFrequency>("Monthly");
  const [interestMethod, setInterestMethod] =
    useState<InterestMethod>("Reducing_Balance");
  const [purpose, setPurpose] = useState("");

  // -------- Lookup state --------
  const [suggestions, setSuggestions] = useState<CustomerSuggestion[]>([]);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [matchedCustomerId, setMatchedCustomerId] = useState<string | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const debouncedId = useDebounce(idNumber, 300);

  // -------- Lookup on ID change --------
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const q = debouncedId.trim();
      if (q.length < 3) {
        setSuggestions([]);
        setShowSuggestions(false);
        setMatchedCustomerId(null);
        return;
      }

      setLookupLoading(true);
      try {
        const results = await customerService.lookupByIdNumber(q);
        if (cancelled) return;

        setSuggestions(results);

        // Exact match → autofill + lock
        const exact = results.find(
          (r) => r.idNumber.toLowerCase() === q.toLowerCase(),
        );
        if (exact) {
          setCustomerName(exact.fullName);
          setCustomerPhone(exact.phone);
          setMatchedCustomerId(exact.id);
          setShowSuggestions(false);
        } else {
          // Partial matches → show dropdown, don't autofill yet
          setMatchedCustomerId(null);
          setShowSuggestions(results.length > 0);
        }
      } catch {
        if (!cancelled) {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } finally {
        if (!cancelled) setLookupLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [debouncedId]);

  // -------- Click outside to close dropdown --------
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handlePickSuggestion = (s: CustomerSuggestion) => {
    setIdNumber(s.idNumber);
    setCustomerName(s.fullName);
    setCustomerPhone(s.phone);
    setMatchedCustomerId(s.id);
    setShowSuggestions(false);
  };

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIdNumber(e.target.value);
    // If the user edits the ID after an autofill, unlock the name/phone
    if (matchedCustomerId) {
      setMatchedCustomerId(null);
    }
  };

  // -------- Preview calculations --------
  const numericAmount = parseFloat(requestedAmount) || 0;
  const numericRate = parseFloat(interestRatePerAnnum) || 0;
  const numericTerm = parseInt(termMonths) || 1;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Guard — prevents double submit from rapid clicks or Enter key
    if (submitting) return;
    if (!customerName || numericAmount <= 0) return;

    setSubmitting(true);

    try {
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
      };

      await loanService.createLoan(newLoan);

      onRefresh();
      onClose();
    } catch (err) {
      // Error already toasted inside loanService; keep the modal open
      console.error("Loan create failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const isAutofilled = Boolean(matchedCustomerId);

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="flex min-h-full items-start sm:items-center justify-center p-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl max-w-3xl w-full shadow-xl animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92dvh] sm:max-h-[90dvh]">
          <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between shrink-0 rounded-t-2xl">
            <div className="flex items-center gap-2 text-blue-600">
              <PlusCircle className="w-4 h-4" />
              <h3 className="font-bold text-slate-900 text-sm">
                New Loan Application Request
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col flex-1 min-h-0"
          >
            <div className="p-5 space-y-4 text-xs text-slate-700 overflow-y-auto flex-1 min-h-0">
              {/* Customer Personal Details */}
              <div>
                <h4 className="font-semibold text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-1.5 text-[10px]">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  1. Customer Profile
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* ID Number with lookup */}
                  <div ref={wrapperRef} className="relative">
                    <label className="text-slate-600 font-medium block mb-1 text-[10px]">
                      NIC / Passport Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={idNumber}
                        onChange={handleIdChange}
                        onFocus={() =>
                          suggestions.length > 0 && setShowSuggestions(true)
                        }
                        placeholder="e.g. 981-22-1092"
                        autoComplete="off"
                        className="w-full bg-white text-slate-800 py-1.5 px-2.5 pr-8 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs font-mono"
                        required
                      />
                      {lookupLoading && (
                        <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-blue-500 animate-spin" />
                      )}
                      {!lookupLoading && isAutofilled && (
                        <Lock className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-emerald-600" />
                      )}
                    </div>

                    {/* Suggestions dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                        <div className="px-2.5 py-1.5 text-[10px] font-semibold text-slate-500 bg-slate-50 border-b border-slate-100 sticky top-0">
                          Existing customers ({suggestions.length})
                        </div>
                        {suggestions.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => handlePickSuggestion(s)}
                            className="w-full text-left px-2.5 py-2 hover:bg-blue-50 transition border-b border-slate-50 last:border-0 cursor-pointer"
                          >
                            <div className="font-semibold text-slate-900 text-xs truncate">
                              {s.fullName}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                              <span>{s.idNumber}</span>
                              {s.phone && (
                                <span className="text-slate-400">
                                  • {s.phone}
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
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
                      disabled={isAutofilled}
                      className="w-full bg-white text-slate-800 py-1.5 px-2.5 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
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
                      disabled={isAutofilled}
                      className="w-full bg-white text-slate-800 py-1.5 px-2.5 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                      required
                    />
                  </div>
                </div>

                {isAutofilled && (
                  <p className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200/60 rounded-md px-2 py-1 mt-2 inline-flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Existing customer matched — name and phone auto-filled and
                    locked.
                  </p>
                )}
              </div>

              {/* Loan Contract Configuration (unchanged) */}
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
                      <option value="Emergency_Quick">
                        Emergency Quick Loan
                      </option>
                      <option value="Standard_Personal">
                        Standard Personal Loan
                      </option>
                      <option value="Business_Expansion">
                        Business Expansion
                      </option>
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
                      onChange={(e) => setRequestedAmount(e.target.value)}
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
                      onChange={(e) => setInterestRatePerAnnum(e.target.value)}
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
                        setRepaymentFrequency(
                          e.target.value as RepaymentFrequency,
                        )
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

              {/* Purpose */}
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

              {/* Preview */}
              <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-100/80 space-y-2">
                <div className="flex items-center gap-1.5 text-blue-700 font-semibold text-xs">
                  <Calculator className="w-3.5 h-3.5 text-blue-600" />
                  <span>Instant Schedule Calculation Preview</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-slate-700">
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
            </div>

            {/* Sticky footer */}
            <div className="flex justify-end gap-2 p-4 border-t border-slate-100 bg-white shrink-0 rounded-b-2xl">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 rounded-lg font-medium text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium rounded-lg shadow-xs text-xs transition cursor-pointer inline-flex items-center gap-1.5"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  {submitting ? "Submitting…" : "Submit Loan Application"}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
