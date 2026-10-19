import { Request, Response } from 'express';
import {
  Patient,
  Doctor,
  Appointment,
  Payment,
  Medicine,
  LabOrder,
  Bed,
  EmergencyCase,
  BloodUnit,
  InsuranceClaim,
  User,
} from '../models';
import { generateExecutiveReportPdf, ReportPdfInput } from '../utils/reportPdfGenerator';
import { reportQuerySchema } from '../schemas/analytics.schema';
import { Role } from '../types/roles';

// Helper to convert Headers & Rows to CSV string
const convertToCsv = (headers: string[], rows: string[][]): string => {
  const escapeCell = (cell: string) => `"${String(cell || '').replace(/"/g, '""')}"`;
  const headerLine = headers.map(escapeCell).join(',');
  const rowLines = rows.map((r) => r.map(escapeCell).join(','));
  return [headerLine, ...rowLines].join('\n');
};

export const generateReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = reportQuerySchema.safeParse(req.query);
    if (!parse.success) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid report query parameters',
        errors: parse.error.format(),
      });
      return;
    }

    const currentUser = (req as any).user;
    if (!currentUser) {
      res.status(401).json({ status: 'error', message: 'Authentication required' });
      return;
    }

    const { module, timeframe, format } = parse.data;

    // RBAC Security Check: Regular Patients cannot download Revenue, Staff, or Emergency reports
    if (currentUser.role === Role.PATIENT && ['REVENUE', 'STAFF', 'EMERGENCY', 'BLOOD_BANK'].includes(module)) {
      res.status(403).json({ status: 'error', message: 'Access denied to restricted executive report' });
      return;
    }

    let reportTitle = `${module} Operational Report`;
    let headers: string[] = [];
    let rows: string[][] = [];
    let kpiSummary: Array<{ label: string; value: string }> = [];

    switch (module) {
      case 'PATIENTS': {
        reportTitle = 'Patient Population & Registration Report';
        headers = ['UHID', 'Patient Name', 'Gender', 'Phone', 'Blood Group', 'Registered Date'];
        const patients = await Patient.find().sort({ createdAt: -1 }).limit(100).lean();
        kpiSummary = [
          { label: 'Total Patients', value: String(patients.length) },
          { label: 'Female Patients', value: String(patients.filter((p: any) => p.gender === 'FEMALE').length) },
          { label: 'Male Patients', value: String(patients.filter((p: any) => p.gender === 'MALE').length) },
        ];
        rows = patients.map((p: any) => [
          p.uhid,
          `${p.firstName} ${p.lastName}`,
          p.gender,
          p.phone,
          p.bloodGroup || 'N/A',
          p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : 'N/A',
        ]);
        break;
      }

      case 'DOCTORS': {
        reportTitle = 'Medical Staff & Doctor Roster Report';
        headers = ['Doctor Name', 'Specialization', 'License #', 'Consultation Fee', 'Status'];
        const doctors = await Doctor.find().limit(100).populate('userId').lean();
        kpiSummary = [{ label: 'Total Doctors', value: String(doctors.length) }];
        rows = doctors.map((d: any) => [
          d.userId ? `Dr. ${d.userId.firstName} ${d.userId.lastName}` : 'N/A',
          d.specialization,
          d.licenseNumber || 'N/A',
          `$${(d.consultationFee || 0).toFixed(2)}`,
          d.userId?.isActive ? 'ACTIVE' : 'INACTIVE',
        ]);
        break;
      }

      case 'APPOINTMENTS': {
        reportTitle = 'OPD Appointments & Token Utilization Report';
        headers = ['Appt #', 'Patient', 'Doctor', 'Date', 'Type', 'Status'];
        const appts = await Appointment.find()
          .sort({ appointmentDate: -1 })
          .limit(100)
          .populate('patientId')
          .populate({ path: 'doctorId', populate: { path: 'userId' } })
          .lean();
        const completed = appts.filter((a: any) => a.status === 'COMPLETED').length;
        kpiSummary = [
          { label: 'Total Appts', value: String(appts.length) },
          { label: 'Completed', value: String(completed) },
          { label: 'Completion Rate', value: `${appts.length > 0 ? Math.round((completed / appts.length) * 100) : 0}%` },
        ];
        rows = appts.map((a: any) => [
          a._id.toString().slice(-8),
          a.patientId ? `${a.patientId.firstName} ${a.patientId.lastName}` : 'N/A',
          a.doctorId?.userId ? `Dr. ${a.doctorId.userId.lastName}` : 'N/A',
          a.appointmentDate ? new Date(a.appointmentDate).toISOString().split('T')[0] : 'N/A',
          a.type || 'IN_PERSON',
          a.status,
        ]);
        break;
      }

      case 'REVENUE': {
        reportTitle = 'Hospital Revenue & Payment Collection Report';
        headers = ['Txn ID', 'Amount', 'Payment Method', 'Status', 'Date'];
        const payments = await Payment.find().sort({ createdAt: -1 }).limit(100).populate('invoiceId').lean();
        const totalAmount = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
        kpiSummary = [
          { label: 'Total Collected', value: `$${totalAmount.toFixed(2)}` },
          { label: 'Successful Txns', value: String(payments.filter((p: any) => p.status === 'SUCCESS').length) },
        ];
        rows = payments.map((p: any) => [
          p.transactionId || p._id.toString().slice(-8),
          `$${(p.amount || 0).toFixed(2)}`,
          p.paymentMethod,
          p.status,
          p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : 'N/A',
        ]);
        break;
      }

      case 'PHARMACY': {
        reportTitle = 'Pharmacy Medicine Inventory & Sales Report';
        headers = ['Medicine Name', 'Brand', 'Batch', 'Quantity', 'Purchase Price', 'Selling Price'];
        const meds = await Medicine.find().limit(100).lean();
        const lowStock = meds.filter((m: any) => (m.quantity || 0) <= 20).length;
        kpiSummary = [
          { label: 'Total Medicines', value: String(meds.length) },
          { label: 'Low Stock Items', value: String(lowStock) },
        ];
        rows = meds.map((m: any) => [
          m.name,
          m.brandName || m.brand || 'Generic',
          m.batchNumber || 'N/A',
          String(m.quantity || 0),
          `$${(m.unitPrice || 0).toFixed(2)}`,
          `$${(m.unitPrice ? m.unitPrice * 1.2 : 0).toFixed(2)}`,
        ]);
        break;
      }

      case 'LABS': {
        reportTitle = 'Laboratory Test Orders Report';
        headers = ['Order #', 'Patient', 'Status', 'Date'];
        const labs = await LabOrder.find().sort({ createdAt: -1 }).limit(100).populate('patientId').lean();
        kpiSummary = [
          { label: 'Total Lab Orders', value: String(labs.length) },
          { label: 'Verified Reports', value: String(labs.filter((l: any) => l.status === 'VERIFIED' || l.status === 'COMPLETED').length) },
        ];
        rows = labs.map((l: any) => [
          l.orderNumber,
          l.patientId ? `${l.patientId.firstName} ${l.patientId.lastName}` : 'N/A',
          l.status,
          l.createdAt ? new Date(l.createdAt).toISOString().split('T')[0] : 'N/A',
        ]);
        break;
      }

      case 'BEDS': {
        reportTitle = 'Inpatient Bed Occupancy & Ward Report';
        headers = ['Bed #', 'Ward', 'Type', 'Status'];
        const beds = await Bed.find().limit(100).populate('wardId').lean();
        const occupied = beds.filter((b: any) => b.status === 'OCCUPIED').length;
        kpiSummary = [
          { label: 'Total Beds', value: String(beds.length) },
          { label: 'Occupied Beds', value: String(occupied) },
          { label: 'Occupancy Rate', value: `${beds.length > 0 ? Math.round((occupied / beds.length) * 100) : 0}%` },
        ];
        rows = beds.map((b: any) => [
          b.bedNumber,
          b.wardId?.name || 'General Ward',
          b.type || 'Standard',
          b.status,
        ]);
        break;
      }

      case 'EMERGENCY': {
        reportTitle = 'Emergency ER Visit & Triage Report';
        headers = ['Case #', 'Patient', 'Triage Level', 'Status', 'Arrival Time'];
        const visits = await EmergencyCase.find().sort({ arrivalTime: -1 }).limit(100).populate('patientId').lean();
        const critical = visits.filter((v: any) => v.triageLevel === 'CRITICAL' || v.triageLevel === 'RESUSCITATION').length;
        kpiSummary = [
          { label: 'Emergency Visits', value: String(visits.length) },
          { label: 'Critical Cases', value: String(critical) },
        ];
        rows = visits.map((v: any) => [
          v.caseNumber || v._id.toString().slice(-8),
          v.patientId ? `${v.patientId.firstName} ${v.patientId.lastName}` : 'Unknown Patient',
          v.triageLevel,
          v.status,
          v.arrivalTime ? new Date(v.arrivalTime).toISOString().replace('T', ' ').slice(0, 16) : 'N/A',
        ]);
        break;
      }

      case 'BLOOD_BANK': {
        reportTitle = 'Blood Bank Inventory & Donor Unit Report';
        headers = ['Unit #', 'Blood Group', 'Component', 'Units (mL)', 'Status', 'Expiry Date'];
        const units = await BloodUnit.find().sort({ expiryDate: 1 }).limit(100).lean();
        kpiSummary = [
          { label: 'Available Units', value: String(units.filter((u: any) => u.status === 'AVAILABLE').length) },
          { label: 'Reserved Units', value: String(units.filter((u: any) => u.status === 'RESERVED').length) },
        ];
        rows = units.map((u: any) => [
          u.unitNumber,
          u.bloodGroup,
          u.componentType,
          `${u.volume || 450} mL`,
          u.status,
          u.expiryDate ? new Date(u.expiryDate).toISOString().split('T')[0] : 'N/A',
        ]);
        break;
      }

      case 'INSURANCE': {
        reportTitle = 'Health Insurance Claims Adjudication Report';
        headers = ['Claim #', 'Patient', 'Claimed ($)', 'Settled ($)', 'Status'];
        const claims = await InsuranceClaim.find().sort({ createdAt: -1 }).limit(100).populate('patientId').lean();
        const totalClaimed = claims.reduce((s: number, c: any) => s + (c.claimAmount || c.claimedAmount || 0), 0);
        const totalSettled = claims.reduce((s: number, c: any) => s + (c.approvedAmount || c.settledAmount || 0), 0);
        kpiSummary = [
          { label: 'Total Claims', value: String(claims.length) },
          { label: 'Total Claimed', value: `$${totalClaimed.toFixed(2)}` },
          { label: 'Total Settled', value: `$${totalSettled.toFixed(2)}` },
        ];
        rows = claims.map((c: any) => [
          c.claimNumber,
          c.patientId ? `${c.patientId.firstName} ${c.patientId.lastName}` : 'N/A',
          `$${(c.claimAmount || c.claimedAmount || 0).toFixed(2)}`,
          `$${(c.approvedAmount || c.settledAmount || 0).toFixed(2)}`,
          c.status,
        ]);
        break;
      }

      case 'STAFF': {
        reportTitle = 'Hospital Staff Directory Report';
        headers = ['Staff ID', 'Name', 'Role', 'Email', 'Status', 'Joined Date'];
        const staff = await User.find().sort({ createdAt: -1 }).limit(100).lean();
        kpiSummary = [{ label: 'Total Staff Users', value: String(staff.length) }];
        rows = staff.map((s: any) => [
          s._id.toString().slice(-8),
          `${s.firstName} ${s.lastName}`,
          s.role,
          s.email,
          s.isActive ? 'ACTIVE' : 'INACTIVE',
          s.createdAt ? new Date(s.createdAt).toISOString().split('T')[0] : 'N/A',
        ]);
        break;
      }
    }

    // Format Response
    if (format === 'csv') {
      const csvData = convertToCsv(headers, rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${module.toLowerCase()}_report_${Date.now()}.csv"`);
      res.status(200).send(csvData);
      return;
    }

    if (format === 'pdf') {
      const pdfBuffer = await generateExecutiveReportPdf({
        reportTitle,
        moduleName: module,
        timeframeLabel: timeframe || 'Last 30 Days',
        generatedAt: new Date().toLocaleDateString(),
        kpiSummary,
        headers,
        rows,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${module.toLowerCase()}_report_${Date.now()}.pdf"`);
      res.status(200).send(pdfBuffer);
      return;
    }

    // JSON format default
    res.status(200).json({
      status: 'success',
      data: {
        reportTitle,
        module,
        timeframe,
        kpiSummary,
        headers,
        rows,
      },
    });
  } catch (err: any) {
    console.error('Error generating report:', err);
    res.status(500).json({ status: 'error', message: err.message || 'Failed to generate report' });
  }
};
