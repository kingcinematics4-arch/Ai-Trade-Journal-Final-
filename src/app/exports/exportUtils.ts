import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { exportPDF as generateProfessionalPDF } from '@/lib/exportPDF';

export type ExportFormat = 'pdf' | 'csv' | 'xlsx' | 'json' | 'txt' | 'md' | 'xml' | 'html' | 'compliance_report';

interface ExportOptions {
  filename: string;
  format: ExportFormat;
  data: any[];
  columns?: { header: string; key: string }[];
  title?: string;
}

export async function exportData({ filename, format, data, columns, title }: ExportOptions) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const finalFilename = `${filename}_${timestamp}`;

  switch (format) {
    case 'json':
      const jsonBlob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      saveAs(jsonBlob, `${finalFilename}.json`);
      break;

    case 'csv':
    case 'xlsx':
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
      if (format === 'csv') {
        const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
        const csvBlob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8' });
        saveAs(csvBlob, `${finalFilename}.csv`);
      } else {
        XLSX.writeFile(workbook, `${finalFilename}.xlsx`);
      }
      break;

    case 'pdf':
      generateProfessionalPDF(data, {
        fileName: filename,
        selectedFields: columns?.map((c) => c.key),
      });
      break;

    case 'txt':
    case 'md':
      let textContent = title ? `# ${title}\n\n` : '';
      if (format === 'md') {
        const headers = columns ? columns.map(c => c.header) : Object.keys(data[0] || {});
        textContent += `| ${headers.join(' | ')} |\n`;
        textContent += `| ${headers.map(() => '---').join(' | ')} |\n`;
        data.forEach(row => {
          const values = columns ? columns.map(c => row[c.key]) : Object.values(row);
          textContent += `| ${values.join(' | ')} |\n`;
        });
      } else {
        data.forEach(row => {
          textContent += JSON.stringify(row) + '\n';
        });
      }
      const textBlob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
      saveAs(textBlob, `${finalFilename}.${format}`);
      break;

    case 'xml':
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<root>\n`;
      data.forEach(item => {
        xml += `  <item>\n`;
        Object.entries(item).forEach(([key, val]) => {
          xml += `    <${key}>${val}</${key}>\n`;
        });
        xml += `  </item>\n`;
      });
      xml += `</root>`;
      const xmlBlob = new Blob([xml], { type: 'application/xml' });
      saveAs(xmlBlob, `${finalFilename}.xml`);
      break;

    case 'html':
      let html = `<html><head><style>table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px}th{background-color:#f2f2f2}</style></head><body>`;
      html += `<h1>${title || 'Export'}</h1><table><thead><tr>`;
      const keys = columns ? columns.map(c => c.key) : Object.keys(data[0] || {});
      const labels = columns ? columns.map(c => c.header) : keys;
      labels.forEach(l => html += `<th>${l}</th>`);
      html += `</tr></thead><tbody>`;
      data.forEach(row => {
        html += `<tr>`;
        keys.forEach(k => html += `<td>${row[k] || ''}</td>`);
        html += `</tr>`;
      });
      html += `</tbody></table></body></html>`;
      const htmlBlob = new Blob([html], { type: 'text/html' });
      saveAs(htmlBlob, `${finalFilename}.html`);
      break;

    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

export function logExport(exportType: string, format: string) {
  const history = JSON.parse(localStorage.getItem('export-history') || '[]');
  const newEntry = {
    id: crypto.randomUUID(),
    type: exportType,
    format,
    timestamp: new Date().toISOString(),
    status: 'completed'
  };
  localStorage.setItem('export-history', JSON.stringify([newEntry, ...history].slice(0, 50)));
}