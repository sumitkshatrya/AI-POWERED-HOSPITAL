import { Request, Response, NextFunction } from 'express';
import { InsurancePolicy, InsuranceClaim, Patient, Invoice, Payment } from '../models';
import {
  createInsurancePolicySchema,
  createInsuranceClaimSchema,
  adjudicateClaimSchema,
} from '../schemas/insurance.schema';
import { NotFoundError, ValidationError } from '../utils/errors';
import { logAudit } from '../utils/audit';

// --- POLICIES ---

export const createInsurancePolicy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = createInsurancePolicySchema.parse(req.body);

    const patient = await Patient.findById(data.patientId);
    if (!patient) {
      throw new NotFoundError('Patient record not found.');
    }

    const policy = await InsurancePolicy.create({
      hospitalId: patient.hospitalId || req.user?.hospitalId,
      patientId: data.patientId,
      providerName: data.provider,
      policyNumber: data.policyNumber,
      groupNumber: data.policyHolderName,
      startDate: new Date(data.validFrom),
      endDate: new Date(data.validTo),
      coverageLimit: data.coverageAmount,
      copayAmount: data.copayPercentage || 0,
      status: data.status,
    });

    await logAudit({
      hospitalId: patient.hospitalId ? String(patient.hospitalId) : undefined,
      branchId: patient.branchId ? String(patient.branchId) : undefined,
      userId: req.user?.id,
      action: 'INSURANCE_POLICY_REGISTERED',
      resource: 'patient_insurances',
      details: `Registered policy ${policy.policyNumber} from ${policy.providerName} for patient ${patient.uhid}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    const populated = await InsurancePolicy.findById(policy._id).populate('patientId', 'firstName lastName uhid');

    res.status(201).json({
      status: 'success',
      message: 'Insurance policy registered successfully.',
      data: {
        policy: {
          ...policy.toObject(),
          id: String(policy._id),
          provider: policy.providerName,
          policyHolderName: policy.groupNumber,
          coverageAmount: policy.coverageLimit,
          validFrom: policy.startDate,
          validTo: policy.endDate,
          copayPercentage: policy.copayAmount,
          patient: populated?.patientId ? { ...populated.patientId, id: String((populated.patientId as any)._id) } : null,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getInsurancePolicies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { patientId, status } = req.query;

    const query: any = {};
    if (patientId) query.patientId = String(patientId);
    if (status) query.status = String(status);
    if (req.user?.hospitalId && req.user?.role !== 'SUPER_ADMIN') {
      query.hospitalId = req.user.hospitalId;
    }

    const rawPolicies = await InsurancePolicy.find(query)
      .populate('patientId', 'firstName lastName uhid')
      .sort({ createdAt: -1 })
      .lean();

    const policies = rawPolicies.map((p: any) => ({
      ...p,
      id: String(p._id),
      provider: p.providerName,
      policyHolderName: p.groupNumber,
      coverageAmount: p.coverageLimit,
      validFrom: p.startDate,
      validTo: p.endDate,
      copayPercentage: p.copayAmount,
      patient: p.patientId ? { ...p.patientId, id: String(p.patientId._id) } : null,
      _count: { claims: 0 },
    }));

    res.status(200).json({
      status: 'success',
      data: { policies },
    });
  } catch (err) {
    next(err);
  }
};

// --- CLAIMS ---

export const createInsuranceClaim = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = createInsuranceClaimSchema.parse(req.body);

    const [patient, policy] = await Promise.all([
      Patient.findById(data.patientId),
      InsurancePolicy.findById(data.insuranceId),
    ]);

    if (!patient) throw new NotFoundError('Patient record not found.');
    if (!policy) throw new NotFoundError('Insurance policy not found.');

    if (String(policy.patientId) !== String(patient._id)) {
      throw new ValidationError('The specified insurance policy does not belong to this patient.');
    }

    if (policy.status !== 'ACTIVE') {
      throw new ValidationError(`Cannot file claim on inactive policy (Status: ${policy.status}).`);
    }

    if (policy.endDate && new Date() > new Date(policy.endDate)) {
      throw new ValidationError('Insurance policy has expired.');
    }

    if (data.claimedAmount > (policy.coverageLimit || Infinity)) {
      throw new ValidationError(`Claim amount ($${data.claimedAmount}) exceeds total policy coverage ($${policy.coverageLimit}).`);
    }

    const year = new Date().getFullYear();
    const count = await InsuranceClaim.countDocuments();
    const claimNumber = `CLM-${year}-${(count + 1).toString().padStart(4, '0')}`;

    const claim = await InsuranceClaim.create({
      claimNumber,
      hospitalId: patient.hospitalId || req.user?.hospitalId,
      patientId: data.patientId,
      policyId: data.insuranceId,
      invoiceId: data.invoiceId || undefined,
      claimAmount: data.claimedAmount,
      status: (data.status as any) || 'DRAFT',
      submissionDate: data.status === 'SUBMITTED' ? new Date() : undefined,
      remarks: data.treatmentDescription,
    });

    await logAudit({
      hospitalId: patient.hospitalId ? String(patient.hospitalId) : undefined,
      branchId: patient.branchId ? String(patient.branchId) : undefined,
      userId: req.user?.id,
      action: 'INSURANCE_CLAIM_FILED',
      resource: 'insurance_claims',
      details: `Filed claim ${claimNumber} for amount ${data.claimedAmount} against policy ${policy.policyNumber}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    const populated = await InsuranceClaim.findById(claim._id)
      .populate('patientId', 'firstName lastName uhid')
      .populate('policyId')
      .populate('invoiceId');

    res.status(201).json({
      status: 'success',
      message: 'Insurance claim filed successfully.',
      data: {
        claim: {
          ...claim.toObject(),
          id: String(claim._id),
          insuranceId: claim.policyId,
          claimedAmount: claim.claimAmount,
          treatmentDescription: claim.remarks,
          patient: populated?.patientId ? { ...populated.patientId, id: String((populated.patientId as any)._id) } : null,
          insurance: populated?.policyId ? { ...populated.policyId, id: String((populated.policyId as any)._id) } : null,
          invoice: populated?.invoiceId ? { ...populated.invoiceId, id: String((populated.invoiceId as any)._id) } : null,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getInsuranceClaims = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, patientId, insuranceId, search } = req.query;

    const query: any = {};
    if (status && status !== 'ALL') query.status = String(status);
    if (patientId) query.patientId = String(patientId);
    if (insuranceId) query.policyId = String(insuranceId);
    if (req.user?.hospitalId && req.user?.role !== 'SUPER_ADMIN') {
      query.hospitalId = req.user.hospitalId;
    }

    if (search) {
      query.$or = [
        { claimNumber: { $regex: String(search), $options: 'i' } },
        { remarks: { $regex: String(search), $options: 'i' } },
      ];
    }

    const rawClaims = await InsuranceClaim.find(query)
      .populate('patientId', 'firstName lastName uhid phone')
      .populate('policyId')
      .populate('invoiceId')
      .sort({ createdAt: -1 })
      .lean();

    const claims = rawClaims.map((c: any) => ({
      ...c,
      id: String(c._id),
      insuranceId: c.policyId,
      claimedAmount: c.claimAmount,
      treatmentDescription: c.remarks,
      patient: c.patientId ? { ...c.patientId, id: String(c.patientId._id) } : null,
      insurance: c.policyId ? { ...c.policyId, id: String(c.policyId._id), provider: c.policyId.providerName, coverageAmount: c.policyId.coverageLimit } : null,
      invoice: c.invoiceId ? { ...c.invoiceId, id: String(c.invoiceId._id), totalAmount: c.invoiceId.total, paymentStatus: c.invoiceId.status } : null,
    }));

    res.status(200).json({
      status: 'success',
      data: { claims },
    });
  } catch (err) {
    next(err);
  }
};

export const getInsuranceClaimById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;

    const rawClaim: any = await InsuranceClaim.findById(id)
      .populate('patientId')
      .populate('policyId')
      .populate('invoiceId')
      .lean();

    if (!rawClaim) {
      throw new NotFoundError('Insurance claim not found.');
    }

    const claim = {
      ...rawClaim,
      id: String(rawClaim._id),
      insuranceId: rawClaim.policyId,
      claimedAmount: rawClaim.claimAmount,
      treatmentDescription: rawClaim.remarks,
      patient: rawClaim.patientId ? { ...rawClaim.patientId, id: String(rawClaim.patientId._id) } : null,
      insurance: rawClaim.policyId ? { ...rawClaim.policyId, id: String(rawClaim.policyId._id) } : null,
      invoice: rawClaim.invoiceId ? { ...rawClaim.invoiceId, id: String(rawClaim.invoiceId._id) } : null,
    };

    res.status(200).json({
      status: 'success',
      data: { claim },
    });
  } catch (err) {
    next(err);
  }
};

export const adjudicateClaim = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const data = adjudicateClaimSchema.parse(req.body);

    const claim = await InsuranceClaim.findById(id).populate('policyId');

    if (!claim) {
      throw new NotFoundError('Insurance claim not found.');
    }

    if (claim.status === 'SETTLED') {
      throw new ValidationError('Claim has already been settled and finalized.');
    }

    let approvedAmount = claim.approvedAmount || 0;
    let settledAmount = 0;

    if (data.status === 'APPROVED') {
      approvedAmount = data.approvedAmount !== undefined ? data.approvedAmount : claim.claimAmount;
    } else if (data.status === 'SETTLED') {
      settledAmount = data.settledAmount !== undefined ? data.settledAmount : (claim.approvedAmount && claim.approvedAmount > 0 ? claim.approvedAmount : claim.claimAmount);
    }

    claim.status = data.status as any;
    if (approvedAmount) claim.approvedAmount = approvedAmount;
    if (data.adjudicationNotes) claim.remarks = data.adjudicationNotes;
    await claim.save();

    // Auto-credit Invoice if Claim is Settled and linked to an Invoice
    if (data.status === 'SETTLED' && claim.invoiceId && settledAmount > 0) {
      const invoice = await Invoice.findById(claim.invoiceId);
      if (invoice && invoice.status !== 'PAID') {
        const year = new Date().getFullYear();
        const payCount = await Payment.countDocuments();
        const paymentNumber = `PAY-INS-${year}-${(payCount + 1).toString().padStart(4, '0')}`;

        await Payment.create({
          hospitalId: invoice.hospitalId,
          invoiceId: invoice._id,
          amount: settledAmount,
          method: 'INSURANCE',
          transactionId: claim.claimNumber,
          paymentDate: new Date(),
          status: 'SUCCESS',
        });

        invoice.status = 'PAID';
        await invoice.save();
      }
    }

    await logAudit({
      hospitalId: claim.hospitalId ? String(claim.hospitalId) : undefined,
      userId: req.user?.id,
      action: 'INSURANCE_CLAIM_ADJUDICATED',
      resource: 'insurance_claims',
      details: `Claim ${claim.claimNumber} status transitioned to ${data.status}. Approved: ${approvedAmount}, Settled: ${settledAmount}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    const updatedClaim = await InsuranceClaim.findById(claim._id)
      .populate('patientId')
      .populate('policyId')
      .populate('invoiceId');

    res.status(200).json({
      status: 'success',
      message: `Insurance claim ${claim.claimNumber} adjudicated to ${data.status}.`,
      data: { claim: updatedClaim },
    });
  } catch (err) {
    next(err);
  }
};

export const getInsuranceDashboardSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const query: any = {};
    if (req.user?.hospitalId && req.user?.role !== 'SUPER_ADMIN') {
      query.hospitalId = req.user.hospitalId;
    }

    const [allClaims, allPolicies] = await Promise.all([
      InsuranceClaim.find(query).lean(),
      InsurancePolicy.find(query).lean(),
    ]);

    const summary = {
      totalClaims: allClaims.length,
      draftCount: allClaims.filter((c: any) => c.status === 'DRAFT').length,
      submittedCount: allClaims.filter((c: any) => c.status === 'SUBMITTED').length,
      underReviewCount: allClaims.filter((c: any) => c.status === 'UNDER_REVIEW').length,
      approvedCount: allClaims.filter((c: any) => c.status === 'APPROVED').length,
      rejectedCount: allClaims.filter((c: any) => c.status === 'REJECTED').length,
      settledCount: allClaims.filter((c: any) => c.status === 'SETTLED').length,
      totalClaimedAmount: allClaims.reduce((acc: number, c: any) => acc + (c.claimAmount || 0), 0),
      totalApprovedAmount: allClaims.reduce((acc: number, c: any) => acc + (c.approvedAmount || 0), 0),
      totalSettledAmount: allClaims.filter((c: any) => c.status === 'SETTLED').reduce((acc: number, c: any) => acc + (c.approvedAmount || c.claimAmount || 0), 0),
      totalActivePolicies: allPolicies.filter((p: any) => p.status === 'ACTIVE').length,
    };

    res.status(200).json({
      status: 'success',
      data: { summary },
    });
  } catch (err) {
    next(err);
  }
};
