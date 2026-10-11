import React, { useState, useEffect, useCallback } from "react";
import { formatCurrency } from "../../utils/consultancyUtils";
import { Pagination } from "../common/Pagination";
import {
  Users,
  Search,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  LayoutGrid,
  LayoutList,
  CheckCircle2,
  AlertCircle,
  Pencil,
  X,
  Loader2,
} from "lucide-react";
import { CustomerData,} from "../../api";
import { customerService } from "../../services/customer.service";
import { useDebounce } from "../../hooks/useDebounce";
import { toDateInput } from "../../utils/loanUtils";
import toast from "react-hot-toast";
import { RefreshChannel } from "@/src/constants/refreshChannels";
import { UpdateCustomerPayload } from "@/src/api/types/customer.types";

interface CustomerDirectoryProps {
  refreshChannels: Record<string, number>;
  onSelectLoan: (loanId: string) => void;
}

// ---------------------------------------------------------
// Skeleton Row (List View)
// ---------------------------------------------------------
const SkeletonRow: React.FC = () => (
  <tr className="animate-pulse">
    <td className="px-4 py-3 space-y-1.5">
      <div className="h-3 w-32 bg-slate-200 rounded" />
      <div className="h-2.5 w-20 bg-slate-200 rounded" />
    </td>
    <td className="px-4 py-3">
      <div className="h-3 w-28 bg-slate-200 rounded" />
    </td>
    <td className="px-4 py-3 space-y-1.5">
      <div className="h-2.5 w-24 bg-slate-200 rounded" />
      <div className="h-2.5 w-20 bg-slate-200 rounded" />
    </td>
    <td className="px-4 py-3 space-y-1.5">
      <div className="h-2.5 w-24 bg-slate-200 rounded" />
      <div className="h-2.5 w-20 bg-slate-200 rounded" />
    </td>
    <td className="px-4 py-3">
      <div className="flex justify-center">
        <div className="h-5 w-20 bg-slate-200 rounded-full" />
      </div>
    </td>
    <td className="px-4 py-3">
      <div className="h-3 w-24 bg-slate-200 rounded ml-auto" />
    </td>
    <td className="px-4 py-3">
      <div className="h-3 w-24 bg-slate-200 rounded ml-auto" />
    </td>
    <td className="px-4 py-3">
      <div className="flex items-center justify-center gap-1.5">
        <div className="h-5 w-16 bg-slate-200 rounded" />
      </div>
    </td>
    <td className="px-4 py-3">
      <div className="flex justify-center">
        <div className="h-6 w-6 bg-slate-200 rounded-lg" />
      </div>
    </td>
  </tr>
);

// ---------------------------------------------------------
// Skeleton Card (Grid View)
// ---------------------------------------------------------
const SkeletonCard: React.FC = () => (
  <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs space-y-3 animate-pulse">
    <div className="flex items-start justify-between">
      <div className="space-y-1.5">
        <div className="h-2.5 w-20 bg-slate-200 rounded" />
        <div className="h-3.5 w-28 bg-slate-200 rounded" />
        <div className="h-2.5 w-24 bg-slate-200 rounded" />
      </div>
      <div className="h-5 w-20 bg-slate-200 rounded-full" />
    </div>

    <div className="space-y-2 bg-slate-50/60 p-3 rounded-lg border border-slate-100">
      <div className="h-2.5 w-32 bg-slate-200 rounded" />
      <div className="h-2.5 w-40 bg-slate-200 rounded" />
      <div className="h-2.5 w-36 bg-slate-200 rounded" />
    </div>

    <div className="grid grid-cols-2 gap-2">
      <div className="bg-slate-100/70 p-2.5 rounded-lg space-y-1.5">
        <div className="h-2 w-16 bg-slate-200 rounded" />
        <div className="h-3 w-20 bg-slate-200 rounded" />
      </div>
      <div className="bg-slate-100/70 p-2.5 rounded-lg space-y-1.5">
        <div className="h-2 w-16 bg-slate-200 rounded" />
        <div className="h-3 w-20 bg-slate-200 rounded" />
      </div>
    </div>

    <div className="space-y-1.5 pt-2 border-t border-slate-100">
      <div className="h-2 w-28 bg-slate-200 rounded" />
      <div className="h-9 w-full bg-slate-100 rounded-lg" />
    </div>
  </div>
);

const LIST_PAGE_SIZE = 10;
const GRID_PAGE_SIZE = 9;

type KycFilter = "All" | "Verified" | "Pending";

export const CustomerDirectory: React.FC<CustomerDirectoryProps> = ({
  refreshChannels,
  onSelectLoan,
}) => {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    pending: 0,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [filterKyc, setFilterKyc] = useState<KycFilter>("All");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [currentPage, setCurrentPage] = useState(1);

  // -------- Edit modal state --------
  const [editingCustomer, setEditingCustomer] = useState<CustomerData | null>(
    null,
  );

  const pageSize = viewMode === "grid" ? GRID_PAGE_SIZE : LIST_PAGE_SIZE;

  const refreshChannel =
    refreshChannels[RefreshChannel.Loans] ??
    refreshChannels[RefreshChannel.Payments] ??
    refreshChannels[RefreshChannel.Settlements] ??
    0;

  const fetchStats = useCallback(async () => {
    try {
      const s = await customerService.getStats();
      setStats(s);
    } catch (err) {
      // keep defaults
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats, refreshChannel]);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit: pageSize,
        sortBy: "customerNumber",
        sortOrder: "desc",
      };

      if (debouncedSearch) params.search = debouncedSearch;
      if (filterKyc !== "All") params.kycStatus = filterKyc;

      const response = await customerService.listCustomers(params);
      setCustomers(response.items);
      setTotalItems(response.meta.totalItems);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      toast.error("Failed to load customers");
      setCustomers([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch, filterKyc, refreshChannel]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleKycFilterChange = (tab: KycFilter) => {
    setFilterKyc(tab);
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

  // -------- After edit save --------
  const handleEditSaved = (updated: CustomerData) => {
    fetchCustomers();
    setEditingCustomer(null);
    fetchStats();
  };

  return (
    <div className="space-y-4 flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
            Customer Credit Directory & Profiles
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Directory of registered clients, KYC verification status, credit
            borrowing history, and contact details.
          </p>
        </div>

        <div className="flex items-center gap-3 self-stretch sm:self-auto">
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

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search name, NIC, phone..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full bg-slate-50 text-slate-800 text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>
        </div>
      </div>

      {/* KYC Filter Tabs */}
      <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-200/80 shadow-2xs overflow-x-auto text-xs">
        <span className="hidden md:block text-slate-400 font-medium mr-1">
          KYC Filter:
        </span>
        {(["All", "Pending", "Verified"] as const).map((tab) => {
          const count =
            tab === "All"
              ? stats.total
              : tab === "Verified"
                ? stats.verified
                : stats.pending;
          return (
            <button
              key={tab}
              onClick={() => handleKycFilterChange(tab)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                filterKyc === tab
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab}
              <span className="ml-1 opacity-80">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {viewMode === "list" ? (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col flex-1">
          <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between shrink-0">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Customer Accounts Directory
            </h3>
            <span className="text-[10px] text-slate-400">
              {totalItems} record{totalItems !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-xs whitespace-nowrap border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm">
                <tr className="border-b border-slate-200/80">
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Customer Details
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    NIC / ID
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Contact & Location
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Occupation / Income
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">
                    KYC Status
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">
                    Total Borrowed
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">
                    Total Repaid
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">
                    Associated Loans
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  Array.from({ length: LIST_PAGE_SIZE }).map((_, i) => (
                    <SkeletonRow key={`sk-${i}`} />
                  ))
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <Users className="w-8 h-8 text-slate-400 mx-auto" />
                        <h3 className="text-sm font-bold text-slate-900">
                          No Customers Found
                        </h3>
                        <p className="text-xs text-slate-500">
                          Try adjusting your search query or filter.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  customers.map((cust) => {
                    const loans = cust.loans ?? [];
                    const totalBorrowed = loans.reduce(
                      (sum, l) => sum + Number(l.account?.disbursedAmount || 0),
                      0,
                    );
                    const totalPaid = loans.reduce(
                      (sum, l) => sum + Number(l.totalPaidAmount || 0),
                      0,
                    );

                    return (
                      <tr
                        key={cust.id}
                        className="hover:bg-slate-50/80 transition group"
                      >
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-900 group-hover:text-blue-600 transition block text-xs">
                            {cust.fullName}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {cust.customerNumber}
                          </span>
                        </td>

                        <td className="px-4 py-3 font-mono text-[11px] font-semibold text-slate-700">
                          {cust.idNumber}
                        </td>

                        <td className="px-4 py-3 text-slate-600">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{cust.phone || "N/A"}</span>
                            </div>
                            {cust.city && (
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{cust.city}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-slate-600">
                          <span className="font-medium text-slate-800 block text-[11px]">
                            {cust.occupation || "N/A"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            {formatCurrency(cust.monthlyIncome || 0)}/mo
                          </span>
                        </td>

                        <td className="px-4 py-3 text-center">
                          <span
                            className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium inline-flex items-center gap-1 ${
                              cust.isVerified
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                                : "bg-amber-50 text-amber-700 border border-amber-200/60"
                            }`}
                          >
                            {cust.isVerified ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                Verified
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                                Pending
                              </>
                            )}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right font-bold text-blue-900">
                          {formatCurrency(totalBorrowed)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-800">
                          {formatCurrency(totalPaid)}
                        </td>

                        <td className="px-4 py-3 text-center">
                          <div className="flex flex-col items-center justify-center gap-1.5">
                            {loans.length === 0 ? (
                              <span className="text-[10px] text-slate-400">
                                No loans
                              </span>
                            ) : (
                              loans.map((loan) => (
                                <button
                                  key={loan.id}
                                  onClick={() => onSelectLoan(loan.id)}
                                  className="px-2 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded text-[10px] font-mono font-medium transition border border-slate-200/80 flex items-center gap-1 shrink-0 cursor-pointer"
                                  title={`View ${loan.loanNumber} Details`}
                                >
                                  <span>{loan.loanNumber}</span>
                                  <ChevronRight className="w-2.5 h-2.5" />
                                </button>
                              ))
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setEditingCustomer(cust)}
                            className="p-1.5 text-slate-600 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            title="Edit Customer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {customers.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              itemName="customer records"
            />
          )}
        </div>
      ) : (
        /* GRID VIEW */
        <div className="space-y-4 flex flex-col flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 content-start items-start">
            {loading ? (
              Array.from({ length: GRID_PAGE_SIZE }).map((_, i) => (
                <SkeletonCard key={`sk-${i}`} />
              ))
            ) : customers.length === 0 ? (
              <div className="py-8 text-center md:col-span-2 lg:col-span-3">
                <div className="flex flex-col items-center justify-center gap-1">
                  <Users className="w-8 h-8 text-slate-400 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-900">
                    No Customers Found
                  </h3>
                  <p className="text-xs text-slate-500">
                    Try adjusting your search query or filter.
                  </p>
                </div>
              </div>
            ) : (
              customers.map((cust) => {
                const loans = cust.loans ?? [];
                const totalBorrowed = loans.reduce(
                  (sum, l) => sum + Number(l.account?.disbursedAmount || 0),
                  0,
                );
                const totalPaid = loans.reduce(
                  (sum, l) => sum + Number(l.totalPaidAmount || 0),
                  0,
                );

                return (
                  <div
                    key={cust.id}
                    className="bg-white border border-slate-200/80 hover:border-blue-300 rounded-xl p-4 shadow-2xs hover:shadow-md transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-500 font-mono truncate">
                          {cust.customerNumber}
                        </p>
                        <h3 className="font-bold text-slate-900 text-sm truncate">
                          {cust.fullName}
                        </h3>
                        <p className="text-[10px] text-slate-500 font-mono truncate">
                          NIC/ID: {cust.idNumber}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium ${
                            cust.isVerified
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                              : "bg-amber-50 text-amber-700 border border-amber-200/60"
                          }`}
                        >
                          {cust.isVerified ? "KYC Verified" : "Pending KYC"}
                        </span>
                        <button
                          onClick={() => setEditingCustomer(cust)}
                          className="p-1.5 text-slate-600 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          title="Edit Customer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-600 space-y-1.5 bg-slate-50/60 p-3 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{cust.phone || "N/A"}</span>
                      </div>
                      {cust.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{cust.email}</span>
                        </div>
                      )}
                      {cust.addressLine && (
                        <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">
                            {cust.addressLine}
                            {cust.city ? `, ${cust.city}` : ""}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-blue-50/50 p-2.5 rounded-lg border border-blue-100/60">
                        <span className="text-slate-500 block text-[10px] font-medium">
                          Total Borrowed
                        </span>
                        <span className="font-bold text-blue-900 truncate block">
                          {formatCurrency(totalBorrowed)}
                        </span>
                      </div>
                      <div className="bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100/60">
                        <span className="text-slate-500 block text-[10px] font-medium">
                          Total Repaid
                        </span>
                        <span className="font-bold text-emerald-800 truncate block">
                          {formatCurrency(totalPaid)}
                        </span>
                      </div>
                    </div>

                    {loans.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Associated Loans ({loans.length})
                        </span>
                        {loans.map((loan) => (
                          <button
                            key={loan.id}
                            onClick={() => onSelectLoan(loan.id)}
                            className="w-full flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50/80 hover:bg-blue-50/60 transition text-xs text-left border border-slate-100 hover:border-blue-200 group cursor-pointer"
                          >
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 text-[11px] group-hover:text-blue-700 truncate block">
                                {loan.loanNumber}
                              </span>
                              <span className="text-slate-500 block text-[10px] truncate">
                                {loan.loanType}
                              </span>
                            </div>
                            <div className="text-right flex items-center gap-1 shrink-0">
                              <span className="font-bold text-slate-900 text-[11px]">
                                {formatCurrency(loan.requestedAmount)}
                              </span>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {customers.length > 0 && (
            <div className="mt-auto bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
              <Pagination
                currentPage={currentPage}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                itemName="customer records"
              />
            </div>
          )}
        </div>
      )}

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <EditCustomerModal
          customer={editingCustomer}
          onClose={() => setEditingCustomer(null)}
          onSaved={handleEditSaved}
        />
      )}
    </div>
  );
};

// ---------------------------------------------------------
// EDIT CUSTOMER MODAL
// ---------------------------------------------------------
interface EditCustomerModalProps {
  customer: CustomerData;
  onClose: () => void;
  onSaved: (updated: CustomerData) => void;
}

const EditCustomerModal: React.FC<EditCustomerModalProps> = ({
  customer,
  onClose,
  onSaved,
}) => {
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    fullName: customer.fullName || "",
    idNumber: customer.idNumber || "",
    idType: customer.idType || "NIC",
    phone: customer.phone || "",
    email: customer.email || "",
    dateOfBirth: toDateInput(customer.dateOfBirth || ""),
    gender: customer.gender || "Male",
    occupation: customer.occupation || "",
    employerName: customer.employerName || "",
    monthlyIncome: customer.monthlyIncome?.toString() || "0",
    addressLine: customer.addressLine || "",
    city: customer.city || "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Build a partial payload, dropping empty optional fields
    const payload: UpdateCustomerPayload = {
      fullName: form.fullName.trim() || undefined,
      idNumber: form.idNumber.trim() || undefined,
      idType: form.idType as any,
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      dateOfBirth: form.dateOfBirth || undefined,
      gender: form.gender as any,
      occupation: form.occupation.trim() || undefined,
      employerName: form.employerName.trim() || undefined,
      monthlyIncome: form.monthlyIncome
        ? Number(form.monthlyIncome)
        : undefined,
      addressLine: form.addressLine.trim() || undefined,
      city: form.city.trim() || undefined,
    };

    try {
      const updated = await customerService.updateCustomer(
        customer.id,
        payload,
      );
      onSaved(updated);
    } catch {
      // Service already toasts the error
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="flex min-h-full items-start sm:items-center justify-center p-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl max-w-2xl w-full shadow-xl animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92dvh] sm:max-h-[90dvh]">
          {/* Header */}
          <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between shrink-0 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Pencil className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Edit Customer
                </h3>
                <p className="text-[11px] text-slate-500 font-mono">
                  {customer.customerNumber} · {customer.fullName}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={saving}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="flex flex-col flex-1 min-h-0"
          >
            <div className="p-5 space-y-4 text-xs text-slate-700 overflow-y-auto flex-1 min-h-0">
              {/* Personal */}
              <div>
                <h4 className="font-semibold text-blue-700 uppercase tracking-wider mb-2 text-[10px]">
                  Personal Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-600 font-medium block mb-1 text-[11px]">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={form.fullName}
                      onChange={handleChange}
                      className="w-full bg-white text-slate-800 py-2 px-3 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 font-medium block mb-1 text-[11px]">
                      ID Document Type
                    </label>
                    <select
                      name="idType"
                      value={form.idType}
                      onChange={handleChange}
                      className="w-full bg-white text-slate-800 py-2 px-3 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
                    >
                      <option value="NIC">NIC / National ID</option>
                      <option value="Passport">Passport</option>
                      <option value="Driver_License">Driver License</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-600 font-medium block mb-1 text-[11px]">
                      ID Number
                    </label>
                    <input
                      type="text"
                      name="idNumber"
                      value={form.idNumber}
                      onChange={handleChange}
                      className="w-full bg-white text-slate-800 py-2 px-3 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 font-medium block mb-1 text-[11px]">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={form.dateOfBirth}
                      onChange={handleChange}
                      className="w-full bg-white text-slate-800 py-2 px-3 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 font-medium block mb-1 text-[11px]">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                      className="w-full bg-white text-slate-800 py-2 px-3 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="pt-3 border-t border-slate-100">
                <h4 className="font-semibold text-blue-700 uppercase tracking-wider mb-2 text-[10px]">
                  Contact Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-600 font-medium block mb-1 text-[11px]">
                      Phone
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      className="w-full bg-white text-slate-800 py-2 px-3 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 font-medium block mb-1 text-[11px]">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      className="w-full bg-white text-slate-800 py-2 px-3 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-slate-600 font-medium block mb-1 text-[11px]">
                      Address Line
                    </label>
                    <input
                      type="text"
                      name="addressLine"
                      value={form.addressLine}
                      onChange={handleChange}
                      className="w-full bg-white text-slate-800 py-2 px-3 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 font-medium block mb-1 text-[11px]">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      className="w-full bg-white text-slate-800 py-2 px-3 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Employment */}
              <div className="pt-3 border-t border-slate-100">
                <h4 className="font-semibold text-blue-700 uppercase tracking-wider mb-2 text-[10px]">
                  Employment & Income
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-600 font-medium block mb-1 text-[11px]">
                      Occupation
                    </label>
                    <input
                      type="text"
                      name="occupation"
                      value={form.occupation}
                      onChange={handleChange}
                      className="w-full bg-white text-slate-800 py-2 px-3 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 font-medium block mb-1 text-[11px]">
                      Employer Name
                    </label>
                    <input
                      type="text"
                      name="employerName"
                      value={form.employerName}
                      onChange={handleChange}
                      className="w-full bg-white text-slate-800 py-2 px-3 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 font-medium block mb-1 text-[11px]">
                      Monthly Income (LKR)
                    </label>
                    <input
                      type="number"
                      name="monthlyIncome"
                      value={form.monthlyIncome}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="w-full bg-white text-slate-800 py-2 px-3 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 p-4 border-t border-slate-100 bg-white shrink-0 rounded-b-2xl">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-lg font-medium text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !form.fullName.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium rounded-lg shadow-xs text-xs transition cursor-pointer inline-flex items-center gap-1.5"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{saving ? "Saving…" : "Save Changes"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
