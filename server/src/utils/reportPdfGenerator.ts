import PDFDocument from 'pdfkit';

export interface ReportPdfInput {
  reportTitle: string;
  moduleName: string;
  timeframeLabel: string;
  generatedAt: string;
  hospitalName?: string;
  kpiSummary: Array<{ label: string; value: string }>;
  headers: string[];
  rows: string[][];
}

export const generateExecutiveReportPdf = (data: ReportPdfInput): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // Header Banner
      doc.rect(40, 40, 515, 60).fill('#0F172A'); // Dark slate background

      doc.fillColor('#FFFFFF').fontSize(18).font('Helvetica-Bold').text(data.reportTitle, 55, 52);
      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#94A3B8')
        .text(`Hospital Operations Platform • ${data.hospitalName || 'Health Network'}`, 55, 76);

      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#38BDF8')
        .text(`Generated: ${data.generatedAt}`, 400, 55, { align: 'right' });
      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#CBD5E1')
        .text(`Range: ${data.timeframeLabel}`, 400, 70, { align: 'right' });

      doc.moveDown(3);

      // KPI Summary Cards (Grid of up to 4 metrics)
      if (data.kpiSummary.length > 0) {
        let startY = 115;
        const cardWidth = 120;
        const cardGap = 10;

        data.kpiSummary.slice(0, 4).forEach((kpi, idx) => {
          const cardX = 40 + idx * (cardWidth + cardGap);
          doc.rect(cardX, startY, cardWidth, 45).fillAndStroke('#F8FAFC', '#E2E8F0');
          doc.fillColor('#64748B').fontSize(8).font('Helvetica-Bold').text(kpi.label.toUpperCase(), cardX + 8, startY + 8);
          doc.fillColor('#0F172A').fontSize(12).font('Helvetica-Bold').text(kpi.value, cardX + 8, startY + 24);
        });

        doc.y = startY + 60;
      } else {
        doc.y = 120;
      }

      // Section Header
      doc.fillColor('#1E293B').fontSize(12).font('Helvetica-Bold').text('Detailed Report Findings', 40, doc.y);
      doc.moveDown(0.5);

      // Table Construction
      const tableTop = doc.y;
      const colCount = Math.min(data.headers.length, 6);
      const colWidth = Math.floor(515 / colCount);

      // Table Header Row
      doc.rect(40, tableTop, 515, 22).fill('#2563EB');
      data.headers.slice(0, colCount).forEach((hdr, idx) => {
        doc
          .fillColor('#FFFFFF')
          .fontSize(9)
          .font('Helvetica-Bold')
          .text(hdr, 45 + idx * colWidth, tableTop + 6, {
            width: colWidth - 10,
            ellipsis: true,
          });
      });

      let currentY = tableTop + 22;

      // Table Data Rows
      data.rows.forEach((row, rowIdx) => {
        if (currentY > 750) {
          doc.addPage();
          currentY = 40;
        }

        const isEven = rowIdx % 2 === 0;
        doc.rect(40, currentY, 515, 20).fill(isEven ? '#FFFFFF' : '#F1F5F9');

        row.slice(0, colCount).forEach((cellVal, colIdx) => {
          doc
            .fillColor('#334155')
            .fontSize(8)
            .font('Helvetica')
            .text(String(cellVal || '-'), 45 + colIdx * colWidth, currentY + 5, {
              width: colWidth - 10,
              ellipsis: true,
            });
        });

        currentY += 20;
      });

      // Footer
      doc.fontSize(8).font('Helvetica-Oblique').fillColor('#94A3B8').text('End of Confidential Executive Report — AI Hospital Platform', 40, 780, {
        align: 'center',
      });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
