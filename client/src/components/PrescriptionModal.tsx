import React from 'react';
import { Printer, X, ShieldCheck, HeartPulse, FileText } from 'lucide-react';

interface PrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  prescription: {
    prescriptionCode: string;
    createdAt: string;
    adviceInstructions?: string | null;
    doctorName: string;
    specialization: string;
    departmentName?: string;
    licenseNumber?: string;
    patientName: string;
    patientUhid: string;
    patientAgeGender: string;
    patientBloodGroup?: string;
    vitalsSummary?: string;
    diagnosisSummary?: string;
    items: Array<{
      medicineName: string;
      dosage: string;
      frequency: string;
      durationDays: number;
      route: string;
      instructions?: string | null;
    }>;
  } | null;
}

export const PrescriptionModal: React.FC<PrescriptionModalProps> = ({ isOpen, onClose, prescription }) => {
  if (!isOpen || !prescription) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden print:shadow-none print:w-full print:max-w-none print:m-0">
        
        {/* Header toolbar */}
        <div className="bg-gradient-to-r from-sky-900 to-indigo-900 px-6 py-4 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 font-semibold text-lg">
            <FileText className="w-5 h-5 text-sky-400" />
            Official e-Prescription Preview
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-white px-4 py-2 rounded-lg font-medium transition text-sm shadow"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-300 hover:text-white rounded-lg hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Prescription Printable Body */}
        <div className="p-8 sm:p-10 space-y-6 print:p-6 text-gray-800">
          
          {/* Hospital & Doctor Header */}
          <div className="flex justify-between items-start border-b border-gray-200 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sky-700 font-bold text-2xl tracking-tight">
                <HeartPulse className="w-7 h-7 text-rose-500" />
                CITY GENERAL HOSPITAL
              </div>
              <p className="text-xs text-gray-500 font-medium">100 Healthcare Ave, Metropolis, NY 10001 | Tel: +1-555-0100</p>
              <p className="text-xs text-sky-600 font-semibold uppercase tracking-wider">24/7 Emergency & OPD Services</p>
            </div>

            <div className="text-right space-y-0.5">
              <h3 className="font-bold text-gray-900 text-base">{prescription.doctorName}</h3>
              <p className="text-xs font-semibold text-sky-700">{prescription.specialization}</p>
              <p className="text-xs text-gray-500">Dept: {prescription.departmentName || 'Cardiology'}</p>
              <p className="text-[11px] text-gray-400">Reg No: {prescription.licenseNumber || 'MD-2026-9901'}</p>
            </div>
          </div>

          {/* Patient Info Card */}
          <div className="bg-sky-50/70 border border-sky-100 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-gray-400 block font-medium uppercase text-[10px]">Patient Name</span>
              <span className="font-bold text-gray-900 text-sm">{prescription.patientName}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium uppercase text-[10px]">UHID</span>
              <span className="font-mono font-semibold text-sky-800">{prescription.patientUhid}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium uppercase text-[10px]">Age / Gender / Blood</span>
              <span className="font-medium text-gray-800">{prescription.patientAgeGender} ({prescription.patientBloodGroup || 'O+'})</span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium uppercase text-[10px]">Date</span>
              <span className="font-medium text-gray-800">{new Date(prescription.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Vitals & Diagnosis Banner */}
          {(prescription.vitalsSummary || prescription.diagnosisSummary) && (
            <div className="grid sm:grid-cols-2 gap-4 text-xs bg-gray-50 p-3 rounded-lg border border-gray-100">
              {prescription.vitalsSummary && (
                <div>
                  <span className="font-semibold text-gray-700 block mb-0.5">Recorded Vitals:</span>
                  <span className="text-gray-600">{prescription.vitalsSummary}</span>
                </div>
              )}
              {prescription.diagnosisSummary && (
                <div>
                  <span className="font-semibold text-gray-700 block mb-0.5">Diagnosis (ICD-10):</span>
                  <span className="text-rose-700 font-medium">{prescription.diagnosisSummary}</span>
                </div>
              )}
            </div>
          )}

          {/* Rx Icon & Table */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-serif font-bold text-sky-800 tracking-tighter">Rx</span>
              <span className="text-xs font-semibold text-gray-400 tracking-wider uppercase">Prescribed Medications</span>
            </div>

            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-700 border-b border-gray-200">
                  <th className="py-2.5 px-3 font-semibold">#</th>
                  <th className="py-2.5 px-3 font-semibold">Medicine & Dosage</th>
                  <th className="py-2.5 px-3 font-semibold">Frequency</th>
                  <th className="py-2.5 px-3 font-semibold">Duration</th>
                  <th className="py-2.5 px-3 font-semibold">Route</th>
                  <th className="py-2.5 px-3 font-semibold">Instructions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {prescription.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="py-3 px-3 font-semibold text-gray-400">{idx + 1}</td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-gray-900">{item.medicineName}</div>
                      <div className="text-[11px] text-sky-700 font-medium">{item.dosage}</div>
                    </td>
                    <td className="py-3 px-3 font-medium text-gray-800">{item.frequency}</td>
                    <td className="py-3 px-3 text-gray-700">{item.durationDays} Days</td>
                    <td className="py-3 px-3 text-gray-600 font-mono text-[11px]">{item.route}</td>
                    <td className="py-3 px-3 text-gray-500 italic">{item.instructions || 'As directed'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Advice & General Instructions */}
          {prescription.adviceInstructions && (
            <div className="bg-amber-50/60 border border-amber-200/60 rounded-xl p-4 space-y-1">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wider block">Doctor Advice & Care Instructions</span>
              <p className="text-xs text-amber-950 font-medium leading-relaxed">{prescription.adviceInstructions}</p>
            </div>
          )}

          {/* Footer & Security Verification Stamp */}
          <div className="pt-6 border-t border-gray-200 flex items-end justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Digitally Signed & Security Verified
              </div>
              <p className="text-[10px] text-gray-400 font-mono">Rx Code: {prescription.prescriptionCode}</p>
            </div>

            <div className="text-right space-y-2">
              <div className="w-36 border-b border-gray-400 ml-auto"></div>
              <p className="text-xs font-bold text-gray-800">{prescription.doctorName}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Authorized Digital Signature</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

