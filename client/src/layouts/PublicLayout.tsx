import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { PublicNavbar } from '../components/landing/PublicNavbar';
import { PublicFooter } from '../components/landing/PublicFooter';
import { DemoModal } from '../components/landing/DemoModal';
import { AiAssistantChatBox } from '../components/AiAssistantChatBox';

interface PublicLayoutProps {
  children?: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen flex flex-col selection:bg-blue-600 selection:text-white">
      <DemoModal isOpen={demoModalOpen} onClose={() => setDemoModalOpen(false)} />
      <PublicNavbar onOpenDemo={() => setDemoModalOpen(true)} />
      
      <main className="flex-1">
        {children || <Outlet />}
      </main>

      <PublicFooter />
      <AiAssistantChatBox />
    </div>
  );
};

export default PublicLayout;

