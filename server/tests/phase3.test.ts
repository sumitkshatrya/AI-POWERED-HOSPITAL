import request from 'supertest';
import app from '../src/app';
import { Hospital, Branch, Doctor, DoctorSchedule, Appointment } from '../src/models';
import { connectMongoDB, disconnectMongoDB } from '../src/config/database';

describe('Phase 3: Doctor & Patient Management, EMR Timeline, & Security Integration Tests', () => {
  jest.setTimeout(60000);

  let doctorToken: string;
  let receptionistToken: string;
  let patientUserToken: string;

  let hospitalId: string;
  let branchId: string;
  let doctorProfileId: string;
  let patientId: string;
  let appointmentId: string;

  beforeAll(async () => {
    await connectMongoDB();
    const hospital = await Hospital.findOne();
    hospitalId = hospital?._id.toString() || '';

    const branch = await Branch.findOne({ hospitalId });
    branchId = branch?._id.toString() || '';

    const doctorProfile = await Doctor.findOne();
    doctorProfileId = doctorProfile?._id.toString() || '';

    if (doctorProfileId) {
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

    // Login Doctor
    const docRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'doctor.a1@citygeneral.com', password: 'Password123!' });
    doctorToken = docRes.body.data.accessToken;

    // Login Hospital Admin as Receptionist role
    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin.a@citygeneral.com', password: 'Password123!' });
    receptionistToken = adminRes.body.data.accessToken;

    // Login Patient User
    const patientRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'patient.a1@gmail.com', password: 'Password123!' });
    patientUserToken = patientRes.body.data.accessToken;
  }, 60000);

  afterAll(async () => {
    await disconnectMongoDB();
  });

  describe('1. Patient Management, UHID & MRN Engine', () => {
    it('should register a new patient and generate UHID format UHID-YYYY-XXXX and MRN format MRN-YYYY-XXXX', async () => {
      const res = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          hospitalId,
          branchId,
          firstName: 'Robert',
          lastName: 'Smith',
          gender: 'MALE',
          dateOfBirth: '1980-05-15',
          bloodGroup: 'A+',
          phone: `+1-555-${Math.floor(1000 + Math.random() * 9000)}`,
          email: `robert.smith.${Date.now()}@gmail.com`,
          emergencyContactName: 'Jane Smith',
          emergencyContactPhone: '+1-555-9988',
          allergies: ['Aspirin', 'Sulfa'],
          chronicConditions: ['Asthma'],
          medicalHistory: ['Hypertension diagnosed 2020'],
          existingConditions: ['Mild Asthma'],
          previousSurgeries: ['Appendectomy'],
          currentMedication: ['Albuterol'],
          familyHistory: ['Father: Heart Disease'],
          insuranceProvider: 'HealthGuard Insurance',
          insurancePolicyNumber: 'HG-99881122',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.patient.uhid).toMatch(/^UHID-\d{4}-\d{4}$/);
      expect(res.body.data.patient.mrn).toMatch(/^MRN-\d{4}-\d{4}$/);
      expect(res.body.data.patient.firstName).toBe('Robert');
      patientId = res.body.data.patient.id;
    });

    it('should search patients by UHID, MRN, or name', async () => {
      const res = await request(app)
        .get('/api/v1/patients?search=Robert')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.patients.length).toBeGreaterThan(0);
      expect(res.body.data.patients[0].firstName).toBe('Robert');
    });
  });

  describe('2. Public Doctor Directory & Search', () => {
    it('should list public doctors with filters, sorting, and pagination', async () => {
      const res = await request(app).get('/api/v1/doctors?specialty=Cardiology&sortBy=rating&page=1&limit=5');

      expect(res.status).toBe(200);
      expect(res.body.data.doctors.length).toBeGreaterThan(0);
      expect(res.body.data.doctors[0].specialization).toBe('Cardiology');
      expect(res.body.data.pagination.total).toBeGreaterThan(0);
    });

    it('should fetch public doctor profile page by ID', async () => {
      const res = await request(app).get(`/api/v1/doctors/${doctorProfileId}`);

      expect(res.status).toBe(200);
      expect(res.body.data.doctor.id).toBe(doctorProfileId);
      expect(res.body.data.doctor.qualification).toBeDefined();
    });

    it('should fetch doctor metrics for dashboard', async () => {
      const res = await request(app)
        .get('/api/v1/doctors/me/dashboard')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.metrics).toBeDefined();
      expect(res.body.data.metrics.todayAppointments).toBeDefined();
      expect(res.body.data.metrics.revenue).toBeDefined();
    });

    it('should post patient review for doctor', async () => {
      const res = await request(app)
        .post(`/api/v1/doctors/${doctorProfileId}/reviews`)
        .set('Authorization', `Bearer ${patientUserToken}`)
        .send({
          patientId,
          rating: 5,
          comment: 'Excellent doctor! Very thorough cardiac evaluation.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.review.rating).toBe(5);
    });
  });

  describe('3. OPD Appointment & Receptionist Check-in', () => {
    it('should schedule an OPD appointment for the patient', async () => {
      const res = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          branchId,
          patientId,
          doctorId: doctorProfileId,
          appointmentDate: new Date().toISOString(),
          slotStartTime: '10:00',
          slotEndTime: '10:15',
          appointmentType: 'OPD_FIRST',
          reasonForVisit: 'Shortness of breath and wheezing',
        });

      if (res.status !== 201) console.log('DEBUG P3:', JSON.stringify(res.body));
      expect(res.status).toBe(201);
      expect(res.body.data.appointment.status).toBe('SCHEDULED');
      appointmentId = res.body.data.appointment.id;
    });

    it('should check in patient at reception and assign sequential token number', async () => {
      const res = await request(app)
        .post(`/api/v1/appointments/${appointmentId}/check-in`)
        .set('Authorization', `Bearer ${receptionistToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.appointment.status).toBe('CHECKED_IN');
      expect(res.body.data.opdQueue.tokenNumber).toBeGreaterThanOrEqual(1);
      expect(res.body.data.opdQueue.queueStatus).toBe('WAITING');
    });
  });

  describe('4. Doctor Consultation Workspace & e-Prescription', () => {
    it('should allow doctor to call next waiting patient', async () => {
      const res = await request(app)
        .post('/api/v1/opd-queue/call-next')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ doctorId: doctorProfileId });

      expect(res.status).toBe(200);
      expect(res.body.data.currentPatient).toBeDefined();
      expect(res.body.data.currentPatient.queueStatus).toBe('ENGAGED_WITH_DOCTOR');
    });

    it('should record doctor consultation with SOAP notes, vitals, ICD-10, and e-prescription', async () => {
      const res = await request(app)
        .post('/api/v1/consultations')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          appointmentId,
          patientId,
          doctorId: doctorProfileId,
          chiefComplaints: 'Shortness of breath, mild wheezing on exertion',
          clinicalFindings: 'Bilateral expiratory wheeze present. SpO2 96% on room air.',
          vitals: {
            systolicBp: 124,
            diastolicBp: 82,
            pulseRate: 78,
            temperature: 98.6,
            spo2: 96,
            weightKg: 74,
            heightCm: 175,
            bmi: 24.16,
          },
          diagnosisCodes: [
            { code: 'J45.909', description: 'Unspecified asthma, uncomplicated', type: 'PRIMARY' },
          ],
          soapNotes: {
            subjective: 'Patient reports 3-day history of progressive dyspnea.',
            objective: 'Lungs: Expiratory wheeze. Heart: Normal S1/S2.',
            assessment: 'Mild Acute Asthma Exacerbation',
            plan: 'Prescribed Albuterol inhaler + oral Salbutamol.',
          },
          prescription: {
            adviceInstructions: 'Avoid cold beverages and known triggers. Use inhaler before exercise.',
            items: [
              {
                medicineName: 'Albuterol HFA Inhaler 90mcg',
                dosage: '2 puffs',
                frequency: 'Every 4-6 hours as needed',
                durationDays: 14,
                route: 'INHALATION',
                quantity: 1,
                instructions: 'Rinse mouth after inhalation',
              },
              {
                medicineName: 'Montelukast 10mg Tablet',
                dosage: '10 mg',
                frequency: '0-0-1',
                durationDays: 30,
                route: 'ORAL',
                quantity: 30,
                instructions: 'Take at bedtime',
              },
            ],
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.data.consultation.prescription).toBeDefined();
      expect(res.body.data.consultation.prescription.prescriptionCode).toMatch(/^RX-\d{4}-/);
      expect(res.body.data.consultation.prescription.items.length).toBe(2);
    });

    it('should retrieve patient EMR history timeline with consultations and vitals', async () => {
      const res = await request(app)
        .get(`/api/v1/patients/${patientId}/timeline`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.timeline.length).toBeGreaterThan(0);
      expect(res.body.data.timeline[0].chiefComplaints).toBe('Shortness of breath, mild wheezing on exertion');
    });
  });

  describe('5. Security & Multi-Tenant Authorization', () => {
    it('should REJECT unauthorized access to another patient record for Patient user', async () => {
      const res = await request(app)
        .get(`/api/v1/patients/${patientId}`)
        .set('Authorization', `Bearer ${patientUserToken}`);

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });
  });
});
