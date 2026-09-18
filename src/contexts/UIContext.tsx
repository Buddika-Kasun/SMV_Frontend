import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { TabType } from "../types";
import { NavigationCounts } from "../api/types/dashboard.types";
import { dashboardService } from "../services/dashboard.service";
import { LoanDocument } from "../api";

interface UIContextType {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedLoanId: string | null;
  setSelectedLoanId: (loanId: string) => void;

  // For the LoanDetailsModal
  detailsLoanId: string | null;
  openLoanDetails: (loanId: string) => void;
  closeLoanDetails: () => void;
  isNewLoanModalOpen: boolean;
  openNewLoanModal: () => void;
  closeNewLoanModal: () => void;

  preselectedPaymentLoanId: string | null;
  openPaymentForLoan: (loanId: string) => void;
  openSettlementForLoan: (loanId: string) => void;
  clearPreselectedLoan: () => void;

  previewDocument: LoanDocument | null;
  openDocumentPreview: (doc: LoanDocument) => void;
  closeDocumentPreview: () => void;

  // ---------------------------------------------------------
  // Refresh signal
  // ---------------------------------------------------------
  /**
   * Increments each time `triggerRefresh` is called.
   * Use it in a `useEffect` dependency array to re-fetch data.
   */
  refreshKey: number;
  /**
   * Call this anywhere to bump the refresh key — every component
   * watching `refreshKey` will re-run its fetch logic.
   */
  triggerRefresh: () => void;
  /**
   * Optional: named channels for more granular refresh signals.
   * E.g. `triggerRefresh("payments")` will only bump that channel.
   */
  refreshChannels: Record<string, number>;
  triggerRefreshChannel: (channel: string) => void;

  // ---------------------------------------------------------
  // Navigation counts (badges)
  // ---------------------------------------------------------
  navCounts: NavigationCounts;
  navCountsLoading: boolean;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTabState] = useState<TabType>("dashboard");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [isNewLoanModalOpen, setIsNewLoanModalOpen] = useState<boolean>(false);
  const [preselectedPaymentLoanId, setPreselectedPaymentLoanId] = useState<
    string | null
  >(null);
  const [detailsLoanId, setDetailsLoanId] = useState<string | null>(null);

  // Navigation badge counts
  const [navCounts, setNavCounts] = useState<NavigationCounts>({
    pendingApproval: 0,
    pendingKyc: 0,
    overdue: 0,
  });
  const [navCountsLoading, setNavCountsLoading] = useState(false);

  // ---------------------------------------------------------
  // Refresh signals
  // ---------------------------------------------------------
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshChannels, setRefreshChannels] = useState<
    Record<string, number>
  >({});

  const triggerRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
    console.log("refresh key : ", refreshKey);
  }, []);

  const triggerRefreshChannel = useCallback((channel: string) => {
    setRefreshChannels((prev) => ({
      ...prev,
      [channel]: (prev[channel] ?? 0) + 1,
    }));
  }, []);

  // Auth check — only fetch nav counts when a session exists
  // ---------------------------------------------------------
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const session = localStorage.getItem("smv_user");
    return Boolean(session);
  });

  // Re-evaluate auth on every route change (login → dashboard transition)
  useEffect(() => {
    const session = localStorage.getItem("smv_user");
    setIsAuthenticated(Boolean(session));
  }, [location.pathname]);

  // ---------------------------------------------------------
  // Fetch navigation counts (self-managed)
  // ---------------------------------------------------------
  const refreshNavCounts = useCallback(async () => {
    if (!isAuthenticated) {
      setNavCounts({ pendingApproval: 0, pendingKyc: 0, overdue: 0 });
      return;
    }
    setNavCountsLoading(true);
    try {
      const counts = await dashboardService.getNavigationCounts();
      setNavCounts(counts);
    } catch {
      setNavCounts({ pendingApproval: 0, pendingKyc: 0, overdue: 0 });
    }
    finally {
      setNavCountsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshNavCounts();
  }, [refreshNavCounts, refreshKey]);

  // Sync activeTab with URL path
  useEffect(() => {
    const path = location.pathname;
    const tabMap: Record<string, TabType> = {
      "/dashboard": "dashboard",
      "/applications": "applications",
      "/kyc": "kyc",
      "/payments": "payments",
      "/settlement": "settlement",
      "/customers": "customers",
      "/users": "users",
      "/reports": "reports",
    };

    const matchedTab = tabMap[path];
    if (matchedTab) {
      setActiveTabState(matchedTab);
    }
  }, [location.pathname]);

  const setActiveTab = useCallback(
    (tab: TabType) => {
      setActiveTabState(tab);
      navigate(`/${tab}`);
    },
    [navigate],
  );

  const openLoanDetails = useCallback((loanId: string) => {
    setDetailsLoanId(loanId);
  }, []);

  const closeLoanDetails = useCallback(() => {
    setDetailsLoanId(null);
  }, []);

  const openNewLoanModal = useCallback(() => {
    setIsNewLoanModalOpen(true);
  }, []);

  const closeNewLoanModal = useCallback(() => {
    setIsNewLoanModalOpen(false);
  }, []);

  const openPaymentForLoan = useCallback(
    (loanId: string) => {
      setPreselectedPaymentLoanId(loanId);
      setActiveTab("payments");
    },
    [setActiveTab],
  );

  const openSettlementForLoan = useCallback(
    (loanId: string) => {
      setPreselectedPaymentLoanId(loanId);
      setActiveTab("settlement");
    },
    [setActiveTab],
  );

  const clearPreselectedLoan = useCallback(() => {
    setPreselectedPaymentLoanId(null);
  }, []);

  const [previewDocument, setPreviewDocument] = useState<LoanDocument | null>(
    null,
  );

  const openDocumentPreview = useCallback((doc: LoanDocument) => {
    setPreviewDocument(doc);
  }, []);

  const closeDocumentPreview = useCallback(() => {
    setPreviewDocument(null);
  }, []);

  const value: UIContextType = {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,

    detailsLoanId,
    openLoanDetails,
    closeLoanDetails,

    selectedLoanId,
    setSelectedLoanId,

    isNewLoanModalOpen,
    openNewLoanModal,
    closeNewLoanModal,
    preselectedPaymentLoanId,
    openPaymentForLoan,
    openSettlementForLoan,
    clearPreselectedLoan,

    // Refresh signal
    refreshKey,
    triggerRefresh,
    refreshChannels,
    triggerRefreshChannel,

    // Navigation counts
    navCounts,
    navCountsLoading,

    previewDocument,
    openDocumentPreview,
    closeDocumentPreview,
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};;

export const useUI = (): UIContextType => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error("useUI must be used within a UIProvider");
  }
  return context;
};
