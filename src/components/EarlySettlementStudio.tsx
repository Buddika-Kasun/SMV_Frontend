import React, { useState, useMemo } from 'react';
import { Loan, EarlySettlementQuote, PaymentRecord } from '../types';
import { calculateEarlySettlementQuote, formatCurrency } from '../utils/loanUtils';
import { Pagination } from './common/Pagination';
import { ConfirmModal } from './common/ConfirmModal';
import { 
  Zap, 
  CheckCircle, 
  Award, 
  ShieldCheck, 
  Sparkles,
  Printer,
  X,
  LayoutGrid,
  LayoutList,
  ChevronDown,
  ChevronUp,
  Search
} from 'lucide-react';

interface EarlySettlementStudioProps {
  loans: Loan[];
  initialSelectedLoan?: Loan | null;
  onExecuteEarlySettlement: (
    loanId: string,
    quote: EarlySettlementQuote,
    paymentMethod: PaymentRecord['paymentMethod'],
    referenceNumber: string,
    receivedBy: string,
    notes: string
  ) => void;
}

const PAGE_SIZE = 10;

/**
 * Early Settlement & Payoff Calculator Studio
 * Provides early payoff calculation, 10-row pagination, and confirmation warning modals before settling loans.
 */
export const EarlySettlementStudio: React.FC<EarlySettlementStudioProps> = ({
  loans,
  initialSelectedLoan,
  onExecuteEarlySettlement,
}) => {
  const activeLoans = loans.filter(l => l.status === 'Active' || l.status === 'Overdue');

  const [selectedLoanId, setSelectedLoanId] = useState<string>(
    initialSelectedLoan ? initialSelectedLoan.id : (activeLoans.length > 0 ? activeLoans[0].id : '')
  );

  const [showQueue, setShowQueue] = useState<boolean>(false);
  const [queueViewMode, setQueueViewMode] = useState<'list' | 'grid'>('list');
  const [queueSearch, setQueueSearch] = useState<string>('');
  const [queuePage, setQueuePage] = useState<number>(1);

  const currentLoan = loans.find(l => l.id === selectedLoanId);

  const [settlementDate, setSettlementDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentRecord['paymentMethod']>('Bank Transfer');
  const [referenceNumber, setReferenceNumber] = useState<string>(`STL-${Math.floor(100000 + Math.random() * 900000)}`);
  const [receivedBy, setReceivedBy] = useState<string>('Manager Officer Sterling');
  const [notes, setNotes] = useState<string>('Full early settlement requested by customer.');

  const [showClearanceCertificate, setShowClearanceCertificate] = useState<boolean>(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);

  const filteredActiveLoans = useMemo(() => {
    return activeLoans.filter(l => 
      l.customerName.toLowerCase().includes(queueSearch.toLowerCase()) ||
      l.id.toLowerCase().includes(queueSearch.toLowerCase()) ||
      l.kyc.nationalIdNumber.includes(queueSearch)
    );
  }, [activeLoans, queueSearch]);

  const paginatedActiveLoans = useMemo(() => {
    const start = (queuePage - 1) * PAGE_SIZE;
    return filteredActiveLoans.slice(start, start + PAGE_SIZE);
  }, [filteredActiveLoans, queuePage]);

  if (!currentLoan) {
    return (
      <div className="bg-white border border-slate-200/80 p-8 rounded-xl text-center text-slate-500 shadow-2xs">
        <Zap className="w-10 h-10 text-slate-400 mx-auto mb-2" />
        <p className="font-bold text-slate-800 text-sm">No Active Loans Eligible for Early Settlement</p>
        <p className="text-xs text-slate-500 mt-0.5">Select an active loan contract to generate an automated early settlement quote.</p>
      </div>
    );
  }

  // Calculate live quote based on current loan & date
  const quote: EarlySettlementQuote = calculateEarlySettlementQuote(currentLoan, settlementDate);
  const isAlreadySettled = currentLoan.status === 'Early Settled' || currentLoan.status === 'Settled';

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLoan || isAlreadySettled) return;
    setIsConfirmModalOpen(true);
  };

  const handleConfirmSettlement = () => {
    if (!currentLoan || isAlreadySettled) return;

    onExecuteEarlySettlement(
      currentLoan.id,
      quote,
      paymentMethod,
      referenceNumber,
      receivedBy,
      notes
    );

    setIsConfirmModalOpen(false);
    setShowClearanceCertificate(true);
  };

  return (
    <div className="space-y-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Zap className="w-4 h-4" />
            </div>
            Early Settlement & Payoff Calculator
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Accrued interest calculations, unearned interest rebates, payoff penalties, and loan clearance certification.
          </p>
        </div>

        {/* Loan Selector & Queue Toggle */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={() => setShowQueue(!showQueue)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition flex items-center gap-1.5 border border-slate-200/80 cursor-pointer"
          >
            <span>{showQueue ? 'Hide Queue' : 'Show Queue'}</span>
            {showQueue ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <select
            value={selectedLoanId}
            onChange={e => setSelectedLoanId(e.target.value)}
            className="bg-white text-slate-800 font-medium text-xs py-1.5 px-3 rounded-lg border border-slate-200/80 focus:outline-none focus:ring-1 focus:ring-slate-300"
          >
            {activeLoans.map(l => (
              <option key={l.id} value={l.id}>
                {l.customerName} ({l.id}) - {formatCurrency(l.outstandingBalance)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ELIGIBLE LOANS QUEUE (LIST VIEW / GRID VIEW) */}
      {showQueue && (
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs space-y-3">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Eligible Loan Contracts ({activeLoans.length})
              </h3>
              <span className="text-[10px] text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded">
                Click any row/card to generate early payoff quote
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

              {/* Search */}
              <div className="relative w-48">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter loan contract..."
                  value={queueSearch}
                  onChange={e => {
                    setQueueSearch(e.target.value);
                    setQueuePage(1);
                  }}
                  className="w-full bg-slate-50 text-slate-800 text-xs pl-7 pr-2.5 py-1 rounded-lg border border-slate-200/80 focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Render Eligible Accounts in List or Grid */}
          {queueViewMode === 'list' ? (
            <div className="overflow-x-auto max-h-56 overflow-y-auto rounded-lg border border-slate-200/80">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[10px]">
                    <th className="p-2.5 font-semibold">Loan ID</th>
                    <th className="p-2.5 font-semibold">Borrower Name</th>
                    <th className="p-2.5 font-semibold">NIC</th>
                    <th className="p-2.5 font-semibold text-right">Disbursed (LKR)</th>
                    <th className="p-2.5 font-semibold text-right">Outstanding Principal</th>
                    <th className="p-2.5 font-semibold text-center">Interest Method</th>
                    <th className="p-2.5 font-semibold text-center">Status</th>
                    <th className="p-2.5 font-semibold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedActiveLoans.map(l => {
                    const isSelected = l.id === selectedLoanId;

                    return (
                      <tr
                        key={l.id}
                        onClick={() => setSelectedLoanId(l.id)}
                        className={`cursor-pointer transition ${
                          isSelected ? 'bg-blue-50/80 font-medium' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="p-2.5 font-mono text-[11px] font-bold text-slate-900">{l.id}</td>
                        <td className="p-2.5 font-bold text-slate-900">{l.customerName}</td>
                        <td className="p-2.5 font-mono text-slate-600">{l.kyc.nationalIdNumber}</td>
                        <td className="p-2.5 text-right font-semibold text-slate-700">{formatCurrency(l.disbursedAmount)}</td>
                        <td className="p-2.5 text-right font-extrabold text-blue-900">{formatCurrency(l.outstandingBalance)}</td>
                        <td className="p-2.5 text-center text-slate-600 font-mono text-[11px]">{l.interestMethod}</td>
                        <td className="p-2.5 text-center">
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${
                            l.status === 'Overdue' ? 'bg-amber-50 text-amber-800 font-bold' : 'bg-emerald-50 text-emerald-800'
                          }`}>
                            {l.status}
                          </span>
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedLoanId(l.id); }}
                            className="text-[10px] text-blue-700 hover:underline font-bold cursor-pointer"
                          >
                            {isSelected ? 'Calculating' : 'Quote'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-56 overflow-y-auto p-1">
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
                      <h4 className="font-bold text-xs text-slate-900 truncate">{l.customerName}</h4>
                      <p className="text-[10px] text-slate-500 font-mono">NIC: {l.kyc.nationalIdNumber}</p>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                      <span className="text-slate-500">Unpaid:</span>
                      <span className="font-bold text-blue-900">{formatCurrency(l.outstandingBalance)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <Pagination
            currentPage={queuePage}
            totalItems={filteredActiveLoans.length}
            pageSize={PAGE_SIZE}
            onPageChange={setQueuePage}
            itemName="eligible loan contracts"
          />

        </div>
      )}

      {/* Main Grid: Calculator Breakdown + Execution Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Settlement Calculation Card (2 Cols Wide) */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs space-y-5">
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Settlement Quote</span>
              <h3 className="text-sm font-semibold text-slate-900">{currentLoan.customerName} ({currentLoan.id})</h3>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-medium mb-1">Settlement Date</span>
              <input
                type="date"
                value={settlementDate}
                onChange={e => setSettlementDate(e.target.value)}
                className="bg-white text-slate-800 text-xs py-1 px-2.5 rounded-lg border border-slate-200/80 focus:ring-1 focus:ring-slate-300 font-mono"
              />
            </div>
          </div>

          {/* Breakdown Items List */}
          <div className="space-y-2.5">
            
            {/* Item 1: Disbursed & Principal Paid */}
            <div className="bg-slate-50/60 p-3 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
              <div>
                <span className="font-medium text-slate-800 block">Original Disbursed Amount</span>
                <span className="text-[10px] text-slate-400">Initial loan principal</span>
              </div>
              <span className="font-semibold text-slate-900 text-xs">{formatCurrency(quote.originalPrincipal)}</span>
            </div>

            {/* Item 2: Outstanding Principal */}
            <div className="bg-slate-50/60 p-3 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
              <div>
                <span className="font-medium text-slate-800 block">Unpaid Principal Balance</span>
                <span className="text-[10px] text-slate-400">Remaining principal balance</span>
              </div>
              <span className="font-bold text-slate-900 text-xs">{formatCurrency(quote.outstandingPrincipalBalance)}</span>
            </div>

            {/* Item 3: Accrued Interest */}
            <div className="bg-slate-50/60 p-3 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
              <div>
                <span className="font-medium text-slate-800 block">Accrued Interest</span>
                <span className="text-[10px] text-slate-400">Interest earned to date</span>
              </div>
              <span className="font-medium text-slate-800 text-xs">+ {formatCurrency(quote.accruedInterestToDate)}</span>
            </div>

            {/* Item 4: Early Penalty Fee */}
            <div className="bg-slate-50/60 p-3 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
              <div>
                <span className="font-medium text-slate-800 block">Early Settlement Penalty ({quote.earlySettlementPenaltyPercent}%)</span>
                <span className="text-[10px] text-slate-400">Early payoff administrative fee</span>
              </div>
              <span className="font-medium text-slate-800 text-xs">+ {formatCurrency(quote.earlySettlementPenaltyFee)}</span>
            </div>

            {/* Item 5: WAIVED FUTURE INTEREST */}
            <div className="bg-emerald-50/60 p-3.5 rounded-lg border border-emerald-100 flex items-center justify-between text-xs">
              <div>
                <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Unearned Future Interest Waived</span>
                </div>
                <span className="text-[11px] text-emerald-700/80 mt-0.5 block">
                  Future interest is waived for early closure.
                </span>
              </div>
              <span className="font-bold text-emerald-700 text-sm">
                - {formatCurrency(quote.unearnedFutureInterestWaived)}
              </span>
            </div>

          </div>

          {/* Final Settlement Total Highlight Box */}
          <div className="bg-slate-900 text-white p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div>
              <span className="text-[10px] uppercase font-medium text-slate-400 tracking-wider block">FINAL PAYOFF AMOUNT</span>
              <p className="text-xs text-slate-300 mt-0.5">Total required to close loan contract in full today.</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold block tracking-tight">
                {formatCurrency(quote.totalSettlementAmount)}
              </span>
              <span className="text-xs text-emerald-400 font-medium block">
                Customer saves {formatCurrency(quote.totalSavingsForCustomer)}
              </span>
            </div>
          </div>

        </div>

        {/* Right Column: Execute Settlement Form & Confirmation */}
        <div className="space-y-6">
          
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs space-y-4">
            <h3 className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-slate-500" />
              Settlement Authorization
            </h3>

            {isAlreadySettled ? (
              <div className="bg-emerald-50 text-emerald-900 p-4 rounded-lg text-center text-xs font-medium space-y-2.5">
                <CheckCircle className="w-5 h-5 text-emerald-600 mx-auto" />
                <p>Loan contract is fully settled and closed.</p>
                <button
                  onClick={() => setShowClearanceCertificate(true)}
                  className="bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-emerald-800 transition cursor-pointer"
                >
                  Clearance Certificate
                </button>
              </div>
            ) : (
              <form onSubmit={handleOpenConfirm} className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] text-slate-600 font-medium block mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as PaymentRecord['paymentMethod'])}
                    className="w-full bg-white text-slate-800 text-xs py-2 px-3 rounded-lg border border-slate-200/80 focus:ring-1 focus:ring-slate-300"
                  >
                    <option value="Bank Transfer">Bank Transfer / wire</option>
                    <option value="Cash">Cash at Counter</option>
                    <option value="Debit/Credit Card">Debit/Credit Card</option>
                    <option value="Cheque">Manager's Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-600 font-medium block mb-1">Transaction Ref #</label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={e => setReferenceNumber(e.target.value)}
                    className="w-full bg-white text-slate-800 text-xs py-2 px-3 rounded-lg border border-slate-200/80 focus:ring-1 focus:ring-slate-300 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-600 font-medium block mb-1">Authorizing Officer</label>
                  <input
                    type="text"
                    value={receivedBy}
                    onChange={e => setReceivedBy(e.target.value)}
                    className="w-full bg-white text-slate-800 text-xs py-2 px-3 rounded-lg border border-slate-200/80 focus:ring-1 focus:ring-slate-300"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 px-3 rounded-lg text-xs transition shadow-2xs flex items-center justify-center gap-1.5 mt-2 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Execute Early Settlement</span>
                </button>
              </form>
            )}

          </div>

        </div>

      </div>

      {/* Confirmation Warning Modal */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmSettlement}
        title="Authorize Early Loan Payoff"
        description="Are you sure you want to execute early settlement for this contract? The entire outstanding balance will be marked as fully settled, all future interest will be waived, and an official clearance certificate will be issued."
        confirmLabel="Authorize Early Settlement"
        cancelLabel="Review Calculation"
        variant="warning"
        details={[
          { label: 'Borrower', value: currentLoan.customerName },
          { label: 'Loan ID', value: currentLoan.id },
          { label: 'Total Payoff Due', value: formatCurrency(quote.totalSettlementAmount) },
          { label: 'Waived Interest Savings', value: formatCurrency(quote.totalSavingsForCustomer) },
          { label: 'Settlement Date', value: settlementDate },
          { label: 'Payment Method', value: paymentMethod },
        ]}
      />

      {/* Early Settlement Clearance Certificate Modal */}
      {showClearanceCertificate && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200/80 rounded-2xl max-w-lg w-full overflow-hidden shadow-xl p-6 text-slate-800 space-y-4">
            
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900">
                <Award className="w-5 h-5 text-emerald-600" />
                <span className="font-semibold text-slate-900 text-base">Loan Clearance Certificate</span>
              </div>
              <button
                onClick={() => setShowClearanceCertificate(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-100 text-xs space-y-3">
              <div className="text-center pb-2 border-b border-slate-200/60">
                <span className="text-[10px] uppercase font-semibold text-emerald-700">STATUS: SETTLED</span>
                <h4 className="font-bold text-slate-900 text-sm mt-0.5">{currentLoan.customerName}</h4>
                <p className="text-slate-400 font-mono text-[10px]">Loan ID: {currentLoan.id}</p>
              </div>

              <div className="space-y-1.5 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Settlement Paid:</span>
                  <span className="font-medium text-slate-900">{formatCurrency(quote.totalSettlementAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Future Interest Saved:</span>
                  <span className="font-medium text-emerald-600">{formatCurrency(quote.totalSavingsForCustomer)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Remaining Balance:</span>
                  <span className="font-bold text-emerald-600">LKR 0.00 (PAID IN FULL)</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-800 rounded-lg text-xs font-medium transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Print Certificate</span>
              </button>

              <button
                onClick={() => setShowClearanceCertificate(false)}
                className="px-4 py-2 bg-slate-900 text-white font-medium rounded-lg text-xs hover:bg-slate-800 transition cursor-pointer"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
