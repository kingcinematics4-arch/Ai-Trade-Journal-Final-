import JSZip from "jszip";
import Papa from "papaparse";
import { filterData } from "./filterData";
import { ExportOptions } from "./exportTypes";
import { exportPDF as generateProfessionalPDF } from "@/lib/exportPDF";
import { exportProfessionalExcel } from "@/lib/exportExcel";
import { jsPDF } from "jspdf";

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
      return exportProfessionalExcel(cleaned, context?.tasks || [], context?.goals || [], options.fileName);

    case "pdf":
      return exportPDF(cleaned, options);

    case "txt":
      return exportTXT(cleaned, options);

    case "zip":
      return exportZIP(cleaned, options);

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
  generateProfessionalPDF(data, options.fileName);
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
async function exportZIP(data: any[], options: ExportOptions) {
  const zip = new JSZip();

  zip.file("data.json", JSON.stringify(data, null, 2));
  zip.file("data.csv", Papa.unparse(data));

  // Note: To include the professional Excel in ZIP, you would generate the buffer here using ExcelJS

  const pdf = new jsPDF();
  data.forEach(r => pdf.text(JSON.stringify(r), 10, 10));

  zip.file("data.pdf", pdf.output("blob"));

  const content = await zip.generateAsync({ type: "blob" });

  download(content, `${options.fileName}.zip`);
}