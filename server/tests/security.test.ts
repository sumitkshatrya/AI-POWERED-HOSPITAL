import request from 'supertest';
import app from '../src/app';
import { Hospital, User, Patient, AuditLog } from '../src/models';
import { connectMongoDB, disconnectMongoDB } from '../src/config/database';

describe('Comprehensive Security Audit Test Suite', () => {
  let superAdminToken: string;
  let hospitalAdminAToken: string;
  let hospitalAdminBToken: string;
  let doctorAToken: string;
  let patientAToken: string;
  let patientBToken: string;

  let hospitalAId: string;
  let hospitalBId: string;
  let patientAId: string;
  let patientBId: string;

  beforeAll(async () => {
    await connectMongoDB();

    // 1. Setup Hospital A and Hospital B
    const hospA = await Hospital.findOneAndUpdate(
      { code: 'SEC_HOSP_A' },
      {
        $setOnInsert: {
          name: 'Security Test Hospital A',
          code: 'SEC_HOSP_A',
          contactEmail: 'security.a@hospital.org',
          contactPhone: '+1-555-999-0001',
        },
      },
      { upsert: true, new: true }
    );
    hospitalAId = hospA!._id.toString();

    const hospB = await Hospital.findOneAndUpdate(
      { code: 'SEC_HOSP_B' },
      {
        $setOnInsert: {
          name: 'Security Test Hospital B',
          code: 'SEC_HOSP_B',
          contactEmail: 'security.b@hospital.org',
          contactPhone: '+1-555-999-0002',
        },
      },
      { upsert: true, new: true }
    );
    hospitalBId = hospB!._id.toString();

    // 2. Setup Super Admin
    const superEmail = `super.sec.${Date.now()}@platform.com`;
    await request(app).post('/api/v1/auth/register').send({
      email: superEmail,
      password: 'Password123!',
      firstName: 'Super',
      lastName: 'Security',
      role: 'SUPER_ADMIN',
    });
    const superUser = await User.findOne({ email: superEmail });
    await User.findByIdAndUpdate(superUser!._id, { isEmailVerified: true });
    const superLogin = await request(app).post('/api/v1/auth/login').send({ email: superEmail, password: 'Password123!' });
    superAdminToken = superLogin.body.data.accessToken;

    // 3. Setup Hospital Admin A
    const adminAEmail = `admin.a.sec.${Date.now()}@hospa.com`;
    await request(app).post('/api/v1/auth/register').send({
      email: adminAEmail,
      password: 'Password123!',
      firstName: 'Admin',
      lastName: 'HospA',
      role: 'HOSPITAL_ADMIN',
    });
    const adminAUser = await User.findOne({ email: adminAEmail });
    await User.findByIdAndUpdate(adminAUser!._id, { isEmailVerified: true, hospitalId: hospitalAId });
    const adminALogin = await request(app).post('/api/v1/auth/login').send({ email: adminAEmail, password: 'Password123!' });
    hospitalAdminAToken = adminALogin.body.data.accessToken;

    // 4. Setup Hospital Admin B
    const adminBEmail = `admin.b.sec.${Date.now()}@hospb.com`;
    await request(app).post('/api/v1/auth/register').send({
      email: adminBEmail,
      password: 'Password123!',
      firstName: 'Admin',
      lastName: 'HospB',
      role: 'HOSPITAL_ADMIN',
    });
    const adminBUser = await User.findOne({ email: adminBEmail });
    await User.findByIdAndUpdate(adminBUser!._id, { isEmailVerified: true, hospitalId: hospitalBId });
    const adminBLogin = await request(app).post('/api/v1/auth/login').send({ email: adminBEmail, password: 'Password123!' });
    hospitalAdminBToken = adminBLogin.body.data.accessToken;

    // 5. Setup Doctor A
    const docAEmail = `doc.a.sec.${Date.now()}@hospa.com`;
    await request(app).post('/api/v1/auth/register').send({
      email: docAEmail,
      password: 'Password123!',
      firstName: 'Doctor',
      lastName: 'HospA',
      role: 'DOCTOR',
    });
    const docAUser = await User.findOne({ email: docAEmail });
    await User.findByIdAndUpdate(docAUser!._id, { isEmailVerified: true, hospitalId: hospitalAId });
    const docALogin = await request(app).post('/api/v1/auth/login').send({ email: docAEmail, password: 'Password123!' });
    doctorAToken = docALogin.body.data.accessToken;

    // 6. Setup Patient A
    const patAEmail = `patient.a.sec.${Date.now()}@gmail.com`;
    await request(app).post('/api/v1/auth/register').send({
      email: patAEmail,
      password: 'Password123!',
      firstName: 'Patient',
      lastName: 'Alpha',
      role: 'PATIENT',
    });
    const patAUser = await User.findOne({ email: patAEmail });
    await User.findByIdAndUpdate(patAUser!._id, { isEmailVerified: true, hospitalId: hospitalAId });
    const patALogin = await request(app).post('/api/v1/auth/login').send({ email: patAEmail, password: 'Password123!' });
    patientAToken = patALogin.body.data.accessToken;

    const patARec = await Patient.create({
      userId: patAUser!._id,
      hospitalId: hospitalAId,
      uhid: `UHID-SEC-A-${Date.now().toString().slice(-4)}`,
      firstName: 'Patient',
      lastName: 'Alpha',
      gender: 'FEMALE',
      dateOfBirth: new Date('1995-01-01'),
      phone: '+1-555-000-1111',
    });
    patientAId = patARec._id.toString();

    // 7. Setup Patient B
    const patBEmail = `patient.b.sec.${Date.now()}@gmail.com`;
    await request(app).post('/api/v1/auth/register').send({
      email: patBEmail,
      password: 'Password123!',
      firstName: 'Patient',
      lastName: 'Beta',
      role: 'PATIENT',
    });
    const patBUser = await User.findOne({ email: patBEmail });
    await User.findByIdAndUpdate(patBUser!._id, { isEmailVerified: true, hospitalId: hospitalBId });
    const patBLogin = await request(app).post('/api/v1/auth/login').send({ email: patBEmail, password: 'Password123!' });
    patientBToken = patBLogin.body.data.accessToken;

    const patBRec = await Patient.create({
      userId: patBUser!._id,
      hospitalId: hospitalBId,
      uhid: `UHID-SEC-B-${Date.now().toString().slice(-4)}`,
      firstName: 'Patient',
      lastName: 'Beta',
      gender: 'MALE',
      dateOfBirth: new Date('1992-06-06'),
      phone: '+1-555-000-2222',
    });
    patientBId = patBRec._id.toString();
  });

  afterAll(async () => {
    await disconnectMongoDB();
  });

  describe('1. Authentication & Token Security', () => {
    it('should reject API requests without an authentication token', async () => {
      const res = await request(app).get('/api/v1/patients');
      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Authentication required');
    });

    it('should reject API requests with malformed JWT token', async () => {
      const res = await request(app)
        .get('/api/v1/patients')
        .set('Authorization', 'Bearer invalid.jwt.token.string');

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Invalid or expired authentication token');
    });

    it('should reject requests with expired or tampered token signature', async () => {
      const tamperedToken = `${patientAToken.substring(0, patientAToken.length - 6)}ABCDEF`;
      const res = await request(app)
        .get('/api/v1/patients')
        .set('Authorization', `Bearer ${tamperedToken}`);

      expect(res.status).toBe(401);
    });
  });

  describe('2. Multi-Tenant Isolation & Horizontal Privilege Escalation', () => {
    it('should prevent Patient B from accessing Patient A profile data', async () => {
      const res = await request(app)
        .get(`/api/v1/patients/${patientAId}`)
        .set('Authorization', `Bearer ${patientBToken}`);

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Access denied');
    });

    it('should prevent Hospital Admin A from modifying Hospital B settings', async () => {
      const res = await request(app)
        .put(`/api/v1/hospitals/${hospitalBId}`)
        .set('Authorization', `Bearer ${hospitalAdminAToken}`)
        .send({ name: 'Hacked Hospital Name' });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Cross-tenant access denied');
    });

    it('should allow Super Admin full cross-tenant visibility', async () => {
      const res = await request(app)
        .get(`/api/v1/patients/${patientAId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.patient.id).toBe(patientAId);
    });
  });

  describe('3. File Upload & Malicious Extension Validation', () => {
    it('should reject malicious non-medical executable file uploads (.exe / .php)', async () => {
      const res = await request(app)
        .post('/api/v1/documents/upload')
        .set('Authorization', `Bearer ${patientAToken}`)
        .attach('file', Buffer.from('<?php echo "evil payload"; ?>'), 'malicious_script.php');

      expect(res.status).toBe(500);
      const msg = res.body.detail || res.body.message || '';
      expect(msg).toContain('Only PDF, JPEG, PNG, and WEBP files');
    });

    it('should upload valid medical PDF document for authorized user', async () => {
      const res = await request(app)
        .post('/api/v1/documents/upload')
        .set('Authorization', `Bearer ${patientAToken}`)
        .field('patientId', patientAId)
        .field('title', 'Blood Test Report')
        .field('documentType', 'LAB_RESULT')
        .attach('file', Buffer.from('%PDF-1.4 sample lab report content'), 'blood_report.pdf');

      expect(res.status).toBe(201);
      expect(res.body.data.document.mimeType).toBe('application/pdf');
    });
  });

  describe('4. Audit Trail Logging & Admin Viewer API', () => {
    it('should log sensitive actions to the AuditLog database table', async () => {
      const auditCount = await AuditLog.countDocuments({ action: 'USER_LOGIN' });
      expect(auditCount).toBeGreaterThan(0);
    });

    it('should allow Super Admin to query system audit logs via API', async () => {
      const res = await request(app)
        .get('/api/v1/audit-logs?limit=10')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.logs).toBeInstanceOf(Array);
      expect(res.body.data.pagination.total).toBeGreaterThan(0);
    });

    it('should reject regular Patient from accessing system audit logs', async () => {
      const res = await request(app)
        .get('/api/v1/audit-logs')
        .set('Authorization', `Bearer ${patientAToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('5. Data Protection & Sensitive Leakage Checks', () => {
    it('should never expose password hashes in user API responses', async () => {
      const res = await request(app)
        .get('/api/v1/staff')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      const staffMembers = res.body.data.staff;
      staffMembers.forEach((member: any) => {
        expect(member.passwordHash).toBeUndefined();
      });
    });

    it('should return security response headers via Helmet middleware', async () => {
      const res = await request(app).get('/health');
      expect(res.headers['x-dns-prefetch-control']).toBe('off');
      expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    });
  });
});
