# MediCore — AI-Powered Hospital & Doctor Management Platform

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture & Technology Stack](#2-architecture--technology-stack)
3. [Supported Clinical & Administrative Roles (14 Roles)](#3-supported-clinical--administrative-roles-14-roles)
4. [Core Modules & Implemented Features](#4-core-modules--implemented-features)
5. [Repository Structure](#5-repository-structure)
6. [Prerequisites & Installation](#6-prerequisites--installation)
7. [Environment Variables Configuration](#7-environment-variables-configuration)
8. [Database Setup & Demo Seeding](#8-database-setup--demo-seeding)
9. [API Endpoint Reference](#9-api-endpoint-reference)
10. [Real-Time Socket.IO Events](#10-real-time-socketio-events)
11. [Usage Guide & Testing Workflows](#11-usage-guide--testing-workflows)
12. [Production Build & Deployment](#12-production-build--deployment)
13. [Troubleshooting & FAQ](#13-troubleshooting--faq)
14. [Security & Compliance](#14-security--compliance)
15. [Contributing & Code Standards](#15-contributing--code-standards)

---

## 1. Executive Summary

**MediCore** is an enterprise-grade, multi-tenant healthcare SaaS and clinical operating system designed to modernize and unify hospital administrative, clinical, and operational workflows.

### The Problem It Solves
Traditional healthcare environments suffer from fragmented software silos:
- Paper records or slow EMR systems delay patient triage and clinical decision-making.
- Disconnected outpatient waiting rooms generate chaotic queues and extended wait times.
- Illegible handwriting on physical prescriptions introduces dangerous medication and contraindication errors.
- Inpatient bed management lacks real-time visibility, leading to delayed transfers and ICU bottlenecks.
- Diagnostic lab orders (LIS) and radiology scans (RIS) remain isolated from doctor workspaces.
- Billing, pharmacy sales, and third-party insurance claims require redundant manual data re-entry.

### The Solution
MediCore unifies **14 clinical and administrative roles** into a single, high-performance platform. From the moment a patient registers an account or books an appointment, their data travels securely through outpatient triage, electronic health records (EHR), automated pharmacy point-of-sale (POS), LIS/RIS diagnostics, bed allocations, and discharge billing with zero manual re-entry.

---

## 2. Architecture & Technology Stack

The platform is structured as an integrated monorepo separating a modern Single Page Application (SPA) frontend from a scalable REST and WebSocket backend.

```
                              ┌────────────────────────────────────────────────────────┐
                              │                 Client (React 18 + Vite)                │
                              │  • TailwindCSS UI   • Framer Motion 3D   • Lucide Icons│
                              └───────────────────────────┬────────────────────────────┘
                                                          │ HTTP / REST & WebSockets
                                                          ▼
                              ┌────────────────────────────────────────────────────────┐
                              │            Backend API (Node.js + Express)             │
                              │  • TypeScript  • Zod Validation  • JWT Auth & RBAC     │
                              └─────────────┬────────────────────────────┬─────────────┘
                                            │                            │
                                            ▼                            ▼
                    ┌───────────────────────────────┐            ┌───────────────────────┐
                    │     MongoDB Atlas (Mongoose)  │            │    Google Gemini AI   │
                    │  • Multi-tenant Collections   │            │  • Clinical Summaries │
                    │  • Encrypted Demographics     │            │  • Medical Copilot    │
                    └───────────────────────────────┘            └───────────────────────┘
```

### Frontend (`/client`)
- **Core Framework**: React 18.3.1 with Vite 6.0.5
- **Language**: TypeScript 5.7.2
- **Routing**: React Router v7 (`react-router-dom` v7.1.1)
- **Styling**: TailwindCSS 3.4.17 with PostCSS and Autoprefixer
- **Motion & 3D Interactive UI**: Framer Motion 13.4.3
- **Icons**: Lucide React (`lucide-react` v0.469.0)
- **HTTP Client**: Axios 1.7.9 with request/response interceptors
- **Real-Time Client**: Socket.IO Client 4.8.3

### Backend (`/server`)
- **Runtime Environment**: Node.js (v18+, v20 LTS, v22 LTS, v24)
- **Web Framework**: Express 4.21.2
- **Language**: TypeScript 5.7.2 executed via `tsx`
- **Database Object Modeling**: Mongoose 8.10.0 (MongoDB Atlas / Local)
- **Real-Time Engine**: Socket.IO 4.8.3
- **Authentication & Security**:
  - JSON Web Tokens (`jsonwebtoken` v9.0.2) with rotating access & refresh tokens
  - Password hashing via `bcryptjs` v2.4.3 (10 salt rounds)
  - HTTP headers security via `helmet` v8.0.0
  - Rate limiting via `express-rate-limit` v7.5.0
  - Cookie parsing via `cookie-parser` v1.4.7
  - CORS security via `cors` v2.8.5
- **Input Validation**: Zod 3.24.1 (Strict runtime schema validation)
- **Document & PDF Engine**: PDFKit 0.20.2 (Automated discharge summaries & clinical reports)
- **File Uploads**: Multer 2.4.0 (Encrypted local storage with mime-type filtering)
- **AI Integration**: Google Gemini Generative AI API

---

## 3. Supported Clinical & Administrative Roles (14 Roles)

MediCore enforces strict Role-Based Access Control (RBAC). Every user belongs to a primary role that determines accessible navigation routes, dashboard views, and API permissions:

| # | Role | Role Enum | Primary Workspaces & Responsibilities |
|---|------|-----------|----------------------------------------|
| 1 | **Super Admin** | `SUPER_ADMIN` | Global platform control, hospital provisioning, multi-tenant auditing, security logs. |
| 2 | **Hospital Admin** | `HOSPITAL_ADMIN` | Hospital branch management, staff onboarding, department configuration, fee schedules. |
| 3 | **Branch Admin** | `BRANCH_ADMIN` | Facility-specific branch operations, shift schedules, physical ward assignments. |
| 4 | **Doctor / Specialist** | `DOCTOR` | Clinical workspace, OPD consultations, SOAP notes, e-Prescriptions, IPD rounds. |
| 5 | **Nurse** | `NURSE` | Triage station, vitals recording, Medication Administration Records (MAR), shift notes. |
| 6 | **Receptionist** | `RECEPTIONIST` | Patient registration, UHID issuance, walk-in token allocation, appointment booking. |
| 7 | **Pharmacist** | `PHARMACIST` | Central dispensary POS, e-Rx fulfillment, drug stock tracking, batch/expiry alerts. |
| 8 | **Lab Technician** | `LAB_TECHNICIAN` | Specimen barcode tracking, automated analyzer integration, LIS diagnostic reports. |
| 9 | **Radiologist** | `RADIOLOGIST` | Radiology Information System (RIS), modality queues (CT, MRI, X-Ray), PACS scans. |
| 10 | **Accountant** | `ACCOUNTANT` | Billing hub, itemized invoice generation, payment receipts (Cash/Card/POS/UPI). |
| 11 | **Insurance Staff** | `INSURANCE_STAFF` | Third-Party Administrator (TPA) claim processing, policy pre-authorization. |
| 12 | **Ambulance Operator**| `AMBULANCE_OPERATOR` | Fleet tracking, emergency response dispatch, en-route trauma status telemetry. |
| 13 | **Blood Bank Staff** | `BLOOD_BANK_STAFF` | Blood donor registry, inventory unit tracking (A/B/AB/O +/-), cross-match testing. |
| 14 | **Patient** | `PATIENT` | Personal health portal, appointment booking, medical history, lab reports, invoices. |

---

## 4. Core Modules & Implemented Features

### 1. Interactive 3D Authentication Portal (`/login` & `/register`)
- **3D Interactive Clinical Bag**: Framer Motion 3D tilt effects, interactive doctor character with eye-covering password masking.
- **Immediate Accessibility**: Default bag state set to open for instant login without animation delays.
- **Quick Demo Fill Buttons**: One-click credential autofill buttons for all **14 roles**.
- **Role Registration Dropdown**: Complete 14-role selection dropdown with client and server schema validation.

### 2. Live Outpatient OPD Queue & Digital Wall Display (`/opd-queue` & `/opd-queue-display`)
- **Real-Time Token Calling**: WebSocket-powered live token advancement by room and doctor.
- **Unattended Wall Display**: Dedicated public display screen (`/opd-queue-display`) configured for waiting room monitors with audio chimes and no authentication requirement.
- **Patient Status Tracking**: Clear visual indicators (`Waiting`, `In Consultation`, `Completed`, `Skipped`).

### 3. Doctor Clinical Workspace (`/doctor-workspace` & `/doctor/consultation`)
- **Longitudinal EMR Timeline**: Unified view of past consultations, uploaded medical records, vitals trends, and lab reports.
- **Structured SOAP Notes**: Subjective symptoms, Objective vitals, Clinical Assessment, and Treatment Plan fields.
- **ICD-10 Diagnostic Coding**: Standardized diagnosis categorization.
- **Digital Vitals Recording**: Blood Pressure, Pulse, SpO2, Temperature, Respiratory Rate, and BMI calculation.

### 4. Certified Digital e-Prescriptions (`/patients/:id/emr`)
- **Drug Formulation**: Medication name, generic equivalent, dosage form, strength, duration, frequency, and instructions.
- **Clinical Safety Warnings**: Automated alerts for recorded patient drug allergies and contraindications.
- **Direct Pharmacy Routing**: Digital e-Rx instantly appears on the central hospital pharmacy dispensary queue.

### 5. Inpatient IPD & Bed Management (`/bed-management` & `/ipd-admissions`)
- **Floor Bed Maps**: Visual bed occupancy breakdown across General Wards, Semi-Private, Deluxe, and ICU.
- **Bed Transfers**: Dedicated bed relocation workflows with reason tracking and automated rate recalculation.
- **Doctor Rounds & Nursing Notes**: Shift-based clinical rounding logs and nurse handovers.
- **Digital MAR (Medication Administration Record)**: Scheduled doses with `GIVEN`, `HELD`, or `MISSED` verification.

### 6. Hospital Pharmacy POS & Inventory (`/pharmacy-dashboard`, `/pharmacy-medicines`, `/pharmacy-sales`)
- **Point of Sale (POS)**: Instant prescription fulfillment with barcode support and automatic stock deduction.
- **Batch & Expiration Tracking**: Automatic warnings for expiring batches and critically low quantities.
- **Medicine Catalog**: Categorization by Antibiotics, Analgesics, Cardiovascular, Respiratory, and Diabetes.

### 7. Laboratory (LIS) & Radiology (RIS) Diagnostics (`/lab-management` & `/radiology`)
- **LIS Specimen Barcoding**: Sample collection tracking with turnaround time timers.
- **RIS Modality Queues**: Dedicated worklists for X-Ray, CT Scan, MRI, Ultrasound, Mammogram, and PET Scan.
- **Automated Verified Reports**: Radiologist and pathologist verification with PDF generation.

### 8. Billing, Payments & Insurance Claims (`/billing`, `/accountant-dashboard`, `/insurance-dashboard`)
- **Consolidated Invoicing**: Unifies consultation fees, bed charges, lab tests, and pharmacy sales.
- **Multiple Payment Modes**: Cash, Debit/Credit Card POS, UPI QR Code, Net Banking, and Insurance Claims.
- **TPA Insurance Processing**: Claim status tracking (`SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `SETTLED`).
- **Discharge Summaries**: Instant PDF generation and download (`/api/v1/admissions/:id/discharge-pdf`).

### 9. Emergency Trauma & Ambulance Fleet (`/emergency` & `/ambulance`)
- **Trauma Triage**: Real-time acuity classification (Immediate, Urgent, Standard).
- **Fleet Management**: ALS (Advanced Life Support), BLS, and Mobile ICU tracking with status updates (`AVAILABLE`, `EN_ROUTE`, `AT_LOCATION`, `TRANSPORTING`).

### 10. Blood Bank Management (`/blood-bank`)
- **Donor Registry**: Complete demographic and medical screening records.
- **Blood Unit Inventory**: Stock counts categorized by blood group (A+, A-, B+, B-, AB+, AB-, O+, O-).

### 11. AI Clinical Assistant (`/ai-assistant`)
- **Gemini AI Integration**: Real-time clinical summaries, symptom evaluation, differential diagnosis support, and drug information lookup.

### 12. Public Portal, Doctor Directory & Brand Hub
- **Doctor Directory (`/doctors` & `/doctors/:id`)**: Search clinicians by treatment (e.g., Bypass, Knee, MRI, Cardiology).
- **Company Pages**: About MediCore (`/about`), Contact & Enterprise Sales (`/contact`), and Subscription Pricing (`/pricing`).
- **Brand Configuration ([`client/src/config/brand.ts`](file:///d:/AI-POWERED%20HOSPITAL/client/src/config/brand.ts))**: Centralized branding, metrics (140+ hospitals, 2.5M+ patients, 99.99% uptime), certifications, and hotlines.

---

## 5. Repository Structure

```
AI-POWERED HOSPITAL/
├── .gitignore                          # Global monorepo Git ignore rules
├── README.md                           # Master project documentation
│
├── client/                             # Frontend React + Vite Application
│   ├── .env                            # Client environment variables (ignored)
│   ├── .env.example                    # Client environment template
│   ├── .gitignore                      # Client-specific Git ignore rules
│   ├── index.html                      # Root HTML entry point
│   ├── package.json                    # Client dependencies and scripts
│   ├── tailwind.config.js              # TailwindCSS styling configuration
│   ├── tsconfig.json                   # Client TypeScript configuration
│   ├── vite.config.ts                  # Vite build tool configuration
│   └── src/
│       ├── App.tsx                     # Application route definitions & guards
│       ├── index.css                   # Global CSS & Tailwind imports
│       ├── main.tsx                    # React DOM mounting entry point
│       ├── components/                 # Reusable UI & clinical components
│       │   ├── auth/
│       │   │   ├── Auth3DContainer.tsx # 3D Auth Portal with 14 demo roles
│       │   │   └── DoctorArrivalScene.tsx # 3D Canvas arrival scene
│       │   ├── landing/                # Public landing page sections
│       │   │   ├── HeroSection.tsx     # Hero banner with live telemetry
│       │   │   ├── HospitalOperationsSection.tsx # Operations command center
│       │   │   ├── JourneySection.tsx  # 9-stage connected care pipeline
│       │   │   ├── LandingFooter.tsx   # Comprehensive public footer
│       │   │   ├── LandingNavbar.tsx   # Sticky responsive navigation bar
│       │   │   └── ...                 # Additional landing components
│       │   ├── Navbar.tsx              # Authenticated top navigation
│       │   ├── Sidebar.tsx             # Role-filtered sidebar navigation
│       │   └── ...                     # Modals, charts, timeline components
│       ├── config/
│       │   └── brand.ts                # Centralized brand & corporate metadata
│       ├── context/
│       │   └── AuthContext.tsx         # Global authentication & user state
│       ├── layouts/
│       │   ├── DashboardLayout.tsx     # Authenticated dashboard wrapper
│       │   └── PublicLayout.tsx        # Unauthenticated public page wrapper
│       ├── pages/                      # 30+ Application view controllers
│       │   ├── AboutPage.tsx           # Corporate & mission page
│       │   ├── AccountantDashboardPage.tsx # Accounting & financial overview
│       │   ├── AiAssistantPage.tsx     # Gemini AI clinical chat workspace
│       │   ├── AmbulanceFleetPage.tsx  # Fleet dispatch & vehicle tracking
│       │   ├── Appointments.tsx        # Appointment list & token assignment
│       │   ├── AppointmentsCalendar.tsx# Visual monthly/weekly calendar
│       │   ├── BedManagementPage.tsx   # Visual ward and bed allocations
│       │   ├── BloodBankDashboardPage.tsx # Donor and blood unit inventory
│       │   ├── ContactPage.tsx         # Enterprise inquiry & support form
│       │   ├── DoctorClinicalWorkspace.tsx # Physician EHR examination room
│       │   ├── DoctorDirectory.tsx     # Public doctor & treatment search
│       │   ├── EmergencyDashboardPage.tsx # Trauma and ER triage desk
│       │   ├── HospitalInventoryPage.tsx # Equipment & supply management
│       │   ├── LabManagementPage.tsx   # LIS laboratory analyzer portal
│       │   ├── LandingPage.tsx         # Master public homepage
│       │   ├── Login.tsx / Register.tsx# Authentication route entry points
│       │   ├── NursingDashboardPage.tsx# Inpatient nursing station & MAR
│       │   ├── PharmacyDashboardPage.tsx # Central pharmacy POS & stock
│       │   └── RadiologyDashboard.tsx  # RIS imaging & modality worklists
│       ├── services/                   # Axios API service client modules
│       │   ├── api.ts                  # Axios instance with auth interceptor
│       │   ├── appointmentService.ts   # Appointment API calls
│       │   ├── emrService.ts           # EMR and consultation API calls
│       │   ├── ipdService.ts           # Inpatient admission API calls
│       │   └── ...                     # Additional API services
│       └── types/                      # Frontend TypeScript interfaces
│           └── auth.ts                 # Role enums and User contracts
│
└── server/                             # Backend Node.js + Express API
    ├── .env                            # Server environment variables (ignored)
    ├── .env.example                    # Server environment template
    ├── .gitignore                      # Server-specific Git ignore rules
    ├── jest.config.js                  # Jest testing configuration
    ├── package.json                    # Server dependencies and scripts
    ├── tsconfig.json                   # Server TypeScript configuration
    ├── tsconfig.tsbuildinfo            # Incremental compilation cache (ignored)
    ├── uploads/                        # Uploaded medical records (ignored)
    │   └── .gitkeep                    # Directory preservation placeholder
    └── src/
        ├── app.ts                      # Express app configuration & middleware
        ├── index.ts                    # HTTP & Socket.IO server startup
        ├── socket.ts                   # Socket.IO connection handlers
        ├── config/
        │   ├── database.ts             # MongoDB Atlas Mongoose connection
        │   └── env.ts                  # Zod-validated environment config
        ├── controllers/                # 30+ Express business logic controllers
        │   ├── auth.controller.ts      # Authentication, login, JWT issuance
        │   ├── emr.controller.ts       # Clinical notes, radiology, procedures
        │   ├── ipd.controller.ts       # Bed allocations, rounds, MAR schedules
        │   └── ...                     # Additional module controllers
        ├── middleware/
        │   ├── auth.middleware.ts      # JWT verification & optional auth
        │   ├── error.middleware.ts     # Global exception & error handler
        │   └── role.middleware.ts      # RBAC permission enforcement
        ├── models/                     # 30+ Mongoose ODM schemas
        │   ├── User.ts                 # User account credentials & roles
        │   ├── Hospital.ts / Branch.ts # Multi-tenant organization entities
        │   ├── Doctor.ts / Patient.ts  # Clinical profiles
        │   ├── Appointment.ts          # Consultation reservations
        │   ├── OpdQueue.ts             # Outpatient token queue state
        │   ├── Admission.ts / Bed.ts   # Inpatient admission records
        │   ├── Prescription.ts         # Digital e-Prescriptions
        │   └── ...                     # Medicines, Labs, Invoices, Ambulances
        ├── routes/                     # REST API route declarations
        │   ├── auth.routes.ts          # /api/v1/auth
        │   ├── doctor.routes.ts        # /api/v1/doctors
        │   ├── emr.routes.ts           # /api/v1/emr
        │   ├── ipd.routes.ts           # /api/v1/admissions
        │   ├── opdQueue.routes.ts      # /api/v1/opd-queue
        │   └── ...                     # All feature routes
        ├── schemas/                    # Zod validation schemas
        │   └── auth.schema.ts          # Registration and login payload rules
        ├── scripts/
        │   └── seed.ts                 # Standalone database seeding script
        ├── services/
        │   ├── ai.service.ts           # Gemini AI SDK integration
        │   └── demoSeeder.service.ts   # Automatic startup demo accounts seeder
        ├── types/                      # Backend TypeScript type declarations
        │   ├── express.d.ts            # Express Request user augmentation
        │   └── roles.ts                # Master Role enum definition
        └── utils/
            ├── passwords.ts            # Bcrypt hashing & verification
            └── tokens.ts               # JWT access & refresh token signing
```

---

## 6. Prerequisites & Installation

### System Requirements
- **Node.js**: `v18.0.0` or higher (`v20 LTS` or `v22 LTS` recommended; `v24` fully supported)
- **Package Manager**: `npm` (v9.x or higher)
- **Database**: Active MongoDB Atlas cluster URI or local MongoDB daemon (`v6.0+`)
- **Operating System**: Windows 10/11, macOS, or Linux

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-organization/ai-powered-hospital.git
cd ai-powered-hospital
```

### Step 2: Install Backend Dependencies
```bash
cd server
npm install
```

### Step 3: Install Frontend Dependencies
```bash
cd ../client
npm install
```

---

## 7. Environment Variables Configuration

### Backend Configuration (`server/.env`)
Create a `.env` file in the `server/` directory:

```bash
# Server Networking
PORT=5000
NODE_ENV=development

# Database Connection
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/hospital_platform?retryWrites=true&w=majority

# Authentication Secrets (Must be secure random strings)
JWT_SECRET=your-super-secret-jwt-access-token-key-min-16-chars
JWT_REFRESH_SECRET=your-super-secret-jwt-refresh-token-key-min-16-chars
REFRESH_TOKEN_SECRET=your-super-secret-jwt-refresh-token-key-min-16-chars
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
COOKIE_SECRET=your-cookie-signing-secret

# Client Application URL (For CORS & Socket.IO)
CLIENT_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000

# Artificial Intelligence Integration
AI_PROVIDER=gemini
GEMINI_API_KEY=your_google_gemini_api_key_here
```

### Frontend Configuration (`client/.env`)
Create a `.env` file in the `client/` directory:

```bash
VITE_API_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
```

---

## 8. Database Setup & Demo Seeding

### Automatic Seeder on Startup
MediCore features an integrated auto-seeder ([`server/src/services/demoSeeder.service.ts`](file:///d:/AI-POWERED%20HOSPITAL/server/src/services/demoSeeder.service.ts)). Every time the backend server starts, it verifies that the primary hospital, main branch, clinical departments, and **all 14 demo accounts** exist in the database with verified credentials.

### Manual Database Seeding
To perform a complete reset and fresh seed of all sample wards, beds, doctors, patients, medicines, and lab tests:
```bash
cd server
npm run db:seed
```

### Pre-Configured Demo Accounts
All pre-seeded demo accounts share the uniform default password: **`Password123!`**

| Role | Demo Email Address | Default Password | Quick-Fill Button in UI |
|------|--------------------|------------------|-------------------------|
| **Super Admin** | `superadmin@hospital.com` | `Password123!` | `👑 Super Admin` |
| **Hospital Admin** | `admin@citycarehospital.com` | `Password123!` | `🏥 Hospital Admin` |
| **Branch Admin** | `branchadmin@citycarehospital.com` | `Password123!` | `🏢 Branch Admin` |
| **Doctor / Specialist** | `dr.jenkins@citycarehospital.com` | `Password123!` | `🩺 Doctor / Spec.` |
| **Nurse** | `nurse.watson@citycarehospital.com` | `Password123!` | `💉 Nurse Station` |
| **Receptionist** | `receptionist.dave@citycarehospital.com` | `Password123!` | `📋 Receptionist` |
| **Pharmacist** | `pharmacist@citycarehospital.com` | `Password123!` | `💊 Pharmacist` |
| **Lab Technician** | `labtech@citycarehospital.com` | `Password123!` | `🧪 Lab Technician` |
| **Radiologist** | `radiologist@citycarehospital.com` | `Password123!` | `🩻 Radiologist` |
| **Accountant** | `accountant@citycarehospital.com` | `Password123!` | `💰 Accountant` |
| **Insurance Staff** | `insurance@citycarehospital.com` | `Password123!` | `🛡️ Insurance Staff` |
| **Ambulance Operator** | `ambulance@citycarehospital.com` | `Password123!` | `🚑 Ambulance Fleet` |
| **Blood Bank Staff** | `bloodbank@citycarehospital.com` | `Password123!` | `🩸 Blood Bank` |
| **Patient** | `john.doe@example.com` | `Password123!` | `🧑 Patient Portal` |

*(Note: Legacy demo aliases such as `doctor.a1@citygeneral.com`, `admin@citygeneral.com`, and `patient@gmail.com` are also active in the database).*

---

## 9. API Endpoint Reference

All REST endpoints are prefixed with `/api/v1`. Protected endpoints require an `Authorization: Bearer <accessToken>` header.

### Authentication & User Accounts (`/api/v1/auth`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/auth/register` | Public | Register new user with designated role |
| `POST` | `/auth/login` | Public | Authenticate user & return JWT tokens |
| `POST` | `/auth/refresh-token` | Public | Refresh expired access token using refresh token |
| `POST` | `/auth/logout` | Authenticated | Invalidate refresh tokens and clear cookies |
| `GET`  | `/auth/me` | Authenticated | Retrieve current authenticated user profile |
| `POST` | `/auth/forgot-password` | Public | Request password reset token |
| `POST` | `/auth/reset-password` | Public | Reset password using verified token |

### Outpatient OPD Queue (`/api/v1/opd-queue`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET`  | `/opd-queue` | Public / Optional Auth | Get current active OPD tokens (supports wall screens) |
| `POST` | `/opd-queue/ticket` | Staff / Admin | Issue a new walk-in OPD token |
| `PUT`  | `/opd-queue/:id/status` | Doctor / Nurse / Admin | Update token status (`IN_CONSULTATION`, `COMPLETED`, `SKIPPED`) |

### Inpatient IPD & Bed Management (`/api/v1/admissions`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET`  | `/admissions` | Clinical Staff | List active inpatient admissions |
| `POST` | `/admissions` | Doctor / Admin | Create a new patient admission |
| `GET`  | `/admissions/:id` | Clinical Staff | Get admission details, ward, and bed |
| `POST` | `/admissions/:id/transfer` | Doctor / Nurse / Admin | Transfer patient to a different bed/ward |
| `GET`  | `/admissions/:id/rounds` | Clinical Staff | Retrieve physician rounding notes |
| `POST` | `/admissions/:id/rounds` | Doctor | Record a new physician round |
| `GET`  | `/admissions/:id/nursing-notes` | Nurse / Doctor | Retrieve inpatient nursing notes |
| `POST` | `/admissions/:id/nursing-notes` | Nurse | Log an electronic nursing shift note |
| `GET`  | `/admissions/:id/discharge-pdf` | Clinical Staff | Download official signed Discharge Summary PDF |

### Electronic Medical Records & Consultations (`/api/v1/emr`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET`  | `/emr/patients/:patientId/summary` | Clinical Staff / Patient | Retrieve longitudinal patient EMR timeline |
| `POST` | `/emr/consultations` | Doctor | Save clinical consultation SOAP notes & vitals |
| `POST` | `/emr/prescriptions` | Doctor | Issue signed digital e-Prescription |
| `POST` | `/emr/radiology` | Doctor / Radiologist | Create or update radiology imaging request |
| `POST` | `/emr/procedures` | Doctor / Specialist | Record surgical or diagnostic procedure |

### Pharmacy & Medicine Catalog (`/api/v1/medicines` & `/api/v1/pharmacy-sales`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET`  | `/medicines` | Authenticated | Browse medicine catalog and stock levels |
| `POST` | `/medicines` | Pharmacist / Admin | Add new pharmaceutical SKU to catalog |
| `GET`  | `/pharmacy-sales` | Pharmacist / Accountant | List recent pharmacy sales transactions |
| `POST` | `/pharmacy-sales` | Pharmacist | Process POS sale and deplete batch inventory |

### Artificial Intelligence Assistant (`/api/v1/ai`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/ai/chat` | Authenticated | Send clinical query to Gemini AI Copilot |
| `POST` | `/ai/summarize-history` | Doctor | Generate synthesized EMR history summary |

---

## 10. Real-Time Socket.IO Events

The platform uses WebSocket rooms for instant multi-department updates:

| Event Name | Direction | Payload | Description |
|------------|-----------|---------|-------------|
| `join_room` | Client ➔ Server | `{ room: string }` | Join department room (e.g. `opd_queue`, `ipd_ward`) |
| `token_called` | Server ➔ Client | `{ token: number, roomNumber: string }` | Broadcasts called token to waiting displays |
| `bed_status_changed` | Server ➔ Client | `{ bedId: string, status: string }` | Updates live floor maps on bed state change |
| `emergency_alert` | Server ➔ Client | `{ triageLevel: string, location: string }`| Alerts trauma team of inbound ambulance |

---

## 11. Usage Guide & Testing Workflows

### Starting the Development Environment

Open two terminal windows:

**Terminal 1 (Backend Server):**
```bash
cd server
npm run dev
```
*The server initializes at `http://localhost:5000`, establishes the MongoDB Atlas connection, verifies all 14 demo accounts, and binds Socket.IO.*

**Terminal 2 (Frontend Client):**
```bash
cd client
npm run dev
```
*The client launches at `http://localhost:3000` with hot-module replacement (HMR).*

---

### Step-by-Step Clinical Testing Scenarios

#### Scenario A: Doctor Consultation & e-Prescription
1. Visit `http://localhost:3000/login`.
2. Click the `🩺 Doctor / Spec.` button under **QUICK DEMO FILL**.
3. Click **Sign In to Healthcare Portal** — you are routed to the Doctor Workspace.
4. Navigate to **Doctor Workspace** (`/doctor-workspace`) or **Live OPD Queue** (`/opd-queue`).
5. Select an active patient token, review their historical vitals, record clinical examination findings, and prescribe medications with automatic dosage checks.

#### Scenario B: Outpatient Queue Wall Display
1. Open a browser window to `http://localhost:3000/opd-queue-display`.
2. This screen requires no login and is formatted for large wall-mounted TVs in patient waiting areas.
3. In a separate tab logged in as a Doctor or Nurse, advance the queue token on `/opd-queue`.
4. Observe the wall display update in real time via Socket.IO with audio alert notifications.

#### Scenario C: Inpatient Bed Transfer & MAR Administration
1. Log in using `🏥 Hospital Admin` or `💉 Nurse Station`.
2. Navigate to **Bed Management** (`/bed-management`) to inspect room occupancy.
3. Open **Inpatient Admissions** (`/ipd-admissions`), select an admitted patient, and execute a **Bed Transfer** to an available ICU or Deluxe bed.
4. Open the **Nursing Station** (`/nursing-dashboard`) to administer scheduled medications and log nursing shift observations.

---

## 12. Production Build & Deployment

### Building for Production

**Frontend Build:**
```bash
cd client
npm run build
```
*Generates optimized production chunks in `client/dist/` with expanded semi-space allocations.*

**Backend Build:**
```bash
cd server
npm run build
```
*Compiles TypeScript source files into clean CommonJS JavaScript in `server/dist/`.*

---

### Deployment Guidelines

#### Frontend (Vercel / Netlify)
- **Root Directory**: `client`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_URL`: Your hosted backend URL (e.g. `https://api.yourhospital.com/api/v1`)
  - `VITE_SOCKET_URL`: Your hosted backend URL (e.g. `https://api.yourhospital.com`)
- **Single Page Application (SPA) Routing**: Ensure all routes rewrite to `/index.html`:
  - For Vercel, include a `vercel.json` with:
    ```json
    { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
    ```
  - For Netlify, include `client/public/_redirects` with:
    ```text
    /* /index.html 200
    ```

#### Backend (Render / Railway / Google Cloud Run / Docker)
- **Root Directory**: `server`
- **Build Command**: `npm run build`
- **Start Command**: `npm run start` (executes `node dist/index.js`)
- **Environment Variables**: Configure all keys listed in [Backend Configuration](#backend-configuration-serverenv).

---

## 13. Troubleshooting & FAQ

### 1. `JavaScript heap out of memory` during build
**Cause**: Node.js memory limits on Windows during large Rollup/Vite compilation steps.  
**Resolution**: Both `client/package.json` and `server/package.json` are pre-configured with expanded V8 heap flags:
```json
"build": "node --max-old-space-size=8192 --max-semi-space-size=128 ./node_modules/vite/bin/vite.js build"
```

### 2. `Cannot find module './types/express'`
**Cause**: Runtime import of a TypeScript `.d.ts` declaration file in Node.js/tsx.  
**Resolution**: The project uses compile-time triple-slash reference directives (`/// <reference path="./types/express.d.ts" />`) in `server/src/app.ts`. Do not use runtime `import './types/express'`.

### 3. Port 5000 or 3000 already in use
**Resolution**: Check active processes on Windows PowerShell:
```powershell
netstat -ano | findstr :5000
Stop-Process -Id <PID> -Force
```

### 4. MongoDB `querySrv ENOTFOUND` error
**Cause**: Local DNS resolvers failing to resolve MongoDB Atlas SRV records.  
**Resolution**: Ensure `server/src/config/database.ts` is utilizing Google Public DNS (`8.8.8.8`) or Cloudflare DNS (`1.1.1.1`) before connecting.

---

## 14. Security & Compliance

- **HIPAA Compliance**: Multi-tenant database indexing enforces data isolation between hospital organizations. Audit logs track patient record access and modifications.
- **Transport Security**: HTTPS and TLS 1.3 encryption are required in production.
- **Credential Storage**: Passwords are encrypted using salted bcrypt hashes. Plaintext passwords are never logged or stored.
- **Token Security**: Short-lived JWT access tokens (15 minutes) paired with secure HTTP-only refresh tokens.

---

## 15. Contributing & Code Standards

1. **Branching Strategy**: Create feature branches from `main` (`feature/feature-name` or `fix/issue-name`).
2. **TypeScript Integrity**: Maintain strict typing. Avoid `any` where structured interfaces exist.
3. **Commit Guidelines**: Use conventional commits (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`).
4. **Testing**: Run test suites before submitting pull requests:
   ```bash
   cd server
   npm run test
   ```

---

<div align="center">
  <p><strong>MediCore Healthcare Platforms Inc.</strong> • Healthcare Management, Connected.</p>
  <p>Emergency Hotline: +1 (800) 911-CORE • Technical Inquiries: support@medicore-health.com</p>
</div>

