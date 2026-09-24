import React, { useState, useEffect, useCallback, useRef } from "react";
import { Search, Plus, LogOut, Loader2, Bell } from "lucide-react";
import { User } from "@/src/api";
import {
  DashboardHeader,
  DashboardSearchLoan,
} from "@/src/api/types/dashboard.types";
import { dashboardService } from "@/src/services/dashboard.service";
import { formatCurrency } from "@/src/utils/consultancyUtils";
import { getLoanStatusLabel } from "@/src/utils/loanUtils";
import { useDebounce } from "@/src/hooks/useDebounce";
import { RefreshChannel } from "@/src/constants/refreshChannels";
import { useLocation, useNavigate } from "react-router-dom";

interface HeaderProps {
  currentUser: User;
  unreadNotificationCount: number;
  onOpenNewLoanModal: () => void;
  onResetData?: () => void;
  onSelectLoan: (loanId: string) => void;
  onLogout: () => void;
  /** Bump this number to force the header to refetch (e.g. after creating a loan). */
  // refresh: number;
  refreshChannels: Record<string, number>;
}

const SEARCH_LIMIT = 10;

export const Header: React.FC<HeaderProps> = ({
  onOpenNewLoanModal,
  onSelectLoan,
  currentUser,
  onLogout,
  // refresh,
  refreshChannels,
  unreadNotificationCount,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isOnNotifications = location.pathname === "/notifications";

  // console.log("refresh : ", refresh);
  // ---------------------------------------------------------
  // Header stats (self-fetched)
  // ---------------------------------------------------------
  const [headerStats, setHeaderStats] = useState<DashboardHeader | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const refreshChannel = refreshChannels[RefreshChannel.Stats] ?? 0;

  const [bellRing, setBellRing] = useState(false);
  const prevUnreadRef = useRef(unreadNotificationCount);

  // Wiggle on unread count increase
  useEffect(() => {
    if (unreadNotificationCount > prevUnreadRef.current) {
      setBellRing(true);
      const t = setTimeout(() => setBellRing(false), 700);
      prevUnreadRef.current = unreadNotificationCount;
      return () => clearTimeout(t);
    }
    prevUnreadRef.current = unreadNotificationCount;
  }, [unreadNotificationCount]);

  const fetchHeaderStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await dashboardService.getHeader();
      setHeaderStats(data);
    } catch (error) {
      console.error("Failed to load header stats:", error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHeaderStats();
  }, [fetchHeaderStats, refreshChannel]);

  const totalDisbursed = headerStats?.totalDisbursedAmount ?? 0;
  const totalOutstanding = headerStats?.totalOutstanding ?? 0;

  // ---------------------------------------------------------
  // Search (self-fetched)
  // ---------------------------------------------------------
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 300);
  const [searchResults, setSearchResults] = useState<DashboardSearchLoan[]>([]);
  const [searching, setSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  // Fetch results when debounced query changes
  useEffect(() => {
    let cancelled = false;

    if (!debouncedQuery.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    (async () => {
      setSearching(true);
      try {
        const results = await dashboardService.search(
          debouncedQuery,
          SEARCH_LIMIT,
        );
        if (!cancelled) {
          setSearchResults(results);
        }
      } finally {
        if (!cancelled) setSearching(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchBoxRef.current &&
        !searchBoxRef.current.contains(e.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsSearchOpen(true);
  };

  const handleSelectResult = (loanId: string) => {
    onSelectLoan(loanId);
    setIsSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const showDropdown = isSearchOpen && searchQuery.trim().length > 0;

  // ---------------------------------------------------------
  // Render
  // ---------------------------------------------------------
  return (
    <header className="min-h-14 h-auto sm:h-14 bg-white border-b border-slate-200/80 md:pl-3 md:pr-2 px-4 md:py-2 py-0 flex items-center justify-between sticky top-0 z-40 gap-16">
      {/* Title */}
      {/* <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <span>Operations</span>
        <span>/</span>
        <span className="text-slate-900 font-semibold">Micro Finance</span>
      </div> */}

      {/* Search Input */}
      <div ref={searchBoxRef} className="relative flex-1 max-w-xl">
        <div className="flex gap-2">
          <div className="relative flex flex-1 items-center">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search customer, NIC or ID..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setIsSearchOpen(searchQuery.length > 0)}
              className="bg-slate-50 text-xs text-slate-800 pl-8 pr-8 py-1.5 min-w-60 w-full h-full rounded-lg border border-slate-200/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
            {searching && (
              <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 animate-spin" />
            )}
          </div>
          <div className="md:hidden flex flex-col items-center justify-center bg-slate-50 border border-slate-200/80 px-2 rounded-md">
            <span className="text-slate-400 text-[10px] block font-medium">
              SMS
            </span>
            {statsLoading ? (
              <div className="h-3.5 w-5 bg-slate-200 rounded animate-pulse mt-0.5" />
            ) : (
              <span className="font-semibold text-xs text-slate-900">
                {headerStats?.smsUnit
                  ? headerStats.smsUnit > 99
                    ? "99+"
                    : headerStats.smsUnit
                  : 0}
              </span>
            )}
          </div>
        </div>

        {/* Search Dropdown */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-50">
            {searching && searchResults.length === 0 ? (
              <div className="p-3 text-center text-[11px] text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Searching...
              </div>
            ) : searchResults.length === 0 ? (
              <div className="p-3 text-center text-[11px] text-slate-400">
                No matches for "{searchQuery}"
              </div>
            ) : (
              <>
                <div className="p-2 text-[10px] font-semibold text-slate-400 border-b border-slate-100 bg-slate-50">
                  Results ({searchResults.length})
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                  {searchResults.map((loan) => (
                    <button
                      key={loan.id}
                      onClick={() => handleSelectResult(loan.id)}
                      className="w-full text-left p-2.5 hover:bg-slate-50 transition flex items-center justify-between text-xs cursor-pointer"
                    >
                      <div className="flex flex-col min-w-0">
                        <div className="font-medium text-slate-900 truncate">
                          {loan.customer.fullName}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono flex flex-col">
                          <span>{loan.loanNumber}</span>
                          <span>{loan.customer.idNumber}</span>
                        </div>
                      </div>
                      <div className="text-right flex flex-col shrink-0">
                        <div className="font-semibold text-slate-900">
                          {formatCurrency(loan.requestedAmount)}
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {getLoanStatusLabel(loan.status)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
      {/* Quick Actions */}
      <div className="hidden lg:flex items-center gap-3">
        {/* Metric Summary — with skeletons while loading */}
        <div className="flex items-center gap-3 text-xs pr-3 border-r border-slate-200/80">
          <div>
            <span className="text-slate-400 text-[10px] block font-medium">
              SMS Unit
            </span>
            {statsLoading ? (
              <div className="h-3.5 w-10 bg-slate-200 rounded animate-pulse mt-0.5" />
            ) : (
              <span className="font-semibold text-slate-900">
                {headerStats?.smsUnit
                  ? headerStats.smsUnit > 99
                    ? "999+"
                    : headerStats.smsUnit
                  : 0}
              </span>
            )}
          </div>
          {currentUser.role !== "staff" && (
            <>
              <div>
                <span className="text-slate-400 text-[10px] block font-medium">
                  Disbursed
                </span>
                {statsLoading ? (
                  <div className="h-3.5 w-20 bg-slate-200 rounded animate-pulse mt-0.5" />
                ) : (
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(totalDisbursed)}
                  </span>
                )}
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block font-medium">
                  Outstanding
                </span>
                {statsLoading ? (
                  <div className="h-3.5 w-20 bg-slate-200 rounded animate-pulse mt-0.5" />
                ) : (
                  <span className="font-bold text-blue-600">
                    {formatCurrency(totalOutstanding)}
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* New Application */}
        <button
          onClick={onOpenNewLoanModal}
          className="hidden md:flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-3.5 py-1.5 rounded-lg transition shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Application</span>
        </button>

        {/* Logged In User */}
        <div className="hidden md:flex items-center gap-2 pl-2 border-l border-slate-200/80">
          {/* Notification Bell */}
          <button
            onClick={() => {
              setBellRing(true);
              setTimeout(() => setBellRing(false), 700);
              navigate("/notifications");
            }}
            title="Notifications"
            className={`relative p-1.5 rounded-lg transition border cursor-pointer ${
              isOnNotifications
                ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 border-transparent hover:border-slate-200"
            }`}
          >
            <Bell
              className={`w-4 h-4 ${bellRing ? "animate-bell-ring" : ""}`}
            />
            {unreadNotificationCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
              </span>
            )}
          </button>
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-lg md:hidden flex items-center justify-center font-bold text-xs uppercase ${
                currentUser.role === "admin"
                  ? "bg-blue-100 text-blue-800"
                  : currentUser.role === "manager"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-purple-100 text-purple-800"
              }`}
            >
              {currentUser.fullName.substring(0, 2)}
            </div>

            <div className="hidden sm:block text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 text-xs truncate max-w-30 block">
                  {currentUser.fullName}
                </span>
                <span
                  className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                    currentUser.role === "admin"
                      ? "bg-blue-100 text-blue-800"
                      : currentUser.role === "manager"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-purple-100 text-purple-800"
                  }`}
                >
                  {currentUser.role}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block font-mono leading-none">
                @{currentUser.username}
              </span>
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Log Out Session"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition border border-transparent hover:border-rose-200 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
