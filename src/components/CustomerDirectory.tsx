import React, { useState } from 'react';
import { Loan } from '../types';
import { formatCurrency } from '../utils/loanUtils';
import { useResizableColumns, ColumnConfig } from '../hooks/useResizableColumns';
import { ResizableTh, ResizableTableContainer } from './common/ResizableTable';
import { 
  Users, Search, Phone, Mail, MapPin, ShieldCheck, 
  CreditCard, ChevronRight, LayoutGrid, LayoutList, Building2, CheckCircle2, AlertCircle
} from 'lucide-react';

interface CustomerDirectoryProps {
  loans: Loan[];
  onSelectLoan: (loan: Loan) => void;
}

const CUSTOMER_COLUMNS: ColumnConfig[] = [
  { id: 'details', defaultWidth: 230, minWidth: 160 },
  { id: 'nic', defaultWidth: 150, minWidth: 110 },
  { id: 'contact', defaultWidth: 180, minWidth: 130 },
  { id: 'employer', defaultWidth: 170, minWidth: 120 },
  { id: 'borrowed', defaultWidth: 150, minWidth: 110 },
  { id: 'repaid', defaultWidth: 150, minWidth: 110 },
  { id: 'kyc', defaultWidth: 130, minWidth: 100 },
  { id: 'actions', defaultWidth: 160, minWidth: 120 },
];

export const CustomerDirectory: React.FC<CustomerDirectoryProps> = ({
  loans,
  onSelectLoan,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [filterKyc, setFilterKyc] = useState<'All' | 'Verified' | 'Pending'>('All');

  const {
    columnWidths,
    startResize,
    resetToDefault,
    handleDoubleClickReset,
    resizingColId,
    totalTableWidth,
  } = useResizableColumns(CUSTOMER_COLUMNS, 'customer_directory');

  // Group loans by customer NIC / SSN
  const customerMap = new Map<string, { customerName: string; nic: string; loans: Loan[] }>();

  loans.forEach(loan => {
    const nic = loan.kyc.nationalIdNumber || loan.customerName;
    if (!customerMap.has(nic)) {
      customerMap.set(nic, {
        customerName: loan.customerName,
        nic,
        loans: [],
      });
    }
    customerMap.get(nic)!.loans.push(loan);
  });

  const customersList = Array.from(customerMap.values()).filter(c => {
    const primaryLoan = c.loans[0];
    const isVerified = primaryLoan?.kyc.isVerified;
    if (filterKyc === 'Verified' && !isVerified) return false;
    if (filterKyc === 'Pending' && isVerified) return false;

    const matchesSearch = 
      c.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.nic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (primaryLoan?.customerPhone && primaryLoan.customerPhone.includes(searchQuery)) ||
      (primaryLoan?.kyc.city && primaryLoan.kyc.city.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesSearch;
  });

  return (
    <div className="space-y-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
            Customer Credit Directory & Profiles
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Directory of registered clients, KYC verification status, credit borrowing history, and contact details.
          </p>
        </div>

        {/* View Switcher & Search Controls */}
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

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search name, NIC, phone..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 text-slate-800 text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-200/80 shadow-2xs overflow-x-auto text-xs">
        <span className="text-slate-400 font-medium mr-1">KYC Filter:</span>
        {(['All', 'Verified', 'Pending'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilterKyc(tab)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
              filterKyc === tab
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab}
            <span className="ml-1 opacity-80">
              ({tab === 'All' ? customerMap.size : Array.from(customerMap.values()).filter(c => tab === 'Verified' ? c.loans[0]?.kyc.isVerified : !c.loans[0]?.kyc.isVerified).length})
            </span>
          </button>
        ))}
      </div>

      {/* Content Rendering: LIST VIEW or GRID VIEW */}
      {customersList.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-xl p-12 text-center space-y-2">
          <Users className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">No Customers Found</h3>
          <p className="text-xs text-slate-500">Try adjusting your search query or filter.</p>
        </div>
      ) : viewMode === 'list' ? (
        /* LIST VIEW TABLE GRID */
        <ResizableTableContainer
          maxHeight="max-h-[560px]"
          totalTableWidth={totalTableWidth}
          onResetColumns={resetToDefault}
          title="Customer Accounts Directory"
          itemCount={customersList.length}
        >
          <table className="w-full text-left border-collapse text-xs table-fixed">
            <colgroup>
              <col style={{ width: columnWidths['details'] }} />
              <col style={{ width: columnWidths['nic'] }} />
              <col style={{ width: columnWidths['contact'] }} />
              <col style={{ width: columnWidths['employer'] }} />
              <col style={{ width: columnWidths['borrowed'] }} />
              <col style={{ width: columnWidths['repaid'] }} />
              <col style={{ width: columnWidths['kyc'] }} />
              <col style={{ width: columnWidths['actions'] }} />
            </colgroup>
            <thead className="sticky top-0 z-10">
              <tr>
                <ResizableTh
                  columnId="details"
                  width={columnWidths['details']}
                  onResizeStart={startResize}
                  onDoubleClickReset={handleDoubleClickReset}
                  isResizingActive={resizingColId === 'details'}
                >
                  Customer Details
                </ResizableTh>
                <ResizableTh
                  columnId="nic"
                  width={columnWidths['nic']}
                  onResizeStart={startResize}
                  onDoubleClickReset={handleDoubleClickReset}
                  isResizingActive={resizingColId === 'nic'}
                >
                  NIC / SSN
                </ResizableTh>
                <ResizableTh
                  columnId="contact"
                  width={columnWidths['contact']}
                  onResizeStart={startResize}
                  onDoubleClickReset={handleDoubleClickReset}
                  isResizingActive={resizingColId === 'contact'}
                >
                  Contact & Location
                </ResizableTh>
                <ResizableTh
                  columnId="employer"
                  width={columnWidths['employer']}
                  onResizeStart={startResize}
                  onDoubleClickReset={handleDoubleClickReset}
                  isResizingActive={resizingColId === 'employer'}
                >
                  Employer / Income
                </ResizableTh>
                <ResizableTh
                  columnId="borrowed"
                  width={columnWidths['borrowed']}
                  onResizeStart={startResize}
                  onDoubleClickReset={handleDoubleClickReset}
                  isResizingActive={resizingColId === 'borrowed'}
                  align="right"
                >
                  Total Borrowed
                </ResizableTh>
                <ResizableTh
                  columnId="repaid"
                  width={columnWidths['repaid']}
                  onResizeStart={startResize}
                  onDoubleClickReset={handleDoubleClickReset}
                  isResizingActive={resizingColId === 'repaid'}
                  align="right"
                >
                  Total Repaid
                </ResizableTh>
                <ResizableTh
                  columnId="kyc"
                  width={columnWidths['kyc']}
                  onResizeStart={startResize}
                  onDoubleClickReset={handleDoubleClickReset}
                  isResizingActive={resizingColId === 'kyc'}
                  align="center"
                >
                  KYC Status
                </ResizableTh>
                <ResizableTh
                  columnId="actions"
                  width={columnWidths['actions']}
                  onResizeStart={startResize}
                  onDoubleClickReset={handleDoubleClickReset}
                  isResizingActive={resizingColId === 'actions'}
                  align="center"
                >
                  Associated Loans
                </ResizableTh>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {customersList.map(cust => {
                const primaryLoan = cust.loans[0];
                const totalBorrowed = cust.loans.reduce((sum, l) => sum + (l.disbursedAmount || 0), 0);
                const totalPaid = cust.loans.reduce((sum, l) => sum + (l.totalPaidAmount || 0), 0);

                return (
                  <tr key={cust.nic} className="hover:bg-slate-50/80 transition group border-b border-slate-100/80">
                    {/* Customer Name & Primary Loan */}
                    <td className="p-3.5 overflow-hidden">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {cust.customerName.charAt(0)}
                        </div>
                        <div className="overflow-hidden">
                          <span className="font-bold text-slate-900 group-hover:text-blue-600 transition block truncate text-xs">
                            {cust.customerName}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate block">
                            {cust.loans.length} {cust.loans.length === 1 ? 'Loan Account' : 'Loan Accounts'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* NIC */}
                    <td className="p-3.5 font-mono text-[11px] font-semibold text-slate-700 overflow-hidden truncate">
                      {cust.nic}
                    </td>

                    {/* Contact */}
                    <td className="p-3.5 text-slate-600 overflow-hidden">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-[11px] truncate">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{primaryLoan?.customerPhone || 'N/A'}</span>
                        </div>
                        {primaryLoan?.kyc.city && (
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 truncate">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{primaryLoan.kyc.city}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Employer & Income */}
                    <td className="p-3.5 text-slate-600 overflow-hidden">
                      <span className="font-medium text-slate-800 block text-[11px] truncate">
                        {primaryLoan?.kyc.employerName || 'Self-Employed'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block truncate">
                        {formatCurrency(primaryLoan?.kyc.monthlyIncome || 0)}/mo
                      </span>
                    </td>

                    {/* Financial Stats */}
                    <td className="p-3.5 text-right font-bold text-blue-900 overflow-hidden truncate">
                      {formatCurrency(totalBorrowed)}
                    </td>
                    <td className="p-3.5 text-right font-bold text-emerald-800 overflow-hidden truncate">
                      {formatCurrency(totalPaid)}
                    </td>

                    {/* KYC Status */}
                    <td className="p-3.5 text-center overflow-hidden">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium inline-flex items-center gap-1 truncate ${
                        primaryLoan?.kyc.isVerified
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                          : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                      }`}>
                        {primaryLoan?.kyc.isVerified ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                            Verified
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                            Pending
                          </>
                        )}
                      </span>
                    </td>

                    {/* Associated Loans Quick Actions */}
                    <td className="p-3.5 text-center overflow-hidden">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {cust.loans.map(loan => (
                          <button
                            key={loan.id}
                            onClick={() => onSelectLoan(loan)}
                            className="px-2 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded text-[10px] font-mono font-medium transition border border-slate-200/80 flex items-center gap-1 shrink-0"
                            title={`View ${loan.id} Details`}
                          >
                            <span>{loan.id}</span>
                            <ChevronRight className="w-2.5 h-2.5" />
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </ResizableTableContainer>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customersList.map(cust => {
            const primaryLoan = cust.loans[0];
            const totalBorrowed = cust.loans.reduce((sum, l) => sum + (l.disbursedAmount || 0), 0);
            const totalPaid = cust.loans.reduce((sum, l) => sum + (l.totalPaidAmount || 0), 0);

            return (
              <div
                key={cust.nic}
                className="bg-white border border-slate-200/80 hover:border-blue-300 rounded-xl p-4 shadow-2xs hover:shadow-md transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{cust.customerName}</h3>
                    <p className="text-[10px] text-slate-500 font-mono">NIC/SSN: {cust.nic}</p>
                  </div>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium ${
                    primaryLoan?.kyc.isVerified
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                      : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                  }`}>
                    {primaryLoan?.kyc.isVerified ? 'KYC Verified' : 'KYC Pending'}
                  </span>
                </div>

                {/* Contact & Employment */}
                <div className="text-[11px] text-slate-600 space-y-1.5 bg-slate-50/60 p-3 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{primaryLoan?.customerPhone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{primaryLoan?.customerEmail}</span>
                  </div>
                  {primaryLoan?.kyc.addressLine && (
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{primaryLoan.kyc.addressLine}, {primaryLoan.kyc.city}</span>
                    </div>
                  )}
                </div>

                {/* Financial Stats */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-blue-50/50 p-2.5 rounded-lg border border-blue-100/60">
                    <span className="text-slate-500 block text-[10px] font-medium">Total Borrowed</span>
                    <span className="font-bold text-blue-900">{formatCurrency(totalBorrowed)}</span>
                  </div>
                  <div className="bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100/60">
                    <span className="text-slate-500 block text-[10px] font-medium">Total Repaid</span>
                    <span className="font-bold text-emerald-800">{formatCurrency(totalPaid)}</span>
                  </div>
                </div>

                {/* Associated Loans List */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Associated Loans ({cust.loans.length})
                  </span>
                  {cust.loans.map(loan => (
                    <button
                      key={loan.id}
                      onClick={() => onSelectLoan(loan)}
                      className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-50/80 hover:bg-blue-50/60 transition text-xs text-left border border-slate-100 hover:border-blue-200 group"
                    >
                      <div>
                        <span className="font-bold text-slate-900 text-[11px] group-hover:text-blue-700">{loan.id}</span>
                        <span className="text-slate-500 block text-[10px]">{loan.loanType}</span>
                      </div>
                      <div className="text-right flex items-center gap-1">
                        <span className="font-bold text-slate-900 text-[11px]">{formatCurrency(loan.requestedAmount)}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition" />
                      </div>
                    </button>
                  ))}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
