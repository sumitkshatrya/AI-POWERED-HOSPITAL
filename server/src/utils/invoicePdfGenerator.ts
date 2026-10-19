import PDFDocument from 'pdfkit';

export interface InvoicePdfData {
  invoiceNumber: string;
  createdAt: Date | string;
  paidAt?: Date | string | null;
  paymentStatus: string;
  paymentMethod?: string | null;
  subtotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  totalPaid: number;
  balanceDue: number;
  patient: {
    uhid: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    email?: string | null;
    gender?: string | null;
    dateOfBirth?: Date | string | null;
    address?: string | null;
  };
  doctor?: {
    user?: {
      firstName: string;
      lastName: string;
    } | null;
    specialization?: string | null;
  } | null;
  hospital?: {
    name: string;
    address?: string | null;
    contactPhone?: string | null;
    contactEmail?: string | null;
    taxId?: string | null;
  } | null;
  items: Array<{
    description: string;
    itemType: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  payments?: Array<{
    paymentNumber: string;
    paymentMethod: string;
    gateway?: string | null;
    gatewayPaymentId?: string | null;
    amount: number;
    createdAt: Date | string;
    status: string;
  }>;
}

export function generateInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const primaryColor = '#1e3a8a'; // Blue 900
      const accentColor = '#2563eb';  // Blue 600
      const textDark = '#0f172a';     // Slate 900
      const textMuted = '#475569';    // Slate 600

      // Hospital Header Banner
      doc.rect(40, 40, 515, 65).fill(primaryColor);
      doc
        .fillColor('#ffffff')
        .fontSize(18)
        .font('Helvetica-Bold')
        .text(data.hospital?.name || 'APOLLO HEALTHCARE NETWORK', 55, 50);
      doc
        .fontSize(9)
        .font('Helvetica')
        .text(
          `${data.hospital?.address || '124 Medical Campus Road'} | Phone: ${
            data.hospital?.contactPhone || '+91 11-4567-8900'
          }`,
          55,
          72
        );
      doc
        .fontSize(8.5)
        .font('Helvetica-Oblique')
        .text(`Tax ID / GSTIN: ${data.hospital?.taxId || 'GSTIN-07AAAAA0000A1Z5'} | 24/7 Accounts & Billing`, 55, 86);

      // Title & Status
      doc.fillColor(textDark);
      doc.fontSize(16).font('Helvetica-Bold').text('PATIENT BILLING INVOICE', 40, 120, { align: 'center' });
      doc
        .fontSize(9)
        .font('Helvetica')
        .text(
          `Invoice #: ${data.invoiceNumber}  |  Date: ${new Date(data.createdAt).toLocaleDateString()}`,
          40,
          138,
          { align: 'center' }
        );

      // Status Stamp / Pill
      const statusColor =
        data.paymentStatus === 'PAID'
          ? '#16a34a'
          : data.paymentStatus === 'PARTIAL'
          ? '#0284c7'
          : data.paymentStatus === 'REFUNDED'
          ? '#9333ea'
          : '#ea580c';

      doc.rect(440, 118, 115, 24).fillAndStroke('#f8fafc', statusColor);
      doc
        .fillColor(statusColor)
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(data.paymentStatus, 440, 124, { width: 115, align: 'center' });

      doc.moveTo(40, 155).lineTo(555, 155).strokeColor('#cbd5e1').stroke();

      // Two-column demographics: Patient vs Doctor / Invoice Meta
      doc.fillColor(textDark);
      doc.fontSize(10).font('Helvetica-Bold').text('PATIENT DETAILS', 40, 165);
      doc
        .fontSize(8.5)
        .font('Helvetica')
        .fillColor(textMuted)
        .text(`UHID: ${data.patient.uhid}`, 40, 180)
        .text(`Name: ${data.patient.firstName} ${data.patient.lastName}`, 40, 193)
        .text(`Phone: ${data.patient.phone || 'N/A'}`, 40, 206)
        .text(`Address: ${data.patient.address || 'N/A'}`, 40, 219);

      doc.fillColor(textDark).fontSize(10).font('Helvetica-Bold').text('ATTENDING PHYSICIAN & BILLING', 300, 165);
      doc
        .fontSize(8.5)
        .font('Helvetica')
        .fillColor(textMuted)
        .text(
          `Doctor: ${
            data.doctor?.user
              ? `Dr. ${data.doctor.user.firstName} ${data.doctor.user.lastName}`
              : 'Hospital Duty Team'
          }`,
          300,
          180
        )
        .text(`Specialization: ${data.doctor?.specialization || 'General / Multidisciplinary'}`, 300, 193)
        .text(`Payment Terms: Due upon receipt`, 300, 206)
        .text(`Settlement Method: ${data.paymentMethod || 'Self / Insurance'}`, 300, 219);

      // Itemized Services Table
      const tableTop = 245;
      doc.rect(40, tableTop, 515, 20).fill('#f1f5f9');
      doc.fillColor(textDark).fontSize(8.5).font('Helvetica-Bold');
      doc.text('#', 45, tableTop + 5);
      doc.text('Category', 70, tableTop + 5);
      doc.text('Service Description', 160, tableTop + 5);
      doc.text('Qty', 370, tableTop + 5, { width: 30, align: 'center' });
      doc.text('Unit Price', 415, tableTop + 5, { width: 60, align: 'right' });
      doc.text('Total', 485, tableTop + 5, { width: 60, align: 'right' });

      let currentY = tableTop + 22;
      doc.font('Helvetica').fontSize(8.5);

      data.items.forEach((item, index) => {
        if (currentY > 680) {
          doc.addPage();
          currentY = 40;
        }

        doc.fillColor(index % 2 === 0 ? '#ffffff' : '#f8fafc').rect(40, currentY, 515, 18).fill();

        doc.fillColor(textDark);
        doc.text(`${index + 1}`, 45, currentY + 4);
        doc.text(item.itemType.replace('_', ' '), 70, currentY + 4);
        doc.text(item.description, 160, currentY + 4, { width: 200, ellipsis: true });
        doc.text(`${item.quantity}`, 370, currentY + 4, { width: 30, align: 'center' });
        doc.text(`$${item.unitPrice.toFixed(2)}`, 415, currentY + 4, { width: 60, align: 'right' });
        doc.text(`$${item.totalPrice.toFixed(2)}`, 485, currentY + 4, { width: 60, align: 'right' });

        currentY += 18;
      });

      // Totals Summary Box
      currentY += 10;
      doc.moveTo(350, currentY).lineTo(555, currentY).strokeColor('#cbd5e1').stroke();
      currentY += 6;

      const drawTotalRow = (label: string, value: string, isBold: boolean = false, color: string = textDark) => {
        doc.fillColor(color).font(isBold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9);
        doc.text(label, 350, currentY, { width: 110, align: 'left' });
        doc.text(value, 460, currentY, { width: 85, align: 'right' });
        currentY += 15;
      };

      drawTotalRow('Subtotal:', `$${data.subtotal.toFixed(2)}`);
      if (data.tax > 0) drawTotalRow('Taxes & Surcharges:', `+$${data.tax.toFixed(2)}`);
      if (data.discount > 0) drawTotalRow('Discount / Waiver:', `-$${data.discount.toFixed(2)}`, false, '#16a34a');
      drawTotalRow('Grand Total:', `$${data.totalAmount.toFixed(2)}`, true, primaryColor);
      drawTotalRow('Total Paid:', `$${data.totalPaid.toFixed(2)}`, false, '#16a34a');
      drawTotalRow('Balance Due:', `$${data.balanceDue.toFixed(2)}`, true, data.balanceDue > 0 ? '#dc2626' : '#16a34a');

      // Payment Transactions Table (if any)
      if (data.payments && data.payments.length > 0) {
        currentY += 10;
        if (currentY > 660) {
          doc.addPage();
          currentY = 40;
        }

        doc.fillColor(textDark).fontSize(9.5).font('Helvetica-Bold').text('PAYMENT TRANSACTIONS RECEIPT LOG', 40, currentY);
        currentY += 14;

        doc.rect(40, currentY, 515, 16).fill('#f1f5f9');
        doc.fillColor(textDark).fontSize(8).font('Helvetica-Bold');
        doc.text('Payment #', 45, currentY + 3);
        doc.text('Date', 140, currentY + 3);
        doc.text('Method', 220, currentY + 3);
        doc.text('Gateway / Ref', 310, currentY + 3);
        doc.text('Status', 420, currentY + 3);
        doc.text('Amount', 485, currentY + 3, { width: 60, align: 'right' });

        currentY += 18;
        doc.font('Helvetica').fontSize(8);

        data.payments.forEach((pay) => {
          doc.fillColor(textDark);
          doc.text(pay.paymentNumber, 45, currentY + 2);
          doc.text(new Date(pay.createdAt).toLocaleDateString(), 140, currentY + 2);
          doc.text(pay.paymentMethod, 220, currentY + 2);
          doc.text(pay.gatewayPaymentId || pay.gateway || 'MANUAL', 310, currentY + 2, { width: 100, ellipsis: true });
          doc.text(pay.status, 420, currentY + 2);
          doc.text(`$${pay.amount.toFixed(2)}`, 485, currentY + 2, { width: 60, align: 'right' });
          currentY += 14;
        });
      }

      // Footer Terms & Signature Box
      if (currentY > 670) {
        doc.addPage();
        currentY = 40;
      } else {
        currentY = Math.max(currentY + 25, 700);
      }

      doc.moveTo(40, currentY).lineTo(555, currentY).strokeColor('#e2e8f0').stroke();
      currentY += 8;

      doc
        .fontSize(7.5)
        .font('Helvetica-Oblique')
        .fillColor('#94a3b8')
        .text(
          'This is a computer-generated official hospital invoice. For any inquiries, contact accounts@apollohospital.org.',
          40,
          currentY,
          { width: 330 }
        );

      doc
        .fontSize(8)
        .font('Helvetica-Bold')
        .fillColor(textDark)
        .text('Authorized Finance Signatory', 400, currentY + 15, { width: 150, align: 'center' });
      doc
        .fontSize(7)
        .font('Helvetica')
        .fillColor(textMuted)
        .text('Patient Accounts Department', 400, currentY + 26, { width: 150, align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

