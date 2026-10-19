import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Sparkles, User, Mail, Phone, Building2, CheckCircle2 } from 'lucide-react';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: string;
}

export const DemoModal: React.FC<DemoModalProps> = ({ isOpen, onClose, defaultRole }) => {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    organization: '',
    role: defaultRole ? defaultRole.toUpperCase() : 'HOSPITAL_ADMIN',
  });

  useEffect(() => {
    if (!isOpen) return;

    setSubmitted(false);
    setFormData({
      name: '',
      email: '',
      phone: '',
      organization: '',
      role: defaultRole ? defaultRole.toUpperCase() : 'HOSPITAL_ADMIN',
    });

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, defaultRole, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };
  const emailSubject = 'MediCore guided demo request';
  const emailBody = [
    `Name: ${formData.name}`,
    `Work email: ${formData.email}`,
    `Phone: ${formData.phone}`,
    `Organization: ${formData.organization}`,
    `Primary interest: ${formData.role}`,
  ].join('\n');
  const emailDraft = `mailto:support@medicore-health.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-modal-title"
        className="bg-white text-slate-900 rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border border-slate-200 animate-in fade-in zoom-in-95 duration-200"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close demo request"
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {!submitted ? (
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Schedule Platform Tour
            </div>
            <h3 id="demo-modal-title" className="text-2xl font-bold text-slate-900 mb-1">Book a Guided Demo of MediCore</h3>
            <p className="text-slate-600 text-sm mb-6 leading-relaxed">
              Experience multi-tenant bed management, e-prescriptions, LIS workflows, and AI clinical notes in action with a product specialist.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="demo-name" className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="demo-name"
                    type="text"
                    required
                    autoFocus
                    placeholder="Dr. Rajesh Kumar"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="demo-email" className="block text-xs font-semibold text-slate-700 mb-1">Work Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="demo-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="rajesh@cityhospital.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="demo-phone" className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="demo-phone"
                    type="tel"
                    required
                    autoComplete="tel"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="demo-organization" className="block text-xs font-semibold text-slate-700 mb-1">Hospital / Clinic Name</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="demo-organization"
                    type="text"
                    required
                    autoComplete="organization"
                    placeholder="City General Superspecialty"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="demo-role" className="block text-xs font-semibold text-slate-700 mb-1">Primary Interest Role</label>
                <select
                  id="demo-role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none"
                >
                  <option value="HOSPITAL_ADMIN">Hospital Administrator</option>
                  <option value="DOCTOR">Chief Doctor / Clinician</option>
                  <option value="NURSE">Head Nurse / Ward Desk</option>
                  <option value="PHARMACIST">Pharmacy Manager</option>
                  <option value="LAB_TECHNICIAN">Pathologist / Lab Tech</option>
                  <option value="ACCOUNTANT">Billing & Insurance Officer</option>
                  <option value="SUPER_ADMIN">Multi-Hospital Chain Executive</option>
                </select>
              </div>

              <div className="pt-2 flex flex-col gap-3">
                <button
                  type="submit"
                  className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition shadow-md shadow-blue-600/20"
                >
                  Prepare Email Request
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/login');
                  }}
                  className="w-full py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition flex items-center justify-center gap-1.5"
                >
                  Instant Portal Sign In
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 id="demo-modal-title" className="text-2xl font-bold text-slate-900">Your demo request is ready</h3>
            <p className="text-slate-600 text-sm max-w-sm mx-auto">
              Review and send the email draft to submit your request. It will be addressed to <span className="text-blue-600">support@medicore-health.com</span>.
            </p>
            <div className="pt-4 flex flex-col gap-3">
              <a
                href={emailDraft}
                className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition flex items-center justify-center"
              >
                Open Email Draft
              </a>
              <button type="button" onClick={onClose} className="text-sm text-slate-600 hover:text-slate-900">
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
