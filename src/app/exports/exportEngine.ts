import Papa from 'papaparse';
import { filterData } from './filterData';
import { ExportOptions } from './exportTypes';
import { exportPDF as generateProfessionalPDF } from '@/lib/exportPDF';
import { buildPremiumTradingReport } from '@/lib/export/pdf/pdfReportBuilder';
import { exportProfessionalExcel } from '@/lib/exportExcel';
import { exportAnnualComplianceReportPDF } from '@/lib/export/compliance/annualCompliancePdf';
import { exportAnnualComplianceReportExcel } from '@/lib/export/compliance/annualComplianceExcel';
import { buildComplianceReportData } from '@/lib/export/compliance/complianceEngine';

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');

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
export async function exportData(
  data: any[],
  options: ExportOptions,
  context?: { tasks?: any[]; goals?: any[]; userId?: string; accountId?: string }
) {
  console.log('Export format:', options.format);

  const cleaned = filterData(data, options);

  switch (options.format) {
    case 'csv':
      return exportCSV(cleaned, options);

    case 'json':
      return exportJSON(cleaned, options);

    case 'xlsx':
      return exportProfessionalExcel(
        cleaned,
        context?.tasks || [],
        context?.goals || [],
        options.fileName,
        context,
        options.exportMode
      );

    case 'pdf': {
      const isStandard = (options.pdfReportType ?? 'standard') === 'standard';
      return exportPDF(isStandard ? data : cleaned, options);
    }

    case 'txt':
      return exportTXT(cleaned, options);

    case 'compliance_report':
      return exportAnnualComplianceReport(data, options, context);

    default:
      throw new Error(`Unsupported format: ${options.format}`);
  }
}

/* ---------------- CSV ---------------- */
function exportCSV(data: any[], options: ExportOptions) {
  const csv = Papa.unparse(data);
  download(new Blob([csv], { type: 'text/csv' }), `${options.fileName}.csv`);
  return true;
}

/* ---------------- JSON ---------------- */
function exportJSON(data: any[], options: ExportOptions) {
  const json = options.prettyPrint ? JSON.stringify(data, null, 2) : JSON.stringify(data);

  download(new Blob([json], { type: 'application/json' }), `${options.fileName}.json`);
  return true;
}

/* ---------------- PDF ---------------- */
function exportPDF(data: any[], options: ExportOptions) {
  generateProfessionalPDF(data, {
    fileName: options.fileName,
    selectedFields: options.selectedFields,
    pdfReportType: options.pdfReportType ?? 'standard',
  });
  return true;
}

/* ---------------- TXT ---------------- */
function exportTXT(data: any[], options: ExportOptions) {
  const text = data.map((row) => JSON.stringify(row)).join('\n');

  download(new Blob([text], { type: 'text/plain' }), `${options.fileName}.txt`);
  return true;
}

/* ---------------- ANNUAL COMPLIANCE REPORT ---------------- */
async function exportAnnualComplianceReport(
  data: any[],
  options: ExportOptions,
  context?: { tasks?: any[]; goals?: any[]; userId?: string; accountId?: string }
) {
  const subFormat = options.complianceFormat || 'pdf';
  const fileName = options.fileName || 'AnnualComplianceReport';

  try {
    // Use auth context if provided, otherwise try localStorage fallback
    let userId = context?.userId || 'N/A';
    let accountId = context?.accountId || 'N/A';

    // Fallback: try localStorage for browser environments
    if ((userId === 'N/A' || accountId === 'N/A') && typeof window !== 'undefined') {
      try {
        const storedUserId = localStorage.getItem('userId');
        const storedAccountId = localStorage.getItem('accountId');
        if (storedUserId) userId = storedUserId;
        if (storedAccountId) accountId = storedAccountId;
      } catch {
        // localStorage not available
      }
    }

    const reportData = await buildComplianceReportData(data, userId, accountId);

    if (subFormat === 'pdf') {
      const pdfDoc = await exportAnnualComplianceReportPDF(reportData);
      const pdfBlob = pdfDoc.output('blob');
      download(pdfBlob, `${fileName}.pdf`);
    } else if (subFormat === 'xlsx') {
      const workbook = await exportAnnualComplianceReportExcel(reportData);
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      download(blob, `${fileName}.xlsx`);
    }

    return true;
  } catch (error) {
    console.error('[exportAnnualComplianceReport] Error:', error);
    return false;
  }
}
