import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { useLoans } from "../contexts/LoanContext";
// import { useConsultancies } from "../contexts/ConsultancyContext";
import { useUI } from "../contexts/UIContext";
import { Dashboard } from "./screens/Dashboard";
import { LoanApplications } from "./screens/LoanApplications";
import { KYCStudio } from "./screens/KYCStudio";
import { PaymentStudio } from "./screens/PaymentStudio";
import { EarlySettlementStudio } from "./screens/EarlySettlementStudio";
import { CustomerDirectory } from "./screens/CustomerDirectory";
import { UserManagement } from "./screens/UserManagement";
import { ReportsStudio } from "./screens/ReportsStudio";
import { TabType } from "../types";

interface MainContentProps {
  activeTab: string;
  setActiveTab: (tab: TabType) => void;
}

export const MainContent: React.FC<MainContentProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const { currentUser, isManagerOrAdmin } = useAuth();

  const { loans } = useLoans();
  // const { consultancies } = useConsultancies();

  // Get UI functions from context
  const {
    refreshKey,
    triggerRefresh,
    selectedLoanId,
    setSelectedLoanId,
    openLoanDetails,
    openNewLoanModal,
    openDocumentPreview,
  } = useUI();

  switch (activeTab) {
    case "dashboard":
      return isManagerOrAdmin ? (
        <Dashboard
          refresh={refreshKey}
          currentUser={currentUser!}
          onSelectLoan={setSelectedLoanId}
          onTabChange={setActiveTab}
          onOpenLoanDetails={openLoanDetails}
          onOpenNewLoanModal={openNewLoanModal}
        />
      ) : null;

    case "applications":
      return (
        <LoanApplications
          refresh={refreshKey}
          currentUser={currentUser!}
          onSelectLoan={setSelectedLoanId}
          onTabChange={setActiveTab}
          onOpenLoanDetails={openLoanDetails}
          onOpenNewLoanModal={openNewLoanModal}
        />
      );

    case "kyc":
      return (
        <KYCStudio
          initialLoanId={selectedLoanId}
          refresh={refreshKey}
          onRefresh={triggerRefresh}
          onOpenLoanDetails={openLoanDetails}
          openDocumentPreview={openDocumentPreview}
        />
      );

    case "payments":
      return (
        <PaymentStudio
          initialLoanId={selectedLoanId}
          onOpenLoanDetails={openLoanDetails}
          refresh={refreshKey}
          onRefresh={triggerRefresh}
        />
      );

    case "settlement":
      return (
        <EarlySettlementStudio
          initialLoanId={selectedLoanId}
          onOpenLoanDetails={openLoanDetails}
          refresh={refreshKey}
          onRefresh={triggerRefresh}
        />
      );

    case "customers":
      return (
        <CustomerDirectory
          refresh={refreshKey}
          onSelectLoan={openLoanDetails}
        />
      );

    case "users":
      return isManagerOrAdmin ? (
        <UserManagement 
        currentUser={currentUser!}
        refresh={refreshKey}
         />
      ) : null;

    case "reports":
      return isManagerOrAdmin ? (
        <ReportsStudio loans={loans} 
        // consultancies={consultancies} 
        />
      ) : null;

    default:
      return null;
  }
};
