import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { 
  BarChart3, FileText, Download, Printer, Search, ChevronDown, ChevronUp,
  Banknote, Building2, AlertTriangle, CheckCircle2, ShieldCheck, Zap,
  TrendingUp, Calendar, Filter, Users, ArrowUpRight
} from 'lucide-react';
import { Loan, ConsultancyAgreement } from '../types';
import { formatCurrency } from '../utils/loanUtils';
import { getDaysRemaining } from '../utils/consultancyUtils';
import { useResizableColumns, ColumnConfig } from '../hooks/useResizableColumns';
import { ResizableTh, ResizableTableContainer } from './common/ResizableTable';

interface ReportsStudioProps {
  loans: Loan[];
  consultancies: ConsultancyAgreement[];
}

type ReportCategory = 'All' | 'Micro Finance' | 'Consultancy' | 'Revenue & Fees' | 'Risk & Compliance';

interface ReportDefinition {
  id: string;
  title: string;
  category: 'Micro Finance' | 'Consultancy' | 'Revenue & Fees' | 'Risk & Compliance';
  icon: React.ElementType;
  description: string;
  updateFrequency: string;
  metrics: { label: string; value: string; color?: string }[];
}

// --- Resizable Report Subcomponents ---

const REP1_COLS: ColumnConfig[] = [
  { id: 'id', defaultWidth: 140, minWidth: 100 },
  { id: 'name', defaultWidth: 180, minWidth: 130 },
  { id: 'nic', defaultWidth: 130, minWidth: 95 },
  { id: 'type', defaultWidth: 130, minWidth: 95 },
  { id: 'disbursed', defaultWidth: 140, minWidth: 100 },
  { id: 'outstanding', defaultWidth: 140, minWidth: 100 },
  { id: 'paid', defaultWidth: 140, minWidth: 100 },
  { id: 'status', defaultWidth: 110, minWidth: 85 },
];

const LoanPortfolioReportTable: React.FC<{ loans: Loan[] }> = ({ loans }) => {
  const { columnWidths, startResize, resetToDefault, handleDoubleClickReset, resizingColId, totalTableWidth } =
    useResizableColumns(REP1_COLS, 'rep_portfolio');

  return (
    <ResizableTableContainer
      maxHeight="max-h-[380px]"
      totalTableWidth={totalTableWidth}
      onResetColumns={resetToDefault}
      title="Micro Finance Loan Portfolio Breakdown"
      itemCount={loans.length}
    >
      <table className="w-full text-left border-collapse text-xs table-fixed">
        <colgroup>
          <col style={{ width: columnWidths['id'] }} />
          <col style={{ width: columnWidths['name'] }} />
          <col style={{ width: columnWidths['nic'] }} />
          <col style={{ width: columnWidths['type'] }} />
          <col style={{ width: columnWidths['disbursed'] }} />
          <col style={{ width: columnWidths['outstanding'] }} />
          <col style={{ width: columnWidths['paid'] }} />
          <col style={{ width: columnWidths['status'] }} />
        </colgroup>
        <thead className="sticky top-0 z-10">
          <tr>
            <ResizableTh columnId="id" width={columnWidths['id']} onResizeStart={startResize} onDoubleClickReset={handleDoubleClickReset} isResizingActive={resizingColId === 'id'}>Loan ID & Acc</ResizableTh>
            <ResizableTh columnId="name" width={columnWidths['name']} onResizeStart={startResize} onDoubleClickReset={handleDoubleClickReset} isResizingActive={resizingColId === 'name'}>Customer Name</ResizableTh>
            <ResizableTh columnId="nic" width={columnWidths['nic']} onResizeStart={startResize} onDoubleClickReset={handleDoubleClickReset} isResizingActive={resizingColId === 'nic'}>NIC Number</ResizableTh>
            <ResizableTh columnId="type" width={columnWidths['type']} onResizeStart={startResize} onDoubleClickReset={handleDoubleClickReset} isResizingActive={resizingColId === 'type'}>Type</ResizableTh>
            <ResizableTh columnId="disbursed" width={columnWidths['disbursed']} onResizeStart={startResize} onDoubleClickReset={handleDoubleClickReset} isResizingActive={resizingColId === 'disbursed'} align="right">Disbursed (LKR)</ResizableTh>
            <ResizableTh columnId="outstanding" width={columnWidths['outstanding']} onResizeStart={startResize} onDoubleClickReset={handleDoubleClickReset} isResizingActive={resizingColId === 'outstanding'} align="right">Outstanding (LKR)</ResizableTh>
            <ResizableTh columnId="paid" width={columnWidths['paid']} onResizeStart={startResize} onDoubleClickReset={handleDoubleClickReset} isResizingActive={resizingColId === 'paid'} align="right">Total Paid (LKR)</ResizableTh>
            <ResizableTh columnId="status" width={columnWidths['status']} onResizeStart={startResize} onDoubleClickReset={handleDoubleClickReset} isResizingActive={resizingColId === 'status'} align="center">Status</ResizableTh>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {loans.map(loan => (
            <tr key={loan.id} className="hover:bg-slate-50 transition border-b border-slate-100/80">
              <td className="p-3 font-mono text-[11px] overflow-hidden">
                <span className="font-bold text-slate-900 block truncate">{loan.id}</span>
                <span className="text-slate-400 truncate block">{loan.accountNumber}</span>
              </td>
              <td className="p-3 font-bold text-slate-900 overflow-hidden truncate">{loan.customerName}</td>
              <td className="p-3 font-mono text-slate-600 overflow-hidden truncate">{loan.kyc.nationalIdNumber}</td>
              <td className="p-3 text-slate-600 overflow-hidden truncate">{loan.loanType}</td>
              <td className="p-3 text-right font-bold text-slate-900 overflow-hidden truncate">{formatCurrency(loan.disbursedAmount)}</td>
              <td className="p-3 text-right font-bold text-indigo-900 overflow-hidden truncate">{formatCurrency(loan.outstandingBalance)}</td>
              <td className="p-3 text-right font-bold text-emerald-800 overflow-hidden truncate">{formatCurrency(loan.totalPaidAmount)}</td>
              <td className="p-3 text-center overflow-hidden">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium inline-block truncate ${
                  loan.status === 'Active' ? 'bg-blue-50 text-blue-700' :
                  loan.status === 'Overdue' ? 'bg-amber-50 text-amber-800 font-bold' :
                  loan.status === 'Early Settled' ? 'bg-purple-50 text-purple-700' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  {loan.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ResizableTableContainer>
  );
};

const REP2_COLS: ColumnConfig[] = [
  { id: 'id', defaultWidth: 130, minWidth: 95 },
  { id: 'name', defaultWidth: 180, minWidth: 130 },
  { id: 'nic', defaultWidth: 130, minWidth: 95 },
  { id: 'bank', defaultWidth: 170, minWidth: 120 },
  { id: 'balance', defaultWidth: 150, minWidth: 100 },
  { id: 'capital', defaultWidth: 150, minWidth: 100 },
  { id: 'maturity', defaultWidth: 140, minWidth: 100 },
  { id: 'status', defaultWidth: 120, minWidth: 85 },
];

const ConsultancyReportTable: React.FC<{ consultancies: ConsultancyAgreement[] }> = ({ consultancies }) => {
  const { columnWidths, startResize, resetToDefault, handleDoubleClickReset, resizingColId, totalTableWidth } =
    useResizableColumns(REP2_COLS, 'rep_consultancy');

  return (
    <ResizableTableContainer
      maxHeight="max-h-[380px]"
      totalTableWidth={totalTableWidth}
      onResetColumns={resetToDefault}
      title="Consultancy Capital Placement Breakdown"
      itemCount={consultancies.length}
    >
      <table className="w-full text-left border-collapse text-xs table-fixed">
        <colgroup>
          <col style={{ width: columnWidths['id'] }} />
          <col style={{ width: columnWidths['name'] }} />
          <col style={{ width: columnWidths['nic'] }} />
          <col style={{ width: columnWidths['bank'] }} />
          <col style={{ width: columnWidths['balance'] }} />
          <col style={{ width: columnWidths['capital'] }} />
          <col style={{ width: columnWidths['maturity'] }} />
          <col style={{ width: columnWidths['status'] }} />
        </colgroup>
        <thead className="sticky top-0 z-10">
          <tr>
            <ResizableTh columnId="id" width={columnWidths['id']} onResizeStart={startResize} onDoubleClickReset={handleDoubleClickReset} isResizingActive={resizingColId === 'id'}>Agreement ID</ResizableTh>
            <ResizableTh columnId="name" width={columnWidths['name']} onResizeStart={startResize} onDoubleClickReset={handleDoubleClickReset} isResizingActive={resizingColId === 'name'}>Client Name</ResizableTh>
            <ResizableTh columnId="nic" width={columnWidths['nic']} onResizeStart={startResize} onDoubleClickReset={handleDoubleClickReset} isResizingActive={resizingColId === 'nic'}>NIC Number</ResizableTh>
            <ResizableTh columnId="bank" width={columnWidths['bank']} onResizeStart={startResize} onDoubleClickReset={handleDoubleClickReset} isResizingActive={resizingColId === 'bank'}>Bank & Account</ResizableTh>
            <ResizableTh columnId="balance" width={columnWidths['balance']} onResizeStart={startResize} onDoubleClickReset={handleDoubleClickReset} isResizingActive={resizingColId === 'balance'} align="right">Passbook Last Balance</ResizableTh>
            <ResizableTh columnId="capital" width={columnWidths['capital']} onResizeStart={startResize} onDoubleClickReset={handleDoubleClickReset} isResizingActive={resizingColId === 'capital'} align="right">Placed Capital (LKR)</ResizableTh>
            <ResizableTh columnId="maturity" width={columnWidths['maturity']} onResizeStart={startResize} onDoubleClickReset={handleDoubleClickReset} isResizingActive={resizingColId === 'maturity'}>6-Month Maturity</ResizableTh>
            <ResizableTh columnId="status" width={columnWidths['status']} onResizeStart={startResize} onDoubleClickReset={handleDoubleClickReset} isResizingActive={resizingColId === 'status'} align="center">Status</ResizableTh>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {consultancies.map(c => (
            <tr key={c.id} className="hover:bg-slate-50 transition border-b border-slate-100/80">
              <td className="p-3 font-mono font-bold text-slate-900 overflow-hidden truncate">{c.id}</td>
              <td className="p-3 font-bold text-slate-900 overflow-hidden truncate">{c.customerName}</td>
              <td className="p-3 font-mono text-slate-600 overflow-hidden truncate">{c.nationalIdNumber}</td>
              <td className="p-3 text-slate-700 overflow-hidden">
                <span className="font-semibold block truncate">{c.bankName}</span>
                <span className="text-[10px] text-slate-400 font-mono truncate block">{c.accountNumber}</span>
              </td>
              <td className="p-3 text-right font-bold text-emerald-800 overflow-hidden truncate">{formatCurrency(c.lastStatementBalance)}</td>
              <td className="p-3 text-right font-extrabold text-blue-900 overflow-hidden truncate">{formatCurrency(c.placedAmount)}</td>
              <td className="p-3 font-mono text-[11px] overflow-hidden">
                <span className="block font-bold truncate">{c.maturityDate}</span>
                <span className="text-[10px] text-slate-400 truncate block">{getDaysRemaining(c.maturityDate)} days left</span>
              </td>
              <td className="p-3 text-center overflow-hidden">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium inline-block truncate ${
                  c.status === 'Returned & Closed' ? 'bg-emerald-50 text-emerald-800' :
                  c.status === 'Maturing Soon' ? 'bg-amber-50 text-amber-800' :
                  'bg-blue-50 text-blue-800'
                }`}>
                  {c.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ResizableTableContainer>
  );
};

const REP3_COLS: ColumnConfig[] = [
  { id: 'id', defaultWidth: 140, minWidth: 100 },
  { id: 'customer', defaultWidth: 180, minWidth: 130 },
  { id: 'date', defaultWidth: 120, minWidth: 90 },
  { id: 'method', defaultWidth: 140, minWidth: 100 },
  { id: 'interest', defaultWidth: 140, minWidth: 100 },
  { id: 'lateFee', defaultWidth: 140, minWidth: 100 },
  { id: 'total', defaultWidth: 150, minWidth: 100 },
];

const RevenueReportTable: React.FC<{ loans: Loan[] }> = ({ loans }) => {
  const { columnWidths, startResize, resetToDefault, handleDoubleClickReset, resizingColId, totalTableWidth } =
    useResizableColumns(REP3_COLS, 'rep_revenue');

  const payments = loans.flatMap(l => l.payments || []);

  return (
    <ResizableTableContainer
      maxHeight="max-h-[380px]"
      totalTableWidth={totalTableWidth}
      onResetColumns={resetToDefault}
      title="Revenue & Fee Collection Register"
      itemCount={payments.length}
    >
      <table className="w-full text-left border-collapse text-xs table-fixed">
        <colgroup>
          <col style={{ width: columnWidths['id'] }} />
          <col style={{ width: columnWidths['customer'] }} />
          <col style={{ width: columnWidths['date'] }} />
          <col style={{ width: columnWidths['method'] }} />
          <col style={{ width: columnWidths['interest'] }} />
          <col style={{ width: columnWidths['lateFee'] }} />
          <col style={{ width: columnWidths['total'] }} />
        </colgroup>
        <thead className="sticky top-0 z-10">
          <tr>
            <ResizableTh columnId="id" width={columnWidths['id']} onResizeStart={startResize} onDoubleClickReset={handleDoubleClickReset} isResizingActive={resizingColId === 'id'}>Receipt / Loan ID</ResizableTh>
            <ResizableTh columnId="customer" width={columnWidths['customer']} onResizeStart={startResize} onDoubleClickReset={handleDoubleClickReset} isResizingActive={resizingColId === 'customer'}>Customer</ResizableTh>
            <ResizableTh columnId="date" width={columnWidths['date']} onResizeStart={startResize} onDoubleClickReset={handleDoubleClickReset} isResizingActive={resizingColId === 'date'}>Date</ResizableTh>
            <ResizableTh columnId="method" width={columnWidths['method']} onResizeStart={startResize} onDoubleClickReset={handleDoubleClickReset} isResizingActive={resizingColId === 'method'}>Method</ResizableTh>
            <ResizableTh columnId="interest" width={columnWidths['interest']} onResizeStart={startResize} onDoubleClickReset={handleDoubleClickReset} isResizingActive={resizingColId === 'interest'} align="right">Interest Income</ResizableTh>
            <ResizableTh columnId="lateFee" width={columnWidths['lateFee']} onResizeStart={startResize} onDoubleClickReset={handleDoubleClickReset} isResizingActive={resizingColId === 'lateFee'} align="right">Late Penalty Fee</ResizableTh>
            <ResizableTh columnId="total" width={columnWidths['total']} onResizeStart={startResize} onDoubleClickReset={handleDoubleClickReset} isResizingActive={resizingColId === 'total'} align="right">Total Payment</ResizableTh>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {payments.map(pay => (
            <tr key={pay.id} className="hover:bg-slate-50 transition border-b border-slate-100/80">
              <td className="p-3 font-mono font-bold text-slate-900 overflow-hidden truncate">{pay.id}</td>
              <td className="p-3 font-semibold text-slate-900 overflow-hidden truncate">{pay.customerName}</td>
              <td className="p-3 font-mono text-slate-600 overflow-hidden truncate">{pay.paymentDate}</td>
              <td className="p-3 text-slate-600 overflow-hidden truncate">{pay.paymentMethod}</td>
              <td className="p-3 text-right font-bold text-blue-900 overflow-hidden truncate">{formatCurrency(pay.allocatedInterest)}</td>
              <td className="p-3 text-right font-bold text-amber-800 overflow-hidden truncate">{formatCurrency(pay.allocatedLateFee)}</td>
              <td className="p-3 text-right font-extrabold text-emerald-800 overflow-hidden truncate">{formatCurrency(pay.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </ResizableTableContainer>
  );
};

const REP4_COLS: ColumnConfig[] = [
  { id: 'id', defaultWidth: 130, minWidth: 95 },
  { id: 'borrower', defaultWidth: 180, minWidth: 130 },
  { id: 'phone', defaultWidth: 130, minWidth: 95 },
  { id: 'guarantor', defaultWidth: 180, minWidth: 130 },
  { id: 'overdue', defaultWidth: 150, minWidth: 100 },
  { id: 'status', defaultWidth: 160, minWidth: 110 },
];

const RiskReportTable: React.FC<{ overdueLoans: Loan[] }> = ({ overdueLoans }) => {
  const { columnWidths, startResize, resetToDefault, handleDoubleClickReset, resizingColId, totalTableWidth } =
    useResizableColumns(REP4_COLS, 'rep_risk');

  return (
    <ResizableTableContainer
      maxHeight="max-h-[380px]"
      totalTableWidth={totalTableWidth}
      onResetColumns={resetToDefault}
      title="Overdue Accounts & Delinquency Register"
      itemCount={overdueLoans.length}
    >
      <table className="w-full text-left border-collapse text-xs table-fixed">
        <colgroup>
          <col style={{ width: columnWidths['id'] }} />
          <col style={{ width: columnWidths['borrower'] }} />
          <col style={{ width: columnWidths['phone'] }} />
          <col style={{ width: columnWidths['guarantor'] }} />
          <col style={{ width: columnWidths['overdue'] }} />
          <col style={{ width: columnWidths['status'] }} />
        </colgroup>
        <thead className="sticky top-0 z-10">
          <tr>
            <ResizableTh columnId="id" width={columnWidths['id']} onResizeStart={startResize} onDoubleClickReset={handleDoubleClickReset} isResizingActive={resizingColId === 'id'}>Loan ID</ResizableTh>
            <ResizableTh columnId="borrower" width={columnWidths['borrower']} onResizeStart={startResize} onDoubleClickReset={handleDoubleClickReset} isResizingActive={resizingColId === 'borrower'}>Borrower Name</ResizableTh>
            <ResizableTh columnId="phone" width={columnWidths['phone']} onResizeStart={startResize} onDoubleClickReset={handleDoubleClickReset} isResizingActive={resizingColId === 'phone'}>Phone Contact</ResizableTh>
            <ResizableTh columnId="guarantor" width={columnWidths['guarantor']} onResizeStart={startResize} onDoubleClickReset={handleDoubleClickReset} isResizingActive={resizingColId === 'guarantor'}>Guarantor</ResizableTh>
            <ResizableTh columnId="overdue" width={columnWidths['overdue']} onResizeStart={startResize} onDoubleClickReset={handleDoubleClickReset} isResizingActive={resizingColId === 'overdue'} align="right">Overdue Balance</ResizableTh>
            <ResizableTh columnId="status" width={columnWidths['status']} onResizeStart={startResize} onDoubleClickReset={handleDoubleClickReset} isResizingActive={resizingColId === 'status'} align="center">Status</ResizableTh>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {overdueLoans.map(loan => (
            <tr key={loan.id} className="hover:bg-slate-50 transition border-b border-slate-100/80">
              <td className="p-3 font-mono font-bold text-slate-900 overflow-hidden truncate">{loan.id}</td>
              <td className="p-3 font-bold text-slate-900 overflow-hidden truncate">{loan.customerName}</td>
              <td className="p-3 font-mono text-slate-600 overflow-hidden truncate">{loan.customerPhone}</td>
              <td className="p-3 text-slate-700 overflow-hidden">
                <span className="font-medium block truncate">{loan.kyc.guarantorName}</span>
                <span className="text-[10px] text-slate-400 font-mono truncate block">{loan.kyc.guarantorPhone}</span>
              </td>
              <td className="p-3 text-right font-extrabold text-rose-800 overflow-hidden truncate">{formatCurrency(loan.outstandingBalance)}</td>
              <td className="p-3 text-center overflow-hidden">
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 inline-block truncate">
                  Overdue Action Required
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ResizableTableContainer>
  );
};

const REP5_COLS: ColumnConfig[] = [
  { id: 'customer', defaultWidth: 180, minWidth: 130 },
  { id: 'nic', defaultWidth: 130, minWidth: 95 },
  { id: 'employer', defaultWidth: 160, minWidth: 120 },
  { id: 'income', defaultWidth: 150, minWidth: 100 },
  { id: 'bank', defaultWidth: 140, minWidth: 100 },
  { id: 'status', defaultWidth: 140, minWidth: 100 },
];

const KycReportTable: React.FC<{ loans: Loan[] }> = ({ loans }) => {
  const { columnWidths, startResize, resetToDefault, handleDoubleClickReset, resizingColId, totalTableWidth } =
    useResizableColumns(REP5_COLS, 'rep_kyc');

  return (
    <ResizableTableContainer
      maxHeight="max-h-[380px]"
      totalTableWidth={totalTableWidth}
      onResetColumns={resetToDefault}
      title="KYC Compliance & Verification Audit"
      itemCount={loans.length}
    >
      <table className="w-full text-left border-collapse text-xs table-fixed">
        <colgroup>
          <col style={{ width: columnWidths['customer'] }} />
          <col style={{ width: columnWidths['nic'] }} />
          <col style={{ width: columnWidths['employer'] }} />
          <col style={{ width: columnWidths['income'] }} />
          <col style={{ width: columnWidths['bank'] }} />
          <col style={{ width: columnWidths['status'] }} />
        </colgroup>
        <thead className="sticky top-0 z-10">
          <tr>
            <ResizableTh columnId="customer" width={columnWidths['customer']} onResizeStart={startResize} onDoubleClickReset={handleDoubleClickReset} isResizingActive={resizingColId === 'customer'}>Customer Name</ResizableTh>
            <ResizableTh columnId="nic" width={columnWidths['nic']} onResizeStart={startResize} onDoubleClickReset={handleDoubleClickReset} isResizingActive={resizingColId === 'nic'}>NIC Number</ResizableTh>
            <ResizableTh columnId="employer" width={columnWidths['employer']} onResizeStart={startResize} onDoubleClickReset={handleDoubleClickReset} isResizingActive={resizingColId === 'employer'}>Employer</ResizableTh>
            <ResizableTh columnId="income" width={columnWidths['income']} onResizeStart={startResize} onDoubleClickReset={handleDoubleClickReset} isResizingActive={resizingColId === 'income'} align="right">Monthly Income</ResizableTh>
            <ResizableTh columnId="bank" width={columnWidths['bank']} onResizeStart={startResize} onDoubleClickReset={handleDoubleClickReset} isResizingActive={resizingColId === 'bank'}>Bank</ResizableTh>
            <ResizableTh columnId="status" width={columnWidths['status']} onResizeStart={startResize} onDoubleClickReset={handleDoubleClickReset} isResizingActive={resizingColId === 'status'} align="center">Verification Status</ResizableTh>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {loans.map(loan => (
            <tr key={loan.id} className="hover:bg-slate-50 transition border-b border-slate-100/80">
              <td className="p-3 font-bold text-slate-900 overflow-hidden truncate">{loan.customerName}</td>
              <td className="p-3 font-mono text-slate-600 overflow-hidden truncate">{loan.kyc.nationalIdNumber}</td>
              <td className="p-3 text-slate-700 overflow-hidden truncate">{loan.kyc.employerName}</td>
              <td className="p-3 text-right font-bold text-slate-900 overflow-hidden truncate">{formatCurrency(loan.kyc.monthlyIncome)}</td>
              <td className="p-3 text-slate-600 overflow-hidden truncate">{loan.kyc.bankName}</td>
              <td className="p-3 text-center overflow-hidden">
                {loan.kyc.isVerified ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-800 inline-flex items-center gap-1 truncate">
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    Verified
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-800 inline-flex items-center gap-1 truncate">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    Pending
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ResizableTableContainer>
  );
};

const REP6_COLS: ColumnConfig[] = [
  { id: 'id', defaultWidth: 130, minWidth: 95 },
  { id: 'borrower', defaultWidth: 180, minWidth: 130 },
  { id: 'disbursed', defaultWidth: 150, minWidth: 100 },
  { id: 'settled', defaultWidth: 160, minWidth: 100 },
  { id: 'date', defaultWidth: 140, minWidth: 100 },
  { id: 'status', defaultWidth: 160, minWidth: 110 },
];

const EarlySettlementReportTable: React.FC<{ earlySettledLoans: Loan[] }> = ({ earlySettledLoans }) => {
  const { columnWidths, startResize, resetToDefault, handleDoubleClickReset, resizingColId, totalTableWidth } =
    useResizableColumns(REP6_COLS, 'rep_settlement');

  return (
    <ResizableTableContainer
      maxHeight="max-h-[380px]"
      totalTableWidth={totalTableWidth}
      onResetColumns={resetToDefault}
      title="Early Loan Settlement & Foreclosure Register"
      itemCount={earlySettledLoans.length}
    >
      <table className="w-full text-left border-collapse text-xs table-fixed">
        <colgroup>
          <col style={{ width: columnWidths['id'] }} />
          <col style={{ width: columnWidths['borrower'] }} />
          <col style={{ width: columnWidths['disbursed'] }} />
          <col style={{ width: columnWidths['settled'] }} />
          <col style={{ width: columnWidths['date'] }} />
          <col style={{ width: columnWidths['status'] }} />
        </colgroup>
        <thead className="sticky top-0 z-10">
          <tr>
            <ResizableTh columnId="id" width={columnWidths['id']} onResizeStart={startResize} onDoubleClickReset={handleDoubleClickReset} isResizingActive={resizingColId === 'id'}>Loan ID</ResizableTh>
            <ResizableTh columnId="borrower" width={columnWidths['borrower']} onResizeStart={startResize} onDoubleClickReset={handleDoubleClickReset} isResizingActive={resizingColId === 'borrower'}>Borrower Name</ResizableTh>
            <ResizableTh columnId="disbursed" width={columnWidths['disbursed']} onResizeStart={startResize} onDoubleClickReset={handleDoubleClickReset} isResizingActive={resizingColId === 'disbursed'} align="right">Disbursed Capital</ResizableTh>
            <ResizableTh columnId="settled" width={columnWidths['settled']} onResizeStart={startResize} onDoubleClickReset={handleDoubleClickReset} isResizingActive={resizingColId === 'settled'} align="right">Settled Amount (LKR)</ResizableTh>
            <ResizableTh columnId="date" width={columnWidths['date']} onResizeStart={startResize} onDoubleClickReset={handleDoubleClickReset} isResizingActive={resizingColId === 'date'}>Settled Date</ResizableTh>
            <ResizableTh columnId="status" width={columnWidths['status']} onResizeStart={startResize} onDoubleClickReset={handleDoubleClickReset} isResizingActive={resizingColId === 'status'} align="center">Status</ResizableTh>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {earlySettledLoans.map(loan => (
            <tr key={loan.id} className="hover:bg-slate-50 transition border-b border-slate-100/80">
              <td className="p-3 font-mono font-bold text-slate-900 overflow-hidden truncate">{loan.id}</td>
              <td className="p-3 font-bold text-slate-900 overflow-hidden truncate">{loan.customerName}</td>
              <td className="p-3 text-right font-bold text-slate-900 overflow-hidden truncate">{formatCurrency(loan.disbursedAmount)}</td>
              <td className="p-3 text-right font-extrabold text-purple-900 overflow-hidden truncate">{formatCurrency(loan.totalPaidAmount)}</td>
              <td className="p-3 font-mono text-slate-600 overflow-hidden truncate">{loan.settledDate || 'N/A'}</td>
              <td className="p-3 text-center overflow-hidden">
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-purple-50 text-purple-800 inline-block truncate">
                  Foreclosed / Early Settled
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ResizableTableContainer>
  );
};

export const ReportsStudio: React.FC<ReportsStudioProps> = ({ loans, consultancies }) => {
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedReportId, setExpandedReportId] = useState<string | null>('rep-1'); // Default open first report
  const [printableReport, setPrintableReport] = useState<{ title: string; content: React.ReactNode } | null>(null);

  // --- Calculations for Reports ---

  // Report 1: Loan Portfolio
  const totalDisbursed = loans.reduce((sum, l) => sum + l.disbursedAmount, 0);
  const totalOutstanding = loans.reduce((sum, l) => sum + l.outstandingBalance, 0);
  const totalPaid = loans.reduce((sum, l) => sum + l.totalPaidAmount, 0);
  const activeLoansCount = loans.filter(l => l.status === 'Active' || l.status === 'Overdue').length;

  // Report 2: Consultancy
  const totalConsultancyPlaced = consultancies.filter(c => c.status !== 'Returned & Closed').reduce((sum, c) => sum + c.placedAmount, 0);
  const totalConsultancyReturned = consultancies.filter(c => c.status === 'Returned & Closed').reduce((sum, c) => sum + (c.returnRecord?.returnedAmount || c.placedAmount), 0);
  const maturingSoonCount = consultancies.filter(c => c.status === 'Maturing Soon' || c.status === 'Maturity Reached').length;

  // Report 3: Revenue & Fees
  const totalInterestCollected = loans.flatMap(l => l.payments || []).reduce((sum, p) => sum + (p?.allocatedInterest || 0), 0);
  const totalProcessingFees = loans.reduce((sum, l) => sum + (l.processingFee || 0), 0);
  const totalLateFeesCollected = loans.flatMap(l => l.payments || []).reduce((sum, p) => sum + (p?.allocatedLateFee || 0), 0);
  const totalNetRevenue = totalInterestCollected + totalProcessingFees + totalLateFeesCollected;

  // Report 4: Risk & Delinquency
  const overdueLoans = loans.filter(l => l.status === 'Overdue');
  const totalOverdueBalance = overdueLoans.reduce((sum, l) => sum + l.outstandingBalance, 0);
  const parPercentage = totalDisbursed > 0 ? ((totalOverdueBalance / totalOutstanding) * 100).toFixed(1) : '0.0';

  // Report 5: KYC Compliance
  const totalKycVerified = loans.filter(l => l.kyc.isVerified).length;
  const kycComplianceRate = loans.length > 0 ? Math.round((totalKycVerified / loans.length) * 100) : 0;

  // Report 6: Early Settlement
  const earlySettledLoans = loans.filter(l => l.status === 'Early Settled');
  const totalEarlySettledPrincipal = earlySettledLoans.reduce((sum, l) => sum + l.disbursedAmount, 0);

  // Define Report Catalog
  const reportsList: ReportDefinition[] = [
    {
      id: 'rep-1',
      title: 'Micro Finance Loan Portfolio & Recovery Audit',
      category: 'Micro Finance',
      icon: Banknote,
      description: 'Comprehensive overview of disbursed capital, active outstanding principal balances, total collections, and individual account repayment velocity.',
      updateFrequency: 'Live Real-time',
      metrics: [
        { label: 'Total Disbursed', value: formatCurrency(totalDisbursed), color: 'text-blue-900' },
        { label: 'Outstanding Balance', value: formatCurrency(totalOutstanding), color: 'text-indigo-900' },
        { label: 'Principal Recovered', value: formatCurrency(totalPaid), color: 'text-emerald-800' },
        { label: 'Active Loan Accounts', value: `${activeLoansCount} Accounts`, color: 'text-slate-800' },
      ],
    },
    {
      id: 'rep-2',
      title: 'Consultancy Placement & 6-Month Capital Maturity Schedule',
      category: 'Consultancy',
      icon: Building2,
      description: 'Tracks 6-month capital deposits placed in client bank accounts, passbook statement verifications, upcoming maturity countdowns, and settled returns.',
      updateFrequency: 'Daily Refresh',
      metrics: [
        { label: 'Active Placed Capital', value: formatCurrency(totalConsultancyPlaced), color: 'text-blue-900' },
        { label: 'Capital Returned & Settled', value: formatCurrency(totalConsultancyReturned), color: 'text-emerald-800' },
        { label: 'Maturing / Due Return', value: `${maturingSoonCount} Clients`, color: 'text-amber-800' },
      ],
    },
    {
      id: 'rep-3',
      title: 'Daily & Monthly Revenue, Interest & Fee Collection Register',
      category: 'Revenue & Fees',
      icon: TrendingUp,
      description: 'Detailed earnings ledger breaking down interest income, upfront loan processing fees, late payment penalties, and total net finance profit.',
      updateFrequency: 'Real-time Ledger',
      metrics: [
        { label: 'Net Finance Profit', value: formatCurrency(totalNetRevenue), color: 'text-emerald-800' },
        { label: 'Interest Income', value: formatCurrency(totalInterestCollected), color: 'text-blue-900' },
        { label: 'Processing Fees', value: formatCurrency(totalProcessingFees), color: 'text-indigo-900' },
        { label: 'Late Fees Collected', value: formatCurrency(totalLateFeesCollected), color: 'text-amber-900' },
      ],
    },
    {
      id: 'rep-4',
      title: 'Overdue & Delinquency Aging Ledger (Risk Management)',
      category: 'Risk & Compliance',
      icon: AlertTriangle,
      description: 'Identifies defaulted or delayed repayment schedules, accrued late penalties, guarantor contact records, and Portfolio at Risk (PAR) ratios.',
      updateFrequency: 'Live Risk Monitor',
      metrics: [
        { label: 'Overdue Outstanding', value: formatCurrency(totalOverdueBalance), color: 'text-rose-900' },
        { label: 'Overdue Loans Count', value: `${overdueLoans.length} Loans`, color: 'text-rose-800' },
        { label: 'Portfolio at Risk (PAR)', value: `${parPercentage}%`, color: 'text-amber-800' },
      ],
    },
    {
      id: 'rep-5',
      title: 'Customer KYC & Verification Compliance Audit Trail',
      category: 'Risk & Compliance',
      icon: ShieldCheck,
      description: 'Monitors customer National Identity Card (NIC) validations, employer proof, guarantor records, passbook attachments, and verifying officer logs.',
      updateFrequency: 'Instant Audit',
      metrics: [
        { label: 'KYC Compliance Rate', value: `${kycComplianceRate}%`, color: 'text-emerald-800' },
        { label: 'Verified Profiles', value: `${totalKycVerified} / ${loans.length}`, color: 'text-slate-800' },
      ],
    },
    {
      id: 'rep-6',
      title: 'Early Settlement & Foreclosure Savings Statement',
      category: 'Micro Finance',
      icon: Zap,
      description: 'Detailed audit of loans closed prematurely via early settlement, unearned interest rebates provided to borrowers, and penalty fees collected.',
      updateFrequency: 'Monthly Audit',
      metrics: [
        { label: 'Settled Capital', value: formatCurrency(totalEarlySettledPrincipal), color: 'text-purple-900' },
        { label: 'Early Settled Count', value: `${earlySettledLoans.length} Loans`, color: 'text-slate-800' },
      ],
    },
  ];

  // Filtered list of reports
  const filteredReports = reportsList.filter(rep => {
    if (selectedCategory !== 'All' && rep.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        rep.title.toLowerCase().includes(q) ||
        rep.description.toLowerCase().includes(q) ||
        rep.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Export CSV handler
  const handleExportCSV = (reportTitle: string) => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += `SMV Holdings - ${reportTitle}\nGenerated At: ${new Date().toLocaleString()}\nCurrency: LKR\n\n`;

    if (reportTitle.includes('Loan Portfolio')) {
      csvContent += 'Loan ID,Account No,Customer Name,NIC,Type,Disbursed Amount (LKR),Outstanding (LKR),Total Paid (LKR),Status\n';
      loans.forEach(l => {
        csvContent += `${l.id},${l.accountNumber},"${l.customerName}",${l.kyc.nationalIdNumber},${l.loanType},${l.disbursedAmount},${l.outstandingBalance},${l.totalPaidAmount},${l.status}\n`;
      });
    } else if (reportTitle.includes('Consultancy')) {
      csvContent += 'Agreement ID,Client Name,NIC,Bank,Account No,Passbook Balance (LKR),Placed Capital (LKR),Maturity Date,Status\n';
      consultancies.forEach(c => {
        csvContent += `${c.id},"${c.customerName}",${c.nationalIdNumber},"${c.bankName}",${c.accountNumber},${c.lastStatementBalance},${c.placedAmount},${c.maturityDate},${c.status}\n`;
      });
    } else {
      csvContent += 'Record ID,Customer Name,Loan/Agreement,Type,Amount (LKR),Date,Status\n';
      loans.forEach(l => {
        csvContent += `${l.id},"${l.customerName}",${l.loanType},Loan,${l.disbursedAmount},${l.requestedDate},${l.status}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${reportTitle.replace(/\s+/g, '_')}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${reportTitle} to CSV`);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight">
                Essential Operational & Financial Reports
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                SMV Holdings — Structured list view for micro finance portfolio audits, consultancy placements, revenue registers, and compliance logs.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => handleExportCSV('SMV_Holdings_Master_Operations')}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl text-xs transition shadow-2xs flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Export Master Ledger (CSV)</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
        
        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
          {(['All', 'Micro Finance', 'Consultancy', 'Revenue & Fees', 'Risk & Compliance'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search report name or metric..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 text-slate-800 text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
        </div>

      </div>

      {/* List View Container */}
      <div className="space-y-3">
        {filteredReports.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-2">
            <BarChart3 className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">No Reports Found</h3>
            <p className="text-xs text-slate-500">Try adjusting your search query or category filter.</p>
          </div>
        ) : (
          filteredReports.map(rep => {
            const IconComp = rep.icon;
            const isExpanded = expandedReportId === rep.id;

            return (
              <div 
                key={rep.id}
                className={`bg-white border rounded-xl transition-all shadow-2xs overflow-hidden ${
                  isExpanded ? 'border-blue-300 ring-1 ring-blue-500/10' : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                {/* List View Item Row */}
                <div className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Left Column: Icon + Title + Description */}
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0 mt-0.5">
                      <IconComp className="w-5 h-5" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-900">{rep.title}</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-md font-medium bg-slate-100 text-slate-700 border border-slate-200/60">
                          {rep.category}
                        </span>
                        <span className="text-[10px] text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                          {rep.updateFrequency}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                        {rep.description}
                      </p>
                    </div>
                  </div>

                  {/* Middle Column: Inline Highlights */}
                  <div className="flex items-center gap-4 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 shrink-0 overflow-x-auto">
                    {rep.metrics.map((m, idx) => (
                      <div key={idx} className="space-y-0.5 px-2 border-r last:border-0 border-slate-200">
                        <span className="text-[9px] text-slate-400 uppercase font-semibold block whitespace-nowrap">{m.label}</span>
                        <span className={`text-xs font-extrabold ${m.color || 'text-slate-900'}`}>{m.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Right Column: Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                    <button
                      onClick={() => handleExportCSV(rep.title)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition border border-slate-200 flex items-center gap-1"
                      title="Export CSV"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">CSV</span>
                    </button>

                    <button
                      onClick={() => setExpandedReportId(isExpanded ? null : rep.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition flex items-center gap-1.5 ${
                        isExpanded 
                          ? 'bg-blue-600 text-white shadow-2xs' 
                          : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/80'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{isExpanded ? 'Hide Data' : 'View Report'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                </div>

                {/* Expanded Detailed Report Data Table */}
                {isExpanded && (
                  <div className="bg-slate-50/70 border-t border-slate-200/80 p-4 space-y-4 animate-in fade-in duration-150">
                    
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span>Detailed Breakdown Table ({rep.title})</span>
                      <span className="text-slate-400 text-[11px]">Values formatted in Sri Lankan Rupees (LKR) • Drag column borders to resize</span>
                    </div>

                    {/* Conditional Table per Report */}
                    {rep.id === 'rep-1' && <LoanPortfolioReportTable loans={loans} />}
                    {rep.id === 'rep-2' && <ConsultancyReportTable consultancies={consultancies} />}
                    {rep.id === 'rep-3' && <RevenueReportTable loans={loans} />}
                    {rep.id === 'rep-4' && <RiskReportTable overdueLoans={overdueLoans} />}
                    {rep.id === 'rep-5' && <KycReportTable loans={loans} />}
                    {rep.id === 'rep-6' && <EarlySettlementReportTable earlySettledLoans={earlySettledLoans} />}

                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
