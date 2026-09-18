import React from "react";
import { useUI } from "../../contexts/UIContext";
import { LoanDetailsModal } from "../LoanDetailsModal";
import { NewLoanModal } from "../NewLoanModal";
import { DocumentPreviewModal } from "../DocumentPreviewModal";

export const Modals: React.FC = () => {
  const {
    detailsLoanId,
    closeLoanDetails,
    isNewLoanModalOpen,
    closeNewLoanModal,
    openPaymentForLoan,
    openSettlementForLoan,
    triggerRefresh,
    // Document preview
    previewDocument,
    openDocumentPreview,
    closeDocumentPreview,
  } = useUI();

  return (
    <>
      {detailsLoanId && (
        <LoanDetailsModal
          loanId={detailsLoanId}
          onClose={closeLoanDetails}
          onOpenPaymentModal={openPaymentForLoan}
          onOpenSettlement={openSettlementForLoan}
          openDocumentPreview={openDocumentPreview}
        />
      )}

      {isNewLoanModalOpen && (
        <NewLoanModal onClose={closeNewLoanModal} onRefresh={triggerRefresh} />
      )}

      {previewDocument && (
        <DocumentPreviewModal
          document={previewDocument}
          onClose={closeDocumentPreview}
        />
      )}
    </>
  );
};
