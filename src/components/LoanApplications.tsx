import React, { useState, useMemo } from 'react';
import { Loan, LoanStatus, TabType, User } from '../types';
import { formatCurrency } from '../utils/loanUtils';
import { useResizableColumns, ColumnConfig } from '../hooks/useResizableColumns';
import { ResizableTh, ResizableTableContainer } from './common/ResizableTable';
import { Pagination } from './common/Pagination';
import { ConfirmModal } from './common/ConfirmModal';
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
  ArrowRight
} from 'lucide-react';

interface LoanApplicationsProps {
  loans: Loan[];
  onApproveLoanRequest: (loanId: string) => void;
  onRejectLoanRequest: (loanId: string) => void;
  onSelectLoan: (loan: Loan) => void;
  onOpenNewLoanModal: () => void;
  onTabChange: (tab: TabType) => void;
  onOpenPaymentModal: (loan: Loan) => void;
  onOpenSettlement: (loan: Loan) => void;
  currentUser: User;
}

const LOAN_COLUMNS: ColumnConfig[] = [
  { id: 'id', defaultWidth: 150, minWidth: 110 },
  { id: 'customer', defaultWidth: 230, minWidth: 150 },
  { id: 'product', defaultWidth: 180, minWidth: 130 },
  { id: 'principal', defaultWidth: 140, minWidth: 110 },
  { id: 'outstanding', defaultWidth: 150, minWidth: 120 },
  { id: 'term', defaultWidth: 120, minWidth: 90 },
  { id: 'creditScore', defaultWidth: 130, minWidth: 100 },
  { id: 'status', defaultWidth: 140, minWidth: 110 },
  { id: 'actions', defaultWidth: 170, minWidth: 120 },
];

const PAGE_SIZE = 10;

/**
 * Loan Applications & Approvals Component
 * Includes max-10 rows pagination and confirmation modals for approvals and rejections.
 */
export const LoanApplications: React.FC<LoanApplicationsProps> = ({
  loans,
  onApproveLoanRequest,
  onRejectLoanRequest,
  onSelectLoan,
  onOpenNewLoanModal,
  onTabChange,
  onOpenPaymentModal,
  onOpenSettlement,
  currentUser,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Confirmation Modals State
  const [loanToApprove, setLoanToApprove] = useState<Loan | null>(null);
  const [loanToReject, setLoanToReject] = useState<Loan | null>(null);

  const canApprove = currentUser.role === 'admin' || currentUser.role === 'manager';

  const {
    columnWidths,
    startResize,
    resetToDefault,
    handleDoubleClickReset,
    resizingColId,
    totalTableWidth,
  } = useResizableColumns(LOAN_COLUMNS, 'loan_applications');

  const statuses: string[] = ['All', 'Pending Approval', 'KYC Pending', 'Active', 'Overdue', 'Settled', 'Early Settled'];

  const filteredLoans = useMemo(() => {
    return loans.filter(l => {
      const matchesStatus = filterStatus === 'All' || l.status === filterStatus;
      const matchesSearch = 
        l.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.kyc.nationalIdNumber.includes(searchQuery) ||
        (l.accountNumber && l.accountNumber.includes(searchQuery));
      return matchesStatus && matchesSearch;
    });
  }, [loans, filterStatus, searchQuery]);

  // Paginated records (strict 10 rows maximum per page)
  const paginatedLoans = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredLoans.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredLoans, currentPage]);

  const handleStatusFilterChange = (status: string) => {
    setFilterStatus(status);
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleConfirmApproval = () => {
    if (loanToApprove) {
      onApproveLoanRequest(loanToApprove.id);
      setLoanToApprove(null);
    }
  };

  const handleConfirmRejection = () => {
    if (loanToReject) {
      onRejectLoanRequest(loanToReject.id);
      setLoanToReject(null);
    }
  };

  return (
    <div className="space-y-4">
      
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
            Review loan requests, evaluate creditworthiness, approve applications, and manage active repayment terms.
          </p>
        </div>

        <div className="flex items-center gap-3 self-stretch sm:self-auto">
          {/* List vs Grid Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200/80 shrink-0">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="List View"
            >
              <LayoutList className="w-4 h-4" />
              <span className="hidden md:inline text-xs">List View</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Grid View"
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
        
        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none">
          {statuses.map(st => (
            <button
              key={st}
              onClick={() => handleStatusFilterChange(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                filterStatus === st
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-blue-50/80 hover:text-blue-700 border border-slate-200/80'
              }`}
            >
              {st}
              <span className="ml-1 opacity-80">
                ({st === 'All' ? loans.length : loans.filter(l => l.status === st).length})
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
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

      {/* RENDER LIST VIEW OR GRID VIEW */}
      {filteredLoans.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200/80 text-slate-500 shadow-2xs">
          <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
          <p className="font-semibold text-slate-700 text-xs">No matching loan applications found.</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Try selecting a different status filter or clear your search term.</p>
        </div>
      ) : viewMode === 'list' ? (
        /* LIST VIEW TABLE GRID */
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <ResizableTableContainer
            maxHeight="max-h-[560px]"
            totalTableWidth={totalTableWidth}
            onResetColumns={resetToDefault}
            title="Loan Applications & Approvals"
            itemCount={filteredLoans.length}
          >
            <table className="w-full text-left border-collapse text-xs table-fixed">
              <colgroup>
                <col style={{ width: columnWidths['id'] }} />
                <col style={{ width: columnWidths['customer'] }} />
                <col style={{ width: columnWidths['product'] }} />
                <col style={{ width: columnWidths['principal'] }} />
                <col style={{ width: columnWidths['outstanding'] }} />
                <col style={{ width: columnWidths['term'] }} />
                <col style={{ width: columnWidths['creditScore'] }} />
                <col style={{ width: columnWidths['status'] }} />
                <col style={{ width: columnWidths['actions'] }} />
              </colgroup>
              <thead className="sticky top-0 z-10">
                <tr>
                  <ResizableTh
                    columnId="id"
                    width={columnWidths['id']}
                    onResizeStart={startResize}
                    onDoubleClickReset={handleDoubleClickReset}
                    isResizingActive={resizingColId === 'id'}
                  >
                    Application & ID
                  </ResizableTh>
                  <ResizableTh
                    columnId="customer"
                    width={columnWidths['customer']}
                    onResizeStart={startResize}
                    onDoubleClickReset={handleDoubleClickReset}
                    isResizingActive={resizingColId === 'customer'}
                  >
                    Applicant Name & NIC
                  </ResizableTh>
                  <ResizableTh
                    columnId="product"
                    width={columnWidths['product']}
                    onResizeStart={startResize}
                    onDoubleClickReset={handleDoubleClickReset}
                    isResizingActive={resizingColId === 'product'}
                  >
                    Loan Product
                  </ResizableTh>
                  <ResizableTh
                    columnId="principal"
                    width={columnWidths['principal']}
                    onResizeStart={startResize}
                    onDoubleClickReset={handleDoubleClickReset}
                    isResizingActive={resizingColId === 'principal'}
                    align="right"
                  >
                    Principal (LKR)
                  </ResizableTh>
                  <ResizableTh
                    columnId="outstanding"
                    width={columnWidths['outstanding']}
                    onResizeStart={startResize}
                    onDoubleClickReset={handleDoubleClickReset}
                    isResizingActive={resizingColId === 'outstanding'}
                    align="right"
                  >
                    Outstanding (LKR)
                  </ResizableTh>
                  <ResizableTh
                    columnId="term"
                    width={columnWidths['term']}
                    onResizeStart={startResize}
                    onDoubleClickReset={handleDoubleClickReset}
                    isResizingActive={resizingColId === 'term'}
                    align="center"
                  >
                    Term / Rate
                  </ResizableTh>
                  <ResizableTh
                    columnId="creditScore"
                    width={columnWidths['creditScore']}
                    onResizeStart={startResize}
                    onDoubleClickReset={handleDoubleClickReset}
                    isResizingActive={resizingColId === 'creditScore'}
                    align="center"
                  >
                    Credit Score
                  </ResizableTh>
                  <ResizableTh
                    columnId="status"
                    width={columnWidths['status']}
                    onResizeStart={startResize}
                    onDoubleClickReset={handleDoubleClickReset}
                    isResizingActive={resizingColId === 'status'}
                    align="center"
                  >
                    Status
                  </ResizableTh>
                  <ResizableTh
                    columnId="actions"
                    width={columnWidths['actions']}
                    onResizeStart={startResize}
                    onDoubleClickReset={handleDoubleClickReset}
                    isResizingActive={resizingColId === 'actions'}
                    align="right"
                  >
                    Actions
                  </ResizableTh>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {paginatedLoans.map(loan => {
                  const isPendingApproval = loan.status === 'Pending Approval';
                  const isKycPending = loan.status === 'KYC Pending';
                  const isActive = loan.status === 'Active';
                  const isOverdue = loan.status === 'Overdue';

                  return (
                    <tr key={loan.id} className="hover:bg-slate-50/80 transition group border-b border-slate-100/80">
                      {/* Application ID & Account */}
                      <td className="p-3.5 font-mono text-[11px] overflow-hidden">
                        <span className="font-bold text-slate-900 group-hover:text-blue-600 transition block truncate">
                          {loan.id}
                        </span>
                        <span className="text-slate-400 text-[10px] truncate block">
                          {loan.accountNumber || 'Acc Pending'}
                        </span>
                      </td>

                      {/* Customer Name & NIC */}
                      <td className="p-3.5 overflow-hidden">
                        <span className="font-bold text-slate-900 block text-xs truncate">
                          {loan.customerName}
                        </span>
                        <span className="text-slate-500 font-mono text-[10px] truncate block">
                          {loan.kyc.nationalIdNumber} • {loan.customerPhone}
                        </span>
                      </td>

                      {/* Loan Product */}
                      <td className="p-3.5 overflow-hidden">
                        <span className="font-medium text-slate-800 block text-xs truncate">
                          {loan.loanType}
                        </span>
                        <span className="text-slate-400 text-[10px] truncate block">
                          {loan.purpose}
                        </span>
                      </td>

                      {/* Principal Amount */}
                      <td className="p-3.5 text-right font-bold text-slate-900 overflow-hidden truncate">
                        {formatCurrency(loan.disbursedAmount || loan.requestedAmount)}
                      </td>

                      {/* Outstanding */}
                      <td className="p-3.5 text-right font-extrabold text-blue-900 overflow-hidden truncate">
                        {formatCurrency(loan.outstandingBalance)}
                      </td>

                      {/* Term & Rate */}
                      <td className="p-3.5 text-center overflow-hidden">
                        <span className="font-medium text-slate-800 block text-[11px] truncate">
                          {loan.termMonths} Mo.
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono block truncate">
                          {loan.interestRatePerAnnum}% p.a.
                        </span>
                      </td>

                      {/* Credit Score */}
                      <td className="p-3.5 text-center overflow-hidden">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold inline-block truncate ${
                          loan.creditScore >= 720 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60' :
                          loan.creditScore >= 650 ? 'bg-blue-50 text-blue-800 border border-blue-200/60' :
                          'bg-amber-50 text-amber-800 border border-amber-200/60'
                        }`}>
                          {loan.creditScore} / 850
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-3.5 text-center overflow-hidden">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium inline-block truncate ${
                          loan.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' :
                          loan.status === 'Overdue' ? 'bg-amber-50 text-amber-700 border border-amber-200/60 font-bold' :
                          loan.status === 'KYC Pending' ? 'bg-purple-50 text-purple-700 border border-purple-200/60' :
                          loan.status === 'Pending Approval' ? 'bg-blue-50 text-blue-700 border border-blue-200/60' :
                          loan.status === 'Early Settled' ? 'bg-purple-50 text-purple-700 border border-purple-200/60' :
                          'bg-slate-100 text-slate-600 border border-slate-200/60'
                        }`}>
                          {loan.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right overflow-hidden">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectLoan(loan)}
                            className="p-1.5 text-slate-600 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 rounded-lg transition shrink-0 cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {isPendingApproval && (
                            canApprove ? (
                              <>
                                <button
                                  onClick={() => setLoanToReject(loan)}
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
                              <span 
                                className="flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200/80 px-2 py-0.5 rounded-md text-[10px] font-medium shrink-0"
                                title="Only Branch Managers or Administrators have rights to authorize loan disbursements"
                              >
                                <Lock className="w-3 h-3 text-amber-600" />
                                <span>Mgr. Approval</span>
                              </span>
                            )
                          )}

                          {isKycPending && (
                            <button
                              onClick={() => onTabChange('kyc')}
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
                                onClick={() => onOpenPaymentModal(loan)}
                                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-medium transition shadow-2xs shrink-0 cursor-pointer"
                              >
                                Pay
                              </button>
                              <button
                                onClick={() => onOpenSettlement(loan)}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition shrink-0 cursor-pointer"
                              >
                                Settle
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </ResizableTableContainer>

          {/* Table Pagination Controls */}
          <Pagination
            currentPage={currentPage}
            totalItems={filteredLoans.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
            itemName="applications"
          />
        </div>
      ) : (
        /* GRID VIEW (CARDS) */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedLoans.map(loan => {
              const isPendingApproval = loan.status === 'Pending Approval';
              const isKycPending = loan.status === 'KYC Pending';
              const isActive = loan.status === 'Active';
              const isOverdue = loan.status === 'Overdue';

              return (
                <div
                  key={loan.id}
                  className={`bg-white border border-slate-200/80 hover:border-blue-300 rounded-xl p-4 shadow-2xs flex flex-col justify-between transition group ${
                    isPendingApproval ? 'border-t-4 border-t-blue-600' :
                    isKycPending ? 'border-t-4 border-t-purple-500' :
                    isActive ? 'border-t-4 border-t-emerald-500' :
                    isOverdue ? 'border-t-4 border-t-amber-500' :
                    'border-t-4 border-t-slate-400'
                  }`}
                >
                  <div>
                    {/* Header info */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <span className="text-[10px] text-blue-600 font-semibold font-mono">
                          {loan.loanType}
                        </span>
                        <h3 className="font-semibold text-slate-900 text-sm mt-0.5 group-hover:text-blue-700 transition">
                          {loan.customerName}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {loan.id} • {loan.kyc.nationalIdNumber}
                        </p>
                      </div>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium ${
                        loan.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' :
                        loan.status === 'Overdue' ? 'bg-amber-50 text-amber-700 border border-amber-200/60' :
                        loan.status === 'KYC Pending' ? 'bg-purple-50 text-purple-700 border border-purple-200/60' :
                        loan.status === 'Pending Approval' ? 'bg-blue-50 text-blue-700 border border-blue-200/60' :
                        'bg-slate-100 text-slate-600 border border-slate-200/60'
                      }`}>
                        {loan.status}
                      </span>
                    </div>

                    {/* Amount & Key Metrics */}
                    <div className="bg-slate-50/60 p-3 rounded-lg border border-slate-100 my-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Amount:</span>
                        <span className="font-bold text-slate-900 text-xs">{formatCurrency(loan.requestedAmount)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Interest:</span>
                        <span className="text-slate-800 font-medium">{loan.interestRatePerAnnum}% ({loan.interestMethod})</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Term:</span>
                        <span className="text-slate-800 font-medium">{loan.termMonths} Months</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-200/60">
                        <span>Purpose:</span>
                        <span className="text-slate-700 truncate max-w-[150px]">{loan.purpose}</span>
                      </div>
                    </div>

                    {/* Credit Score Indicator */}
                    <div className="flex items-center justify-between text-xs px-0.5 text-slate-500 mb-3">
                      <span>Credit Score:</span>
                      <span className={`font-semibold text-xs px-2 py-0.5 rounded-full ${
                        loan.creditScore >= 720 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60' :
                        loan.creditScore >= 650 ? 'bg-blue-50 text-blue-800 border border-blue-200/60' :
                        'bg-amber-50 text-amber-800 border border-amber-200/60'
                      }`}>
                        {loan.creditScore} / 850
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    
                    <button
                      onClick={() => onSelectLoan(loan)}
                      className="px-2.5 py-1.5 text-slate-600 hover:text-blue-700 bg-slate-100/80 hover:bg-blue-50 rounded-lg transition text-xs font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>

                    {isPendingApproval && (
                      canApprove ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setLoanToReject(loan)}
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
                        <span 
                          className="flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200/80 px-2 py-1 rounded-md text-[10px] font-medium"
                          title="Only Branch Managers or Administrators have rights to authorize loan disbursements"
                        >
                          <Lock className="w-3 h-3 text-amber-600" />
                          <span>Awaiting Mgr.</span>
                        </span>
                      )
                    )}

                    {isKycPending && (
                      <button
                        onClick={() => onTabChange('kyc')}
                        className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-1.5 rounded-lg text-xs transition shadow-xs cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Process KYC</span>
                      </button>
                    )}

                    {(isActive || isOverdue) && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onOpenPaymentModal(loan)}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition shadow-2xs cursor-pointer"
                        >
                          Pay
                        </button>
                        <button
                          onClick={() => onOpenSettlement(loan)}
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

          {/* Grid View Pagination */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <Pagination
              currentPage={currentPage}
              totalItems={filteredLoans.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
              itemName="applications"
            />
          </div>
        </div>
      )}

      {/* Confirmation Modal for Approving a Loan Application */}
      <ConfirmModal
        isOpen={Boolean(loanToApprove)}
        onClose={() => setLoanToApprove(null)}
        onConfirm={handleConfirmApproval}
        title="Approve Loan Application"
        description="Are you sure you want to approve this loan application? Once approved, the application will be transferred to the KYC and Document Compliance stage."
        confirmLabel="Authorize & Approve"
        cancelLabel="Cancel"
        variant="success"
        details={loanToApprove ? [
          { label: 'Application ID', value: loanToApprove.id },
          { label: 'Borrower Name', value: loanToApprove.customerName },
          { label: 'Principal Amount', value: formatCurrency(loanToApprove.requestedAmount) },
          { label: 'Loan Term & Rate', value: `${loanToApprove.termMonths} Mo. @ ${loanToApprove.interestRatePerAnnum}% p.a.` },
        ] : []}
      />

      {/* Confirmation Modal for Rejecting a Loan Application */}
      <ConfirmModal
        isOpen={Boolean(loanToReject)}
        onClose={() => setLoanToReject(null)}
        onConfirm={handleConfirmRejection}
        title="Reject Loan Application"
        description="Are you sure you want to reject this loan application? The status will be marked as Rejected in the system."
        confirmLabel="Confirm Rejection"
        cancelLabel="Keep Application"
        variant="danger"
        details={loanToReject ? [
          { label: 'Application ID', value: loanToReject.id },
          { label: 'Applicant Name', value: loanToReject.customerName },
          { label: 'Requested Amount', value: formatCurrency(loanToReject.requestedAmount) },
          { label: 'National ID (NIC)', value: loanToReject.kyc.nationalIdNumber },
        ] : []}
      />

    </div>
  );
};
