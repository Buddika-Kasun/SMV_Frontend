import React from "react";
import { useAuth } from "../../contexts/AuthContext";
// import { useConsultancies } from "../../contexts/ConsultancyContext";
import { Navigation } from "../Navigation";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { TabType } from "@/src/types";
import { useUI } from "@/src/contexts/UIContext";

interface LayoutProps {
  children: React.ReactNode;
  activeTab: TabType;
  openNewLoanModal: () => void;
  openLoanDetails: (loanId: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  activeTab,
  openNewLoanModal,
  openLoanDetails,
}) => {
  const { currentUser, logout } = useAuth();

  // const { activeConsultancyCount } = useConsultancies();

  const { navCounts, setActiveTab, refreshKey } = useUI();

  // If no current user, don't render
  if (!currentUser) {
    return null;
  }

  const handleResetData = () => {
    if (
      window.confirm(
        "Reset system data to initial sample loans and consultancy agreements?",
      )
    ) {
      // resetLoans();
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-slate-50/50 text-slate-800 font-sans antialiased">
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pendingApprovalsCount={navCounts.pendingApproval}
        pendingKycCount={navCounts.pendingKyc}
        overdueCount={navCounts.overdue}
        // activeConsultancyCount={activeConsultancyCount}
        currentUser={currentUser}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        <Header
          onOpenNewLoanModal={openNewLoanModal}
          onResetData={handleResetData}
          onSelectLoan={openLoanDetails}
          currentUser={currentUser}
          onLogout={logout}
          refresh={refreshKey}
        />

        <main className="overflow-y-auto flex flex-col flex-1">
          <div className="p-4 sm:p-6 space-y-6 flex-1 w-full">
            {children}
          </div>

          <Footer currentUser={currentUser} />
        </main>
      </div>
    </div>
  );
};
