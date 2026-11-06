import React, { useState, useEffect } from "react";
import { formatCurrency } from "../../utils/consultancyUtils";
import { X, FileText, Loader2, Eye } from "lucide-react";
import { Loan, LoanDocument } from "../../api";
import {
  getDocumentTypeLabel,
  getInstallmentStatusColor,
  getInstallmentStatusLabel,
  getInterestMethodLabel,
  getLoanStatusColor,
  getLoanStatusLabel,
} from "../../utils/loanUtils";
import { loanService } from "../../services/loan.service";

interface LoanDetailsModalProps {
  loanId: string;
  onClose: () => void;
  onOpenPaymentModal: (loanId: string) => void;
  onOpenSettlement: (loanId: string) => void;
  openDocumentPreview: (doc: LoanDocument) => void;
}

export const LoanDetailsModal: React.FC<LoanDetailsModalProps> = ({
  loanId,
  onClose,
  onOpenPaymentModal,
  onOpenSettlement,
  openDocumentPreview,
}) => {
  const [loan, setLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "schedule" | "payments" | "kyc" | "penalty"
  >("schedule");

  useEffect(() => {
    let isMounted = true;

    const fetchLoan = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedLoan = await loanService.getLoanById(loanId);
        if (isMounted) {
          if (fetchedLoan) {
            setLoan(fetchedLoan);
          } else {
            setError("Loan not found");
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Failed to load loan details");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchLoan();

    return () => {
      isMounted = false;
    };
  }, [loanId]);

  // Loading State
  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden max-w-md w-full p-6 shadow-lg flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm text-slate-600 font-medium">
            Loading loan details...
          </p>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !loan) {
    return (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden max-w-md w-full p-6 shadow-lg space-y-4">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-rose-50 rounded-full">
              <X className="w-6 h-6 text-rose-600" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">
              Error Loading Loan
            </h3>
            <p className="text-xs text-slate-500">
              {error || "Loan not found"}
            </p>
          </div>
          <div className="flex justify-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 overflow-y-auto">
      <div className="flex min-h-full items-start sm:items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-xl max-w-6xl w-full max-h-[92dvh] sm:max-h-[90dvh] flex flex-col shadow-lg animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
          {/* Header */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center gap-2 justify-between shrink-0">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">
                      {loan.customer?.fullName}
                    </h3>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold ${getLoanStatusColor(loan.status)}`}
                    >
                      {getLoanStatusLabel(loan.status)}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5 flex flex-col md:flex-row">
                    <span>Contract ID: {loan.loanNumber} </span>
                    <span>• Account: {loan.account?.accountNumber}</span>
                    <span>• ID No: {loan.customer?.idNumber || "N/A"}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="md:hidden p-1 text-slate-400 hover:text-slate-600 rounded transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {(loan.status === "Active" || loan.status === "Overdue") && (
                <>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenPaymentModal(loan.id);
                    }}
                    className="flex-1 md:flex-none px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs transition shadow-xs cursor-pointer"
                  >
                    Enter Payment
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenSettlement(loan.id);
                    }}
                    className="flex-1 md:flex-none px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded text-xs transition shadow-xs cursor-pointer"
                  >
                    Early Settlement
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="hidden md:block p-1 text-slate-400 hover:text-slate-600 rounded transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Loan Summary Grid */}
          {/* <div className="p-4 bg-slate-50/50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs shrink-0">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">
                {loan.account?.disbursedAmount == 0 ? "Requested Amount" : "Disbursed Amount"}
              </span>
              <div className="flex flex-col">
                <span className="font-extrabold text-slate-900 text-xs">
                  {loan.account?.disbursedAmount == 0 ? formatCurrency(loan.requestedAmount) : formatCurrency(loan.account?.disbursedAmount!)}
                </span>
                <span className="text-[10px] text-bold">
                  {loan.disbursedDate ? loan.disbursedDate : "Not disbursed"}
                </span>
              </div>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">
                Interest Rate & Method
              </span>
              <span className="font-bold text-slate-800 text-xs">
                {loan.interestRatePerAnnum / 12}% P.M. (
                {getInterestMethodLabel(loan.interestMethod)})
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">
                Total Interest Amount
              </span>
              <span className="font-bold text-slate-800 text-xs">
                {formatCurrency(loan.account?.interestAmount!)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">
                Total Repaid To Date
              </span>
              <span className="font-extrabold text-teal-700 text-xs">
                {formatCurrency(loan.totalPaidAmount)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">
                Outstanding Balance
              </span>
              <span className="font-extrabold text-blue-600 text-xs">
                {formatCurrency(loan.outstandingBalance)}
              </span>
            </div>
          </div> */}
          {/* Loan Summary Grid */}
          <div className="p-4 bg-slate-50/50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs shrink-0">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">
                {loan.account?.disbursedAmount == 0
                  ? "Requested Amount"
                  : "Disbursed Amount"}
              </span>
              <div className="flex flex-col">
                <span className="font-extrabold text-slate-900 text-xs">
                  {loan.account?.disbursedAmount == 0
                    ? formatCurrency(loan.requestedAmount)
                    : formatCurrency(loan.account?.disbursedAmount!)}
                </span>
                <span className="text-[10px] font-bold text-slate-500">
                  {loan.disbursedDate ? loan.disbursedDate : "Not disbursed"}
                </span>
              </div>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">
                Interest Rate & Method
              </span>
              <span className="font-bold text-slate-800 text-xs">
                {loan.interestRatePerAnnum / 12}% P.M. (
                {getInterestMethodLabel(loan.interestMethod)})
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">
                Total Interest Amount
              </span>
              <span className="font-bold text-slate-800 text-xs">
                {formatCurrency(
                  loan.installments?.reduce(
                    (sum, i) => sum + Number(i.interestAmount || 0),
                    0,
                  ) ?? 0,
                )}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">
                Total Repaid To Date
              </span>
              <span className="font-extrabold text-teal-700 text-xs">
                {formatCurrency(loan.totalPaidAmount)}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">
                Outstanding Balance
              </span>
              <span className="font-extrabold text-blue-600 text-xs">
                {formatCurrency(loan.outstandingBalance)}
              </span>
            </div>
          </div>

          {/* Overdue summary — only when loan is Overdue */}
          {loan.status === "Overdue" &&
            (() => {
              const today = new Date(new Date().setHours(0, 0, 0, 0));

              // Total due = sum of remaining amounts on overdue installments
              const overdueInstallments =
                loan.installments?.filter(
                  (i) =>
                    i.status !== "Paid" &&
                    Number(i.remainingAmount) > 0 &&
                    new Date(i.dueDate) < today,
                ) ?? [];

              const totalDue = overdueInstallments.reduce(
                (sum, i) => sum + Number(i.remainingAmount || 0),
                0,
              );

              // Days from earliest overdue due date to today
              const earliestDue = overdueInstallments
                .map((i) => new Date(i.dueDate).getTime())
                .sort((a, b) => a - b)[0];

              const daysOverdue = earliestDue
                ? Math.max(
                    0,
                    Math.floor((today.getTime() - earliestDue) / 86_400_000),
                  )
                : 0;

              const monthPenaltyRate =
                loan.repaymentFrequency === "Daily" ? 5 : 10;

              // Penalty rate: 5% for Daily, 10% for others
              // const annualPenaltyRate = monthPenaltyRate * 12;

              // Penalty = totalDue * (annualPenaltyRate / 100) / 365 * daysOverdue
              // const penalty =
              //   Math.round(
              //     ((totalDue * (annualPenaltyRate / 100)) / 365) *
              //       daysOverdue *
              //       100,
              //   ) / 100;
              const penalty = loan.penaltyAmount || 0;

              const totalRemainingToPay =
                Math.round((totalDue + penalty) * 100) / 100;

              return (
                <div className="px-4 py-3 bg-rose-50/60 border-b border-rose-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs shrink-0">
                  <div>
                    <span className="text-rose-700 block text-[10px] uppercase font-bold">
                      Total Due
                    </span>
                    <span className="font-extrabold text-rose-900 text-sm">
                      {formatCurrency(totalDue)}
                    </span>
                    <span className="text-[10px] text-rose-600 block">
                      {overdueInstallments.length} overdue installment
                      {overdueInstallments.length === 1 ? "" : "s"} ·{" "}
                      {daysOverdue} day{daysOverdue === 1 ? "" : "s"} overdue
                    </span>
                  </div>

                  <div>
                    <span className="text-rose-700 block text-[10px] uppercase font-bold">
                      Penalty (Total due × {monthPenaltyRate}% p.m. ×{" "}
                      {daysOverdue} day
                      {daysOverdue === 1 ? "" : "s"} + Remaining Penalty)
                    </span>
                    <span className="font-extrabold text-amber-700 text-sm">
                      {formatCurrency(penalty)}
                    </span>
                  </div>

                  <div>
                    <span className="text-rose-700 block text-[10px] uppercase font-bold">
                      Total Remaining to Pay
                    </span>
                    <span className="font-extrabold text-rose-900 text-sm">
                      {formatCurrency(totalRemainingToPay)}
                    </span>
                  </div>
                </div>
              );
            })()}

          {/* Modal Inner Tabs */}
          <div className="flex border-b border-slate-200 bg-white px-4 pt-2 overflow-x-auto shrink-0">
            <button
              onClick={() => setActiveTab("schedule")}
              className={`px-3 py-1.5 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === "schedule"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Amortization Schedule ({loan.installments?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("payments")}
              className={`px-3 py-1.5 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === "payments"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Payment History ({loan.payments?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("kyc")}
              className={`px-3 py-1.5 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === "kyc"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Verified KYC Info
            </button>
            {loan.penaltyPayments && loan.penaltyPayments.length > 0 && (
              <button
                onClick={() => setActiveTab("penalty")}
                className={`px-3 py-1.5 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
                  activeTab === "penalty"
                    ? "border-rose-600 text-rose-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Penalty History ({loan.penaltyPayments?.length || 0})
              </button>
            )}
          </div>

          {/* Tab Contents */}
          <div className="p-4 flex-1 overflow-y-auto min-h-0">
            {/* 1. Amortization Schedule Table */}
            {activeTab === "schedule" && (
              <div className="overflow-x-auto border border-slate-200 rounded">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-bold border-b border-slate-200 text-[10px]">
                    <tr>
                      <th className="py-2 px-2.5">#</th>
                      <th className="py-2 px-2.5">Due Date</th>
                      <th className="py-2 px-2.5">Principal</th>
                      <th className="py-2 px-2.5">Interest</th>
                      <th className="py-2 px-2.5">Total Due</th>
                      <th className="py-2 px-2.5">Paid Amount</th>
                      <th className="py-2 px-2.5">Remaining</th>
                      <th className="py-2 px-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono text-slate-800 text-[11px]">
                    {loan.installments?.map((inst) => (
                      <tr
                        key={inst.installmentNumber}
                        className="hover:bg-slate-50/80"
                      >
                        <td className="py-2 px-2.5 font-bold text-slate-500 whitespace-nowrap">
                          #{inst.installmentNumber}
                        </td>
                        <td className="py-2 px-2.5 whitespace-nowrap">
                          {inst.dueDate}
                        </td>
                        <td className="py-2 px-2.5 whitespace-nowrap">
                          {formatCurrency(inst.principalAmount)}
                        </td>
                        <td className="py-2 px-2.5 text-slate-500 whitespace-nowrap">
                          {formatCurrency(inst.interestAmount)}
                        </td>
                        <td className="py-2 px-2.5 font-bold text-slate-900 whitespace-nowrap">
                          {formatCurrency(inst.totalInstallment + inst.lateFee)}
                        </td>
                        <td className="py-2 px-2.5 text-teal-700 font-semibold whitespace-nowrap">
                          {formatCurrency(inst.paidAmount)}
                        </td>
                        <td className="py-2 px-2.5 text-blue-600 font-bold whitespace-nowrap">
                          {formatCurrency(inst.remainingAmount)}
                        </td>
                        <td className="py-2 px-2.5 font-sans whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${getInstallmentStatusColor(inst.status)}`}
                          >
                            {getInstallmentStatusLabel(inst.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {(!loan.installments || loan.installments.length === 0) && (
                  <p className="text-xs text-slate-400 text-center py-6">
                    No installments yet.
                  </p>
                )}
              </div>
            )}

            {/* 2. Payment History */}
            {activeTab === "payments" && (
              <div className="space-y-2">
                {loan.payments?.map((p) => (
                  <div
                    key={p.id}
                    className="bg-slate-50 p-3 rounded border border-slate-200 text-xs space-y-1"
                  >
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-blue-600 text-xs">
                        {formatCurrency(p.amount)}
                      </span>
                      <span className="text-slate-500 font-mono text-[10px]">
                        {p.paymentDate}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>
                        Method: {p.paymentMethod} ({p.referenceNumber})
                      </span>
                      <span>Received By: {p.receivedBy}</span>
                    </div>
                    {p.notes && (
                      <p className="text-slate-600 italic bg-white p-1.5 rounded border border-slate-200 text-[10px]">
                        {p.notes}
                      </p>
                    )}
                  </div>
                ))}

                {(!loan.payments || loan.payments.length === 0) && (
                  <p className="text-xs text-slate-400 text-center py-6">
                    No payment receipts issued for this loan contract yet.
                  </p>
                )}
              </div>
            )}

            {/* 3. KYC Verified Info */}
            {activeTab === "kyc" && loan.customer && (
              <div className="space-y-3 text-xs">
                <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-900 text-xs">
                    Customer Profile & Guarantor
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-slate-700 text-[11px]">
                    <div className="flex md:flex-col gap-2 md:gap-0">
                      <span className="text-slate-500 block text-[10px]">
                        NIC / ID Number:
                      </span>
                      <span className="font-mono">
                        {loan.customer.idNumber || "N/A"}
                      </span>
                    </div>
                    <div className="flex md:flex-col gap-2 md:gap-0">
                      <span className="text-slate-500 block text-[10px]">
                        Name:
                      </span>
                      <span className="font-mono">
                        {loan.customer.fullName || "N/A"}
                      </span>
                    </div>
                    <div className="flex md:flex-col gap-2 md:gap-0">
                      <span className="text-slate-500 block text-[10px]">
                        Phone:
                      </span>
                      <span className="font-mono">
                        {loan.customer.phone || "N/A"}
                      </span>
                    </div>
                    <div className="flex md:flex-col gap-2 md:gap-0">
                      <span className="text-slate-500 block text-[10px]">
                        Address:
                      </span>
                      <span className="font-mono">
                        {loan.customer?.addressLine || loan.customer?.city
                          ? [loan.customer.addressLine, loan.customer.city]
                              .filter(Boolean)
                              .join(", ")
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex md:flex-col gap-2 md:gap-0">
                      <span className="text-slate-500 block text-[10px]">
                        Occupation:
                      </span>
                      <span>{loan.customer.occupation || "N/A"}</span>
                    </div>
                    <div className="flex md:flex-col gap-2 md:gap-0">
                      <span className="text-slate-500 block text-[10px]">
                        Monthly Income:
                      </span>
                      <span className="font-bold text-green-700">
                        {formatCurrency(loan.customer.monthlyIncome || 0)}
                      </span>
                    </div>
                    <div className="flex md:flex-col gap-2 md:gap-0">
                      <span className="text-slate-500 block text-[10px]">
                        Guarantor Name:
                      </span>
                      <span>{loan.guarantor?.fullName || "N/A"}</span>
                      <span className="text-[10px] text-slate-500">
                        {loan.guarantor?.idNumber || "N/A"}
                      </span>
                    </div>
                    <div className="flex md:flex-col gap-2 md:gap-0">
                      <span className="text-slate-500 block text-[10px]">
                        Guarantor Phone:
                      </span>
                      <span>{loan.guarantor?.phone || "N/A"}</span>
                    </div>
                    <div className="flex md:flex-col gap-2 md:gap-0">
                      <span className="text-slate-500 block text-[10px]">
                        Guarantor Relationship:
                      </span>
                      <span>{loan.guarantor?.relation || "N/A"}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 mb-1.5 text-xs">
                    Verified Documents
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {loan.documents?.map((d) => (
                      <div
                        key={d.id}
                        className="bg-slate-50 p-2.5 rounded border border-slate-200 flex items-center justify-between"
                      >
                        <div>
                          <span className="font-bold text-slate-800 block text-xs">
                            {getDocumentTypeLabel(d.documentType)}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {d.fileName}
                          </span>
                        </div>
                        <button
                          onClick={() => openDocumentPreview(d)}
                          className="p-1.5 text-slate-600 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 rounded-lg transition shrink-0 cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    {(!loan.documents || loan.documents.length === 0) && (
                      <p className="text-xs text-slate-400 py-4 col-span-2 text-center">
                        No documents uploaded.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 4. Penalty Payment History */}
            {activeTab === "penalty" && (
              <div className="space-y-3 text-xs">
                {/* Live penalty summary — always visible on this tab */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-amber-50/70 border border-amber-200/60 rounded-lg p-3">
                    <span className="text-[10px] text-amber-700 uppercase font-bold block">
                      Accrued Total Penalty
                    </span>
                    <span className="font-extrabold text-amber-900 text-sm">
                      {formatCurrency(
                        Number(loan.penaltyAmount ?? 0) +
                          (loan.penaltyPayments?.reduce(
                            (s, p) => s + Number(p.paidAmount || 0),
                            0,
                          ) ?? 0),
                      )}
                    </span>
                    <span className="text-[10px] text-amber-600 block mt-0.5">
                      Before any payments
                    </span>
                  </div>

                  <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-lg p-3">
                    <span className="text-[10px] text-emerald-700 uppercase font-bold block">
                      Penalty Paid
                    </span>
                    <span className="font-extrabold text-emerald-900 text-sm">
                      {formatCurrency(
                        loan.penaltyPayments?.reduce(
                          (s, p) => s + Number(p.paidAmount || 0),
                          0,
                        ) ?? 0,
                      )}
                    </span>
                    <span className="text-[10px] text-emerald-600 block mt-0.5">
                      {loan.penaltyPayments?.length || 0} payment
                      {(loan.penaltyPayments?.length || 0) === 1
                        ? ""
                        : "s"}{" "}
                      applied
                    </span>
                  </div>

                  <div className="bg-rose-50/70 border border-rose-200/60 rounded-lg p-3">
                    <span className="text-[10px] text-rose-700 uppercase font-bold block">
                      Remaining Penalty
                    </span>
                    <span className="font-extrabold text-rose-900 text-sm">
                      {formatCurrency(loan.penaltyAmount ?? 0)}
                    </span>
                    <span className="text-[10px] text-rose-600 block mt-0.5">
                      {loan.penaltyLastAccrued
                        ? `Accrued through ${loan.penaltyLastAccrued.slice(0, 10)}`
                        : "Not accrued yet"}
                    </span>
                  </div>
                </div>

                {/* History list */}
                <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-xs">
                      Penalty Payment Ledger
                    </h4>
                    <span className="text-[10px] text-slate-500">
                      {loan.penaltyPayments?.length || 0} entr
                      {(loan.penaltyPayments?.length || 0) === 1 ? "y" : "ies"}
                    </span>
                  </div>

                  {loan.penaltyPayments && loan.penaltyPayments.length > 0 ? (
                    <div className="space-y-2">
                      {loan.penaltyPayments
                        .slice()
                        .sort(
                          (a, b) =>
                            new Date(b.paidDate).getTime() -
                            new Date(a.paidDate).getTime(),
                        )
                        .map((p) => (
                          <div
                            key={p.id}
                            className="bg-white p-3 rounded-lg border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-emerald-700 text-xs">
                                  + {formatCurrency(p.paidAmount)}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {new Date(p.paidDate)
                                    .toISOString()
                                    .slice(0, 10)}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                Snapshot before:{" "}
                                <span className="font-mono">
                                  {formatCurrency(p.penaltySnapshot)}
                                </span>
                                {" · "}
                                Remaining after:{" "}
                                <span className="font-mono">
                                  {formatCurrency(p.remainingAmount)}
                                </span>
                              </div>
                              {p.paymentId && (
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                  Ref: {p.paymentId.slice(0, 8)}…
                                </div>
                              )}
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-[10px] text-slate-400 block">
                                Applied to penalty
                              </span>
                              <span className="font-semibold text-slate-700 text-xs">
                                {formatCurrency(p.paidAmount)}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-6">
                      No penalty payments recorded for this loan yet.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
