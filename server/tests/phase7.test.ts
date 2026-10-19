import request from 'supertest';
import app from '../src/app';
import {
  Hospital,
  Branch,
  Doctor,
  User,
  Patient,
  LabOrder,
  AuditLog,
} from '../src/models';
import { connectMongoDB, disconnectMongoDB } from '../src/config/database';

describe('Phase 7: Laboratory (LIS) & Radiology (RIS) Architecture Integration Tests', () => {
  jest.setTimeout(60000);

  let doctorToken: string;
  let pathologistToken: string;
  let radiologistToken: string;
  let patientAToken: string;
  let patientBToken: string;

  let hospitalId: string;
  let branchId: string;
  let doctorProfileId: string;
  let patientAId: string;
  let patientBId: string;
  let labOrderId: string;
  let radiologyOrderId: string;
  let catalogItemId: string;

  beforeAll(async () => {
    await connectMongoDB();
    // 1. Hospital & Branch setup
    const hosp = await Hospital.findOne();
    hospitalId = hosp?._id.toString() || '';

    const branch = await Branch.findOne({ hospitalId });
    branchId = branch?._id.toString() || '';

    // 2. Doctor Profile
    const docProfile = await Doctor.findOne();
    doctorProfileId = docProfile?._id.toString() || '';

    // Doctor Auth
    const docUser = await User.findById(docProfile?.userId) || await User.findOne({ role: 'DOCTOR' });
    const docLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: docUser?.email || 'doctor.a1@citygeneral.com', password: 'Password123!' });
    doctorToken = docLogin.body.data.accessToken;

    // 3. Pathologist (Lab Tech) Setup & Auth
    let pathologistUser = await User.findOne({ email: 'pathologist.test@citygeneral.com' });
    if (!pathologistUser) {
      pathologistUser = await User.create({
        email: 'pathologist.test@citygeneral.com',
        password: '$2b$10$wT8ZJmKq9l2K9L.g1tJ1z.1q0G/OqG01234567890123456789012',
        firstName: 'Dr. Pamela',
        lastName: 'Pathologist',
        role: 'LAB_TECHNICIAN',
        hospitalId,
        branchId,
        isVerified: true,
      });
    } else {
      await User.findByIdAndUpdate(pathologistUser._id, { $set: { role: 'LAB_TECHNICIAN' } });
    }
    const pathLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'pathologist.test@citygeneral.com', password: 'Password123!' });
    pathologistToken = pathLogin.body.data.accessToken;

    // 4. Radiologist Setup & Auth
    let radiologistUser = await User.findOne({ email: 'radiologist.test@citygeneral.com' });
    if (!radiologistUser) {
      radiologistUser = await User.create({
        email: 'radiologist.test@citygeneral.com',
        password: '$2b$10$wT8ZJmKq9l2K9L.g1tJ1z.1q0G/OqG01234567890123456789012',
        firstName: 'Dr. Ray',
        lastName: 'Radiologist',
        role: 'RADIOLOGIST',
        hospitalId,
        branchId,
        isVerified: true,
      });
    }
    const radLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'radiologist.test@citygeneral.com', password: 'Password123!' });
    radiologistToken = radLogin.body.data.accessToken;

    // 5. Patient A Auth
    let patAUser = await User.findOne({ email: 'patient.a1@gmail.com' }) || await User.findOne({ role: 'PATIENT' });
    if (!patAUser) {
      patAUser = await User.create({
        email: 'patient.a1@gmail.com',
        password: '$2b$10$wT8ZJmKq9l2K9L.g1tJ1z.1q0G/OqG01234567890123456789012',
        firstName: 'Alice',
        lastName: 'PatientA',
        role: 'PATIENT',
        isVerified: true,
      });
    }

    const patALogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: patAUser.email, password: 'Password123!' });
    patientAToken = patALogin.body.data.accessToken;

    let patRecA = await Patient.findOne({ userId: patAUser._id });
    if (!patRecA) {
      patRecA = await Patient.create({
        userId: patAUser._id,
        hospitalId,
        uhid: `UHID-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        mrn: `MRN-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        firstName: 'Alice',
        lastName: 'PatientA',
        gender: 'FEMALE',
        dateOfBirth: new Date('1995-05-15'),
        phone: '+1-555-1122',
      });
    }
    patientAId = patRecA._id.toString();

    // 6. Patient B Setup & Auth
    let patBUser = await User.findOne({ email: 'patient.b.test@gmail.com' });
    if (!patBUser) {
      patBUser = await User.create({
        email: 'patient.b.test@gmail.com',
        password: '$2b$10$wT8ZJmKq9l2K9L.g1tJ1z.1q0G/OqG01234567890123456789012',
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

    let patRecB = await Patient.findOne({ userId: patBUser._id });
    if (!patRecB) {
      patRecB = await Patient.create({
        userId: patBUser._id,
        hospitalId,
        uhid: `UHID-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        firstName: 'Bob',
        lastName: 'PatientB',
        gender: 'MALE',
        dateOfBirth: new Date('1990-01-01'),
        phone: '+1-555-9988',
      });
    }
    patientBId = patRecB._id.toString();
  }, 60000);

  afterAll(async () => {
    await disconnectMongoDB();
  });

  describe('1. Laboratory Test Catalog Management', () => {
    it('should create a new master lab test catalog item', async () => {
      const res = await request(app)
        .post('/api/v1/labs/catalog')
        .set('Authorization', `Bearer ${pathologistToken}`)
        .send({
          hospitalId,
          testCode: `HBA1C-${Date.now()}`,
          testName: 'Glycated Hemoglobin (HbA1c)',
          category: 'BIOCHEMISTRY',
          specimenType: 'WHOLE_BLOOD',
          containerType: 'EDTA_TUBE',
          price: 65.0,
          referenceRangeMin: 4.0,
          referenceRangeMax: 5.6,
          unit: '%',
          description: '3-month average blood glucose control',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.catalogItem.testName).toBe('Glycated Hemoglobin (HbA1c)');
      catalogItemId = res.body.data.catalogItem.id;
    });

    it('should retrieve master lab test catalog filterable by category', async () => {
      const res = await request(app)
        .get('/api/v1/labs/catalog?category=BIOCHEMISTRY')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.catalog.length).toBeGreaterThan(0);
    });
  });

  describe('2. Laboratory Order Lifecycle (Sample -> Result -> Verification)', () => {
    it('should create a new laboratory order for Patient A', async () => {
      const res = await request(app)
        .post('/api/v1/labs/orders')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          patientId: patientAId,
          items: [
            {
              testName: 'Complete Blood Count (CBC)',
              testCode: 'CBC-001',
              specimenType: 'WHOLE_BLOOD',
              price: 45.0,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.labOrder.status).toBe('ORDERED');
      labOrderId = res.body.data.labOrder.id;
    });

    it('should collect sample and assign tracking barcode', async () => {
      const res = await request(app)
        .post(`/api/v1/labs/orders/${labOrderId}/collect-sample`)
        .set('Authorization', `Bearer ${pathologistToken}`)
        .send({
          sampleBarcode: 'BC-2026-998877',
          remarks: 'Purple EDTA tube collected without hemolysis',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.labOrder.status).toBe('SAMPLE_COLLECTED');
      expect(res.body.data.labOrder.sampleBarcode).toBe('BC-2026-998877');
    });

    it('should enter technician results with automatic reference range evaluation', async () => {
      const order: any = await LabOrder.findById(labOrderId).lean();
      const itemId = order?.items?.[0]?._id?.toString() || order?.items?.[0]?.id || order?.tests?.[0]?._id?.toString() || labOrderId;

      const res = await request(app)
        .post(`/api/v1/labs/orders/${labOrderId}/results`)
        .set('Authorization', `Bearer ${pathologistToken}`)
        .send({
          items: [
            {
              itemId,
              resultValue: '18.5',
              unit: 'g/dL',
              referenceRange: '12.0 - 17.5',
              flag: 'HIGH',
              technicianNotes: 'Elevated hemoglobin confirmed on rerun',
            },
          ],
          remarks: 'Sample processed on Automated Hematology Analyzer',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.labOrder.status).toBe('COMPLETED');
      expect(res.body.data.labOrder.items[0].flag).toBe('HIGH');
    });

    it('should allow senior pathologist to verify and lock lab report', async () => {
      const res = await request(app)
        .post(`/api/v1/labs/orders/${labOrderId}/verify`)
        .set('Authorization', `Bearer ${pathologistToken}`)
        .send({
          remarks: 'Verified by Consultant Pathologist. Mild erythrocytosis noted.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.labOrder.status).toBe('VERIFIED');
      expect(res.body.data.labOrder.verifiedBy).toBeDefined();
    });

    it('should REJECT result modifications on a verified locked lab order', async () => {
      const order: any = await LabOrder.findById(labOrderId).lean();
      const itemId = order?.items?.[0]?._id?.toString() || order?.items?.[0]?.id || order?.tests?.[0]?._id?.toString() || labOrderId;

      const res = await request(app)
        .post(`/api/v1/labs/orders/${labOrderId}/results`)
        .set('Authorization', `Bearer ${pathologistToken}`)
        .send({
          items: [{ itemId, resultValue: '14.0' }],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('locked');
    });
  });

  describe('3. Professional Laboratory PDF Report Stream', () => {
    it('should stream generated e-Lab Report PDF for authorized user', async () => {
      const res = await request(app)
        .get(`/api/v1/labs/orders/${labOrderId}/pdf`)
        .set('Authorization', `Bearer ${patientAToken}`);

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toBe('application/pdf');
      expect(res.body).toBeInstanceOf(Buffer);
      expect(res.body.length).toBeGreaterThan(500);
    });
  });

  describe('4. Radiology Information System (RIS) & DICOM Preparedness', () => {
    it('should create a new Radiology Scan Order with DICOM study metadata', async () => {
      const res = await request(app)
        .post('/api/v1/radiology/orders')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          patientId: patientAId,
          imagingType: 'CT_SCAN',
          bodyPart: 'Chest & Abdomen',
          clinicalHistory: 'Persistent shortness of breath, rule out pulmonary embolism',
          urgency: 'URGENT',
          fee: 250.0,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.radiologyOrder.orderNumber).toMatch(/^RAD-2026-/);
      expect(res.body.data.radiologyOrder.studyInstanceUid).toMatch(/^1\.2\.840\./);
      expect(res.body.data.radiologyOrder.accessionNumber).toMatch(/^ACC-2026-/);
      radiologyOrderId = res.body.data.radiologyOrder.id;
    });

    it('should schedule radiology scan procedure time', async () => {
      const futureDateStr = new Date(Date.now() + 86400000).toISOString();
      const res = await request(app)
        .post(`/api/v1/radiology/orders/${radiologyOrderId}/schedule`)
        .set('Authorization', `Bearer ${radiologistToken}`)
        .send({
          scheduledAt: futureDateStr,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.radiologyOrder.status).toBe('SCHEDULED');
    });

    it('should complete scan and attach web PACS DICOM viewer URL', async () => {
      const res = await request(app)
        .post(`/api/v1/radiology/orders/${radiologyOrderId}/complete-scan`)
        .set('Authorization', `Bearer ${radiologistToken}`)
        .send({
          dicomSeriesCount: 4,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.radiologyOrder.status).toBe('SCAN_COMPLETED');
      expect(res.body.data.radiologyOrder.pacsViewerUrl).toContain('studyUid=');
    });

    it('should draft radiologist findings and clinical impression', async () => {
      const res = await request(app)
        .post(`/api/v1/radiology/orders/${radiologyOrderId}/report`)
        .set('Authorization', `Bearer ${radiologistToken}`)
        .send({
          findings: 'High-resolution CT scan of the chest demonstrates clear lung parenchyma without focal consolidation or pleural effusion. Pulmonary arterial tree shows normal contrast filling.',
          impression: 'Negative for pulmonary embolism or acute pulmonary parenchymal pathology.',
          recommendations: 'No immediate radiological follow-up required.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.radiologyOrder.status).toBe('REPORT_DRAFTED');
      expect(res.body.data.radiologyOrder.findings).toContain('High-resolution CT scan');
    });

    it('should verify and finalize radiology report', async () => {
      const res = await request(app)
        .post(`/api/v1/radiology/orders/${radiologyOrderId}/verify`)
        .set('Authorization', `Bearer ${radiologistToken}`)
        .send({
          remarks: 'Electronically signed and verified by Chief Radiologist.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.radiologyOrder.status).toBe('VERIFIED');
    });

    it('should retrieve radiologist worklist queue', async () => {
      const res = await request(app)
        .get('/api/v1/radiology/worklist?imagingType=CT_SCAN')
        .set('Authorization', `Bearer ${radiologistToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.radiologyOrders.length).toBeGreaterThan(0);
      expect(res.body.data.radiologyOrders[0].imagingType).toBe('CT_SCAN');
    });
  });

  describe('5. Security, Multi-Tenant Isolation & Audit Logging', () => {
    it('should REJECT Patient B attempting to access Patient A lab report PDF', async () => {
      const res = await request(app)
        .get(`/api/v1/labs/orders/${labOrderId}/pdf`)
        .set('Authorization', `Bearer ${patientBToken}`);

      expect(res.status).toBe(403);
    });

    it('should REJECT Patient B attempting to view Patient A radiology report', async () => {
      const res = await request(app)
        .get(`/api/v1/radiology/orders/${radiologyOrderId}`)
        .set('Authorization', `Bearer ${patientBToken}`);

      expect(res.status).toBe(403);
    });

    it('should record comprehensive audit log entries for LIS and RIS operations', async () => {
      const logs = await AuditLog.find({
        action: {
          $in: [
            'LAB_SAMPLE_COLLECTED',
            'LAB_RESULT_ENTERED',
            'LAB_REPORT_VERIFIED',
            'LAB_PDF_GENERATED',
            'RADIOLOGY_ORDER_CREATED',
            'RADIOLOGY_SCAN_COMPLETED',
            'RADIOLOGY_REPORT_VERIFIED',
          ],
        },
      });

      expect(logs.length).toBeGreaterThanOrEqual(4);
    });
  });
});
