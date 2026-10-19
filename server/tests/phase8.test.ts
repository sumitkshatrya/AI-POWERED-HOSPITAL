import request from 'supertest';
import app from '../src/app';
import {
  Hospital,
  Branch,
  Doctor,
  User,
  Patient,
  Appointment,
  Consultation,
  Prescription,
  Medicine,
} from '../src/models';
import { connectMongoDB, disconnectMongoDB } from '../src/config/database';

describe('Phase 8: Pharmacy & Hospital Inventory Management Integration Tests', () => {
  jest.setTimeout(60000);

  let pharmacistToken: string;
  let doctorToken: string;
  let patientToken: string;

  let hospitalId: string;
  let branchId: string;
  let supplierId: string;
  let medicineId: string;
  let lowStockMedicineId: string;
  let expiredMedicineId: string;
  let prescriptionId: string;
  let inventoryItemId: string;

  beforeAll(async () => {
    await connectMongoDB();
    // 1. Hospital & Branch
    const hosp = await Hospital.findOne();
    hospitalId = hosp?._id.toString() || '';

    const branch = await Branch.findOne({ hospitalId });
    branchId = branch?._id.toString() || '';

    // 2. Pharmacist Account & Auth
    let pharmacistUser = await User.findOne({ email: 'pharmacist.test@citygeneral.com' });
    if (!pharmacistUser) {
      pharmacistUser = await User.create({
        email: 'pharmacist.test@citygeneral.com',
        password: '$2b$10$wT8ZJmKq9l2K9L.g1tJ1z.1q0G/OqG01234567890123456789012',
        firstName: 'Peter',
        lastName: 'Pharmacist',
        role: 'PHARMACIST',
        hospitalId,
        branchId,
        isVerified: true,
      });
    }

    const pharmLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'pharmacist.test@citygeneral.com', password: 'Password123!' });
    pharmacistToken = pharmLogin.body.data.accessToken;

    // 3. Doctor Auth
    const docProfile = await Doctor.findOne();
    const docUser = await User.findById(docProfile?.userId) || await User.findOne({ role: 'DOCTOR' });
    const docLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: docUser?.email || 'doctor.a1@citygeneral.com', password: 'Password123!' });
    doctorToken = docLogin.body.data.accessToken;

    // 4. Patient Auth
    let patUser = await User.findOne({ email: 'patient.a1@gmail.com' }) || await User.findOne({ role: 'PATIENT' });
    if (!patUser) {
      patUser = await User.create({
        email: 'patient.a1@gmail.com',
        password: '$2b$10$wT8ZJmKq9l2K9L.g1tJ1z.1q0G/OqG01234567890123456789012',
        firstName: 'Alice',
        lastName: 'PatientA',
        role: 'PATIENT',
        isVerified: true,
      });
    }
    const patLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: patUser.email, password: 'Password123!' });
    patientToken = patLogin.body.data.accessToken;

    let patientRecord = await Patient.findOne({ userId: patUser._id });
    if (!patientRecord) {
      patientRecord = await Patient.create({
        userId: patUser._id,
        hospitalId,
        uhid: 'UHID-2026-PHARM8',
        firstName: 'Alice',
        lastName: 'PatientA',
        gender: 'FEMALE',
        dateOfBirth: new Date('1992-04-10'),
        phone: '+1-555-4433',
      });
    }

    // Create sample appointment, consultation and prescription for test
    const appt = await Appointment.create({
      hospitalId,
      branchId,
      patientId: patientRecord._id,
      doctorId: docProfile?._id,
      appointmentDate: new Date(),
      startTime: '10:00',
      endTime: '10:15',
      type: 'OPD',
      status: 'COMPLETED',
    });

    const consultation = await Consultation.create({
      hospitalId,
      appointmentId: appt._id,
      patientId: patientRecord._id,
      doctorId: docProfile?._id,
      chiefComplaint: 'High fever and respiratory congestion',
      status: 'COMPLETED',
    });

    const rx = await Prescription.create({
      hospitalId,
      consultationId: consultation._id,
      patientId: patientRecord._id,
      doctorId: docProfile?._id,
      doctorInstructions: 'Take after meals twice daily',
      medicines: [
        {
          name: 'Amoxicillin 500mg',
          dose: '500mg',
          frequency: 'twice daily',
          duration: '5 days',
          route: 'ORAL',
          instructions: 'Take with water',
        },
      ],
      status: 'ACTIVE',
    });
    prescriptionId = rx._id.toString();
  }, 60000);

  afterAll(async () => {
    await disconnectMongoDB();
  });

  describe('1. Supplier Directory Management', () => {
    it('should create a new pharmaceutical supplier', async () => {
      const res = await request(app)
        .post('/api/v1/pharmacy/suppliers')
        .set('Authorization', `Bearer ${pharmacistToken}`)
        .send({
          name: 'Pfizer Global Pharma',
          contactPerson: 'David Miller',
          phone: '+1-800-555-0199',
          email: 'orders@pfizer-dist.com',
          address: '100 Pharmaceutical Way, NJ',
          taxId: 'TAX-PF-998877',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.supplier.name).toBe('Pfizer Global Pharma');
      supplierId = res.body.data.supplier.id;
    });

    it('should retrieve supplier catalog list', async () => {
      const res = await request(app)
        .get('/api/v1/pharmacy/suppliers')
        .set('Authorization', `Bearer ${pharmacistToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.suppliers.length).toBeGreaterThan(0);
    });
  });

  describe('2. Medicine Inventory CRUD & Expiry/Low Stock Alerts', () => {
    it('should add a new active medicine record with batch & expiry details', async () => {
      const futureExpiry = new Date();
      futureExpiry.setDate(futureExpiry.getDate() + 180); // 6 months in future

      const res = await request(app)
        .post('/api/v1/pharmacy/medicines')
        .set('Authorization', `Bearer ${pharmacistToken}`)
        .send({
          name: 'Amoxicillin 500mg Capsules',
          genericName: 'Amoxicillin',
          brand: 'Amoxil',
          category: 'ANTIBIOTIC',
          manufacturer: 'GSK Pharma',
          batchNumber: 'BATCH-AMX-2026',
          expiryDate: futureExpiry.toISOString(),
          quantity: 100,
          minReorderLevel: 20,
          purchasePrice: 2.5,
          sellingPrice: 5.0,
          supplierId,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.medicine.name).toBe('Amoxicillin 500mg Capsules');
      expect(res.body.data.medicine.quantity).toBe(100);
      medicineId = res.body.data.medicine.id;
    });

    it('should add a low-stock medicine item', async () => {
      const futureExpiry = new Date();
      futureExpiry.setDate(futureExpiry.getDate() + 120);

      const res = await request(app)
        .post('/api/v1/pharmacy/medicines')
        .set('Authorization', `Bearer ${pharmacistToken}`)
        .send({
          name: 'Paracetamol 650mg Tablets',
          genericName: 'Acetaminophen',
          brand: 'Dolo 650',
          category: 'ANALGESIC',
          manufacturer: 'Micro Labs',
          batchNumber: 'BATCH-PAR-99',
          expiryDate: futureExpiry.toISOString(),
          quantity: 5, // Below reorder level of 20
          minReorderLevel: 20,
          purchasePrice: 1.0,
          sellingPrice: 2.0,
          supplierId,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.medicine.quantity).toBe(5);
      lowStockMedicineId = res.body.data.medicine.id;
    });

    it('should add an expired medicine item for alert evaluation', async () => {
      const pastExpiry = new Date();
      pastExpiry.setDate(pastExpiry.getDate() - 10); // Expired 10 days ago

      const res = await request(app)
        .post('/api/v1/pharmacy/medicines')
        .set('Authorization', `Bearer ${pharmacistToken}`)
        .send({
          name: 'Cough Syrup 100ml',
          genericName: 'Dextromethorphan',
          brand: 'Benadryl',
          category: 'RESPIRATORY',
          manufacturer: 'Johnson & Johnson',
          batchNumber: 'BATCH-EXP-001',
          expiryDate: pastExpiry.toISOString(),
          quantity: 50,
          minReorderLevel: 10,
          purchasePrice: 3.0,
          sellingPrice: 6.0,
          supplierId,
        });

      expect(res.status).toBe(201);
      expiredMedicineId = res.body.data.medicine.id;
    });

    it('should filter medicines by low stock and flags', async () => {
      const res = await request(app)
        .get('/api/v1/pharmacy/medicines?lowStock=true')
        .set('Authorization', `Bearer ${pharmacistToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.medicines.length).toBeGreaterThan(0);
      expect(res.body.data.medicines[0].isLowStock).toBe(true);
    });

    it('should adjust medicine stock level manually', async () => {
      const res = await request(app)
        .post(`/api/v1/pharmacy/medicines/${medicineId}/adjust-stock`)
        .set('Authorization', `Bearer ${pharmacistToken}`)
        .send({
          newQuantity: 120,
          reason: 'Restock shipment received from supplier',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.medicine.quantity).toBe(120);
    });
  });

  describe('3. POS Pharmacy Sales & Prescription Fulfillment', () => {
    it('should process a direct POS pharmacy sale with stock deduction & billing invoice', async () => {
      const res = await request(app)
        .post('/api/v1/pharmacy/sales')
        .set('Authorization', `Bearer ${pharmacistToken}`)
        .send({
          paymentMethod: 'CASH',
          discount: 5.0,
          items: [
            {
              medicineId,
              quantity: 20, // 120 -> 100
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.sale.totalAmount).toBe(95.0); // (20 * 5.0) - 5.0 = 95.0

      // Verify medicine stock decreased from 120 to 100
      const med: any = await Medicine.findById(medicineId);
      expect(med!.quantity).toBe(100);
    });

    it('should reject POS sale when requested quantity exceeds available stock', async () => {
      const res = await request(app)
        .post('/api/v1/pharmacy/sales')
        .set('Authorization', `Bearer ${pharmacistToken}`)
        .send({
          paymentMethod: 'CASH',
          items: [
            {
              medicineId: lowStockMedicineId,
              quantity: 50, // Stock is only 5
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Insufficient stock');
    });

    it('should fulfill doctor e-prescription, deduct stock, and generate billing invoice', async () => {
      const res = await request(app)
        .post('/api/v1/pharmacy/sales/fulfill-prescription')
        .set('Authorization', `Bearer ${pharmacistToken}`)
        .send({
          prescriptionId,
          paymentMethod: 'CARD',
          discount: 0,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.sale.prescriptionId).toBe(prescriptionId);
      expect(res.body.data.sale.items.length).toBe(1);

      // Verify stock decreased by 10 (100 -> 90)
      const med: any = await Medicine.findById(medicineId);
      expect(med!.quantity).toBe(90);
    });
  });

  describe('4. Hospital Inventory Tracking (Equipment, Supplies, PPE, Gloves, Masks)', () => {
    it('should create hospital equipment and surgical consumable items', async () => {
      const res = await request(app)
        .post('/api/v1/inventory')
        .set('Authorization', `Bearer ${pharmacistToken}`)
        .send({
          name: 'N95 Respirator Masks Box (50 pcs)',
          category: 'PPE',
          unitOfMeasure: 'BOXES',
          quantity: 100,
          reorderLevel: 25,
          unitCost: 15.0,
          locationRoom: 'Central Store - Shelf B2',
          supplierId,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.item.name).toBe('N95 Respirator Masks Box (50 pcs)');
      expect(res.body.data.item.status).toBe('IN_STOCK');
      inventoryItemId = res.body.data.item.id;
    });

    it('should record consumption of hospital consumables and trigger low stock status', async () => {
      const res = await request(app)
        .post(`/api/v1/inventory/${inventoryItemId}/consume`)
        .set('Authorization', `Bearer ${pharmacistToken}`)
        .send({
          quantity: 80, // 100 -> 20 (reorder level is 25)
          notes: 'Issued to Emergency Ward for COVID triage',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.item.quantity).toBe(20);
      expect(res.body.data.item.status).toBe('LOW_STOCK');
    });

    it('should retrieve inventory items filterable by category', async () => {
      const res = await request(app)
        .get('/api/v1/inventory?category=PPE')
        .set('Authorization', `Bearer ${pharmacistToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThan(0);
    });
  });

  describe('5. Pharmacy Dashboard Stats & Security Controls', () => {
    it('should aggregate pharmacy dashboard metrics and alerts', async () => {
      const res = await request(app)
        .get('/api/v1/pharmacy/dashboard/stats')
        .set('Authorization', `Bearer ${pharmacistToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.summary.totalMedicines).toBeGreaterThan(0);
      expect(res.body.data.summary.lowStockCount).toBeGreaterThan(0);
      expect(res.body.data.summary.expiredCount).toBeGreaterThan(0);
      expect(res.body.data.summary.todaysSalesAmount).toBeGreaterThan(0);
      expect(res.body.data.alerts.length).toBeGreaterThan(0);
    });

    it('should REJECT patient user from creating suppliers or medicines', async () => {
      const res = await request(app)
        .post('/api/v1/pharmacy/medicines')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          name: 'Unauthorized Drug',
          genericName: 'Illegal',
          brand: 'None',
          category: 'OTHER',
          manufacturer: 'Fake',
          batchNumber: 'FAKE-123',
          expiryDate: new Date().toISOString(),
          quantity: 100,
        });

      expect(res.status).toBe(403);
    });
  });
});
