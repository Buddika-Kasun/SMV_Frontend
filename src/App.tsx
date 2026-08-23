/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { Loan, TabType, PaymentRecord, EarlySettlementQuote, ConsultancyAgreement, ConsultancyReturnRecord, User } from './types';
import { INITIAL_LOANS } from './data/initialData';
import { INITIAL_CONSULTANCIES } from './data/initialConsultancies';
import { 
  applyPaymentToLoan, 
  executeEarlySettlement, 
  recalculateLoanState, 
  generateInstallmentSchedule 
} from './utils/loanUtils';
import { recalculateConsultancyStatus } from './utils/consultancyUtils';
import { userService } from './services/userService';
import { loanApi } from './api/loanApi';

import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { LoanApplications } from './components/LoanApplications';
import { KYCStudio } from './components/KYCStudio';
import { PaymentStudio } from './components/PaymentStudio';
import { EarlySettlementStudio } from './components/EarlySettlementStudio';
import { CustomerDirectory } from './components/CustomerDirectory';
import { UserManagement } from './components/UserManagement';
import { LoginScreen } from './components/LoginScreen';
// import { ConsultancyStudio } from './components/ConsultancyStudio';
import { ReportsStudio } from './components/ReportsStudio';
import { LoanDetailsModal } from './components/LoanDetailsModal';
import { NewLoanModal } from './components/NewLoanModal';
// import { SMSHistoryModal } from './components/SMSHistoryModal';
// import { smsService } from './services/smsService';

const STORAGE_KEY = 'instalend_finance_loans_v1';
const CONSULTANCY_STORAGE_KEY = 'instalend_finance_consultancies_v1';

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(() => userService.getCurrentUser());

  // Load initial state with localStorage support and live backend sync
  const [loans, setLoans] = useState<Loan[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(recalculateLoanState);
        }
      }
    } catch (err) {
      console.warn('Failed to parse saved loan data, using initial seed data.', err);
    }
    return INITIAL_LOANS;
  });

  // Fetch live loans and users from backend PostgreSQL on load
  useEffect(() => {
    async function syncBackendData() {
      try {
        const serverLoans = await loanApi.getAllLoans();
        if (serverLoans && serverLoans.length > 0) {
          setLoans(serverLoans.map(recalculateLoanState));
        }
      } catch (err) {
        console.warn('Backend sync failed on startup, using local store:', err);
      }
      try {
        await userService.fetchUsersFromBackend();
      } catch {
        // ignore
      }
    }
    syncBackendData();
  }, []);

  const [consultancies, setConsultancies] = useState<ConsultancyAgreement[]>(() => {
    try {
      const saved = localStorage.getItem(CONSULTANCY_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(recalculateConsultancyStatus);
        }
      }
    } catch (err) {
      console.warn('Failed to parse saved consultancy data, using initial seed data.', err);
    }
    return INITIAL_CONSULTANCIES;
  });

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const user = userService.getCurrentUser();
    return user && user.role === 'staff' ? 'applications' : 'dashboard';
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLoanForDetails, setSelectedLoanForDetails] = useState<Loan | null>(null);
  const [isNewLoanModalOpen, setIsNewLoanModalOpen] = useState<boolean>(false);
  const [isSMSModalOpen, setIsSMSModalOpen] = useState<boolean>(false);
  const [preselectedPaymentLoan, setPreselectedPaymentLoan] = useState<Loan | null>(null);

  // Handle Login
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'staff') {
      setActiveTab('applications');
    } else {
      setActiveTab('dashboard');
    }
    toast.success(`Welcome back, ${user.fullName}!`);
  };

  // Handle Logout
  const handleLogout = () => {
    userService.logout();
    setCurrentUser(null);
    toast.success('You have been logged out securely.');
  };

  // Enforce staff tab boundaries
  useEffect(() => {
    if (currentUser?.role === 'staff') {
      const managerOnlyTabs: TabType[] = ['dashboard', 'users', 'reports'];
      if (managerOnlyTabs.includes(activeTab)) {
        setActiveTab('applications');
      }
    }
  }, [currentUser, activeTab]);

  // Persist state to localStorage on update
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(loans));
    } catch (err) {
      console.error('Error saving loan state to localStorage', err);
    }
  }, [loans]);

  useEffect(() => {
    try {
      localStorage.setItem(CONSULTANCY_STORAGE_KEY, JSON.stringify(consultancies));
    } catch (err) {
      console.error('Error saving consultancy state to localStorage', err);
    }
  }, [consultancies]);

  // Counts for Badges
  const pendingApprovalsCount = loans.filter(l => l.status === 'Pending Approval').length;
  const pendingKycCount = loans.filter(l => l.status === 'KYC Pending').length;
  const overdueCount = loans.filter(l => l.status === 'Overdue').length;
  const activeConsultancyCount = consultancies.filter(c => c.status !== 'Returned & Closed').length;

  // Consultancy Handlers
  const handleOnboardConsultancy = (newAgreement: ConsultancyAgreement) => {
    setConsultancies(prev => [newAgreement, ...prev]);
    toast.success(`Consultancy agreement #${newAgreement.agreementNumber} onboarded successfully!`);
  };

  const handleReturnConsultancyFunds = (agreementId: string, returnRecord: ConsultancyReturnRecord) => {
    setConsultancies(prev =>
      prev.map(c => {
        if (c.id === agreementId) {
          return recalculateConsultancyStatus({
            ...c,
            status: 'Returned & Closed',
            returnRecord,
          });
        }
        return c;
      })
    );
    toast.success('Placement funds returned and agreement marked closed.');
  };

  // Handlers
  const handleApproveLoanRequest = async (loanId: string) => {
    setLoans(prev =>
      prev.map(l => {
        if (l.id === loanId) {
          return recalculateLoanState({
            ...l,
            status: 'KYC Pending',
            approvedDate: new Date().toISOString().split('T')[0],
          });
        }
        return l;
      })
    );
    toast.success(`Loan ${loanId} approved! Transferred to KYC verification.`);
    try {
      await loanApi.approveLoan(loanId);
    } catch (e) {
      console.warn('Backend approval dispatch sync error:', e);
    }
  };

  const handleRejectLoanRequest = async (loanId: string) => {
    setLoans(prev =>
      prev.map(l => (l.id === loanId ? { ...l, status: 'Rejected' as const } : l))
    );
    toast.error(`Loan application ${loanId} has been rejected.`);
    try {
      await loanApi.rejectLoan(loanId);
    } catch (e) {
      console.warn('Backend rejection sync error:', e);
    }
  };

  const handleUpdateKYC = async (loanId: string, updatedKYC: Loan['kyc']) => {
    setLoans(prev =>
      prev.map(l => {
        if (l.id === loanId) {
          return {
            ...l,
            kyc: updatedKYC,
          };
        }
        return l;
      })
    );
    toast.success(`KYC & document compliance updated for ${loanId}`);
    try {
      await loanApi.updateKYC(loanId, updatedKYC);
    } catch (e) {
      console.warn('Backend KYC sync error:', e);
    }
  };

  const handleDisburseLoan = async (loanId: string) => {
    const today = new Date().toISOString().split('T')[0];
    setLoans(prev =>
      prev.map(l => {
        if (l.id === loanId) {
          const schedule = generateInstallmentSchedule(
            l.requestedAmount,
            l.interestRatePerAnnum,
            l.termMonths,
            l.repaymentFrequency,
            l.interestMethod,
            today
          );

          const activeLoan: Loan = {
            ...l,
            status: 'Active',
            disbursedDate: today,
            disbursedAmount: l.requestedAmount,
            installments: schedule,
            kyc: {
              ...l.kyc,
              isVerified: true,
              verifiedBy: currentUser?.fullName || 'Branch Manager',
              verifiedAt: new Date().toLocaleString(),
            },
          };

          return recalculateLoanState(activeLoan);
        }
        return l;
      })
    );
    toast.success(`Loan ${loanId} disbursed! Active repayment ledger initialized.`);
    try {
      await loanApi.disburseLoan(loanId, today);
    } catch (e) {
      console.warn('Backend disbursement sync error:', e);
    }
  };

  const handleRecordPayment = (
    loanId: string,
    amount: number,
    method: PaymentRecord['paymentMethod'],
    referenceNumber: string,
    receivedBy: string,
    notes: string,
    paymentDate: string
  ): PaymentRecord | null => {
    let createdRecord: PaymentRecord | null = null;

    setLoans(prev =>
      prev.map(l => {
        if (l.id === loanId) {
          const updatedLoan = applyPaymentToLoan(
            l,
            amount,
            method,
            referenceNumber,
            receivedBy,
            notes,
            paymentDate
          );
          createdRecord = updatedLoan.payments[0];
          return updatedLoan;
        }
        return l;
      })
    );

    toast.success(`Payment voucher generated for ${loanId}!`);

    // Async backend persistence
    if (createdRecord) {
      loanApi.recordPayment(loanId, createdRecord).catch(e => console.warn('Backend payment record sync error:', e));
    }

    return createdRecord;
  };

  const handleExecuteEarlySettlement = async (
    loanId: string,
    quote: EarlySettlementQuote,
    paymentMethod: PaymentRecord['paymentMethod'],
    referenceNumber: string,
    receivedBy: string,
    notes: string
  ) => {
    setLoans(prev =>
      prev.map(l => {
        if (l.id === loanId) {
          return executeEarlySettlement(
            l,
            quote,
            paymentMethod,
            referenceNumber,
            receivedBy,
            notes
          );
        }
        return l;
      })
    );

    toast.success(`Early payoff executed for ${loanId}. Clearance certificate generated.`);

    try {
      await loanApi.executeEarlySettlement({
        loanId,
        quote,
        paymentMethod,
        referenceNumber,
        receivedBy,
        notes,
      });
    } catch (e) {
      console.warn('Backend early settlement sync error:', e);
    }
  };

  const handleCreateNewLoan = async (newLoan: Loan) => {
    setLoans(prev => [newLoan, ...prev]);
    setActiveTab('applications');
    toast.success(`New loan application #${newLoan.id} created successfully!`);

    try {
      await loanApi.createLoan(newLoan);
    } catch (e) {
      console.warn('Backend create loan sync error:', e);
    }
  };

  const handleResetData = () => {
    if (window.confirm('Reset system data to initial sample loans and consultancy agreements?')) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(CONSULTANCY_STORAGE_KEY);
      setLoans(INITIAL_LOANS);
      setConsultancies(INITIAL_CONSULTANCIES);
      toast.success('System reset: Seed sample records restored.');
    }
  };

  const handleOpenPaymentForLoan = (loan: Loan) => {
    setPreselectedPaymentLoan(loan);
    setActiveTab('payments');
  };

  const handleOpenSettlementForLoan = (loan: Loan) => {
    setPreselectedPaymentLoan(loan);
    setActiveTab('settlement');
  };

  // If unauthenticated, show Login Screen
  if (!currentUser) {
    return (
      <>
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
        <Toaster position="top-right" />
      </>
    );
  }

  const isManagerOrAdmin = currentUser.role === 'admin' || currentUser.role === 'manager';

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-slate-50/50 text-slate-800 font-sans antialiased">
      
      {/* High Density Sidebar Navigation with Role Filtering */}
      <Navigation
        activeTab={activeTab}
        onTabChange={tab => setActiveTab(tab)}
        pendingApprovalsCount={pendingApprovalsCount}
        pendingKycCount={pendingKycCount}
        overdueCount={overdueCount}
        activeConsultancyCount={activeConsultancyCount}
        currentUser={currentUser}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto min-w-0">
        
        {/* Crisp Top Header with User Profile & Logout */}
        <Header
          loans={loans}
          onSearch={q => setSearchQuery(q)}
          onOpenNewLoanModal={() => setIsNewLoanModalOpen(true)}
          onResetData={handleResetData}
          onSelectLoan={loan => setSelectedLoanForDetails(loan)}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        {/* View Component Canvas */}
        <main className="p-4 sm:p-6 space-y-6 flex-1 w-full max-w-7xl mx-auto">
          
          {/* Micro Finance Dashboard - Only accessible by Managers and Admin */}
          {activeTab === 'dashboard' && isManagerOrAdmin && (
            <Dashboard
              loans={loans}
              onTabChange={setActiveTab}
              onSelectLoan={setSelectedLoanForDetails}
              onOpenNewLoanModal={() => setIsNewLoanModalOpen(true)}
              onOpenPaymentModal={handleOpenPaymentForLoan}
              onOpenSettlement={handleOpenSettlementForLoan}
            />
          )}

          {/* 
          Consultancy Studio - Commented out for now as requested
          {activeTab === 'consultancy' && (
            <ConsultancyStudio
              agreements={consultancies}
              onOnboardAgreement={handleOnboardConsultancy}
              onReturnFunds={handleReturnConsultancyFunds}
            />
          )} 
          */}

          {/* Loan Applications & Approvals */}
          {activeTab === 'applications' && (
            <LoanApplications
              loans={loans}
              onApproveLoanRequest={handleApproveLoanRequest}
              onRejectLoanRequest={handleRejectLoanRequest}
              onSelectLoan={setSelectedLoanForDetails}
              onOpenNewLoanModal={() => setIsNewLoanModalOpen(true)}
              onTabChange={setActiveTab}
              onOpenPaymentModal={handleOpenPaymentForLoan}
              onOpenSettlement={handleOpenSettlementForLoan}
              currentUser={currentUser}
            />
          )}

          {/* KYC Repository */}
          {activeTab === 'kyc' && (
            <KYCStudio
              loans={loans}
              onUpdateKYC={handleUpdateKYC}
              onDisburseLoan={handleDisburseLoan}
            />
          )}

          {/* Payments Studio */}
          {activeTab === 'payments' && (
            <PaymentStudio
              loans={loans}
              initialSelectedLoan={preselectedPaymentLoan}
              onRecordPayment={handleRecordPayment}
            />
          )}

          {/* Early Settlement Studio */}
          {activeTab === 'settlement' && (
            <EarlySettlementStudio
              loans={loans}
              initialSelectedLoan={preselectedPaymentLoan}
              onExecuteEarlySettlement={handleExecuteEarlySettlement}
            />
          )}

          {/* Customer Directory */}
          {activeTab === 'customers' && (
            <CustomerDirectory
              loans={loans}
              onSelectLoan={setSelectedLoanForDetails}
            />
          )}

          {/* User Management Studio - Accessible by Managers and Admin */}
          {activeTab === 'users' && isManagerOrAdmin && (
            <UserManagement currentUser={currentUser} />
          )}

          {/* Essential Reports Studio - Accessible by Managers and Admin */}
          {activeTab === 'reports' && isManagerOrAdmin && (
            <ReportsStudio
              loans={loans}
              consultancies={consultancies}
            />
          )}

        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200/60 bg-white py-3 text-center text-[11px] text-slate-400 px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
            <span>SMV Holdings (Pvt) Ltd • Micro Finance Enterprise</span>
            <span>Signed in as <strong className="text-slate-600">{currentUser.fullName}</strong> ({currentUser.role})</span>
          </div>
        </footer>

      </div>

      {/* Loan Details Modal */}
      {selectedLoanForDetails && (
        <LoanDetailsModal
          loan={selectedLoanForDetails}
          onClose={() => setSelectedLoanForDetails(null)}
          onOpenPaymentModal={handleOpenPaymentForLoan}
          onOpenSettlement={handleOpenSettlementForLoan}
        />
      )}

      {/* New Loan Application Modal */}
      {isNewLoanModalOpen && (
        <NewLoanModal
          onClose={() => setIsNewLoanModalOpen(false)}
          onCreateLoan={handleCreateNewLoan}
        />
      )}

      {/* Global Notification Toaster */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#ffffff',
            color: '#0f172a',
            fontSize: '13px',
            fontWeight: 500,
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
            padding: '10px 14px',
          },
          success: {
            iconTheme: {
              primary: '#059669',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#e11d48',
              secondary: '#ffffff',
            },
          },
        }}
      />

    </div>
  );
}
