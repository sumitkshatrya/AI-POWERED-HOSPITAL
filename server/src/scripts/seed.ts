import bcrypt from 'bcryptjs';
import { connectMongoDB, disconnectMongoDB } from '../config/database';
import {
  User,
  Hospital,
  Branch,
  Department,
  Doctor,
  Patient,
  Medicine,
  LabTest,
  Ward,
  Room,
  Bed,
  Appointment,
} from '../models';
import { Role } from '../types/roles';

async function seed() {
  console.log('[Seed] Connecting to MongoDB...');
  await connectMongoDB();

  console.log('[Seed] Clearing existing collections...');
  await User.deleteMany({});
  await Hospital.deleteMany({});
  await Branch.deleteMany({});
  await Department.deleteMany({});
  await Doctor.deleteMany({});
  await Patient.deleteMany({});
  await Medicine.deleteMany({});
  await LabTest.deleteMany({});
  await Ward.deleteMany({});
  await Room.deleteMany({});
  await Bed.deleteMany({});
  await Appointment.deleteMany({});

  const hashedPassword = await bcrypt.hash('AdminPass123!', 10);

  // 1. Create Super Admin
  const superAdmin = await User.create({
    firstName: 'Super',
    lastName: 'Admin',
    email: 'superadmin@hospital.com',
    password: hashedPassword,
    role: Role.SUPER_ADMIN,
    isActive: true,
    isVerified: true,
  });
  console.log(`[Seed] Super Admin created: ${superAdmin.email}`);

  // 2. Create Primary Hospital
  const hospital = await Hospital.create({
    name: 'City Care Hospital',
    logo: 'https://via.placeholder.com/150',
    registrationNumber: 'HOSP-2026-001',
    email: 'info@citycarehospital.com',
    phone: '+1-800-555-0199',
    website: 'https://citycarehospital.com',
    address: '100 Healthcare Blvd, Metro City',
    emergencyContact: '+1-800-555-9111',
    workingHours: '24/7',
    facilities: ['Emergency', 'ICU', 'Radiology', 'Pharmacy', 'Lab', 'Ambulance'],
    isActive: true,
  });
  console.log(`[Seed] Hospital created: ${hospital.name} (${hospital._id})`);

  // 3. Create Main Branch
  const branch = await Branch.create({
    hospitalId: hospital._id,
    name: 'Downtown Main Branch',
    address: '100 Healthcare Blvd, Metro City',
    phone: '+1-800-555-0199',
    email: 'downtown@citycarehospital.com',
    workingHours: '24/7',
    isActive: true,
  });
  console.log(`[Seed] Branch created: ${branch.name}`);

  // 4. Create Departments
  const cardiology = await Department.create({
    hospitalId: hospital._id,
    branchId: branch._id,
    name: 'Cardiology',
    description: 'Heart and cardiovascular system care',
    isActive: true,
  });

  const neurology = await Department.create({
    hospitalId: hospital._id,
    branchId: branch._id,
    name: 'Neurology',
    description: 'Brain and nervous system treatment',
    isActive: true,
  });

  const pediatrics = await Department.create({
    hospitalId: hospital._id,
    branchId: branch._id,
    name: 'Pediatrics',
    description: 'Children and infant healthcare',
    isActive: true,
  });

  console.log('[Seed] Departments created');

  // 5. Create Hospital Admin
  await User.create({
    firstName: 'Hospital',
    lastName: 'Admin',
    email: 'admin@citycarehospital.com',
    password: hashedPassword,
    role: Role.HOSPITAL_ADMIN,
    hospitalId: hospital._id,
    branchId: branch._id,
    isActive: true,
    isVerified: true,
  });

  // 6. Create Doctors & Profiles
  const doctorUser1 = await User.create({
    firstName: 'Sarah',
    lastName: 'Jenkins',
    email: 'dr.jenkins@citycarehospital.com',
    password: hashedPassword,
    role: Role.DOCTOR,
    hospitalId: hospital._id,
    branchId: branch._id,
    isActive: true,
    isVerified: true,
  });

  const doctor1 = await Doctor.create({
    userId: doctorUser1._id,
    hospitalId: hospital._id,
    branchId: branch._id,
    departmentId: cardiology._id,
    registrationNumber: 'DOC-REG-1001',
    specialization: 'Cardiology',
    qualifications: 'MD, FACC',
    experience: 12,
    languages: ['English', 'Spanish'],
    consultationFee: 150,
    bio: 'Senior Interventional Cardiologist with over 12 years of clinical experience.',
    onlineConsultation: true,
    rating: 4.9,
    isAvailable: true,
  });

  const doctorUser2 = await User.create({
    firstName: 'Robert',
    lastName: 'Chen',
    email: 'dr.chen@citycarehospital.com',
    password: hashedPassword,
    role: Role.DOCTOR,
    hospitalId: hospital._id,
    branchId: branch._id,
    isActive: true,
    isVerified: true,
  });

  const doctor2 = await Doctor.create({
    userId: doctorUser2._id,
    hospitalId: hospital._id,
    branchId: branch._id,
    departmentId: neurology._id,
    registrationNumber: 'DOC-REG-1002',
    specialization: 'Neurology',
    qualifications: 'MD, PhD',
    experience: 15,
    languages: ['English', 'Mandarin'],
    consultationFee: 180,
    bio: 'Specialist in neurodegenerative diseases and cerebrovascular medicine.',
    onlineConsultation: true,
    rating: 4.8,
    isAvailable: true,
  });

  console.log('[Seed] Doctors created');

  // 7. Create Staff Users (Nurse, Receptionist)
  await User.create({
    firstName: 'Emily',
    lastName: 'Watson',
    email: 'nurse.watson@citycarehospital.com',
    password: hashedPassword,
    role: Role.NURSE,
    hospitalId: hospital._id,
    branchId: branch._id,
    isActive: true,
    isVerified: true,
  });

  await User.create({
    firstName: 'David',
    lastName: 'Miller',
    email: 'receptionist.dave@citycarehospital.com',
    password: hashedPassword,
    role: Role.RECEPTIONIST,
    hospitalId: hospital._id,
    branchId: branch._id,
    isActive: true,
    isVerified: true,
  });

  console.log('[Seed] Staff users created');

  // 8. Create Patient User & Profile
  const patientUser = await User.create({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: hashedPassword,
    role: Role.PATIENT,
    hospitalId: hospital._id,
    branchId: branch._id,
    isActive: true,
    isVerified: true,
  });

  const patient = await Patient.create({
    userId: patientUser._id,
    hospitalId: hospital._id,
    branchId: branch._id,
    patientId: 'PAT-2026-0001',
    mrn: 'MRN-10001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1-555-0144',
    dateOfBirth: new Date('1990-05-15'),
    gender: 'MALE',
    bloodGroup: 'O+',
    address: '456 Oak Street, Metro City',
    emergencyContact: '+1-555-0199',
    allergies: ['Penicillin'],
    chronicConditions: ['Hypertension'],
  });

  console.log('[Seed] Patient created');

  // 9. Create Medicines
  await Medicine.create({
    hospitalId: hospital._id,
    name: 'Amoxicillin 500mg',
    brandName: 'Amoxil',
    genericName: 'Amoxicillin',
    category: 'Antibiotic',
    form: 'Capsule',
    manufacturer: 'PharmaCorp',
    unit: 'CAPSULE',
    isActive: true,
  });

  await Medicine.create({
    hospitalId: hospital._id,
    name: 'Paracetamol 650mg',
    brandName: 'Calpol',
    genericName: 'Paracetamol',
    category: 'Analgesic',
    form: 'Tablet',
    manufacturer: 'HealthMed',
    unit: 'TABLET',
    isActive: true,
  });

  console.log('[Seed] Medicines created');

  // 10. Create Lab Tests
  await LabTest.create({
    hospitalId: hospital._id,
    code: 'CBC-001',
    name: 'Complete Blood Count (CBC)',
    category: 'Hematology',
    price: 45,
    turnaroundTime: '4 hours',
    isActive: true,
  });

  await LabTest.create({
    hospitalId: hospital._id,
    code: 'LFT-002',
    name: 'Liver Function Test',
    category: 'Biochemistry',
    price: 75,
    turnaroundTime: '6 hours',
    isActive: true,
  });

  console.log('[Seed] Lab tests created');

  // 11. Create Ward & Bed
  const ward = await Ward.create({
    hospitalId: hospital._id,
    branchId: branch._id,
    name: 'General Ward A',
    code: 'GWA',
    type: 'GENERAL',
    totalBeds: 10,
    isActive: true,
  });

  const room = await Room.create({
    hospitalId: hospital._id,
    branchId: branch._id,
    wardId: ward._id,
    roomNumber: '101',
    roomType: 'STANDARD',
    ratePerDay: 100,
  });

  await Bed.create({
    hospitalId: hospital._id,
    branchId: branch._id,
    wardId: ward._id,
    roomId: room._id,
    bedNumber: 'B101-1',
    status: 'AVAILABLE',
    ratePerDay: 100,
  });

  console.log('[Seed] Ward & Bed created');

  // 12. Create Appointment
  await Appointment.create({
    hospitalId: hospital._id,
    branchId: branch._id,
    doctorId: doctor1._id,
    patientId: patient._id,
    departmentId: cardiology._id,
    appointmentDate: new Date(),
    startTime: '10:00',
    endTime: '10:30',
    type: 'IN_PERSON',
    status: 'CONFIRMED',
    tokenNumber: 1,
    consultationFee: 150,
    paymentStatus: 'PAID',
    notes: 'Regular cardiac follow up.',
  });

  console.log('[Seed] Appointment created');
  console.log('✅ Seed completed successfully!');

  await disconnectMongoDB();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed script error:', err);
  process.exit(1);
});

