import React, { useState, useEffect, useRef } from "react";
import {
  X,
  PlusCircle,
  Calculator,
  User,
  DollarSign,
  Loader2,
  Lock,
  ShieldCheck,
  Phone,
  Check,
} from "lucide-react";
import {
  CreateLoanPayload,
  InterestMethod,
  LoanType,
  RepaymentFrequency,
} from "../../api";
import { generateInstallmentSchedule } from "../../utils/loanUtils";
import { formatCurrency } from "../../utils/consultancyUtils";
import { customerService } from "../../services/customer.service";
import { useDebounce } from "../../hooks/useDebounce";
import { loanService } from "../../services/loan.service";
import toast from "react-hot-toast";

interface NewLoanModalProps {
  onClose: () => void;
  onRefresh: () => void;
}

const PROCCESSIN_FEE = 0.0;
const OTP_LENGTH = 4;
const MIN_PHONE_DIGITS = 9;

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
  const [loanType, setLoanType] = useState<LoanType>("Instant_Loan_Daily");

  const [requestedAmount, setRequestedAmount] = useState<string>("");
  const [interestRatePerMonth, setInterestRatePerMonth] =
    useState<string>("10.0");
  const [termMonths, setTermMonths] = useState<string>("1");

  const [repaymentFrequency, setRepaymentFrequency] =
    useState<RepaymentFrequency>("Daily");
  const [interestMethod, setInterestMethod] =
    useState<InterestMethod>("Flat_Rate");
  const [purpose, setPurpose] = useState("");

  // -------- Lookup state --------
  const [suggestions, setSuggestions] = useState<CustomerSuggestion[]>([]);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [matchedCustomerId, setMatchedCustomerId] = useState<string | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);

  // -------- Phone OTP state --------
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);
  const [showOtpBox, setShowOtpBox] = useState(false);
  const [otp, setOtp] = useState<string[]>(
    Array.from({ length: OTP_LENGTH }, () => ""),
  );
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const otpWrapperRef = useRef<HTMLDivElement>(null);
  const debouncedId = useDebounce(idNumber, 300);

  // -------- Helpers --------
  const digitsOnly = (s: string) => s.replace(/\D/g, "");

  const isValidPhone = (s: string) => digitsOnly(s).length >= MIN_PHONE_DIGITS;

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

        const exact = results.find(
          (r) => r.idNumber.toLowerCase() === q.toLowerCase(),
        );
        if (exact) {
          setCustomerName(exact.fullName);
          setCustomerPhone(exact.phone);
          setMatchedCustomerId(exact.id);
          setShowSuggestions(false);
        } else {
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

  // -------- Click outside to close suggestions & OTP --------
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
      if (
        otpWrapperRef.current &&
        !otpWrapperRef.current.contains(e.target as Node)
      ) {
        const hasInput = otp.some((d) => d.length > 0);
        if (!hasInput && !verifyingOtp) setShowOtpBox(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [otp, verifyingOtp]);

  const handlePickSuggestion = (s: CustomerSuggestion) => {
    setIdNumber(s.idNumber);
    setCustomerName(s.fullName);
    setCustomerPhone(s.phone);
    setMatchedCustomerId(s.id);
    setShowSuggestions(false);

    if (s.phone !== verifiedPhone) {
      setPhoneVerified(false);
      setVerifiedPhone(null);
    }
  };

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIdNumber(e.target.value);
    if (matchedCustomerId) {
      setMatchedCustomerId(null);
    }
  };

  // -------- Phone input: only digits, +, spaces, dashes --------
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const cleaned = raw.replace(/[^\d+\s-]/g, "");
    const normalized = cleaned.startsWith("+")
      ? "+" + cleaned.slice(1).replace(/\+/g, "")
      : cleaned.replace(/\+/g, "");

    setCustomerPhone(normalized);

    if (phoneVerified || verifiedPhone) {
      setPhoneVerified(false);
      setVerifiedPhone(null);
    }
    if (showOtpBox) {
      setShowOtpBox(false);
      setOtp(Array.from({ length: OTP_LENGTH }, () => ""));
    }
  };

  // -------- Open OTP box & send code --------
  const openOtpAndSend = async (phone: string) => {
    setShowOtpBox(true);
    setOtp(Array.from({ length: OTP_LENGTH }, () => ""));
    setTimeout(() => otpRefs.current[0]?.focus(), 50);

    setSendingOtp(true);
    try {
      await customerService.sendPhoneOtp(phone);
      toast.success(`OTP sent to ${phone}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to send OTP");
      setShowOtpBox(false);
    } finally {
      setSendingOtp(false);
    }
  };

  // Click on the phone field: only open OTP if a valid number is present
  const handlePhoneFieldClick = () => {
    const phone = customerPhone.trim();

    if (!isValidPhone(phone)) return;
    if (phoneVerified && verifiedPhone === phone) return;

    openOtpAndSend(phone);
  };

  // -------- OTP input handlers --------
  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);

    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }

    if (next.every((d) => d.length === 1)) {
      setTimeout(() => handleVerifyOtp(next.join("")), 100);
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!pasted) return;

    const next = Array.from({ length: OTP_LENGTH }, (_, i) => pasted[i] ?? "");
    setOtp(next);
    const lastIndex = Math.min(pasted.length, OTP_LENGTH) - 1;
    otpRefs.current[lastIndex]?.focus();

    if (pasted.length === OTP_LENGTH) {
      setTimeout(() => handleVerifyOtp(pasted), 100);
    }
  };

  // -------- Verify --------
  const handleVerifyOtp = async (codeOverride?: string) => {
    const code = (codeOverride ?? otp.join("")).trim();
    if (code.length !== OTP_LENGTH) {
      toast.error("Enter the 4-digit code");
      return;
    }

    setVerifyingOtp(true);
    try {
      const ok = await customerService.verifyPhoneOtp(
        customerPhone.trim(),
        code,
      );
      if (ok) {
        setPhoneVerified(true);
        setVerifiedPhone(customerPhone.trim());
        setShowOtpBox(false);
        setOtp(Array.from({ length: OTP_LENGTH }, () => ""));
        toast.success("Phone number verified");
      } else {
        toast.error("Invalid OTP");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to verify OTP");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    setOtp(Array.from({ length: OTP_LENGTH }, () => ""));
    setSendingOtp(true);
    try {
      await customerService.sendPhoneOtp(customerPhone.trim());
      toast.success("OTP resent");
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    } catch (err: any) {
      toast.error(err?.message || "Failed to resend OTP");
    } finally {
      setSendingOtp(false);
    }
  };

  // -------- Preview calculations --------
  const numericAmount = parseFloat(requestedAmount) || 0;
  const monthlyRate = parseFloat(interestRatePerMonth) || 0;
  const numericRate = monthlyRate * 12;
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

    if (submitting) return;
    if (!customerName || numericAmount <= 0) return;

    if (!phoneVerified || verifiedPhone !== customerPhone.trim()) {
      toast.error("Please verify the phone number before submitting");
      return;
    }

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
      onClose();
    } catch (err) {
      console.error("Loan create failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const isAutofilled = Boolean(matchedCustomerId);
  const phoneOk = phoneVerified && verifiedPhone === customerPhone.trim();
  const phoneDigits = digitsOnly(customerPhone).length;
  const showPhoneHint =
    !phoneOk && phoneDigits > 0 && phoneDigits < MIN_PHONE_DIGITS;

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

                  {/* Phone with OTP verification */}
                  <div ref={otpWrapperRef} className="relative">
                    <label className="text-slate-600 font-medium block mb-1 text-[10px] flex items-center justify-between">
                      <span>Phone Number</span>
                      {phoneOk && (
                        <span className="text-emerald-600 inline-flex items-center gap-0.5 text-[9px] font-bold uppercase">
                          <ShieldCheck className="w-3 h-3" />
                          Verified
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="tel"
                        value={customerPhone}
                        onChange={handlePhoneChange}
                        onClick={handlePhoneFieldClick}
                        placeholder="+94 7X XXX XXXX"
                        disabled={isAutofilled && phoneOk}
                        className={`w-full bg-white text-slate-800 py-1.5 px-2.5 pr-16 rounded-lg border text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed ${
                          phoneOk
                            ? "border-emerald-400 bg-emerald-50/30"
                            : "border-slate-200/80"
                        }`}
                        required
                      />
                      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        {sendingOtp && (
                          <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                        )}
                        {phoneOk && (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                        {!phoneOk &&
                          !sendingOtp &&
                          isValidPhone(customerPhone) && (
                            <button
                              type="button"
                              onClick={() => {
                                const phone = customerPhone.trim();
                                if (!isValidPhone(phone)) {
                                  toast.error(
                                    "Enter a valid phone number first",
                                  );
                                  return;
                                }
                                openOtpAndSend(phone);
                              }}
                              className="text-[9px] font-bold uppercase text-blue-600 hover:text-blue-700 px-1.5 py-0.5 rounded bg-blue-50 hover:bg-blue-100 transition cursor-pointer"
                              title="Verify this phone number"
                            >
                              Verify
                            </button>
                          )}
                      </div>
                    </div>

                    {showPhoneHint && (
                      <p className="text-[9px] text-slate-400 mt-0.5">
                        {MIN_PHONE_DIGITS - phoneDigits} more minimum digit
                        {MIN_PHONE_DIGITS - phoneDigits === 1 ? "" : "s"} needed
                      </p>
                    )}

                    {/* OTP Box */}
                    {showOtpBox && !phoneOk && (
                      <div className="absolute z-40 top-full right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-3 w-72 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-700">
                            <Phone className="w-3 h-3 text-blue-600" />
                            Enter 4-digit code
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setShowOtpBox(false);
                              setOtp(
                                Array.from({ length: OTP_LENGTH }, () => ""),
                              );
                            }}
                            className="p-0.5 text-slate-400 hover:text-slate-600 rounded transition cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>

                        <p className="text-[10px] text-slate-500 mb-2">
                          Sent to{" "}
                          <span className="font-mono font-semibold text-slate-700">
                            {customerPhone}
                          </span>
                        </p>

                        <div className="flex items-center justify-center gap-2 mb-3">
                          {otp.map((digit, i) => (
                            <input
                              key={i}
                              ref={(el) => {
                                otpRefs.current[i] = el;
                              }}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={digit}
                              onChange={(e) =>
                                handleOtpChange(i, e.target.value)
                              }
                              onKeyDown={(e) => handleOtpKeyDown(i, e)}
                              onPaste={handleOtpPaste}
                              disabled={verifyingOtp}
                              className="w-10 h-11 text-center text-lg font-bold font-mono bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 disabled:opacity-50 transition"
                            />
                          ))}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleVerifyOtp()}
                            disabled={verifyingOtp || otp.some((d) => !d)}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium text-xs py-1.5 rounded-lg transition cursor-pointer"
                          >
                            {verifyingOtp ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <ShieldCheck className="w-3.5 h-3.5" />
                            )}
                            <span>
                              {verifyingOtp ? "Verifying…" : "Verify"}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={sendingOtp}
                            className="text-[10px] text-slate-500 hover:text-blue-600 font-medium px-2 py-1.5 rounded transition disabled:opacity-50 cursor-pointer"
                          >
                            Resend
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {isAutofilled && (
                  <p className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200/60 rounded-md px-2 py-1 mt-2 inline-flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Existing customer matched — name auto-filled. Verify phone
                    to continue.
                  </p>
                )}
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
                      <option value="Instant_Loan_Daily">
                        Instant Loan Daily
                      </option>
                      <option value="Instant_Loan_Monthly">
                        Instant Loan Monthly
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
                      Interest Rate (% P.M.)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={interestRatePerMonth}
                      onChange={(e) => setInterestRatePerMonth(e.target.value)}
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
                      <option value="Daily">Daily</option>
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
                disabled={submitting || !phoneOk}
                title={!phoneOk ? "Verify the phone number first" : ""}
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
