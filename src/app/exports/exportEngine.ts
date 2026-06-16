import JSZip from "jszip";
import Papa from "papaparse";
import { filterData } from "./filterData";
import { ExportOptions } from "./exportTypes";
import { exportPDF as generateProfessionalPDF } from "@/lib/exportPDF";
import { buildPremiumTradingReport } from "@/lib/export/pdf/pdfReportBuilder";
import { exportProfessionalExcel } from "@/lib/exportExcel";

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * MAIN EXPORT FUNCTION
 */
export async function exportData(data: any[], options: ExportOptions, context?: { tasks?: any[], goals?: any[] }) {
  const cleaned = filterData(data, options);

  switch (options.format) {
    case "csv":
      return exportCSV(cleaned, options);

    case "json":
      return exportJSON(cleaned, options);

    case "xlsx":
      return exportProfessionalExcel(
        cleaned, 
        context?.tasks || [], 
        context?.goals || [], 
        options.fileName,
        context,
        options.exportMode
      );

    case "pdf": {
      const isStandard = (options.pdfReportType ?? "standard") === "standard";
      return exportPDF(isStandard ? data : cleaned, options);
    }

    case "txt":
      return exportTXT(cleaned, options);

    case "zip":
      return exportZIP(data, cleaned, options);

    default:
      throw new Error("Unsupported format");
  }
}

/* ---------------- CSV ---------------- */
function exportCSV(data: any[], options: ExportOptions) {
  const csv = Papa.unparse(data);
  download(new Blob([csv], { type: "text/csv" }), `${options.fileName}.csv`);
  return true;
}

/* ---------------- JSON ---------------- */
function exportJSON(data: any[], options: ExportOptions) {
  const json = options.prettyPrint
    ? JSON.stringify(data, null, 2)
    : JSON.stringify(data);

  download(new Blob([json], { type: "application/json" }), `${options.fileName}.json`);
  return true;
}

/* ---------------- PDF ---------------- */
function exportPDF(data: any[], options: ExportOptions) {
  generateProfessionalPDF(data, {
    fileName: options.fileName,
    selectedFields: options.selectedFields,
    pdfReportType: options.pdfReportType ?? "standard",
  });
  return true;
}

/* ---------------- TXT ---------------- */
function exportTXT(data: any[], options: ExportOptions) {
  const text = data
    .map(row => JSON.stringify(row))
    .join("\n");

  download(new Blob([text], { type: "text/plain" }), `${options.fileName}.txt`);
}

/* ---------------- ZIP (ALL) ---------------- */
async function exportZIP(originalData: any[], cleaned: any[], options: ExportOptions) {
  const zip = new JSZip();

  zip.file("data.json", JSON.stringify(cleaned, null, 2));
  zip.file("data.csv", Papa.unparse(cleaned));

  const pdfSource = (options.pdfReportType ?? "standard") === "standard" ? originalData : cleaned;
  const pdfDoc = buildPremiumTradingReport(pdfSource, {
    fileName: options.fileName,
    selectedFields: options.selectedFields,
    pdfReportType: options.pdfReportType ?? "standard",
  });
  zip.file("data.pdf", pdfDoc.output("blob"));

  const content = await zip.generateAsync({ type: "blob" });

  download(content, `${options.fileName}.zip`);
}