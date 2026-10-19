import request from 'supertest';
import app from '../src/app';
import {
  Hospital,
  Branch,
  Doctor,
  User,
  Patient,
  EmergencyCase,
  Ambulance,
  BloodUnit,
  BloodDonor,
  AuditLog,
} from '../src/models';
import { connectMongoDB, disconnectMongoDB } from '../src/config/database';

describe('Phase 10: Emergency (ER/ED), Triage, Ambulance Fleet & Blood Bank Integration Tests', () => {
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

  let emergencyVisit1Id: string;
  let emergencyVisit2Id: string;
  let ambulanceId: string;
  let dispatchId: string;
  let donorId: string;
  let bloodUnit1Id: string;
  let bloodUnit2Id: string;

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
        uhid: 'UHID-2026-EMG-01',
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
        uhid: 'UHID-2026-EMG-02',
        firstName: 'Bella',
        lastName: 'Bedpatient',
        gender: 'FEMALE',
        dateOfBirth: new Date('1990-09-20'),
        phone: '+1-555-7722',
        bloodGroup: 'A+',
      });
    }
    patientBId = patientBRecord._id.toString();

    // Clean up Phase 10 records for test isolation
    await EmergencyCase.deleteMany({ hospitalId });
    await Ambulance.deleteMany({ hospitalId });
    await BloodUnit.deleteMany({ hospitalId });
    await BloodDonor.deleteMany({ hospitalId });
  }, 60000);

  afterAll(async () => {
    await disconnectMongoDB();
  });

  describe('1. Emergency Fast Registration & ER Dashboard API', () => {
    it('should rapidly register an existing patient in Emergency with trauma type and vitals', async () => {
      const res = await request(app)
        .post('/api/v1/emergency/visits')
        .set('Authorization', `Bearer ${nurseToken}`)
        .send({
          patientId: patientAId,
          emergencyType: 'TRAUMA',
          chiefComplaint: 'Blunt chest trauma following high-speed motor vehicle collision',
          initialVitals: {
            heartRate: 132,
            systolicBp: 85,
            diastolicBp: 50,
            spo2: 89,
            respiratoryRate: 28,
            temperature: 36.6,
            gcsScore: 12,
          },
          triageLevel: 'HIGH',
          triageNotes: 'Hypotensive, tachypneic with left-sided rib tenderness',
          assignedDoctorId: doctorProfileId,
          branchId,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.visitNumber).toContain('EMG-');
      expect(res.body.data.emergencyType).toBe('TRAUMA');
      expect(res.body.data.status).toBe('WAITING');
      expect(res.body.data.clinicalDisclaimer).toContain('does not constitute independent medical advice');
      emergencyVisit1Id = res.body.data.id;
    });

    it('should rapidly register an unidentified walk-in/John Doe trauma patient', async () => {
      const res = await request(app)
        .post('/api/v1/emergency/visits')
        .set('Authorization', `Bearer ${nurseToken}`)
        .send({
          unknownPatientName: 'Unknown Male Pedestrian 01',
          gender: 'MALE',
          ageEstimate: 35,
          emergencyType: 'CARDIAC',
          chiefComplaint: 'Sudden collapse with chest pain, diaphoresis, and altered sensorium',
          initialVitals: {
            heartRate: 145,
            systolicBp: 170,
            diastolicBp: 105,
            spo2: 91,
            respiratoryRate: 24,
            temperature: 37.1,
          },
          triageLevel: 'CRITICAL',
          assignedDoctorId: doctorProfileId,
          branchId,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.unknownPatientName).toBe('Unknown Male Pedestrian 01');
      expect(res.body.data.triageLevel).toBe('CRITICAL');
      expect(res.body.data.status).toBe('CRITICAL');
      emergencyVisit2Id = res.body.data.id;
    });

    it('should fetch ER Dashboard statistics and breakdown with clinical disclaimer', async () => {
      const res = await request(app)
        .get('/api/v1/emergency/dashboard')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.summary.criticalVisits).toBeGreaterThanOrEqual(1);
      expect(res.body.data.summary.todayRegistrations).toBeGreaterThanOrEqual(2);
      expect(res.body.data.clinicalDisclaimer).toBeDefined();
      expect(res.body.data.recentVisits.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter emergency visits by triageLevel and search term', async () => {
      const res = await request(app)
        .get('/api/v1/emergency/visits?triageLevel=CRITICAL')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].triageLevel).toBe('CRITICAL');
    });
  });

  describe('2. Clinical Triage Decision Support & Verification', () => {
    it('should allow doctor to upgrade triage level to CRITICAL with clinical disclaimer check', async () => {
      const res = await request(app)
        .put(`/api/v1/emergency/visits/${emergencyVisit1Id}/triage`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          triageLevel: 'CRITICAL',
          triageNotes: 'Tension pneumothorax suspected. Emergent needle decompression indicated.',
          clinicalVerification: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.triageLevel).toBe('CRITICAL');
      expect(res.body.data.status).toBe('CRITICAL');
      expect(res.body.data.triageVerifiedById).toBeDefined();
      expect(res.body.disclaimer).toContain('independent medical advice');
    });

    it('should transition emergency patient status from CRITICAL to STABILIZED', async () => {
      const res = await request(app)
        .put(`/api/v1/emergency/visits/${emergencyVisit1Id}/status`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          status: 'STABILIZED',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('STABILIZED');
    });

    it('should transition emergency patient status to DISCHARGED with discharge notes', async () => {
      const res = await request(app)
        .put(`/api/v1/emergency/visits/${emergencyVisit2Id}/status`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          status: 'DISCHARGED',
          dischargeNotes: 'Atypical angina ruled out via serial ECG and cardiac enzymes. Discharged in stable condition.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('DISCHARGED');
      expect(res.body.data.dischargedAt).toBeDefined();
    });
  });

  describe('3. Ambulance Fleet & Emergency Dispatch Workflow', () => {
    it('should register a new ALS emergency ambulance vehicle', async () => {
      const res = await request(app)
        .post('/api/v1/ambulance/vehicles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          vehicleNumber: `AMB-NYC-${Date.now().toString().slice(-4)}`,
          model: 'Mercedes-Benz Sprinter 3500 HD',
          ambulanceType: 'ALS',
          driverName: 'Michael Paramedic',
          driverPhone: '+1-555-0911',
          currentLocation: 'Station 1 - Central Emergency Hub',
          equipment: ['Defibrillator / Monitor', 'Transport Ventilator', 'Trauma Kit', 'Suction Unit'],
          branchId,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('AVAILABLE');
      expect(res.body.data.driverName).toBe('Michael Paramedic');
      ambulanceId = res.body.data.id;
    });

    it('should update ambulance live status and GPS location telemetry', async () => {
      const res = await request(app)
        .put(`/api/v1/ambulance/vehicles/${ambulanceId}/status`)
        .set('Authorization', `Bearer ${nurseToken}`)
        .send({
          status: 'AVAILABLE',
          currentLocation: '5th Ave & 42nd St',
          latitude: 40.7527,
          longitude: -73.9818,
          speed: 0,
          heading: 90,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.latitude).toBe(40.7527);
      expect(res.body.data.lastGpsPingAt).toBeDefined();
    });

    it('should create an emergency dispatch call and automatically assign the available ambulance', async () => {
      const res = await request(app)
        .post('/api/v1/ambulance/dispatches')
        .set('Authorization', `Bearer ${nurseToken}`)
        .send({
          ambulanceId,
          callerName: 'Sarah Connor',
          callerPhone: '+1-555-4321',
          pickupLocation: '742 Evergreen Terrace, Sector 4',
          destinationLocation: 'City General Hospital Emergency Wing',
          emergencyDescription: 'Severe respiratory distress, patient cyanotic',
          priority: 'CRITICAL',
          patientId: patientAId,
          branchId,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.dispatchNumber).toContain('DSP-');
      expect(res.body.data.status).toBe('ASSIGNED');
      dispatchId = res.body.data.id;

      // Verify ambulance status changed to ASSIGNED
      const amb: any = await Ambulance.findById(ambulanceId);
      expect(amb!.status).toBe('ASSIGNED');
    });

    it('should transition dispatch stage from ASSIGNED -> EN_ROUTE -> AT_LOCATION -> TRANSPORTING -> COMPLETED', async () => {
      // 1. EN_ROUTE
      const r1 = await request(app)
        .put(`/api/v1/ambulance/dispatches/${dispatchId}/status`)
        .set('Authorization', `Bearer ${nurseToken}`)
        .send({
          status: 'EN_ROUTE',
          latitude: 40.7540,
          longitude: -73.9840,
        });
      expect(r1.status).toBe(200);
      expect(r1.body.data.status).toBe('EN_ROUTE');
      expect(r1.body.data.enRouteAt).toBeDefined();

      // 2. AT_LOCATION
      const r2 = await request(app)
        .put(`/api/v1/ambulance/dispatches/${dispatchId}/status`)
        .set('Authorization', `Bearer ${nurseToken}`)
        .send({
          status: 'AT_LOCATION',
          paramedicNotes: 'Arrived at scene. High-flow oxygen initiated via non-rebreather mask.',
        });
      expect(r2.status).toBe(200);
      expect(r2.body.data.status).toBe('AT_LOCATION');

      // 3. TRANSPORTING
      const r3 = await request(app)
        .put(`/api/v1/ambulance/dispatches/${dispatchId}/status`)
        .set('Authorization', `Bearer ${nurseToken}`)
        .send({
          status: 'TRANSPORTING',
          latitude: 40.7580,
          longitude: -73.9855,
        });
      expect(r3.status).toBe(200);
      expect(r3.body.data.status).toBe('TRANSPORTING');

      // 4. COMPLETED (Patient delivered to ER -> ambulance automatically freed to AVAILABLE)
      const r4 = await request(app)
        .put(`/api/v1/ambulance/dispatches/${dispatchId}/status`)
        .set('Authorization', `Bearer ${nurseToken}`)
        .send({
          status: 'COMPLETED',
          paramedicNotes: 'Patient handed over to ER Trauma resuscitation bay 1.',
        });
      expect(r4.status).toBe(200);
      expect(r4.body.data.status).toBe('COMPLETED');
      expect(r4.body.data.completedAt).toBeDefined();

      // Verify ambulance is freed back to AVAILABLE
      const amb: any = await Ambulance.findById(ambulanceId);
      expect(amb!.status).toBe('AVAILABLE');
    });
  });

  describe('4. Blood Bank Donor & Blood Unit Collection API', () => {
    it('should register a new eligible blood donor', async () => {
      const res = await request(app)
        .post('/api/v1/blood-bank/donors')
        .set('Authorization', `Bearer ${nurseToken}`)
        .send({
          name: 'David O-Negative Donor',
          gender: 'MALE',
          age: 29,
          bloodGroup: 'O-',
          contactPhone: '+1-555-8833',
          email: 'donor.david@gmail.com',
          address: '445 Blood Center Way',
          branchId,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.donorNumber).toContain('DNR-');
      expect(res.body.data.eligibilityStatus).toBe('ELIGIBLE');
      donorId = res.body.data.id;
    });

    it('should intake new blood unit from donor with collection and expiry dates', async () => {
      const expiryDate = new Date(Date.now() + 42 * 24 * 60 * 60 * 1000).toISOString(); // 42 days Whole Blood
      const res = await request(app)
        .post('/api/v1/blood-bank/units')
        .set('Authorization', `Bearer ${nurseToken}`)
        .send({
          donorId,
          bloodGroup: 'O-',
          componentType: 'WHOLE_BLOOD',
          volumeMl: 450,
          collectionDate: new Date().toISOString(),
          expiryDate,
          storageLocation: 'Blood Bank Refrigerator 1, Shelf B',
          storageTemperature: 4.0,
          testingStatus: 'PENDING',
          branchId,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.unitNumber).toContain('BLD-');
      expect(res.body.data.status).toBe('AVAILABLE');
      expect(res.body.data.testingStatus).toBe('PENDING');
      bloodUnit1Id = res.body.data.id;
    });

    it('should intake a second blood unit (AB+ Platelets)', async () => {
      const expiryDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(); // 5 days Platelets
      const res = await request(app)
        .post('/api/v1/blood-bank/units')
        .set('Authorization', `Bearer ${nurseToken}`)
        .send({
          bloodGroup: 'AB+',
          componentType: 'PLATELETS',
          volumeMl: 250,
          expiryDate,
          storageLocation: 'Platelet Agitator Rack 2',
          storageTemperature: 22.0,
          testingStatus: 'PASSED',
          screeningNotes: 'Negative for HIV 1/2, HBsAg, HCV, VDRL, Malaria',
          branchId,
        });

      expect(res.status).toBe(201);
      bloodUnit2Id = res.body.data.id;
    });

    it('should update infection screening test results for blood unit', async () => {
      const res = await request(app)
        .put(`/api/v1/blood-bank/units/${bloodUnit1Id}/test`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          testingStatus: 'PASSED',
          screeningNotes: 'Passed all serology assays: Non-reactive for HIV, HBV, HCV, Syphilis, Malaria.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.testingStatus).toBe('PASSED');
      expect(res.body.data.status).toBe('AVAILABLE');
    });
  });

  describe('5. Blood Unit Reservation, Crossmatching & Patient Issue', () => {
    it('should reserve O- blood unit for Patient A', async () => {
      const res = await request(app)
        .post(`/api/v1/blood-bank/units/${bloodUnit1Id}/reserve`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          patientId: patientAId,
          reason: 'Pre-operative reservation for emergency thoracic surgery',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('RESERVED');
      expect(res.body.data.reservedForPatientId).toBe(patientAId);
    });

    it('should REJECT blood issue if crossmatch result is INCOMPATIBLE (Patient Safety Protection)', async () => {
      const res = await request(app)
        .post(`/api/v1/blood-bank/units/${bloodUnit1Id}/issue`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          patientId: patientAId,
          crossmatchResult: 'INCOMPATIBLE',
          issueNotes: 'Major agglutination detected during Coombs crossmatch',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('INCOMPATIBLE');
    });

    it('should successfully issue blood unit to Patient A after verified COMPATIBLE crossmatch', async () => {
      const res = await request(app)
        .post(`/api/v1/blood-bank/units/${bloodUnit1Id}/issue`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          patientId: patientAId,
          crossmatchResult: 'COMPATIBLE',
          issueNotes: 'Major & Minor crossmatch verified compatible. Issued to OT Suite 3.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('ISSUED');
      expect(res.body.data.issuedToPatientId).toBe(patientAId);
      expect(res.body.data.issuedAt).toBeDefined();
    });
  });

  describe('6. Blood Availability Dashboard & Inventory Metrics', () => {
    it('should calculate 8 blood groups availability summary and expiring units count', async () => {
      const res = await request(app)
        .get('/api/v1/blood-bank/dashboard')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.summary.totalUnits).toBeGreaterThanOrEqual(2);
      expect(res.body.data.summary.totalIssued).toBeGreaterThanOrEqual(1);
      expect(res.body.data.summary.totalAvailable).toBeGreaterThanOrEqual(1);
      expect(res.body.data.summary.bloodGroupStock['AB+']).toBeGreaterThanOrEqual(1);
      expect(res.body.data.summary.expiringSoonCount).toBeGreaterThanOrEqual(1); // AB+ Platelets expire in 5 days
    });
  });

  describe('7. Multi-Tenant RBAC & Security Audit Logging', () => {
    it('should REJECT unauthorized patient from issuing blood or updating triage', async () => {
      const res1 = await request(app)
        .post(`/api/v1/blood-bank/units/${bloodUnit2Id}/issue`)
        .set('Authorization', `Bearer ${patientAToken}`)
        .send({ patientId: patientBId, crossmatchResult: 'COMPATIBLE' });

      expect(res1.status).toBe(403);

      const res2 = await request(app)
        .put(`/api/v1/emergency/visits/${emergencyVisit1Id}/triage`)
        .set('Authorization', `Bearer ${patientBToken}`)
        .send({ triageLevel: 'LOW' });

      expect(res2.status).toBe(403);
    });

    it('should verify audit logs were created for Emergency, Ambulance, and Blood Bank actions', async () => {
      const logs = await AuditLog.find({
        hospitalId,
      }).sort({ createdAt: -1 });

      const actions = logs.map((l) => l.action);
      expect(actions).toContain('EMERGENCY_REGISTRATION');
      expect(actions).toContain('UPDATE_TRIAGE');
      expect(actions).toContain('DISPATCH_AMBULANCE');
      expect(actions).toContain('DONATE_BLOOD');
      expect(actions).toContain('RESERVE_BLOOD');
      expect(actions).toContain('ISSUE_BLOOD');
    });
  });
});
