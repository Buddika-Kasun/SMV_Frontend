import React, { useState } from 'react';
import { 
  Building2, Users, PlusCircle, Search, Calendar, FileText, 
  ArrowDownLeft, Clock, CheckCircle2, ChevronRight, Eye, AlertTriangle,
  LayoutGrid, LayoutList
} from 'lucide-react';
import { ConsultancyAgreement, ConsultancyReturnRecord } from '../types';
import { formatCurrency, getDaysRemaining } from '../utils/consultancyUtils';
import { useResizableColumns, ColumnConfig } from '../hooks/useResizableColumns';
import { ResizableTh, ResizableTableContainer } from './common/ResizableTable';
import { Pagination } from './common/Pagination';
import { OnboardConsultancyModal } from './OnboardConsultancyModal';
import { ReturnFundsModal } from './ReturnFundsModal';
import { ConsultancyDetailsModal } from './ConsultancyDetailsModal';

interface ConsultancyStudioProps {
  agreements: ConsultancyAgreement[];
  onOnboardAgreement: (agreement: ConsultancyAgreement) => void;
  onReturnFunds: (agreementId: string, returnRecord: ConsultancyReturnRecord) => void;
}

const CONSULTANCY_COLUMNS: ColumnConfig[] = [
  { id: 'id', defaultWidth: 150, minWidth: 110 },
  { id: 'client', defaultWidth: 220, minWidth: 150 },
  { id: 'bank', defaultWidth: 190, minWidth: 140 },
  { id: 'capital', defaultWidth: 160, minWidth: 120 },
  { id: 'balance', defaultWidth: 150, minWidth: 110 },
  { id: 'maturity', defaultWidth: 140, minWidth: 100 },
  { id: 'countdown', defaultWidth: 110, minWidth: 90 },
  { id: 'status', defaultWidth: 140, minWidth: 110 },
  { id: 'actions', defaultWidth: 150, minWidth: 110 },
];

const PAGE_SIZE = 10;

export const ConsultancyStudio: React.FC<ConsultancyStudioProps> = ({
  agreements,
  onOnboardAgreement,
  onReturnFunds,
}) => {
  const [filterTab, setFilterTab] = useState<'All' | 'Active Placed' | 'Maturing Soon' | 'Maturity Reached' | 'Returned & Closed'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [currentPage, setCurrentPage] = useState<number>(1);

  const {
    columnWidths,
    startResize,
    resetToDefault,
    handleDoubleClickReset,
    resizingColId,
    totalTableWidth,
  } = useResizableColumns(CONSULTANCY_COLUMNS, 'consultancy_studio');

  // Modals state
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
  const [selectedForDetails, setSelectedForDetails] = useState<ConsultancyAgreement | null>(null);
  const [selectedForReturn, setSelectedForReturn] = useState<ConsultancyAgreement | null>(null);

  // Financial KPIs
  const totalPlacedCapital = agreements
    .filter(a => a.status !== 'Returned & Closed')
    .reduce((sum, a) => sum + a.placedAmount, 0);

  const activeAgreementsCount = agreements.filter(a => a.status !== 'Returned & Closed').length;

  const totalReturnedCapital = agreements
    .filter(a => a.status === 'Returned & Closed')
    .reduce((sum, a) => sum + (a.returnRecord?.returnedAmount || a.placedAmount), 0);

  const maturingSoonCapital = agreements
    .filter(a => a.status === 'Maturing Soon' || a.status === 'Maturity Reached')
    .reduce((sum, a) => sum + a.placedAmount, 0);

  // Search and Filter Logic
  const filteredAgreements = agreements.filter(a => {
    if (filterTab !== 'All' && a.status !== filterTab) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        a.customerName.toLowerCase().includes(q) ||
        a.nationalIdNumber.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q) ||
        a.agreementNumber.toLowerCase().includes(q) ||
        a.bankName.toLowerCase().includes(q) ||
        a.accountNumber.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const paginatedAgreements = filteredAgreements.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="space-y-4">
      
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Consultancy Management (6-Month Placement)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Onboard clients for 6-month capital deposits, verify passbook statements, and manage maturity schedules.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-stretch sm:self-auto">
          {/* List vs Grid Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200/80 shrink-0">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition ${
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
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition ${
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
            onClick={() => setIsOnboardModalOpen(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs transition shadow-xs flex items-center gap-1.5 shrink-0"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Onboard Client</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-medium">Active Placed Capital</span>
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <p className="text-xl font-extrabold text-blue-900">{formatCurrency(totalPlacedCapital)}</p>
          <p className="text-[10px] text-slate-400">In customer accounts (6 mo.)</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-medium">Active Onboardings</span>
            <Users className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <p className="text-xl font-extrabold text-slate-900">{activeAgreementsCount} Clients</p>
          <p className="text-[10px] text-slate-400">Active 6-month contracts</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-medium">Maturing / Due Return</span>
            <Clock className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <p className="text-xl font-extrabold text-amber-900">{formatCurrency(maturingSoonCapital)}</p>
          <p className="text-[10px] text-slate-400">Due within 30 days</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-medium">Total Capital Returned</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <p className="text-xl font-extrabold text-emerald-800">{formatCurrency(totalReturnedCapital)}</p>
          <p className="text-[10px] text-slate-400">Settled back to business</p>
        </div>

      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
        
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
          {(['All', 'Active Placed', 'Maturing Soon', 'Maturity Reached', 'Returned & Closed'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => {
                setFilterTab(tab);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                filterTab === tab
                  ? 'bg-blue-600 text-white font-medium shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab}
              <span className="ml-1 opacity-80">
                ({tab === 'All' ? agreements.length : agreements.filter(a => a.status === tab).length})
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, NIC, bank, ID..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-50 text-slate-800 text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
        </div>

      </div>

      {/* RENDER LIST VIEW OR GRID VIEW */}
      {filteredAgreements.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No Consultancy Agreements Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery 
              ? 'No client matched your search criteria.' 
              : 'Start onboarding clients for 6-month capital deposit agreements.'}
          </p>
          <button
            onClick={() => setIsOnboardModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-xs transition inline-flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Onboard New Client Now</span>
          </button>
        </div>
      ) : viewMode === 'list' ? (
        /* LIST VIEW TABLE GRID */
        <div className="space-y-3">
          <ResizableTableContainer
          maxHeight="max-h-[560px]"
          totalTableWidth={totalTableWidth}
          onResetColumns={resetToDefault}
          title="Consultancy Agreements Ledger"
          itemCount={filteredAgreements.length}
        >
          <table className="w-full text-left border-collapse text-xs table-fixed">
            <colgroup>
              <col style={{ width: columnWidths['id'] }} />
              <col style={{ width: columnWidths['client'] }} />
              <col style={{ width: columnWidths['bank'] }} />
              <col style={{ width: columnWidths['capital'] }} />
              <col style={{ width: columnWidths['balance'] }} />
              <col style={{ width: columnWidths['maturity'] }} />
              <col style={{ width: columnWidths['countdown'] }} />
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
                  Agreement & ID
                </ResizableTh>
                <ResizableTh
                  columnId="client"
                  width={columnWidths['client']}
                  onResizeStart={startResize}
                  onDoubleClickReset={handleDoubleClickReset}
                  isResizingActive={resizingColId === 'client'}
                >
                  Client Name & NIC
                </ResizableTh>
                <ResizableTh
                  columnId="bank"
                  width={columnWidths['bank']}
                  onResizeStart={startResize}
                  onDoubleClickReset={handleDoubleClickReset}
                  isResizingActive={resizingColId === 'bank'}
                >
                  Bank & Account
                </ResizableTh>
                <ResizableTh
                  columnId="capital"
                  width={columnWidths['capital']}
                  onResizeStart={startResize}
                  onDoubleClickReset={handleDoubleClickReset}
                  isResizingActive={resizingColId === 'capital'}
                  align="right"
                >
                  Placed Capital (LKR)
                </ResizableTh>
                <ResizableTh
                  columnId="balance"
                  width={columnWidths['balance']}
                  onResizeStart={startResize}
                  onDoubleClickReset={handleDoubleClickReset}
                  isResizingActive={resizingColId === 'balance'}
                  align="right"
                >
                  Passbook Balance
                </ResizableTh>
                <ResizableTh
                  columnId="maturity"
                  width={columnWidths['maturity']}
                  onResizeStart={startResize}
                  onDoubleClickReset={handleDoubleClickReset}
                  isResizingActive={resizingColId === 'maturity'}
                >
                  6-Mo Maturity
                </ResizableTh>
                <ResizableTh
                  columnId="countdown"
                  width={columnWidths['countdown']}
                  onResizeStart={startResize}
                  onDoubleClickReset={handleDoubleClickReset}
                  isResizingActive={resizingColId === 'countdown'}
                  align="center"
                >
                  Countdown
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
              {paginatedAgreements.map(agreement => {
                const daysLeft = getDaysRemaining(agreement.maturityDate);

                return (
                  <tr key={agreement.id} className="hover:bg-slate-50/80 transition group border-b border-slate-100/80">
                    {/* Agreement ID */}
                    <td className="p-3.5 font-mono text-[11px] overflow-hidden">
                      <span className="font-bold text-slate-900 group-hover:text-blue-600 transition block truncate">
                        {agreement.id}
                      </span>
                      <span className="text-slate-400 text-[10px] truncate block">
                        {agreement.agreementNumber}
                      </span>
                    </td>

                    {/* Client Name & NIC */}
                    <td className="p-3.5 overflow-hidden">
                      <span className="font-bold text-slate-900 block text-xs truncate">
                        {agreement.customerName}
                      </span>
                      <span className="text-slate-500 font-mono text-[10px] truncate block">
                        NIC: {agreement.nationalIdNumber} • {agreement.customerPhone}
                      </span>
                    </td>

                    {/* Bank & Account */}
                    <td className="p-3.5 overflow-hidden">
                      <span className="font-medium text-slate-800 block text-[11px] truncate">
                        {agreement.bankName}
                      </span>
                      <span className="text-slate-400 font-mono text-[10px] truncate block">
                        Acc: {agreement.accountNumber} ({agreement.branchName})
                      </span>
                    </td>

                    {/* Placed Capital */}
                    <td className="p-3.5 text-right font-extrabold text-blue-900 overflow-hidden truncate">
                      {formatCurrency(agreement.placedAmount)}
                    </td>

                    {/* Passbook Last Balance */}
                    <td className="p-3.5 text-right font-bold text-emerald-800 overflow-hidden truncate">
                      {formatCurrency(agreement.lastStatementBalance)}
                    </td>

                    {/* Maturity Date */}
                    <td className="p-3.5 font-mono text-[11px] text-slate-700 overflow-hidden truncate">
                      <span className="block font-semibold truncate">{agreement.maturityDate}</span>
                      <span className="text-[10px] text-slate-400 truncate block">Started {agreement.startDate}</span>
                    </td>

                    {/* Countdown */}
                    <td className="p-3.5 text-center overflow-hidden">
                      {agreement.status === 'Returned & Closed' ? (
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[10px] inline-block truncate">
                          Settled
                        </span>
                      ) : daysLeft > 0 ? (
                        <span className={`font-bold text-[10px] px-2 py-0.5 rounded inline-block truncate ${
                          daysLeft <= 30 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {daysLeft}d left
                        </span>
                      ) : (
                        <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded text-[10px] inline-flex items-center gap-1 truncate">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          Due
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="p-3.5 text-center overflow-hidden">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium whitespace-nowrap inline-block truncate ${
                        agreement.status === 'Returned & Closed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' :
                        agreement.status === 'Maturing Soon' ? 'bg-amber-50 text-amber-700 border border-amber-200/60' :
                        agreement.status === 'Maturity Reached' ? 'bg-rose-50 text-rose-700 border border-rose-200/60' :
                        'bg-blue-50 text-blue-700 border border-blue-200/60'
                      }`}>
                        {agreement.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right overflow-hidden">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedForDetails(agreement)}
                          className="p-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-lg text-xs font-medium transition shrink-0"
                          title="View Agreement & Passbook"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {agreement.status !== 'Returned & Closed' ? (
                          <button
                            onClick={() => setSelectedForReturn(agreement)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-medium transition shadow-2xs flex items-center gap-1 shrink-0"
                            title="Process Capital Return"
                          >
                            <ArrowDownLeft className="w-3 h-3" />
                            <span>Return</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 shrink-0">
                            Closed
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </ResizableTableContainer>
        <Pagination
          currentPage={currentPage}
          totalItems={filteredAgreements.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
          itemName="consultancy agreements"
        />
      </div>
      ) : (
        /* GRID VIEW (CARDS) */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedAgreements.map(agreement => {
              const daysLeft = getDaysRemaining(agreement.maturityDate);

            return (
              <div
                key={agreement.id}
                className="bg-white border border-slate-200/80 hover:border-blue-300 rounded-xl p-4 shadow-2xs hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">{agreement.customerName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {agreement.id} • NIC: {agreement.nationalIdNumber}
                      </span>
                    </div>

                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium whitespace-nowrap ${
                      agreement.status === 'Returned & Closed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' :
                      agreement.status === 'Maturing Soon' ? 'bg-amber-50 text-amber-700 border border-amber-200/60' :
                      agreement.status === 'Maturity Reached' ? 'bg-rose-50 text-rose-700 border border-rose-200/60' :
                      'bg-blue-50 text-blue-700 border border-blue-200/60'
                    }`}>
                      {agreement.status}
                    </span>
                  </div>

                  {/* Bank & Passbook Box */}
                  <div className="bg-blue-50/40 p-3 rounded-lg border border-blue-100/80 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">{agreement.bankName}</span>
                      <span className="font-mono text-slate-700 font-semibold">{agreement.accountNumber}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-blue-100/60">
                      <div>
                        <span className="text-[9px] text-slate-500 block uppercase font-medium">Passbook Last Balance</span>
                        <span className="text-xs font-bold text-emerald-800">
                          {formatCurrency(agreement.lastStatementBalance)}
                        </span>
                      </div>

                      <button
                        onClick={() => setSelectedForDetails(agreement)}
                        className="text-[10px] text-blue-700 hover:text-blue-900 bg-white hover:bg-blue-50 px-2 py-1 rounded border border-blue-200 transition font-medium flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3" />
                        <span>View Passbook</span>
                      </button>
                    </div>
                  </div>

                  {/* Placement Capital & Timeline */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                      <span className="text-slate-500 block text-[10px] font-medium">Placed Capital (6 Mo.)</span>
                      <span className="font-extrabold text-blue-900">{formatCurrency(agreement.placedAmount)}</span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                      <span className="text-slate-500 block text-[10px] font-medium">6-Month Maturity</span>
                      <span className="font-bold text-slate-800 font-mono text-[11px] block">{agreement.maturityDate}</span>
                    </div>
                  </div>

                  {/* Countdown Badge */}
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <div className="flex items-center gap-1 text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Timeline:</span>
                    </div>
                    
                    {agreement.status === 'Returned & Closed' ? (
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[10px]">
                        Returned on {agreement.returnRecord?.returnDate}
                      </span>
                    ) : daysLeft > 0 ? (
                      <span className={`font-bold text-[10px] px-2 py-0.5 rounded ${
                        daysLeft <= 30 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {daysLeft} Days Remaining
                      </span>
                    ) : (
                      <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded text-[10px] flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Return Due Now
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedForDetails(agreement)}
                    className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium transition border border-slate-200/80 flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Details</span>
                  </button>

                  {agreement.status !== 'Returned & Closed' ? (
                    <button
                      onClick={() => setSelectedForReturn(agreement)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition shadow-2xs flex items-center gap-1"
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                      <span>Return Funds</span>
                    </button>
                  ) : (
                    <span className="text-[10px] text-emerald-700 font-medium bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Closed & Settled
                    </span>
                  )}
                </div>

              </div>
            );
          })}
        </div>
        <Pagination
          currentPage={currentPage}
          totalItems={filteredAgreements.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
          itemName="consultancy agreements"
        />
      </div>
    )}

      {/* Onboard Client Modal */}
      {isOnboardModalOpen && (
        <OnboardConsultancyModal
          onClose={() => setIsOnboardModalOpen(false)}
          onOnboard={newAgreement => {
            onOnboardAgreement(newAgreement);
            setIsOnboardModalOpen(false);
          }}
        />
      )}

      {/* Return Funds Modal */}
      {selectedForReturn && (
        <ReturnFundsModal
          agreement={selectedForReturn}
          onClose={() => setSelectedForReturn(null)}
          onConfirmReturn={(id, record) => {
            onReturnFunds(id, record);
            setSelectedForReturn(null);
          }}
        />
      )}

      {/* Consultancy Agreement Details & Passbook Modal */}
      {selectedForDetails && (
        <ConsultancyDetailsModal
          agreement={selectedForDetails}
          onClose={() => setSelectedForDetails(null)}
          onOpenReturnModal={agreement => {
            setSelectedForDetails(null);
            setSelectedForReturn(agreement);
          }}
        />
      )}

    </div>
  );
};
