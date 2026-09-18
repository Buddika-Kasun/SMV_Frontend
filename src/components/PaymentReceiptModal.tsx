import React, { useRef } from "react";
import { formatCurrency } from "../utils/consultancyUtils";
import {
  Building2,
  CheckCircle,
  Printer,
  X,
  CreditCard,
  User,
  Download,
} from "lucide-react";
import { Loan, PaymentRecord } from "../api";
import { getPaymentMethodLabel } from "../utils/loanUtils";

import logoIcon from "@/src/assets/logo2.jpg";

interface PaymentReceiptModalProps {
  loan: Loan;
  payment: PaymentRecord;
  onClose: () => void;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  loan,
  payment,
  onClose,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  // -----------------------------------------------------------------
  // Capture receipt as PNG dataURL
  // -----------------------------------------------------------------
  const captureReceipt = async (): Promise<string> => {
    const receipt = receiptRef.current;
    if (!receipt) throw new Error("Receipt element not found");

    const { toPng } = await import("html-to-image");

    // Temporarily expand so full content is captured (bypasses scroll clip)
    const prevMaxHeight = receipt.style.maxHeight;
    const prevOverflow = receipt.style.overflow;
    receipt.style.maxHeight = "none";
    receipt.style.overflow = "visible";

    try {
      const dataUrl = await toPng(receipt, {
        pixelRatio: 4,
        backgroundColor: "#ffffff",
        cacheBust: true,
        skipAutoScale: true,
      });
      return dataUrl;
    } finally {
      receipt.style.maxHeight = prevMaxHeight;
      receipt.style.overflow = prevOverflow;
    }
  };

  // -----------------------------------------------------------------
  // PRINT — open new window with only the receipt image
  // -----------------------------------------------------------------
  const handlePrint = async () => {
    try {
      const dataUrl = await captureReceipt();

      const img = new Image();
      img.src = dataUrl;
      await new Promise<void>((res) => {
        img.onload = () => res();
        img.onerror = () => res();
      });

      const pxToMm = 3.7795275591;
      const widthMm = img.naturalWidth / 2 / pxToMm;
      const heightMm = img.naturalHeight / 1.8 / pxToMm;

      const win = window.open("", "_blank", "width=800,height=900");
      if (!win) {
        alert("Please allow popups to print the receipt.");
        return;
      }

      win.document.write(`
  <!DOCTYPE html>
  <html>
    <head>
      <title>Receipt ${payment.id}</title>
      <style>
        @page {
          size: ${widthMm}mm ${heightMm}mm;
          margin: 0;
        }
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
  // DOWNLOAD PDF — sized exactly to the receipt
  // -----------------------------------------------------------------
  const handleDownloadPdf = async () => {
    try {
      const dataUrl = await captureReceipt();

      const img = new Image();
      img.src = dataUrl;
      await new Promise<void>((res) => {
        img.onload = () => res();
        img.onerror = () => res();
      });

      const pxToMm = 3.7795275591;
      const widthMm = img.naturalWidth / 2 / pxToMm;
      const heightMm = img.naturalHeight / 2 / pxToMm;

      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({
        orientation: widthMm > heightMm ? "landscape" : "portrait",
        unit: "mm",
        format: [widthMm, heightMm],
      });

      pdf.addImage(dataUrl, "PNG", 0, 0, widthMm, heightMm);
      pdf.save(`Receipt-${payment.id}.pdf`);
    } catch (err) {
      console.error("PDF download failed:", err);
      alert("Failed to generate PDF. See console for details.");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200/80 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header Bar — pinned (not captured) */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 text-xs block">
                Official Payment Receipt
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {payment.referenceNumber}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDownloadPdf}
              className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 text-xs font-semibold flex items-center gap-1 transition shadow-2xs cursor-pointer"
              title="Download Receipt as PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden sm:inline">PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 text-xs font-semibold flex items-center gap-1 transition shadow-2xs cursor-pointer"
              title="Print Official Receipt"
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

        {/* Scrollable Receipt Content — this whole div is captured */}
        <div className="overflow-y-auto flex-1 min-h-0">
          <div ref={receiptRef} className="p-5 space-y-4 text-xs bg-white">
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
            </div>

            {/* Core Amount Hero */}
            <div className="bg-slate-900 text-white p-4 rounded-xl text-center space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                Payment Amount Received
              </span>
              <div className="text-2xl font-black font-mono tracking-tight text-emerald-400">
                {formatCurrency(payment.amount)}
              </div>
              <span className="text-[10px] text-slate-300 font-mono block">
                Date: {payment.paymentDate} • Ref: {payment.referenceNumber}
              </span>
            </div>

            {/* Allocation Breakdown */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60">
                <span className="text-[10px] text-slate-500 font-medium block">
                  Principal Applied
                </span>
                <span className="font-bold text-slate-900 text-xs font-mono">
                  {formatCurrency(payment.allocatedPrincipal)}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60">
                <span className="text-[10px] text-slate-500 font-medium block">
                  Interest Applied
                </span>
                <span className="font-bold text-slate-900 text-xs font-mono">
                  {formatCurrency(payment.allocatedInterest)}
                </span>
              </div>
            </div>

            {/* Details Metadata List */}
            <div className="space-y-2 bg-slate-50/50 p-3 rounded-xl border border-slate-200/60 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500 flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" />
                  Customer Name:
                </span>
                <span className="font-bold text-slate-900">
                  {payment.customerName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Loan Contract ID:</span>
                <span className="font-mono font-bold text-slate-800">
                  {loan.loanNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 flex items-center gap-1">
                  <CreditCard className="w-3 h-3 text-slate-400" />
                  Payment Method:
                </span>
                <span className="font-semibold text-slate-800">
                  {getPaymentMethodLabel(payment.paymentMethod)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" />
                  Received by:
                </span>
                <span className="font-bold text-slate-900">
                  {payment.receivedBy}
                </span>
              </div>
              {payment.notes && (
                <div className="flex justify-between pt-1 border-t border-slate-200/60 text-[10px]">
                  <span className="text-slate-500">Remarks / Notes:</span>
                  <span className="text-slate-700 italic">{payment.notes}</span>
                </div>
              )}
            </div>

            {/* Balance Remaining After Payment */}
            <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-emerald-900 font-bold block">
                  Adjusted Outstanding Balance
                </span>
                <span className="text-[10px] text-slate-500">
                  Total remaining on loan contract
                </span>
              </div>
              <div className="text-right">
                <span className="text-base font-extrabold text-emerald-800 block">
                  {formatCurrency(loan.outstandingBalance)}
                </span>
              </div>
            </div>

            {/* Footer note */}
            <div className="flex flex-col">
              <div className="text-center py-1 border-t border-b border-slate-200 text-[10px] text-slate-500">
                <span>• Official SMV Holdings Microfinance Receipt</span>
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
