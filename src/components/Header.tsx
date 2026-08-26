import React, { useState } from 'react';
import { Search, RefreshCw, Plus, LogOut, ShieldCheck, User as UserIcon } from 'lucide-react';
import { Loan, User } from '../types';
import { formatCurrency } from '../utils/loanUtils';

interface HeaderProps {
  loans: Loan[];
  onSearch: (query: string) => void;
  onOpenNewLoanModal: () => void;
  onResetData: () => void;
  onSelectLoan: (loan: Loan) => void;
  currentUser: User;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  loans,
  onSearch,
  onOpenNewLoanModal,
  onResetData,
  onSelectLoan,
  currentUser,
  onLogout,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const activeLoans = loans.filter(l => l.status === 'Active' || l.status === 'Overdue');
  const totalDisbursed = loans.reduce((sum, l) => sum + (l.disbursedAmount || 0), 0);
  const totalOutstanding = activeLoans.reduce((sum, l) => sum + l.outstandingBalance, 0);

  const filteredSearchResults = searchQuery.trim()
    ? loans.filter(
        l =>
          l.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.kyc.nationalIdNumber.includes(searchQuery) ||
          l.accountNumber.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    onSearch(val);
    setIsSearchOpen(val.length > 0);
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
      
      {/* Title */}
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <span>Operations</span>
        <span>/</span>
        <span className="text-slate-900 font-semibold">Micro Finance</span>
      </div>

      {/* Center Search & Quick Actions */}
      <div className="flex items-center gap-3">
        
        {/* Search Input */}
        <div className="relative hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search customer, NIC or ID..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setIsSearchOpen(searchQuery.length > 0)}
              className="bg-slate-50 text-xs text-slate-800 pl-8 pr-3 py-1.5 w-60 rounded-lg border border-slate-200/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>

          {/* Quick Search Dropdown */}
          {isSearchOpen && filteredSearchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-50">
              <div className="p-2 text-[10px] font-semibold text-slate-400 border-b border-slate-100 bg-slate-50">
                Results ({filteredSearchResults.length})
              </div>
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                {filteredSearchResults.map(loan => (
                  <button
                    key={loan.id}
                    onClick={() => {
                      onSelectLoan(loan);
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="w-full text-left p-2.5 hover:bg-slate-50 transition flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-medium text-slate-900">{loan.customerName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{loan.id} • {loan.kyc.nationalIdNumber}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-slate-900">{formatCurrency(loan.requestedAmount)}</div>
                      <span className="text-[10px] text-slate-500">{loan.status}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Metric Summary */}
        <div className="hidden lg:flex items-center gap-3 text-xs pr-3 border-r border-slate-200/80">
          <div>
            <span className="text-slate-400 text-[10px] block font-medium">Disbursed</span>
            <span className="font-semibold text-slate-900">{formatCurrency(totalDisbursed)}</span>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block font-medium">Outstanding</span>
            <span className="font-bold text-blue-600">{formatCurrency(totalOutstanding)}</span>
          </div>
        </div>

        {/* New Loan Application Button */}
        <button
          onClick={onOpenNewLoanModal}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-3.5 py-1.5 rounded-lg transition shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Application</span>
        </button>

        <button
          onClick={onResetData}
          title="Reset sample data"
          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-slate-200/80 transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>

        {/* Logged In User Profile & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200/80">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs uppercase ${
              currentUser.role === 'admin' ? 'bg-blue-100 text-blue-800' :
              currentUser.role === 'manager' ? 'bg-emerald-100 text-emerald-800' :
              'bg-purple-100 text-purple-800'
            }`}>
              {currentUser.fullName.substring(0, 2)}
            </div>
            
            <div className="hidden sm:block text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 text-xs truncate max-w-[120px] block">
                  {currentUser.fullName}
                </span>
                <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                  currentUser.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                  currentUser.role === 'manager' ? 'bg-emerald-100 text-emerald-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {currentUser.role}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block font-mono leading-none">
                @{currentUser.username}
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            title="Log Out Session"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition border border-transparent hover:border-rose-200 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};


