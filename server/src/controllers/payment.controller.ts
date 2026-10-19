import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';
import { Payment, Invoice, Appointment, Patient, Refund } from '../models';
import {
  initiatePaymentSchema,
  verifyPaymentSchema,
  recordManualPaymentSchema,
  refundPaymentSchema,
} from '../schemas/payment.schema';
import { NotFoundError, ValidationError } from '../utils/errors';
import { logAudit } from '../utils/audit';

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret_key_secure_12345';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_secret_key_secure_12345';

export const initiatePayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = initiatePaymentSchema.parse(req.body);

    const invoice = await Invoice.findById(data.invoiceId);

    if (!invoice) {
      throw new NotFoundError('Invoice not found.');
    }

    if (invoice.status === 'PAID') {
      throw new ValidationError('Invoice is already fully settled.');
    }

    const payments = await Payment.find({ invoiceId: invoice._id, status: 'SUCCESS' });
    const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
    const balanceDue = Math.max(0, invoice.total - totalPaid);

    const payableAmount = data.amount && data.amount > 0 ? Math.min(data.amount, balanceDue) : balanceDue;

    if (payableAmount <= 0) {
      throw new ValidationError('Invoice has zero balance due.');
    }

    const timestamp = Date.now();
    const randomHex = crypto.randomBytes(4).toString('hex');
    let gatewayOrderId = '';

    if (data.gateway === 'RAZORPAY') {
      gatewayOrderId = `order_rzp_${timestamp}_${randomHex}`;
    } else {
      gatewayOrderId = `cs_test_${timestamp}_${randomHex}`;
    }

    res.status(200).json({
      status: 'success',
      message: `${data.gateway} payment session initiated successfully.`,
      data: {
        invoiceId: String(invoice._id),
        invoiceNumber: invoice.invoiceNumber,
        gateway: data.gateway,
        gatewayOrderId,
        amount: payableAmount,
        currency: 'USD',
        keyId: data.gateway === 'RAZORPAY' ? 'rzp_test_key_pub_12345' : 'pk_test_key_pub_12345',
      },
    });
  } catch (err) {
    next(err);
  }
};

export const verifyPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user;
    const data = verifyPaymentSchema.parse(req.body);

    const invoice = await Invoice.findById(data.invoiceId);

    if (!invoice) {
      throw new NotFoundError('Invoice not found.');
    }

    // 1. Cryptographic Signature Verification
    let isSignatureValid = false;
    const secret = data.gateway === 'RAZORPAY' ? RAZORPAY_KEY_SECRET : STRIPE_SECRET_KEY;
    const payload = `${data.gatewayOrderId}|${data.gatewayPaymentId}`;
    const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    if (data.gatewaySignature === expectedSignature) {
      isSignatureValid = true;
    }

    if (!isSignatureValid) {
      await Payment.create({
        hospitalId: invoice.hospitalId,
        invoiceId: invoice._id,
        amount: 0,
        method: data.gateway,
        transactionId: data.gatewayPaymentId || `PAY-FAIL-${Date.now()}`,
        paymentDate: new Date(),
        status: 'FAILED',
      });

      await logAudit({
        hospitalId: invoice.hospitalId ? String(invoice.hospitalId) : undefined,
        branchId: invoice.branchId ? String(invoice.branchId) : undefined,
        userId: user?.id,
        action: 'PAYMENT_TAMPER_DETECTED',
        resource: 'payments',
        details: `Cryptographic signature mismatch for ${data.gateway} order ${data.gatewayOrderId}`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      throw new ValidationError('Payment signature verification failed. Untrusted frontend payload.');
    }

    // 2. Anti-Fraud / Duplicate Payment Prevention
    const existingSuccessfulPayment = await Payment.findOne({
      transactionId: data.gatewayPaymentId,
      status: 'SUCCESS',
    });

    if (existingSuccessfulPayment) {
      throw new ValidationError('Duplicate payment detected. This transaction ID has already been recorded.');
    }

    if (invoice.status === 'PAID') {
      throw new ValidationError('Invoice is already fully settled. Overpayment rejected.');
    }

    const previousPayments = await Payment.find({ invoiceId: invoice._id, status: 'SUCCESS' });
    const previouslyPaid = previousPayments.reduce((sum, p) => sum + p.amount, 0);
    const balanceDue = Math.max(0, invoice.total - previouslyPaid);

    const year = new Date().getFullYear();
    const count = await Payment.countDocuments();
    const paymentNumber = `PAY-${year}-${(count + 1).toString().padStart(4, '0')}`;

    const paymentAmount = balanceDue;

    const payment = await Payment.create({
      hospitalId: invoice.hospitalId,
      invoiceId: invoice._id,
      amount: paymentAmount,
      method: data.gateway,
      transactionId: data.gatewayPaymentId || paymentNumber,
      paymentDate: new Date(),
      status: 'SUCCESS',
    });

    const newTotalPaid = previouslyPaid + paymentAmount;
    let newPaymentStatus = 'PARTIALLY_PAID';
    if (newTotalPaid >= invoice.total) {
      newPaymentStatus = 'PAID';
    }

    invoice.status = newPaymentStatus as any;
    await invoice.save();

    if (invoice.appointmentId && newPaymentStatus === 'PAID') {
      await Appointment.findByIdAndUpdate(invoice.appointmentId, { status: 'CONFIRMED' });
    }

    await logAudit({
      hospitalId: invoice.hospitalId ? String(invoice.hospitalId) : undefined,
      branchId: invoice.branchId ? String(invoice.branchId) : undefined,
      userId: user?.id,
      action: 'PAYMENT_VERIFIED_SUCCESS',
      resource: 'payments',
      details: `Verified ${data.gateway} payment ${paymentNumber} for invoice ${invoice.invoiceNumber} amount ${paymentAmount}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      status: 'success',
      message: `Payment verified and recorded successfully via ${data.gateway}.`,
      data: {
        payment: {
          ...payment.toObject(),
          id: String(payment._id),
          paymentNumber,
          gateway: data.gateway,
          gatewayOrderId: data.gatewayOrderId,
          gatewayPaymentId: data.gatewayPaymentId,
        },
        invoice: {
          ...invoice.toObject(),
          id: String(invoice._id),
          totalAmount: invoice.total,
          paymentStatus: invoice.status,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const recordManualPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user;
    const data = recordManualPaymentSchema.parse(req.body);

    const invoice = await Invoice.findById(data.invoiceId);

    if (!invoice) {
      throw new NotFoundError('Invoice not found.');
    }

    const previousPayments = await Payment.find({ invoiceId: invoice._id, status: 'SUCCESS' });
    const previouslyPaid = previousPayments.reduce((sum, p) => sum + p.amount, 0);
    const balanceDue = Math.max(0, invoice.total - previouslyPaid);

    if (balanceDue <= 0) {
      throw new ValidationError('Invoice is already fully paid.');
    }

    if (data.amount > balanceDue) {
      throw new ValidationError(`Payment amount (${data.amount}) exceeds outstanding balance (${balanceDue}).`);
    }

    const year = new Date().getFullYear();
    const count = await Payment.countDocuments();
    const paymentNumber = `PAY-${year}-${(count + 1).toString().padStart(4, '0')}`;

    const payment = await Payment.create({
      hospitalId: invoice.hospitalId,
      invoiceId: invoice._id,
      amount: data.amount,
      method: data.paymentMethod,
      transactionId: data.referenceNumber || `REF-${Date.now()}`,
      paymentDate: new Date(),
      status: 'SUCCESS',
    });

    const newTotalPaid = previouslyPaid + data.amount;
    const newPaymentStatus = newTotalPaid >= invoice.total ? 'PAID' : 'PARTIALLY_PAID';

    invoice.status = newPaymentStatus as any;
    await invoice.save();

    if (invoice.appointmentId && newPaymentStatus === 'PAID') {
      await Appointment.findByIdAndUpdate(invoice.appointmentId, { status: 'CONFIRMED' });
    }

    await logAudit({
      hospitalId: invoice.hospitalId ? String(invoice.hospitalId) : undefined,
      branchId: invoice.branchId ? String(invoice.branchId) : undefined,
      userId: user?.id,
      action: 'MANUAL_PAYMENT_RECORDED',
      resource: 'payments',
      details: `Recorded manual payment ${paymentNumber} of ${data.amount} via ${data.paymentMethod} on invoice ${invoice.invoiceNumber}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      status: 'success',
      message: 'Payment recorded successfully.',
      data: {
        payment: {
          ...payment.toObject(),
          id: String(payment._id),
          paymentNumber,
          gateway: 'MANUAL',
        },
        invoice: {
          ...invoice.toObject(),
          id: String(invoice._id),
          totalAmount: invoice.total,
          paymentStatus: invoice.status,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const refundPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user;
    const paymentId = req.params.id as string;
    const data = refundPaymentSchema.parse(req.body);

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      throw new NotFoundError('Payment record not found.');
    }

    if (payment.status !== 'SUCCESS') {
      throw new ValidationError(`Cannot refund payment with status '${payment.status}'. Only successful payments can be refunded.`);
    }

    const invoice = await Invoice.findById(payment.invoiceId);
    if (!invoice) {
      throw new NotFoundError('Associated invoice not found.');
    }

    const refundAmount = data.amount && data.amount > 0 ? Math.min(data.amount, payment.amount) : payment.amount;

    await Refund.create({
      hospitalId: payment.hospitalId,
      paymentId: payment._id,
      invoiceId: payment.invoiceId,
      amount: refundAmount,
      reason: data.reason,
      processedBy: user?.id ? (user.id as any) : undefined,
      status: 'COMPLETED',
    });

    payment.status = 'FAILED';
    await payment.save();

    invoice.status = 'CANCELLED';
    await invoice.save();

    await logAudit({
      hospitalId: payment.hospitalId ? String(payment.hospitalId) : undefined,
      userId: user?.id,
      action: 'PAYMENT_REFUNDED',
      resource: 'payments',
      details: `Processed refund of ${refundAmount} for payment ${payment.transactionId || String(payment._id)}. Reason: ${data.reason}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      status: 'success',
      message: `Refund of $${refundAmount} processed successfully.`,
      data: {
        payment: {
          ...payment.toObject(),
          id: String(payment._id),
          refundAmount,
          refundReason: data.reason,
        },
        invoice: {
          ...invoice.toObject(),
          id: String(invoice._id),
          totalAmount: invoice.total,
          paymentStatus: invoice.status,
        },
        refundAmount,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getPaymentTransactions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user;
    const { invoiceId, status, gateway } = req.query;

    const query: any = {};
    if (invoiceId) query.invoiceId = String(invoiceId);
    if (status) query.status = String(status);
    if (user?.hospitalId && user?.role !== 'SUPER_ADMIN') {
      query.hospitalId = user.hospitalId;
    }

    const rawPayments = await Payment.find(query)
      .populate({
        path: 'invoiceId',
        select: 'invoiceNumber total status patientId',
        populate: { path: 'patientId', select: 'firstName lastName uhid' },
      })
      .sort({ createdAt: -1 })
      .lean();

    const payments = rawPayments.map((p: any) => {
      const inv = p.invoiceId || {};
      return {
        ...p,
        id: String(p._id),
        paymentNumber: p.transactionId || `PAY-${String(p._id).slice(-6)}`,
        paymentMethod: p.method,
        gateway: p.method,
        invoice: {
          id: String(inv._id || p.invoiceId),
          invoiceNumber: inv.invoiceNumber,
          totalAmount: inv.total,
          patient: inv.patientId ? { ...inv.patientId, id: String(inv.patientId._id) } : null,
        },
      };
    });

    res.status(200).json({
      status: 'success',
      data: { payments },
    });
  } catch (err) {
    next(err);
  }
};
