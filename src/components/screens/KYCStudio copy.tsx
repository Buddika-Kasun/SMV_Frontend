import React, { useState, useMemo } from 'react';
import { Pagination } from './common/Pagination';
import { ConfirmModal } from './common/ConfirmModal';
import { 
  ShieldCheck, 
  Upload, 
  CheckCircle2, 
  XCircle, 
  User, 
  DollarSign, 
  Sparkles, 
  LayoutGrid, 
  LayoutList, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Home, 
  Building2 
} from 'lucide-react';
import { KYCDocument, Loan } from '../api';
import { formatCurrency } from '../utils/consultancyUtils';
import { getLoanStatusLabel } from '../utils/loanUtils';

interface KYCStudioProps {
  loans: Loan[];
  onUpdateKYC: (loanId: string, updatedKYC: Loan['kyc']) => void;
  onDisburseLoan: (loanId: string) => void;
}

const PAGE_SIZE = 10;

/**
 * KYC Verification & Disbursement Studio
 * Includes max-10 rows pagination for the KYC queue and confirmation dialogs for disbursement and document audit.
 */
export const KYCStudio: React.FC<KYCStudioProps> = ({
  loans,
  onUpdateKYC,
  onDisburseLoan,
}) => {
  const kycLoans = loans.filter(l => l.status === 'KYC_Pending' || l.status === 'Approved_Pending_Disbursement');
  const allProcessableLoans = loans.filter(l => l.status !== 'Rejected');

  const [selectedLoanId, setSelectedLoanId] = useState<string>(
    kycLoans.length > 0 ? kycLoans[0].id : (allProcessableLoans.length > 0 ? allProcessableLoans[0].id : '')
  );

  const [queueViewMode, setQueueViewMode] = useState<'list' | 'grid'>('list');
  const [showQueue, setShowQueue] = useState<boolean>(false);
  const [queueSearch, setQueueSearch] = useState<string>('');
  const [queuePage, setQueuePage] = useState<number>(1);

  // Disbursement Confirmation Modal
  const [isDisburseConfirmOpen, setIsDisburseConfirmOpen] = useState<boolean>(false);

  const currentLoan = loans.find(l => l.id === selectedLoanId);

  // Local form state for editing KYC
  const [formData, setFormData] = useState({
    nationalIdNumber:
      currentLoan?.kyc?.idNumber || currentLoan?.customer?.idNumber || "",
    idType: currentLoan?.kyc?.idType || currentLoan?.customer?.idType || "NIC",
    dateOfBirth:
      currentLoan?.kyc?.dateOfBirth || currentLoan?.customer?.dateOfBirth || "",
    gender: currentLoan?.kyc?.gender || currentLoan?.customer?.gender || "Male",
    occupation:
      currentLoan?.kyc?.occupation || currentLoan?.customer?.occupation || "",
    employerName:
      currentLoan?.kyc?.employerName ||
      currentLoan?.customer?.employerName ||
      "",
    monthlyIncome:
      currentLoan?.kyc?.monthlyIncome ||
      currentLoan?.customer?.monthlyIncome ||
      0,
    addressLine:
      currentLoan?.kyc?.addressLine || currentLoan?.customer?.addressLine || "",
    city: currentLoan?.kyc?.city || currentLoan?.customer?.city || "",
    postalCode:
      currentLoan?.kyc?.postalCode || currentLoan?.customer?.postalCode || "",
    guarantorName:
      currentLoan?.kyc?.guarantorName || currentLoan?.guarantor?.fullName || "",
    guarantorPhone:
      currentLoan?.kyc?.guarantorPhone || currentLoan?.guarantor?.phone || "",
    guarantorRelation:
      currentLoan?.kyc?.guarantorRelation ||
      currentLoan?.guarantor?.relation ||
      "Relative",
    // bankName: currentLoan?.kyc.bankName || '',
    // accountNumber: currentLoan?.kyc.accountNumber || '',
  });

  // Sync state if selected loan changes
  React.useEffect(() => {
    if (currentLoan) {
      setFormData({
        nationalIdNumber: currentLoan.kyc?.idNumber || '',
        idType: currentLoan.kyc?.idType || 'NIC',
        dateOfBirth: currentLoan.kyc?.dateOfBirth || '1992-05-15',
        gender: currentLoan.kyc?.gender || 'Male',
        occupation: currentLoan.kyc?.occupation || '',
        employerName: currentLoan.kyc?.employerName || '',
        monthlyIncome: currentLoan.kyc?.monthlyIncome || 0,
        addressLine: currentLoan.kyc?.addressLine || '',
        city: currentLoan.kyc?.city || '',
        postalCode: currentLoan.kyc?.postalCode || '',
        guarantorName: currentLoan.kyc?.guarantorName || '',
        guarantorPhone: currentLoan.kyc?.guarantorPhone || '',
        guarantorRelation: currentLoan.kyc?.guarantorRelation || 'Relative',
        // bankName: currentLoan.kyc.bankName || '',
        // accountNumber: currentLoan.kyc.accountNumber || '',
      });
    }
  }, [selectedLoanId, currentLoan]);

  const filteredQueueLoans = useMemo(() => {
    return allProcessableLoans.filter(l => 
      l.customer?.fullName.toLowerCase().includes(queueSearch.toLowerCase()) ||
      l.id.toLowerCase().includes(queueSearch.toLowerCase()) ||
      l.kyc?.idNumber.includes(queueSearch)
    );
  }, [allProcessableLoans, queueSearch]);

  const paginatedQueueLoans = useMemo(() => {
    const start = (queuePage - 1) * PAGE_SIZE;
    return filteredQueueLoans.slice(start, start + PAGE_SIZE);
  }, [filteredQueueLoans, queuePage]);

  if (!currentLoan) {
    return (
      <div className="bg-white border border-slate-200/80 p-8 rounded-xl text-center text-slate-500 shadow-2xs">
        <ShieldCheck className="w-10 h-10 text-slate-400 mx-auto mb-2" />
        <p className="font-bold text-slate-800 text-sm">No Applications Requiring KYC</p>
        <p className="text-xs text-slate-500 mt-0.5">Approve a loan request to proceed to KYC & document verification.</p>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'monthlyIncome' ? parseFloat(value) || 0 : value }));
  };

  // const handleSaveKYC = () => {
  //   if (!currentLoan) return;
  //   const updated = {
  //     ...currentLoan.kyc,
  //     ...formData,
  //   };
  //   onUpdateKYC(currentLoan.id, updated);
  // };

  // const handleToggleDocVerification = (docId: string) => {
  //   if (!currentLoan) return;
  //   const updatedDocs = currentLoan.kyc?.documents.map(d => {
  //     if (d.id === docId) {
  //       return {
  //         ...d,
  //         status: (d.status === 'Verified' ? 'Pending Review' : 'Verified') as KYCDocument['status'],
  //       };
  //     }
  //     return d;
  //   });

  //   const isAllVerified = updatedDocs.every(d => d.status === 'Verified');

  //   onUpdateKYC(currentLoan.id, {
  //     ...currentLoan.kyc,
  //     documents: updatedDocs,
  //     isVerified: isAllVerified,
  //     verifiedBy: isAllVerified ? 'Officer James Sterling' : undefined,
  //     verifiedAt: isAllVerified ? new Date().toLocaleString() : undefined,
  //   });
  // };

  // const handleAddSampleDoc = (docType: KYCDocument['type']) => {
  //   if (!currentLoan) return;
  //   const newDoc: KYCDocument = {
  //     id: `DOC-${Date.now()}`,
  //     type: docType,
  //     fileName: `${docType.toLowerCase().replace(/[^a-z]/g, '_')}_verified.pdf`,
  //     fileUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&q=80',
  //     status: 'Verified',
  //     uploadedAt: new Date().toLocaleString(),
  //   };

  //   onUpdateKYC(currentLoan.id, {
  //     ...currentLoan.kyc,
  //     documents: [...currentLoan.kyc.documents, newDoc],
  //   });
  // };

  // const handleFileUploadMock = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   if (!e.target.files || e.target.files.length === 0 || !currentLoan) return;
  //   const file = e.target.files[0];
    
  //   const newDoc: KYCDocument = {
  //     id: `DOC-${Date.now()}`,
  //     type: 'National ID / Passport',
  //     fileName: file.name,
  //     fileUrl: URL.createObjectURL(file),
  //     status: 'Verified',
  //     uploadedAt: new Date().toLocaleString(),
  //   };

  //   onUpdateKYC(currentLoan.id, {
  //     ...currentLoan.kyc,
  //     documents: [...currentLoan.kyc.documents, newDoc],
  //   });
  // };

  const handleConfirmDisbursement = () => {
    if (currentLoan) {
      onDisburseLoan(currentLoan.id);
      setIsDisburseConfirmOpen(false);
    }
  };

  const isLoanAlreadyActive = currentLoan.status === 'Active' || currentLoan.status === 'Overdue' || currentLoan.status === 'Settled';
  const verifiedDocsCount = currentLoan.kyc?.documents.filter(d => d.status === 'Verified').length;
  const netDisbursedAmount = currentLoan.requestedAmount - currentLoan.processingFee;

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </div>
            KYC Verification & Disbursement Studio
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Identity verification, document compliance audit, guarantor
            validation, and loan fund disbursement.
          </p>
        </div>

        {/* Loan Selection Dropdown & Queue Toggle */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={() => setShowQueue(!showQueue)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition flex items-center gap-1.5 border border-slate-200/80 cursor-pointer"
          >
            <span>{showQueue ? "Hide Queue" : "Show Queue"}</span>
            {showQueue ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          <select
            value={selectedLoanId}
            onChange={(e) => setSelectedLoanId(e.target.value)}
            className="bg-white text-slate-800 font-medium text-xs py-1.5 px-3 rounded-lg border border-slate-200/80 focus:outline-none focus:ring-1 focus:ring-slate-300"
          >
            {allProcessableLoans.map((l) => (
              <option key={l.id} value={l.id}>
                {l.customer?.fullName} ({l.loanNumber}) - {getLoanStatusLabel(l.status)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KYC QUEUE BROWSER (LIST VIEW / GRID VIEW) */}
      {showQueue && (
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                KYC Verification Queue ({allProcessableLoans.length})
              </h3>
              <span className="text-[10px] text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded">
                Click any row/card to open KYC file
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* List vs Grid Switcher */}
              <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200/80">
                <button
                  onClick={() => setQueueViewMode("list")}
                  className={`p-1 rounded text-xs font-medium flex items-center gap-1 transition cursor-pointer ${
                    queueViewMode === "list"
                      ? "bg-white text-blue-700 shadow-2xs"
                      : "text-slate-600"
                  }`}
                  title="List View"
                >
                  <LayoutList className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">List</span>
                </button>
                <button
                  onClick={() => setQueueViewMode("grid")}
                  className={`p-1 rounded text-xs font-medium flex items-center gap-1 transition cursor-pointer ${
                    queueViewMode === "grid"
                      ? "bg-white text-blue-700 shadow-2xs"
                      : "text-slate-600"
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">Grid</span>
                </button>
              </div>

              {/* Search in queue */}
              <div className="relative w-full sm:w-48">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search applicant..."
                  value={queueSearch}
                  onChange={(e) => {
                    setQueueSearch(e.target.value);
                    setQueuePage(1);
                  }}
                  className="w-full bg-slate-50 text-slate-800 text-xs pl-8 pr-3 py-1 rounded-lg border border-slate-200/80 focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Queue View rendering */}
          {queueViewMode === "list" ? (
            <div className="overflow-x-auto border border-slate-100 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/60">
                  <tr>
                    <th className="p-2.5">Loan ID</th>
                    <th className="p-2.5">Customer & NIC</th>
                    <th className="p-2.5">Product</th>
                    <th className="p-2.5 text-right">Requested Amount</th>
                    <th className="p-2.5 text-center">Docs Verified</th>
                    <th className="p-2.5 text-center">KYC Status</th>
                    <th className="p-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedQueueLoans.map((l) => {
                    const isSelected = l.id === selectedLoanId;
                    const docCount = l.kyc?.documents.length;
                    const verifiedCount = l.kyc?.documents.filter(
                      (d) => d.status === "Verified",
                    ).length;

                    return (
                      <tr
                        key={l.id}
                        onClick={() => {
                          setSelectedLoanId(l.id);
                          setShowQueue(false);
                        }}
                        className={`transition cursor-pointer ${
                          isSelected
                            ? "bg-blue-50/70 font-semibold"
                            : "hover:bg-slate-50/80"
                        }`}
                      >
                        <td className="p-2.5 font-mono text-[11px] text-slate-900">
                          {l.id}
                        </td>
                        <td className="p-2.5">
                          <span className="font-bold text-slate-900 block">
                            {l.customer?.fullName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {l.kyc?.idNumber}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-600">{l.loanType}</td>
                        <td className="p-2.5 text-right font-bold text-slate-900">
                          {formatCurrency(l.requestedAmount)}
                        </td>
                        <td className="p-2.5 text-center">
                          <span className="text-[11px] font-mono text-slate-600">
                            {verifiedCount} / {docCount}
                          </span>
                        </td>
                        <td className="p-2.5 text-center">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              l.kyc?.isVerified
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200/60"
                                : "bg-amber-50 text-amber-800 border border-amber-200/60"
                            }`}
                          >
                            {l.kyc?.isVerified ? "Verified" : "Pending"}
                          </span>
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLoanId(l.id);
                              setShowQueue(false);
                            }}
                            className={`px-2 py-1 rounded text-[11px] font-medium transition cursor-pointer ${
                              isSelected
                                ? "bg-blue-600 text-white"
                                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                            }`}
                          >
                            Open
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {paginatedQueueLoans.map((l) => {
                const isSelected = l.id === selectedLoanId;
                const verifiedDocs = l.kyc?.documents.filter(
                  (d) => d.status === "Verified",
                ).length;

                return (
                  <div
                    key={l.id}
                    onClick={() => {
                      setSelectedLoanId(l.id);
                      setShowQueue(false);
                    }}
                    className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                      isSelected
                        ? "border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20"
                        : "border-slate-200/80 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono font-bold text-slate-900">
                          {l.id}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                            l.kyc?.isVerified
                              ? "bg-emerald-50 text-emerald-800"
                              : "bg-amber-50 text-amber-800"
                          }`}
                        >
                          {l.kyc?.isVerified ? "Verified" : "Pending"}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-slate-900 truncate">
                        {l.customer?.fullName}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-mono">
                        NIC: {l.kyc?.idNumber}
                      </p>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                      <span className="font-bold text-slate-900">
                        {formatCurrency(l.requestedAmount)}
                      </span>
                      <span className="text-slate-500">
                        {verifiedDocs}/{l.kyc?.documents.length} Docs
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Queue Pagination */}
          <Pagination
            currentPage={queuePage}
            totalItems={filteredQueueLoans.length}
            pageSize={PAGE_SIZE}
            onPageChange={setQueuePage}
            itemName="queue records"
          />
        </div>
      )}

      {/* Main Grid: KYC Form + Document Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Comprehensive KYC Details Form (2 Cols Wide) */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                Applicant Verification
              </span>
              <h3 className="text-sm font-semibold text-slate-900">
                {currentLoan.customer?.fullName} ({currentLoan.loanNumber})
              </h3>
            </div>
            <span
              className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium ${
                currentLoan.kyc?.isVerified
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                  : "bg-amber-50 text-amber-700 border border-amber-200/60"
              }`}
            >
              {currentLoan.kyc?.isVerified
                ? "Verified"
                : "Verification Pending"}
            </span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              // handleSaveKYC();
            }}
            className="space-y-4"
          >
            {/* Section 1: Identity Info */}
            <div>
              <h4 className="text-[11px] font-semibold text-blue-700 mb-2.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                Personal & Employment Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">
                    ID Document Type
                  </label>
                  <select
                    name="idType"
                    value={formData.idType}
                    onChange={handleInputChange}
                    className="w-full bg-white text-slate-800 text-xs py-1.5 px-3 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    required
                  >
                    <option value="NIC">NIC / National ID</option>
                    <option value="Passport">Passport</option>
                    <option value="Driver_License">Driver License</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">
                    ID Number
                  </label>
                  <input
                    type="text"
                    name="nationalIdNumber"
                    value={formData.nationalIdNumber}
                    onChange={handleInputChange}
                    className="w-full bg-white text-slate-800 text-xs py-1.5 px-3 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                    placeholder="e.g. 982-11-4092"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="w-full bg-white text-slate-800 text-xs py-1.5 px-3 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full bg-white text-slate-800 text-xs py-1.5 px-3 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">
                    Occupation
                  </label>
                  <input
                    type="text"
                    name="occupation"
                    value={formData.occupation}
                    onChange={handleInputChange}
                    className="w-full bg-white text-slate-800 text-xs py-1.5 px-3 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="e.g. Software Engineer"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">
                    Monthly Income (LKR)
                  </label>
                  <input
                    type="number"
                    name="monthlyIncome"
                    value={formData.monthlyIncome}
                    onChange={handleInputChange}
                    className="w-full bg-white text-slate-800 text-xs py-1.5 px-3 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Residential Address */}
            <div className="pt-3 border-t border-slate-100">
              <h4 className="text-[11px] font-semibold text-blue-700 mb-2.5 flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-blue-600" />
                Residential Address
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    name="addressLine"
                    value={formData.addressLine}
                    onChange={handleInputChange}
                    className="w-full bg-white text-slate-800 text-xs py-1.5 px-3 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full bg-white text-slate-800 text-xs py-1.5 px-3 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Guarantor & Bank Details */}
            <div className="pt-3 border-t border-slate-100">
              <h4 className="text-[11px] font-semibold text-blue-700 mb-2.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                Guarantor Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">
                    Guarantor Name
                  </label>
                  <input
                    type="text"
                    name="guarantorName"
                    value={formData.guarantorName}
                    onChange={handleInputChange}
                    className="w-full bg-white text-slate-800 text-xs py-1.5 px-3 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">
                    Guarantor Contact
                  </label>
                  <input
                    type="text"
                    name="guarantorPhone"
                    value={formData.guarantorPhone}
                    onChange={handleInputChange}
                    className="w-full bg-white text-slate-800 text-xs py-1.5 px-3 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">
                    Guarantor Relation
                  </label>
                  <input
                    type="text"
                    name="guarantorRelation"
                    value={formData.guarantorRelation}
                    onChange={handleInputChange}
                    className="w-full bg-white text-slate-800 text-xs py-1.5 px-3 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                {/* <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">Bank Name</label>
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleInputChange}
                    className="w-full bg-white text-slate-800 text-xs py-1.5 px-3 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div> 
                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">Account Number</label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleInputChange}
                    className="w-full bg-white text-slate-800 text-xs py-1.5 px-3 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                  />
                </div> */}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                Save KYC Information
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Documents & Disbursement */}
        <div className="space-y-4">
          {/* Documents Card */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Required Compliance Files
              </h3>
              <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                {verifiedDocsCount} / {currentLoan.kyc?.documents.length}{" "}
                Verified
              </span>
            </div>

            {/* Document List */}
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {currentLoan.kyc?.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-slate-50/60 p-3 rounded-lg border border-slate-200/60 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 font-medium block">
                      {doc.type}
                    </span>
                    <span className="text-xs font-medium text-slate-800 truncate block">
                      {doc.fileName}
                    </span>
                  </div>

                  <button
                    // onClick={() => handleToggleDocVerification(doc.id)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition flex items-center gap-1 shrink-0 cursor-pointer ${
                      doc.status === "Verified"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {doc.status === "Verified" ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Verified
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 text-amber-600" />
                        Pending
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>

            {/* Document Upload Buttons */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex gap-2">
                <label className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-medium py-2 px-3 rounded-lg cursor-pointer transition">
                  <Upload className="w-3.5 h-3.5 text-slate-600" />
                  <span>Upload Document</span>
                  <input
                    type="file"
                    className="hidden"
                    // onChange={handleFileUploadMock}
                    accept="image/*,application/pdf"
                  />
                </label>

                <button
                  type="button"
                  // onClick={() =>
                  //   handleAddSampleDoc("Pay Slip / Bank Statement")
                  // }
                  className="bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-medium px-3 py-2 rounded-lg transition cursor-pointer"
                >
                  + Sample
                </button>
              </div>
            </div>
          </div>

          {/* Grant & Disburse Loan Action Card */}
          <div className="bg-white border border-slate-200/80 p-5 rounded-xl shadow-2xs space-y-3">
            <div className="flex items-center gap-1.5 text-slate-900">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <h3 className="font-semibold text-slate-900 text-xs">
                Disbursement Action
              </h3>
            </div>

            <div className="text-xs text-slate-700 space-y-1.5 bg-slate-50/60 p-3 rounded-lg border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-500">Loan Amount:</span>
                <span className="font-medium text-slate-900">
                  {formatCurrency(currentLoan.requestedAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fee Deducted:</span>
                <span className="text-slate-700">
                  {formatCurrency(currentLoan.processingFee)}
                </span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-slate-200/60">
                <span className="text-slate-900 font-semibold">
                  Net Disbursed:
                </span>
                <span className="font-bold text-slate-900 text-xs">
                  {formatCurrency(netDisbursedAmount)}
                </span>
              </div>
            </div>

            {isLoanAlreadyActive ? (
              <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded-lg text-center text-xs font-medium">
                ✓ Loan disbursed on {currentLoan.disbursedDate || "Record"}.
                Active in repayment ledger.
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsDisburseConfirmOpen(true)}
                className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-3 rounded-lg shadow-2xs text-xs transition cursor-pointer"
              >
                <DollarSign className="w-4 h-4" />
                <span>Grant & Disburse Loan</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Disbursement Confirmation Dialog */}
      <ConfirmModal
        isOpen={isDisburseConfirmOpen}
        onClose={() => setIsDisburseConfirmOpen(false)}
        onConfirm={handleConfirmDisbursement}
        title="Confirm Loan Fund Disbursement"
        description="Are you sure you want to release and disburse funds for this loan? This action will mark the loan as Active and initialize the repayment installment schedule."
        confirmLabel="Authorize & Disburse Funds"
        cancelLabel="Cancel"
        variant="success"
        details={[
          { label: "Loan Reference", value: currentLoan.id },
          { label: "Borrower", value: currentLoan.customer?.fullName },
          {
            label: "Net Disbursed Amount",
            value: formatCurrency(netDisbursedAmount),
          },
          // {
          //   label: "Bank & Account",
          //   value: `${formData.bankName || currentLoan.kyc?.bankName} - ${formData.accountNumber || currentLoan.kyc.accountNumber}`,
          // },
        ]}
      />
    </div>
  );
};
