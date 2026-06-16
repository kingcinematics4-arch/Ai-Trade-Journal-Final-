import type jsPDF from 'jspdf';
import { format } from 'date-fns';
import { PDF_LAYOUT, PDF_THEME, type Rgb } from './theme';
import type { PdfDocumentContext } from './PdfDocumentContext';

export function drawReportHeader(
  ctx: PdfDocumentContext,
  options: { dateRangeLabel: string; fieldCount: number; tradeCount: number },
): void {
  const { doc } = ctx;
  const x = PDF_LAYOUT.marginX;
  const w = ctx.contentWidth;

  doc.setFillColor(...PDF_THEME.card);
  doc.roundedRect(x, ctx.y, w, 28, PDF_LAYOUT.cardRadius, PDF_LAYOUT.cardRadius, 'F');

  doc.setFillColor(...PDF_THEME.primary);
  doc.rect(x, ctx.y, 3, 28, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...PDF_THEME.text);
  doc.text('AI Trade Journal', x + 8, ctx.y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(PDF_LAYOUT.subtitleSize);
  doc.setTextColor(...PDF_THEME.muted);
  doc.text('Trading Performance Report', x + 8, ctx.y + 16);

  const generated = format(new Date(), 'dd MMM yyyy · HH:mm');
  doc.text(`Generated ${generated}`, x + 8, ctx.y + 22);
  doc.text(`Period: ${options.dateRangeLabel}`, w + x - 4, ctx.y + 22, { align: 'right' });

  ctx.advance(34);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...PDF_THEME.text);
  doc.text('Performance Summary', x, ctx.y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...PDF_THEME.muted);
  doc.text(
    `${options.tradeCount} trade${options.tradeCount === 1 ? '' : 's'} · ${options.fieldCount} exported field${options.fieldCount === 1 ? '' : 's'}`,
    x,
    ctx.y + 5,
  );

  ctx.advance(12);
}

export function drawSectionHeader(ctx: PdfDocumentContext, title: string, subtitle?: string): void {
  ctx.setSectionTitle(title);
  const x = PDF_LAYOUT.marginX;

  ctx.doc.setFont('helvetica', 'bold');
  ctx.doc.setFontSize(12);
  ctx.doc.setTextColor(...PDF_THEME.text);
  ctx.doc.text(title, x, ctx.y);

  if (subtitle) {
    ctx.doc.setFont('helvetica', 'normal');
    ctx.doc.setFontSize(8);
    ctx.doc.setTextColor(...PDF_THEME.muted);
    ctx.doc.text(subtitle, x, ctx.y + 5);
    ctx.advance(12);
  } else {
    ctx.advance(8);
  }
}

function toneColor(tone: string): Rgb {
  switch (tone) {
    case 'profit':
      return PDF_THEME.profit;
    case 'loss':
      return PDF_THEME.loss;
    case 'primary':
      return PDF_THEME.primary;
    case 'muted':
      return PDF_THEME.muted;
    default:
      return PDF_THEME.text;
  }
}

/** Draw a single KPI summary card */
export function drawSummaryCard(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  value: string,
  tone: string,
): void {
  doc.setFillColor(...PDF_THEME.cardElevated);
  doc.setDrawColor(...PDF_THEME.border);
  doc.setLineWidth(0.2);
  doc.roundedRect(x, y, width, height, PDF_LAYOUT.cardRadius, PDF_LAYOUT.cardRadius, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(PDF_LAYOUT.labelSize);
  doc.setTextColor(...PDF_THEME.muted);
  doc.text(label.toUpperCase(), x + 4, y + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...toneColor(tone));
  const valueLines = doc.splitTextToSize(value, width - 8);
  doc.text(valueLines[0] ?? value, x + 4, y + 16);
}

/** 2-column grid of summary KPI cards */
export function drawSummaryCardGrid(
  ctx: PdfDocumentContext,
  metrics: { label: string; value: string; tone: string }[],
): void {
  const cols = 2;
  const gap = PDF_LAYOUT.summaryCardGap;
  const cardW = (ctx.contentWidth - gap) / cols;
  const cardH = PDF_LAYOUT.summaryCardHeight;
  const rows = Math.ceil(metrics.length / cols);
  const gridHeight = rows * cardH + (rows - 1) * gap;

  ctx.ensureSpace(gridHeight + 4);

  let index = 0;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (index >= metrics.length) break;
      const metric = metrics[index];
      const x = PDF_LAYOUT.marginX + col * (cardW + gap);
      const y = ctx.y + row * (cardH + gap);
      drawSummaryCard(ctx.doc, x, y, cardW, cardH, metric.label, metric.value, metric.tone);
      index += 1;
    }
  }

  ctx.advance(gridHeight + PDF_LAYOUT.sectionGap);
}
