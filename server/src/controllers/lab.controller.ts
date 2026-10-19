import { Request, Response, NextFunction } from 'express';
import { LabOrder, LabReport, LabTest, Patient, Doctor, User } from '../models';
import { collectSampleSchema, enterLabResultsSchema, verifyLabOrderSchema, createLabOrderSchema } from '../schemas/lab.schema';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors';
import { logAudit } from '../utils/audit';
import { generateLabReportPdf } from '../utils/labReportPdfGenerator';
import { Role } from '../types/roles';

export const createLabOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = createLabOrderSchema.parse(req.body);

    const patient = await Patient.findById(data.patientId);
    if (!patient) {
      throw new NotFoundError('Patient record not found.');
    }

    let doctorId = data.doctorId;
    if (!doctorId && req.user?.id) {
      const docProfile = await Doctor.findOne({ userId: req.user.id });
      if (docProfile) {
        doctorId = docProfile.id;
      }
    }

    if (!doctorId) {
      const fallbackDoc = await Doctor.findOne();
      if (fallbackDoc) {
        doctorId = fallbackDoc.id;
      } else {
        throw new ValidationError('A valid doctor profile is required to issue a lab order.');
      }
    }

    const orderNumber = `LAB-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const totalFee = data.items.reduce((acc, item) => acc + (item.price || 0), 0);

    // Look up or map test IDs
    const testIds: any[] = [];
    for (const item of data.items) {
      if (item.catalogId) {
        testIds.push(item.catalogId);
      } else {
        let test = await LabTest.findOne({ hospitalId: patient.hospitalId, code: item.testCode || `TEST-${Date.now()}` });
        if (!test) {
          test = await LabTest.create({
            hospitalId: patient.hospitalId,
            code: item.testCode || `TEST-${Date.now()}`,
            name: item.testName,
            category: 'GENERAL',
            price: item.price || 0,
          });
        }
        testIds.push(test._id);
      }
    }

    const labOrder = await LabOrder.create({
      orderNumber,
      hospitalId: patient.hospitalId,
      branchId: patient.branchId,
      patientId: patient._id,
      doctorId: doctorId,
      status: 'ORDERED',
      testId: testIds[0] || undefined,
      tests: testIds,
      notes: data.remarks || undefined,
    });

    const populatedOrder = await LabOrder.findById(labOrder._id)
      .populate('patientId', 'firstName lastName uhid mrn gender dateOfBirth')
      .populate('doctorId')
      .populate('tests')
      .populate('testId');

    await logAudit({
      hospitalId: patient.hospitalId?.toString(),
      branchId: patient.branchId?.toString(),
      userId: req.user?.id,
      action: 'LAB_ORDER_CREATED',
      resource: 'lab_orders',
      details: `Created Lab Order ${orderNumber} for Patient ${patient.patientId || patient._id}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      status: 'success',
      message: 'Lab order created successfully.',
      data: { labOrder: populatedOrder || labOrder },
    });
  } catch (err) {
    next(err);
  }
};

export const getLabOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { patientId, status, search } = req.query;

    const query: any = {};

    if (req.user?.hospitalId && req.user?.role !== Role.SUPER_ADMIN) {
      query.hospitalId = req.user.hospitalId;
    }

    // Patient Security Filter
    if (req.user?.role === Role.PATIENT) {
      const pat = await Patient.findOne({ userId: req.user.id });
      if (!pat) {
        res.status(200).json({ status: 'success', data: { labOrders: [] } });
        return;
      }
      query.patientId = pat._id;
    } else if (patientId) {
      query.patientId = patientId as string;
    }

    if (status) query.status = status as string;
    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      query.$or = [
        { orderNumber: searchRegex },
      ];
    }

    const labOrders = await LabOrder.find(query)
      .populate('patientId', 'firstName lastName uhid mrn gender dateOfBirth')
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'firstName lastName' } })
      .populate('testId')
      .populate('tests')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: { labOrders },
    });
  } catch (err) {
    next(err);
  }
};

export const getLabOrderById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const query: any = { _id: id };
    if (req.user?.hospitalId && req.user?.role !== Role.SUPER_ADMIN) {
      query.hospitalId = req.user.hospitalId;
    }

    const labOrder = await LabOrder.findOne(query)
      .populate('patientId')
      .populate({ path: 'doctorId', populate: { path: 'userId' } })
      .populate('testId')
      .populate('tests');

    if (!labOrder) {
      throw new NotFoundError('Lab order record not found.');
    }

    const patientObj = labOrder.patientId as any;

    // Security Check: Patient can only view their own lab order
    if (req.user?.role === Role.PATIENT && patientObj?.userId?.toString() !== req.user.id) {
      throw new ForbiddenError('You are not authorized to view this lab order.');
    }

    res.status(200).json({
      status: 'success',
      data: { labOrder },
    });
  } catch (err) {
    next(err);
  }
};

export const collectSample = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const body = collectSampleSchema.parse(req.body);

    const query: any = { _id: id };
    if (req.user?.hospitalId && req.user?.role !== Role.SUPER_ADMIN) {
      query.hospitalId = req.user.hospitalId;
    }

    const labOrder = await LabOrder.findOne(query);
    if (!labOrder) {
      throw new NotFoundError('Lab order not found.');
    }

    const year = new Date().getFullYear();
    const barcode = body.sampleBarcode || `BC-${year}-${Math.floor(100000 + Math.random() * 900000)}`;

    labOrder.status = 'SAMPLE_COLLECTED';
    if (body.remarks) {
      labOrder.notes = body.remarks;
    }
    await labOrder.save();

    const updated = await LabOrder.findById(id)
      .populate('patientId')
      .populate('testId')
      .populate('tests');

    await logAudit({
      userId: req.user?.id,
      action: 'LAB_SAMPLE_COLLECTED',
      resource: 'lab_orders',
      details: `Collected lab sample for Order ${labOrder.orderNumber} (Barcode: ${barcode})`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      status: 'success',
      message: 'Sample collected successfully.',
      data: { labOrder: updated },
    });
  } catch (err) {
    next(err);
  }
};

export const enterLabResults = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const body = enterLabResultsSchema.parse(req.body);

    const query: any = { _id: id };
    if (req.user?.hospitalId && req.user?.role !== Role.SUPER_ADMIN) {
      query.hospitalId = req.user.hospitalId;
    }

    const labOrder = await LabOrder.findOne(query).populate('testId tests');
    if (!labOrder) {
      throw new NotFoundError('Lab order not found.');
    }

    if (labOrder.status === 'VERIFIED') {
      throw new ValidationError('Verified lab report is locked. Use authorized correction workflow to amend.');
    }

    const reportResults: Record<string, any> = {};
    body.items.forEach((item) => {
      reportResults[item.itemId] = {
        resultValue: item.resultValue,
        unit: item.unit,
        referenceRange: item.referenceRange,
        flag: item.flag || 'NORMAL',
        technicianNotes: item.technicianNotes,
      };
    });

    await LabReport.findOneAndUpdate(
      { orderId: labOrder._id, hospitalId: labOrder.hospitalId },
      {
        hospitalId: labOrder.hospitalId,
        orderId: labOrder._id,
        patientId: labOrder.patientId,
        doctorId: labOrder.doctorId,
        labTestId: labOrder.testId,
        results: reportResults,
        summary: body.remarks || labOrder.notes,
        status: 'COMPLETED',
      },
      { upsert: true, new: true }
    );

    labOrder.status = 'COMPLETED';
    if (body.remarks) labOrder.notes = body.remarks;
    await labOrder.save();

    const updated = await LabOrder.findById(id)
      .populate('patientId')
      .populate({ path: 'doctorId', populate: { path: 'userId' } })
      .populate('testId')
      .populate('tests');

    await logAudit({
      userId: req.user?.id,
      action: 'LAB_RESULT_ENTERED',
      resource: 'lab_orders',
      details: `Entered results for Lab Order ${labOrder.orderNumber}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      status: 'success',
      message: 'Lab test results entered successfully.',
      data: { labOrder: updated },
    });
  } catch (err) {
    next(err);
  }
};

export const verifyLabOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const body = verifyLabOrderSchema.parse(req.body);

    const query: any = { _id: id };
    if (req.user?.hospitalId && req.user?.role !== Role.SUPER_ADMIN) {
      query.hospitalId = req.user.hospitalId;
    }

    const labOrder = await LabOrder.findOne(query);
    if (!labOrder) {
      throw new NotFoundError('Lab order not found.');
    }

    labOrder.status = 'VERIFIED';
    if (body.remarks) labOrder.notes = body.remarks;
    await labOrder.save();

    await LabReport.findOneAndUpdate(
      { orderId: labOrder._id, hospitalId: labOrder.hospitalId },
      {
        status: 'VERIFIED',
        verifiedBy: req.user?.id,
        verifiedAt: new Date(),
      }
    );

    const updated = await LabOrder.findById(id)
      .populate('patientId')
      .populate('testId')
      .populate('tests');

    await logAudit({
      userId: req.user?.id,
      action: 'LAB_REPORT_VERIFIED',
      resource: 'lab_orders',
      details: `Pathologist verified lab report for Order ${labOrder.orderNumber}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      status: 'success',
      message: 'Lab report verified and locked.',
      data: { labOrder: updated },
    });
  } catch (err) {
    next(err);
  }
};

export const generateLabOrderPdf = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const query: any = { _id: id };
    if (req.user?.hospitalId && req.user?.role !== Role.SUPER_ADMIN) {
      query.hospitalId = req.user.hospitalId;
    }

    const labOrder = await LabOrder.findOne(query)
      .populate('patientId')
      .populate({ path: 'doctorId', populate: { path: 'userId' } })
      .populate('testId')
      .populate('tests');

    if (!labOrder) {
      throw new NotFoundError('Lab order record not found.');
    }

    const patientObj = labOrder.patientId as any;
    const doctorObj = labOrder.doctorId as any;

    // Security Check: Patient can only download their own verified lab report
    if (req.user?.role === Role.PATIENT && patientObj?.userId?.toString() !== req.user.id) {
      throw new ForbiddenError('You are not authorized to access this lab report PDF.');
    }

    const labReport = await LabReport.findOne({ orderId: labOrder._id }).populate('verifiedBy', 'firstName lastName');

    const pdfBuffer = await generateLabReportPdf({
      orderNumber: labOrder.orderNumber,
      patient: {
        uhid: patientObj?.patientId || patientObj?.mrn || 'N/A',
        mrn: patientObj?.mrn,
        firstName: patientObj?.firstName || 'Patient',
        lastName: patientObj?.lastName || '',
        gender: patientObj?.gender || 'N/A',
        dateOfBirth: patientObj?.dateOfBirth || new Date(),
        bloodGroup: patientObj?.bloodGroup,
      },
      doctor: doctorObj ? {
        user: doctorObj.userId ? {
          firstName: doctorObj.userId.firstName,
          lastName: doctorObj.userId.lastName,
        } : null,
        registrationNumber: doctorObj.registrationNumber,
        specialization: doctorObj.specialization,
      } : null,
      hospital: { name: 'Hospital Network' },
      verifiedAt: labReport?.verifiedAt,
      verifiedBy: labReport?.verifiedBy as any,
      remarks: labOrder.notes,
      status: labOrder.status,
      items: (labOrder.tests || []).map((test: any) => ({
        testName: test?.name || 'Lab Test',
        testCode: test?.code || 'TEST',
        resultValue: labReport?.results?.[test?._id?.toString()]?.resultValue || 'N/A',
        unit: test?.unit || '',
        referenceRange: test?.referenceRange || '',
        flag: labReport?.results?.[test?._id?.toString()]?.flag || 'NORMAL',
      })),
    });

    await logAudit({
      userId: req.user?.id,
      action: 'LAB_PDF_GENERATED',
      resource: 'lab_orders',
      details: `Generated lab report PDF for Order ${labOrder.orderNumber}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="lab-report-${labOrder.orderNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
};
