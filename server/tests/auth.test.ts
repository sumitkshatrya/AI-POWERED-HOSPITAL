import request from 'supertest';
import app from '../src/app';
import { Hospital, Branch } from '../src/models';
import { connectMongoDB, disconnectMongoDB } from '../src/config/database';
import { Role } from '../src/types/roles';

describe('Phase 1: Authentication & Authorization Integration Tests', () => {
  let userAToken: string;
  let userBToken: string;
  let patientToken: string;
  let superAdminToken: string;

  let hospitalAId: string;
  let hospitalBId: string;
  let branchA1Id: string;
  let branchB1Id: string;

  beforeAll(async () => {
    await connectMongoDB();
    // Fetch seeded hospital & branch IDs
    const hospitalA = await Hospital.findOne();
    const hospitalB = await Hospital.findOne();

    hospitalAId = hospitalA?._id.toString() || '';
    hospitalBId = hospitalB?._id.toString() || '';

    const branchA1 = await Branch.findOne({ hospitalId: hospitalAId });
    const branchB1 = await Branch.findOne({ hospitalId: hospitalBId });

    branchA1Id = branchA1?._id.toString() || '';
    branchB1Id = branchB1?._id.toString() || '';

    // Login Super Admin
    const superRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'superadmin@platform.com', password: 'Password123!' });
    superAdminToken = superRes.body.data.accessToken;

    // Login Hospital Admin A
    const adminARes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin.a@citygeneral.com', password: 'Password123!' });
    userAToken = adminARes.body.data.accessToken;

    // Login Hospital Admin B
    const adminBRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin.b@metropolitanhealth.com', password: 'Password123!' });
    userBToken = adminBRes.body.data.accessToken;

    // Login Patient A1
    const patientRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'patient.a1@gmail.com', password: 'Password123!' });
    patientToken = patientRes.body.data.accessToken;
  }, 60000);

  afterAll(async () => {
    await disconnectMongoDB();
  });

  describe('1. Authentication Tests', () => {
    it('should login successfully with valid credentials and set cookies', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'doctor.a1@citygeneral.com', password: 'Password123!' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.role).toBe(Role.DOCTOR);
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should reject login with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'doctor.a1@citygeneral.com', password: 'WrongPassword!' });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('should register a new patient user', async () => {
      const email = `newpatient_${Date.now()}@gmail.com`;
      const res = await request(app).post('/api/v1/auth/register').send({
        email,
        password: 'Password123!',
        firstName: 'Jane',
        lastName: 'Doe',
        role: Role.PATIENT,
      });

      expect(res.status).toBe(201);
      expect(res.body.data.user.email).toBe(email);
      expect(res.body.data.verificationToken).toBeDefined();
    });

    it('should verify email address with token', async () => {
      const email = `verify_${Date.now()}@gmail.com`;
      const regRes = await request(app).post('/api/v1/auth/register').send({
        email,
        password: 'Password123!',
        firstName: 'Mark',
        lastName: 'Twain',
      });

      const token = regRes.body.data.verificationToken;

      const verifyRes = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ token });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.message).toBe('Email verified successfully.');
    });

    it('should logout user and clear session cookies', async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'doctor.a1@citygeneral.com', password: 'Password123!' });

      const refreshToken = loginRes.body.data.refreshToken;

      const logoutRes = await request(app)
        .post('/api/v1/auth/logout')
        .send({ refreshToken });

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.message).toBe('Logout successful.');
    });
  });

  describe('2. Unauthorized & Expired Token Tests', () => {
    it('should block unauthorized requests to protected endpoints', async () => {
      const res = await request(app).get('/api/v1/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('should reject requests with malformed or expired JWT token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid.token.string');

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });
  });

  describe('3. Role-Based Access Control (RBAC) Tests', () => {
    it('should allow Super Admin to access hospital management endpoints', async () => {
      const res = await request(app)
        .get('/api/v1/hospitals')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.hospitals.length).toBeGreaterThanOrEqual(2);
    });

    it('should deny Patient from accessing Super Admin endpoints', async () => {
      const res = await request(app)
        .get('/api/v1/hospitals')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });
  });

  describe('4. Multi-Tenant Isolation Tests (Cross-Hospital Protection)', () => {
    it('should allow Hospital Admin A to access Hospital A branches', async () => {
      const res = await request(app)
        .get(`/api/v1/hospitals/${hospitalAId}/branches`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.branches.length).toBeGreaterThan(0);
    });

    it('should REJECT Hospital Admin A attempting to access Hospital B data', async () => {
      const res = await request(app)
        .get(`/api/v1/hospitals/${hospitalBId}/branches`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
      expect(res.body.detail).toContain('Cross-tenant access denied');
    });

    it('should REJECT Hospital Admin A accessing Hospital B protected branch endpoint', async () => {
      const res = await request(app)
        .get(`/api/v1/hospitals/${hospitalBId}/branches/${branchB1Id}/protected-data`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('should allow Super Admin to access any hospital branch data', async () => {
      const res = await request(app)
        .get(`/api/v1/hospitals/${hospitalBId}/branches/${branchB1Id}/protected-data`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.branchName).toBeDefined();
    });
  });

  describe('5. Password Reset & Verification Workflow', () => {
    it('should generate password reset token and execute password reset', async () => {
      const email = `reset_test_${Date.now()}@citygeneral.com`;
      await request(app).post('/api/v1/auth/register').send({
        email,
        password: 'Password123!',
        firstName: 'Reset',
        lastName: 'User',
      });

      // 1. Request forgot password
      const forgotRes = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email });

      expect(forgotRes.status).toBe(200);
      const resetToken = forgotRes.body.data.resetToken;
      expect(resetToken).toBeDefined();

      // 2. Reset password using token
      const resetRes = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: resetToken, newPassword: 'NewPassword123!' });

      expect(resetRes.status).toBe(200);

      // 3. Verify login works with new password
      const newLoginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email, password: 'NewPassword123!' });

      expect(newLoginRes.status).toBe(200);
    });
  });
});

