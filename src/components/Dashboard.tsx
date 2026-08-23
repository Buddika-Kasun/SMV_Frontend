import React from 'react';
import { Loan, TabType } from '../types';
import { formatCurrency } from '../utils/loanUtils';
import { 
  Banknote, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  PlusCircle, 
  CreditCard, 
  ShieldAlert, 
  Zap,
  UserCheck,
  Eye,
  FileCheck
} from 'lucide-react';

interface DashboardProps {
  loans: Loan[];
  onTabChange: (tab: TabType) => void;
  onSelectLoan: (loan: Loan) => void;
  onOpenNewLoanModal: () => void;
  onOpenPaymentModal: (loan: Loan) => void;
  onOpenSettlement: (loan: Loan) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  loans,
  onTabChange,
  onSelectLoan,
  onOpenNewLoanModal,
  onOpenPaymentModal,
  onOpenSettlement,
}) => {
  const activeLoans = loans.filter(l => l.status === 'Active' || l.status === 'Overdue');
  const overdueLoans = loans.filter(l => l.status === 'Overdue');
  const pendingApprovals = loans.filter(l => l.status === 'Pending Approval');
  const pendingKyc = loans.filter(l => l.status === 'KYC Pending');
  const settledLoans = loans.filter(l => l.status === 'Settled' || l.status === 'Early Settled');

  const totalDisbursed = loans.reduce((sum, l) => sum + (l.disbursedAmount || 0), 0);
  const totalOutstanding = activeLoans.reduce((sum, l) => sum + l.outstandingBalance, 0);
  const totalCollected = loans.reduce((sum, l) => sum + (l.totalPaidAmount || 0), 0);

  const totalOverdueAmount = overdueLoans.reduce((sum, l) => {
    const overdueInsts = l.installments.filter(i => i.status === 'Overdue');
    return sum + overdueInsts.reduce((s, i) => s + i.remainingAmount, 0);
  }, 0);

  return (
    <div className="space-y-6">
      
      {/* Top Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Micro Finance Portfolio
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            SMV Holdings — Real-time micro finance portfolio metrics, LKR collections, and active loan balances.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenNewLoanModal}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium px-3.5 py-2 rounded-lg text-xs transition shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Apply Loan</span>
          </button>
          <button
            onClick={() => onTabChange('payments')}
            className="flex items-center gap-1.5 bg-white hover:bg-blue-50/50 text-slate-700 font-medium px-3.5 py-2 rounded-lg text-xs transition border border-slate-200/80 shadow-2xs"
          >
            <CreditCard className="w-3.5 h-3.5 text-blue-600" />
            <span>Enter Payment</span>
          </button>
        </div>
      </div>

      {/* Overdue Warning Alert Banner if overdue loans exist */}
      {overdueLoans.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <div className="font-semibold text-xs text-amber-950">
                {overdueLoans.length} Loan{overdueLoans.length > 1 ? 's' : ''} Overdue ({formatCurrency(totalOverdueAmount)})
              </div>
              <p className="text-[11px] text-amber-800/80 mt-0.5">
                Installment payments are past due. Review applications or enter payments.
              </p>
            </div>
          </div>
          <button
            onClick={() => onTabChange('applications')}
            className="bg-amber-600 text-white font-medium px-3 py-1.5 rounded-lg text-xs hover:bg-amber-700 transition shrink-0 shadow-2xs"
          >
            Review Overdue
          </button>
        </div>
      )}

      {/* Vibrant Modern KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Portfolio */}
        <div className="bg-white p-4 border border-slate-200/80 rounded-xl shadow-2xs border-t-4 border-t-blue-600">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Disbursed</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold tracking-tight text-slate-900">{formatCurrency(totalDisbursed)}</div>
          <div className="text-xs text-slate-500 mt-2 flex items-center justify-between">
            <span>{loans.length} applications</span>
            <span className="text-blue-600 font-semibold">{settledLoans.length} settled</span>
          </div>
        </div>

        {/* Active Outstanding */}
        <div className="bg-white p-4 border border-slate-200/80 rounded-xl shadow-2xs border-t-4 border-t-indigo-500">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Outstanding Balance</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold tracking-tight text-slate-900">{formatCurrency(totalOutstanding)}</div>
          <div className="text-xs text-slate-500 mt-2 flex items-center justify-between">
            <span>{activeLoans.length} active loans</span>
            <span className="text-indigo-600 font-semibold">Principal + Int</span>
          </div>
        </div>

        {/* Total Collected */}
        <div className="bg-white p-4 border border-slate-200/80 rounded-xl shadow-2xs border-t-4 border-t-emerald-500">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Collected</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold tracking-tight text-slate-900">{formatCurrency(totalCollected)}</div>
          <div className="text-xs text-slate-500 mt-2 flex items-center justify-between">
            <span>Verified receipts</span>
            <span className="text-emerald-600 font-semibold">100% Verified</span>
          </div>
        </div>

        {/* Pending Action Pipeline */}
        <div className="bg-white p-4 border border-slate-200/80 rounded-xl shadow-2xs border-t-4 border-t-purple-500">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Pending Action</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold tracking-tight text-slate-900">
            {pendingApprovals.length + pendingKyc.length}
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center gap-2">
            <button 
              onClick={() => onTabChange('applications')}
              className="text-purple-700 hover:text-purple-900 font-semibold"
            >
              {pendingApprovals.length} Approval
            </button>
            <span>•</span>
            <button 
              onClick={() => onTabChange('kyc')}
              className="text-purple-700 hover:text-purple-900 font-semibold"
            >
              {pendingKyc.length} KYC
            </button>
          </div>
        </div>

      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div 
          onClick={() => onTabChange('kyc')}
          className="bg-white border border-slate-200/80 p-4 rounded-xl hover:border-purple-300 hover:shadow-md cursor-pointer transition-all group shadow-2xs"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <FileCheck className="w-4 h-4" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition" />
          </div>
          <h3 className="font-semibold text-slate-900 text-xs group-hover:text-purple-700 transition">KYC & Document Studio</h3>
          <p className="text-xs text-slate-500 mt-1">Verify ID, address, and disburse loan funds.</p>
        </div>

        <div 
          onClick={() => onTabChange('payments')}
          className="bg-white border border-slate-200/80 p-4 rounded-xl hover:border-blue-300 hover:shadow-md cursor-pointer transition-all group shadow-2xs"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <CreditCard className="w-4 h-4" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition" />
          </div>
          <h3 className="font-semibold text-slate-900 text-xs group-hover:text-blue-700 transition">Payment Entry</h3>
          <p className="text-xs text-slate-500 mt-1">Record installment payments and issue receipts.</p>
        </div>

        <div 
          onClick={() => onTabChange('settlement')}
          className="bg-white border border-slate-200/80 p-4 rounded-xl hover:border-amber-300 hover:shadow-md cursor-pointer transition-all group shadow-2xs"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Zap className="w-4 h-4" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition" />
          </div>
          <h3 className="font-semibold text-slate-900 text-xs group-hover:text-amber-700 transition">Early Settlement</h3>
          <p className="text-xs text-slate-500 mt-1">Calculate interest waivers and close loans early.</p>
        </div>

      </div>

      {/* Active Loans Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900 text-xs">Active Loans</h2>
            <p className="text-xs text-slate-500 mt-0.5">Summary of active customer loans and balances.</p>
          </div>
          <button
            onClick={() => onTabChange('applications')}
            className="text-xs font-medium text-slate-600 hover:text-slate-900 transition"
          >
            View All →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/50 text-slate-400 font-medium border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Disbursed</th>
                <th className="py-3 px-4">Paid Progress</th>
                <th className="py-3 px-4">Outstanding</th>
                <th className="py-3 px-4">Next Due</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loans.map(loan => {
                const totalContract = loan.installments.reduce((s, i) => s + i.totalInstallment, 0) || loan.disbursedAmount;
                const paidPct = Math.min(100, Math.round((loan.totalPaidAmount / (totalContract || 1)) * 100));

                return (
                  <tr key={loan.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{loan.customerName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{loan.id}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[11px] text-slate-600">
                        {loan.loanType}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {formatCurrency(loan.disbursedAmount)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="w-28">
                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                          <span>{paidPct}%</span>
                          <span>{formatCurrency(loan.totalPaidAmount)}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full"
                            style={{ width: `${paidPct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {formatCurrency(loan.outstandingBalance)}
                    </td>
                    <td className="py-3 px-4 text-[11px]">
                      {loan.nextDueDate ? (
                        <div>
                          <span className="text-slate-800 font-medium">{loan.nextDueDate}</span>
                          <span className="block text-slate-400 text-[10px]">{formatCurrency(loan.nextDueAmount || 0)}</span>
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        loan.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' :
                        loan.status === 'Overdue' ? 'bg-amber-50 text-amber-700 border border-amber-200/60' :
                        loan.status === 'KYC Pending' ? 'bg-purple-50 text-purple-700 border border-purple-200/60' :
                        loan.status === 'Pending Approval' ? 'bg-blue-50 text-blue-700 border border-blue-200/60' :
                        'bg-slate-100 text-slate-600 border border-slate-200/60'
                      }`}>
                        {loan.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectLoan(loan)}
                          title="View Details"
                          className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        
                        {(loan.status === 'Active' || loan.status === 'Overdue') && (
                          <>
                            <button
                              onClick={() => onOpenPaymentModal(loan)}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-medium transition shadow-2xs"
                            >
                              Pay
                            </button>
                            <button
                              onClick={() => onOpenSettlement(loan)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-medium transition"
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
        </div>
      </div>

    </div>
  );
};
