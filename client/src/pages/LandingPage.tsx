import React, { useState } from 'react';
import { DemoModal } from '../components/landing/DemoModal';
import { PublicNavbar } from '../components/landing/PublicNavbar';
import { PublicFooter } from '../components/landing/PublicFooter';
import { Hero } from '../components/landing/Hero';
import { TrustSection } from '../components/landing/TrustSection';
import { ProblemSection } from '../components/landing/ProblemSection';
import { PlatformSection } from '../components/landing/PlatformSection';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { AISection } from '../components/landing/AISection';
import { PatientExperience } from '../components/landing/PatientExperience';
import { DoctorExperience } from '../components/landing/DoctorExperience';
import { HospitalOperations } from '../components/landing/HospitalOperations';
import { EmergencySection } from '../components/landing/EmergencySection';
import { HealthcareJourney } from '../components/landing/HealthcareJourney';
import { SecuritySection } from '../components/landing/SecuritySection';
import { RolesSection } from '../components/landing/RolesSection';
import { AnalyticsSection } from '../components/landing/AnalyticsSection';
import { PricingSection } from '../components/landing/PricingSection';
import { FAQSection } from '../components/landing/FAQSection';
import { FinalCTA } from '../components/landing/FinalCTA';
import { AiAssistantChatBox } from '../components/AiAssistantChatBox';

export const LandingPage: React.FC = () => {
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen selection:bg-blue-600 selection:text-white">
      <DemoModal isOpen={demoModalOpen} onClose={() => setDemoModalOpen(false)} />
      <PublicNavbar onOpenDemo={() => setDemoModalOpen(true)} />
      <Hero onOpenDemo={() => setDemoModalOpen(true)} />
      <TrustSection />
      <ProblemSection />
      <PlatformSection />
      <FeaturesSection />
      <AISection />
      <PatientExperience />
      <DoctorExperience />
      <HospitalOperations />
      <EmergencySection />
      <HealthcareJourney />
      <SecuritySection />
      <RolesSection />
      <AnalyticsSection />
      <PricingSection onOpenDemo={() => setDemoModalOpen(true)} />
      <FAQSection />
      <FinalCTA onOpenDemo={() => setDemoModalOpen(true)} />
      <PublicFooter />
      <AiAssistantChatBox />
    </div>
  );
};

export default LandingPage;

