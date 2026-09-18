import React, { useState } from "react";
import {
  X,
  Download,
  Printer,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { LoanDocument } from "../api";

interface DocumentPreviewModalProps {
  document: LoanDocument | null;
  onClose: () => void;
}

const isImage = (fileName: string) =>
  /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(fileName);

const isPdf = (fileName: string) => /\.pdf$/i.test(fileName);

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  document,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);

  if (!document) return null;

  const {
    previewUrl, // inline-disposition URL — for rendering
    fileUrl, // attachment-disposition URL — for downloading
    fileName,
    documentType,
  } = document;

  const image = isImage(fileName);
  const pdf = isPdf(fileName);

  // Use previewUrl when available; fall back to fileUrl
  const renderUrl = previewUrl || fileUrl;
  const downloadUrl = fileUrl || previewUrl;

  // Download — must use the attachment URL (fileUrl)
  const handleDownload = () => {
    const a = window.document.createElement("a");
    a.href = downloadUrl;
    a.download = fileName;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
  };

  // Print — uses the render URL
  const handlePrint = () => {
    if (pdf) {
      // Open the inline URL in a new tab and trigger print
      const w = window.open(renderUrl, "_blank");
      if (!w) return;
      w.addEventListener("load", () => {
        try {
          w.print();
        } catch {
          /* user can Ctrl+P */
        }
      });
      return;
    }

    if (image) {
      const w = window.open("", "_blank");
      if (!w) return;
      w.document.write(`
        <html>
          <head><title>${fileName}</title>
            <style>
              @page { margin: 12mm; }
              body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
              img { max-width: 100%; max-height: 100vh; object-fit: contain; }
            </style>
          </head>
          <body>
            <img src="${renderUrl}" onload="window.print(); setTimeout(()=>window.close(), 500);" />
          </body>
        </html>
      `);
      w.document.close();
      return;
    }

    // Fallback
    window.open(renderUrl, "_blank", "noopener,noreferrer");
  };

  // Open in new tab — uses the render URL so the browser displays it
  const handleOpenNewTab = () => {
    window.open(renderUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200/80 rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg shrink-0">
              {image ? (
                <ImageIcon className="w-4 h-4" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0">
              <span className="font-bold text-slate-900 text-xs block truncate">
                {documentType.replace(/_/g, " ")}
              </span>
              <span className="text-[10px] text-slate-500 font-mono truncate block">
                {fileName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleOpenNewTab}
              className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 text-xs font-semibold flex items-center gap-1 transition shadow-2xs cursor-pointer"
              title="Open in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden sm:inline">Open</span>
            </button>
            <button
              onClick={handleDownload}
              className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 text-xs font-semibold flex items-center gap-1 transition shadow-2xs cursor-pointer"
              title="Download"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden sm:inline">Download</span>
            </button>
            <button
              onClick={handlePrint}
              className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 text-xs font-semibold flex items-center gap-1 transition shadow-2xs cursor-pointer"
              title="Print"
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

        {/* Preview body — uses renderUrl (inline disposition) */}
        <div className="flex-1 min-h-0 overflow-auto bg-slate-100 relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-100 z-10">
              <div className="text-center">
                <Loader2 className="w-6 h-6 mx-auto text-blue-600 animate-spin" />
                <p className="text-[11px] text-slate-500 mt-2">
                  Loading preview…
                </p>
              </div>
            </div>
          )}

          {image ? (
            <img
              src={renderUrl}
              alt={fileName}
              onLoad={() => setLoading(false)}
              onError={() => setLoading(false)}
              className="block mx-auto max-w-full h-auto"
            />
          ) : pdf ? (
            <iframe
              src={`${renderUrl}#toolbar=1&navpanes=0&scrollbar=1`}
              title={fileName}
              onLoad={() => setLoading(false)}
              className="w-full h-full min-h-[70vh] border-0 bg-white"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center">
              <FileText className="w-10 h-10 text-slate-400 mb-2" />
              <p className="text-xs text-slate-600 font-medium">
                Preview not available for this file type
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Use Download or Open in new tab instead.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
