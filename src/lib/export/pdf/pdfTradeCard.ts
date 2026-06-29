import {
  formatExportCellValue,
  getExportFieldLabel,
  isLongTextField,
  isPnlField,
} from '@/lib/export/exportFields';
import { PDF_LAYOUT, PDF_THEME } from './theme';
import type { PdfDocumentContext } from './PdfDocumentContext';

function splitFields(columns: string[]) {
  return {
    shortFields: columns.filter((f) => !isLongTextField(f)),
    longFields: columns.filter((f) => isLongTextField(f)),
  };
}

function measureWrappedText(
  ctx: PdfDocumentContext,
  text: string,
  width: number,
  fontSize: number
): number {
  ctx.doc.setFontSize(fontSize);
  const lines = ctx.doc.splitTextToSize(text, width);
  return lines.length * PDF_LAYOUT.lineHeight;
}

/** Estimate full card height before rendering (for pagination) */
export function estimateTradeCardHeight(
  ctx: PdfDocumentContext,
  columns: string[],
  row: Record<string, unknown>
): number {
  const { shortFields, longFields } = splitFields(columns);
  const innerWidth = ctx.contentWidth - PDF_LAYOUT.tradeCardPadding * 2;
  const pairRows = Math.ceil(shortFields.length / 2);

  let height = PDF_LAYOUT.tradeCardHeaderHeight + PDF_LAYOUT.tradeCardPadding * 2 + pairRows * 7;

  longFields.forEach((field) => {
    const value = formatExportCellValue(field, row[field]);
    height += 8 + measureWrappedText(ctx, value, innerWidth, PDF_LAYOUT.valueSize) + 4;
  });

  return height + PDF_LAYOUT.cardGap;
}

function drawFieldPair(
  ctx: PdfDocumentContext,
  x: number,
  y: number,
  colWidth: number,
  field: string,
  row: Record<string, unknown>
): number {
  const label = getExportFieldLabel(field);
  const value = formatExportCellValue(field, row[field]);
  const { doc } = ctx;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(PDF_LAYOUT.labelSize);
  doc.setTextColor(...PDF_THEME.muted);
  doc.text(`${label}:`, x, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(PDF_LAYOUT.valueSize);
  if (isPnlField(field)) {
    const num = parseFloat(value.replace(/[+,$—]/g, ''));
    if (!Number.isNaN(num) && num > 0) doc.setTextColor(...PDF_THEME.profit);
    else if (!Number.isNaN(num) && num < 0) doc.setTextColor(...PDF_THEME.loss);
    else doc.setTextColor(...PDF_THEME.text);
  } else {
    doc.setTextColor(...PDF_THEME.text);
  }

  const lines = doc.splitTextToSize(value, colWidth - 2);
  doc.text(lines, x, y + 4.5);
  return 4.5 + lines.length * PDF_LAYOUT.lineHeight + 2;
}

function drawLongFieldBlock(
  ctx: PdfDocumentContext,
  x: number,
  y: number,
  width: number,
  field: string,
  row: Record<string, unknown>
): number {
  const label = getExportFieldLabel(field);
  const value = formatExportCellValue(field, row[field]);
  const { doc } = ctx;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(PDF_LAYOUT.labelSize);
  doc.setTextColor(...PDF_THEME.muted);
  doc.text(`${label}:`, x, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(PDF_LAYOUT.valueSize);
  doc.setTextColor(...PDF_THEME.text);
  const lines = doc.splitTextToSize(value, width);
  doc.text(lines, x, y + 5);

  return 5 + lines.length * PDF_LAYOUT.lineHeight + 4;
}

/** Render one trade as a premium card; returns height drawn */
export function drawTradeCard(
  ctx: PdfDocumentContext,
  tradeIndex: number,
  columns: string[],
  row: Record<string, unknown>
): number {
  const startY = ctx.y;
  const x = PDF_LAYOUT.marginX;
  const w = ctx.contentWidth;
  const estimated = estimateTradeCardHeight(ctx, columns, row);

  ctx.ensureSpace(estimated, 'Trade Details (continued)');

  const cardTop = ctx.y;

  ctx.doc.setFillColor(...PDF_THEME.header);
  ctx.doc.roundedRect(
    x,
    cardTop,
    w,
    PDF_LAYOUT.tradeCardHeaderHeight,
    PDF_LAYOUT.cardRadius,
    PDF_LAYOUT.cardRadius,
    'F'
  );
  ctx.doc.rect(
    x,
    cardTop + PDF_LAYOUT.tradeCardHeaderHeight - PDF_LAYOUT.cardRadius,
    w,
    PDF_LAYOUT.cardRadius,
    'F'
  );

  ctx.doc.setFont('helvetica', 'bold');
  ctx.doc.setFontSize(PDF_LAYOUT.cardTitleSize);
  ctx.doc.setTextColor(...PDF_THEME.white);
  ctx.doc.text(`Trade #${tradeIndex + 1}`, x + PDF_LAYOUT.tradeCardPadding, cardTop + 6.5);

  const asset = formatExportCellValue('asset_name', row.asset_name ?? row.asset ?? row.symbol);
  if (asset !== '—') {
    ctx.doc.setFont('helvetica', 'normal');
    ctx.doc.setFontSize(9);
    ctx.doc.setTextColor(...PDF_THEME.muted);
    ctx.doc.text(asset, x + w - PDF_LAYOUT.tradeCardPadding, cardTop + 6.5, { align: 'right' });
  }

  const bodyEstHeight = estimated - PDF_LAYOUT.tradeCardHeaderHeight;
  ctx.doc.setFillColor(...PDF_THEME.card);
  ctx.doc.rect(x, cardTop + PDF_LAYOUT.tradeCardHeaderHeight, w, bodyEstHeight, 'F');

  let innerY = cardTop + PDF_LAYOUT.tradeCardHeaderHeight + PDF_LAYOUT.tradeCardPadding;
  const innerX = x + PDF_LAYOUT.tradeCardPadding;
  const innerWidth = w - PDF_LAYOUT.tradeCardPadding * 2;
  const colWidth = (innerWidth - 6) / 2;

  const { shortFields, longFields } = splitFields(columns);

  for (let i = 0; i < shortFields.length; i += 2) {
    const left = shortFields[i];
    const right = shortFields[i + 1];
    const leftH = drawFieldPair(ctx, innerX, innerY, colWidth, left, row);
    const rightH = right
      ? drawFieldPair(ctx, innerX + colWidth + 6, innerY, colWidth, right, row)
      : 0;
    innerY += Math.max(leftH, rightH);
  }

  longFields.forEach((field) => {
    innerY += drawLongFieldBlock(ctx, innerX, innerY, innerWidth, field, row);
  });

  const cardHeight = innerY - cardTop + PDF_LAYOUT.tradeCardPadding;
  const actualBodyHeight = cardHeight - PDF_LAYOUT.tradeCardHeaderHeight;

  if (actualBodyHeight > bodyEstHeight) {
    ctx.doc.setFillColor(...PDF_THEME.card);
    ctx.doc.rect(
      x,
      cardTop + PDF_LAYOUT.tradeCardHeaderHeight + bodyEstHeight,
      w,
      actualBodyHeight - bodyEstHeight,
      'F'
    );
  }

  ctx.doc.setDrawColor(...PDF_THEME.border);
  ctx.doc.setLineWidth(0.25);
  ctx.doc.roundedRect(x, cardTop, w, cardHeight, PDF_LAYOUT.cardRadius, PDF_LAYOUT.cardRadius, 'S');

  ctx.y = cardTop + cardHeight + PDF_LAYOUT.cardGap;
  return ctx.y - startY;
}

export function drawTradeCardLayout(
  ctx: PdfDocumentContext,
  data: Record<string, unknown>[],
  columns: string[]
): void {
  data.forEach((row, index) => {
    drawTradeCard(ctx, index, columns, row);
  });
}
