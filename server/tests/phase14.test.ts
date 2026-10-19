import request from 'supertest';
import app from '../src/app';
import { Hospital, Branch, User, Patient } from '../src/models';
import { connectMongoDB, disconnectMongoDB } from '../src/config/database';

describe('Phase 14: Advanced Analytics, Executive Reports & Multi-Role Dashboards', () => {
  let adminToken: string;
  let doctorToken: string;
  let nurseToken: string;
  let patientToken: string;

  let patientId: string;
  let hospitalId: string;
  let branchId: string;

  beforeAll(async () => {
    await connectMongoDB();

    let hosp = await Hospital.findOne();
    if (!hosp) {
      hosp = await Hospital.create({
        name: 'Analytics Test Hospital',
        code: `ATH-${Date.now().toString().slice(-4)}`,
        address: '100 Data Way',
        contactPhone: '+1-555-014-9999',
        contactEmail: 'contact@analyticshosp.org',
      });
    }
    hospitalId = hosp._id.toString();

    let branch = await Branch.findOne({ hospitalId });
    if (!branch) {
      branch = await Branch.create({
        hospitalId,
        name: 'Main Analytics Branch',
        code: `MAB-${Date.now().toString().slice(-4)}`,
        address: '100 Data Way',
        city: 'Metropolis',
        state: 'NY',
        postalCode: '10001',
      });
    }
    branchId = branch._id.toString();

    // 1. Setup Admin
    const adminEmail = `analytics.admin14.${Date.now()}@hospital.com`;
    await request(app).post('/api/v1/auth/register').send({
      email: adminEmail,
      password: 'Password123!',
      firstName: 'Analytics',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
    });
    const adminUser = await User.findOne({ email: adminEmail });
    await User.findByIdAndUpdate(adminUser!._id, { isEmailVerified: true, hospitalId, branchId });
    const adminLogin = await request(app).post('/api/v1/auth/login').send({ email: adminEmail, password: 'Password123!' });
    adminToken = adminLogin.body.data.accessToken;

    // 2. Setup Doctor
    const docEmail = `analytics.doc14.${Date.now()}@hospital.com`;
    await request(app).post('/api/v1/auth/register').send({
      email: docEmail,
      password: 'Password123!',
      firstName: 'Doctor',
      lastName: 'Phase14',
      role: 'DOCTOR',
    });
    const docUser = await User.findOne({ email: docEmail });
    await User.findByIdAndUpdate(docUser!._id, { isEmailVerified: true, hospitalId, branchId });
    const docLogin = await request(app).post('/api/v1/auth/login').send({ email: docEmail, password: 'Password123!' });
    doctorToken = docLogin.body.data.accessToken;

    // 3. Setup Nurse
    const nurseEmail = `analytics.nurse14.${Date.now()}@hospital.com`;
    await request(app).post('/api/v1/auth/register').send({
      email: nurseEmail,
      password: 'Password123!',
      firstName: 'Nurse',
      lastName: 'Phase14',
      role: 'NURSE',
    });
    const nurseUser = await User.findOne({ email: nurseEmail });
    await User.findByIdAndUpdate(nurseUser!._id, { isEmailVerified: true, hospitalId, branchId });
    const nurseLogin = await request(app).post('/api/v1/auth/login').send({ email: nurseEmail, password: 'Password123!' });
    nurseToken = nurseLogin.body.data.accessToken;

    // 4. Setup Patient
    const patEmail = `analytics.patient14.${Date.now()}@hospital.com`;
    await request(app).post('/api/v1/auth/register').send({
      email: patEmail,
      password: 'Password123!',
      firstName: 'Patient',
      lastName: 'Phase14',
      role: 'PATIENT',
    });
    const patUser = await User.findOne({ email: patEmail });
    await User.findByIdAndUpdate(patUser!._id, { isEmailVerified: true, hospitalId, branchId });
    const patLogin = await request(app).post('/api/v1/auth/login').send({ email: patEmail, password: 'Password123!' });
    patientToken = patLogin.body.data.accessToken;

    const patRec = await Patient.create({
      userId: patUser!._id,
      hospitalId,
      branchId,
      uhid: `UHID-P14-${Date.now().toString().slice(-5)}`,
      firstName: 'Patient',
      lastName: 'Phase14',
      gender: 'MALE',
      dateOfBirth: new Date('1990-05-15'),
      phone: '+1-555-014-0001',
    });
    patientId = patRec._id.toString();
  });

  afterAll(async () => {
    await disconnectMongoDB();
  });

  describe('1. Admin Analytics Engine', () => {
    it('should return admin operational metrics and chart trends for SUPER_ADMIN', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/admin?timeframe=30_DAYS')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.metrics).toBeDefined();
      expect(res.body.data.metrics.totalPatients).toBeGreaterThanOrEqual(0);
      expect(res.body.data.charts).toBeDefined();
      expect(res.body.data.charts.revenueExpenseTrend).toBeInstanceOf(Array);
    });

    it('should support custom timeframe parameters', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/admin?timeframe=CUSTOM&startDate=2026-01-01&endDate=2026-12-31')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.metrics).toBeDefined();
    });

    it('should deny access to admin analytics for PATIENT role', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/admin')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('2. Multi-Role Tailored Dashboards', () => {
    it('should return role-specific dashboard for DOCTOR', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/dashboard')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe('DOCTOR');
      expect(res.body.data.rolePayload.todayAppts).toBeDefined();
    });

    it('should return role-specific dashboard for NURSE', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/dashboard')
        .set('Authorization', `Bearer ${nurseToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe('NURSE');
      expect(res.body.data.rolePayload.activeIpd).toBeDefined();
    });

    it('should return role-specific dashboard for PATIENT', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/dashboard')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe('PATIENT');
      expect(res.body.data.rolePayload.myAppts).toBeDefined();
    });
  });

  describe('3. Executive Reports & Streaming Exports', () => {
    it('should generate PATIENTS report in JSON format', async () => {
      const res = await request(app)
        .get('/api/v1/reports?module=PATIENTS&format=json')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.module).toBe('PATIENTS');
      expect(res.body.data.kpiSummary).toBeInstanceOf(Array);
      expect(res.body.data.headers).toBeInstanceOf(Array);
      expect(res.body.data.rows).toBeInstanceOf(Array);
    });

    it('should generate REVENUE report in CSV format', async () => {
      const res = await request(app)
        .get('/api/v1/reports?module=REVENUE&format=csv')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toContain('text/csv');
      expect(res.text).toContain('Txn ID');
    });

    it('should stream executive PDF report for BEDS module', async () => {
      const res = await request(app)
        .get('/api/v1/reports?module=BEDS&format=pdf')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toBe('application/pdf');
      expect(res.body).toBeInstanceOf(Buffer);
    });

    it('should enforce RBAC security and deny PATIENT role from downloading REVENUE report', async () => {
      const res = await request(app)
        .get('/api/v1/reports?module=REVENUE&format=json')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Access denied');
    });
  });
});
