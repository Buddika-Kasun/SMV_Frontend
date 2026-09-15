import React from "react";
import { useUI } from "../../contexts/UIContext";
import { LoanDetailsModal } from "../LoanDetailsModal";
import { NewLoanModal } from "../NewLoanModal";

export const Modals: React.FC = () => {
  const {
    detailsLoanId,
    closeLoanDetails,
    isNewLoanModalOpen,
    closeNewLoanModal,
    openPaymentForLoan,
    openSettlementForLoan,
    triggerRefresh,
  } = useUI();

  return (
    <>
      {detailsLoanId && (
        <LoanDetailsModal
          loanId={detailsLoanId}
          onClose={closeLoanDetails}
          onOpenPaymentModal={openPaymentForLoan}
          onOpenSettlement={openSettlementForLoan}
        />
      )}

      {isNewLoanModalOpen && (
        <NewLoanModal onClose={closeNewLoanModal} onRefresh={triggerRefresh} />
      )}
    </>
  );
};
