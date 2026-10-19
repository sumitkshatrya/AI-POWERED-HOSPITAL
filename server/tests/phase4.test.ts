import request from 'supertest';
import app from '../src/app';
import { Hospital, Branch, Doctor, Patient, User, Appointment, DoctorSchedule } from '../src/models';
import { connectMongoDB, disconnectMongoDB } from '../src/config/database';
import { hashPassword } from '../src/utils/passwords';

describe('Phase 4: Complete Appointment Scheduling System & Doctor Availability Integration Tests', () => {
  jest.setTimeout(60000);

  let doctorToken: string;
  let receptionistToken: string;
  let patientUserToken: string;
  let otherPatientUserToken: string;

  let hospitalId: string;
  let branchId: string;
  let doctorProfileId: string;
  let patientId: string;
  let otherPatientId: string;
  let appointment1Id: string;
  let appointment2Id: string;

  // Compute a valid future weekday for testing
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 14); // 2 weeks in future
  // Ensure it's Monday-Friday
  while (futureDate.getDay() === 0 || futureDate.getDay() === 6) {
    futureDate.setDate(futureDate.getDate() + 1);
  }
  const futureDateStr = futureDate.toISOString().split('T')[0];

  const nextWeekDate = new Date(futureDate);
  nextWeekDate.setDate(nextWeekDate.getDate() + 7);
  while (nextWeekDate.getDay() === 0 || nextWeekDate.getDay() === 6) {
    nextWeekDate.setDate(nextWeekDate.getDate() + 1);
  }
  const nextWeekDateStr = nextWeekDate.toISOString().split('T')[0];

  beforeAll(async () => {
    await connectMongoDB();
    const hospital = await Hospital.findOne();
    hospitalId = hospital?._id.toString() || '';

    const branch = await Branch.findOne({ hospitalId });
    branchId = branch?._id.toString() || '';

    const doctorProfile = await Doctor.findOne();
    doctorProfileId = doctorProfile?._id.toString() || '';

    const patient = await Patient.findOne({ email: 'patient.a1@gmail.com' }) || await Patient.findOne();
    patientId = patient?._id.toString() || '';

    // Login Doctor
    const docRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'doctor.a1@citygeneral.com', password: 'Password123!' });
    doctorToken = docRes.body.data.accessToken;

    // Login Hospital Admin as Receptionist
    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin.a@citygeneral.com', password: 'Password123!' });
    receptionistToken = adminRes.body.data.accessToken;

    // Login Primary Patient
    const patientRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'patient.a1@gmail.com', password: 'Password123!' });
    patientUserToken = patientRes.body.data.accessToken;

    // Create a second patient for double-booking testing
    const pwdHash = await hashPassword('Password123!');
    const otherUser = await User.create({
      email: `patient.test2.${Date.now()}@gmail.com`,
      password: pwdHash,
      firstName: 'Jane',
      lastName: 'DoeTwo',
      role: 'PATIENT',
      hospitalId,
      branchId,
    });

    const otherPatientRecord = await Patient.create({
      userId: otherUser._id,
      hospitalId,
      branchId,
      uhid: `UHID-2026-TEST-${Math.floor(1000 + Math.random() * 9000)}`,
      mrn: `MRN-2026-TEST-${Math.floor(1000 + Math.random() * 9000)}`,
      firstName: 'Jane',
      lastName: 'DoeTwo',
      gender: 'FEMALE',
      dateOfBirth: new Date('1992-08-20'),
      phone: '+1-555-4433',
      email: otherUser.email,
    });
    otherPatientId = otherPatientRecord._id.toString();

    // Login Second Patient
    const otherLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: otherUser.email, password: 'Password123!' });
    otherPatientUserToken = otherLoginRes.body.data.accessToken;

    await Appointment.deleteMany({
      doctorId: doctorProfileId,
    });
  }, 60000);

  afterAll(async () => {
    await DoctorSchedule.updateMany(
      { doctorId: doctorProfileId },
      {
        $set: {
          maxAppointmentsPerDay: 50,
          workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
        },
      }
    );
    await disconnectMongoDB();
  });

  describe('1. Doctor Availability & Schedule Configuration', () => {
    it('should configure doctor schedule with working days, breaks, slot duration, and max appointments cap', async () => {
      const res = await request(app)
        .put(`/api/v1/doctors/${doctorProfileId}/schedule`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
          startTime: '09:00',
          endTime: '17:00',
          breakStartTime: '13:00',
          breakEndTime: '14:00',
          slotDurationMinutes: 30,
          maxAppointmentsPerDay: 2, // Cap set to 2 for limit testing
          leaves: [],
          holidays: [],
          allowOnline: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.schedule.maxAppointmentsPerDay).toBe(2);
      expect(res.body.data.schedule.startTime).toBe('09:00');
    });

    it('should calculate and retrieve available slots for a target date', async () => {
      const res = await request(app)
        .get(`/api/v1/appointments/available-slots?doctorId=${doctorProfileId}&date=${futureDateStr}`)
        .set('Authorization', `Bearer ${patientUserToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isWorkingDay).toBe(true);
      expect(Array.isArray(res.body.data.slots)).toBe(true);

      const breakSlot = res.body.data.slots.find((s: any) => s.slotStartTime === '13:00');
      expect(breakSlot).toBeDefined();
      expect(breakSlot.available).toBe(false);
      expect(breakSlot.reason).toBe('BREAK');
    });
  });

  describe('2. Booking, Past Dates, & Invalid Slot Protections', () => {
    it('should reject appointment bookings on past dates for non-emergency types', async () => {
      const res = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${patientUserToken}`)
        .send({
          branchId,
          patientId,
          doctorId: doctorProfileId,
          appointmentDate: '2020-01-15',
          slotStartTime: '09:00',
          slotEndTime: '09:30',
          appointmentType: 'OPD',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('past dates');
    });

    it('should reject bookings during doctor break time', async () => {
      const res = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${patientUserToken}`)
        .send({
          branchId,
          patientId,
          doctorId: doctorProfileId,
          appointmentDate: futureDateStr,
          slotStartTime: '13:00',
          slotEndTime: '13:30',
          appointmentType: 'OPD',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('break time');
    });

    it('should successfully book valid appointment #1', async () => {
      const res = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${patientUserToken}`)
        .send({
          branchId,
          patientId,
          doctorId: doctorProfileId,
          appointmentDate: futureDateStr,
          slotStartTime: '09:00',
          slotEndTime: '09:30',
          appointmentType: 'OPD',
          reasonForVisit: 'General checkup',
        });

      if (res.status !== 201) console.log('DEBUG P4 APPT1:', JSON.stringify(res.body));
      expect(res.status).toBe(201);
      expect(['CONFIRMED', 'SCHEDULED']).toContain(res.body.data.appointment.status);
      appointment1Id = res.body.data.appointment.id;
    });
  });

  describe('3. Anti-Double Booking & Max Appointments Cap', () => {
    it('should prevent double booking the doctor for the same time slot', async () => {
      const res = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          branchId,
          patientId: otherPatientId,
          doctorId: doctorProfileId,
          appointmentDate: futureDateStr,
          slotStartTime: '09:00',
          slotEndTime: '09:30',
          appointmentType: 'OPD',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Double booking');
    });

    it('should book valid appointment #2 to reach the daily max cap (2 appts)', async () => {
      const res = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          branchId,
          patientId: otherPatientId,
          doctorId: doctorProfileId,
          appointmentDate: futureDateStr,
          slotStartTime: '09:30',
          slotEndTime: '10:00',
          appointmentType: 'OPD',
        });

      expect(res.status).toBe(201);
      appointment2Id = res.body.data.appointment.id;
    });

    it('should prevent booking appointment #3 when daily maximum cap is reached', async () => {
      const res = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          branchId,
          patientId,
          doctorId: doctorProfileId,
          appointmentDate: futureDateStr,
          slotStartTime: '10:00',
          slotEndTime: '10:30',
          appointmentType: 'OPD',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('maximum appointment limit');
    });
  });

  describe('4. Rescheduling & Cancellation Operations', () => {
    it('should reschedule appointment #1 to a new date/time slot', async () => {
      const res = await request(app)
        .post(`/api/v1/appointments/${appointment1Id}/reschedule`)
        .set('Authorization', `Bearer ${patientUserToken}`)
        .send({
          appointmentDate: nextWeekDateStr,
          slotStartTime: '11:00',
          slotEndTime: '11:30',
        });

      if (res.status !== 200) console.log('DEBUG P4 RESCHEDULE:', JSON.stringify(res.body));
      expect(res.status).toBe(200);
      expect(res.body.data.appointment.slotStartTime).toBe('11:00');
    });

    it('should cancel appointment #2 with a cancellation reason', async () => {
      const res = await request(app)
        .post(`/api/v1/appointments/${appointment2Id}/cancel`)
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          reason: 'Patient requested cancellation due to personal reasons',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.appointment.status).toBe('CANCELLED');
      expect(res.body.data.appointment.cancelReason).toContain('Patient requested');
    });
  });

  describe('5. Doctor Leaves & Holiday Enforcement', () => {
    it('should block appointment bookings when doctor is on leave', async () => {
      // Add leave for nextWeekDateStr
      await request(app)
        .put(`/api/v1/doctors/${doctorProfileId}/schedule`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
          startTime: '09:00',
          endTime: '17:00',
          breakStartTime: '13:00',
          breakEndTime: '14:00',
          slotDurationMinutes: 30,
          maxAppointmentsPerDay: 20,
          leaves: [{ fromDate: nextWeekDateStr, toDate: nextWeekDateStr, reason: 'Annual Conference' }],
          holidays: [],
          allowOnline: true,
        });

      const res = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${patientUserToken}`)
        .send({
          branchId,
          patientId,
          doctorId: doctorProfileId,
          appointmentDate: nextWeekDateStr,
          slotStartTime: '09:00',
          slotEndTime: '09:30',
          appointmentType: 'OPD',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Doctor is on leave');
    });
  });

  describe('6. Security & Authorization Controls', () => {
    it('should prevent unauthorized patient from cancelling another patient\'s appointment', async () => {
      const res = await request(app)
        .post(`/api/v1/appointments/${appointment1Id}/cancel`)
        .set('Authorization', `Bearer ${otherPatientUserToken}`)
        .send({ reason: 'Malicious attempt' });

      expect(res.status).toBe(403);
    });

    it('should return 401 Unauthorized for unauthenticated requests', async () => {
      const res = await request(app).get('/api/v1/appointments');
      expect(res.status).toBe(401);
    });
  });
});
