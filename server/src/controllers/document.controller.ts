import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { Patient, DocumentModel } from '../models';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors';
import { logAudit } from '../utils/audit';
import { Role } from '../types/roles';

// Secure Upload Directory (Outside public web root)
const SECURE_DOCS_DIR = path.join(process.cwd(), 'uploads', 'secure_docs');

if (!fs.existsSync(SECURE_DOCS_DIR)) {
  fs.mkdirSync(SECURE_DOCS_DIR, { recursive: true });
}

// Allowed MIME types & Extensions
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, SECURE_DOCS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueKey = `DOC-${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`;
    cb(null, uniqueKey);
  },
});

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB Max File Size
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mimeValid = ALLOWED_MIME_TYPES.includes(file.mimetype);
    const extValid = ALLOWED_EXTENSIONS.includes(ext);

    if (mimeValid && extValid) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type (${file.mimetype}). Only PDF, JPEG, PNG, and WEBP files up to 10MB are permitted.`));
    }
  },
}).single('file');

export const uploadDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      throw new ValidationError('No document file was provided for upload.');
    }

    const { patientId, documentType, title, description } = req.body;
    if (!patientId || !title) {
      if (req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      throw new ValidationError('Patient ID and Document Title are required.');
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      if (req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      throw new NotFoundError('Patient record not found.');
    }

    const doc = await DocumentModel.create({
      hospitalId: patient.hospitalId,
      patientId: patient._id,
      uploadedBy: req.user?.id,
      type: documentType || 'OTHER',
      fileName: req.file.originalname,
      storageKey: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });

    await logAudit({
      branchId: patient.branchId ? patient.branchId.toString() : undefined,
      userId: req.user?.id,
      action: 'DOCUMENT_UPLOADED',
      resource: 'medical_documents',
      details: `Uploaded ${doc.type} "${title}" for patient ${patient.uhid || patient.patientId}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      status: 'success',
      message: 'Medical document uploaded securely.',
      data: {
        document: {
          id: doc._id.toString(),
          _id: doc._id,
          patientId: doc.patientId?.toString(),
          uploadedById: doc.uploadedBy?.toString(),
          documentType: doc.type,
          title: title || doc.fileName,
          fileName: doc.fileName,
          fileKey: doc.storageKey,
          fileSize: doc.size,
          mimeType: doc.mimeType,
          description: description || null,
          createdAt: doc.createdAt,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const downloadDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;

    const doc = await DocumentModel.findById(id).populate('patientId');

    if (!doc) {
      throw new NotFoundError('Medical document record not found.');
    }

    const patientObj: any = doc.patientId && typeof doc.patientId === 'object' ? doc.patientId : null;

    if (req.user?.role === Role.PATIENT && patientObj) {
      const patientUserId = patientObj.userId ? patientObj.userId.toString() : null;
      if (patientUserId && patientUserId !== req.user.id) {
        throw new ForbiddenError('You are not authorized to access or download this medical document.');
      }
    }

    const filePath = path.join(SECURE_DOCS_DIR, doc.storageKey);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundError('Document file does not exist on storage server.');
    }

    await logAudit({
      userId: req.user?.id,
      action: 'DOCUMENT_DOWNLOADED',
      resource: 'medical_documents',
      details: `Downloaded ${doc.type} (${doc.fileName})`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${doc.fileName}"`);
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (err) {
    next(err);
  }
};

export const getPatientDocuments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const patientId = req.params.patientId as string;
    const { documentType } = req.query;

    const patient = await Patient.findById(patientId);
    if (!patient) {
      throw new NotFoundError('Patient record not found.');
    }

    if (req.user?.role === Role.PATIENT && patient.userId && patient.userId.toString() !== req.user.id) {
      throw new ForbiddenError('You are not authorized to view these documents.');
    }

    const query: any = { patientId };
    if (documentType) query.type = documentType as string;

    const documents = await DocumentModel.find(query)
      .populate('uploadedBy', 'firstName lastName role email')
      .sort({ createdAt: -1 });

    const formattedDocs = documents.map((d: any) => ({
      id: d._id.toString(),
      _id: d._id,
      patientId: d.patientId?.toString(),
      documentType: d.type,
      title: d.fileName,
      fileName: d.fileName,
      fileKey: d.storageKey,
      fileSize: d.size,
      mimeType: d.mimeType,
      createdAt: d.createdAt,
      uploadedBy: d.uploadedBy
        ? {
            id: d.uploadedBy._id?.toString() || d.uploadedBy.id,
            firstName: d.uploadedBy.firstName,
            lastName: d.uploadedBy.lastName,
            role: d.uploadedBy.role,
          }
        : null,
    }));

    res.status(200).json({
      status: 'success',
      data: { documents: formattedDocs },
    });
  } catch (err) {
    next(err);
  }
};

export const deleteDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;

    const doc = await DocumentModel.findById(id);
    if (!doc) {
      throw new NotFoundError('Medical document not found.');
    }

    if (req.user?.role === Role.PATIENT) {
      throw new ForbiddenError('Patients are not authorized to delete medical records.');
    }

    const filePath = path.join(SECURE_DOCS_DIR, doc.storageKey);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await DocumentModel.findByIdAndDelete(id);

    await logAudit({
      userId: req.user?.id,
      action: 'DOCUMENT_DELETED',
      resource: 'medical_documents',
      details: `Deleted document ${doc.fileName} (${doc._id})`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      status: 'success',
      message: 'Medical document deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};
