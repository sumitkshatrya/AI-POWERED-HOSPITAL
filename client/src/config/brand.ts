/**
 * Brand Configuration for MediCore Healthcare SaaS Platform
 * Centralized branding, corporate info, contact points, compliance, and platform statistics.
 */

export interface NavLinkItem {
  label: string;
  href: string;
  badge?: string;
  isExternal?: boolean;
}

export interface DepartmentContact {
  name: string;
  email: string;
  phone: string;
  hours: string;
  description: string;
}

export interface BrandConfig {
  name: string;
  shortName: string;
  legalName: string;
  tagline: string;
  subTagline: string;
  description: string;
  domain: string;
  supportEmail: string;
  salesEmail: string;
  complianceEmail: string;
  phone: string;
  emergencyHotline: string;
  headquarters: {
    addressLine1: string;
    suite: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  socialLinks: {
    twitter: string;
    linkedin: string;
    github: string;
  };
  metrics: {
    hospitalsConnected: string;
    patientsServed: string;
    aiAccuracy: string;
    uptimeSla: string;
    activeDoctors: string;
  };
  certifications: string[];
  publicNav: NavLinkItem[];
  footerNav: {
    platform: NavLinkItem[];
    solutions: NavLinkItem[];
    company: NavLinkItem[];
  };
  departments: DepartmentContact[];
}

export const brandConfig: BrandConfig = {
  name: 'MediCore',
  shortName: 'MediCore',
  legalName: 'MediCore Healthcare Platforms Inc.',
  tagline: 'Healthcare Management, Connected',
  subTagline: 'One intelligent, multi-tenant platform empowering hospitals, clinicians, labs, pharmacies, and patients.',
  description:
    'MediCore is an enterprise-grade, AI-powered healthcare management ecosystem. It seamlessly unifies hospital administration, clinical EHR workspaces, OPD token queue walls, IPD bed allocations, diagnostic LIS/RIS, pharmacy inventory, and automated clinical billing.',
  domain: 'medicore-health.com',
  supportEmail: 'support@medicore-health.com',
  salesEmail: 'sales@medicore-health.com',
  complianceEmail: 'privacy@medicore-health.com',
  phone: '+1 (800) 555-MEDICORE',
  emergencyHotline: '+1 (800) 911-CORE',
  headquarters: {
    addressLine1: 'Healthcare Plaza, Suite 400',
    suite: 'Innovation Center',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94107',
    country: 'United States',
  },
  socialLinks: {
    twitter: 'https://twitter.com/medicorehealth',
    linkedin: 'https://linkedin.com/company/medicore-healthcare',
    github: 'https://github.com/medicore-health',
  },
  metrics: {
    hospitalsConnected: '140+',
    patientsServed: '2.5M+',
    aiAccuracy: '99.4%',
    uptimeSla: '99.99%',
    activeDoctors: '8,500+',
  },
  certifications: [
    'HIPAA & HITECH Fully Compliant',
    'SOC 2 Type II Certified Data Centers',
    'HL7 & FHIR Interoperability Standard',
    'ISO 27001 Certified Information Security',
    'GDPR & CCPA Privacy Assured',
  ],
  publicNav: [
    { label: 'Platform', href: '/#platform' },
    { label: 'Solutions', href: '/#roles' },
    { label: 'Find Doctors', href: '/doctors' },
    { label: 'AI Assistant', href: '/#ai', badge: 'AI' },
    { label: 'About', href: '/about' },
    { label: 'Pricing', href: '/#pricing' },
    { label: 'Contact', href: '/contact' },
  ],
  footerNav: {
    platform: [
      { label: 'Hospital Management', href: '/#platform' },
      { label: 'Doctor Clinical Workspace', href: '/#features' },
      { label: 'OPD & Token Queue Wall', href: '/#features' },
      { label: 'IPD & Bed Allocation', href: '/#features' },
      { label: 'LIS & RIS Diagnostics', href: '/#features' },
      { label: 'Pharmacy & POS Inventory', href: '/#features' },
      { label: 'AI Clinical Assistant', href: '/#ai' },
    ],
    solutions: [
      { label: 'Doctor Directory', href: '/doctors' },
      { label: 'Hospital Administration', href: '/#roles' },
      { label: 'Multi-Branch Management', href: '/#platform' },
      { label: 'Laboratory Diagnostics', href: '/#features' },
      { label: 'Insurance & Claims', href: '/#features' },
      { label: 'Ambulance & Trauma ER', href: '/#features' },
    ],
    company: [
      { label: 'About MediCore', href: '/about' },
      { label: 'Contact & Sales', href: '/contact' },
      { label: 'Security & Compliance', href: '/#security' },
      { label: 'Pricing & Plans', href: '/#pricing' },
      { label: 'Sign In to Portal', href: '/login' },
      { label: 'Create Account', href: '/register' },
    ],
  },
  departments: [
    {
      name: 'Sales & Enterprise Deployment',
      email: 'sales@medicore-health.com',
      phone: '+1 (800) 555-6334 (Ext. 1)',
      hours: 'Mon – Fri: 8:00 AM – 7:00 PM EST',
      description: 'Hospital onboarding, custom multi-branch SaaS pricing, and procurement demos.',
    },
    {
      name: 'Clinical & Technical Support',
      email: 'support@medicore-health.com',
      phone: '+1 (800) 555-6334 (Ext. 2)',
      hours: '24/7 / 365 Days Priority Assistance',
      description: 'EMR sync, LIS/RIS analyzer integrations, and platform uptime monitoring.',
    },
    {
      name: 'Security, Privacy & HIPAA Office',
      email: 'privacy@medicore-health.com',
      phone: '+1 (800) 555-6334 (Ext. 3)',
      hours: 'Mon – Fri: 9:00 AM – 5:00 PM EST',
      description: 'Business Associate Agreements (BAA), audit inquiries, and compliance verification.',
    },
    {
      name: 'Billing & Account Services',
      email: 'billing@medicore-health.com',
      phone: '+1 (800) 555-6334 (Ext. 4)',
      hours: 'Mon – Fri: 9:00 AM – 6:00 PM EST',
      description: 'Subscription billing, invoices, payment gateways, and insurance gateway inquiries.',
    },
  ],
};

export default brandConfig;

