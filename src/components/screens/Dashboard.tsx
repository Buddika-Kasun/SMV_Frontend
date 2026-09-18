import React, { useEffect, useState, useRef, useCallback } from "react";
import { TabType } from "../../types";
import {
  Banknote,
  TrendingUp,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  PlusCircle,
  CreditCard,
  ShieldAlert,
  Zap,
  UserCheck,
  Eye,
  FileCheck,
  ArrowRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import { User } from "../../api";
import { DashboardStats } from "../../api/types/dashboard.types";
import { dashboardService } from "../../services/dashboard.service";
import { formatCurrency } from "../../utils/consultancyUtils";
import {
  getLoanStatusColor,
  getLoanStatusLabel,
  getLoanTypeLabel,
} from "../../utils/loanUtils";

interface DashboardProps {
  currentUser: User;
  refresh: number;
  onTabChange: (tab: TabType) => void;
  onSelectLoan: (loanId: string) => void;
  onOpenNewLoanModal: () => void;
  onOpenLoanDetails: (loanId: string) => void;
}

// ---------------------------------------------------------
// Cell-level skeleton helpers
// ---------------------------------------------------------
const SkeletonBar: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`bg-slate-200 rounded animate-pulse ${className}`} />
);

const TableRowSkeleton: React.FC<{ cols: number }> = ({ cols }) => (
  <tr className="animate-pulse">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="py-3 px-4">
        <SkeletonBar className="h-3 w-24" />
        {i === 0 && <SkeletonBar className="h-2.5 w-16 mt-1.5" />}
      </td>
    ))}
  </tr>
);

export const Dashboard: React.FC<DashboardProps> = ({
  currentUser,
  refresh,
  onTabChange,
  onSelectLoan,
  onOpenNewLoanModal,
  onOpenLoanDetails,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [showWelcome, setShowWelcome] = useState(false);
  const [userName, setUserName] = useState("");
  const toastShown = useRef(false);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);

  // Login welcome
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const from = params.get("from");

    if (from === "login_success" && !toastShown.current) {
      const userStr = localStorage.getItem("smv_user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          setUserName(user.fullName);
          setShowWelcome(true);
          toastShown.current = true;

          toast.success(`Welcome back, ${user.fullName}!`, {
            duration: 3000,
            icon: "👋",
          });

          setTimeout(() => {
            setShowWelcome(false);
            navigate("/dashboard", { replace: true });
          }, 4000);
        } catch (error) {
          console.error("Failed to parse user data:", error);
        }
      }
    }
  }, [location, navigate]);

  // Fetch dashboard
  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const data = await dashboardService.getDashboard();
      setStats(data);
    } catch (error) {
      console.error("Failed to load dashboard:", error);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard, refresh]);

  // Derived
  const totalDisbursed = stats?.totalDisbursedAmount ?? 0;
  const totalOutstanding = stats?.totalOutstanding ?? 0;
  const totalCollected = stats?.totalCollected ?? 0;

  const disbursedLoanCount = stats?.disbursedLoanCount ?? 0;
  const settledLoanCount = stats?.settledLoanCount ?? 0;

  const pendingTotal = stats?.pendingActions?.total ?? 0;
  const pendingApproval = stats?.pendingActions?.pendingApproval ?? 0;
  const pendingKyc = stats?.pendingActions?.kycPending ?? 0;
  const pendingDisbursement = stats?.pendingActions?.pendingDisbursement ?? 0;

  const latestLoans = stats?.latestLoans ?? [];
  const hasOverdue = latestLoans.some((l) => l.status === "Overdue");

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      {showWelcome && (
        <div className="bg-linear-to-r from-emerald-500 to-emerald-600 rounded-xl p-5 shadow-lg animate-in slide-in-from-top duration-500 border border-emerald-400/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <UserCheck className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold text-xl">
                  Welcome back, {userName}! 👋
                </h2>
                <p className="text-emerald-100 text-sm mt-0.5">
                  You have successfully logged in to SMV Holdings Micro Finance
                  Portal
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <div className="bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/10">
                <span className="text-white font-semibold text-xs flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></span>
                  ✓ Session Active
                </span>
              </div>
              <button
                onClick={() => {
                  setShowWelcome(false);
                  toastShown.current = false;
                  navigate("/dashboard", { replace: true });
                }}
                className="text-white/70 hover:text-white transition p-1"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Micro Finance Portfolio
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            SMV Holdings — Real-time micro finance portfolio metrics, LKR
            collections, and active loan balances.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenNewLoanModal}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium px-3.5 py-2 rounded-lg text-xs transition shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Apply Loan</span>
          </button>
          <button
            onClick={() => onTabChange("payments")}
            className="flex items-center gap-1.5 bg-white hover:bg-blue-50/50 text-slate-700 font-medium px-3.5 py-2 rounded-lg text-xs transition border border-slate-200/80 shadow-2xs cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5 text-blue-600" />
            <span>Enter Payment</span>
          </button>
        </div>
      </div>

      {/* Overdue Warning */}
      {!loading && hasOverdue && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <div className="font-semibold text-xs text-amber-950">
                Overdue loans need attention
              </div>
              <p className="text-[11px] text-amber-800/80 mt-0.5">
                Installment payments are past due. Review applications or enter
                payments.
              </p>
            </div>
          </div>
          <button
            onClick={() => onTabChange("payments")}
            className="bg-amber-600 text-white font-medium px-3 py-1.5 rounded-lg text-xs hover:bg-amber-700 transition shrink-0 shadow-2xs cursor-pointer"
          >
            Review Overdue
          </button>
        </div>
      )}

      {/* KPI Cards — labels stay visible, only values show skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Disbursed */}
        <div className="bg-white p-4 border border-slate-200/80 rounded-xl shadow-2xs border-t-4 border-t-blue-600">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Disbursed</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          {loading ? (
            <>
              <SkeletonBar className="h-7 w-32 mb-3" />
              <div className="flex items-center justify-between">
                <SkeletonBar className="h-3 w-20" />
                <SkeletonBar className="h-3 w-16" />
              </div>
            </>
          ) : (
            <>
              <div className="text-xl font-extrabold tracking-tight text-slate-900">
                {formatCurrency(totalDisbursed)}
              </div>
              <div className="text-xs text-slate-500 mt-2 flex items-center justify-between">
                <span>{disbursedLoanCount} disbursed</span>
                <span className="text-blue-600 font-semibold">
                  {settledLoanCount} settled
                </span>
              </div>
            </>
          )}
        </div>

        {/* Outstanding */}
        <div className="bg-white p-4 border border-slate-200/80 rounded-xl shadow-2xs border-t-4 border-t-indigo-500">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Outstanding Balance</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          {loading ? (
            <>
              <SkeletonBar className="h-7 w-32 mb-3" />
              <div className="flex items-center justify-between">
                <SkeletonBar className="h-3 w-24" />
                <SkeletonBar className="h-3 w-20" />
              </div>
            </>
          ) : (
            <>
              <div className="text-xl font-extrabold tracking-tight text-slate-900">
                {formatCurrency(totalOutstanding)}
              </div>
              <div className="text-xs text-slate-500 mt-2 flex items-center justify-between">
                <span>Active portfolio</span>
                <span className="text-indigo-600 font-semibold">
                  Principal + Int
                </span>
              </div>
            </>
          )}
        </div>

        {/* Collected */}
        <div className="bg-white p-4 border border-slate-200/80 rounded-xl shadow-2xs border-t-4 border-t-emerald-500">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Collected</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          {loading ? (
            <>
              <SkeletonBar className="h-7 w-32 mb-3" />
              <div className="flex items-center justify-between">
                <SkeletonBar className="h-3 w-24" />
                <SkeletonBar className="h-3 w-20" />
              </div>
            </>
          ) : (
            <>
              <div className="text-xl font-extrabold tracking-tight text-slate-900">
                {formatCurrency(totalCollected)}
              </div>
              <div className="text-xs text-slate-500 mt-2 flex items-center justify-between">
                <span>Verified receipts</span>
                <span className="text-emerald-600 font-semibold">
                  100% Verified
                </span>
              </div>
            </>
          )}
        </div>

        {/* Pending Actions */}
        <div className="bg-white p-4 border border-slate-200/80 rounded-xl shadow-2xs border-t-4 border-t-purple-500">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Pending Action</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          {loading ? (
            <>
              <SkeletonBar className="h-7 w-16 mb-3" />
              <div className="flex items-center gap-2">
                <SkeletonBar className="h-3 w-20" />
                <SkeletonBar className="h-3 w-16" />
              </div>
            </>
          ) : (
            <>
              <div className="text-xl font-extrabold tracking-tight text-slate-900">
                {pendingTotal}
              </div>
              <div className="text-xs text-slate-500 mt-2 flex items-center gap-2">
                <button
                  onClick={() => onTabChange("applications")}
                  className="text-purple-700 hover:text-purple-900 font-semibold cursor-pointer"
                >
                  {pendingApproval} Approval
                </button>
                <span>•</span>
                <button
                  onClick={() => onTabChange("kyc")}
                  className="text-purple-700 hover:text-purple-900 font-semibold cursor-pointer"
                >
                  {pendingKyc + pendingDisbursement} KYC
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => onTabChange("kyc")}
          className="bg-white border border-slate-200/80 p-4 rounded-xl hover:border-purple-300 hover:shadow-md cursor-pointer transition-all group shadow-2xs"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <FileCheck className="w-4 h-4" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition" />
          </div>
          <h3 className="font-semibold text-slate-900 text-xs group-hover:text-purple-700 transition">
            KYC & Document Studio
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Verify ID, address, and disburse loan funds.
          </p>
        </div>

        <div
          onClick={() => onTabChange("payments")}
          className="bg-white border border-slate-200/80 p-4 rounded-xl hover:border-blue-300 hover:shadow-md cursor-pointer transition-all group shadow-2xs"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <CreditCard className="w-4 h-4" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition" />
          </div>
          <h3 className="font-semibold text-slate-900 text-xs group-hover:text-blue-700 transition">
            Payment Entry
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Record installment payments and issue receipts.
          </p>
        </div>

        <div
          onClick={() => onTabChange("settlement")}
          className="bg-white border border-slate-200/80 p-4 rounded-xl hover:border-amber-300 hover:shadow-md cursor-pointer transition-all group shadow-2xs"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Zap className="w-4 h-4" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition" />
          </div>
          <h3 className="font-semibold text-slate-900 text-xs group-hover:text-amber-700 transition">
            Early Settlement
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Calculate interest waivers and close loans early.
          </p>
        </div>
      </div>

      {/* Latest Loans Table — headers always visible, only rows skeleton */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900 text-xs">
              Recent Loans
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Latest loan contracts from the portfolio.
            </p>
          </div>
          <button
            onClick={() => onTabChange("applications")}
            className="text-xs font-medium text-slate-600 hover:text-slate-900 transition cursor-pointer flex items-center gap-2"
          >
            View All <ArrowRight width={12} height={12} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50/50 text-slate-400 font-medium border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Disbursed</th>
                <th className="py-3 px-4">Paid Progress</th>
                <th className="py-3 px-4">Outstanding</th>
                <th className="py-3 px-4">Next Due</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <>
                  <TableRowSkeleton cols={8} />
                  <TableRowSkeleton cols={8} />
                  <TableRowSkeleton cols={8} />
                  <TableRowSkeleton cols={8} />
                  <TableRowSkeleton cols={8} />
                </>
              ) : latestLoans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <Banknote className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-medium">
                      No loans yet
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Apply a new loan to get started.
                    </p>
                  </td>
                </tr>
              ) : (
                latestLoans.map((loan) => {
                  const paidPct = Math.min(
                    100,
                    Math.round(loan.paidProgressPercent || 0),
                  );

                  return (
                    <tr
                      key={loan.id}
                      className="hover:bg-slate-50/50 transition"
                    >
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">
                          {loan.customerName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {loan.loanNumber}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] text-slate-600">
                          {getLoanTypeLabel(loan.loanType)}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {formatCurrency(loan.disbursedAmount)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="w-28">
                          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                            <span>{paidPct}%</span>
                            <span>{formatCurrency(loan.totalPaidAmount)}</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full"
                              style={{ width: `${paidPct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {formatCurrency(loan.outstandingBalance)}
                      </td>
                      <td className="py-3 px-4 text-[11px]">
                        {loan.nextDueDate ? (
                          <div>
                            <span className="text-slate-800 font-medium">
                              {loan.nextDueDate}
                            </span>
                            <span className="block text-slate-400 text-[10px]">
                              {formatCurrency(loan.nextDueAmount || 0)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${getLoanStatusColor(loan.status)}`}
                        >
                          {getLoanStatusLabel(loan.status)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {(loan.status === "Active" ||
                            loan.status === "Overdue") && (
                            <>
                              <button
                                onClick={() => {
                                  onSelectLoan(loan.id);
                                  onTabChange("payments");
                                }}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-medium transition shadow-2xs cursor-pointer"
                              >
                                Pay
                              </button>
                              <button
                                onClick={() => {
                                  onSelectLoan(loan.id);
                                  onTabChange("settlement");
                                }}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-medium transition cursor-pointer"
                              >
                                Settle
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => onOpenLoanDetails(loan.id)}
                            title="View Details"
                            className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
