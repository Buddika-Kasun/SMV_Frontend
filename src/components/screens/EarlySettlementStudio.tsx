import React, { useState, useEffect, useCallback } from "react";
import { formatCurrency } from "../../utils/consultancyUtils";
import {
  useResizableColumns,
  ColumnConfig,
} from "../../hooks/useResizableColumns";
import { ResizableTh, ResizableTableContainer } from "../common/ResizableTable";
import { Pagination } from "../common/Pagination";
import { ConfirmModal } from "../common/ConfirmModal";
import {
  Zap,
  CheckCircle,
  Award,
  ShieldCheck,
  Sparkles,
  Printer,
  X,
  LayoutGrid,
  LayoutList,
  ChevronDown,
  ChevronUp,
  Search,
  Loader2,
  Eye,
} from "lucide-react";
import { EarlySettlementQuote, Loan, PaymentRecord } from "../../api";
import { loanService } from "../../services/loan.service";
import { useDebounce } from "../../hooks/useDebounce";
import {
  calculateEarlySettlementQuote,
  getInterestMethodLabel,
  getLoanStatusColor,
  getLoanStatusLabel,
  getPaymentMethodLabel,
  toDateInput,
} from "../../utils/loanUtils";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts";
import { ClearanceCertificateModal } from "../ClearanceCertificateModal";

interface EarlySettlementStudioProps {
  initialLoanId?: string | null;
  onOpenLoanDetails: (loanId: string) => void;
  onRefresh: () => void;
  refresh: number;
}

const EARLY_SETTLEMENT_COLUMNS: ColumnConfig[] = [
  { id: "loanId", defaultWidth: 120, minWidth: 90 },
  { id: "borrower", defaultWidth: 180, minWidth: 130 },
  { id: "nic", defaultWidth: 140, minWidth: 100 },
  { id: "disbursed", defaultWidth: 140, minWidth: 100 },
  { id: "outstanding", defaultWidth: 150, minWidth: 110 },
  { id: "interestMethod", defaultWidth: 140, minWidth: 100 },
  { id: "status", defaultWidth: 110, minWidth: 85 },
  { id: "action", defaultWidth: 100, minWidth: 75 },
];

const LIST_PAGE_SIZE = 10;
const GRID_PAGE_SIZE = 8;

const STATUS_FILTERS = [
  { value: "All", label: "All" },
  { value: "Active", label: "Active" },
  { value: "Overdue", label: "Overdue" },
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
    <td className="p-2.5">
      <div className="flex justify-center">
        <div className="h-3 w-20 bg-slate-200 rounded" />
      </div>
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
    <div className="h-3 w-28 bg-slate-200 rounded" />
    <div className="h-2.5 w-24 bg-slate-200 rounded" />
    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
      <div className="h-2.5 w-14 bg-slate-200 rounded" />
      <div className="h-3 w-20 bg-slate-200 rounded" />
    </div>
  </div>
);

// ---------------------------------------------------------
// Skeleton placeholders
// ---------------------------------------------------------
const SkeletonText: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`h-3.5 bg-slate-100 rounded animate-pulse ${className}`} />
);

const QuoteBreakdownSkeleton: React.FC = () => (
  <div className="space-y-2.5 animate-pulse">
    {Array.from({ length: 4 }).map((_, i) => (
      <div
        key={i}
        className="bg-slate-50/60 p-3 rounded-lg border border-slate-100 flex items-center justify-between"
      >
        <div className="space-y-1.5">
          <div className="h-3 w-40 bg-slate-200 rounded" />
          <div className="h-2.5 w-32 bg-slate-200 rounded" />
        </div>
        <div className="h-3.5 w-24 bg-slate-200 rounded" />
      </div>
    ))}
    <div className="bg-emerald-50/40 p-3.5 rounded-lg border border-emerald-100 flex items-center justify-between">
      <div className="space-y-1.5">
        <div className="h-3 w-44 bg-emerald-200/70 rounded" />
        <div className="h-2.5 w-40 bg-emerald-200/50 rounded" />
      </div>
      <div className="h-4 w-24 bg-emerald-200/70 rounded" />
    </div>
    <div className="bg-slate-900 p-4 rounded-xl">
      <div className="h-3 w-32 bg-slate-700 rounded mb-2" />
      <div className="h-6 w-40 bg-slate-700 rounded" />
    </div>
  </div>
);

const AuthFormSkeleton: React.FC = () => (
  <div className="space-y-3 animate-pulse">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="space-y-1.5">
        <div className="h-2.5 w-24 bg-slate-200 rounded" />
        <div className="h-9 w-full bg-slate-100 rounded-lg" />
      </div>
    ))}
    <div className="h-10 w-full bg-slate-200 rounded-lg mt-2" />
  </div>
);

/**
 * Early Settlement & Payoff Calculator Studio
 * Self-fetching, matches PaymentStudio layout & behavior.
 */
export const EarlySettlementStudio: React.FC<EarlySettlementStudioProps> = ({
  initialLoanId,
  onOpenLoanDetails,
  onRefresh,
  refresh,
}) => {
  const { currentUser } = useAuth();

  // Queue data
  const [queueLoans, setQueueLoans] = useState<Loan[]>([]);
  const [queueTotal, setQueueTotal] = useState(0);
  const [queueLoading, setQueueLoading] = useState(false);
  const [queueStatus, setQueueStatus] = useState<string>("Active");
  const [queueSearch, setQueueSearch] = useState("");
  const debouncedSearch = useDebounce(queueSearch, 300);
  const [queuePage, setQueuePage] = useState(1);
  const [queueViewMode, setQueueViewMode] = useState<"list" | "grid">("list");
  const [showQueue, setShowQueue] = useState(false);

  // Dropdown loans
  const [dropdownLoans, setDropdownLoans] = useState<Loan[]>([]);
  const [dropdownLoading, setDropdownLoading] = useState(false);

  // Selected loan
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(
    initialLoanId ?? null,
  );
  const [currentLoan, setCurrentLoan] = useState<Loan | null>(null);
  const [loanLoading, setLoanLoading] = useState(false);

  // Settlement form
  const [settlementDate, setSettlementDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentRecord["paymentMethod"]>("Bank_Transfer");
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [notes, setNotes] = useState<string>(
    "Full early settlement requested by customer.",
  );

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [posting, setPosting] = useState(false);
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
  } = useResizableColumns(EARLY_SETTLEMENT_COLUMNS, "early_settlement_queue");

  // ---------------------------------------------------------
  // Fetch queue loans (Active + Overdue eligible for settlement)
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
      console.error("Failed to fetch eligible loans:", error);
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
        "Active",
        "Overdue",
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

  // Auto-select first loan
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
      setReferenceNumber(`STL-${Math.floor(100000 + Math.random() * 900000)}`);
    } catch (error) {
      console.error("Failed to fetch loan:", error);
      setCurrentLoan(null);
    } finally {
      setLoanLoading(false);
    }
  }, [refresh]);

  useEffect(() => {
    if (selectedLoanId) {
      fetchCurrentLoan(selectedLoanId);
    }
  }, [selectedLoanId, fetchCurrentLoan]);

  // ---------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------
  const handleSelectLoan = (loanId: string) => {
    setSelectedLoanId(loanId);
    setShowQueue(false);
  };

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLoan || isAlreadySettled) return;
    setIsConfirmModalOpen(true);
  };

  const handleConfirmSettlement = async () => {
    if (!currentLoan || isAlreadySettled || !quote) return;

    setPosting(true);
    try {
      await loanService.executeEarlySettlement(
        currentLoan.id,
        quote,
        paymentMethod,
        referenceNumber,
        receivedById!,
        notes,
        settlementDate,
      );

      setIsConfirmModalOpen(false);
      setShowClearanceCertificate(true);

      onRefresh();

      // await fetchCurrentLoan(currentLoan.id);
      // await fetchQueueLoans();
      // await fetchDropdownLoans();
    } catch (error: any) {
      console.error("Settlement failed:", error);
      toast.error(error?.message || "Failed to execute early settlement");
    } finally {
      setPosting(false);
    }
  };

  // ---------------------------------------------------------
  // Derived
  // ---------------------------------------------------------
  const quote: EarlySettlementQuote | null = currentLoan
    ? calculateEarlySettlementQuote(currentLoan, settlementDate)
    : null;

  const isAlreadySettled =
    currentLoan?.status === "Early_Settled" ||
    currentLoan?.status === "Settled";

  const isEarlySettled = currentLoan?.status === "Early_Settled";

  const totalInstallments = currentLoan?.installments?.length || 0;
  const paidInstallments =
    currentLoan?.installments?.filter((i) => i.status === "Paid").length || 0;
  const remainingInstallments = totalInstallments - paidInstallments;

  const totalPaidAmount =
    currentLoan?.installments
      ?.filter((i) => i.status === "Paid")
      .reduce((sum, i) => sum + (i.paidAmount || 0), 0) || 0;

  const totalRemainingAmount =
    currentLoan?.installments
      ?.filter((i) => i.status !== "Paid")
      .reduce((sum, i) => sum + (i.remainingAmount || 0), 0) || 0;

  const progressPercent =
    totalInstallments > 0
      ? Math.round((paidInstallments / totalInstallments) * 100)
      : 0;

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
              <Zap className="w-4 h-4" />
            </div>
            Early Settlement & Payoff Calculator
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Accrued interest calculations, unearned interest rebates, payoff
            penalties, and loan clearance certification.
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
            className="bg-white text-slate-800 font-medium text-xs py-1.5 px-3 rounded-lg border border-slate-200/80 focus:outline-none focus:ring-1 focus:ring-slate-300 max-w-70 disabled:opacity-60"
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
                  Eligible Loan Contracts ({queueTotal})
                </h3>
                <span className="text-[10px] text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded">
                  Click any row/card to generate early payoff quote
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
                      <th className="p-2.5 text-center">Interest Method</th>
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
          ) : // : queueLoans.length === 0 ? (
          //   <p className="text-xs text-slate-400 text-center py-6">
          //     No loans found for this status.
          //   </p>
          // )
          queueViewMode === "list" ? (
            <div className="overflow-x-auto border border-slate-100 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/60">
                  <tr>
                    <th className="p-2.5">Loan ID</th>
                    <th className="p-2.5">Borrower</th>
                    <th className="p-2.5 text-right">Disbursed</th>
                    <th className="p-2.5 text-right">Balance</th>
                    <th className="p-2.5 text-center">Interest Method</th>
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
                          <td className="p-2.5 text-center font-mono text-[11px] text-slate-600">
                            {getInterestMethodLabel(l.interestMethod)}
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
                        <span className="text-slate-500">Unpaid:</span>
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
              itemName="eligible loan contracts"
            />
          )}
        </div>
      )}

      {/* LOAN DETAIL + SETTLEMENT FORM */}
      {!currentLoan && !loanLoading ? (
        <div className="flex-1 flex items-center justify-center bg-white border border-slate-200/80 p-8 rounded-xl text-center text-slate-500 shadow-2xs">
          <div>
            <Zap className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="font-bold text-slate-800 text-sm">
              No Active Loan Selected
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Select a loan from the queue above to generate a settlement quote.
            </p>
          </div>
        </div>
      ) : loanLoading ? (
        /* Loading state — show both columns skeleton */
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
            <div className="bg-slate-50/60 p-4 rounded-lg border border-slate-100 space-y-3 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="space-y-1.5">
                  <div className="h-2.5 w-32 bg-slate-200 rounded" />
                  <div className="h-3 w-24 bg-slate-200 rounded" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-2.5 w-14 bg-slate-200 rounded ml-auto" />
                  <div className="h-4 w-10 bg-slate-200 rounded ml-auto" />
                </div>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full" />
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white p-2 rounded border border-slate-200/60 space-y-1.5"
                  >
                    <div className="h-2 w-10 bg-slate-200 rounded" />
                    <div className="h-3 w-8 bg-slate-200 rounded" />
                  </div>
                ))}
              </div>
            </div>
            <QuoteBreakdownSkeleton />
          </div>
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs space-y-4">
            <SkeletonText className="w-40" />
            <AuthFormSkeleton />
          </div>
        </div>
      ) : isAlreadySettled ? (
        /* SETTLED STATE — full-width proper message, no left column */
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
          {/* Header strip */}
          <div className="bg-linear-to-r from-emerald-50 to-emerald-50/40 border-b border-emerald-100 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                <Award className="w-5 h-5" />
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
                  {getInterestMethodLabel(currentLoan?.interestMethod || "")}
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
        /* NORMAL STATE — calculation + form */
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Calculation Breakdown */}
            <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between pb-0 border-b border-slate-100">
                <div className="w-full">
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                    Settlement Quote
                  </span>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-slate-900">
                      {currentLoan?.customer?.fullName} (
                      {currentLoan?.loanNumber || currentLoan?.id})
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
                </div>
              </div>

              {/* Installment Progress Card */}
              {currentLoan && (
                <div className="bg-slate-50/60 p-4 rounded-lg border border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Installment Progress
                      </span>
                      <span className="text-xs text-slate-600 mt-0.5 block">
                        {paidInstallments} of {totalInstallments} paid
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">
                        Progress
                      </span>
                      <span className="text-sm font-bold text-emerald-700">
                        {progressPercent}%
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    <div className="bg-white p-2 rounded border border-slate-200/60">
                      <span className="text-slate-400 block">Total</span>
                      <span className="font-bold text-slate-800">
                        {totalInstallments}
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded border border-emerald-200/60">
                      <span className="text-emerald-600 block">Paid</span>
                      <span className="font-bold text-emerald-700">
                        {paidInstallments}
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded border border-amber-200/60">
                      <span className="text-amber-600 block">Unpaid</span>
                      <span className="font-bold text-amber-700">
                        {remainingInstallments}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="bg-white p-2.5 rounded border border-emerald-200/60">
                      <span className="text-slate-500 block mb-0.5">
                        Paid Amount
                      </span>
                      <span className="font-bold text-emerald-700 text-xs font-mono">
                        {formatCurrency(totalPaidAmount)}
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded border border-amber-200/60">
                      <span className="text-slate-500 block mb-0.5">
                        Remaining Amount
                      </span>
                      <span className="font-bold text-amber-700 text-xs font-mono">
                        {formatCurrency(totalRemainingAmount)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-200/60">
                    <span className="text-slate-500">Total Loan Value:</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {formatCurrency(totalPaidAmount + totalRemainingAmount)}
                    </span>
                  </div>
                </div>
              )}

              {/* Quote Breakdown */}
              {!quote ? (
                <QuoteBreakdownSkeleton />
              ) : (
                <div className="space-y-2.5">
                  {/* Original Disbursed */}
                  <div className="bg-slate-50/60 p-3 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium text-slate-800 block">
                        Original Disbursed Amount
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Initial loan principal
                      </span>
                    </div>
                    <span className="font-semibold text-slate-900 text-xs">
                      {formatCurrency(quote.originalPrincipal)}
                    </span>
                  </div>

                  {/* Outstanding Principal */}
                  <div className="bg-slate-50/60 p-3 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium text-slate-800 block">
                        Unpaid Principal Balance
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Remaining principal balance
                      </span>
                    </div>
                    <span className="font-bold text-slate-900 text-xs">
                      {formatCurrency(quote.outstandingPrincipalBalance)}
                    </span>
                  </div>

                  {/* Accrued Interest */}
                  <div className="bg-slate-50/60 p-3 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium text-slate-800 block">
                        Accrued Interest
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Interest earned to date
                      </span>
                    </div>
                    <span className="font-medium text-slate-800 text-xs">
                      + {formatCurrency(quote.accruedInterestToDate)}
                    </span>
                  </div>

                  {/* Penalty */}
                  <div className="bg-slate-50/60 p-3 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium text-slate-800 block">
                        Early Settlement Penalty (
                        {quote.earlySettlementPenaltyPercent}%)
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Early payoff administrative fee
                      </span>
                    </div>
                    <span className="font-medium text-slate-800 text-xs">
                      + {formatCurrency(quote.earlySettlementPenaltyFee)}
                    </span>
                  </div>

                  {/* Waived Future Interest */}
                  <div className="bg-emerald-50/60 p-3.5 rounded-lg border border-emerald-100 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Unearned Future Interest Waived</span>
                      </div>
                      <span className="text-[11px] text-emerald-700/80 mt-0.5 block">
                        Future interest is waived for early closure.
                      </span>
                    </div>
                    <span className="font-bold text-emerald-700 text-sm">
                      - {formatCurrency(quote.unearnedFutureInterestWaived)}
                    </span>
                  </div>

                  {/* Final Total */}
                  <div className="bg-slate-900 text-white p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div>
                      <span className="text-[10px] uppercase font-medium text-slate-400 tracking-wider block">
                        FINAL PAYOFF AMOUNT
                      </span>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Total required to close loan contract in full today.
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold block tracking-tight">
                        {formatCurrency(quote.totalSettlementAmount)}
                      </span>
                      <span className="text-xs text-emerald-400 font-medium block">
                        Customer saves{" "}
                        {formatCurrency(quote.totalSavingsForCustomer)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Authorization Form */}
            <div className="space-y-6">
              <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs space-y-4">
                <h3 className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-slate-500" />
                  Settlement Authorization
                </h3>

                <form
                  onSubmit={handleOpenConfirm}
                  className="space-y-3 text-xs"
                >
                  {/* Settlement Date */}
                  <div>
                    <label className="text-[11px] text-slate-600 font-medium block mb-1">
                      Settlement Date
                    </label>

                    <input
                      type="date"
                      value={settlementDate}
                      onChange={(e) => setSettlementDate(e.target.value)}
                      className="w-full bg-white text-slate-800 text-xs py-2 px-3 rounded-lg border border-slate-200/80 focus:ring-1 focus:ring-slate-300 font-mono"
                      required
                    />
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="text-[11px] text-slate-600 font-medium block mb-1">
                      Payment Method
                    </label>

                    <select
                      value={paymentMethod}
                      onChange={(e) =>
                        setPaymentMethod(
                          e.target.value as PaymentRecord["paymentMethod"],
                        )
                      }
                      className="w-full bg-white text-slate-800 text-xs py-2 px-3 rounded-lg border border-slate-200/80 focus:ring-1 focus:ring-slate-300"
                    >
                      <option value="Bank_Transfer">
                        Bank Transfer / Wire
                      </option>
                      <option value="Cash">Cash at Counter</option>
                      <option value="Debit_Credit_Card">
                        Debit / Credit Card
                      </option>
                      <option value="Cheque">Manager's Cheque</option>
                    </select>
                  </div>

                  {/* Reference # */}
                  <div>
                    <label className="text-[11px] text-slate-600 font-medium block mb-1">
                      Transaction Ref #
                    </label>

                    <input
                      type="text"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      placeholder="Transaction Ref #"
                      className="w-full bg-white text-slate-800 text-xs py-2 px-3 rounded-lg border border-slate-200/80 focus:ring-1 focus:ring-slate-300 font-mono"
                      required
                    />
                  </div>

                  {/* Authorizing Officer (locked) */}
                  <div>
                    <label className="text-[11px] text-slate-600 font-medium block mb-1">
                      Authorizing Officer
                    </label>

                    <input
                      type="text"
                      value={receivedBy}
                      disabled
                      readOnly
                      className="w-full bg-slate-50 text-slate-600 text-xs py-2 px-3 rounded-lg border border-slate-200/80 font-medium cursor-not-allowed"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-[11px] text-slate-600 font-medium block mb-1">
                      Notes
                    </label>

                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Notes"
                      className="w-full bg-white text-slate-800 text-xs py-2 px-3 rounded-lg border border-slate-200/80 focus:ring-1 focus:ring-slate-300"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loanLoading || !currentLoan || posting}
                    className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 px-3 rounded-lg text-xs transition shadow-2xs flex items-center justify-center gap-1.5 mt-2 cursor-pointer"
                  >
                    {posting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Zap className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {posting ? "Processing..." : "Execute Early Settlement"}
                    </span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Confirmation Modal */}
      {currentLoan && quote && (
        <ConfirmModal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={handleConfirmSettlement}
          title="Authorize Early Loan Payoff"
          description="Are you sure you want to execute early settlement for this contract? The entire outstanding balance will be marked as fully settled, all future interest will be waived, and an official clearance certificate will be issued."
          confirmLabel="Authorize Early Settlement"
          cancelLabel="Review Calculation"
          variant="warning"
          isLoading={posting}
          details={[
            { label: "Borrower", value: currentLoan.customer?.fullName },
            {
              label: "Loan ID",
              value: currentLoan.loanNumber || currentLoan.id,
            },
            {
              label: "Total Payoff Due",
              value: formatCurrency(quote.totalSettlementAmount),
            },
            {
              label: "Waived Interest Savings",
              value: formatCurrency(quote.totalSavingsForCustomer),
            },
            { label: "Settlement Date", value: settlementDate },
            {
              label: "Payment Method",
              value: getPaymentMethodLabel(paymentMethod),
            },
          ]}
        />
      )}

      {/* Clearance Certificate Modal */}
      {showClearanceCertificate && currentLoan && (
        <ClearanceCertificateModal
          loan={currentLoan}
          quote={quote}
          onClose={() => setShowClearanceCertificate(false)}
        />
      )}
    </div>
  );
};
