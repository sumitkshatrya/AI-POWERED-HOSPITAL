import PDFDocument from 'pdfkit';

export interface DischargePdfData {
  admissionNumber: string;
  patient: {
    uhid: string;
    mrn?: string | null;
    firstName: string;
    lastName: string;
    gender: string;
    dateOfBirth: Date | string;
    bloodGroup?: string | null;
    phone?: string;
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
  wardName?: string | null;
  bedNumber?: string | null;
  roomNumber?: string | null;
  admissionDate: Date | string;
  dischargeDate: Date | string;
  admissionReason?: string | null;
  admissionDiagnosis?: string | null;
  finalDiagnosis: string;
  treatmentSummary: string;
  proceduresPerformed?: string | null;
  dischargeCondition: string;
  medications: Array<{
    medicineName: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }>;
  dietInstructions?: string | null;
  activityInstructions?: string | null;
  urgentWarningSigns?: string | null;
  followupDate?: Date | string | null;
  followupInstructions?: string | null;
}

export function generateDischargePdf(data: DischargePdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const primaryColor = '#0f766e'; // Teal 700
      const accentColor = '#0d9488';  // Teal 600
      const textDark = '#1e293b';     // Slate 800

      // Hospital Header Banner
      doc.rect(40, 40, 515, 60).fill(primaryColor);
      doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold').text(data.hospital?.name || 'METROPOLITAN GENERAL HOSPITAL', 55, 52);
      doc.fontSize(9).font('Helvetica').text('DEPARTMENT OF INPATIENT CLINICAL SERVICES & IPD', 55, 74);

      doc.fillColor(textDark);

      // Title
      doc.fontSize(14).font('Helvetica-Bold').text('CLINICAL DISCHARGE SUMMARY', 40, 115, { align: 'center' });
      doc.fontSize(8.5).font('Helvetica').text(`Admission Ref: ${data.admissionNumber}  |  Status: FINAL DISCHARGE`, 40, 132, { align: 'center' });

      doc.moveTo(40, 145).lineTo(555, 145).strokeColor('#cbd5e1').stroke();

      // Patient & Admission Metadata Box
      const ageYears = data.patient.dateOfBirth
        ? new Date().getFullYear() - new Date(data.patient.dateOfBirth).getFullYear()
        : 'N/A';
      const admDateStr = new Date(data.admissionDate).toLocaleDateString();
      const disDateStr = new Date(data.dischargeDate).toLocaleDateString();

      const boxTop = 155;
      doc.rect(40, boxTop, 515, 80).fillAndStroke('#f8fafc', '#e2e8f0');
      doc.fillColor(textDark);

      // Column 1: Patient Details
      doc.fontSize(9).font('Helvetica-Bold').text('PATIENT IDENTIFICATION', 50, boxTop + 10);
      doc.font('Helvetica').fontSize(8.5);
      doc.text(`Patient Name: ${data.patient.firstName} ${data.patient.lastName}`, 50, boxTop + 24);
      doc.text(`UHID / MRN: ${data.patient.uhid} / ${data.patient.mrn || 'N/A'}`, 50, boxTop + 37);
      doc.text(`Age / Gender: ${ageYears} Yrs / ${data.patient.gender}`, 50, boxTop + 50);
      doc.text(`Blood Group: ${data.patient.bloodGroup || 'N/A'}`, 50, boxTop + 63);

      // Column 2: Inpatient Stay Details
      const docName = data.doctor?.user ? `Dr. ${data.doctor.user.firstName} ${data.doctor.user.lastName}` : 'Attending Physician';
      doc.fontSize(9).font('Helvetica-Bold').text('INPATIENT STAY RECORD', 300, boxTop + 10);
      doc.font('Helvetica').fontSize(8.5);
      doc.text(`Attending Doctor: ${docName}`, 300, boxTop + 24);
      doc.text(`Location: ${data.wardName || 'General Ward'} | Room: ${data.roomNumber || '-'} | Bed: ${data.bedNumber || '-'}`, 300, boxTop + 37);
      doc.text(`Admission Date: ${admDateStr}`, 300, boxTop + 50);
      doc.text(`Discharge Date: ${disDateStr}`, 300, boxTop + 63);

      // Clinical Diagnoses Section
      let currentY = boxTop + 90;
      doc.rect(40, currentY, 515, 45).fillAndStroke('#f0fdfa', '#99f6e4');
      doc.fillColor(primaryColor).fontSize(8.5).font('Helvetica-Bold').text('FINAL DIAGNOSIS AT DISCHARGE:', 50, currentY + 8);
      doc.fillColor(textDark).font('Helvetica-Bold').fontSize(9).text(data.finalDiagnosis, 50, currentY + 22);

      // Clinical Course & Treatments
      currentY += 55;
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor(primaryColor).text('HOSPITAL COURSE & TREATMENT SUMMARY', 40, currentY);
      doc.rect(40, currentY + 12, 515, 55).fillAndStroke('#ffffff', '#cbd5e1');
      doc.fillColor(textDark).font('Helvetica').fontSize(8).text(data.treatmentSummary, 50, currentY + 20, { width: 495 });

      // Procedures & Condition at Discharge
      currentY += 75;
      doc.rect(40, currentY, 515, 30).fillAndStroke('#f8fafc', '#e2e8f0');
      doc.font('Helvetica-Bold').fontSize(8.5).text('Procedures Performed:', 50, currentY + 9);
      doc.font('Helvetica').fontSize(8).text(data.proceduresPerformed || 'None', 170, currentY + 10);
      doc.font('Helvetica-Bold').fontSize(8.5).text('Condition at Discharge:', 330, currentY + 9);
      doc.fillColor('#059669').font('Helvetica-Bold').text(data.dischargeCondition, 455, currentY + 9);
      doc.fillColor(textDark);

      // Discharge Medications Table
      currentY += 40;
      doc.rect(40, currentY, 515, 18).fill(accentColor);
      doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
      doc.text('DISCHARGE MEDICINE', 45, currentY + 4, { width: 170 });
      doc.text('DOSAGE', 220, currentY + 4, { width: 70 });
      doc.text('FREQUENCY', 295, currentY + 4, { width: 70 });
      doc.text('DURATION', 370, currentY + 4, { width: 65 });
      doc.text('INSTRUCTIONS', 440, currentY + 4, { width: 110 });

      currentY += 20;
      doc.fillColor(textDark).font('Helvetica');

      if (data.medications && data.medications.length > 0) {
        data.medications.forEach((med, idx) => {
          if (idx % 2 === 1) {
            doc.rect(40, currentY - 2, 515, 16).fill('#f1f5f9');
            doc.fillColor(textDark);
          }
          doc.fontSize(8).font('Helvetica-Bold').text(med.medicineName, 45, currentY, { width: 170 });
          doc.font('Helvetica').text(med.dosage, 220, currentY, { width: 70 });
          doc.text(med.frequency, 295, currentY, { width: 70 });
          doc.text(med.duration, 370, currentY, { width: 65 });
          doc.text(med.instructions || 'As advised', 440, currentY, { width: 110 });
          currentY += 18;
        });
      } else {
        doc.fontSize(8).text('No discharge medications prescribed.', 45, currentY);
        currentY += 18;
      }

      // Discharge Instructions & Follow-up
      currentY += 10;
      doc.rect(40, currentY, 515, 45).fillAndStroke('#f8fafc', '#e2e8f0');
      doc.fillColor(primaryColor).fontSize(8.5).font('Helvetica-Bold').text('ADVICE & FOLLOW-UP INSTRUCTIONS:', 50, currentY + 7);
      doc.fillColor(textDark).font('Helvetica').fontSize(8);
      const dietStr = data.dietInstructions ? `Diet: ${data.dietInstructions} | ` : '';
      const followStr = data.followupDate ? `Review on: ${new Date(data.followupDate).toLocaleDateString()}` : 'Review as needed';
      const warningStr = data.urgentWarningSigns ? `Red Flags: ${data.urgentWarningSigns}` : 'Report to ER immediately if fever, breathlessness, or pain worsens.';
      doc.text(`${dietStr}${followStr}. ${data.followupInstructions || ''}`, 50, currentY + 19, { width: 495 });
      doc.fillColor('#dc2626').font('Helvetica-Bold').text(warningStr, 50, currentY + 31, { width: 495 });

      // Signatures Footer
      const footerY = 705;
      doc.moveTo(40, footerY).lineTo(555, footerY).strokeColor('#cbd5e1').stroke();

      doc.fillColor(textDark).fontSize(8).font('Helvetica').text('Medical Superintendent / IPD In-Charge', 50, footerY + 10);
      doc.text('City Hospital Inpatient Wing', 50, footerY + 22);

      doc.font('Helvetica-Bold').text(docName, 380, footerY + 10);
      doc.font('Helvetica').text(`Reg. No: ${data.doctor?.registrationNumber || 'MCI-10928'}`, 380, footerY + 22);
      doc.text(data.doctor?.specialization || 'Consultant Specialist', 380, footerY + 34);

      doc.fontSize(7.5).fillColor('#94a3b8').text('This is an authentic, system-generated Inpatient Discharge Summary.', 40, 775, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

