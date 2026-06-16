import autoTable from 'jspdf-autotable';
import {
  STANDARD_PDF_COLUMNS,
  getStandardPdfCellValue,
  isPnlField,
} from '@/lib/export/exportFields';
import { PDF_LAYOUT, PDF_THEME } from './theme';
import type { PdfDocumentContext } from './PdfDocumentContext';

const COLUMN_WIDTHS: Record<string, number> = {
  trade_date: 24,
  asset_name: 32,
  strategy_used: 38,
  risk_amount: 28,
  pnl_amount: 28,
  trade_status: 24,
};

export function drawStandardTradeTable(
  ctx: PdfDocumentContext,
  data: Record<string, unknown>[],
): void {
  const headers = STANDARD_PDF_COLUMNS.map((col) => col.label);
  const body = data.map((row) =>
    STANDARD_PDF_COLUMNS.map((col) => getStandardPdfCellValue(col.key, row)),
  );

  const pnlIndex = STANDARD_PDF_COLUMNS.findIndex((col) => isPnlField(col.key));

  autoTable(ctx.doc, {
    startY: ctx.y,
    margin: { left: PDF_LAYOUT.marginX, right: PDF_LAYOUT.marginX, bottom: PDF_LAYOUT.marginBottom },
    head: [headers],
    body,
    theme: 'plain',
    showHead: 'everyPage',
    styles: {
      font: 'helvetica',
      fontSize: PDF_LAYOUT.standardTableFontSize,
      cellPadding: { top: 2.5, right: 3, bottom: 2.5, left: 3 },
      valign: 'middle',
      overflow: 'linebreak',
      textColor: PDF_THEME.text,
      lineColor: PDF_THEME.border,
      lineWidth: 0.15,
      minCellHeight: 7,
    },
    headStyles: {
      fillColor: PDF_THEME.header,
      textColor: PDF_THEME.white,
      fontStyle: 'bold',
      halign: 'left',
      fontSize: PDF_LAYOUT.standardTableFontSize,
      cellPadding: { top: 3, right: 3, bottom: 3, left: 3 },
    },
    alternateRowStyles: {
      fillColor: PDF_THEME.card,
    },
    bodyStyles: {
      fillColor: PDF_THEME.bg,
    },
    columnStyles: Object.fromEntries(
      STANDARD_PDF_COLUMNS.map((col, index) => [
        index,
        {
          cellWidth: COLUMN_WIDTHS[col.key] ?? 'auto',
          halign: col.key === 'pnl_amount' || col.key === 'risk_amount' ? 'right' : 'left',
        },
      ]),
    ),
    didParseCell: (cell) => {
      if (cell.section !== 'body' || cell.column.index !== pnlIndex) return;
      const num = parseFloat(String(cell.cell.raw).replace(/[+,$—]/g, ''));
      if (!Number.isNaN(num)) {
        cell.cell.styles.textColor = num > 0 ? PDF_THEME.profit : num < 0 ? PDF_THEME.loss : PDF_THEME.text;
        cell.cell.styles.fontStyle = 'bold';
      }
    },
    didDrawPage: (pageData) => {
      if (pageData.pageNumber > 1) {
        ctx.doc.setFillColor(...PDF_THEME.bg);
        ctx.doc.rect(0, 0, ctx.pageWidth, ctx.pageHeight, 'F');
      }
      ctx.pageNumber = pageData.pageNumber;
      ctx.drawFooter();
    },
  });

  const finalY = (ctx.doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY;
  if (finalY) ctx.y = finalY + PDF_LAYOUT.sectionGap;
}
