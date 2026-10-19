import bcrypt from 'bcryptjs';
import {
  User,
  Hospital,
  Branch,
  Department,
  Doctor,
  Patient,
} from '../models';
import { Role } from '../types/roles';

export const DEMO_PASSWORD = 'Password123!';

export interface DemoAccountDef {
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  aliases?: string[];
  specialization?: string;
}

export const DEMO_ACCOUNTS: DemoAccountDef[] = [
  {
    email: 'superadmin@hospital.com',
    role: Role.SUPER_ADMIN,
    firstName: 'Super',
    lastName: 'Admin',
  },
  {
    email: 'admin@citycarehospital.com',
    role: Role.HOSPITAL_ADMIN,
    firstName: 'Hospital',
    lastName: 'Admin',
    aliases: ['admin@citygeneral.com'],
  },
  {
    email: 'branchadmin@citycarehospital.com',
    role: Role.BRANCH_ADMIN,
    firstName: 'Branch',
    lastName: 'Admin',
  },
  {
    email: 'dr.jenkins@citycarehospital.com',
    role: Role.DOCTOR,
    firstName: 'Sarah',
    lastName: 'Jenkins',
    aliases: ['doctor.a1@citygeneral.com'],
    specialization: 'Cardiology',
  },
  {
    email: 'nurse.watson@citycarehospital.com',
    role: Role.NURSE,
    firstName: 'Emily',
    lastName: 'Watson',
    aliases: ['nurse@citygeneral.com'],
  },
  {
    email: 'receptionist.dave@citycarehospital.com',
    role: Role.RECEPTIONIST,
    firstName: 'David',
    lastName: 'Miller',
  },
  {
    email: 'pharmacist@citycarehospital.com',
    role: Role.PHARMACIST,
    firstName: 'Philip',
    lastName: 'Hayes',
  },
  {
    email: 'labtech@citycarehospital.com',
    role: Role.LAB_TECHNICIAN,
    firstName: 'Laura',
    lastName: 'Bennett',
  },
  {
    email: 'radiologist@citycarehospital.com',
    role: Role.RADIOLOGIST,
    firstName: 'Raymond',
    lastName: 'Cross',
  },
  {
    email: 'accountant@citycarehospital.com',
    role: Role.ACCOUNTANT,
    firstName: 'Alice',
    lastName: 'Vance',
  },
  {
    email: 'insurance@citycarehospital.com',
    role: Role.INSURANCE_STAFF,
    firstName: 'Ian',
    lastName: 'Sterling',
  },
  {
    email: 'ambulance@citycarehospital.com',
    role: Role.AMBULANCE_OPERATOR,
    firstName: 'Arthur',
    lastName: 'Oakes',
  },
  {
    email: 'bloodbank@citycarehospital.com',
    role: Role.BLOOD_BANK_STAFF,
    firstName: 'Bella',
    lastName: 'Banks',
  },
  {
    email: 'john.doe@example.com',
    role: Role.PATIENT,
    firstName: 'John',
    lastName: 'Doe',
    aliases: ['patient@gmail.com'],
  },
];

export const ensureDemoAccounts = async (): Promise<void> => {
  try {
    const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);

    // 1. Ensure Primary Hospital exists
    let hospital = await Hospital.findOne({});
    if (!hospital) {
      hospital = await Hospital.create({
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
    }

    // 2. Ensure Main Branch exists
    let branch = await Branch.findOne({ hospitalId: hospital._id });
    if (!branch) {
      branch = await Branch.create({
        hospitalId: hospital._id,
        name: 'Downtown Main Branch',
        address: '100 Healthcare Blvd, Metro City',
        phone: '+1-800-555-0199',
        email: 'downtown@citycarehospital.com',
        workingHours: '24/7',
        isActive: true,
      });
    }

    // 3. Ensure Department exists
    let department = await Department.findOne({ hospitalId: hospital._id });
    if (!department) {
      department = await Department.create({
        hospitalId: hospital._id,
        branchId: branch._id,
        name: 'Cardiology',
        description: 'Cardiovascular Care',
        isActive: true,
      });
    }

    // 4. Upsert all demo accounts and their aliases
    for (const def of DEMO_ACCOUNTS) {
      const allEmails = [def.email, ...(def.aliases || [])];
      for (const email of allEmails) {
        const lowerEmail = email.toLowerCase();
        let user = await User.findOne({ email: lowerEmail });
        if (!user) {
          user = await User.create({
            firstName: def.firstName,
            lastName: def.lastName,
            email: lowerEmail,
            password: hashedPassword,
            passwordHash: hashedPassword,
            role: def.role,
            hospitalId: hospital._id,
            branchId: branch._id,
            departmentId: department._id,
            isActive: true,
            isVerified: true,
          });
        } else {
          user.password = hashedPassword;
          user.passwordHash = hashedPassword;
          user.role = def.role;
          user.isActive = true;
          user.isVerified = true;
          if (!user.hospitalId) user.hospitalId = hospital._id as any;
          if (!user.branchId) user.branchId = branch._id as any;
          await user.save();
        }

        // Ensure Doctor profile exists
        if (def.role === Role.DOCTOR) {
          const doc = await Doctor.findOne({ userId: user._id });
          if (!doc) {
            await Doctor.create({
              userId: user._id,
              hospitalId: hospital._id,
              branchId: branch._id,
              departmentId: department._id,
              registrationNumber: `DOC-REG-${user._id.toString().slice(-4)}`,
              specialization: def.specialization || 'General Medicine',
              qualifications: 'MD, FACC',
              experience: 10,
              languages: ['English'],
              consultationFee: 120,
              bio: 'Senior Clinical Specialist',
              onlineConsultation: true,
              rating: 4.9,
              isAvailable: true,
            });
          }
        }

        // Ensure Patient profile exists
        if (def.role === Role.PATIENT) {
          const pat = await Patient.findOne({ userId: user._id });
          if (!pat) {
            await Patient.create({
              userId: user._id,
              hospitalId: hospital._id,
              branchId: branch._id,
              patientId: `PAT-${user._id.toString().slice(-4)}`,
              mrn: `MRN-${user._id.toString().slice(-4)}`,
              firstName: def.firstName,
              lastName: def.lastName,
              email: lowerEmail,
              phone: '+1-555-0144',
              dateOfBirth: new Date('1990-05-15'),
              gender: 'MALE',
              bloodGroup: 'O+',
              address: '100 Healthcare Blvd, Metro City',
              emergencyContact: '+1-555-0199',
            });
          }
        }
      }
    }

    console.log(`[DemoSeeder] Successfully ensured all ${DEMO_ACCOUNTS.length} demo accounts in MongoDB.`);
  } catch (error) {
    console.error('[DemoSeeder] Error ensuring demo accounts:', error);
  }
};

