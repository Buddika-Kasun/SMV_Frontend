import React, { useState, useEffect, useCallback } from "react";
import { Pagination } from "../common/Pagination";
import { ConfirmModal } from "../common/ConfirmModal";
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
  Building2,
  Loader2,
  X,
  FileText,
  Lock,
  Eye,
} from "lucide-react";
import { KYCPayload, Loan, LoanDocument } from "../../api";
import { formatCurrency } from "../../utils/consultancyUtils";
import {
  getDocumentTypeLabel,
  getLoanStatusColor,
  getLoanStatusLabel,
  getLoanTypeLabel,
  toDateInput,
} from "../../utils/loanUtils";
import { loanService } from "../../services/loan.service";
import { useDebounce } from "../../hooks/useDebounce";
import toast from "react-hot-toast";
import { DocumentPreviewModal } from "../DocumentPreviewModal";

// ---------------------------------------------------------
// Skeleton Row (Queue List View)
// ---------------------------------------------------------
const QueueSkeletonRow: React.FC = () => (
  <tr className="animate-pulse">
    <td className="p-2.5">
      <div className="h-3 w-20 bg-slate-200 rounded" />
    </td>
    <td className="p-2.5 space-y-1.5">
      <div className="h-3 w-32 bg-slate-200 rounded" />
      <div className="h-2.5 w-24 bg-slate-200 rounded" />
    </td>
    <td className="p-2.5">
      <div className="h-3 w-24 bg-slate-200 rounded" />
    </td>
    <td className="p-2.5">
      <div className="h-3 w-20 bg-slate-200 rounded ml-auto" />
    </td>
    <td className="p-2.5">
      <div className="h-3 w-10 bg-slate-200 rounded mx-auto" />
    </td>
    <td className="p-2.5">
      <div className="flex justify-center">
        <div className="h-4 w-20 bg-slate-200 rounded-full" />
      </div>
    </td>
    <td className="p-2.5">
      <div className="flex justify-center">
        <div className="h-6 w-14 bg-slate-200 rounded" />
      </div>
    </td>
  </tr>
);

// ---------------------------------------------------------
// Skeleton Card (Queue Grid View)
// ---------------------------------------------------------
const QueueSkeletonCard: React.FC = () => (
  <div className="p-3 rounded-lg border border-slate-200/80 bg-white animate-pulse space-y-2">
    <div className="flex items-center justify-between">
      <div className="h-2.5 w-20 bg-slate-200 rounded" />
      <div className="h-3 w-16 bg-slate-200 rounded-full" />
    </div>
    <div className="flex items-center justify-between">
      <div className="h-3 w-28 bg-slate-200 rounded" />
      <div className="h-3 w-14 bg-slate-200 rounded-full" />
    </div>
    <div className="h-2.5 w-24 bg-slate-200 rounded" />
    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
      <div className="h-3 w-20 bg-slate-200 rounded" />
      <div className="h-2.5 w-14 bg-slate-200 rounded" />
    </div>
  </div>
);

// ---------------------------------------------------------
// Skeleton placeholders for form fields
// ---------------------------------------------------------
const SkeletonField: React.FC<{ className?: string }> = ({
  className = "",
}) => (
  <div
    className={`h-8 w-full bg-slate-100 rounded-lg animate-pulse ${className}`}
  />
);

const SkeletonText: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`h-3.5 bg-slate-100 rounded animate-pulse ${className}`} />
);

/**
 * Renders children normally, or a skeleton bar while `loading` is true.
 * Used to swap form inputs for placeholders without shifting layout.
 */
const FieldSlot: React.FC<{
  loading: boolean;
  children: React.ReactNode;
  skeletonClassName?: string;
}> = ({ loading, children, skeletonClassName }) =>
  loading ? <SkeletonField className={skeletonClassName} /> : <>{children}</>;

interface KYCStudioProps {
  initialLoanId?: string | null;
  onRefresh: () => void;
  refresh: number;
  onOpenLoanDetails: (loanId: string) => void;
  openDocumentPreview: (doc: LoanDocument) => void;
}

const LIST_PAGE_SIZE = 10;
const GRID_PAGE_SIZE = 8;

const STATUS_FILTERS = [
  { value: "All", label: "All" },
  { value: "Pending_Approval", label: "Pending Approval" },
  { value: "KYC_Pending", label: "Pending KYC" },
  {
    value: "Approved_Pending_Disbursement",
    label: "Pending Disbursement",
  },
  { value: "Active", label: "Active" },
  { value: "Overdue", label: "Overdue" },
  { value: "Settled", label: "Settled" },
  { value: "Early_Settled", label: "Early Settled" },
  { value: "Rejected", label: "Rejected" },
];

// Document type options for upload
const DOCUMENT_TYPES = [
  "National_ID_Passport",
  "Proof_of_Address",
  "Pay_Slip_Bank_Statement",
  "Guarantor_ID",
  "Business_Registration",
];

export const KYCStudio: React.FC<KYCStudioProps> = ({
  initialLoanId,
  onRefresh,
  refresh,
  onOpenLoanDetails,
  openDocumentPreview,
}) => {
  console.log("Initial loan id: ", initialLoanId);
  // ---------------------------------------------------------
  // Queue data for TABLE/GRID (via listLoans with params)
  // ---------------------------------------------------------
  const [queueLoans, setQueueLoans] = useState<Loan[]>([]);
  const [queueTotal, setQueueTotal] = useState(0);
  const [queueLoading, setQueueLoading] = useState(false);
  const [queueStatus, setQueueStatus] = useState("KYC_Pending");
  const [queueSearch, setQueueSearch] = useState("");
  const debouncedSearch = useDebounce(queueSearch, 300);
  const [queuePage, setQueuePage] = useState(1);
  const [queueViewMode, setQueueViewMode] = useState<"list" | "grid">("list");
  const [showQueue, setShowQueue] = useState(false);

  // ---------------------------------------------------------
  // Dropdown data (KYC_Pending only via getLoansListByStatus)
  // ---------------------------------------------------------
  const [dropdownLoans, setDropdownLoans] = useState<Loan[]>([]);
  const [dropdownLoading, setDropdownLoading] = useState(false);

  // ---------------------------------------------------------
  // Selected loan
  // ---------------------------------------------------------
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(
    initialLoanId ?? null,
  );
  const [currentLoan, setCurrentLoan] = useState<Loan | null>(null);
  const [loanLoading, setLoanLoading] = useState(false);

  // ---------------------------------------------------------
  // Form state
  // ---------------------------------------------------------
  const [formData, setFormData] = useState({
    idNumber: "",
    idType: "NIC",
    dateOfBirth: "",
    gender: "Male",
    occupation: "",
    employerName: "",
    monthlyIncome: "0",
    addressLine: "",
    city: "",
    postalCode: "",
    guarantorName: "",
    guarantorPhone: "",
    guarantorRelation: "Relative",
    // bankName: "",
    // accountNumber: "",
    deductedFee: "0",
  });
  const [saving, setSaving] = useState(false);

  // ---------------------------------------------------------
  // Document upload modal
  // ---------------------------------------------------------
  const [isDocUploadOpen, setIsDocUploadOpen] = useState(false);
  const [docType, setDocType] = useState("National_ID_Passport");
  const [docFileName, setDocFileName] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // ---------------------------------------------------------
  // Disbursement confirmation
  // ---------------------------------------------------------
  const [isDisburseConfirmOpen, setIsDisburseConfirmOpen] = useState(false);
  const [disbursing, setDisbursing] = useState(false);

  const pageSize = queueViewMode === "grid" ? GRID_PAGE_SIZE : LIST_PAGE_SIZE;

  // ---------------------------------------------------------
  // Fetch queue loans for TABLE/GRID (listLoans + params)
  // ---------------------------------------------------------
  const fetchQueueLoans = useCallback(async () => {
    setQueueLoading(true);
    try {
      const params: any = {
        page: queuePage,
        limit: pageSize,
        sortBy: "createdAt",
        sortOrder: "desc",
      };

      if (debouncedSearch) params.search = debouncedSearch;
      if (queueStatus !== "All") params.status = queueStatus;

      const response = await loanService.listLoans(params);
      setQueueLoans(response.items);
      setQueueTotal(response.meta.totalItems);
    } catch (error) {
      console.error("Failed to fetch KYC queue:", error);
      setQueueLoans([]);
      setQueueTotal(0);
    } finally {
      setQueueLoading(false);
    }
  }, [queuePage, pageSize, debouncedSearch, queueStatus, refresh]);

  useEffect(() => {
    fetchQueueLoans();
  }, [fetchQueueLoans]);

  // ---------------------------------------------------------
  // Fetch dropdown loans (KYC_Pending only)
  // ---------------------------------------------------------
  const fetchDropdownLoans = useCallback(async () => {
    setDropdownLoading(true);
    try {
      const loans = await loanService.getLoansListByStatus([
        "KYC_Pending",
        "Approved_Pending_Disbursement",
      ]);
      setDropdownLoans(loans);
    } catch (error) {
      console.error("Failed to fetch dropdown loans:", error);
      setDropdownLoans([]);
    } finally {
      setDropdownLoading(false);
    }
  }, [refresh]);

  useEffect(() => {
    fetchDropdownLoans();
  }, [fetchDropdownLoans]);

  // Reset page when filters change
  const handleStatusFilterChange = (status: string) => {
    setQueueStatus(status);
    setQueuePage(1);
  };

  // ---------------------------------------------------------
  // Auto-select first loan from dropdown if none selected
  // ---------------------------------------------------------
  useEffect(() => {
    if (!selectedLoanId && dropdownLoans.length > 0) {
      setSelectedLoanId(dropdownLoans[0].id);
    }
  }, [dropdownLoans, selectedLoanId]);

  // ---------------------------------------------------------
  // Fetch current loan details
  // ---------------------------------------------------------
  const fetchCurrentLoan = useCallback(async (loanId: string) => {
    setLoanLoading(true);
    try {
      const loan = await loanService.getLoanById(loanId);
      setCurrentLoan(loan);

      // Fill form data
      setFormData({
        idNumber: loan.customer?.idNumber || "",
        idType: loan.customer?.idType || "NIC",
        dateOfBirth: toDateInput(loan.customer?.dateOfBirth || ""),
        gender: loan.customer?.gender || "Male",
        occupation: loan.customer?.occupation || "",
        employerName: loan.customer?.employerName || "",
        monthlyIncome: loan.customer?.monthlyIncome?.toString() || "0",
        addressLine: loan.customer?.addressLine || "",
        city: loan.customer?.city || "",
        postalCode: loan.customer?.postalCode || "",
        guarantorName: loan.guarantor?.fullName || "",
        guarantorPhone: loan.guarantor?.phone || "",
        guarantorRelation: loan.guarantor?.relation || "Relative",
        deductedFee: loan.processingFee.toString() || "0",
        // bankName: loan.kyc?.bankName || "",
        // accountNumber: loan.kyc?.accountNumber || "",
      });
    } catch (error) {
      console.error("Failed to fetch loan:", error);
      setCurrentLoan(null);
    } finally {
      setLoanLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedLoanId) {
      fetchCurrentLoan(selectedLoanId);
    }
  }, [selectedLoanId, fetchCurrentLoan, refresh]);

  // ---------------------------------------------------------
  // Form handlers
  // ---------------------------------------------------------
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        // name === "monthlyIncome"
        //   ? parseFloat(value) || 0
        //   :
        value,
    }));
  };

  const handleSaveKYC = async () => {
    if (!currentLoan) return;
    setSaving(true);
    try {
      const kycPayload: KYCPayload = {
        customer: {
          idNumber: formData.idNumber,
          idType: formData.idType as any,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          occupation: formData.occupation,
          employerName: formData.employerName,
          monthlyIncome: Number(formData.monthlyIncome),
          addressLine: formData.addressLine,
          city: formData.city,
          postalCode: formData.postalCode,
        },
        guarantor: {
          fullName: formData.guarantorName,
          phone: formData.guarantorPhone,
          relation: formData.guarantorRelation,
        },
        // bankName: formData.bankName,
        // accountNumber: formData.accountNumber,
      };

      await loanService.updateKYC(currentLoan.id, kycPayload);

      onRefresh();

      // await fetchCurrentLoan(currentLoan.id);
      // await fetchQueueLoans();
      // await fetchDropdownLoans();
    } catch (error) {
      // Error already toasted in service
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------
  // KYC save button state
  // ---------------------------------------------------------
  const isKycSaveDisabled = saving || currentLoan?.status !== "KYC_Pending";

  const kycSaveLabel = (() => {
    if (!currentLoan) return "Save KYC Information";
    if (saving) return "Saving...";
    if (currentLoan.status === "KYC_Pending") return "Save KYC Information";

    switch (currentLoan.status) {
      case "Pending_Approval":
        return "Awaiting Approval";
      case "Approved_Pending_Disbursement":
        return "KYC Completed";
      case "Active":
      case "Overdue":
      case "Settled":
      case "Early_Settled":
        return "Loan Disbursed";
      case "Rejected":
        return "Application Rejected";
      default:
        return "KYC Locked";
    }
  })();

  // ---------------------------------------------------------
  // Document upload
  // ---------------------------------------------------------
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setDocFile(file);
    setDocFileName(file.name);
  };

  const handleUploadDocument = async () => {
    if (!currentLoan || !docFile || !docFileName.trim()) {
      toast.error("Please select a file and provide a name");
      return;
    }

    setUploading(true);
    try {
      // Step 1: Presign
      const presign = await loanService.presignDocument(currentLoan.id, {
        fileName: docFileName,
        contentType: docFile.type || "application/octet-stream",
        documentType: docType,
      });

      // Step 2: Upload file to storage (direct PUT)
      await fetch(presign.uploadUrl, {
        method: "PUT",
        body: docFile,
        headers: { "Content-Type": docFile.type },
      });

      // Step 3: Attach document
      await loanService.attachDocument(currentLoan.id, {
        documentId: presign.documentId,
        key: presign.key,
        documentType: docType,
        fileName: docFileName,
      });

      toast.success("Document uploaded successfully");
      setIsDocUploadOpen(false);
      setDocFile(null);
      setDocFileName("");

      onRefresh();

      // await fetchCurrentLoan(currentLoan.id);
      // await fetchQueueLoans();
      // await fetchDropdownLoans();
    } catch (error: any) {
      console.error("Upload failed:", error);
      toast.error(error.message || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  // ---------------------------------------------------------
  // Disbursement
  // ---------------------------------------------------------
  const handleConfirmDisbursement = async () => {
    if (!currentLoan) return;
    setDisbursing(true);
    try {
      await loanService.disburseLoan(
        currentLoan.id,
        Number(formData.deductedFee),
      );
      setIsDisburseConfirmOpen(false);

      onRefresh();

      // await fetchCurrentLoan(currentLoan.id);
      // await fetchQueueLoans();
      // await fetchDropdownLoans();
    } catch (error) {
      // Error already toasted in service
    } finally {
      setDisbursing(false);
    }
  };

  // ---------------------------------------------------------
  // Handlers for queue selection
  // ---------------------------------------------------------
  const handleSelectLoan = (loanId: string) => {
    setSelectedLoanId(loanId);
    setShowQueue(false);
  };

  // ---------------------------------------------------------
  // Derived
  // ---------------------------------------------------------
  const isLoanAlreadyActive =
    currentLoan?.status === "Active" ||
    currentLoan?.status === "Overdue" ||
    currentLoan?.status === "Settled";

  const verifiedDocsCount =
    currentLoan?.documents?.filter((d) => d.status === "Verified").length || 0;
  const totalDocs = currentLoan?.documents?.length || 0;
  const netDisbursedAmount = currentLoan
    ? Number(currentLoan.requestedAmount) - (Number(formData.deductedFee) || 0)
    : 0;

  const isFeeInvalid =
    Number(formData.deductedFee) < 0 ||
    Number(formData.deductedFee) > Number(currentLoan?.requestedAmount ?? 0);

  // ---------------------------------------------------------
  // Render
  // ---------------------------------------------------------
  return (
    <div className="space-y-4 flex flex-col h-full min-h-0">
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
            value={
              selectedLoanId &&
              dropdownLoans.some((l) => l.id === selectedLoanId)
                ? selectedLoanId
                : " "
            }
            onChange={(e) => setSelectedLoanId(e.target.value)}
            disabled={dropdownLoading}
            className="bg-white text-slate-800 font-medium text-xs py-1.5 px-3 rounded-lg border border-slate-200/80 focus:outline-none focus:ring-1 focus:ring-slate-300 max-w-70 disabled:opacity-60"
          >
            <option value=" " disabled>
              {dropdownLoading
                ? "Loading loans..."
                : "Select a KYC pending loan..."}
            </option>
            {dropdownLoans.map((l) => (
              <option key={l.id} value={l.id}>
                {l.customer?.fullName} ({l.loanNumber}) -{" "}
                {getLoanStatusLabel(l.status)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* QUEUE (filters, table/grid) */}
      {showQueue && (
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                KYC Verification Queue ({queueTotal})
              </h3>
              <span className="text-[10px] text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded">
                Click any row/card to open KYC file
              </span>

              {/* Status filter buttons */}
              <div className="flex items-center gap-1 flex-wrap">
                {STATUS_FILTERS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => handleStatusFilterChange(s.value)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition cursor-pointer ${
                      queueStatus === s.value
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* List vs Grid */}
              <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200/80">
                <button
                  onClick={() => {
                    setQueueViewMode("list");
                    setQueuePage(1);
                  }}
                  className={`p-1 rounded text-xs font-medium flex items-center gap-1 transition cursor-pointer ${
                    queueViewMode === "list"
                      ? "bg-white text-blue-700 shadow-2xs"
                      : "text-slate-600"
                  }`}
                  title="List View"
                >
                  <LayoutList className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    setQueueViewMode("grid");
                    setQueuePage(1);
                  }}
                  className={`p-1 rounded text-xs font-medium flex items-center gap-1 transition cursor-pointer ${
                    queueViewMode === "grid"
                      ? "bg-white text-blue-700 shadow-2xs"
                      : "text-slate-600"
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Search */}
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

          {/* Queue body */}
          {queueLoading ? (
            queueViewMode === "list" ? (
              <div className="overflow-x-auto border border-slate-100 rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/60">
                    <tr>
                      <th className="p-2.5">Loan ID</th>
                      <th className="p-2.5">Customer & ID</th>
                      <th className="p-2.5">Product</th>
                      <th className="p-2.5 text-right">Amount</th>
                      <th className="p-2.5 text-center">Docs</th>
                      <th className="p-2.5 text-center">Status</th>
                      <th className="p-2.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Array.from({ length: LIST_PAGE_SIZE }).map((_, i) => (
                      <QueueSkeletonRow key={`sk-${i}`} />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Array.from({ length: GRID_PAGE_SIZE }).map((_, i) => (
                  <QueueSkeletonCard key={`sk-${i}`} />
                ))}
              </div>
            )
          ) : queueViewMode === "list" ? (
            <div className="overflow-x-auto border border-slate-100 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/60">
                  <tr>
                    <th className="p-2.5">Loan ID</th>
                    <th className="p-2.5">Customer & ID</th>
                    <th className="p-2.5">Product</th>
                    <th className="p-2.5 text-right">Amount</th>
                    <th className="p-2.5 text-center">Docs</th>
                    <th className="p-2.5 text-center">Status</th>
                    <th className="p-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {queueLoans.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-4 text-center text-xs text-slate-400"
                      >
                        No loans found for this status.
                      </td>
                    </tr>
                  ) : (
                    queueLoans.map((l) => {
                      const isSelected = l.id === selectedLoanId;
                      const verifiedCount =
                        l.kyc?.documents?.filter((d) => d.status === "Verified")
                          .length || 0;
                      const total = l.kyc?.documents?.length || 0;

                      return (
                        <tr
                          key={l.id}
                          onClick={() => handleSelectLoan(l.id)}
                          className={`transition cursor-pointer ${
                            isSelected
                              ? "bg-blue-50/70 font-semibold"
                              : "hover:bg-slate-50/80"
                          }`}
                        >
                          <td className="p-2.5 font-mono text-[11px] text-slate-900">
                            {l.loanNumber}
                          </td>
                          <td className="p-2.5">
                            <span className="font-bold text-slate-900 block">
                              {l.customer?.fullName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {l.customer?.idNumber}
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-600">
                            {getLoanTypeLabel(l.loanType)}
                          </td>
                          <td className="p-2.5 text-right font-bold text-slate-900">
                            {formatCurrency(l.requestedAmount)}
                          </td>
                          <td className="p-2.5 text-center font-mono text-[11px]">
                            {verifiedCount} / {total}
                          </td>
                          <td className="p-2.5 text-center font-mono text-[11px]">
                            <span
                              className={`${getLoanStatusColor(l.status)} text-[10px] px-2.5 py-0.5 rounded-full font-medium`}
                            >
                              {getLoanStatusLabel(l.status)}
                            </span>
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectLoan(l.id);
                              }}
                              className={`px-2 py-1 rounded text-[11px] font-medium transition cursor-pointer ${
                                isSelected
                                  ? "bg-blue-600 text-white"
                                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                              }`}
                            >
                              {isSelected ? "Opened" : "Open"}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {queueLoans.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-4 sm:col-span-2 md:col-span-3 lg:col-span-4">
                  No loans found for this status.
                </div>
              ) : (
                queueLoans.map((l) => {
                  const isSelected = l.id === selectedLoanId;
                  const verifiedDocs =
                    l.kyc?.documents?.filter((d) => d.status === "Verified")
                      .length || 0;
                  const totalDocsCard = l.kyc?.documents?.length || 0;

                  return (
                    <div
                      key={l.id}
                      onClick={() => handleSelectLoan(l.id)}
                      className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                        isSelected
                          ? "border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20"
                          : "border-slate-200/80 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono font-bold text-slate-900">
                          {l.loanNumber}
                        </span>
                        <span
                          className={`${getLoanStatusColor(l.status)} text-[8px] px-1.5 py-0.2 rounded-full font-medium`}
                        >
                          {getLoanStatusLabel(l.status)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-xs text-slate-900 truncate">
                          {l.customer?.fullName}
                        </h4>
                        <span
                          className={`text-[8px] px-1.5 py-0.2 rounded-full font-medium ${
                            l.customer?.isVerified
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                              : "bg-amber-50 text-amber-700 border border-amber-200/60"
                          }`}
                        >
                          {l.customer?.isVerified
                            ? "Verified"
                            : "Verification Pending"}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono">
                        NIC: {l.customer?.idNumber}
                      </p>
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                        <span className="font-bold text-slate-900">
                          {formatCurrency(l.requestedAmount)}
                        </span>
                        <span className="text-slate-500">
                          {verifiedDocs}/{totalDocsCard} Docs
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {queueLoans.length > 0 && (
            <Pagination
              currentPage={queuePage}
              totalItems={queueTotal}
              pageSize={pageSize}
              onPageChange={setQueuePage}
              itemName="queue records"
            />
          )}
        </div>
      )}

      {/* LOAN DETAIL + FORM */}
      {!currentLoan && !loanLoading ? (
        <div className="flex-1 flex items-center justify-center bg-white border border-slate-200/80 p-8 rounded-xl text-center text-slate-500 shadow-2xs">
          <div>
            <ShieldCheck className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="font-bold text-slate-800 text-sm">No Loan Selected</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Select a loan from the queue above to start KYC verification.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Main Grid: KYC Form + Documents + Disbursement */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: KYC Form */}
            <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-xl px-5 pt-2 pb-5 shadow-2xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="w-full">
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                    Loan
                  </span>
                  <div className="flex items-center justify-between mb-2">
                    {loanLoading ? (
                      <SkeletonText className="w-48" />
                    ) : (
                      <h3 className="text-sm font-semibold text-slate-900">
                        {currentLoan?.loanNumber}
                      </h3>
                    )}
                    {loanLoading ? (
                      <div className="h-5 w-24 bg-slate-100 rounded-full animate-pulse" />
                    ) : (
                      <div className="flex items-center gap-2">
                        <span
                          className={`${getLoanStatusColor(currentLoan?.status || "")} text-[10px] px-2.5 py-0.5 rounded-full font-medium`}
                        >
                          {getLoanStatusLabel(currentLoan?.status || "")}
                        </span>
                        {currentLoan?.id && (
                          <button
                            onClick={() => onOpenLoanDetails(currentLoan.id)}
                            className="p-1.5 text-slate-600 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 rounded-lg transition shrink-0 cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                    Applicant Verification
                  </span>
                  <div className="flex items-center justify-between">
                    {loanLoading ? (
                      <SkeletonText className="w-56" />
                    ) : (
                      <h3 className="text-sm font-semibold text-slate-900">
                        {currentLoan?.customer?.fullName} (
                        {currentLoan?.customer?.customerNumber})
                      </h3>
                    )}
                    {loanLoading ? (
                      <div className="h-5 w-28 bg-slate-100 rounded-full animate-pulse" />
                    ) : (
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium ${
                          currentLoan?.customer?.isVerified
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                            : "bg-amber-50 text-amber-700 border border-amber-200/60"
                        }`}
                      >
                        {currentLoan?.customer?.isVerified
                          ? "Verified"
                          : "Verification Pending"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveKYC();
                }}
                className="space-y-4"
              >
                {/* Section 1: Personal & Employment */}
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
                      <FieldSlot loading={loanLoading}>
                        <select
                          name="idType"
                          value={formData.idType}
                          onChange={handleInputChange}
                          className="w-full bg-white text-slate-800 text-xs py-1.5 px-3 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:text-slate-500"
                          required
                          disabled={isKycSaveDisabled}
                        >
                          <option value="NIC">NIC / National ID</option>
                          <option value="Passport">Passport</option>
                          <option value="Driver_License">Driver License</option>
                        </select>
                      </FieldSlot>
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-slate-600 block mb-1">
                        ID Number
                      </label>
                      <FieldSlot loading={loanLoading}>
                        <input
                          type="text"
                          name="nationalIdNumber"
                          value={formData.idNumber}
                          onChange={handleInputChange}
                          className="w-full bg-white text-slate-800 text-xs py-1.5 px-3 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono disabled:text-slate-500"
                          placeholder="e.g. 982-11-4092"
                          required
                          disabled={isKycSaveDisabled}
                        />
                      </FieldSlot>
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-slate-600 block mb-1">
                        Date of Birth
                      </label>
                      <FieldSlot loading={loanLoading}>
                        <input
                          type="date"
                          name="dateOfBirth"
                          value={formData.dateOfBirth}
                          onChange={handleInputChange}
                          className="w-full bg-white text-slate-800 text-xs py-1.5 px-3 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:text-slate-500"
                          required
                          disabled={isKycSaveDisabled}
                        />
                      </FieldSlot>
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-slate-600 block mb-1">
                        Gender
                      </label>
                      <FieldSlot loading={loanLoading}>
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleInputChange}
                          className="w-full bg-white text-slate-800 text-xs py-1.5 px-3 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:text-slate-500"
                          required
                          disabled={isKycSaveDisabled}
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </FieldSlot>
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-slate-600 block mb-1">
                        Occupation
                      </label>
                      <FieldSlot loading={loanLoading}>
                        <input
                          type="text"
                          name="occupation"
                          value={formData.occupation}
                          onChange={handleInputChange}
                          className="w-full bg-white text-slate-800 text-xs py-1.5 px-3 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:text-slate-500"
                          placeholder="e.g. Software Engineer"
                          required
                          disabled={isKycSaveDisabled}
                        />
                      </FieldSlot>
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-slate-600 block mb-1">
                        Monthly Income (LKR)
                      </label>
                      <FieldSlot loading={loanLoading}>
                        <input
                          type="number"
                          name="monthlyIncome"
                          value={formData.monthlyIncome}
                          placeholder="0"
                          onChange={handleInputChange}
                          className="w-full bg-white text-slate-800 text-xs py-1.5 px-3 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold disabled:text-slate-500"
                          required
                          disabled={isKycSaveDisabled}
                        />
                      </FieldSlot>
                    </div>
                  </div>
                </div>

                {/* Section 2: Address */}
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
                      <FieldSlot loading={loanLoading}>
                        <input
                          type="text"
                          name="addressLine"
                          value={formData.addressLine}
                          onChange={handleInputChange}
                          className="w-full bg-white text-slate-800 text-xs py-1.5 px-3 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:text-slate-500"
                          required
                          disabled={isKycSaveDisabled}
                        />
                      </FieldSlot>
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-slate-600 block mb-1">
                        City
                      </label>
                      <FieldSlot loading={loanLoading}>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          className="w-full bg-white text-slate-800 text-xs py-1.5 px-3 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:text-slate-500"
                          required
                          disabled={isKycSaveDisabled}
                        />
                      </FieldSlot>
                    </div>
                  </div>
                </div>

                {/* Section 3: Guarantor */}
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
                      <FieldSlot loading={loanLoading}>
                        <input
                          type="text"
                          name="guarantorName"
                          value={formData.guarantorName}
                          onChange={handleInputChange}
                          className="w-full bg-white text-slate-800 text-xs py-1.5 px-3 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:text-slate-500"
                          required
                          disabled={isKycSaveDisabled}
                        />
                      </FieldSlot>
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-slate-600 block mb-1">
                        Guarantor Contact
                      </label>
                      <FieldSlot loading={loanLoading}>
                        <input
                          type="text"
                          name="guarantorPhone"
                          value={formData.guarantorPhone}
                          onChange={handleInputChange}
                          className="w-full bg-white text-slate-800 text-xs py-1.5 px-3 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:text-slate-500"
                          required
                          disabled={isKycSaveDisabled}
                        />
                      </FieldSlot>
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-slate-600 block mb-1">
                        Guarantor Relation
                      </label>
                      <FieldSlot loading={loanLoading}>
                        <input
                          type="text"
                          name="guarantorRelation"
                          value={formData.guarantorRelation}
                          onChange={handleInputChange}
                          className="w-full bg-white text-slate-800 text-xs py-1.5 px-3 rounded-lg border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:text-slate-500"
                          required
                          disabled={isKycSaveDisabled}
                        />
                      </FieldSlot>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  {!loanLoading &&
                    currentLoan &&
                    currentLoan.status !== "KYC_Pending" && (
                      <p className="text-[10px] text-slate-500 text-right mr-2 mb-1">
                        {currentLoan.status === "Pending_Approval" &&
                          "KYC form unlocks after loan approval."}
                        {currentLoan.status ===
                          "Approved_Pending_Disbursement" &&
                          "KYC has been submitted. Waiting for disbursement."}
                        {(currentLoan.status === "Active" ||
                          currentLoan.status === "Overdue" ||
                          currentLoan.status === "Settled" ||
                          currentLoan.status === "Early_Settled") &&
                          "Loan is already disbursed — KYC is locked."}
                        {currentLoan.status === "Rejected" &&
                          "This application has been rejected."}
                      </p>
                    )}
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isKycSaveDisabled || loanLoading}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer flex items-center gap-1.5 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {saving && (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      )}
                      <span>{loanLoading ? "Loading..." : kycSaveLabel}</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Right Column: Documents + Disbursement */}
            <div className="space-y-4">
              {/* Documents Card */}
              <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Compliance Files
                  </h3>
                  <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {loanLoading
                      ? "— / —"
                      : // : `${verifiedDocsCount} / ${totalDocs}`}{" "}
                        `${totalDocs}`}{" "}
                    Verified
                  </span>
                </div>

                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {loanLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="bg-slate-50/60 p-3 rounded-lg border border-slate-200/60 flex items-center justify-between gap-2 animate-pulse"
                      >
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="h-2.5 w-24 bg-slate-200 rounded" />
                          <div className="h-3 w-40 bg-slate-200 rounded" />
                        </div>
                        <div className="h-5 w-16 bg-slate-200 rounded-full shrink-0" />
                      </div>
                    ))
                  ) : currentLoan?.documents &&
                    currentLoan.documents.length > 0 ? (
                    currentLoan.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="bg-slate-50/60 p-3 rounded-lg border border-slate-200/60 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <span className="text-[10px] text-slate-400 font-medium block">
                            {getDocumentTypeLabel(doc.documentType)}
                          </span>
                          <span className="text-xs font-medium text-slate-800 truncate block">
                            {doc.fileName}
                          </span>
                        </div>
                        {/* <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-medium flex items-center gap-1 shrink-0 ${
                            doc.status === "Verified"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {doc.status === "Verified" ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />{" "}
                              Verified
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-amber-600" />{" "}
                              Pending
                            </>
                          )}
                        </span> */}
                        <button
                          onClick={() => openDocumentPreview(doc)}
                          className="p-1.5 text-slate-600 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 rounded-lg transition shrink-0 cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-4">
                      No documents uploaded yet.
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setIsDocUploadOpen(true)}
                    disabled={loanLoading || !currentLoan}
                    className="w-full flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium py-2 px-3 rounded-lg transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Upload className="w-3.5 h-3.5 text-slate-600" />
                    <span>Upload Document</span>
                  </button>
                </div>
              </div>

              {/* Disbursement Card */}
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
                    {loanLoading ? (
                      <SkeletonText className="w-24" />
                    ) : (
                      <span className="font-medium text-slate-900">
                        {formatCurrency(currentLoan?.requestedAmount || 0)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="deductedFee"
                      className="text-slate-500 shrink-0"
                    >
                      Fee Deducted:
                    </label>
                    <div>
                      <span className="font-bold text-slate-900 text-xs pr-2">
                        LKR
                      </span>
                      {loanLoading ? (
                        <span className="inline-block h-6 w-28 bg-slate-100 rounded-md animate-pulse align-middle" />
                      ) : (
                        <input
                          id="deductedFee"
                          type="number"
                          name="deductedFee"
                          value={formData.deductedFee}
                          onChange={handleInputChange}
                          placeholder="0"
                          step="0.01"
                          disabled={
                            isLoanAlreadyActive ||
                            currentLoan?.status !==
                              "Approved_Pending_Disbursement"
                          }
                          className="w-28 text-right bg-white text-slate-900 text-xs py-1 px-2 rounded-md border border-slate-200/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-50 disabled:px-0 disabled:text-slate-500 font-semibold"
                        />
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-slate-200/60">
                    <span className="text-slate-900 font-semibold">
                      Net Disbursed:
                    </span>
                    {loanLoading ? (
                      <SkeletonText className="w-24" />
                    ) : (
                      <span className="font-bold text-slate-900 text-xs">
                        {formatCurrency(netDisbursedAmount)}
                      </span>
                    )}
                  </div>
                </div>

                {loanLoading ? (
                  <div className="h-10 w-full bg-slate-100 rounded-lg animate-pulse" />
                ) : isLoanAlreadyActive ? (
                  <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded-lg text-center text-xs font-medium">
                    ✓ Loan disbursed on {currentLoan?.disbursedDate || "Record"}
                    .
                  </div>
                ) : currentLoan?.status !== "Approved_Pending_Disbursement" ? (
                  <div className="bg-amber-50 text-amber-800 border border-amber-200/60 p-2.5 rounded-lg text-center text-xs font-medium flex items-center justify-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    <span>
                      {currentLoan?.status === "KYC_Pending"
                        ? "Complete KYC verification before disbursing."
                        : currentLoan?.status === "Pending_Approval"
                          ? "Loan must be approved before disbursement."
                          : currentLoan?.status === "Rejected"
                            ? "Rejected loans cannot be disbursed."
                            : `Loan must be Approved - Pending Disbursement to disburse (current: ${getLoanStatusLabel(currentLoan?.status || "")}).`}
                    </span>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setIsDisburseConfirmOpen(true)}
                      disabled={isFeeInvalid}
                      className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-3 rounded-lg shadow-2xs text-xs transition cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>Grant & Disburse Loan</span>
                    </button>

                    {isFeeInvalid && (
                      <p className="text-[10px] text-red-600 text-center">
                        {Number(formData.deductedFee) < 0
                          ? "Deducted fee cannot be negative."
                          : "Deducted fee cannot exceed the loan amount."}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Document Upload Modal */}
      {isDocUploadOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200/80 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Upload Document
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {currentLoan?.customer?.fullName} •{" "}
                    {currentLoan?.loanNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDocUploadOpen(false)}
                disabled={uploading}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 block">
                  Document Type *
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  disabled={uploading}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-hidden"
                >
                  {DOCUMENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 block">
                  Document Name *
                </label>
                <input
                  type="text"
                  value={docFileName}
                  onChange={(e) => setDocFileName(e.target.value)}
                  placeholder="e.g. national-id-front.jpg"
                  disabled={uploading}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 block">
                  Select File *
                </label>
                <label className="flex items-center justify-center gap-2 px-3 py-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-100 transition">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span className="text-xs text-slate-600">
                    {docFile ? docFile.name : "Click to browse a file"}
                  </span>
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    accept="image/*,application/pdf"
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="p-4 bg-slate-50/50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setIsDocUploadOpen(false)}
                disabled={uploading}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadDocument}
                disabled={uploading || !docFile || !docFileName.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg text-xs transition shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                {uploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{uploading ? "Uploading..." : "Upload Document"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disbursement Confirmation */}
      {currentLoan && (
        <ConfirmModal
          isOpen={isDisburseConfirmOpen}
          onClose={() => setIsDisburseConfirmOpen(false)}
          onConfirm={handleConfirmDisbursement}
          title="Confirm Loan Fund Disbursement"
          description="Are you sure you want to release and disburse funds for this loan? This action will mark the loan as Active and initialize the repayment installment schedule."
          confirmLabel="Authorize & Disburse Funds"
          cancelLabel="Cancel"
          variant="success"
          isLoading={disbursing}
          details={[
            { label: "Loan Reference", value: currentLoan.loanNumber },
            {
              label: "Borrower",
              value: currentLoan.customer?.fullName || "N/A",
            },
            {
              label: "Net Disbursed Amount",
              value: formatCurrency(netDisbursedAmount),
            },
          ]}
        />
      )}
    </div>
  );
};
