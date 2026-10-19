import request from 'supertest';
import app from '../src/app';
import { Hospital, Branch, Doctor, DoctorSchedule, User, Patient, Appointment, OpdQueue } from '../src/models';
import { connectMongoDB, disconnectMongoDB } from '../src/config/database';

describe('Phase 5: Complete OPD Workflow, Real-Time Queue, Vitals, Lab Orders & Billing Integration Tests', () => {
  let superAdminToken: string;
  let adminToken: string;
  let doctorToken: string;
  let patientToken: string;

  let hospitalId: string;
  let branchId: string;
  let doctorProfileId: string;
  let patientId: string;
  let appointmentId: string;
  let queueTokenId: string;
  let consultationId: string;
  let invoiceId: string;

  beforeAll(async () => {
    await connectMongoDB();
    // 1. Super Admin Auth
    const superRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'superadmin@platform.com', password: 'Password123!' });
    superAdminToken = superRes.body.data.accessToken;

    // Hospital Admin A Auth
    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin.a@citygeneral.com', password: 'Password123!' });
    adminToken = adminRes.body.data.accessToken;

    // 2. Hospital & Branch
    const hosp = await Hospital.findOne();
    hospitalId = hosp?._id.toString() || '';

    const branch = await Branch.findOne({ hospitalId });
    branchId = branch?._id.toString() || '';

    // 3. Doctor User & Profile
    const docUser = await User.findOne({ role: 'DOCTOR' });
    if (docUser) {
      const docLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: docUser.email, password: 'Password123!' });
      doctorToken = docLogin.body.data.accessToken;
      let docProfile = await Doctor.findOne({ userId: docUser._id });
      if (!docProfile) {
        docProfile = await Doctor.findOne();
      }
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

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        await Appointment.deleteMany({
          doctorId: doctorProfileId,
          appointmentDate: { $gte: today, $lt: tomorrow },
        });
      }
    }

    // 4. Patient User
    const patUser = await User.findOne({ role: 'PATIENT' });
    if (patUser) {
      const patLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: patUser.email, password: 'Password123!' });
      patientToken = patLogin.body.data.accessToken;
      const patRec = await Patient.findOne({ userId: patUser._id });
      if (patRec) patientId = patRec._id.toString();
    }

    // 5. Schedule OPD Appointment for test
    const apptRes = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        branchId,
        patientId,
        doctorId: doctorProfileId,
        appointmentDate: new Date().toISOString(),
        slotStartTime: '12:00',
        slotEndTime: '12:15',
        appointmentType: 'OPD',
        reasonForVisit: 'Hypertension routine checkup & headache',
      });

    if (apptRes.status !== 201) {
      console.log('DEBUG P5 APPT CREATION:', JSON.stringify(apptRes.body));
    }
    expect(apptRes.status).toBe(201);
    appointmentId = apptRes.body.data.appointment.id || apptRes.body.data.appointment._id;
  });

  afterAll(async () => {
    await disconnectMongoDB();
  });

  describe('1. Patient Check-In & Token Assignment', () => {
    it('should check in patient at reception and issue sequential token', async () => {
      const res = await request(app)
        .post(`/api/v1/appointments/${appointmentId}/check-in`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.opdQueue).toBeDefined();
      expect(res.body.data.opdQueue.queueStatus).toBe('WAITING');
      queueTokenId = res.body.data.opdQueue.id;
    });
  });

  describe('2. Nurse Vitals Triage', () => {
    it('should record patient vitals with auto-calculated BMI', async () => {
      const res = await request(app)
        .post('/api/v1/vitals')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          patientId,
          appointmentId,
          bpSystolic: 125,
          bpDiastolic: 82,
          heartRate: 76,
          temperature: 98.4,
          spO2: 98.5,
          respiratoryRate: 16,
          weight: 70,
          height: 175,
          bloodGlucose: 105,
          notes: 'Patient feels slight dizziness in the mornings.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.vitalsRecord.bmi).toBe(22.86);
    });

    it('should retrieve patient vitals history for trend visualization', async () => {
      const res = await request(app)
        .get(`/api/v1/vitals/patients/${patientId}/vitals`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.vitalsHistory.length).toBeGreaterThan(0);
      expect(res.body.data.vitalsHistory[0].bpSystolic).toBe(125);
    });
  });

  describe('3. Doctor Call Next & Real-Time Queue Operations', () => {
    it('should allow doctor to call next waiting patient', async () => {
      const res = await request(app)
        .post('/api/v1/opd-queue/call-next')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ doctorId: doctorProfileId });

      expect(res.status).toBe(200);
      expect(res.body.data.currentPatient).toBeDefined();
      expect(res.body.data.currentPatient.queueStatus).toBe('ENGAGED_WITH_DOCTOR');
    });

    it('should allow skipping a queue token if patient is absent', async () => {
      const tempAppt = await Appointment.create({
        branchId,
        hospitalId,
        patientId,
        doctorId: doctorProfileId,
        appointmentDate: new Date(),
        slotStartTime: '12:30',
        slotEndTime: '12:45',
        appointmentType: 'OPD',
        status: 'CHECKED_IN',
      });

      const tempQueue = await OpdQueue.create({
        branchId,
        doctorId: doctorProfileId,
        patientId,
        appointmentId: tempAppt._id.toString(),
        tokenNumber: 99,
        queueStatus: 'WAITING',
      });

      const res = await request(app)
        .post(`/api/v1/opd-queue/${tempQueue._id}/skip`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.queueItem.queueStatus).toBe('PASSED');
    });
  });

  describe('4. Doctor Clinical Workspace (Draft Autosave & Finalization)', () => {
    it('should save draft consultation without closing appointment', async () => {
      const res = await request(app)
        .post('/api/v1/consultations')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          appointmentId,
          patientId,
          doctorId: doctorProfileId,
          chiefComplaints: 'Occasional headaches and fatigue',
          examinationNotes: 'BP slightly elevated. Lungs clear.',
          isDraft: true,
          status: 'DRAFT',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.consultation.isDraft).toBe(true);
      expect(res.body.data.consultation.status).toBe('DRAFT');

      const appt = await Appointment.findById(appointmentId);
      expect(appt?.status).not.toBe('COMPLETED');
    });

    it('should finalize consultation, issuing e-prescription, lab order, and auto-billing invoice', async () => {
      const res = await request(app)
        .post('/api/v1/consultations')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          appointmentId,
          patientId,
          doctorId: doctorProfileId,
          chiefComplaints: 'Occasional headaches and fatigue',
          clinicalFindings: 'Mild essential hypertension.',
          examinationNotes: 'BP 125/82, HR 76. S1 S2 normal.',
          assessment: 'Stage 1 Essential Hypertension.',
          treatmentPlan: 'Lifestyle modifications, low sodium diet, Amlodipine 5mg.',
          followupDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          isDraft: false,
          status: 'FINAL',
          diagnosisCodes: [
            { code: 'I10', description: 'Essential (primary) hypertension', type: 'PRIMARY' },
          ],
          prescription: {
            adviceInstructions: 'Take medication after breakfast. Drink plenty of water.',
            items: [
              {
                medicineName: 'Amlodipine 5mg',
                dosage: '5mg',
                frequency: 'Once Daily (1-0-0)',
                durationDays: 14,
                route: 'ORAL',
                quantity: 14,
                instructions: 'Morning after food',
              },
            ],
          },
          labOrders: [
            { testName: 'Lipid Profile', testCode: 'LIPID-01', specimenType: 'BLOOD', price: 60.0 },
            { testName: 'Serum Creatinine', testCode: 'RENAL-01', specimenType: 'BLOOD', price: 40.0 },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.consultation.status).toBe('FINAL');
      expect(res.body.data.consultation.prescription).toBeDefined();
      expect(res.body.data.consultation.labOrders.length).toBeGreaterThan(0);
      expect(res.body.data.consultation.invoice).toBeDefined();

      consultationId = res.body.data.consultation.id;
      invoiceId = res.body.data.consultation.invoice.id;

      const appt = await Appointment.findById(appointmentId);
      expect(appt?.status).toBe('COMPLETED');
    });
  });

  describe('5. Billing & Payment Workflow', () => {
    it('should list invoices with details including consultation, lab, and pharmacy items', async () => {
      const res = await request(app)
        .get(`/api/v1/billing/invoices?patientId=${patientId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.invoices.length).toBeGreaterThan(0);
      const inv = res.body.data.invoices[0];
      expect(inv.paymentStatus).toBe('UNPAID');
      expect(inv.items.length).toBeGreaterThanOrEqual(3);
    });

    it('should process invoice payment', async () => {
      const res = await request(app)
        .post(`/api/v1/billing/invoices/${invoiceId}/pay`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ paymentMethod: 'CREDIT_CARD' });

      expect(res.status).toBe(200);
      expect(res.body.data.invoice.paymentStatus).toBe('PAID');
      expect(res.body.data.invoice.paymentMethod).toBe('CREDIT_CARD');
    });
  });
});

