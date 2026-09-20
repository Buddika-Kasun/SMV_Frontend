import React, { useState, useEffect, useCallback } from "react";
import { formatCurrency } from "../../utils/consultancyUtils";
import {
  useResizableColumns,
  ColumnConfig,
} from "../../hooks/useResizableColumns";
import { ResizableTh, ResizableTableContainer } from "../common/ResizableTable";
import { PaymentReceiptModal } from "../PaymentReceiptModal";
import { Pagination } from "../common/Pagination";
import { ConfirmModal } from "../common/ConfirmModal";
import {
  CreditCard,
  Banknote,
  History,
  Receipt,
  LayoutGrid,
  LayoutList,
  ChevronDown,
  ChevronUp,
  Search,
  Loader2,
  CheckCircle2,
  Award,
  Printer,
  X,
  Eye,
} from "lucide-react";
import { EarlySettlementQuote, Loan, PaymentRecord } from "../../api";
import { loanService } from "../../services/loan.service";
import { useDebounce } from "../../hooks/useDebounce";
import {
  calculateEarlySettlementQuote,
  getLoanStatusColor,
  getLoanStatusLabel,
  getPaymentMethodLabel,
  toDateInput,
} from "../../utils/loanUtils";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts";
import { ClearanceCertificateModal } from "../ClearanceCertificateModal";

interface PaymentStudioProps {
  initialLoanId?: string | null;
  onOpenLoanDetails: (loanId: string) => void;
  onRefresh: () => void;
  refresh: number;
}

const PAYMENT_QUEUE_COLUMNS: ColumnConfig[] = [
  { id: "loanId", defaultWidth: 120, minWidth: 90 },
  { id: "borrower", defaultWidth: 180, minWidth: 130 },
  { id: "nic", defaultWidth: 140, minWidth: 100 },
  { id: "disbursed", defaultWidth: 140, minWidth: 100 },
  { id: "outstanding", defaultWidth: 150, minWidth: 110 },
  { id: "nextDue", defaultWidth: 140, minWidth: 100 },
  { id: "status", defaultWidth: 110, minWidth: 85 },
  { id: "action", defaultWidth: 100, minWidth: 75 },
];

const LIST_PAGE_SIZE = 10;
const GRID_PAGE_SIZE = 8;

const STATUS_FILTERS = [
  { value: "All", label: "All" },
  { value: "Active", label: "Active" },
  { value: "Overdue", label: "Overdue" },
  { value: "Settled", label: "Settled" },
  { value: "Early_Settled", label: "Early Settled" },
];

// ---------------------------------------------------------
// Skeleton Row (Queue List View)
// ---------------------------------------------------------
const QueueSkeletonRow: React.FC = () => (
  <tr className="animate-pulse">
    <td className="p-2.5">
      <div className="h-3 w-20 bg-slate-200 rounded" />
    </td>
    <td className="p-2.5 space-y-1.5">
      <div className="h-3 w-32 bg-slate-200 rounded" />
      <div className="h-2.5 w-24 bg-slate-200 rounded" />
    </td>
    <td className="p-2.5">
      <div className="h-3 w-20 bg-slate-200 rounded ml-auto" />
    </td>
    <td className="p-2.5">
      <div className="h-3 w-24 bg-slate-200 rounded ml-auto" />
    </td>
    <td className="p-2.5 space-y-1.5">
      <div className="h-3 w-20 bg-slate-200 rounded ml-auto" />
      <div className="h-2 w-15 bg-slate-200 rounded ml-auto" />
    </td>
    <td className="p-2.5">
      <div className="flex justify-center">
        <div className="h-4 w-20 bg-slate-200 rounded-full" />
      </div>
    </td>
    <td className="p-2.5">
      <div className="flex justify-center">
        <div className="h-6 w-14 bg-slate-200 rounded" />
      </div>
    </td>
  </tr>
);

// ---------------------------------------------------------
// Skeleton Card (Queue Grid View)
// ---------------------------------------------------------
const QueueSkeletonCard: React.FC = () => (
  <div className="p-3 rounded-lg border border-slate-200/80 bg-white animate-pulse space-y-2">
    <div className="flex items-center justify-between">
      <div className="h-2.5 w-20 bg-slate-200 rounded" />
      <div className="h-3 w-16 bg-slate-200 rounded-full" />
    </div>
    <div className="flex items-center justify-between">
      <div className="h-3 w-28 bg-slate-200 rounded" />
      <div className="h-3 w-14 bg-slate-200 rounded-full" />
    </div>
    <div className="h-2.5 w-24 bg-slate-200 rounded" />
    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
      <div className="h-3 w-20 bg-slate-200 rounded" />
      <div className="h-2.5 w-14 bg-slate-200 rounded" />
    </div>
  </div>
);

// ---------------------------------------------------------
// Skeleton placeholders for form fields
// ---------------------------------------------------------
const SkeletonText: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`h-3.5 bg-slate-100 rounded animate-pulse ${className}`} />
);

const PaymentFormSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="space-y-1.5">
        <div className="h-2.5 w-24 bg-slate-200 rounded" />
        <div className="h-9 w-full bg-slate-100 rounded-lg animate-pulse" />
      </div>
    ))}
  </div>
);

/**
 * Payment Processing & Repayments Studio
 */
export const PaymentStudio: React.FC<PaymentStudioProps> = ({
  initialLoanId,
  onOpenLoanDetails,
  onRefresh,
  refresh,
}) => {
  const { currentUser } = useAuth();

  const [queueLoans, setQueueLoans] = useState<Loan[]>([]);
  const [queueTotal, setQueueTotal] = useState(0);
  const [queueLoading, setQueueLoading] = useState(false);
  const [queueStatus, setQueueStatus] = useState<string>("Active");
  const [queueSearch, setQueueSearch] = useState("");
  const debouncedSearch = useDebounce(queueSearch, 300);
  const [queuePage, setQueuePage] = useState(1);
  const [queueViewMode, setQueueViewMode] = useState<"list" | "grid">("list");
  const [showQueue, setShowQueue] = useState(false);

  const [dropdownLoans, setDropdownLoans] = useState<Loan[]>([]);
  const [dropdownLoading, setDropdownLoading] = useState(false);

  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(
    initialLoanId ?? null,
  );
  const [currentLoan, setCurrentLoan] = useState<Loan | null>(null);
  const [loanLoading, setLoanLoading] = useState(false);

  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [dueDate, setDueDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentRecord["paymentMethod"]>("Cash");
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [isConfirmPaymentOpen, setIsConfirmPaymentOpen] =
    useState<boolean>(false);
  const [posting, setPosting] = useState(false);
  const [lastPaymentRecord, setLastPaymentRecord] =
    useState<PaymentRecord | null>(null);
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] =
    useState<PaymentRecord | null>(null);

  const [showClearanceCertificate, setShowClearanceCertificate] =
    useState(false);

  const receivedBy =
    currentUser?.fullName || currentUser?.username || "System User";
  const receivedById = currentUser?.id;

  const pageSize = queueViewMode === "grid" ? GRID_PAGE_SIZE : LIST_PAGE_SIZE;

  const {
    columnWidths,
    startResize,
    resetToDefault,
    handleDoubleClickReset,
    resizingColId,
    totalTableWidth,
  } = useResizableColumns(PAYMENT_QUEUE_COLUMNS, "payment_queue");

  // ---------------------------------------------------------
  // Fetch queue loans
  // ---------------------------------------------------------
  const fetchQueueLoans = useCallback(async () => {
    setQueueLoading(true);
    try {
      const params: any = {
        page: queuePage,
        limit: pageSize,
        sortBy: "createdAt",
        sortOrder: "desc",
      };

      if (debouncedSearch) params.search = debouncedSearch;
      if (queueStatus !== "All") params.status = queueStatus;

      const response = await loanService.listPaymentLoans(params);
      setQueueLoans(response.items);
      setQueueTotal(response.meta.totalItems);
    } catch (error) {
      console.error("Failed to fetch active loans:", error);
      setQueueLoans([]);
      setQueueTotal(0);
    } finally {
      setQueueLoading(false);
    }
  }, [queuePage, pageSize, debouncedSearch, queueStatus, refresh]);

  useEffect(() => {
    fetchQueueLoans();
  }, [fetchQueueLoans]);

  // ---------------------------------------------------------
  // Fetch dropdown loans
  // ---------------------------------------------------------
  const fetchDropdownLoans = useCallback(async () => {
    setDropdownLoading(true);
    try {
      const loans = await loanService.getLoansListByStatus([
        "Overdue",
        "Active",
      ]);
      setDropdownLoans(loans);
    } catch (error) {
      console.error("Failed to fetch dropdown loans:", error);
      setDropdownLoans([]);
    } finally {
      setDropdownLoading(false);
    }
  }, [refresh]);

  useEffect(() => {
    fetchDropdownLoans();
  }, [fetchDropdownLoans]);

  const handleStatusFilterChange = (status: string) => {
    setQueueStatus(status);
    setQueuePage(1);
  };

  // ---------------------------------------------------------
  // Auto-select first loan
  // ---------------------------------------------------------
  useEffect(() => {
    if (!selectedLoanId && dropdownLoans.length > 0) {
      setSelectedLoanId(dropdownLoans[0].id);
    }
  }, [dropdownLoans, selectedLoanId]);

  // ---------------------------------------------------------
  // Fetch current loan
  // ---------------------------------------------------------
  const fetchCurrentLoan = useCallback(async (loanId: string) => {
    setLoanLoading(true);
    try {
      const loan = await loanService.getLoanById(loanId);
      setCurrentLoan(loan);

      const nextInstallment = loan.installments.find(
        (i) => i.status !== "Paid",
      );

      const due = nextInstallment?.remainingAmount || loan.nextDueAmount || 0;

      setPaymentAmount(due.toString());
      setDueDate(nextInstallment?.dueDate || "");
      setReferenceNumber(`REF-${Math.floor(100000 + Math.random() * 900000)}`);
    } catch (error) {
      console.error("Failed to fetch loan:", error);
      setCurrentLoan(null);
    } finally {
      setLoanLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedLoanId) {
      fetchCurrentLoan(selectedLoanId);
    }
  }, [selectedLoanId, fetchCurrentLoan, refresh]);

  // ---------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------
  const handleSelectLoan = (loanId: string) => {
    setSelectedLoanId(loanId);
    setShowQueue(false);
  };

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLoan || Number(paymentAmount) <= 0) return;
    setIsConfirmPaymentOpen(true);
  };

  const handleExecutePayment = async () => {
    if (!currentLoan || Number(paymentAmount) <= 0) return;

    if (currentLoan.status !== "Active" && currentLoan.status !== "Overdue") {
      toast.error("Payments can only be recorded for Active or Overdue loans.");
      setIsConfirmPaymentOpen(false);
      return;
    }

    setPosting(true);
    try {
      const payment = await loanService.recordPayment(
        currentLoan.id,
        Number(paymentAmount),
        paymentMethod,
        referenceNumber,
        receivedById!,
        notes,
        paymentDate,
      );

      setIsConfirmPaymentOpen(false);

      if (payment) {
        setLastPaymentRecord(payment);

        onRefresh();

        // await fetchCurrentLoan(currentLoan.id);
        // await fetchQueueLoans();
        // await fetchDropdownLoans();
      }
    } catch (error: any) {
      console.error("Payment failed:", error);
      toast.error(error?.message || "Failed to record payment");
    } finally {
      setPosting(false);
    }
  };

  // ---------------------------------------------------------
  // Derived
  // ---------------------------------------------------------
  const [settlementDate, setSettlementDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const quote: EarlySettlementQuote | null = currentLoan
    ? calculateEarlySettlementQuote(currentLoan, settlementDate)
    : null;

  const currentUnpaidInstallment = currentLoan?.installments.find(
    (i) => i.status !== "Paid",
  );
  const projectedBalance = currentLoan
    ? Math.max(0, currentLoan.outstandingBalance - Number(paymentAmount))
    : 0;

  const recentPayments = currentLoan?.payments
    ? [...currentLoan.payments].slice(0, 5)
    : [];

  const canPay =
    currentLoan?.status === "Active" || currentLoan?.status === "Overdue";

  const isSettled =
    currentLoan?.status === "Settled" ||
    currentLoan?.status === "Early_Settled";

  const isEarlySettled = currentLoan?.status === "Early_Settled";

  // ---------------------------------------------------------
  // Render
  // ---------------------------------------------------------
  return (
    <div className="space-y-4 flex flex-col h-full min-h-0">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <CreditCard className="w-4 h-4" />
            </div>
            Payment Collection & Repayment Studio
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Collect scheduled installment payments, handle manual overpayments,
            and issue official receipts.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={() => setShowQueue(!showQueue)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition flex items-center gap-1.5 border border-slate-200/80 cursor-pointer"
          >
            <span>{showQueue ? "Hide Queue" : "Show Queue"}</span>
            {showQueue ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          <select
            value={
              selectedLoanId &&
              dropdownLoans.some((l) => l.id === selectedLoanId)
                ? selectedLoanId
                : " "
            }
            onChange={(e) => setSelectedLoanId(e.target.value)}
            disabled={dropdownLoading}
            className="hidden md:block bg-white text-slate-800 font-medium text-xs py-1.5 px-3 rounded-lg border border-slate-200/80 focus:outline-none focus:ring-1 focus:ring-slate-300 max-w-70 disabled:opacity-60"
          >
            <option value=" " disabled>
              {dropdownLoading
                ? "Loading loans..."
                : "Select an active loan..."}
            </option>
            {dropdownLoans.map((l) => (
              <option key={l.id} value={l.id}>
                {l.customer?.fullName} ({l.loanNumber || l.id}) -{" "}
                {getLoanStatusLabel(l.status)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* QUEUE */}
      {showQueue && (
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex flex-col gap-2">
              <div className="flex gap-2 flex-wrap items-center">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Active Loan Accounts ({queueTotal})
                </h3>
                <span className="text-[10px] text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded">
                  Click any row/card to open payment
                </span>
              </div>

              <div className="flex items-center gap-1 flex-wrap">
                {STATUS_FILTERS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => handleStatusFilterChange(s.value)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition cursor-pointer ${
                      queueStatus === s.value
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200/80">
                <button
                  onClick={() => {
                    setQueueViewMode("list");
                    setQueuePage(1);
                  }}
                  className={`p-1 rounded text-xs font-medium flex items-center gap-1 transition cursor-pointer ${
                    queueViewMode === "list"
                      ? "bg-white text-blue-700 shadow-2xs"
                      : "text-slate-600"
                  }`}
                  title="List View"
                >
                  <LayoutList className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    setQueueViewMode("grid");
                    setQueuePage(1);
                  }}
                  className={`p-1 rounded text-xs font-medium flex items-center gap-1 transition cursor-pointer ${
                    queueViewMode === "grid"
                      ? "bg-white text-blue-700 shadow-2xs"
                      : "text-slate-600"
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="relative w-full sm:w-48">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search borrower..."
                  value={queueSearch}
                  onChange={(e) => {
                    setQueueSearch(e.target.value);
                    setQueuePage(1);
                  }}
                  className="w-full bg-slate-50 text-slate-800 text-xs pl-8 pr-3 py-1 rounded-lg border border-slate-200/80 focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Queue body */}
          {queueLoading ? (
            queueViewMode === "list" ? (
              <div className="overflow-x-auto border border-slate-100 rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/60">
                    <tr>
                      <th className="p-2.5">Loan ID</th>
                      <th className="p-2.5">Borrower</th>
                      <th className="p-2.5 text-right">Disbursed</th>
                      <th className="p-2.5 text-right">Balance</th>
                      <th className="p-2.5 text-right">Next Due</th>
                      <th className="p-2.5 text-center">Status</th>
                      <th className="p-2.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Array.from({ length: LIST_PAGE_SIZE }).map((_, i) => (
                      <QueueSkeletonRow key={`sk-${i}`} />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Array.from({ length: GRID_PAGE_SIZE }).map((_, i) => (
                  <QueueSkeletonCard key={`sk-${i}`} />
                ))}
              </div>
            )
          ) : queueViewMode === "list" ? (
            <div className="overflow-x-auto border border-slate-100 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/60">
                  <tr>
                    <th className="p-2.5">Loan ID</th>
                    <th className="p-2.5">Borrower</th>
                    <th className="p-2.5 text-right">Disbursed</th>
                    <th className="p-2.5 text-right">Balance</th>
                    <th className="p-2.5 text-right">Next Due</th>
                    <th className="p-2.5 text-center">Status</th>
                    <th className="p-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {queueLoans.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-4 text-center text-xs text-slate-400"
                      >
                        No loans found for this status.
                      </td>
                    </tr>
                  ) : (
                    queueLoans.map((l) => {
                      const isSelected = l.id === selectedLoanId;
                      const nextInstallment = l.installments.find(
                        (i) => i.status !== "Paid",
                      );

                      return (
                        <tr
                          key={l.id}
                          onClick={() => handleSelectLoan(l.id)}
                          className={`cursor-pointer transition ${
                            isSelected
                              ? "bg-blue-50/70 font-semibold"
                              : "hover:bg-slate-50/80"
                          }`}
                        >
                          <td className="p-2.5 font-mono text-[11px] text-slate-900">
                            {l.loanNumber || l.id}
                          </td>
                          <td className="p-2.5">
                            <span className="font-bold text-slate-900 block">
                              {l.customer?.fullName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {l.customer?.idNumber}
                            </span>
                          </td>
                          <td className="p-2.5 text-right font-semibold text-slate-700">
                            {formatCurrency(l.account?.disbursedAmount || 0)}
                          </td>
                          <td className="p-2.5 text-right font-extrabold text-blue-900">
                            {formatCurrency(l.outstandingBalance)}
                          </td>
                          <td className="p-2.5 text-right font-bold text-emerald-800 flex flex-col">
                            <span>
                              {formatCurrency(
                                nextInstallment?.remainingAmount ||
                                  l.nextDueAmount ||
                                  0,
                              )}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {toDateInput(nextInstallment?.dueDate)}
                            </span>
                          </td>
                          <td className="p-2.5 text-center">
                            <span
                              className={`${getLoanStatusColor(l.status)} text-[10px] px-2.5 py-0.5 rounded-full font-medium`}
                            >
                              {getLoanStatusLabel(l.status)}
                            </span>
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectLoan(l.id);
                              }}
                              className={`px-2 py-1 rounded text-[11px] font-medium transition cursor-pointer ${
                                isSelected
                                  ? "bg-blue-600 text-white"
                                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                              }`}
                            >
                              {isSelected ? "Opened" : "Open"}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {queueLoans.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-4 sm:col-span-2 md:col-span-3 lg:col-span-4">
                  No loans found for this status.
                </div>
              ) : (
                queueLoans.map((l) => {
                  const isSelected = l.id === selectedLoanId;

                  return (
                    <div
                      key={l.id}
                      onClick={() => handleSelectLoan(l.id)}
                      className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                        isSelected
                          ? "border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20"
                          : "border-slate-200/80 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono font-bold text-slate-900">
                          {l.loanNumber || l.id}
                        </span>
                        <span
                          className={`${getLoanStatusColor(l.status)} text-[8px] px-1.5 py-0.2 rounded-full font-medium`}
                        >
                          {getLoanStatusLabel(l.status)}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-slate-900 truncate mb-1">
                        {l.customer?.fullName}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-mono">
                        ID: {l.customer?.idNumber}
                      </p>
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                        <span className="text-slate-500">Balance:</span>
                        <span className="font-bold text-blue-900">
                          {formatCurrency(l.outstandingBalance)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {queueLoans.length > 0 && (
            <Pagination
              currentPage={queuePage}
              totalItems={queueTotal}
              pageSize={pageSize}
              onPageChange={setQueuePage}
              itemName="active accounts"
            />
          )}
        </div>
      )}

      <select
        value={
          selectedLoanId && dropdownLoans.some((l) => l.id === selectedLoanId)
            ? selectedLoanId
            : " "
        }
        onChange={(e) => setSelectedLoanId(e.target.value)}
        disabled={dropdownLoading}
        className="md:hidden bg-white text-slate-800 font-medium text-xs py-1.5 px-3 rounded-lg border border-slate-200/80 focus:outline-none focus:ring-1 focus:ring-slate-300 disabled:opacity-60"
      >
        <option value=" " disabled>
          {dropdownLoading ? "Loading loans..." : "Select an active loan..."}
        </option>
        {dropdownLoans.map((l) => (
          <option key={l.id} value={l.id}>
            {l.customer?.fullName} ({l.loanNumber || l.id}) -{" "}
            {getLoanStatusLabel(l.status)}
          </option>
        ))}
      </select>

      {/* LOAN DETAIL + PAYMENT FORM */}
      {!currentLoan && !loanLoading ? (
        <div className="flex-1 flex items-center justify-center bg-white border border-slate-200/80 p-8 rounded-xl text-center text-slate-500 shadow-2xs">
          <div>
            <CreditCard className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="font-bold text-slate-800 text-sm">
              No Active Loan Selected
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Select a loan from the queue above to record a payment.
            </p>
          </div>
        </div>
      ) : loanLoading ? (
        /* Loading state — both columns skeleton */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="w-full">
                <SkeletonText className="w-32 mb-2" />
                <div className="flex items-center justify-between">
                  <SkeletonText className="w-48" />
                  <div className="h-5 w-20 bg-slate-100 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
            <PaymentFormSkeleton />
          </div>
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs space-y-4">
            <SkeletonText className="w-40" />
            <SkeletonText className="w-32" />
            <SkeletonText className="w-40" />
          </div>
        </div>
      ) : isSettled ? (
        /* SETTLED STATE — full-width proper message, no left column */
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
          {/* Header strip */}
          <div className="bg-linear-to-r from-emerald-50 to-emerald-50/40 border-b border-emerald-100 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-900">
                  {isEarlySettled
                    ? "Loan Early Settled & Closed"
                    : "Loan Fully Settled & Closed"}
                </h3>
                <p className="text-[11px] text-emerald-700/80 mt-0.5">
                  {isEarlySettled
                    ? "This contract was paid off before its scheduled term."
                    : "This contract has reached the end of its repayment schedule."}
                </p>
              </div>
            </div>
          </div>

          {/* Loan + Customer Info */}
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50/60 p-3 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-500 block">
                  Borrower
                </span>
                <span className="font-bold text-slate-900 text-sm">
                  {currentLoan?.customer?.fullName}
                </span>
                <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                  {currentLoan?.customer?.idNumber}
                </span>
              </div>
              <div className="bg-slate-50/60 p-3 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-500 block">
                  Loan Contract
                </span>
                <span className="font-bold text-slate-900 text-sm font-mono">
                  {currentLoan?.loanNumber || currentLoan?.id}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {currentLoan?.customer?.customerNumber}
                </span>
              </div>
              <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-200/60">
                <span className="text-[10px] text-emerald-700 block">
                  Settled Date
                </span>
                <span className="font-bold text-emerald-800 text-sm font-mono">
                  {currentLoan?.settledDate
                    ? toDateInput(currentLoan.settledDate)
                    : "—"}
                </span>
                <span className="text-[10px] text-emerald-600 font-mono block mt-0.5">
                  Status: {getLoanStatusLabel(currentLoan?.status || "")}
                </span>
              </div>
            </div>

            {/* Financial summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50/60 p-3 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-500 block">
                  Original Disbursed
                </span>
                <span className="font-bold text-slate-800 text-sm font-mono">
                  {formatCurrency(
                    currentLoan?.account?.disbursedAmount ||
                      currentLoan?.requestedAmount ||
                      0,
                  )}
                </span>
              </div>
              <div className="bg-slate-50/60 p-3 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-500 block">
                  Total Paid
                </span>
                <span className="font-bold text-emerald-700 text-sm font-mono">
                  {formatCurrency(currentLoan?.totalPaidAmount || 0)}
                </span>
              </div>
              <div className="bg-slate-50/60 p-3 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-500 block">
                  Outstanding Balance
                </span>
                <span className="font-bold text-emerald-700 text-sm font-mono">
                  LKR 0.00
                </span>
              </div>
            </div>

            {/* Recent Payments (clickable receipts still work) */}
            {recentPayments.length > 0 && (
              <div className="bg-slate-50/60 rounded-lg border border-slate-100 p-4 space-y-2">
                <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-3 h-3 text-slate-400" />
                  Payment History
                  <span className="text-slate-400 font-normal">
                    (last {Math.min(5, currentLoan?.payments?.length || 0)} of{" "}
                    {currentLoan?.payments?.length || 0})
                  </span>
                </h4>
                <div className="space-y-2">
                  {recentPayments.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPaymentForReceipt(p)}
                      className="w-full text-left bg-white hover:bg-blue-50/60 hover:border-blue-200 p-2.5 rounded-lg border border-slate-200/60 text-[11px] space-y-0.5 transition cursor-pointer"
                      title="View / print receipt"
                    >
                      <div className="flex justify-between font-semibold">
                        <span className="text-slate-900">
                          {formatCurrency(p.amount)}
                        </span>
                        <span className="text-slate-400 font-normal">
                          {p.paymentDate}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>
                          {getPaymentMethodLabel(p.paymentMethod)} •{" "}
                          {p.referenceNumber}
                        </span>
                        <span>By: {p.receivedBy}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <p className="text-[11px] text-slate-500 text-center sm:text-left">
                All obligations on this contract have been fully cleared. A
                clearance certificate is available for printing.
              </p>
              <button
                onClick={() => setShowClearanceCertificate(true)}
                className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-medium px-4 py-2 rounded-lg text-xs transition shadow-2xs shrink-0 cursor-pointer"
              >
                <Award className="w-3.5 h-3.5" />
                <span>View Clearance Certificate</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* NORMAL STATE — payment form + right column */
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Payment Form */}
            <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="w-full">
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                    Payment Processing
                  </span>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-slate-900">
                      {currentLoan?.loanNumber || currentLoan?.id}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span
                        className={`${getLoanStatusColor(currentLoan?.status || "")} text-[10px] px-2.5 py-0.5 rounded-full font-medium`}
                      >
                        {getLoanStatusLabel(currentLoan?.status || "")}
                      </span>
                      {currentLoan?.id && (
                        <button
                          onClick={() => onOpenLoanDetails(currentLoan.id)}
                          className="p-1.5 text-slate-600 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 rounded-lg transition shrink-0 cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                    Customer
                  </span>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">
                      {currentLoan?.customer?.fullName} (
                      {currentLoan?.customer?.customerNumber})
                    </h3>
                  </div>
                </div>
              </div>

              {/* Warning if loan is not payable (not settled, but not Active/Overdue) */}
              {!canPay && (
                <div className="bg-amber-50 text-amber-800 border border-amber-200/60 p-2.5 rounded-lg text-xs font-medium text-center">
                  Payments can only be recorded for Active or Overdue loans.
                </div>
              )}

              <form onSubmit={handleOpenConfirm} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Payment Amount */}
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 block mb-1">
                      Payment Amount (LKR)
                    </label>
                    <div className="relative">
                      <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={(currentLoan?.outstandingBalance || 0) + 50000}
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value || "")}
                        disabled={!canPay}
                        className="w-full bg-white text-slate-900 font-bold text-sm pl-8 pr-3 py-2 rounded-lg border border-slate-200/80 focus:ring-1 focus:ring-slate-300 disabled:bg-slate-50 disabled:text-slate-500"
                        required
                      />
                    </div>
                    {currentUnpaidInstallment && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                        <span>Current Installment:</span>
                        <button
                          type="button"
                          onClick={() =>
                            setPaymentAmount(
                              currentUnpaidInstallment.remainingAmount.toString(),
                            )
                          }
                          disabled={!canPay}
                          className="text-slate-900 font-medium underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Set{" "}
                          {formatCurrency(
                            currentUnpaidInstallment.remainingAmount,
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Due Date */}
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 block mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-white text-slate-800 text-xs px-3 py-2 rounded-lg border border-slate-200/80 focus:ring-1 focus:ring-slate-300 disabled:bg-slate-50 disabled:text-slate-500"
                      disabled
                      required
                    />
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 block mb-1">
                      Payment Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) =>
                        setPaymentMethod(
                          e.target.value as PaymentRecord["paymentMethod"],
                        )
                      }
                      disabled={!canPay}
                      className="w-full bg-white text-slate-800 text-xs px-3 py-2 rounded-lg border border-slate-200/80 focus:ring-1 focus:ring-slate-300 disabled:bg-slate-50 disabled:text-slate-500"
                    >
                      <option value="Cash">Cash (Branch Counter)</option>
                      <option value="Bank_Transfer">
                        Bank Transfer / Online EFT
                      </option>
                      <option value="Debit_Credit_Card">
                        Debit / Credit Card
                      </option>
                      <option value="Direct_Debit">
                        Direct Debit Auto Pay
                      </option>
                      <option value="Cheque">Cheque Deposit</option>
                    </select>
                  </div>

                  {/* Reference Number */}
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 block mb-1">
                      Reference #
                    </label>
                    <input
                      type="text"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      placeholder="e.g. TRF-889012"
                      disabled={!canPay}
                      className="w-full bg-white text-slate-800 text-xs px-3 py-2 rounded-lg border border-slate-200/80 focus:ring-1 focus:ring-slate-300 font-mono disabled:bg-slate-50 disabled:text-slate-500"
                      required
                    />
                  </div>

                  {/* Received By */}
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 block mb-1">
                      Received By
                    </label>
                    <input
                      type="text"
                      value={receivedBy}
                      disabled
                      readOnly
                      className="w-full bg-slate-50 text-slate-600 text-xs px-3 py-2 rounded-lg border border-slate-200/80 font-medium cursor-not-allowed"
                    />
                  </div>

                  {/* Payment Date */}
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 block mb-1">
                      Payment Date
                    </label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      disabled={!canPay}
                      className="w-full bg-white text-slate-800 text-xs px-3 py-2 rounded-lg border border-slate-200/80 focus:ring-1 focus:ring-slate-300 disabled:bg-slate-50 disabled:text-slate-500"
                      required
                    />
                  </div>

                  {/* Notes */}
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-medium text-slate-600 block mb-1">
                      Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Regular installment"
                      disabled={!canPay}
                      className="w-full bg-white text-slate-800 text-xs px-3 py-2 rounded-lg border border-slate-200/80 focus:ring-1 focus:ring-slate-300 disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>
                </div>

                {/* Balance Impact Preview */}
                <div className="bg-slate-50/60 p-3.5 rounded-lg border border-slate-100 space-y-1.5">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Balance Impact Preview
                  </span>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Current Outstanding:</span>
                    <span className="font-medium text-slate-800">
                      {formatCurrency(currentLoan?.outstandingBalance || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Applying Payment:</span>
                    <span className="font-semibold text-emerald-600">
                      - {formatCurrency(Number(paymentAmount))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200/60">
                    <span className="text-slate-900 font-semibold">
                      New Balance:
                    </span>
                    <span className="font-bold text-slate-900 text-xs">
                      {formatCurrency(projectedBalance)}
                    </span>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={!currentLoan || posting || !canPay}
                    className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-4 py-2 rounded-lg transition shadow-2xs text-xs cursor-pointer"
                  >
                    {posting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Receipt className="w-4 h-4" />
                    )}
                    <span>
                      {posting
                        ? "Processing..."
                        : !canPay
                          ? "Loan Not Payable"
                          : "Process Payment & Issue Receipt"}
                    </span>
                  </button>
                </div>
              </form>
            </div>

            {/* Right Column: Balance + Recent Payments */}
            <div className="space-y-6">
              {/* Account Balance Card */}
              <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-semibold text-slate-900 text-xs">
                    Account Balance
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {currentLoan?.account?.accountNumber ||
                      currentLoan?.loanNumber}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Disbursed:</span>
                    <span className="font-medium text-slate-800">
                      {formatCurrency(
                        currentLoan?.account?.disbursedAmount || 0,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Collected:</span>
                    <span className="font-medium text-emerald-600">
                      {formatCurrency(currentLoan?.totalPaidAmount || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-100 text-xs font-semibold">
                    <span className="text-slate-900">Remaining Balance:</span>
                    <span className="text-slate-900 font-bold">
                      {formatCurrency(currentLoan?.outstandingBalance || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Payments */}
              <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs space-y-3">
                <h3 className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-slate-500" />
                  Recent Payments
                  {currentLoan?.payments && currentLoan.payments.length > 0 && (
                    <span className="text-slate-400 font-normal">
                      (last {Math.min(5, currentLoan.payments.length)} of{" "}
                      {currentLoan.payments.length})
                    </span>
                  )}
                </h3>

                <div className="space-y-2">
                  {recentPayments.length > 0 ? (
                    recentPayments.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPaymentForReceipt(p)}
                        className="w-full text-left bg-slate-50/60 hover:bg-blue-50/60 hover:border-blue-200 p-2.5 rounded-lg border border-slate-100 text-[11px] space-y-0.5 transition cursor-pointer"
                        title="View / print receipt"
                      >
                        <div className="flex justify-between font-semibold">
                          <span className="text-slate-900">
                            {formatCurrency(p.amount)}
                          </span>
                          <span className="text-slate-400 font-normal">
                            {p.paymentDate}
                          </span>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>
                            {getPaymentMethodLabel(p.paymentMethod)} •{" "}
                            {p.referenceNumber}
                          </span>
                          <span>By: {p.receivedBy}</span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-4">
                      No payments recorded yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Payment Confirmation Modal */}
      {currentLoan && (
        <ConfirmModal
          isOpen={isConfirmPaymentOpen}
          onClose={() => setIsConfirmPaymentOpen(false)}
          onConfirm={handleExecutePayment}
          title="Confirm Payment Collection"
          description="Are you sure you want to post this payment to the borrower ledger? This will instantly adjust the outstanding balance and allocate funds to installments."
          confirmLabel="Confirm & Post Payment"
          cancelLabel="Review Again"
          variant="info"
          isLoading={posting}
          details={[
            { label: "Borrower", value: currentLoan.customer?.fullName },
            {
              label: "Payment Amount",
              value: formatCurrency(Number(paymentAmount)),
            },
            {
              label: "Payment Method",
              value: getPaymentMethodLabel(paymentMethod),
            },
            { label: "Reference Number", value: referenceNumber },
            { label: "Received By", value: receivedBy },
            {
              label: "New Outstanding Balance",
              value: formatCurrency(projectedBalance),
            },
          ]}
        />
      )}

      {/* Receipt Modal */}
      {currentLoan && (lastPaymentRecord || selectedPaymentForReceipt) && (
        <PaymentReceiptModal
          loan={currentLoan}
          payment={(lastPaymentRecord ?? selectedPaymentForReceipt)!}
          onClose={() => {
            setLastPaymentRecord(null);
            setSelectedPaymentForReceipt(null);
          }}
        />
      )}

      {/* Clearance Certificate Modal */}
      {showClearanceCertificate && currentLoan && (
        <ClearanceCertificateModal
          loan={currentLoan}
          // quote={quote}
          onClose={() => setShowClearanceCertificate(false)}
        />
      )}
    </div>
  );
};
