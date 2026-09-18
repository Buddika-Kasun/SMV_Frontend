import React, { useRef } from "react";
import { formatCurrency } from "../utils/consultancyUtils";
import {
  Building2,
  Award,
  Printer,
  X,
  CreditCard,
  User,
  Download,
  CheckCircle2,
} from "lucide-react";
import { Loan, EarlySettlementQuote } from "../api";
import {
  getInterestMethodLabel,
  getLoanStatusLabel,
  toDateInput,
} from "../utils/loanUtils";

import logoIcon from "@/src/assets/logo2.jpg";

interface ClearanceCertificateModalProps {
  loan: Loan;
  quote?: EarlySettlementQuote | null;
  onClose: () => void;
}

export const ClearanceCertificateModal: React.FC<
  ClearanceCertificateModalProps
> = ({ loan, quote, onClose }) => {
  const certRef = useRef<HTMLDivElement>(null);

  // -----------------------------------------------------------------
  // Capture certificate as PNG dataURL
  // -----------------------------------------------------------------
  const captureCertificate = async (): Promise<string> => {
    const cert = certRef.current;
    if (!cert) throw new Error("Certificate element not found");

    const { toPng } = await import("html-to-image");

    // Temporarily expand so full content is captured
    const prevMaxHeight = cert.style.maxHeight;
    const prevOverflow = cert.style.overflow;
    cert.style.maxHeight = "none";
    cert.style.overflow = "visible";

    try {
      const dataUrl = await toPng(cert, {
        pixelRatio: 4,
        backgroundColor: "#ffffff",
        cacheBust: true,
        skipAutoScale: true,
      });
      return dataUrl;
    } finally {
      cert.style.maxHeight = prevMaxHeight;
      cert.style.overflow = prevOverflow;
    }
  };

  // -----------------------------------------------------------------
  // PRINT — only the certificate image
  // -----------------------------------------------------------------
  const handlePrint = async () => {
    try {
      const dataUrl = await captureCertificate();

      const img = new Image();
      img.src = dataUrl;
      await new Promise<void>((res) => {
        img.onload = () => res();
        img.onerror = () => res();
      });

      const pxToMm = 3.7795275591;
      const widthMm = img.naturalWidth / 1.8 / pxToMm;
      const heightMm = img.naturalHeight / 2.2 / pxToMm;

      const win = window.open("", "_blank", "width=800,height=900");
      if (!win) {
        alert("Please allow popups to print the certificate.");
        return;
      }

      win.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Clearance-${loan.loanNumber || loan.id}</title>
            <style>
              @page { size: ${widthMm}mm ${heightMm}mm; margin: 0; }
              * { margin: 0; padding: 0; box-sizing: border-box; }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                width: ${widthMm}mm;
                height: ${heightMm}mm;
                background: #fff;
                overflow: hidden;
              }
              img {
                display: block;
                width: ${widthMm}mm;
                height: ${heightMm}mm;
                margin: 0;
                padding: 0;
              }
            </style>
          </head>
          <body>
            <img src="${dataUrl}" />
            <script>
              window.onload = function () {
                window.focus();
                setTimeout(function () {
                  window.print();
                  setTimeout(function () { window.close(); }, 500);
                }, 100);
              };
            </script>
          </body>
        </html>
      `);
      win.document.close();
    } catch (err) {
      console.error("Print failed:", err);
      alert("Failed to print. See console for details.");
    }
  };

  // -----------------------------------------------------------------
  // DOWNLOAD PDF
  // -----------------------------------------------------------------
  const handleDownloadPdf = async () => {
    try {
      const dataUrl = await captureCertificate();

      const img = new Image();
      img.src = dataUrl;
      await new Promise<void>((res) => {
        img.onload = () => res();
        img.onerror = () => res();
      });

      const pxToMm = 3.7795275591;
      const widthMm = img.naturalWidth / 4 / pxToMm;
      const heightMm = img.naturalHeight / 4 / pxToMm;

      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({
        orientation: widthMm > heightMm ? "landscape" : "portrait",
        unit: "mm",
        format: [widthMm, heightMm],
      });

      pdf.addImage(dataUrl, "PNG", 0, 0, widthMm, heightMm);
      pdf.save(`Clearance-${loan.loanNumber || loan.id}.pdf`);
    } catch (err) {
      console.error("PDF download failed:", err);
      alert("Failed to generate PDF. See console for details.");
    }
  };

  // -----------------------------------------------------------------
  // Derived values
  // -----------------------------------------------------------------
  const isEarlySettled = loan.status === "Early_Settled";

  const totalInstallments = loan.installments?.length || 0;
  const paidInstallments =
    loan.installments?.filter((i) => i.status === "Paid").length || 0;

  const totalPaidAmount = loan.totalPaidAmount || 0;

  const originalPrincipal =
    loan.account?.disbursedAmount || loan.requestedAmount || 0;

  const totalInterestPaid = loan.payments
    ? loan.payments.reduce((sum, p) => sum + (p.allocatedInterest || 0), 0)
    : 0;

  const totalPrincipalPaid = loan.payments
    ? loan.payments.reduce((sum, p) => sum + (p.allocatedPrincipal || 0), 0)
    : 0;

  const issueDate = new Date().toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200/80 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header Bar — pinned (not captured) */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
              <Award className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 text-xs block">
                Loan Clearance Certificate
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                CLR-{loan.loanNumber || loan.id}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDownloadPdf}
              className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 text-xs font-semibold flex items-center gap-1 transition shadow-2xs cursor-pointer"
              title="Download Certificate as PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden sm:inline">PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 text-xs font-semibold flex items-center gap-1 transition shadow-2xs cursor-pointer"
              title="Print Certificate"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden sm:inline">Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Certificate Content — this div is captured */}
        <div className="overflow-y-auto flex-1 min-h-0">
          <div ref={certRef} className="p-6 space-y-4 text-xs bg-white">
            {/* Company Branding */}
            <div className="text-center pb-3 border-b border-slate-100 space-y-0.5">
              <div className="flex items-center justify-center gap-1.5 text-slate-900 font-bold text-sm">
                {/* <Building2 className="w-4 h-4 text-blue-600" /> */}
                <img
                  src={logoIcon}
                  alt="SMV Holdings"
                  className="w-8 h-8 object-contain rounded-full"
                />
                <span>SMV HOLDINGS (PVT) LTD</span>
              </div>
              <p className="text-[10px] text-slate-500">
                Microfinance & SME Credit Division • Colombo, Sri Lanka
              </p>
              <p className="text-[10px] text-slate-400 font-mono mt-1">
                CLR-{loan.loanNumber || loan.id}
              </p>
            </div>

            {/* Certificate Hero */}
            <div className="bg-slate-900 text-white p-4 rounded-xl text-center space-y-1">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] uppercase tracking-wider text-slate-300 font-semibold">
                  Loan Clearance Certificate
                </span>
              </div>
              <div className="text-lg font-black tracking-tight text-white">
                {loan.customer?.fullName}
              </div>
              <div className="text-[10px] text-slate-300 font-mono">
                NIC: {loan.customer?.idNumber || "—"}
              </div>
              <div className="text-[10px] text-emerald-400 font-medium pt-1">
                {isEarlySettled
                  ? "Early Settled — Paid in Full"
                  : "Fully Settled — Paid in Full"}
              </div>
            </div>

            {/* Certification Statement */}
            <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-xl p-3 text-center space-y-1">
              <p className="text-[11px] text-emerald-900 font-semibold">
                This certifies that the loan contract has been fully cleared.
              </p>
              <p className="text-[10px] text-emerald-700">
                All principal, interest, and applicable fees have been settled
                in full. No further obligations remain.
              </p>
            </div>

            {/* Loan Details */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60">
                <span className="text-[10px] text-slate-500 font-medium block">
                  Loan Contract
                </span>
                <span className="font-bold text-slate-900 text-xs font-mono">
                  {loan.loanNumber || loan.id}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60">
                <span className="text-[10px] text-slate-500 font-medium block">
                  Interest Method
                </span>
                <span className="font-bold text-slate-900 text-xs">
                  {getInterestMethodLabel(loan.interestMethod)}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60">
                <span className="text-[10px] text-slate-500 font-medium block">
                  Term
                </span>
                <span className="font-bold text-slate-900 text-xs">
                  {loan.termMonths} Months
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60">
                <span className="text-[10px] text-slate-500 font-medium block">
                  Settled Date
                </span>
                <span className="font-bold text-emerald-700 text-xs font-mono">
                  {loan.settledDate ? toDateInput(loan.settledDate) : "—"}
                </span>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-200/60 space-y-2 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">
                  Original Principal Disbursed
                </span>
                <span className="font-mono font-medium text-slate-800">
                  {formatCurrency(originalPrincipal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Principal Repaid</span>
                <span className="font-mono font-medium text-slate-800">
                  {formatCurrency(totalPrincipalPaid)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Interest Paid</span>
                <span className="font-mono font-medium text-slate-800">
                  {formatCurrency(totalInterestPaid)}
                </span>
              </div>
              {quote && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500">
                      Early Settlement Penalty
                    </span>
                    <span className="font-mono font-medium text-slate-800">
                      {formatCurrency(quote.earlySettlementPenaltyFee)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">
                      Future Interest Waived
                    </span>
                    <span className="font-mono font-medium text-emerald-600">
                      - {formatCurrency(quote.unearnedFutureInterestWaived)}
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Installments Completed</span>
                <span className="font-medium text-slate-800">
                  {paidInstallments} / {totalInstallments}
                </span>
              </div>
            </div>

            {/* Total Settled */}
            <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-emerald-900 font-bold block">
                  Total Amount Settled
                </span>
                <span className="text-[10px] text-slate-500">
                  Fully paid on the loan contract
                </span>
              </div>
              <div className="text-right">
                <span className="text-base font-extrabold text-emerald-800 block font-mono">
                  {formatCurrency(totalPaidAmount)}
                </span>
              </div>
            </div>

            {/* Outstanding balance — always zero */}
            <div className="bg-slate-50/60 border border-slate-200/60 p-3 rounded-xl flex items-center justify-between">
              <span className="text-[11px] text-slate-700 font-semibold">
                Remaining Balance
              </span>
              <span className="text-sm font-bold text-emerald-700 font-mono">
                LKR 0.00
              </span>
            </div>

            {/* Certification / Issue details */}
            <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500 space-y-1">
              <div className="flex justify-between">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" />
                  Issued by:
                </span>
                <span className="font-medium text-slate-700">
                  SMV Holdings — Authorized Officer
                </span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center gap-1">
                  <CreditCard className="w-3 h-3 text-slate-400" />
                  Issue Date:
                </span>
                <span className="font-mono text-slate-700">{issueDate}</span>
              </div>
            </div>

            {/* Footer note */}
            <div className="flex flex-col">
              <div className="text-center py-1 border-t border-b border-slate-200 text-[10px] text-slate-500">
                <span>• Official SMV Holdings Microfinance Certificate</span>
              </div>
              <div className="text-center py-2 border-b border-slate-200 text-[10px] text-slate-500 flex flex-col">
                <span>Developed by: Axperia Information Systems</span>
                <span>+94 788 017 808 | ask.axperia@gmail.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer — pinned (not captured) */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white font-bold rounded-lg text-xs hover:bg-slate-800 transition shadow-2xs cursor-pointer"
          >
            Done & Close
          </button>
        </div>
      </div>
    </div>
  );
};
