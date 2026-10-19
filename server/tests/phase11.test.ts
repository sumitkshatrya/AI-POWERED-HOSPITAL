import request from 'supertest';
import crypto from 'crypto';
import app from '../src/app';
import {
  Hospital,
  Branch,
  Doctor,
  User,
  Patient,
  Appointment,
  Invoice,
  Payment,
  AuditLog,
} from '../src/models';
import { connectMongoDB, disconnectMongoDB } from '../src/config/database';

describe('Phase 11: Enterprise Billing, Payment Gateways (Razorpay/Stripe), and Insurance Integration Tests', () => {
  jest.setTimeout(60000);

  let adminToken: string;
  let accountantToken: string;
  let doctorToken: string;
  let patientAToken: string;
  let patientBToken: string;

  let hospitalId: string;
  let branchId: string;
  let doctorProfileId: string;
  let patientAId: string;
  let patientBId: string;
  let appointmentAId: string;

  let invoice1Id: string;
  let invoice2Id: string;
  let payment1Id: string;
  let insurancePolicyId: string;
  let insuranceClaimId: string;

  const RAZORPAY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret_key_secure_12345';
  const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || 'sk_test_secret_key_secure_12345';

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

    // 3. Accountant Auth
    let accountantUser = await User.findOne({ email: 'accountant@citygeneral.com' });
    if (!accountantUser) {
      const docUser = await User.findOne({ role: 'DOCTOR' });
      accountantUser = await User.create({
        email: 'accountant@citygeneral.com',
        password: docUser?.password || '$2b$10$wT8ZJmKq9l2K9L.g1tJ1z.1q0G/OqG01234567890123456789012',
        firstName: 'Alice',
        lastName: 'Accountant',
        role: 'ACCOUNTANT',
        hospitalId,
        branchId,
        isVerified: true,
      });
    }
    const accountantLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'accountant@citygeneral.com', password: 'Password123!' });
    accountantToken = accountantLogin.body.data.accessToken;

    // 4. Doctor Auth
    const docProfile = await Doctor.findOne();
    doctorProfileId = docProfile?._id.toString() || '';
    const docUser = await User.findById(docProfile?.userId) || await User.findOne({ role: 'DOCTOR' });
    const docLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: docUser?.email || 'doctor.a1@citygeneral.com', password: 'Password123!' });
    doctorToken = docLogin.body.data.accessToken;

    // 5. Patient A Auth
    let patAUser = await User.findOne({ email: 'patient.bill11a@gmail.com' });
    if (!patAUser) {
      patAUser = await User.create({
        email: 'patient.bill11a@gmail.com',
        password: '$2b$10$wT8ZJmKq9l2K9L.g1tJ1z.1q0G/OqG01234567890123456789012',
        firstName: 'Bill',
        lastName: 'PatientA',
        role: 'PATIENT',
        isVerified: true,
      });
    }
    let patA = await Patient.findOne({ userId: patAUser._id });
    if (!patA) {
      patA = await Patient.create({
        userId: patAUser._id,
        hospitalId,
        branchId,
        uhid: `UHID-BILL-A-${Date.now().toString().slice(-4)}`,
        firstName: 'Bill',
        lastName: 'PatientA',
        gender: 'MALE',
        dateOfBirth: new Date('1985-05-15'),
        phone: '+91 9876543211',
      });
    }
    patientAId = patA._id.toString();

    const patALogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'patient.bill11a@gmail.com', password: 'Password123!' });
    patientAToken = patALogin.body.data.accessToken;

    // 6. Patient B Auth
    let patBUser = await User.findOne({ email: 'patient.bill11b@gmail.com' });
    if (!patBUser) {
      patBUser = await User.create({
        email: 'patient.bill11b@gmail.com',
        password: '$2b$10$wT8ZJmKq9l2K9L.g1tJ1z.1q0G/OqG01234567890123456789012',
        firstName: 'Bella',
        lastName: 'PatientB',
        role: 'PATIENT',
        isVerified: true,
      });
    }
    let patB = await Patient.findOne({ userId: patBUser._id });
    if (!patB) {
      patB = await Patient.create({
        userId: patBUser._id,
        hospitalId,
        branchId,
        uhid: `UHID-BILL-B-${Date.now().toString().slice(-4)}`,
        firstName: 'Bella',
        lastName: 'PatientB',
        gender: 'FEMALE',
        dateOfBirth: new Date('1990-08-20'),
        phone: '+91 9876543212',
      });
    }
    patientBId = patB._id.toString();

    const patBLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'patient.bill11b@gmail.com', password: 'Password123!' });
    patientBToken = patBLogin.body.data.accessToken;

    // 7. Create an Appointment for Patient A to test auto-confirmation on payment
    const appt = await Appointment.create({
      patientId: patientAId,
      doctorId: doctorProfileId,
      hospitalId,
      branchId,
      appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      startTime: '11:00',
      endTime: '11:30',
      type: 'OPD',
      status: 'PENDING',
      notes: 'Hypertension Followup',
    });
    appointmentAId = appt._id.toString();
  });

  afterAll(async () => {
    await disconnectMongoDB();
  });

  // ==========================================
  // 1. MULTI-SERVICE BILLING & INVOICING
  // ==========================================
  describe('1. Multi-Service Billing & Invoicing Engine', () => {
    it('should create an itemized invoice spanning Consultation, ICU, Pharmacy, Lab, Surgery, and Emergency', async () => {
      const res = await request(app)
        .post('/api/v1/billing/invoices')
        .set('Authorization', `Bearer ${accountantToken}`)
        .send({
          patientId: patientAId,
          doctorId: doctorProfileId,
          appointmentId: appointmentAId,
          branchId,
          hospitalId,
          tax: 50.0,
          discount: 20.0,
          items: [
            {
              description: 'Specialist Cardiology Consultation',
              itemType: 'CONSULTATION',
              quantity: 1,
              unitPrice: 150.0,
            },
            {
              description: 'ICU Telemetry Bed Monitoring (24h)',
              itemType: 'ICU',
              quantity: 1,
              unitPrice: 500.0,
            },
            {
              description: 'Emergency Trauma Triage & Resuscitation',
              itemType: 'EMERGENCY',
              quantity: 1,
              unitPrice: 200.0,
            },
            {
              description: 'Emergency Appendectomy Surgery',
              itemType: 'SURGERY',
              quantity: 1,
              unitPrice: 1200.0,
            },
            {
              description: 'Complete Blood Count (CBC) with Differential',
              itemType: 'LABORATORY',
              quantity: 2,
              unitPrice: 40.0,
            },
            {
              description: 'Intravenous Antibiotics (Meropenem 1g IV)',
              itemType: 'PHARMACY',
              quantity: 3,
              unitPrice: 30.0,
            },
            {
              description: 'Chest X-Ray Digital Single View',
              itemType: 'RADIOLOGY',
              quantity: 1,
              unitPrice: 80.0,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.invoice.invoiceNumber).toMatch(/^INV-\d{4}-\d{4}$/);
      expect(res.body.data.invoice.items).toHaveLength(7);

      // Subtotal = 150 + 500 + 200 + 1200 + 80 + 90 + 80 = 2300
      // Total = 2300 + 50 - 20 = 2330
      expect(res.body.data.invoice.subtotal).toBe(2300);
      expect(res.body.data.invoice.tax).toBe(50);
      expect(res.body.data.invoice.discount).toBe(20);
      expect(res.body.data.invoice.totalAmount).toBe(2330);
      expect(res.body.data.invoice.paymentStatus).toBe('UNPAID');

      invoice1Id = res.body.data.invoice.id;
    });

    it('should retrieve itemized invoice by ID with patient, doctor, and item details', async () => {
      const res = await request(app)
        .get(`/api/v1/billing/invoices/${invoice1Id}`)
        .set('Authorization', `Bearer ${accountantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.invoice.id).toBe(invoice1Id);
      expect(res.body.data.invoice.patient.uhid).toBeDefined();
      expect(res.body.data.invoice.doctor).toBeDefined();
      expect(res.body.data.invoice.items).toHaveLength(7);
    });

    it('should filter invoices by patient and search query', async () => {
      const res = await request(app)
        .get('/api/v1/billing/invoices')
        .query({ patientId: patientAId })
        .set('Authorization', `Bearer ${accountantToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.invoices)).toBe(true);
      expect(res.body.data.invoices.some((inv: any) => inv.id === invoice1Id)).toBe(true);
    });
  });

  // ==========================================
  // 2. PAYMENT GATEWAYS (RAZORPAY & STRIPE)
  // ==========================================
  describe('2. Payment Gateways (Razorpay & Stripe Cryptographic Verification)', () => {
    let razorpayOrderId: string;
    let razorpayPaymentId: string;

    it('should initiate a Razorpay payment session with balance due amount', async () => {
      const res = await request(app)
        .post('/api/v1/billing/payments/initiate')
        .set('Authorization', `Bearer ${patientAToken}`)
        .send({
          invoiceId: invoice1Id,
          gateway: 'RAZORPAY',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.gateway).toBe('RAZORPAY');
      expect(res.body.data.amount).toBe(2330);
      expect(res.body.data.gatewayOrderId).toMatch(/^order_rzp_/);

      razorpayOrderId = res.body.data.gatewayOrderId;
      razorpayPaymentId = `pay_${Date.now()}_rzp123`;
    });

    it('should REJECT payment with tampered / invalid cryptographic signature', async () => {
      const invalidSignature = 'tampered_fake_signature_hash_12345';

      const res = await request(app)
        .post('/api/v1/billing/payments/verify')
        .set('Authorization', `Bearer ${patientAToken}`)
        .send({
          invoiceId: invoice1Id,
          gateway: 'RAZORPAY',
          gatewayOrderId: razorpayOrderId,
          gatewayPaymentId: razorpayPaymentId,
          gatewaySignature: invalidSignature,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/signature verification failed|untrusted/i);
    });

    it('should VERIFY Razorpay payment with valid HMAC-SHA256 signature and settle invoice', async () => {
      // Calculate authentic HMAC-SHA256 signature
      const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
      const validSignature = crypto.createHmac('sha256', RAZORPAY_SECRET).update(payload).digest('hex');

      const res = await request(app)
        .post('/api/v1/billing/payments/verify')
        .set('Authorization', `Bearer ${patientAToken}`)
        .send({
          invoiceId: invoice1Id,
          gateway: 'RAZORPAY',
          gatewayOrderId: razorpayOrderId,
          gatewayPaymentId: razorpayPaymentId,
          gatewaySignature: validSignature,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.payment.status).toBe('SUCCESS');
      expect(res.body.data.payment.amount).toBe(2330);
      expect(res.body.data.invoice.paymentStatus).toBe('PAID');

      payment1Id = res.body.data.payment.id;

      // Verify Appointment A was auto-confirmed
      const appt: any = await Appointment.findById(appointmentAId);
      expect(appt?.status).toBe('CONFIRMED');
    });

    it('should PREVENT duplicate payment submission for already settled transaction ID', async () => {
      const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
      const validSignature = crypto.createHmac('sha256', RAZORPAY_SECRET).update(payload).digest('hex');

      const res = await request(app)
        .post('/api/v1/billing/payments/verify')
        .set('Authorization', `Bearer ${patientAToken}`)
        .send({
          invoiceId: invoice1Id,
          gateway: 'RAZORPAY',
          gatewayOrderId: razorpayOrderId,
          gatewayPaymentId: razorpayPaymentId,
          gatewaySignature: validSignature,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/duplicate payment detected/i);
    });
  });

  // ==========================================
  // 3. PARTIAL PAYMENTS, STRIPE & REFUNDS
  // ==========================================
  describe('3. Partial Payments, Stripe Gateway & Refund Engine', () => {
    let invoice2Total = 1000;
    let stripePaymentId: string;
    let paymentToRefundId: string;

    beforeAll(async () => {
      // Create Invoice 2 for Partial Payment and Refund testing
      const inv2 = await Invoice.create({
        invoiceNumber: `INV-2026-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 1000)}`,
        patientId: patientAId,
        hospitalId,
        branchId,
        subtotal: 1000,
        totalAmount: 1000,
        paymentStatus: 'UNPAID',
        items: [
          {
            description: 'Knee Arthroscopy Procedure',
            type: 'PROCEDURE',
            quantity: 1,
            unitPrice: 1000,
            total: 1000,
          },
        ],
      });
      invoice2Id = inv2._id.toString();
    });

    it('should record a manual partial payment of $400, transitioning invoice to PARTIAL', async () => {
      const res = await request(app)
        .post('/api/v1/billing/payments/manual')
        .set('Authorization', `Bearer ${accountantToken}`)
        .send({
          invoiceId: invoice2Id,
          amount: 400.0,
          paymentMethod: 'CASH',
          referenceNumber: 'CASH-REC-001',
          notes: 'Initial cash deposit at admission',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.payment.amount).toBe(400);
      expect(res.body.data.payment.status).toBe('SUCCESS');
      expect(res.body.data.invoice.paymentStatus).toBe('PARTIAL');
    });

    it('should pay remaining $600 via Stripe gateway, transitioning invoice to PAID', async () => {
      // 1. Initiate Stripe
      const initRes = await request(app)
        .post('/api/v1/billing/payments/initiate')
        .set('Authorization', `Bearer ${patientAToken}`)
        .send({
          invoiceId: invoice2Id,
          gateway: 'STRIPE',
        });

      expect(initRes.status).toBe(200);
      expect(initRes.body.data.amount).toBe(600); // Only remaining balance
      const stripeOrderId = initRes.body.data.gatewayOrderId;
      stripePaymentId = `pi_${Date.now()}_stripe456`;

      // 2. Verify with Stripe HMAC signature
      const payload = `${stripeOrderId}|${stripePaymentId}`;
      const stripeSig = crypto.createHmac('sha256', STRIPE_SECRET).update(payload).digest('hex');

      const verifyRes = await request(app)
        .post('/api/v1/billing/payments/verify')
        .set('Authorization', `Bearer ${patientAToken}`)
        .send({
          invoiceId: invoice2Id,
          gateway: 'STRIPE',
          gatewayOrderId: stripeOrderId,
          gatewayPaymentId: stripePaymentId,
          gatewaySignature: stripeSig,
        });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.data.payment.amount).toBe(600);
      expect(verifyRes.body.data.invoice.paymentStatus).toBe('PAID');

      paymentToRefundId = verifyRes.body.data.payment.id;
    });

    it('should process a partial refund of $200 on the $600 payment, returning invoice to PARTIAL', async () => {
      const res = await request(app)
        .post(`/api/v1/billing/payments/${paymentToRefundId}/refund`)
        .set('Authorization', `Bearer ${accountantToken}`)
        .send({
          amount: 200.0,
          reason: 'Post-operative discounted medication waiver',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.payment.refundAmount).toBe(200);
      expect(res.body.data.payment.status).toBe('SUCCESS'); // Still partially active
      expect(res.body.data.invoice.paymentStatus).toBe('PARTIAL');
    });

    it('should process full remaining refund of $400, marking payment REFUNDED', async () => {
      const res = await request(app)
        .post(`/api/v1/billing/payments/${paymentToRefundId}/refund`)
        .set('Authorization', `Bearer ${accountantToken}`)
        .send({
          amount: 400.0,
          reason: 'Full dispute reversal',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.payment.refundAmount).toBe(600);
      expect(res.body.data.payment.status).toBe('REFUNDED');
    });

    it('should REJECT refund request on payment that is already 100% refunded', async () => {
      const res = await request(app)
        .post(`/api/v1/billing/payments/${paymentToRefundId}/refund`)
        .set('Authorization', `Bearer ${accountantToken}`)
        .send({
          amount: 50.0,
          reason: 'Invalid extra refund',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already been fully refunded|only successful payments can be refunded/i);
    });
  });

  // ==========================================
  // 4. INSURANCE POLICIES & CLAIMS ADJUDICATION
  // ==========================================
  describe('4. Insurance Policies & Claims Lifecycle', () => {
    it('should register a patient health insurance policy', async () => {
      const res = await request(app)
        .post('/api/v1/billing/insurance/policies')
        .set('Authorization', `Bearer ${accountantToken}`)
        .send({
          patientId: patientAId,
          provider: 'Star Health & Allied Insurance',
          policyNumber: 'STAR-POL-883921',
          policyHolderName: 'Patient A',
          coverageAmount: 50000.0,
          validFrom: '2026-01-01',
          validTo: '2026-12-31',
          copayPercentage: 10,
          deductible: 250,
          notes: 'Comprehensive cashless policy including Day Care surgeries',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.policy.provider).toBe('Star Health & Allied Insurance');
      expect(res.body.data.policy.coverageAmount).toBe(50000);
      expect(res.body.data.policy.status).toBe('ACTIVE');

      insurancePolicyId = res.body.data.policy.id;
    });

    it('should REJECT insurance claim exceeding policy coverage amount', async () => {
      const res = await request(app)
        .post('/api/v1/billing/insurance/claims')
        .set('Authorization', `Bearer ${accountantToken}`)
        .send({
          patientId: patientAId,
          insuranceId: insurancePolicyId,
          invoiceId: invoice1Id,
          treatmentDescription: 'Robotic Cardiac Surgery',
          claimedAmount: 90000.0, // Exceeds 50,000
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/exceeds total policy coverage/i);
    });

    it('should file a valid insurance claim with attached documents', async () => {
      const res = await request(app)
        .post('/api/v1/billing/insurance/claims')
        .set('Authorization', `Bearer ${accountantToken}`)
        .send({
          patientId: patientAId,
          insuranceId: insurancePolicyId,
          invoiceId: invoice1Id,
          treatmentDescription: 'Appendectomy and Emergency Triage',
          diagnosis: 'Acute Appendicitis (K35.80)',
          claimedAmount: 2330.0,
          documents: [
            { name: 'Discharge Summary', url: 'https://docs.hospital.org/ds_01.pdf', type: 'PDF' },
            { name: 'Itemized Hospital Bill', url: 'https://docs.hospital.org/bill_01.pdf', type: 'PDF' },
          ],
          status: 'SUBMITTED',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.claim.claimNumber).toMatch(/^CLM-\d{4}-\d{4}$/);
      expect(res.body.data.claim.status).toBe('SUBMITTED');
      expect(res.body.data.claim.claimedAmount).toBe(2330);

      insuranceClaimId = res.body.data.claim.id;
    });

    it('should adjudicate insurance claim through UNDER_REVIEW to APPROVED', async () => {
      // 1. Move to UNDER_REVIEW
      const reviewRes = await request(app)
        .put(`/api/v1/billing/insurance/claims/${insuranceClaimId}/status`)
        .set('Authorization', `Bearer ${accountantToken}`)
        .send({
          status: 'UNDER_REVIEW',
          adjudicationNotes: 'TPA Auditor reviewing operative records and surgical consumables',
        });

      expect(reviewRes.status).toBe(200);
      expect(reviewRes.body.data.claim.status).toBe('UNDER_REVIEW');

      // 2. Move to APPROVED
      const approveRes = await request(app)
        .put(`/api/v1/billing/insurance/claims/${insuranceClaimId}/status`)
        .set('Authorization', `Bearer ${accountantToken}`)
        .send({
          status: 'APPROVED',
          approvedAmount: 2200.0, // After copay/deductible deduction
          adjudicationNotes: 'Pre-authorization granted for $2200 ($130 non-medical deductible withheld)',
        });

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.data.claim.status).toBe('APPROVED');
      expect(approveRes.body.data.claim.approvedAmount).toBe(2200);
    });

    it('should finalize and SETTLE insurance claim, generating insurance payment record', async () => {
      const res = await request(app)
        .put(`/api/v1/billing/insurance/claims/${insuranceClaimId}/status`)
        .set('Authorization', `Bearer ${accountantToken}`)
        .send({
          status: 'SETTLED',
          settledAmount: 2200.0,
          adjudicationNotes: 'NEFT Transfer settled directly to hospital provider account',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.claim.status).toBe('SETTLED');
      expect(res.body.data.claim.settledAmount).toBe(2200);
      expect(res.body.data.claim.settledAt).toBeDefined();
    });

    it('should retrieve insurance dashboard summary with claim counts and value aggregates', async () => {
      const res = await request(app)
        .get('/api/v1/billing/insurance/dashboard')
        .set('Authorization', `Bearer ${accountantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.summary.totalClaims).toBeGreaterThanOrEqual(1);
      expect(res.body.data.summary.settledCount).toBeGreaterThanOrEqual(1);
      expect(res.body.data.summary.totalActivePolicies).toBeGreaterThanOrEqual(1);
      expect(res.body.data.summary.totalSettledAmount).toBeGreaterThanOrEqual(2200);
    });
  });

  // ==========================================
  // 5. PDF INVOICE & ACCOUNTANT DASHBOARD
  // ==========================================
  describe('5. Professional Invoice PDF Streaming & Accountant Dashboard', () => {
    it('should stream generated Invoice PDF with valid application/pdf headers', async () => {
      const res = await request(app)
        .get(`/api/v1/billing/invoices/${invoice1Id}/pdf`)
        .set('Authorization', `Bearer ${accountantToken}`);

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toBe('application/pdf');
      expect(res.header['content-disposition']).toMatch(/inline; filename="Invoice-INV-/);
      expect(res.body).toBeInstanceOf(Buffer);
      expect(res.body.length).toBeGreaterThan(1000); // Valid PDF binary size
    });

    it('should retrieve Accountant Dashboard metrics with service breakdown', async () => {
      const res = await request(app)
        .get('/api/v1/billing/dashboard')
        .set('Authorization', `Bearer ${accountantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.summary.totalRevenue).toBeGreaterThan(0);
      expect(res.body.data.summary.totalInvoices).toBeGreaterThanOrEqual(2);
      expect(res.body.data.revenueByCategory).toBeDefined();
      expect(res.body.data.revenueByCategory.SURGERY).toBeGreaterThanOrEqual(1200);
      expect(res.body.data.revenueByCategory.ICU).toBeGreaterThanOrEqual(500);
      expect(res.body.data.revenueByMethod).toBeDefined();
    });
  });

  // ==========================================
  // 6. MULTI-TENANT & SECURITY CONTROLS
  // ==========================================
  describe('6. Security & Multi-Tenant Authorization Verification', () => {
    it('should REJECT unauthorized Patient B attempting to download Patient A invoice PDF', async () => {
      const res = await request(app)
        .get(`/api/v1/billing/invoices/${invoice1Id}/pdf`)
        .set('Authorization', `Bearer ${patientBToken}`);

      expect(res.status).toBe(404);
    });

    it('should REJECT regular Patient attempting to adjudicate an insurance claim', async () => {
      const res = await request(app)
        .put(`/api/v1/billing/insurance/claims/${insuranceClaimId}/status`)
        .set('Authorization', `Bearer ${patientAToken}`)
        .send({
          status: 'SETTLED',
        });

      expect(res.status).toBe(403);
    });

    it('should record comprehensive audit log entries for all billing operations', async () => {
      const logs = await AuditLog.find({
        resource: { $in: ['invoices', 'payments', 'insurance_claims', 'patient_insurances'] },
      });

      expect(logs.length).toBeGreaterThanOrEqual(4);
    });
  });
});
