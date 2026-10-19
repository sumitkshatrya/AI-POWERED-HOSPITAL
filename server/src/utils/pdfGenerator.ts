import PDFDocument from 'pdfkit';

export interface PdfPrescriptionData {
  prescriptionCode: string;
  createdAt: string | Date;
  adviceInstructions?: string | null;
  hospital: {
    name: string;
    contactEmail: string;
    contactPhone: string;
    address?: string | null;
  };
  doctor: {
    name: string;
    qualification: string;
    specialization: string;
    registrationNumber: string;
  };
  patient: {
    name: string;
    uhid: string;
    gender: string;
    dateOfBirth?: string | Date;
  };
  items: Array<{
    medicineName: string;
    dosage: string;
    frequency: string;
    durationDays: number;
    route: string;
    instructions?: string | null;
  }>;
  followupDate?: string | Date | null;
}

export const generatePrescriptionPdfBuffer = (data: PdfPrescriptionData): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      // 1. Header & Hospital Branding
      doc
        .fillColor('#1e293b')
        .fontSize(20)
        .font('Helvetica-Bold')
        .text(data.hospital.name, { align: 'left' });

      doc
        .fillColor('#64748b')
        .fontSize(9)
        .font('Helvetica')
        .text(`${data.hospital.address || 'Medical Center Drive'} | Tel: ${data.hospital.contactPhone} | Email: ${data.hospital.contactEmail}`);

      doc.moveDown(0.5);
      doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.8);

      // 2. Doctor & Patient Info Box
      const startY = doc.y;

      // Doctor Info (Left Box)
      doc
        .fillColor('#0f172a')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(`Dr. ${data.doctor.name}`, 40, startY);

      doc
        .fillColor('#475569')
        .fontSize(9)
        .font('Helvetica')
        .text(`${data.doctor.qualification} - ${data.doctor.specialization}`)
        .text(`Reg. No: ${data.doctor.registrationNumber}`);

      // Patient Info (Right Box)
      doc
        .fillColor('#0f172a')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(`Patient: ${data.patient.name}`, 320, startY);

      doc
        .fillColor('#475569')
        .fontSize(9)
        .font('Helvetica')
        .text(`UHID: ${data.patient.uhid} | Gender: ${data.patient.gender}`)
        .text(`Date: ${new Date(data.createdAt).toLocaleDateString()} | Rx Code: ${data.prescriptionCode}`);

      doc.moveDown(1.5);
      const dividerY = Math.max(doc.y, startY + 50);
      doc.strokeColor('#e2e8f0').lineWidth(0.8).moveTo(40, dividerY).lineTo(555, dividerY).stroke();
      doc.y = dividerY + 15;

      // 3. Rx Symbol Header
      doc
        .fillColor('#2563eb')
        .fontSize(22)
        .font('Helvetica-Bold')
        .text('Rx', 40, doc.y);

      doc.moveDown(0.5);

      // 4. Medicines Table Header
      const tableTop = doc.y;
      doc.fillColor('#f8fafc').rect(40, tableTop, 515, 20).fill();

      doc
        .fillColor('#334155')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('MEDICINE NAME', 45, tableTop + 5)
        .text('DOSAGE', 210, tableTop + 5)
        .text('FREQUENCY', 280, tableTop + 5)
        .text('DURATION', 370, tableTop + 5)
        .text('ROUTE', 440, tableTop + 5)
        .text('INSTRUCTIONS', 490, tableTop + 5);

      let currentY = tableTop + 24;

      data.items.forEach((item) => {
        doc
          .fillColor('#0f172a')
          .fontSize(9)
          .font('Helvetica-Bold')
          .text(item.medicineName, 45, currentY, { width: 160 });

        doc
          .fillColor('#475569')
          .font('Helvetica')
          .text(item.dosage, 210, currentY)
          .text(item.frequency, 280, currentY)
          .text(`${item.durationDays} Days`, 370, currentY)
          .text(item.route, 440, currentY)
          .text(item.instructions || '-', 490, currentY, { width: 60 });

        currentY += 20;
        doc.strokeColor('#f1f5f9').lineWidth(0.5).moveTo(40, currentY).lineTo(555, currentY).stroke();
        currentY += 4;
      });

      doc.y = currentY + 10;

      // 5. Advice / Instructions
      if (data.adviceInstructions) {
        doc
          .fillColor('#0f172a')
          .fontSize(10)
          .font('Helvetica-Bold')
          .text('Clinical Advice / Special Instructions:');

        doc
          .fillColor('#475569')
          .fontSize(9)
          .font('Helvetica')
          .text(data.adviceInstructions);

        doc.moveDown(1);
      }

      // 6. Follow-Up Date
      if (data.followupDate) {
        doc
          .fillColor('#166534')
          .fontSize(9.5)
          .font('Helvetica-Bold')
          .text(`Follow-up Date: ${new Date(data.followupDate).toLocaleDateString()}`);

        doc.moveDown(1.5);
      } else {
        doc.moveDown(1);
      }

      // 7. Signature Block
      const sigY = Math.max(doc.y, 680);
      doc
        .strokeColor('#cbd5e1')
        .lineWidth(1)
        .moveTo(380, sigY)
        .lineTo(540, sigY)
        .stroke();

      doc
        .fillColor('#0f172a')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(`Dr. ${data.doctor.name}`, 380, sigY + 5);

      doc
        .fillColor('#64748b')
        .fontSize(8.5)
        .font('Helvetica')
        .text(`Reg. No: ${data.doctor.registrationNumber}`, 380, sigY + 18)
        .text('Authorized Medical Practitioner', 380, sigY + 30);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

