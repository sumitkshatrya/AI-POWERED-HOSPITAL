import PDFDocument from 'pdfkit';

export interface LabReportPdfData {
  orderNumber: string;
  patient: {
    uhid: string;
    mrn?: string | null;
    firstName: string;
    lastName: string;
    gender: string;
    dateOfBirth: Date | string;
    bloodGroup?: string | null;
  };
  doctor?: {
    user?: {
      firstName: string;
      lastName: string;
    } | null;
    registrationNumber?: string | null;
    qualification?: string | null;
    specialization?: string | null;
  } | null;
  hospital?: {
    name: string;
    address?: string | null;
    contactPhone?: string | null;
  } | null;
  sampleCollectedAt?: Date | string | null;
  sampleBarcode?: string | null;
  verifiedAt?: Date | string | null;
  verifiedBy?: {
    firstName: string;
    lastName: string;
  } | null;
  remarks?: string | null;
  status: string;
  items: Array<{
    testName: string;
    testCode?: string | null;
    resultValue?: string | null;
    unit?: string | null;
    referenceRange?: string | null;
    flag?: string | null;
    specimenType?: string | null;
    technicianNotes?: string | null;
  }>;
}

export function generateLabReportPdf(data: LabReportPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const primaryColor = '#1e3a8a'; // Navy Blue
      const accentColor = '#0284c7';  // Sky Blue
      const textDark = '#1f2937';     // Dark Slate

      // Header Banner
      doc.rect(40, 40, 515, 60).fill(primaryColor);
      doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold').text(data.hospital?.name || 'CITY GENERAL HOSPITAL', 55, 52);
      doc.fontSize(9).font('Helvetica').text('DEPARTMENT OF LABORATORY MEDICINE & PATHOLOGY', 55, 74);

      doc.fillColor(textDark);

      // Report Title & Barcode Box
      doc.fontSize(14).font('Helvetica-Bold').text('LABORATORY TEST REPORT', 40, 115, { align: 'center' });
      doc.fontSize(9).font('Helvetica').text(`Order #: ${data.orderNumber}  |  Status: ${data.status}`, 40, 132, { align: 'center' });

      doc.moveTo(40, 145).lineTo(555, 145).strokeColor('#cbd5e1').stroke();

      // Patient & Doctor Information Box
      const ageYears = data.patient.dateOfBirth
        ? new Date().getFullYear() - new Date(data.patient.dateOfBirth).getFullYear()
        : 'N/A';

      const boxTop = 155;
      doc.rect(40, boxTop, 515, 75).fillAndStroke('#f8fafc', '#e2e8f0');
      doc.fillColor(textDark);

      // Column 1: Patient Details
      doc.fontSize(9).font('Helvetica-Bold').text('PATIENT DETAILS', 50, boxTop + 10);
      doc.font('Helvetica').fontSize(8.5);
      doc.text(`Name: ${data.patient.firstName} ${data.patient.lastName}`, 50, boxTop + 24);
      doc.text(`UHID / MRN: ${data.patient.uhid} / ${data.patient.mrn || 'N/A'}`, 50, boxTop + 37);
      doc.text(`Age / Gender: ${ageYears} Yrs / ${data.patient.gender}`, 50, boxTop + 50);

      // Column 2: Referring Doctor & Sample Metadata
      const docName = data.doctor?.user ? `Dr. ${data.doctor.user.firstName} ${data.doctor.user.lastName}` : 'Attending Physician';
      const sampleDateStr = data.sampleCollectedAt ? new Date(data.sampleCollectedAt).toLocaleString() : 'N/A';
      const verifiedDateStr = data.verifiedAt ? new Date(data.verifiedAt).toLocaleString() : 'Pending Verification';

      doc.fontSize(9).font('Helvetica-Bold').text('CLINICAL DETAILS', 300, boxTop + 10);
      doc.font('Helvetica').fontSize(8.5);
      doc.text(`Ref. Doctor: ${docName} (${data.doctor?.qualification || 'MD'})`, 300, boxTop + 24);
      doc.text(`Sample Collected: ${sampleDateStr}`, 300, boxTop + 37);
      doc.text(`Report Verified: ${verifiedDateStr}`, 300, boxTop + 50);

      // Test Results Table Header
      const tableTop = 245;
      doc.rect(40, tableTop, 515, 20).fill(accentColor);
      doc.fillColor('#ffffff').fontSize(8.5).font('Helvetica-Bold');
      doc.text('TEST INVESTIGATION', 45, tableTop + 5, { width: 180 });
      doc.text('RESULT', 230, tableTop + 5, { width: 70 });
      doc.text('UNIT', 300, tableTop + 5, { width: 60 });
      doc.text('REFERENCE RANGE', 360, tableTop + 5, { width: 110 });
      doc.text('FLAG', 475, tableTop + 5, { width: 75 });

      let currentY = tableTop + 25;
      doc.fillColor(textDark).font('Helvetica');

      data.items.forEach((item, index) => {
        // Row zebra striping
        if (index % 2 === 1) {
          doc.rect(40, currentY - 2, 515, 18).fill('#f1f5f9');
          doc.fillColor(textDark);
        }

        doc.fontSize(8.5).font('Helvetica-Bold').text(item.testName, 45, currentY, { width: 180 });
        doc.font('Helvetica').text(item.resultValue || 'Pending', 230, currentY, { width: 70 });
        doc.text(item.unit || '-', 300, currentY, { width: 60 });
        doc.text(item.referenceRange || '-', 360, currentY, { width: 110 });

        // Highlight abnormal flags
        const flagText = item.flag || 'NORMAL';
        if (flagText === 'HIGH' || flagText === 'CRITICAL') {
          doc.fillColor('#dc2626').font('Helvetica-Bold').text(`[ ${flagText} ]`, 475, currentY, { width: 75 });
        } else if (flagText === 'LOW') {
          doc.fillColor('#d97706').font('Helvetica-Bold').text(`[ ${flagText} ]`, 475, currentY, { width: 75 });
        } else {
          doc.fillColor('#16a34a').font('Helvetica').text('NORMAL', 475, currentY, { width: 75 });
        }

        doc.fillColor(textDark);
        currentY += 20;
      });

      // Pathologist Verification & Remarks Section
      currentY += 15;
      doc.rect(40, currentY, 515, 45).fillAndStroke('#f8fafc', '#e2e8f0');
      doc.fillColor(textDark).fontSize(8.5).font('Helvetica-Bold').text('PATHOLOGIST REMARKS / INTERPRETATION:', 50, currentY + 8);
      doc.font('Helvetica').fontSize(8).text(data.remarks || 'Results correlated with clinical presentation. No further testing indicated.', 50, currentY + 22);

      // Signatures Footer
      const footerY = 700;
      doc.moveTo(40, footerY).lineTo(555, footerY).strokeColor('#cbd5e1').stroke();

      doc.fontSize(8).font('Helvetica').text('Lab Technologist', 50, footerY + 10);
      doc.text('Medical Laboratory Technology', 50, footerY + 22);

      const verifierName = data.verifiedBy ? `${data.verifiedBy.firstName} ${data.verifiedBy.lastName}` : 'Chief Pathologist';
      doc.font('Helvetica-Bold').text(`Verified by: ${verifierName}`, 380, footerY + 10);
      doc.font('Helvetica').text('Consultant Pathologist & Lab Director', 380, footerY + 22);

      doc.fontSize(7.5).fillColor('#94a3b8').text('This is an electronically verified and authenticated laboratory report.', 40, 770, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

