import React, { useState, useMemo } from 'react';
// import { Loan, PaymentRecord } from '../types';
import { formatCurrency } from '../../utils/consultancyUtils';
import { useResizableColumns, ColumnConfig } from '../../hooks/useResizableColumns';
import { ResizableTh, ResizableTableContainer } from '../common/ResizableTable';
import { PaymentReceiptModal } from '../PaymentReceiptModal';
import { Pagination } from '../common/Pagination';
import { ConfirmModal } from '../common/ConfirmModal';
import { 
  CreditCard, 
  Banknote, 
  History, 
  Receipt,
  LayoutGrid,
  LayoutList,
  ChevronDown,
  ChevronUp,
  Search
} from 'lucide-react';
import { Loan, PaymentRecord } from '../../api';

interface PaymentStudioProps {
  loans: Loan[];
  initialSelectedLoan?: Loan | null;
  onRecordPayment: (
    loanId: string,
    amount: number,
    method: PaymentRecord['paymentMethod'],
    referenceNumber: string,
    receivedBy: string,
    notes: string,
    paymentDate: string
  ) => PaymentRecord | null;
}

const PAYMENT_QUEUE_COLUMNS: ColumnConfig[] = [
  { id: 'loanId', defaultWidth: 120, minWidth: 90 },
  { id: 'borrower', defaultWidth: 180, minWidth: 130 },
  { id: 'nic', defaultWidth: 140, minWidth: 100 },
  { id: 'disbursed', defaultWidth: 140, minWidth: 100 },
  { id: 'outstanding', defaultWidth: 150, minWidth: 110 },
  { id: 'nextDue', defaultWidth: 140, minWidth: 100 },
  { id: 'status', defaultWidth: 110, minWidth: 85 },
  { id: 'action', defaultWidth: 100, minWidth: 75 },
];

const PAGE_SIZE = 10;

/**
 * Payment Processing & Repayments Studio
 * Supports max-10 rows pagination and warning/confirmation modals for payment execution.
 */
export const PaymentStudio: React.FC<PaymentStudioProps> = ({
  loans,
  initialSelectedLoan,
  onRecordPayment,
}) => {
  const activeAndOverdue = loans.filter(l => l.status === 'Active' || l.status === 'Overdue');
  
  const [selectedLoanId, setSelectedLoanId] = useState<string>(
    initialSelectedLoan ? initialSelectedLoan.id : (activeAndOverdue.length > 0 ? activeAndOverdue[0].id : '')
  );

  const [showQueue, setShowQueue] = useState<boolean>(false);
  const [queueViewMode, setQueueViewMode] = useState<'list' | 'grid'>('list');
  const [queueSearch, setQueueSearch] = useState<string>('');
  const [queuePage, setQueuePage] = useState<number>(1);
  const [paymentsPage, setPaymentsPage] = useState<number>(1);

  // Payment Confirmation Modal State
  const [isConfirmPaymentOpen, setIsConfirmPaymentOpen] = useState<boolean>(false);

  const {
    columnWidths,
    startResize,
    resetToDefault,
    handleDoubleClickReset,
    resizingColId,
    totalTableWidth,
  } = useResizableColumns(PAYMENT_QUEUE_COLUMNS, 'payment_queue');

  const currentLoan = loans.find(l => l.id === selectedLoanId);

  // Form State
  const nextAmountToPay = currentLoan?.nextDueAmount || currentLoan?.installments.find(i => i.status !== 'Paid')?.remainingAmount || 0;

  const [paymentAmount, setPaymentAmount] = useState<number>(nextAmountToPay);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentRecord['paymentMethod']>('Cash');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [receivedBy, setReceivedBy] = useState<string>('Cashier James Sterling');
  const [notes, setNotes] = useState<string>('');

  const [lastPaymentRecord, setLastPaymentRecord] = useState<PaymentRecord | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);

  // Sync payment amount default when selected loan changes
  React.useEffect(() => {
    if (currentLoan) {
      const due = currentLoan.nextDueAmount || currentLoan.installments.find(i => i.status !== 'Paid')?.remainingAmount || 0;
      setPaymentAmount(due);
      setReferenceNumber(`REF-${Math.floor(100000 + Math.random() * 900000)}`);
      setPaymentsPage(1);
    }
  }, [selectedLoanId, currentLoan]);

  const filteredActiveLoans = useMemo(() => {
    return activeAndOverdue.filter(l => 
      l.customer?.fullName.toLowerCase().includes(queueSearch.toLowerCase()) ||
      l.id.toLowerCase().includes(queueSearch.toLowerCase()) ||
      l.customer?.idNumber.includes(queueSearch)
    );
  }, [activeAndOverdue, queueSearch]);

  const paginatedActiveLoans = useMemo(() => {
    const start = (queuePage - 1) * PAGE_SIZE;
    return filteredActiveLoans.slice(start, start + PAGE_SIZE);
  }, [filteredActiveLoans, queuePage]);

  // Paginated loan payments for history card
  const loanPayments = currentLoan?.payments || [];
  const paginatedLoanPayments = useMemo(() => {
    const start = (paymentsPage - 1) * PAGE_SIZE;
    return loanPayments.slice(start, start + PAGE_SIZE);
  }, [loanPayments, paymentsPage]);

  if (!currentLoan) {
    return (
      <div className="bg-white border border-slate-200/80 p-8 rounded-xl text-center text-slate-500 shadow-2xs">
        <CreditCard className="w-10 h-10 text-slate-400 mx-auto mb-2" />
        <p className="font-bold text-slate-800 text-sm">No Active Loans Found</p>
        <p className="text-xs text-slate-500 mt-0.5">Disburse an approved loan to begin recording payments and adjusting balances.</p>
      </div>
    );
  }

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLoan || paymentAmount <= 0) return;
    setIsConfirmPaymentOpen(true);
  };

  const handleExecutePayment = () => {
    if (!currentLoan || paymentAmount <= 0) return;

    const record = onRecordPayment(
      currentLoan.id,
      paymentAmount,
      paymentMethod,
      referenceNumber,
      receivedBy,
      notes,
      paymentDate
    );

    setIsConfirmPaymentOpen(false);

    if (record) {
      setLastPaymentRecord(record);
      setShowReceiptModal(true);
    }
  };

  const nextUnpaidInstallment = currentLoan.installments.find(i => i.status !== 'Paid');
  const projectedBalance = Math.max(0, currentLoan.outstandingBalance - paymentAmount);

  return (
    <div className="space-y-4">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <CreditCard className="w-4 h-4" />
            </div>
            Payment Collection & Repayment Studio
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Collect scheduled installment payments, handle manual overpayments, and issue official receipts.
          </p>
        </div>

        {/* Selected Loan Selector and Queue Toggle */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={() => setShowQueue(!showQueue)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition flex items-center gap-1.5 border border-slate-200/80 cursor-pointer"
          >
            <span>{showQueue ? 'Hide Active Loans' : 'Show Active Loans'}</span>
            {showQueue ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <select
            value={selectedLoanId}
            onChange={e => setSelectedLoanId(e.target.value)}
            className="bg-white text-slate-800 font-medium text-xs py-1.5 px-3 rounded-lg border border-slate-200/80 focus:outline-none focus:ring-1 focus:ring-slate-300"
          >
            {activeAndOverdue.map(l => (
              <option key={l.id} value={l.id}>
                {l.customer?.fullName} ({l.id}) - Bal: {formatCurrency(l.outstandingBalance)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ACTIVE LOANS QUEUE BROWSER */}
      {showQueue && (
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs space-y-3">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Active Loan Accounts ({activeAndOverdue.length})
              </h3>
              <span className="text-[10px] text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded">
                Click any row/card to select loan
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* List vs Grid Switcher */}
              <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200/80">
                <button
                  onClick={() => setQueueViewMode('list')}
                  className={`p-1 rounded text-xs font-medium flex items-center gap-1 transition cursor-pointer ${
                    queueViewMode === 'list' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600'
                  }`}
                  title="List View"
                >
                  <LayoutList className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">List</span>
                </button>
                <button
                  onClick={() => setQueueViewMode('grid')}
                  className={`p-1 rounded text-xs font-medium flex items-center gap-1 transition cursor-pointer ${
                    queueViewMode === 'grid' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">Grid</span>
                </button>
              </div>

              {/* Search in active loans */}
              <div className="relative w-full sm:w-48">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search borrower..."
                  value={queueSearch}
                  onChange={e => {
                    setQueueSearch(e.target.value);
                    setQueuePage(1);
                  }}
                  className="w-full bg-slate-50 text-slate-800 text-xs pl-8 pr-3 py-1 rounded-lg border border-slate-200/80 focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Queue View rendering */}
          {queueViewMode === 'list' ? (
            <div className="overflow-hidden">
              <ResizableTableContainer
                maxHeight="max-h-72"
                totalTableWidth={totalTableWidth}
                onResetColumns={resetToDefault}
                title="Active Loans Queue"
                itemCount={filteredActiveLoans.length}
              >
                <table className="w-full text-left border-collapse text-xs table-fixed">
                  <colgroup>
                    <col style={{ width: columnWidths['loanId'] }} />
                    <col style={{ width: columnWidths['borrower'] }} />
                    <col style={{ width: columnWidths['nic'] }} />
                    <col style={{ width: columnWidths['disbursed'] }} />
                    <col style={{ width: columnWidths['outstanding'] }} />
                    <col style={{ width: columnWidths['nextDue'] }} />
                    <col style={{ width: columnWidths['status'] }} />
                    <col style={{ width: columnWidths['action'] }} />
                  </colgroup>
                  <thead className="sticky top-0 z-10">
                    <tr>
                      <ResizableTh
                        columnId="loanId"
                        width={columnWidths['loanId']}
                        onResizeStart={startResize}
                        onDoubleClickReset={handleDoubleClickReset}
                        isResizingActive={resizingColId === 'loanId'}
                      >
                        Loan ID
                      </ResizableTh>
                      <ResizableTh
                        columnId="borrower"
                        width={columnWidths['borrower']}
                        onResizeStart={startResize}
                        onDoubleClickReset={handleDoubleClickReset}
                        isResizingActive={resizingColId === 'borrower'}
                      >
                        Borrower
                      </ResizableTh>
                      <ResizableTh
                        columnId="nic"
                        width={columnWidths['nic']}
                        onResizeStart={startResize}
                        onDoubleClickReset={handleDoubleClickReset}
                        isResizingActive={resizingColId === 'nic'}
                      >
                        NIC
                      </ResizableTh>
                      <ResizableTh
                        columnId="disbursed"
                        width={columnWidths['disbursed']}
                        onResizeStart={startResize}
                        onDoubleClickReset={handleDoubleClickReset}
                        isResizingActive={resizingColId === 'disbursed'}
                        align="right"
                      >
                        Disbursed
                      </ResizableTh>
                      <ResizableTh
                        columnId="outstanding"
                        width={columnWidths['outstanding']}
                        onResizeStart={startResize}
                        onDoubleClickReset={handleDoubleClickReset}
                        isResizingActive={resizingColId === 'outstanding'}
                        align="right"
                      >
                        Balance
                      </ResizableTh>
                      <ResizableTh
                        columnId="nextDue"
                        width={columnWidths['nextDue']}
                        onResizeStart={startResize}
                        onDoubleClickReset={handleDoubleClickReset}
                        isResizingActive={resizingColId === 'nextDue'}
                        align="right"
                      >
                        Next Due
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
                        columnId="action"
                        width={columnWidths['action']}
                        onResizeStart={startResize}
                        onDoubleClickReset={handleDoubleClickReset}
                        isResizingActive={resizingColId === 'action'}
                        align="center"
                      >
                        Select
                      </ResizableTh>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {paginatedActiveLoans.map(l => {
                      const isSelected = l.id === selectedLoanId;
                      const nextInstallment = l.installments.find(i => i.status !== 'Paid');

                      return (
                        <tr
                          key={l.id}
                          onClick={() => setSelectedLoanId(l.id)}
                          className={`cursor-pointer transition ${
                            isSelected ? 'bg-blue-50/70 font-semibold' : 'hover:bg-slate-50/80'
                          }`}
                        >
                          <td className="p-2.5 font-mono text-[11px] text-slate-900 overflow-hidden truncate">
                            {l.id}
                          </td>
                          <td className="p-2.5 font-medium text-slate-900 overflow-hidden truncate">
                            {l.customer?.fullName}
                          </td>
                          <td className="p-2.5 font-mono text-slate-600 overflow-hidden truncate">
                            {l.customer?.idNumber}
                          </td>
                          <td className="p-2.5 text-right font-semibold text-slate-700 overflow-hidden truncate">
                            {formatCurrency(l.account?.disbursedAmount!)}
                          </td>
                          <td className="p-2.5 text-right font-extrabold text-blue-900 overflow-hidden truncate">
                            {formatCurrency(l.outstandingBalance)}
                          </td>
                          <td className="p-2.5 text-right font-bold text-emerald-800 overflow-hidden truncate">
                            {formatCurrency(nextInstallment?.remainingAmount || l.nextDueAmount || 0)}
                          </td>
                          <td className="p-2.5 text-center overflow-hidden">
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium inline-block truncate ${
                              l.status === 'Overdue' ? 'bg-amber-50 text-amber-800 font-bold' : 'bg-emerald-50 text-emerald-800'
                            }`}>
                              {l.status}
                            </span>
                          </td>
                          <td className="p-2.5 text-center overflow-hidden">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setSelectedLoanId(l.id); }}
                              className="text-[10px] text-blue-700 hover:underline font-bold cursor-pointer"
                            >
                              {isSelected ? 'Selected' : 'Collect'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </ResizableTableContainer>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-1">
              {paginatedActiveLoans.map(l => {
                const isSelected = l.id === selectedLoanId;

                return (
                  <div
                    key={l.id}
                    onClick={() => setSelectedLoanId(l.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition shadow-2xs flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20'
                        : 'border-slate-200/80 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono font-bold text-slate-900">{l.id}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                          l.status === 'Overdue' ? 'bg-amber-50 text-amber-800 font-bold' : 'bg-emerald-50 text-emerald-800'
                        }`}>
                          {l.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-slate-900 truncate">{l.customer?.fullName}</h4>
                      <p className="text-[10px] text-slate-500 font-mono">NIC: {l.customer?.idNumber}</p>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                      <span className="text-slate-500">Balance:</span>
                      <span className="font-bold text-blue-900">{formatCurrency(l.outstandingBalance)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Active Loans Pagination */}
          <Pagination
            currentPage={queuePage}
            totalItems={filteredActiveLoans.length}
            pageSize={PAGE_SIZE}
            onPageChange={setQueuePage}
            itemName="active accounts"
          />

        </div>
      )}

      {/* Main Grid: Payment Form + Loan Summary Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Payment Entry Form (2 Cols Wide) */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs space-y-5">
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Payment Processing</span>
              <h3 className="text-sm font-semibold text-slate-900">Record Installment Payment</h3>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Customer</span>
              <span className="font-semibold text-slate-900 text-xs">{currentLoan.customer?.fullName}</span>
            </div>
          </div>

          <form onSubmit={handleOpenConfirm} className="space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              
              {/* Payment Amount */}
              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Payment Amount (LKR)
                </label>
                <div className="relative">
                  <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max={currentLoan.outstandingBalance + 50000}
                    value={paymentAmount}
                    onChange={e => setPaymentAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white text-slate-900 font-bold text-sm pl-8 pr-3 py-2 rounded-lg border border-slate-200/80 focus:ring-1 focus:ring-slate-300"
                    required
                  />
                </div>
                {nextUnpaidInstallment && (
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                    <span>Next Installment:</span>
                    <button
                      type="button"
                      onClick={() => setPaymentAmount(nextUnpaidInstallment.remainingAmount)}
                      className="text-slate-900 font-medium underline cursor-pointer"
                    >
                      Set {formatCurrency(nextUnpaidInstallment.remainingAmount)}
                    </button>
                  </div>
                )}
              </div>

              {/* Payment Date */}
              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={e => setPaymentDate(e.target.value)}
                  className="w-full bg-white text-slate-800 text-xs px-3 py-2 rounded-lg border border-slate-200/80 focus:ring-1 focus:ring-slate-300"
                  required
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as PaymentRecord['paymentMethod'])}
                  className="w-full bg-white text-slate-800 text-xs px-3 py-2 rounded-lg border border-slate-200/80 focus:ring-1 focus:ring-slate-300"
                >
                  <option value="Cash">Cash (Branch Counter)</option>
                  <option value="Bank_Transfer">Bank Transfer / Online EFT</option>
                  <option value="Debit_Credit_Card">Debit / Credit Card</option>
                  <option value="Direct_Debit">Direct Debit Auto Pay</option>
                  <option value="Cheque">Cheque Deposit</option>
                </select>
              </div>

              {/* Reference Number */}
              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Reference #
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={e => setReferenceNumber(e.target.value)}
                  placeholder="e.g. TRF-889012"
                  className="w-full bg-white text-slate-800 text-xs px-3 py-2 rounded-lg border border-slate-200/80 focus:ring-1 focus:ring-slate-300 font-mono"
                  required
                />
              </div>

              {/* Cashier Name */}
              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Received By
                </label>
                <input
                  type="text"
                  value={receivedBy}
                  onChange={e => setReceivedBy(e.target.value)}
                  className="w-full bg-white text-slate-800 text-xs px-3 py-2 rounded-lg border border-slate-200/80 focus:ring-1 focus:ring-slate-300"
                  required
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Regular installment"
                  className="w-full bg-white text-slate-800 text-xs px-3 py-2 rounded-lg border border-slate-200/80 focus:ring-1 focus:ring-slate-300"
                />
              </div>

            </div>

            {/* Live Impact Preview Card */}
            <div className="bg-slate-50/60 p-3.5 rounded-lg border border-slate-100 space-y-1.5">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                Balance Impact Preview
              </span>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Current Outstanding:</span>
                <span className="font-medium text-slate-800">{formatCurrency(currentLoan.outstandingBalance)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Applying Payment:</span>
                <span className="font-semibold text-emerald-600">- {formatCurrency(paymentAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200/60">
                <span className="text-slate-900 font-semibold">New Balance:</span>
                <span className="font-bold text-slate-900 text-xs">
                  {formatCurrency(projectedBalance)}
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium px-4 py-2 rounded-lg transition shadow-2xs text-xs cursor-pointer"
              >
                <Receipt className="w-4 h-4" />
                <span>Process Payment & Issue Receipt</span>
              </button>
            </div>

          </form>

        </div>

        {/* Right Column: Loan Repayment Summary & Payment History */}
        <div className="space-y-6">
          
          {/* Customer Balance Card */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-semibold text-slate-900 text-xs">Account Balance</span>
              <span className="text-[10px] font-mono text-slate-400">{currentLoan.id}</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Disbursed:</span>
                <span className="font-medium text-slate-800">{formatCurrency(currentLoan.account?.disbursedAmount!)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Collected:</span>
                <span className="font-medium text-emerald-600">{formatCurrency(currentLoan.totalPaidAmount)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-100 text-xs font-semibold">
                <span className="text-slate-900">Remaining Balance:</span>
                <span className="text-slate-900 font-bold">{formatCurrency(currentLoan.outstandingBalance)}</span>
              </div>
            </div>
          </div>

          {/* Payment History Log with Pagination */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs space-y-3">
            <h3 className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-slate-500" />
              Recent Payments ({loanPayments.length})
            </h3>

            <div className="space-y-2">
              {paginatedLoanPayments.map(p => (
                <div
                  key={p.id}
                  className="bg-slate-50/60 p-2.5 rounded-lg border border-slate-100 text-[11px] space-y-0.5"
                >
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-900">{formatCurrency(p.amount)}</span>
                    <span className="text-slate-400 font-normal">{p.paymentDate}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>{p.paymentMethod} • {p.referenceNumber}</span>
                    <span>By: {p.receivedBy}</span>
                  </div>
                </div>
              ))}

              {loanPayments.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">No payments recorded yet.</p>
              )}
            </div>

            {loanPayments.length > PAGE_SIZE && (
              <Pagination
                currentPage={paymentsPage}
                totalItems={loanPayments.length}
                pageSize={PAGE_SIZE}
                onPageChange={setPaymentsPage}
                itemName="payment records"
              />
            )}
          </div>

        </div>

      </div>

      {/* Payment Processing Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmPaymentOpen}
        onClose={() => setIsConfirmPaymentOpen(false)}
        onConfirm={handleExecutePayment}
        title="Confirm Payment Collection"
        description="Are you sure you want to post this payment to the borrower ledger? This will instantly adjust the outstanding balance and allocate funds to installments."
        confirmLabel="Confirm & Post Payment"
        cancelLabel="Review Again"
        variant="info"
        details={[
          { label: 'Borrower', value: currentLoan.customer?.fullName },
          { label: 'Payment Amount', value: formatCurrency(paymentAmount) },
          { label: 'Payment Method', value: paymentMethod },
          { label: 'Reference Number', value: referenceNumber },
          { label: 'New Outstanding Balance', value: formatCurrency(projectedBalance) },
        ]}
      />

      {/* Receipt Modal Triggered after payment */}
      {showReceiptModal && lastPaymentRecord && (
        <PaymentReceiptModal
          loan={currentLoan}
          payment={lastPaymentRecord}
          onClose={() => setShowReceiptModal(false)}
        />
      )}

    </div>
  );
};
