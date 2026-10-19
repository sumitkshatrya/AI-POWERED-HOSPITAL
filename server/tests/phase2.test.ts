import request from 'supertest';
import app from '../src/app';
import { Hospital, Branch } from '../src/models';
import { connectMongoDB, disconnectMongoDB } from '../src/config/database';
import { Role } from '../src/types/roles';

describe('Phase 2: Hospital, Branch, Department & Staff Management Integration Tests', () => {
  jest.setTimeout(45000);

  let superAdminToken: string;
  let adminAToken: string;
  let adminBToken: string;

  let hospitalAId: string;
  let hospitalBId: string;
  let branchA1Id: string;
  let departmentCardId: string;

  beforeAll(async () => {
    await connectMongoDB();
    // Fetch seeded hospital IDs
    const hospitalA = await Hospital.findOne();
    const hospitalB = await Hospital.findOne();

    hospitalAId = hospitalA?._id.toString() || '';
    hospitalBId = hospitalB?._id.toString() || '';

    const branchA1 = await Branch.findOne({ hospitalId: hospitalAId });
    branchA1Id = branchA1?._id.toString() || '';

    // Login Super Admin
    const superRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'superadmin@platform.com', password: 'Password123!' });
    superAdminToken = superRes.body.data.accessToken;

    // Login Hospital Admin A
    const adminARes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin.a@citygeneral.com', password: 'Password123!' });
    adminAToken = adminARes.body.data.accessToken;

    // Login Hospital Admin B
    const adminBRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin.b@metropolitanhealth.com', password: 'Password123!' });
    adminBToken = adminBRes.body.data.accessToken;
  }, 60000);

  afterAll(async () => {
    await disconnectMongoDB();
  });

  describe('1. Hospital Management API Tests', () => {
    it('should allow Super Admin to onboard a new Hospital Network', async () => {
      const code = `TEST_HOSP_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const res = await request(app)
        .post('/api/v1/hospitals')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'St. Jude Children Research Network',
          code,
          contactEmail: 'contact@stjude.org',
          contactPhone: '+1-555-9988',
          facilities: ['Pediatric ICU', 'Oncology Lab', 'Emergency'],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.hospital.name).toBe('St. Jude Children Research Network');
      expect(res.body.data.hospital.facilities).toContain('Pediatric ICU');
    });

    it('should allow Hospital Admin to update their own hospital details', async () => {
      const res = await request(app)
        .put(`/api/v1/hospitals/${hospitalAId}`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          website: 'https://citygeneralhealth.org',
          emergencyContact: '+1-800-911-0000',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.hospital.website).toBe('https://citygeneralhealth.org');
    });

    it('should DENY Hospital Admin A from updating Hospital B details', async () => {
      const res = await request(app)
        .put(`/api/v1/hospitals/${hospitalBId}`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ name: 'Hacked Hospital Name' });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });
  });

  describe('2. Branch Management API Tests', () => {
    it('should create a new branch under Hospital A', async () => {
      const code = `BR_EAST_${Date.now()}`;
      const res = await request(app)
        .post('/api/v1/branches')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          hospitalId: hospitalAId,
          name: 'City General East Wing',
          code,
          address: '400 East Avenue',
          city: 'Metropolis',
          state: 'NY',
          postalCode: '10002',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.branch.name).toBe('City General East Wing');
    });

    it('should list branches for Hospital A', async () => {
      const res = await request(app)
        .get(`/api/v1/branches?hospitalId=${hospitalAId}`)
        .set('Authorization', `Bearer ${adminAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.branches.length).toBeGreaterThan(0);
    });
  });

  describe('3. Clinical Department API Tests', () => {
    it('should seed default 14 clinical departments for Branch A1', async () => {
      const res = await request(app)
        .post('/api/v1/departments/seed-defaults')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ hospitalId: hospitalAId, branchId: branchA1Id });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
    });

    it('should list clinical departments for Branch A1 including Cardiology', async () => {
      const res = await request(app)
        .get(`/api/v1/departments?branchId=${branchA1Id}`)
        .set('Authorization', `Bearer ${adminAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.departments.length).toBeGreaterThanOrEqual(14);
      const card = res.body.data.departments.find((d: any) => d.code === 'CARD');
      expect(card).toBeDefined();
      departmentCardId = card.id;
    });

    it('should allow creating a custom department (e.g. Telehealth & AI Medicine)', async () => {
      const code = `AI_MED_${Date.now()}`;
      const res = await request(app)
        .post('/api/v1/departments')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          hospitalId: hospitalAId,
          branchId: branchA1Id,
          name: 'Digital Health & AI Medicine',
          code,
          services: ['Virtual Consultation', 'Remote Vital Monitoring', 'AI Triage'],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.department.name).toBe('Digital Health & AI Medicine');
    });
  });

  describe('4. Staff Management API Tests', () => {
    it('should create a new Doctor staff member under Cardiology department', async () => {
      const email = `dr.smith_${Date.now()}@citygeneral.com`;
      const res = await request(app)
        .post('/api/v1/staff')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          hospitalId: hospitalAId,
          branchId: branchA1Id,
          departmentId: departmentCardId,
          email,
          firstName: 'Robert',
          lastName: 'Smith',
          role: Role.DOCTOR,
          specialization: 'Interventional Cardiology',
          licenseNumber: 'MD-998822',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.staff.firstName).toBe('Robert');
      expect(res.body.data.staff.role).toBe(Role.DOCTOR);
    });

    it('should list staff members with pagination and role filter', async () => {
      const res = await request(app)
        .get(`/api/v1/staff?hospitalId=${hospitalAId}&role=${Role.DOCTOR}&page=1&limit=5`)
        .set('Authorization', `Bearer ${adminAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.staff.length).toBeGreaterThan(0);
      expect(res.body.data.meta.total).toBeGreaterThan(0);
    });

    it('should toggle staff account status to SUSPENDED and back to ACTIVE', async () => {
      const staffListRes = await request(app)
        .get(`/api/v1/staff?hospitalId=${hospitalAId}&limit=1`)
        .set('Authorization', `Bearer ${adminAToken}`);

      const staffId = staffListRes.body.data.staff[0].id;

      const toggleRes = await request(app)
        .patch(`/api/v1/staff/${staffId}/status`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ status: 'SUSPENDED' });

      expect(toggleRes.status).toBe(200);
      expect(toggleRes.body.data.staff.status).toBe('SUSPENDED');

      // Restore to ACTIVE
      await request(app)
        .patch(`/api/v1/staff/${staffId}/status`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ status: 'ACTIVE' });
    });
  });
});
