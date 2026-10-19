/// <reference path="./types/express.d.ts" />
import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { env } from './config/env';
import { generalRateLimiter } from './middleware/rateLimiter';
import authRoutes from './routes/auth.routes';
import tenantRoutes from './routes/tenant.routes';
import hospitalRoutes from './routes/hospital.routes';
import branchRoutes from './routes/branch.routes';
import departmentRoutes from './routes/department.routes';
import staffRoutes from './routes/staff.routes';
import patientRoutes from './routes/patient.routes';
import appointmentRoutes from './routes/appointment.routes';
import opdQueueRoutes from './routes/opdQueue.routes';
import consultationRoutes from './routes/consultation.routes';
import prescriptionRoutes from './routes/prescription.routes';
import doctorRoutes from './routes/doctor.routes';
import vitalsRoutes from './routes/vitals.routes';
import labRoutes from './routes/lab.routes';
import labCatalogRoutes from './routes/labCatalog.routes';
import radiologyRoutes from './routes/radiology.routes';
import billingRoutes from './routes/billing.routes';
import paymentRoutes from './routes/payment.routes';
import insuranceRoutes from './routes/insurance.routes';
import emrRoutes from './routes/emr.routes';
import documentRoutes from './routes/document.routes';
import supplierRoutes from './routes/supplier.routes';
import medicineRoutes from './routes/medicine.routes';
import pharmacySaleRoutes from './routes/pharmacySale.routes';
import hospitalInventoryRoutes from './routes/hospitalInventory.routes';
import pharmacyDashboardRoutes from './routes/pharmacyDashboard.routes';
import bedRoutes from './routes/bed.routes';
import ipdRoutes from './routes/ipd.routes';
import icuRoutes from './routes/icu.routes';
import dischargeRoutes from './routes/discharge.routes';
import emergencyRoutes from './routes/emergency.routes';
import ambulanceRoutes from './routes/ambulance.routes';
import bloodBankRoutes from './routes/bloodBank.routes';
import aiRoutes from './routes/ai.routes';
import analyticsRoutes from './routes/analytics.routes';
import reportsRoutes from './routes/reports.routes';
import auditLogRoutes from './routes/auditLog.routes';
import { errorHandler } from './middleware/errorHandler';
import { NotFoundError } from './utils/errors';

const app: Application = express();

// Security Headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
        fontSrc: ["'self'", 'https:', 'data:'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        connectSrc: ["'self'", 'https:', 'http:', 'wss:', 'ws:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration supporting credentials (cookies)
const allowedOrigins = [
  env.CORS_ORIGIN,
  env.CLIENT_URL,
  process.env.RENDER_EXTERNAL_URL,
  'https://ai-powered-hospital.onrender.com',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      const isAllowed =
        allowedOrigins.includes(origin) ||
        origin.endsWith('.onrender.com') ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.netlify.app') ||
        process.env.NODE_ENV === 'test';

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Hospital-Id', 'X-Branch-Id'],
  })
);

// Cookie Parser
app.use(cookieParser(env.COOKIE_SECRET));

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// General Rate Limiting
if (process.env.NODE_ENV !== 'test') {
  app.use(generalRateLimiter);
}

// Health Check Endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/doctors', doctorRoutes);
app.use('/api/v1/hospitals', hospitalRoutes);
app.use('/api/v1/branches', branchRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/staff', staffRoutes);
app.use('/api/v1/patients', patientRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/opd-queue', opdQueueRoutes);
app.use('/api/v1/consultations', consultationRoutes);
app.use('/api/v1/prescriptions', prescriptionRoutes);
app.use('/api/v1/vitals', vitalsRoutes);
app.use('/api/v1/labs/catalog', labCatalogRoutes);
app.use('/api/v1/labs', labRoutes);
app.use('/api/v1/radiology', radiologyRoutes);
app.use('/api/v1/billing/payments', paymentRoutes);
app.use('/api/v1/billing/insurance', insuranceRoutes);
app.use('/api/v1/billing', billingRoutes);
app.use('/api/v1/emr', emrRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/pharmacy/dashboard', pharmacyDashboardRoutes);
app.use('/api/v1/pharmacy/medicines', medicineRoutes);
app.use('/api/v1/pharmacy/sales', pharmacySaleRoutes);
app.use('/api/v1/pharmacy/suppliers', supplierRoutes);
app.use('/api/v1/inventory', hospitalInventoryRoutes);
app.use('/api/v1/ipd/icu', icuRoutes);
app.use('/api/v1/ipd', dischargeRoutes);
app.use('/api/v1/ipd', ipdRoutes);
app.use('/api/v1/ipd', bedRoutes);
app.use('/api/v1/emergency', emergencyRoutes);
app.use('/api/v1/ambulance', ambulanceRoutes);
app.use('/api/v1/blood-bank', bloodBankRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/ai', aiRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/audit-logs', auditLogRoutes);
app.use('/api/v1', tenantRoutes);

// Candidate directories where client/dist might be located in development and production
const clientDistCandidates = [
  path.resolve(__dirname, '../../client/dist'),
  path.resolve(__dirname, '../client/dist'),
  path.resolve(process.cwd(), '../client/dist'),
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(process.cwd(), 'dist'),
];

const clientDistPath = clientDistCandidates.find(
  (candidate) => fs.existsSync(candidate) && fs.existsSync(path.join(candidate, 'index.html'))
);

if (clientDistPath) {
  // Serve static assets generated by Vite
  app.use(express.static(clientDistPath, { maxAge: '1d', index: false }));

  // SPA fallback for all non-API GET routes
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api') || req.path === '/health') {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// 404 Route Handler for unmatched API routes
app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(new NotFoundError('The requested endpoint was not found on this server.'));
});

// Global Error Handler
app.use(errorHandler);

export default app;
