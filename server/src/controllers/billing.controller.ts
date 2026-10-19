import { Request, Response, NextFunction } from 'express';
import { Invoice, Payment, Refund, Patient, Doctor, Hospital, Branch, Appointment } from '../models';
import { createInvoiceSchema, payInvoiceSchema } from '../schemas/billing.schema';
import { NotFoundError, ValidationError } from '../utils/errors';
import { logAudit } from '../utils/audit';
import { generateInvoicePdf } from '../utils/invoicePdfGenerator';

export const createInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user;
    const data = createInvoiceSchema.parse(req.body);

    const patient = await Patient.findById(data.patientId);
    if (!patient) {
      throw new NotFoundError('Patient record not found.');
    }

    const year = new Date().getFullYear();
    const count = await Invoice.countDocuments();
    const invoiceNumber = `INV-${year}-${(count + 1).toString().padStart(4, '0')}`;

    let subtotal = 0;
    const itemsData = data.items.map((item) => {
      const amount = item.quantity * item.unitPrice;
      subtotal += amount;
      return {
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount,
        itemType: item.itemType,
      };
    });

    const tax = data.tax || 0;
    const discount = data.discount || 0;
    const totalAmount = Math.max(0, subtotal + tax - discount);

    const invoice = await Invoice.create({
      invoiceNumber,
      patientId: data.patientId,
      doctorId: data.doctorId || undefined,
      appointmentId: data.appointmentId || undefined,
      hospitalId: data.hospitalId || patient.hospitalId || user?.hospitalId,
      branchId: data.branchId || patient.branchId || user?.branchId,
      items: itemsData,
      subtotal,
      tax,
      discount,
      total: totalAmount,
      status: 'UNPAID',
    });

    await logAudit({
      hospitalId: invoice.hospitalId ? String(invoice.hospitalId) : undefined,
      branchId: invoice.branchId ? String(invoice.branchId) : undefined,
      userId: user?.id,
      action: 'INVOICE_GENERATED',
      resource: 'invoices',
      details: `Generated invoice ${invoiceNumber} total ${totalAmount}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    const populated = await Invoice.findById(invoice._id)
      .populate('patientId', 'firstName lastName uhid phone')
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'firstName lastName' } });

    res.status(201).json({
      status: 'success',
      message: 'Invoice generated successfully.',
      data: {
        invoice: {
          ...invoice.toObject(),
          id: String(invoice._id),
          totalAmount: invoice.total,
          paymentStatus: invoice.status,
          items: invoice.items,
          payments: [],
          patient: populated?.patientId ? { ...populated.patientId, id: String((populated.patientId as any)._id) } : null,
          doctor: populated?.doctorId ? { ...populated.doctorId, id: String((populated.doctorId as any)._id) } : null,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getInvoices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user;
    const { patientId, branchId, hospitalId, paymentStatus, search } = req.query;

    const query: any = {};
    if (patientId) query.patientId = String(patientId);
    if (branchId) query.branchId = String(branchId);
    if (hospitalId) query.hospitalId = String(hospitalId);
    else if (user?.hospitalId && user?.role !== 'SUPER_ADMIN') {
      query.hospitalId = user.hospitalId;
    }

    if (paymentStatus && paymentStatus !== 'ALL') {
      if (paymentStatus === 'PENDING' || paymentStatus === 'UNPAID') {
        query.status = { $in: ['UNPAID', 'PENDING'] };
      } else {
        query.status = String(paymentStatus);
      }
    }

    if (search) {
      query.invoiceNumber = { $regex: String(search), $options: 'i' };
    }

    const rawInvoices = await Invoice.find(query)
      .populate('patientId', 'firstName lastName uhid phone')
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'firstName lastName' } })
      .sort({ createdAt: -1 })
      .lean();

    const invoiceIds = rawInvoices.map((i: any) => i._id);
    const payments = await Payment.find({ invoiceId: { $in: invoiceIds } }).lean();

    const invoices = rawInvoices.map((inv: any) => {
      const invPayments = payments.filter((p: any) => String(p.invoiceId) === String(inv._id));
      return {
        ...inv,
        id: String(inv._id),
        totalAmount: inv.total,
        paymentStatus: inv.status,
        patient: inv.patientId ? { ...inv.patientId, id: String(inv.patientId._id) } : null,
        doctor: inv.doctorId ? { ...inv.doctorId, id: String(inv.doctorId._id) } : null,
        payments: invPayments.map((p: any) => ({ ...p, id: String(p._id) })),
      };
    });

    res.status(200).json({
      status: 'success',
      data: { invoices },
    });
  } catch (err) {
    next(err);
  }
};

export const getInvoiceById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;

    const rawInvoice: any = await Invoice.findById(id)
      .populate('patientId')
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'firstName lastName' } })
      .populate('hospitalId')
      .populate('branchId')
      .populate('appointmentId', 'appointmentDate appointmentType')
      .lean();

    if (!rawInvoice) {
      throw new NotFoundError('Invoice not found.');
    }

    const payments = await Payment.find({ invoiceId: id }).lean();

    const invoice = {
      ...rawInvoice,
      id: String(rawInvoice._id),
      totalAmount: rawInvoice.total,
      paymentStatus: rawInvoice.status,
      patient: rawInvoice.patientId ? { ...rawInvoice.patientId, id: String(rawInvoice.patientId._id) } : null,
      doctor: rawInvoice.doctorId ? { ...rawInvoice.doctorId, id: String(rawInvoice.doctorId._id) } : null,
      appointment: rawInvoice.appointmentId ? { ...rawInvoice.appointmentId, id: String(rawInvoice.appointmentId._id) } : null,
      payments: payments.map((p: any) => ({ ...p, id: String(p._id) })),
    };

    res.status(200).json({
      status: 'success',
      data: { invoice },
    });
  } catch (err) {
    next(err);
  }
};

export const payInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user;
    const id = req.params.id as string;
    const body = payInvoiceSchema.parse(req.body);

    const invoice = await Invoice.findById(id);

    if (!invoice) {
      throw new NotFoundError('Invoice not found.');
    }

    if (invoice.status === 'PAID') {
      throw new ValidationError('Invoice is already paid.');
    }

    const payments = await Payment.find({ invoiceId: id, status: 'SUCCESS' });
    const previouslyPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const balanceDue = Math.max(0, invoice.total - previouslyPaid);

    const year = new Date().getFullYear();
    const count = await Payment.countDocuments();
    const paymentNumber = `PAY-${year}-${(count + 1).toString().padStart(4, '0')}`;

    const payment = await Payment.create({
      hospitalId: invoice.hospitalId,
      invoiceId: invoice._id,
      amount: balanceDue,
      method: body.paymentMethod,
      transactionId: paymentNumber,
      paymentDate: new Date(),
      status: 'SUCCESS',
    });

    invoice.status = 'PAID';
    await invoice.save();

    if (invoice.appointmentId) {
      await Appointment.findByIdAndUpdate(invoice.appointmentId, { status: 'CONFIRMED' });
    }

    await logAudit({
      hospitalId: invoice.hospitalId ? String(invoice.hospitalId) : undefined,
      branchId: invoice.branchId ? String(invoice.branchId) : undefined,
      userId: user?.id,
      action: 'INVOICE_PAID',
      resource: 'invoices',
      details: `Paid invoice ${invoice.invoiceNumber} via ${body.paymentMethod}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      status: 'success',
      message: `Invoice ${invoice.invoiceNumber} paid successfully.`,
      data: {
        invoice: {
          ...invoice.toObject(),
          id: String(invoice._id),
          totalAmount: invoice.total,
          paymentStatus: invoice.status,
          payments: [{ ...payment.toObject(), id: String(payment._id) }],
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const streamInvoicePdf = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user;
    const id = req.params.id as string;

    const rawInvoice: any = await Invoice.findById(id)
      .populate('patientId')
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'firstName lastName' } })
      .populate('hospitalId')
      .lean();

    if (!rawInvoice) {
      throw new NotFoundError('Invoice not found.');
    }

    if (user?.role === 'PATIENT') {
      const patient = await Patient.findOne({ userId: user.id });
      if (!patient || String(patient._id) !== String(rawInvoice.patientId?._id || rawInvoice.patientId)) {
        throw new NotFoundError('Invoice not found for this patient.');
      }
    }

    const payments = await Payment.find({ invoiceId: id, status: 'SUCCESS' }).lean();

    const totalPaid = payments.reduce((sum: number, p: any) => sum + p.amount, 0);
    const balanceDue = Math.max(0, rawInvoice.total - totalPaid);

    const pdfBuffer = await generateInvoicePdf({
      invoiceNumber: rawInvoice.invoiceNumber,
      createdAt: rawInvoice.createdAt,
      paidAt: rawInvoice.updatedAt,
      paymentStatus: rawInvoice.status === 'UNPAID' ? 'PENDING' : rawInvoice.status,
      paymentMethod: payments[0]?.method || 'CASH',
      subtotal: rawInvoice.subtotal,
      tax: rawInvoice.tax,
      discount: rawInvoice.discount,
      totalAmount: rawInvoice.total,
      totalPaid,
      balanceDue,
      patient: rawInvoice.patientId,
      doctor: rawInvoice.doctorId,
      hospital: rawInvoice.hospitalId,
      items: rawInvoice.items.map((i: any) => ({ ...i, totalPrice: i.amount })),
      payments: payments.map((p: any) => ({
        paymentNumber: p.transactionId || String(p._id),
        paymentMethod: p.method,
        gateway: 'MANUAL',
        gatewayPaymentId: p.transactionId,
        amount: p.amount,
        createdAt: p.createdAt,
        status: p.status,
      })),
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Invoice-${rawInvoice.invoiceNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
};

export const getAccountantDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user;
    const query: any = {};
    if (user?.hospitalId && user?.role !== 'SUPER_ADMIN') {
      query.hospitalId = user.hospitalId;
    }

    const [allInvoices, allPayments] = await Promise.all([
      Invoice.find(query).populate('patientId', 'firstName lastName uhid').sort({ createdAt: -1 }).lean(),
      Payment.find({ status: 'SUCCESS', ...(user?.hospitalId && user?.role !== 'SUPER_ADMIN' ? { hospitalId: user.hospitalId } : {}) }).lean(),
    ]);

    const totalRevenue = allPayments.reduce((acc: number, p: any) => acc + p.amount, 0);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayRevenue = allPayments
      .filter((p: any) => new Date(p.createdAt) >= startOfDay)
      .reduce((acc: number, p: any) => acc + p.amount, 0);

    let totalReceivables = 0;
    let pendingCount = 0;
    let partialCount = 0;
    let paidCount = 0;
    let refundedCount = 0;

    allInvoices.forEach((inv: any) => {
      const paid = allPayments
        .filter((p: any) => String(p.invoiceId) === String(inv._id))
        .reduce((sum: number, p: any) => sum + p.amount, 0);
      const balance = Math.max(0, inv.total - paid);

      if (inv.status === 'PAID') {
        paidCount++;
      } else if (inv.status === 'CANCELLED') {
        refundedCount++;
      } else if (inv.status === 'PARTIALLY_PAID') {
        partialCount++;
        totalReceivables += balance;
      } else {
        pendingCount++;
        totalReceivables += balance;
      }
    });

    const revenueByCategory: Record<string, number> = {
      CONSULTATION: 0,
      ROOM: 0,
      BED: 0,
      ICU: 0,
      PHARMACY: 0,
      LABORATORY: 0,
      RADIOLOGY: 0,
      PROCEDURES: 0,
      SURGERY: 0,
      EMERGENCY: 0,
      OTHER: 0,
    };

    allInvoices.forEach((inv: any) => {
      (inv.items || []).forEach((item: any) => {
        let cat = item.itemType || 'OTHER';
        if (cat === 'LAB_TEST') cat = 'LABORATORY';
        if (cat === 'MEDICINE') cat = 'PHARMACY';
        if (!revenueByCategory[cat]) revenueByCategory[cat] = 0;
        revenueByCategory[cat] += item.amount;
      });
    });

    const revenueByMethod: Record<string, number> = {};
    allPayments.forEach((p: any) => {
      const m = p.method || 'OTHER';
      if (!revenueByMethod[m]) revenueByMethod[m] = 0;
      revenueByMethod[m] += p.amount;
    });

    const formattedInvoices = allInvoices.map((inv: any) => ({
      ...inv,
      id: String(inv._id),
      totalAmount: inv.total,
      paymentStatus: inv.status,
      patient: inv.patientId ? { ...inv.patientId, id: String(inv.patientId._id) } : null,
    }));

    res.status(200).json({
      status: 'success',
      data: {
        summary: {
          totalRevenue,
          totalReceivables,
          todayRevenue,
          totalInvoices: allInvoices.length,
          pendingCount,
          partialCount,
          paidCount,
          refundedCount,
        },
        revenueByCategory,
        revenueByMethod,
        recentInvoices: formattedInvoices.slice(0, 10),
      },
    });
  } catch (err) {
    next(err);
  }
};
