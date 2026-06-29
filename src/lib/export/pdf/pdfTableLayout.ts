import autoTable from 'jspdf-autotable';
import {
  formatExportCellValue,
  getExportFieldLabel,
  isLongTextField,
  isPnlField,
} from '@/lib/export/exportFields';
import { PDF_LAYOUT, PDF_THEME } from './theme';
import type { PdfDocumentContext } from './PdfDocumentContext';

export function drawTradeTableLayout(
  ctx: PdfDocumentContext,
  data: Record<string, unknown>[],
  columns: string[]
): void {
  const headers = columns.map(getExportFieldLabel);
  const body = data.map((row) => columns.map((field) => formatExportCellValue(field, row[field])));

  const pnlIndexes = new Set(
    columns.map((field, i) => (isPnlField(field) ? i : -1)).filter((i) => i >= 0)
  );
  const longIndexes = new Set(
    columns.map((field, i) => (isLongTextField(field) ? i : -1)).filter((i) => i >= 0)
  );

  const colWidth = ctx.contentWidth / columns.length;

  autoTable(ctx.doc, {
    startY: ctx.y,
    margin: {
      left: PDF_LAYOUT.marginX,
      right: PDF_LAYOUT.marginX,
      bottom: PDF_LAYOUT.marginBottom,
    },
    head: [headers],
    body,
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: PDF_LAYOUT.tableFontSize,
      cellPadding: { top: 4, right: 4, bottom: 4, left: 4 },
      valign: 'top',
      overflow: 'linebreak',
      cellWidth: colWidth,
      textColor: PDF_THEME.text,
      lineColor: PDF_THEME.border,
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: PDF_THEME.header,
      textColor: PDF_THEME.white,
      fontStyle: 'bold',
      halign: 'left',
      fontSize: PDF_LAYOUT.tableFontSize,
    },
    alternateRowStyles: {
      fillColor: PDF_THEME.card,
    },
    bodyStyles: {
      fillColor: PDF_THEME.bg,
    },
    didParseCell: (cell) => {
      if (cell.section !== 'body') return;

      if (pnlIndexes.has(cell.column.index)) {
        const num = parseFloat(String(cell.cell.raw).replace(/[+,$—]/g, ''));
        if (!Number.isNaN(num)) {
          cell.cell.styles.textColor =
            num > 0 ? PDF_THEME.profit : num < 0 ? PDF_THEME.loss : PDF_THEME.text;
        }
      }

      if (longIndexes.has(cell.column.index)) {
        cell.cell.styles.cellPadding = { top: 4, right: 4, bottom: 4, left: 4 };
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

  const finalY = (ctx.doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
    ?.finalY;
  if (finalY) ctx.y = finalY + PDF_LAYOUT.sectionGap;
}
