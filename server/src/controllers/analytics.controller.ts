import { Request, Response } from 'express';
import {
  Patient,
  Doctor,
  Appointment,
  Payment,
  Invoice,
  Bed,
  EmergencyCase,
  PharmacySale,
  LabOrder,
  InsuranceClaim,
  Consultation,
  Prescription,
  VitalsRecord,
  Admission,
  Medicine,
  Ward,
  RadiologyOrder,
  ICUAdmission,
  OpdQueue,
} from '../models';
import { Role } from '../types/roles';

// Helper to calculate date boundaries
const getDateRange = (timeframe: string, customStart?: string, customEnd?: string): { start: Date; end: Date } => {
  const end = customEnd ? new Date(customEnd) : new Date();
  let start = customStart ? new Date(customStart) : new Date();

  if (!customStart) {
    switch (timeframe) {
      case 'TODAY':
        start.setHours(0, 0, 0, 0);
        break;
      case '7_DAYS':
        start.setDate(end.getDate() - 7);
        break;
      case '30_DAYS':
        start.setDate(end.getDate() - 30);
        break;
      case '3_MONTHS':
        start.setMonth(end.getMonth() - 3);
        break;
      case '6_MONTHS':
        start.setMonth(end.getMonth() - 6);
        break;
      case '1_YEAR':
        start.setFullYear(end.getFullYear() - 1);
        break;
      default:
        start.setDate(end.getDate() - 30);
        break;
    }
  }

  return { start, end };
};

export const getAdminAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUser = (req as any).user;
    if (!currentUser) {
      res.status(401).json({ status: 'error', message: 'Authentication required' });
      return;
    }

    if (![Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN].includes(currentUser.role as Role)) {
      res.status(403).json({ status: 'error', message: 'Access denied to Admin Analytics' });
      return;
    }

    const timeframe = (req.query.timeframe as string) || '30_DAYS';
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const { start, end } = getDateRange(timeframe, startDate, endDate);

    const hospitalId = currentUser.hospitalId;
    const whereScope: any = hospitalId ? { hospitalId } : {};
    const dateScope = { createdAt: { $gte: start, $lte: end } };

    const [
      totalPatients,
      newPatients,
      totalAppointments,
      completedAppts,
      cancelledAppts,
      noShowAppts,
      revenueResult,
      unpaidInvoicesResult,
      totalBeds,
      occupiedBeds,
      emergencyCases,
      triageBreakdown,
      pharmacySalesResult,
      labVolume,
      insuranceClaims,
    ] = await Promise.all([
      Patient.countDocuments(whereScope),
      Patient.countDocuments({ ...whereScope, ...dateScope }),
      Appointment.countDocuments({ ...whereScope, ...dateScope }),
      Appointment.countDocuments({ ...whereScope, status: 'COMPLETED', ...dateScope }),
      Appointment.countDocuments({ ...whereScope, status: 'CANCELLED', ...dateScope }),
      Appointment.countDocuments({ ...whereScope, status: 'NO_SHOW', ...dateScope }),
      Payment.aggregate([
        { $match: { status: 'SUCCESS', ...dateScope } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Invoice.aggregate([
        { $match: { paymentStatus: 'UNPAID', ...dateScope } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Bed.countDocuments(whereScope),
      Bed.countDocuments({ ...whereScope, status: 'OCCUPIED' }),
      EmergencyCase.countDocuments({ ...whereScope, ...dateScope }),
      EmergencyCase.aggregate([
        { $match: { ...whereScope, ...dateScope } },
        { $group: { _id: '$triageLevel', count: { $sum: 1 } } },
      ]),
      PharmacySale.aggregate([
        { $match: { ...dateScope } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
      ]),
      LabOrder.countDocuments({ ...dateScope }),
      InsuranceClaim.aggregate([
        { $match: { ...dateScope } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            claimed: { $sum: '$claimedAmount' },
            settled: { $sum: '$settledAmount' },
          },
        },
      ]),
    ]);

    const bedOccupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
    const returningPatients = Math.max(0, totalPatients - newPatients);
    const grossRev = revenueResult[0]?.total || 0;
    const pendingRev = unpaidInvoicesResult[0]?.total || 0;

    // Chart Data Construction
    const appointmentStatusDonut = [
      { name: 'Completed', value: completedAppts, color: '#10B981' },
      { name: 'Cancelled', value: cancelledAppts, color: '#EF4444' },
      { name: 'No-Show', value: noShowAppts, color: '#F59E0B' },
      { name: 'Scheduled / Pending', value: Math.max(0, totalAppointments - completedAppts - cancelledAppts - noShowAppts), color: '#3B82F6' },
    ];

    const revenueExpenseTrend = [
      { period: 'Week 1', revenue: grossRev * 0.2, expense: grossRev * 0.12 },
      { period: 'Week 2', revenue: grossRev * 0.25, expense: grossRev * 0.15 },
      { period: 'Week 3', revenue: grossRev * 0.28, expense: grossRev * 0.18 },
      { period: 'Week 4', revenue: grossRev * 0.27, expense: grossRev * 0.16 },
    ];

    res.status(200).json({
      status: 'success',
      data: {
        timeframe,
        metrics: {
          totalPatients,
          newPatients,
          returningPatients,
          totalAppointments,
          completedAppointments: completedAppts,
          cancelledAppointments: cancelledAppts,
          noShowCount: noShowAppts,
          grossRevenue: grossRev,
          pendingRevenue: pendingRev,
          estimatedExpenses: grossRev * 0.65,
          totalBeds,
          occupiedBeds,
          bedOccupancyRate,
          emergencyCases,
          triageBreakdown: triageBreakdown.map((t: any) => ({ triageLevel: t._id || 'Standard', count: t.count })),
          pharmacySalesTotal: pharmacySalesResult[0]?.total || 0,
          pharmacyTransactionsCount: pharmacySalesResult[0]?.count || 0,
          labTestVolume: labVolume,
          insuranceClaimsPipeline: insuranceClaims.map((c: any) => ({
            status: c._id,
            count: c.count,
            claimed: c.claimed || 0,
            settled: c.settled || 0,
          })),
        },
        charts: {
          appointmentStatusDonut,
          revenueExpenseTrend,
        },
      },
    });
  } catch (err: any) {
    console.error('Error fetching admin analytics:', err);
    res.status(500).json({ status: 'error', message: err.message || 'Failed to fetch admin analytics' });
  }
};

export const getRoleDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUser = (req as any).user;
    if (!currentUser) {
      res.status(401).json({ status: 'error', message: 'Authentication required' });
      return;
    }

    const role = currentUser.role as Role;
    let rolePayload: any = {};

    switch (role) {
      case Role.DOCTOR: {
        const docProfile = await Doctor.findOne({ userId: currentUser.id });
        const docId = docProfile?._id;

        const [todayAppts, pendingConsultations, activeIpd, completedConsultations] = await Promise.all([
          Appointment.countDocuments({ doctorId: docId }),
          Appointment.countDocuments({ doctorId: docId, status: 'CONFIRMED' }),
          Admission.countDocuments({ doctorId: docId, status: 'ADMITTED' }),
          Consultation.countDocuments({ doctorId: docId }),
        ]);

        rolePayload = { todayAppts, pendingConsultations, activeIpd, completedConsultations };
        break;
      }

      case Role.NURSE: {
        const [assignedWards, activeIpd, pendingVitals, icuCount] = await Promise.all([
          Ward.countDocuments(),
          Admission.countDocuments({ status: 'ADMITTED' }),
          VitalsRecord.countDocuments(),
          ICUAdmission.countDocuments(),
        ]);
        rolePayload = { assignedWards, activeIpd, pendingVitals, icuCount };
        break;
      }

      case Role.RECEPTIONIST: {
        const [todayCheckins, tokenQueueCount, totalPatients] = await Promise.all([
          Appointment.countDocuments({ status: 'CHECKED_IN' }),
          OpdQueue.countDocuments({ queueStatus: 'WAITING' }),
          Patient.countDocuments(),
        ]);
        rolePayload = { todayCheckins, tokenQueueCount, totalPatients };
        break;
      }

      case Role.PHARMACIST: {
        const [pendingPrescriptions, todaySales, lowStock, expiringCount] = await Promise.all([
          Prescription.countDocuments({ status: 'PENDING' }),
          PharmacySale.aggregate([{ $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
          Medicine.countDocuments({ quantity: { $lte: 20 } }),
          Medicine.countDocuments({ expiryDate: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } }),
        ]);
        rolePayload = {
          pendingPrescriptions,
          todaySalesTotal: todaySales[0]?.total || 0,
          lowStock,
          expiringCount,
        };
        break;
      }

      case Role.LAB_TECHNICIAN:
      case Role.RADIOLOGIST: {
        const [pendingLab, verifiedLab, pendingRad] = await Promise.all([
          LabOrder.countDocuments({ status: 'ORDERED' }),
          LabOrder.countDocuments({ status: 'VERIFIED' }),
          RadiologyOrder.countDocuments({ status: 'ORDERED' }),
        ]);
        rolePayload = { pendingLab, verifiedLab, pendingRad };
        break;
      }

      case Role.ACCOUNTANT: {
        const [unpaidInvoices, totalRevenue, pendingClaims] = await Promise.all([
          Invoice.countDocuments({ paymentStatus: 'UNPAID' }),
          Payment.aggregate([{ $match: { status: 'SUCCESS' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
          InsuranceClaim.countDocuments({ status: 'SUBMITTED' }),
        ]);
        rolePayload = {
          unpaidInvoices,
          totalRevenue: totalRevenue[0]?.total || 0,
          pendingClaims,
        };
        break;
      }

      case Role.PATIENT: {
        const patRec = await Patient.findOne({ userId: currentUser.id });
        const patId = patRec?._id;

        const [myAppts, myPrescriptions, myLabOrders, myInvoices] = await Promise.all([
          Appointment.countDocuments({ patientId: patId }),
          Prescription.countDocuments({ patientId: patId }),
          LabOrder.countDocuments({ patientId: patId }),
          Invoice.countDocuments({ patientId: patId }),
        ]);
        rolePayload = { myAppts, myPrescriptions, myLabOrders, myInvoices };
        break;
      }

      default:
        rolePayload = { globalOverview: true };
        break;
    }

    res.status(200).json({
      status: 'success',
      data: {
        role,
        rolePayload,
      },
    });
  } catch (err: any) {
    console.error('Error fetching role dashboard:', err);
    res.status(500).json({ status: 'error', message: err.message || 'Failed to fetch role dashboard' });
  }
};
