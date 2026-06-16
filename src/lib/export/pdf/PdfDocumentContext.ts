import type jsPDF from 'jspdf';
import { PDF_LAYOUT, PDF_THEME } from './theme';

export class PdfDocumentContext {
  readonly doc: jsPDF;
  y: number;
  pageNumber = 1;
  private sectionTitle = '';

  constructor(doc: jsPDF) {
    this.doc = doc;
    this.y = PDF_LAYOUT.marginTop;
    this.paintPageBackground();
    this.drawFooter();
  }

  get pageWidth(): number {
    return this.doc.internal.pageSize.getWidth();
  }

  get pageHeight(): number {
    return this.doc.internal.pageSize.getHeight();
  }

  get contentWidth(): number {
    return this.pageWidth - PDF_LAYOUT.marginX * 2;
  }

  get maxY(): number {
    return this.pageHeight - PDF_LAYOUT.marginBottom;
  }

  setSectionTitle(title: string): void {
    this.sectionTitle = title;
  }

  paintPageBackground(): void {
    this.doc.setFillColor(...PDF_THEME.bg);
    this.doc.rect(0, 0, this.pageWidth, this.pageHeight, 'F');
  }

  drawFooter(): void {
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(8);
    this.doc.setTextColor(...PDF_THEME.muted);
    this.doc.text('AI Trade Journal — Confidential Trading Report', PDF_LAYOUT.marginX, PDF_LAYOUT.footerY);
    this.doc.text(`Page ${this.pageNumber}`, this.pageWidth - PDF_LAYOUT.marginX, PDF_LAYOUT.footerY, {
      align: 'right',
    });
  }

  addPage(continuationLabel?: string): void {
    this.doc.addPage();
    this.pageNumber += 1;
    this.paintPageBackground();
    this.y = PDF_LAYOUT.marginTop;

    if (continuationLabel) {
      this.drawContinuationBanner(continuationLabel);
    }

    this.drawFooter();
  }

  private drawContinuationBanner(label: string): void {
    this.doc.setFillColor(...PDF_THEME.card);
    this.doc.roundedRect(
      PDF_LAYOUT.marginX,
      this.y,
      this.contentWidth,
      10,
      PDF_LAYOUT.cardRadius,
      PDF_LAYOUT.cardRadius,
      'F',
    );
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(9);
    this.doc.setTextColor(...PDF_THEME.primary);
    this.doc.text(label, PDF_LAYOUT.marginX + 4, this.y + 6.5);
    this.y += 14;
  }

  /** Ensures vertical space; moves entire block to next page if needed */
  ensureSpace(requiredHeight: number, continuationLabel?: string): void {
    if (this.y + requiredHeight <= this.maxY) return;

    const label = continuationLabel ?? (this.sectionTitle ? `${this.sectionTitle} (continued)` : undefined);
    this.addPage(label);
  }

  advance(amount: number): void {
    this.y += amount;
  }
}
