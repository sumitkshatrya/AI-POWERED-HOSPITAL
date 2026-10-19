import api from './api';

export interface MedicalDocument {
  id: string;
  patientId: string;
  uploaderId: string;
  documentType: 'PRESCRIPTION' | 'LAB_REPORT' | 'IMAGING' | 'INSURANCE' | 'MEDICAL_CERTIFICATE' | 'DISCHARGE_SUMMARY' | 'OTHER';
  fileName: string;
  fileKey: string;
  fileSize: number;
  mimeType: string;
  description?: string;
  createdAt: string;
}

export const documentService = {
  uploadDocument: async (
    patientId: string,
    file: File,
    documentType: string,
    description?: string
  ): Promise<MedicalDocument> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('patientId', patientId);
    formData.append('documentType', documentType);
    if (description) formData.append('description', description);

    const res = await api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data.document;
  },

  getPatientDocuments: async (patientId: string): Promise<MedicalDocument[]> => {
    const res = await api.get(`/documents/patient/${patientId}`);
    return res.data.data.documents;
  },

  downloadDocumentUrl: (documentId: string): string => {
    const baseURL = api.defaults.baseURL || '/api/v1';
    return `${baseURL}/documents/${documentId}/download`;
  },

  deleteDocument: async (documentId: string): Promise<void> => {
    await api.delete(`/documents/${documentId}`);
  },
};

