import type jsPDF from 'jspdf';
import type { ReportPeriodIdentity } from './pdfReportIdentity';
import { PDF_LAYOUT, PDF_THEME, PERIOD_BADGE_COLORS, type Rgb } from './theme';
import type { PdfDocumentContext } from './PdfDocumentContext';

export interface ReportHeaderMeta {
  tradeCount: number;
  fieldCount: number;
  reportLabel?: string;
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

function drawPeriodBadge(doc: jsPDF, x: number, y: number, label: string, color: Rgb): void {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  const paddingX = 4;
  const badgeWidth = doc.getTextWidth(label) + paddingX * 2;
  const badgeHeight = 6;
  const badgeX = x - badgeWidth;

  doc.setFillColor(...color);
  doc.roundedRect(badgeX, y, badgeWidth, badgeHeight, 1.5, 1.5, 'F');
  doc.setTextColor(...PDF_THEME.white);
  doc.text(label, badgeX + paddingX, y + 4.2);
}

function drawReportBanner(ctx: PdfDocumentContext, identity: ReportPeriodIdentity): void {
  const { doc } = ctx;
  const x = PDF_LAYOUT.marginX;
  const w = ctx.contentWidth;
  const bannerHeight = PDF_LAYOUT.reportBannerHeight;

  doc.setFillColor(...PDF_THEME.cardElevated);
  doc.setDrawColor(...PDF_THEME.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, ctx.y, w, bannerHeight, PDF_LAYOUT.cardRadius, PDF_LAYOUT.cardRadius, 'FD');

  doc.setFillColor(...PERIOD_BADGE_COLORS[identity.kind]);
  doc.rect(x, ctx.y, w, 2.5, 'F');

  const badgeColor = PERIOD_BADGE_COLORS[identity.kind];
  drawPeriodBadge(doc, x + w - 6, ctx.y + 5, identity.badgeLabel, badgeColor);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(PDF_LAYOUT.bannerTitleSize);
  doc.setTextColor(...PDF_THEME.text);
  doc.text(identity.bannerTitle, x + 6, ctx.y + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(PDF_LAYOUT.bannerSubtitleSize);
  doc.setTextColor(...PDF_THEME.muted);
  doc.text(identity.bannerSubtitle, x + 6, ctx.y + 22);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...PDF_THEME.primary);
  doc.text('AI Trade Journal', x + 6, ctx.y + 30);

  ctx.advance(bannerHeight + PDF_LAYOUT.sectionGap);
}

function drawReportPeriodCard(ctx: PdfDocumentContext, identity: ReportPeriodIdentity): void {
  const { doc } = ctx;
  const x = PDF_LAYOUT.marginX;
  const w = ctx.contentWidth;
  const cardHeight = PDF_LAYOUT.reportPeriodCardHeight;

  doc.setFillColor(...PDF_THEME.card);
  doc.setDrawColor(...PDF_THEME.border);
  doc.setLineWidth(0.25);
  doc.roundedRect(x, ctx.y, w, cardHeight, PDF_LAYOUT.cardRadius, PDF_LAYOUT.cardRadius, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...PDF_THEME.text);
  doc.text('Report Period', x + 5, ctx.y + 7);

  doc.setDrawColor(...PDF_THEME.border);
  doc.line(x + 5, ctx.y + 9, x + w - 5, ctx.y + 9);

  const rows = [
    ['Type', identity.typeLabel],
    ['Start Date', identity.startDateLabel],
    ['End Date', identity.endDateLabel],
    ['Generated On', identity.generatedOnLabel],
  ];

  let rowY = ctx.y + 14;
  doc.setFontSize(9);
  rows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_THEME.muted);
    doc.text(`${label}:`, x + 5, rowY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_THEME.text);
    doc.text(value, x + 34, rowY);
    rowY += 5.5;
  });

  ctx.advance(cardHeight + PDF_LAYOUT.sectionGap);
}

function drawPerformanceSummaryDivider(
  ctx: PdfDocumentContext,
  identity: ReportPeriodIdentity
): void {
  const { doc } = ctx;
  const x = PDF_LAYOUT.marginX;
  const w = ctx.contentWidth;
  const centerY = ctx.y + 4;
  const title = 'TRADE PERFORMANCE SUMMARY';

  doc.setDrawColor(...PDF_THEME.primary);
  doc.setLineWidth(0.6);
  doc.line(x, centerY, x + 18, centerY);
  doc.line(x + w - 18, centerY, x + w, centerY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...PDF_THEME.text);
  doc.text(title, x + w / 2, centerY + 1, { align: 'center' });

  ctx.advance(10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...PDF_THEME.muted);
  doc.text(identity.performanceSubtitle, x, ctx.y);

  ctx.advance(6);
}

/** Full branded report header: banner, period card, divider, and meta line */
export function drawReportHeader(
  ctx: PdfDocumentContext,
  identity: ReportPeriodIdentity,
  meta: ReportHeaderMeta
): void {
  drawReportBanner(ctx, identity);
  drawReportPeriodCard(ctx, identity);
  drawPerformanceSummaryDivider(ctx, identity);

  const x = PDF_LAYOUT.marginX;
  const { doc } = ctx;

  if (meta.reportLabel) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...PDF_THEME.muted);
    doc.text(`Report format: ${meta.reportLabel}`, x, ctx.y);
    ctx.advance(5);
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...PDF_THEME.muted);
  doc.text(
    `${meta.tradeCount} trade${meta.tradeCount === 1 ? '' : 's'} · ${meta.fieldCount} exported field${meta.fieldCount === 1 ? '' : 's'}`,
    x,
    ctx.y
  );

  ctx.advance(8);
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

/** Draw a single KPI summary card */
export function drawSummaryCard(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  value: string,
  tone: string
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
  metrics: { label: string; value: string; tone: string }[]
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
