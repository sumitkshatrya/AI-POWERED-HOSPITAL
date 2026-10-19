import request from 'supertest';
import path from 'path';
import fs from 'fs';
import app from '../src/app';
import {
  Hospital,
  Branch,
  Doctor,
  DoctorSchedule,
  User,
  Patient,
  Appointment,
  Consultation,
  Prescription,
  AuditLog,
} from '../src/models';
import { connectMongoDB, disconnectMongoDB } from '../src/config/database';

describe('Phase 6: EMR Chronological Timeline, PDF Generation & Secure Document Management Integration Tests', () => {
  let superAdminToken: string;
  let doctorToken: string;
  let patientAToken: string;
  let patientBToken: string;

  let patientAId: string;
  let patientBId: string;
  let doctorProfileId: string;
  let prescriptionId: string;
  let documentId: string;

  const samplePdfPath = path.join(__dirname, 'sample_test_report.pdf');
  const sampleTxtPath = path.join(__dirname, 'invalid_test_script.exe');

  beforeAll(async () => {
    await connectMongoDB();
    // Create dummy sample files for upload testing
    fs.writeFileSync(samplePdfPath, '%PDF-1.4 sample pdf content for testing document upload');
    fs.writeFileSync(sampleTxtPath, 'executable content');

    // 1. Super Admin Auth
    const superRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'superadmin@platform.com', password: 'Password123!' });
    superAdminToken = superRes.body.data.accessToken;

    // 2. Doctor Auth
    const docUser = await User.findOne({ role: 'DOCTOR' });
    if (docUser) {
      const docLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: docUser.email, password: 'Password123!' });
      doctorToken = docLogin.body.data.accessToken;
      const docProfile = await Doctor.findOne({ userId: docUser._id }) || await Doctor.findOne();
      if (docProfile) {
        doctorProfileId = docProfile._id.toString();
        await DoctorSchedule.findOneAndUpdate(
          { doctorId: doctorProfileId },
          {
            $set: {
              doctorId: doctorProfileId,
              workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
              startTime: '08:00',
              endTime: '18:00',
              slotDurationMinutes: 15,
              maxAppointmentsPerDay: 50,
            },
          },
          { upsert: true, new: true }
        );
      }
    }

    // 3. Patient A Auth
    const patAUser = await User.findOne({ email: 'patient.a1@gmail.com' }) || await User.findOne({ role: 'PATIENT' });
    if (patAUser) {
      const patALogin = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: patAUser.email, password: 'Password123!' });
      patientAToken = patALogin.body.data.accessToken;
      const patRecA = await Patient.findOne({ userId: patAUser._id }) || await Patient.findOne();
      if (patRecA) patientAId = patRecA._id.toString();
    }

    let patBUser = await User.findOne({ email: 'patient.b.test@gmail.com' });
    if (!patBUser) {
      patBUser = await User.create({
        email: 'patient.b.test@gmail.com',
        password: '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQOEg6Lruj3vjPGga31lW',
        firstName: 'Bob',
        lastName: 'PatientB',
        role: 'PATIENT',
        isVerified: true,
      });
    }

    const patBLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'patient.b.test@gmail.com', password: 'Password123!' });
    patientBToken = patBLogin.body.data.accessToken;

    const hosp = await Hospital.findOne();
    const branch = await Branch.findOne({ hospitalId: hosp?._id });

    let patRecB = await Patient.findOne({ userId: patBUser._id });
    if (!patRecB) {
      patRecB = await Patient.create({
        userId: patBUser._id,
        hospitalId: hosp?._id,
        uhid: `UHID-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        firstName: 'Bob',
        lastName: 'PatientB',
        gender: 'MALE',
        dateOfBirth: new Date('1990-01-01'),
        phone: '+1-555-9999',
      });
    }
    patientBId = patRecB._id.toString();

    // 5. Create a test consultation & prescription for Patient A
    const appt = await Appointment.create({
      branchId: branch?._id,
      hospitalId: hosp?._id,
      patientId: patientAId,
      doctorId: doctorProfileId,
      appointmentDate: new Date(),
      startTime: '14:00',
      endTime: '14:15',
      type: 'OPD',
      status: 'COMPLETED',
    });

    const consultation = await Consultation.create({
      hospitalId: hosp?._id,
      appointmentId: appt._id,
      patientId: patientAId,
      doctorId: doctorProfileId,
      chiefComplaint: 'Persistent cough and fever',
      status: 'COMPLETED',
    });

    const prescription = await Prescription.create({
      hospitalId: hosp?._id,
      consultationId: consultation._id,
      patientId: patientAId,
      doctorId: doctorProfileId,
      doctorInstructions: 'Drink warm water and rest.',
      medicines: [
        { name: 'Amoxicillin 500mg', dose: '500mg', frequency: '1-0-1', duration: '5 days', route: 'ORAL' },
      ],
      status: 'ACTIVE',
    });
    prescriptionId = prescription._id.toString();
  });

  afterAll(async () => {
    if (fs.existsSync(samplePdfPath)) fs.unlinkSync(samplePdfPath);
    if (fs.existsSync(sampleTxtPath)) fs.unlinkSync(sampleTxtPath);
    await disconnectMongoDB();
  });

  describe('1. EMR Chronological Timeline Aggregation', () => {
    it('should retrieve full reverse chronological EMR timeline for patient', async () => {
      // Record a test radiology report and procedure
      await request(app)
        .post(`/api/v1/emr/patients/${patientAId}/radiology`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ imagingType: 'XRAY', bodyPart: 'Chest', findings: 'Normal cardiac size. Clear lung fields.' });

      await request(app)
        .post(`/api/v1/emr/patients/${patientAId}/procedures`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ procedureName: 'Nebulization Therapy', notes: 'Given 1 dose of Albuterol nebulization.' });

      const res = await request(app)
        .get(`/api/v1/emr/patients/${patientAId}/emr-timeline`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.timeline).toBeDefined();
      expect(res.body.data.timeline.length).toBeGreaterThanOrEqual(3);

      // Verify reverse chronological sorting
      const timeline = res.body.data.timeline;
      for (let i = 0; i < timeline.length - 1; i++) {
        const timeA = new Date(timeline[i].timestamp).getTime();
        const timeB = new Date(timeline[i + 1].timestamp).getTime();
        expect(timeA).toBeGreaterThanOrEqual(timeB);
      }
    });

    it('should REJECT Patient B from viewing Patient A EMR timeline', async () => {
      const res = await request(app)
        .get(`/api/v1/emr/patients/${patientAId}/emr-timeline`)
        .set('Authorization', `Bearer ${patientBToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('2. Professional Prescription PDF Generation Engine', () => {
    it('should stream generated e-Prescription PDF for authorized user', async () => {
      const res = await request(app)
        .get(`/api/v1/prescriptions/${prescriptionId}/pdf`)
        .set('Authorization', `Bearer ${patientAToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.body instanceof Buffer || res.text.includes('%PDF')).toBe(true);
    });

    it('should REJECT Patient B from downloading Patient A prescription PDF', async () => {
      const res = await request(app)
        .get(`/api/v1/prescriptions/${prescriptionId}/pdf`)
        .set('Authorization', `Bearer ${patientBToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('3. Secure Document Upload & Validation', () => {
    it('should reject file upload with invalid MIME type or extension', async () => {
      const res = await request(app)
        .post('/api/v1/documents/upload')
        .set('Authorization', `Bearer ${doctorToken}`)
        .field('patientId', patientAId)
        .field('title', 'Forbidden Executable')
        .attach('file', sampleTxtPath);

      expect(res.status).toBe(500); // Multer fileFilter error handled by error handler
    });

    it('should upload valid medical PDF document securely', async () => {
      const res = await request(app)
        .post('/api/v1/documents/upload')
        .set('Authorization', `Bearer ${doctorToken}`)
        .field('patientId', patientAId)
        .field('documentType', 'LAB_REPORT')
        .field('title', 'Blood Panel Test Report')
        .field('description', 'Fasting lipid & glucose profile')
        .attach('file', samplePdfPath);

      expect(res.status).toBe(201);
      expect(res.body.data.document).toBeDefined();
      expect(res.body.data.document.title).toBe('Blood Panel Test Report');
      documentId = res.body.data.document.id;
    });
  });

  describe('4. Secure Document Access Control & Streaming', () => {
    it('should stream document file for authorized Patient A', async () => {
      const res = await request(app)
        .get(`/api/v1/documents/${documentId}/download`)
        .set('Authorization', `Bearer ${patientAToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
    });

    it('should REJECT unauthorized Patient B attempting to download Patient A document', async () => {
      const res = await request(app)
        .get(`/api/v1/documents/${documentId}/download`)
        .set('Authorization', `Bearer ${patientBToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('5. Comprehensive Security Audit Logging Verification', () => {
    it('should record audit log entries for EMR access, document upload, and download', async () => {
      const logs = await AuditLog.find({
        action: {
          $in: ['EMR_VIEWED', 'DOCUMENT_UPLOADED', 'DOCUMENT_DOWNLOADED', 'PRESCRIPTION_PDF_GENERATED'],
        },
      });

      expect(logs.length).toBeGreaterThanOrEqual(3);
    });
  });
});
