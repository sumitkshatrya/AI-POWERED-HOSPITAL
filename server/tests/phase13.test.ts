import request from 'supertest';
import app from '../src/app';
import {
  Hospital,
  Branch,
  Department,
  Doctor,
  User,
  Patient,
  LabTest,
  LabOrder,
} from '../src/models';
import { connectMongoDB, disconnectMongoDB } from '../src/config/database';

describe('Phase 13: AI Assistant Engine & Clinical Copilot Integration Tests', () => {
  let doctorToken: string;
  let patientAToken: string;
  let patientBToken: string;
  let adminToken: string;

  let patientAId: string;
  let patientBId: string;
  let doctorId: string;
  let hospitalId: string;
  let branchId: string;

  let sampleLabOrderId: string;

  beforeAll(async () => {
    await connectMongoDB();
    // 1. Setup Admin, Doctor, and Patients
    const adminEmail = `ai.admin13.${Date.now()}@hospital.com`;
    await request(app).post('/api/v1/auth/register').send({
      email: adminEmail,
      password: 'Password123!',
      firstName: 'AI Admin',
      lastName: 'Director',
      role: 'SUPER_ADMIN',
    });
    const adminUser = await User.findOne({ email: adminEmail });
    if (adminUser) {
      adminUser.isVerified = true;
      await adminUser.save();
    }
    const adminLogin = await request(app).post('/api/v1/auth/login').send({ email: adminEmail, password: 'Password123!' });
    adminToken = adminLogin.body.data.accessToken;

    let hosp = await Hospital.findOne();
    if (!hosp) {
      hosp = await Hospital.create({
        name: 'AI Medical Research Hospital',
        code: `AIMH-${Date.now().toString().slice(-4)}`,
        address: '100 AI Medical Way',
        phone: '+1-555-900-1313',
        email: 'contact@aimedical.org',
      });
    }
    hospitalId = hosp._id.toString();

    let branch = await Branch.findOne({ hospitalId });
    if (!branch) {
      branch = await Branch.create({
        hospitalId,
        name: 'AI Main Campus',
        code: `AIMC-${Date.now().toString().slice(-4)}`,
        address: '100 AI Medical Way',
      });
    }
    branchId = branch._id.toString();

    // Doctor
    const docEmail = `ai.doctor13.${Date.now()}@hospital.com`;
    await request(app).post('/api/v1/auth/register').send({
      email: docEmail,
      password: 'Password123!',
      firstName: 'Dr. Sarah',
      lastName: 'Conner',
      role: 'DOCTOR',
    });
    const docUser = await User.findOne({ email: docEmail });
    if (docUser) {
      docUser.isVerified = true;
      await docUser.save();
    }
    const docLogin = await request(app).post('/api/v1/auth/login').send({ email: docEmail, password: 'Password123!' });
    doctorToken = docLogin.body.data.accessToken;
    const docUserId = docUser!._id;

    let dept = await Department.findOne({ hospitalId });
    if (!dept) {
      dept = await Department.create({
        branchId,
        hospitalId,
        name: 'Internal Medicine',
        description: 'General medicine care',
      });
    }

    let docProfile = await Doctor.findOne({ userId: docUserId });
    if (!docProfile) {
      docProfile = await Doctor.create({
        userId: docUserId,
        hospitalId,
        branchId,
        departmentId: dept._id,
        specialization: 'Internal Medicine',
        licenseNumber: `DOC-LIC-${Date.now().toString().slice(-4)}`,
      });
    }
    doctorId = docProfile._id.toString();

    // Patient A
    const patAEmail = `ai.patient13a.${Date.now()}@gmail.com`;
    await request(app).post('/api/v1/auth/register').send({
      email: patAEmail,
      password: 'Password123!',
      firstName: 'Alice',
      lastName: 'Wonderland',
      role: 'PATIENT',
    });
    const patAUser = await User.findOne({ email: patAEmail });
    if (patAUser) {
      patAUser.isVerified = true;
      await patAUser.save();
    }
    const patALogin = await request(app).post('/api/v1/auth/login').send({ email: patAEmail, password: 'Password123!' });
    patientAToken = patALogin.body.data.accessToken;

    const patA = await Patient.create({
      userId: patAUser!._id,
      hospitalId,
      branchId,
      uhid: `UHID-2026-${Math.floor(1000 + Math.random() * 9000)}-A`,
      firstName: 'Alice',
      lastName: 'Wonderland',
      gender: 'FEMALE',
      dateOfBirth: new Date('1992-05-15'),
      phone: `+1555${Math.floor(100000 + Math.random() * 900000)}`,
      medicalHistory: 'Mild bronchial asthma',
      allergies: ['Penicillin allergy'],
    });
    patientAId = patA._id.toString();

    // Patient B
    const patBEmail = `ai.patient13b.${Date.now()}@gmail.com`;
    await request(app).post('/api/v1/auth/register').send({
      email: patBEmail,
      password: 'Password123!',
      firstName: 'Bob',
      lastName: 'Builder',
      role: 'PATIENT',
    });
    const patBUser = await User.findOne({ email: patBEmail });
    if (patBUser) {
      patBUser.isVerified = true;
      await patBUser.save();
    }
    const patBLogin = await request(app).post('/api/v1/auth/login').send({ email: patBEmail, password: 'Password123!' });
    patientBToken = patBLogin.body.data.accessToken;

    const patB = await Patient.create({
      userId: patBUser!._id,
      hospitalId,
      branchId,
      uhid: `UHID-2026-${Math.floor(1000 + Math.random() * 9000)}-B`,
      firstName: 'Bob',
      lastName: 'Builder',
      gender: 'MALE',
      dateOfBirth: new Date('1985-08-20'),
      phone: `+1555${Math.floor(100000 + Math.random() * 900000)}`,
    });
    patientBId = patB._id.toString();

    // Seed a Lab Order for Patient A for report explanation tests
    const labCat = await LabTest.create({
      hospitalId,
      code: `CBC-${Date.now().toString().slice(-4)}`,
      name: 'Complete Blood Count (CBC) with Differential',
      category: 'HAEMATOLOGY',
      sampleType: 'Whole Blood EDTA',
      price: 45.0,
    });

    const labOrder = await LabOrder.create({
      orderNumber: `LAB-${Date.now().toString().slice(-4)}`,
      patientId: patientAId,
      doctorId,
      hospitalId,
      status: 'VERIFIED',
      notes: 'Normal blood count within standard reference limits.',
      tests: [
        {
          testId: labCat._id,
          testName: labCat.name,
          price: 45.0,
          result: 'Hemoglobin: 14.2 g/dL, WBC: 7,500 /uL, Platelets: 250,000 /uL',
        },
      ],
    });
    sampleLabOrderId = labOrder._id.toString();
  });

  afterAll(async () => {
    await disconnectMongoDB();
  });

  // ==========================================
  // 1. AI PATIENT SUMMARY
  // ==========================================
  describe('1. AI Patient Summary Engine', () => {
    it('should generate a structured concise summary for authorized doctor', async () => {
      const res = await request(app)
        .get(`/api/v1/ai/patients/${patientAId}/summary`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.summary).toBeDefined();

      const summary = res.body.data.summary;
      expect(summary.summaryText).toContain('Alice Wonderland');
      expect(summary.disclaimer).toBe('AI-generated summary — verify against the medical record.');
      expect(Array.isArray(summary.activeConditions)).toBe(true);
      expect(Array.isArray(summary.allergiesAndRiskFactors)).toBe(true);
    });

    it('should allow Patient A to view their OWN AI summary', async () => {
      const res = await request(app)
        .get(`/api/v1/ai/patients/${patientAId}/summary`)
        .set('Authorization', `Bearer ${patientAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.summary.disclaimer).toBe('AI-generated summary — verify against the medical record.');
    });

    it('should REJECT Patient B attempting to access Patient A AI summary (RBAC Isolation)', async () => {
      const res = await request(app)
        .get(`/api/v1/ai/patients/${patientAId}/summary`)
        .set('Authorization', `Bearer ${patientBToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/access denied/i);
    });
  });

  // ==========================================
  // 2. AI CLINICAL NOTE ASSISTANT (SOAP STRUCTURER)
  // ==========================================
  describe('2. AI Clinical Note Assistant (SOAP Structurer)', () => {
    it('should convert rough clinical notes into structured SOAP segments', async () => {
      const res = await request(app)
        .post('/api/v1/ai/clinical-notes/structure')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          rawNotes: 'pt presents with fever for 2 days temp 101F, cough and sore throat, chest clear, rx paracetamol 500mg tid and warm gargles',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');

      const soap = res.body.data.structuredNotes;
      expect(soap.chiefComplaint).toBeDefined();
      expect(soap.symptoms).toBeDefined();
      expect(soap.examination).toBeDefined();
      expect(soap.assessment).toBeDefined();
      expect(soap.plan).toBeDefined();
      expect(soap.followUp).toBeDefined();
      expect(soap.disclaimer).toMatch(/doctor must review and approve/i);
    });

    it('should REJECT empty or invalid clinical note input', async () => {
      const res = await request(app)
        .post('/api/v1/ai/clinical-notes/structure')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          rawNotes: 'a',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/invalid input/i);
    });
  });

  // ==========================================
  // 3. AI REPORT EXPLANATION (PATIENT COPILOT)
  // ==========================================
  describe('3. AI Medical Report Plain-Language Explainer', () => {
    it('should provide a plain-language explanation of a lab report for Patient A', async () => {
      const res = await request(app)
        .post('/api/v1/ai/reports/explain')
        .set('Authorization', `Bearer ${patientAToken}`)
        .send({
          reportId: sampleLabOrderId,
          reportTitle: 'Complete Blood Count (CBC)',
          reportCategory: 'LABORATORY',
          findings: 'Hemoglobin: 14.2 g/dL, WBC: 7,500 /uL, Platelets: 250,000 /uL. All within reference limits.',
          impression: 'Normal complete blood count',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');

      const explanation = res.body.data.explanation;
      expect(explanation.plainLanguageSummary).toBeDefined();
      expect(Array.isArray(explanation.explainedTerminology)).toBe(true);
      expect(explanation.disclaimer).toBe(
        'This explanation is for educational purposes only. It is not a medical diagnosis. Please consult your physician.'
      );
    });

    it('should REJECT Patient B attempting to explain Patient A lab report', async () => {
      const res = await request(app)
        .post('/api/v1/ai/reports/explain')
        .set('Authorization', `Bearer ${patientBToken}`)
        .send({
          reportId: sampleLabOrderId,
          reportTitle: 'Complete Blood Count (CBC)',
          reportCategory: 'LABORATORY',
          findings: 'Hemoglobin 14.2',
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/access denied/i);
    });
  });

  // ==========================================
  // 4. AI SMART SPECIALTY NAVIGATION
  // ==========================================
  describe('4. AI Smart Specialty & Symptom Navigation', () => {
    it('should navigate "I have a skin problem" to Dermatology with guidance', async () => {
      const res = await request(app)
        .post('/api/v1/ai/specialty-navigation')
        .set('Authorization', `Bearer ${patientAToken}`)
        .send({
          symptomQuery: 'I have a skin problem with severe redness and itching',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');

      const nav = res.body.data.navigation;
      expect(nav.suggestedSpecialty).toBe('Dermatology');
      expect(nav.disclaimer).toMatch(/navigation purposes only and does not constitute medical advice/i);
    });

    it('should navigate "chest pain and rapid heart rate" to Cardiology', async () => {
      const res = await request(app)
        .post('/api/v1/ai/specialty-navigation')
        .set('Authorization', `Bearer ${patientBToken}`)
        .send({
          symptomQuery: 'chest pain and rapid heart rate',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.navigation.suggestedSpecialty).toBe('Cardiology');
    });
  });

  // ==========================================
  // 5. AI ADMIN OPERATIONAL ANALYTICS
  // ==========================================
  describe('5. AI Admin Operational Analytics & Intelligence', () => {
    it('should generate operational analytics for Hospital Admin', async () => {
      const res = await request(app)
        .get('/api/v1/ai/admin-analytics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');

      const data = res.body.data;
      expect(data.metrics).toBeDefined();
      expect(data.metrics.totalAppointments).toBeDefined();
      expect(data.metrics.totalRevenue).toBeDefined();

      const ai = data.aiInterpretation;
      expect(ai.operationalOverview).toBeDefined();
      expect(ai.keyMetricsSummary).toBeDefined();
      expect(ai.disclaimer).toMatch(/Numerical metrics are retrieved directly from database records/i);
    });

    it('should REJECT regular Patient attempting to access Admin Operational Analytics', async () => {
      const res = await request(app)
        .get('/api/v1/ai/admin-analytics')
        .set('Authorization', `Bearer ${patientAToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/access denied/i);
    });
  });

  // ==========================================
  // 6. SECURITY AUDIT LOGGING & AI INTERACTION TRAIL
  // ==========================================
  describe('6. Security Audit Logging & Interaction Trail', () => {
    it('should record entries in AiInteractionLog for AI calls', async () => {
      const res = await request(app)
        .get('/api/v1/ai/logs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data.logs)).toBe(true);
      expect(res.body.data.logs.length).toBeGreaterThan(0);

      const firstLog = res.body.data.logs[0];
      expect(firstLog.feature).toBeDefined();
      expect(firstLog.provider).toBeDefined();
      expect(firstLog.disclaimerShown).toBe(true);
    });
  });
});
