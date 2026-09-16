import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  useResizableColumns,
  ColumnConfig,
} from "../../hooks/useResizableColumns";
import { ResizableTh, ResizableTableContainer } from "../common/ResizableTable";
import { Pagination } from "../common/Pagination";
import { ConfirmModal } from "../common/ConfirmModal";
import {
  PlusCircle,
  CheckCircle,
  XCircle,
  FileText,
  Eye,
  ShieldCheck,
  Search,
  LayoutGrid,
  LayoutList,
  Lock,
} from "lucide-react";
import { Loan, User } from "../../api";
import { TabType } from "../../types";
import { formatCurrency } from "../../utils/consultancyUtils";
import { loanService } from "../../services/loan.service";
import { useDebounce } from "../../hooks/useDebounce";
import toast from "react-hot-toast";
import {
  getInterestMethodLabel,
  getLoanStatusConfig,
  getLoanTypeLabel,
} from "../../utils/loanUtils";

// ---------------------------------------------------------
// Skeleton Row (List View)
// ---------------------------------------------------------
const SkeletonRow: React.FC = () => (
  <tr className="animate-pulse">
    <td className="px-4 py-3 space-y-1.5">
      <div className="h-3 w-28 bg-slate-200 rounded" />
      <div className="h-2.5 w-20 bg-slate-200 rounded" />
    </td>
    <td className="px-4 py-3 space-y-1.5">
      <div className="h-3 w-32 bg-slate-200 rounded" />
      <div className="h-2.5 w-40 bg-slate-200 rounded" />
    </td>
    <td className="px-4 py-3 space-y-1.5">
      <div className="h-3 w-24 bg-slate-200 rounded" />
      <div className="h-2.5 w-20 bg-slate-200 rounded" />
    </td>
    <td className="px-4 py-3">
      <div className="h-3 w-24 bg-slate-200 rounded ml-auto" />
    </td>
    <td className="px-4 py-3">
      <div className="h-3 w-24 bg-slate-200 rounded ml-auto" />
    </td>
    <td className="px-4 py-3 space-y-1.5">
      <div className="h-2.5 w-14 bg-slate-200 rounded mx-auto" />
      <div className="h-2.5 w-16 bg-slate-200 rounded mx-auto" />
    </td>
    <td className="px-4 py-3">
      <div className="flex justify-center">
        <div className="h-5 w-24 bg-slate-200 rounded-full" />
      </div>
    </td>
    <td className="px-4 py-3">
      <div className="flex items-center justify-end gap-1.5">
        <div className="w-7 h-7 bg-slate-200 rounded-lg" />
        <div className="w-16 h-7 bg-slate-200 rounded-lg" />
      </div>
    </td>
  </tr>
);

// ---------------------------------------------------------
// Skeleton Card (Grid View)
// ---------------------------------------------------------
const SkeletonCard: React.FC = () => (
  <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs flex flex-col justify-between animate-pulse border-t-4 border-t-slate-200">
    <div>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="space-y-1.5">
          <div className="h-2.5 w-20 bg-slate-200 rounded" />
          <div className="h-2.5 w-28 bg-slate-200 rounded" />
          <div className="h-3.5 w-32 bg-slate-200 rounded" />
          <div className="h-2.5 w-24 bg-slate-200 rounded" />
        </div>
        <div className="h-5 w-20 bg-slate-200 rounded-full" />
      </div>

      <div className="bg-slate-50/60 p-3 rounded-lg border border-slate-100 my-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="h-2.5 w-14 bg-slate-200 rounded" />
          <div className="h-2.5 w-20 bg-slate-200 rounded" />
        </div>
        <div className="flex items-center justify-between">
          <div className="h-2.5 w-14 bg-slate-200 rounded" />
          <div className="h-2.5 w-24 bg-slate-200 rounded" />
        </div>
        <div className="flex items-center justify-between">
          <div className="h-2.5 w-12 bg-slate-200 rounded" />
          <div className="h-2.5 w-20 bg-slate-200 rounded" />
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
          <div className="h-2.5 w-14 bg-slate-200 rounded" />
          <div className="h-2.5 w-24 bg-slate-200 rounded" />
        </div>
      </div>
    </div>

    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
      <div className="h-7 w-20 bg-slate-200 rounded-lg" />
      <div className="flex items-center gap-1.5">
        <div className="h-7 w-16 bg-slate-200 rounded-lg" />
      </div>
    </div>
  </div>
);

interface LoanApplicationsProps {
  refresh: number;
  onOpenLoanDetails: (loanId: string) => void;
  onSelectLoan: (loanId: string) => void;
  onOpenNewLoanModal: () => void;
  onTabChange: (tab: TabType) => void;
  currentUser: User;
}

const LIST_PAGE_SIZE = 10;
const GRID_PAGE_SIZE = 9;

// const LOAN_COLUMNS: ColumnConfig[] = [
//   { id: "id", defaultWidth: 150, minWidth: 110 },
//   { id: "customer", defaultWidth: 230, minWidth: 150 },
//   { id: "product", defaultWidth: 180, minWidth: 130 },
//   { id: "principal", defaultWidth: 140, minWidth: 110 },
//   { id: "outstanding", defaultWidth: 150, minWidth: 120 },
//   { id: "term", defaultWidth: 120, minWidth: 90 },
//   { id: "status", defaultWidth: 140, minWidth: 110 },
//   { id: "actions", defaultWidth: 170, minWidth: 120 },
// ];

const STATUS_OPTIONS = [
  "All",
  "Pending_Approval",
  "KYC_Pending",
  "Approved_Pending_Disbursement",
  "Active",
  "Overdue",
  "Settled",
  "Early_Settled",
  "Rejected",
];

export const LoanApplications: React.FC<LoanApplicationsProps> = ({
  refresh,
  onOpenLoanDetails,
  onSelectLoan,
  onOpenNewLoanModal,
  onTabChange,
  currentUser,
}) => {
  // Data state
  const [loans, setLoans] = useState<Loan[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);

  // Filter state
  const [filterStatus, setFilterStatus] = useState<string>("Pending_Approval");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // Modal state
  const [loanToApprove, setLoanToApprove] = useState<Loan | null>(null);
  const [loanToReject, setLoanToReject] = useState<Loan | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const canApprove =
    currentUser.role === "admin" || currentUser.role === "manager";
  const pageSize = viewMode === "grid" ? GRID_PAGE_SIZE : LIST_PAGE_SIZE;

  // const {
  //   columnWidths,
  //   startResize,
  //   resetToDefault,
  //   handleDoubleClickReset,
  //   resizingColId,
  //   totalTableWidth,
  // } = useResizableColumns(LOAN_COLUMNS, "loan_applications");

  // Fetch loans from API
  const fetchLoans = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit: pageSize,
        sortBy: "createdAt",
        sortOrder: "desc",
      };

      if (debouncedSearch) params.search = debouncedSearch;
      if (filterStatus !== "All") params.status = filterStatus;

      const response = await loanService.listLoans(params);
      setLoans(response.items);
      setTotalItems(response.meta.totalItems);
    } catch (error) {
      console.error("Failed to fetch loans:", error);
      toast.error("Failed to load loans");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch, filterStatus, refresh]);

  // Load on filter/page change
  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  const handleConfirmApproval = async () => {
    if (!loanToApprove) return;
    try {
      await loanService.approveLoan(loanToApprove.id);
      setLoanToApprove(null);
      fetchLoans();
    } catch (error) {
      // Error already toasted inside the service
    }
  };

  const handleConfirmRejection = async () => {
    if (!loanToReject) return;
    try {
      await loanService.rejectLoan(loanToReject.id, rejectReason);
      setLoanToReject(null);
      setRejectReason("");
      fetchLoans();
    } catch (error) {
      // Error already toasted inside the service
    }
  };

  // Reset page when filters change
  const handleStatusFilterChange = (status: string) => {
    setFilterStatus(status);
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleViewModeChange = (mode: "list" | "grid") => {
    setViewMode(mode);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4 flex flex-col h-full">
      {/* Header & New Request Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <FileText className="w-4 h-4" />
            </div>
            Loan Applications & Approvals
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Review loan requests, evaluate creditworthiness, approve
            applications, and manage active repayment terms.
          </p>
        </div>

        <div className="flex items-center gap-3 self-stretch sm:self-auto">
          {/* List vs Grid Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200/80 shrink-0">
            <button
              onClick={() => handleViewModeChange("list")}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === "list"
                  ? "bg-white text-blue-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="List View (10 per page)"
            >
              <LayoutList className="w-4 h-4" />
              <span className="hidden md:inline text-xs">List View</span>
            </button>
            <button
              onClick={() => handleViewModeChange("grid")}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white text-blue-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Grid View (9 per page)"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden md:inline text-xs">Grid View</span>
            </button>
          </div>

          <button
            onClick={onOpenNewLoanModal}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium px-3.5 py-2 rounded-lg text-xs transition shadow-xs shrink-0 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Application</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none">
          {STATUS_OPTIONS.map((st) => {
            const cfg = st === "All" ? null : getLoanStatusConfig(st);
            return (
              <button
                key={st}
                onClick={() => handleStatusFilterChange(st)}
                className={`px-2 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap transition cursor-pointer ${
                  filterStatus === st
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-white text-slate-600 hover:bg-blue-50/80 hover:text-blue-700 border border-slate-200/80"
                }`}
              >
                {cfg?.label || st}
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search applicant, NIC or ID..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full bg-slate-50 text-slate-800 text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Empty / Loading / Data State */}
      {loans.length === 0 && !loading ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200/80 text-slate-500 shadow-2xs flex-1">
          <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
          <p className="font-semibold text-slate-700 text-xs">
            No matching loan applications found.
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Try selecting a different status filter or clear your search term.
          </p>
        </div>
      ) : viewMode === "list" ? (
        /* LIST VIEW */
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col flex-1">
          {/* Table Header Label */}
          <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between shrink-0">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Loan Applications & Approvals
            </h3>
            <span className="text-[10px] text-slate-400">
              {totalItems} record{totalItems !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
              <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm">
                <tr className="border-b border-slate-200/80">
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Loan ID & Acc ID
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Applicant
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Loan Product
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">
                    Principal (LKR)
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">
                    Outstanding (LKR)
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">
                    Term / Rate
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">
                    Status
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading
                  ? Array.from({ length: LIST_PAGE_SIZE }).map((_, i) => (
                      <SkeletonRow key={`sk-${i}`} />
                    ))
                  : loans.map((loan) => {
                      const cfg = getLoanStatusConfig(loan.status);
                      const isPendingApproval =
                        loan.status === "Pending_Approval";
                      const isKycPending = loan.status === "KYC_Pending";
                      const isActive = loan.status === "Active";
                      const isOverdue = loan.status === "Overdue";

                      return (
                        <tr
                          key={loan.id}
                          className="hover:bg-slate-50/80 transition group"
                        >
                          <td className="px-4 py-3 font-mono text-[11px]">
                            <span className="font-bold text-slate-900 group-hover:text-blue-600 transition block">
                              {loan.loanNumber}
                            </span>
                            <span className="text-slate-400 text-[10px] block">
                              {loan.account?.accountNumber || "Acc Pending"}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <span className="font-bold text-slate-900 block text-xs">
                              {loan.customer?.fullName}
                            </span>
                            <span className="text-slate-500 font-mono text-[10px] block">
                              {loan.customer?.idNumber}
                              {loan.customer?.phone
                                ? ` • ${loan.customer.phone}`
                                : ""}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <span className="font-medium text-slate-800 block text-xs">
                              {getLoanTypeLabel(loan.loanType)}
                            </span>
                            <span className="text-slate-400 text-[10px] block">
                              {loan.purpose}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-right font-bold text-slate-900">
                            {formatCurrency(
                              loan.account?.disbursedAmount ||
                                loan.requestedAmount,
                            )}
                          </td>

                          <td className="px-4 py-3 text-right font-extrabold text-blue-900">
                            {formatCurrency(loan.outstandingBalance)}
                          </td>

                          <td className="px-4 py-3 text-center">
                            <span className="font-medium text-slate-800 block text-[11px]">
                              {loan.termMonths} Mo.
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono block">
                              {loan.interestRatePerAnnum}% p.a.
                            </span>
                          </td>

                          <td className="px-4 py-3 text-center">
                            <span
                              className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium inline-block border ${cfg.className}`}
                            >
                              {cfg.label}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {isPendingApproval &&
                                (canApprove ? (
                                  <>
                                    <button
                                      onClick={() => {
                                        setRejectReason("");
                                        setLoanToReject(loan);
                                      }}
                                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition shrink-0 cursor-pointer"
                                      title="Reject Request"
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => setLoanToApprove(loan)}
                                      className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-2.5 py-1 rounded-lg text-xs transition shadow-2xs shrink-0 cursor-pointer"
                                      title="Approve Request"
                                    >
                                      <CheckCircle className="w-3.5 h-3.5" />
                                      <span>Approve</span>
                                    </button>
                                  </>
                                ) : (
                                  <span className="flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200/80 px-2 py-0.5 rounded-md text-[10px] font-medium shrink-0">
                                    <Lock className="w-3 h-3 text-amber-600" />
                                    <span>Mgr. Approval</span>
                                  </span>
                                ))}

                              {isKycPending && (
                                <button
                                  onClick={() => {
                                    onSelectLoan(loan.id);
                                    onTabChange("kyc");
                                  }}
                                  className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-medium px-2.5 py-1 rounded-lg text-xs transition shadow-xs shrink-0 cursor-pointer"
                                  title="Process KYC"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  <span>KYC</span>
                                </button>
                              )}

                              {(isActive || isOverdue) && (
                                <>
                                  <button
                                    onClick={() => {
                                      onSelectLoan(loan.id);
                                      onTabChange("payments");
                                    }}
                                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-medium transition shadow-2xs shrink-0 cursor-pointer"
                                  >
                                    Pay
                                  </button>
                                  <button
                                    onClick={() => {
                                      onSelectLoan(loan.id);
                                      onTabChange("settlement");
                                    }}
                                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition shrink-0 cursor-pointer"
                                  >
                                    Settle
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => onOpenLoanDetails(loan.id)}
                                className="p-1.5 text-slate-600 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 rounded-lg transition shrink-0 cursor-pointer"
                                title="View Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            itemName="applications"
          />
        </div>
      ) : (
        /* GRID VIEW (9 per page) */
        <div className="space-y-4 flex flex-col flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 content-start">
            {loading
              ? Array.from({ length: GRID_PAGE_SIZE }).map((_, i) => (
                  <SkeletonCard key={`sk-${i}`} />
                ))
              : loans.map((loan) => {
                  const cfg = getLoanStatusConfig(loan.status);
                  const isPendingApproval = loan.status === "Pending_Approval";
                  const isKycPending = loan.status === "KYC_Pending";
                  const isPendingDisbursment =
                    loan.status === "Approved_Pending_Disbursement";
                  const isActive = loan.status === "Active";
                  const isOverdue = loan.status === "Overdue";
                  const isRejected = loan.status === "Rejected";

                  return (
                    <div
                      key={loan.id}
                      className={`bg-white border border-slate-200/80 hover:border-blue-300 rounded-xl p-4 shadow-2xs flex flex-col justify-between transition group border-t-4 ${
                        isPendingApproval
                          ? " border-t-blue-600"
                          : isKycPending
                            ? " border-t-purple-500"
                            : isPendingDisbursment
                              ? "border-t-indigo-400"
                              : isActive
                                ? " border-t-emerald-500"
                                : isOverdue
                                  ? " border-t-amber-500"
                                  : isRejected
                                    ? " border-t-red-500"
                                    : " border-t-slate-400"
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div>
                            <span className="text-[10px] text-blue-600 font-semibold font-mono">
                              {getLoanTypeLabel(loan.loanType)}
                            </span>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {loan.loanNumber} • {loan.account?.accountNumber}
                            </p>
                            <h3 className="font-semibold text-slate-900 text-sm mt-0.5 group-hover:text-blue-700 transition">
                              {loan.customer?.fullName}
                            </h3>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {loan.customer?.idNumber}
                            </p>
                          </div>
                          <span
                            className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium border ${cfg.className}`}
                          >
                            {cfg.label}
                          </span>
                        </div>

                        <div className="bg-slate-50/60 p-3 rounded-lg border border-slate-100 my-3 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500">
                              Amount:
                            </span>
                            <span className="font-bold text-slate-900 text-xs">
                              {formatCurrency(loan.requestedAmount)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>Interest:</span>
                            <span className="text-slate-800 font-medium">
                              {loan.interestRatePerAnnum}% (
                              {getInterestMethodLabel(loan.interestMethod)})
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>Term:</span>
                            <span className="text-slate-800 font-medium">
                              {loan.termMonths} Months
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-200/60">
                            <span>Purpose:</span>
                            <span className="text-slate-700 truncate max-w-37.5">
                              {loan.purpose}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          onClick={() => onSelectLoan(loan.id)}
                          className="px-2.5 py-1.5 text-slate-600 hover:text-blue-700 bg-slate-100/80 hover:bg-blue-50 rounded-lg transition text-xs font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Details</span>
                        </button>

                        {isPendingApproval &&
                          (canApprove ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  setRejectReason("");
                                  setLoanToReject(loan);
                                }}
                                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                                title="Reject Request"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setLoanToApprove(loan)}
                                className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-3 py-1.5 rounded-lg text-xs transition shadow-2xs cursor-pointer"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                            </div>
                          ) : (
                            <span className="flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200/80 px-2 py-1 rounded-md text-[10px] font-medium">
                              <Lock className="w-3 h-3 text-amber-600" />
                              <span>Awaiting Mgr.</span>
                            </span>
                          ))}

                        {isKycPending && (
                          <button
                            onClick={() => {
                              onSelectLoan(loan.id);
                              onTabChange("kyc");
                            }}
                            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-1.5 rounded-lg text-xs transition shadow-xs cursor-pointer"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Process KYC</span>
                          </button>
                        )}

                        {(isActive || isOverdue) && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                onSelectLoan(loan.id);
                                onTabChange("payments");
                              }}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition shadow-2xs cursor-pointer"
                            >
                              Pay
                            </button>
                            <button
                              onClick={() => {
                                onSelectLoan(loan.id);
                                onTabChange("settlement");
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition cursor-pointer"
                            >
                              Settle
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
          </div>

          <div className="mt-auto bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              itemName="applications"
            />
          </div>
        </div>
      )}

      {/* Approve Confirmation */}
      <ConfirmModal
        isOpen={Boolean(loanToApprove)}
        onClose={() => setLoanToApprove(null)}
        onConfirm={handleConfirmApproval}
        title="Approve Loan Application"
        description="Are you sure you want to approve this loan application? Once approved, the application will be transferred to the KYC and Document Compliance stage."
        confirmLabel="Authorize & Approve"
        cancelLabel="Cancel"
        variant="success"
        details={
          loanToApprove
            ? [
                { label: "Loan ID", value: loanToApprove.loanNumber },
                {
                  label: "Borrower Name",
                  value: loanToApprove.customer?.fullName,
                },
                {
                  label: "Principal Amount",
                  value: formatCurrency(loanToApprove.requestedAmount),
                },
                {
                  label: "Loan Term & Rate",
                  value: `${loanToApprove.termMonths} Mo. @ ${loanToApprove.interestRatePerAnnum}% p.a.`,
                },
              ]
            : []
        }
      />

      {/* Reject Confirmation */}
      <ConfirmModal
        isOpen={Boolean(loanToReject)}
        onClose={() => {
          setLoanToReject(null);
          setRejectReason("");
        }}
        onConfirm={handleConfirmRejection}
        title="Reject Loan Application"
        description="Are you sure you want to reject this loan application? The status will be marked as Rejected in the system."
        confirmLabel="Confirm Rejection"
        cancelLabel="Keep Application"
        variant="danger"
        input={{
          label: "Rejection Reason",
          placeholder:
            "e.g. Insufficient monthly income, low credit score, incomplete documentation...",
          value: rejectReason,
          onChange: setRejectReason,
          required: true,
          maxLength: 500,
          type: "textarea",
          rows: 3,
          helperText: "This will be recorded against the application.",
        }}
        details={
          loanToReject
            ? [
                { label: "Loan ID", value: loanToReject.loanNumber },
                {
                  label: "Applicant Name",
                  value: loanToReject.customer?.fullName,
                },
                {
                  label: "Requested Amount",
                  value: formatCurrency(loanToReject.requestedAmount),
                },
                {
                  label: "ID (NIC or other)",
                  value: loanToReject.customer?.idNumber || "N/A",
                },
              ]
            : []
        }
      />
    </div>
  );
};
