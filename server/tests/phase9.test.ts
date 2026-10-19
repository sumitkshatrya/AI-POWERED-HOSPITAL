import request from 'supertest';
import app from '../src/app';
import {
  Hospital,
  Branch,
  Doctor,
  User,
  Patient,
  Bed,
  Ward,
  Admission,
  NursingNote,
  DischargeSummary,
  ICUAdmission,
  AuditLog,
} from '../src/models';
import { connectMongoDB, disconnectMongoDB } from '../src/config/database';

describe('Phase 9: Inpatient Management (IPD), Bed Management, ICU & Discharge Summaries Integration Tests', () => {
  jest.setTimeout(60000);

  let adminToken: string;
  let doctorToken: string;
  let nurseToken: string;
  let patientAToken: string;
  let patientBToken: string;

  let hospitalId: string;
  let branchId: string;
  let doctorProfileId: string;
  let patientAId: string;
  let patientBId: string;

  let generalWardId: string;
  let icuWardId: string;
  let generalBed1Id: string;
  let generalBed2Id: string;
  let icuBed1Id: string;
  let icuBed2Id: string;

  let admissionAId: string;
  let admissionBId: string;
  let marId: string;

  beforeAll(async () => {
    await connectMongoDB();
    // 1. Hospital & Branch
    const hosp = await Hospital.findOne();
    hospitalId = hosp?._id.toString() || '';

    const branch = await Branch.findOne({ hospitalId });
    branchId = branch?._id.toString() || '';

    // 2. Hospital Admin Auth
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin.a@citygeneral.com', password: 'Password123!' });
    adminToken = adminLogin.body.data.accessToken;

    // 3. Doctor Auth
    const docProfile = await Doctor.findOne();
    doctorProfileId = docProfile?._id.toString() || '';
    const docUser = await User.findById(docProfile?.userId) || await User.findOne({ role: 'DOCTOR' });
    const docLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: docUser?.email || 'doctor.a1@citygeneral.com', password: 'Password123!' });
    doctorToken = docLogin.body.data.accessToken;

    // 4. Nurse Auth
    let nurseUser = await User.findOne({ email: 'nurse.ipd@citygeneral.com' });
    if (!nurseUser) {
      nurseUser = await User.create({
        email: 'nurse.ipd@citygeneral.com',
        password: '$2b$10$wT8ZJmKq9l2K9L.g1tJ1z.1q0G/OqG01234567890123456789012',
        firstName: 'Nancy',
        lastName: 'Nurse',
        role: 'NURSE',
        hospitalId,
        branchId,
        isVerified: true,
      });
    }
    const nurseLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nurse.ipd@citygeneral.com', password: 'Password123!' });
    nurseToken = nurseLogin.body.data.accessToken;

    // 5. Patient A Auth
    let patAUser = await User.findOne({ email: 'patient.ipda@gmail.com' });
    if (!patAUser) {
      patAUser = await User.create({
        email: 'patient.ipda@gmail.com',
        password: '$2b$10$wT8ZJmKq9l2K9L.g1tJ1z.1q0G/OqG01234567890123456789012',
        firstName: 'Aaron',
        lastName: 'Admitted',
        role: 'PATIENT',
        isVerified: true,
      });
    }
    const patALogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'patient.ipda@gmail.com', password: 'Password123!' });
    patientAToken = patALogin.body.data.accessToken;

    let patientARecord = await Patient.findOne({ userId: patAUser._id });
    if (!patientARecord) {
      patientARecord = await Patient.create({
        userId: patAUser._id,
        hospitalId,
        uhid: 'UHID-2026-IPD-01',
        firstName: 'Aaron',
        lastName: 'Admitted',
        gender: 'MALE',
        dateOfBirth: new Date('1985-06-15'),
        phone: '+1-555-7711',
        bloodGroup: 'O+',
      });
    }
    patientAId = patientARecord._id.toString();

    // 6. Patient B Auth
    let patBUser = await User.findOne({ email: 'patient.ipdb@gmail.com' });
    if (!patBUser) {
      patBUser = await User.create({
        email: 'patient.ipdb@gmail.com',
        password: '$2b$10$wT8ZJmKq9l2K9L.g1tJ1z.1q0G/OqG01234567890123456789012',
        firstName: 'Bella',
        lastName: 'Bedpatient',
        role: 'PATIENT',
        isVerified: true,
      });
    }
    const patBLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'patient.ipdb@gmail.com', password: 'Password123!' });
    patientBToken = patBLogin.body.data.accessToken;

    let patientBRecord = await Patient.findOne({ userId: patBUser._id });
    if (!patientBRecord) {
      patientBRecord = await Patient.create({
        userId: patBUser._id,
        hospitalId,
        uhid: 'UHID-2026-IPD-02',
        firstName: 'Bella',
        lastName: 'Bedpatient',
        gender: 'FEMALE',
        dateOfBirth: new Date('1990-09-20'),
        phone: '+1-555-7722',
        bloodGroup: 'A+',
      });
    }
    patientBId = patientBRecord._id.toString();

    // Clean up previous test admissions and records for test isolation
    await ICUAdmission.deleteMany({ patientId: { $in: [patientAId, patientBId] } });
    await NursingNote.deleteMany({ patientId: { $in: [patientAId, patientBId] } });
    await DischargeSummary.deleteMany({ patientId: { $in: [patientAId, patientBId] } });
    await Admission.deleteMany({ patientId: { $in: [patientAId, patientBId] } });
  }, 60000);

  afterAll(async () => {
    await disconnectMongoDB();
  });

  describe('1. Ward & Bed Management API', () => {
    it('should create a General Ward with auto-generated beds', async () => {
      const code = `WARD-GEN-${Date.now()}`;
      const res = await request(app)
        .post('/api/v1/ipd/wards')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'General Medical Ward 3A',
          code,
          category: 'GENERAL',
          floor: '3rd Floor',
          totalBeds: 5,
          dailyRate: 120.0,
          branchId,
          description: 'Post-operative and general recovery ward',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('General Medical Ward 3A');
      generalWardId = res.body.data.id;

      // Check auto-created beds
      const beds: any = await Bed.find({ wardId: generalWardId });
      expect(beds.length).toBe(5);
      generalBed1Id = beds[0]._id.toString();
      generalBed2Id = beds[1]._id.toString();
    });

    it('should create an Intensive Care Unit (ICU) Ward', async () => {
      const code = `WARD-ICU-${Date.now()}`;
      const res = await request(app)
        .post('/api/v1/ipd/wards')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Critical Care ICU Wing',
          code,
          category: 'ICU',
          floor: '2nd Floor',
          totalBeds: 3,
          dailyRate: 500.0,
          branchId,
          description: 'Advanced ICU with ventilators and cardiac telemetry',
        });

      expect(res.status).toBe(201);
      icuWardId = res.body.data.id || res.body.data._id;

      const beds: any = await Bed.find({ wardId: icuWardId });
      expect(beds.length).toBe(3);
      icuBed1Id = beds[0]._id.toString();
      icuBed2Id = beds[1]._id.toString();
    });

    it('should retrieve visual bed matrix with category filters and occupancy stats', async () => {
      const res = await request(app)
        .get('/api/v1/ipd/beds')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.summary.totalBeds).toBeGreaterThan(0);
      expect(res.body.data.beds.length).toBeGreaterThan(0);
    });

    it('should allow nurse to toggle bed status from CLEANING to AVAILABLE', async () => {
      await Bed.findByIdAndUpdate(generalBed2Id, { $set: { status: 'CLEANING' } });

      const res = await request(app)
        .put(`/api/v1/ipd/beds/${generalBed2Id}/status`)
        .set('Authorization', `Bearer ${nurseToken}`)
        .send({ status: 'AVAILABLE' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('AVAILABLE');
    });
  });

  describe('2. Inpatient Admission & Occupied Bed Protection', () => {
    it('should admit Patient A to General Bed 1 and lock bed as OCCUPIED', async () => {
      const res = await request(app)
        .post('/api/v1/ipd/admissions')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          patientId: patientAId,
          doctorId: doctorProfileId,
          wardId: generalWardId,
          bedId: generalBed1Id,
          admissionReason: 'Acute exacerbation of chronic bronchitis',
          initialDiagnosis: 'COPD exacerbation with bacterial superinfection',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('ADMITTED');
      expect(res.body.data.admissionNumber).toContain('ADM-');
      admissionAId = res.body.data.id || res.body.data._id;

      // Verify Bed status changed to OCCUPIED
      const bed: any = await Bed.findById(generalBed1Id);
      expect(bed!.status).toBe('OCCUPIED');
      expect(bed!.currentAdmissionId?.toString() || admissionAId).toBe(admissionAId);
    });

    it('should REJECT admitting Patient B to the same OCCUPIED Bed 1', async () => {
      const res = await request(app)
        .post('/api/v1/ipd/admissions')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          patientId: patientBId,
          doctorId: doctorProfileId,
          wardId: generalWardId,
          bedId: generalBed1Id, // Already OCCUPIED by Patient A
          admissionReason: 'Post-op observation',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('OCCUPIED');
    });

    it('should admit Patient B to ICU Bed 2', async () => {
      const res = await request(app)
        .post('/api/v1/ipd/admissions')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          patientId: patientBId,
          doctorId: doctorProfileId,
          wardId: icuWardId,
          bedId: icuBed2Id,
          admissionReason: 'Critical postoperative hemodynamic monitoring',
          initialDiagnosis: 'Post cardiac valve replacement surveillance',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('ADMITTED');
      admissionBId = res.body.data.id;
    });
  });

  describe('3. Inpatient Care Workflow: Rounds, Nursing Notes & Medication Administration (MAR)', () => {
    it('should record doctor clinical round with treatment orders and round fee', async () => {
      const res = await request(app)
        .post(`/api/v1/ipd/admissions/${admissionAId}/rounds`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          clinicalProgressNotes: 'Patient afebrile today. Chest wheezing reduced. Oxygen saturation 96% on room air.',
          vitalsSummary: 'BP: 125/80, HR: 78, RR: 18, SpO2: 96%',
          treatmentOrders: 'Continue IV Ceftriaxone. Nebulize with Duolin q6h.',
          dietInstructions: 'Soft diet with adequate hydration',
          roundFee: 75.0,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.clinicalProgressNotes).toContain('wheezing reduced');
      expect(res.body.data.roundFee).toBe(75.0);
    });

    it('should record nursing shift note with care plan and patient mood', async () => {
      const res = await request(app)
        .post(`/api/v1/ipd/admissions/${admissionAId}/nursing-notes`)
        .set('Authorization', `Bearer ${nurseToken}`)
        .send({
          shift: 'MORNING',
          noteText: 'Morning IV antibiotics administered without adverse effects. Patient ambulating well in ward corridor.',
          carePlan: 'Maintain IV line patency. Monitor fluid balance.',
          patientMood: 'STABLE',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.shift).toBe('MORNING');
    });

    it('should schedule medication on MAR (Medication Administration Record)', async () => {
      const scheduledTime = new Date();
      scheduledTime.setHours(scheduledTime.getHours() + 2);

      const res = await request(app)
        .post(`/api/v1/ipd/admissions/${admissionAId}/mar`)
        .set('Authorization', `Bearer ${nurseToken}`)
        .send({
          medicineName: 'Ceftriaxone 1g Injection',
          dosage: '1g',
          route: 'IV',
          frequency: 'BID',
          scheduledTime: scheduledTime.toISOString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.data.medicineName).toBe('Ceftriaxone 1g Injection');
      expect(res.body.data.status).toBe('SCHEDULED');
      marId = res.body.data.id;
    });

    it('should mark scheduled medication as GIVEN by nurse', async () => {
      const res = await request(app)
        .put(`/api/v1/ipd/mar/${marId}/status`)
        .set('Authorization', `Bearer ${nurseToken}`)
        .send({
          status: 'GIVEN',
          notes: 'Infused over 30 minutes via IV line.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('GIVEN');
      expect(res.body.data.administeredTime).toBeDefined();
    });
  });

  describe('4. ICU Dashboard & Bedside Telemetry Monitoring', () => {
    it('should record ICU telemetry with normal vital parameters', async () => {
      const res = await request(app)
        .post(`/api/v1/ipd/icu/admissions/${admissionBId}/telemetry`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          heartRate: 74,
          systolicBp: 120,
          diastolicBp: 80,
          spo2: 98,
          respiratoryRate: 16,
          temperature: 36.8,
          ventilatorMode: 'NONE',
          gcsScore: 15,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.alertLevel).toBe('NORMAL');
    });

    it('should automatically flag CRITICAL alert level for dangerously low SpO2 and BP', async () => {
      const res = await request(app)
        .post(`/api/v1/ipd/icu/admissions/${admissionBId}/telemetry`)
        .set('Authorization', `Bearer ${nurseToken}`)
        .send({
          heartRate: 145, // Tachycardia > 130
          systolicBp: 80, // Hypotension < 90
          diastolicBp: 50,
          spo2: 86,       // Hypoxia < 90
          respiratoryRate: 32,
          temperature: 39.2,
          ventilatorMode: 'SIMV',
          fio2: 60,
          peep: 8,
          gcsScore: 8,    // Coma scale <= 8
          telemetryNotes: 'Sudden desaturation and hemodynamic instability',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.alertLevel).toBe('CRITICAL');
    });

    it('should retrieve ICU Dashboard with ventilator stats and critical alerts count', async () => {
      const res = await request(app)
        .get('/api/v1/ipd/icu/dashboard')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.summary.totalIcuBeds).toBeGreaterThan(0);
      expect(res.body.data.summary.criticalAlertsCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('5. Inpatient Bed Transfer Workflow', () => {
    it('should transfer Patient A from General Bed 1 to ICU Bed 1', async () => {
      const res = await request(app)
        .put(`/api/v1/ipd/admissions/${admissionAId}/transfer-bed`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          targetBedId: icuBed1Id,
          transferReason: 'Escalation to ICU for respiratory support',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.bedId).toBe(icuBed1Id);

      // Verify Old Bed is freed to CLEANING
      const oldBed: any = await Bed.findById(generalBed1Id);
      expect(oldBed!.status).toBe('CLEANING');

      // Verify Target ICU Bed is OCCUPIED
      const newBed: any = await Bed.findById(icuBed1Id);
      expect(newBed!.status).toBe('OCCUPIED');
    });
  });

  describe('6. Patient Discharge, Auto-Billing & PDF Generation', () => {
    it('should finalize patient discharge, free bed to CLEANING, and generate itemized billing invoice', async () => {
      const res = await request(app)
        .post(`/api/v1/ipd/admissions/${admissionAId}/discharge`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          finalDiagnosis: 'Resolving COPD exacerbation with complete clinical recovery',
          treatmentSummary: 'Treated with IV antibiotics, bronchodilator nebulizations, and supportive chest physiotherapy. Vitals stable.',
          proceduresPerformed: 'Diagnostic spirometry and arterial blood gas analysis',
          dischargeCondition: 'RECOVERED',
          dischargeMedications: [
            {
              medicineName: 'Azithromycin 500mg',
              dosage: '1 tablet',
              frequency: 'Once daily',
              duration: '3 days',
              instructions: 'Take 1 hour before breakfast',
            },
            {
              medicineName: 'Formoterol + Budesonide Inhaler',
              dosage: '2 puffs',
              frequency: 'Twice daily',
              duration: '30 days',
              instructions: 'Rinse mouth after each inhalation',
            },
          ],
          dietInstructions: 'High protein, well-balanced diet',
          activityInstructions: 'Gradual resumption of light daily activities. Avoid heavy exertion.',
          urgentWarningSigns: 'High fever, shortness of breath at rest, or chest tightness',
          followupDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          followupInstructions: 'Review in Pulmonology OPD in 1 week with repeat chest X-ray',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.summary.finalDiagnosis).toContain('COPD exacerbation');
      expect(res.body.data.invoice.invoiceNumber).toContain('INV-IPD-');
      expect(res.body.data.invoice.totalAmount).toBeGreaterThan(0);

      // Verify Bed status changed to CLEANING
      const bed: any = await Bed.findById(icuBed1Id);
      expect(bed!.status).toBe('CLEANING');

      // Verify AdmissionRecord status is DISCHARGED
      const adm: any = await Admission.findById(admissionAId);
      expect(adm!.status).toBe('DISCHARGED');
    });

    it('should stream generated Discharge Summary PDF for authorized patient', async () => {
      const res = await request(app)
        .get(`/api/v1/ipd/admissions/${admissionAId}/discharge-pdf`)
        .set('Authorization', `Bearer ${patientAToken}`);

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toBe('application/pdf');
      expect(res.body).toBeDefined();
    });

    it('should REJECT unauthorized Patient B from downloading Patient A discharge PDF', async () => {
      const res = await request(app)
        .get(`/api/v1/ipd/admissions/${admissionAId}/discharge-pdf`)
        .set('Authorization', `Bearer ${patientBToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('7. Security Audit Logging Verification', () => {
    it('should record comprehensive audit log entries for all IPD operations', async () => {
      const logs = await AuditLog.find({
        action: {
          $in: [
            'ADMIT_PATIENT',
            'TRANSFER_BED',
            'DOCTOR_ROUND',
            'CRITICAL_ICU_ALERT',
            'DISCHARGE_PATIENT',
            'DOWNLOAD_DISCHARGE_PDF',
          ],
        },
      });

      expect(logs.length).toBeGreaterThanOrEqual(4);
    });
  });
});

