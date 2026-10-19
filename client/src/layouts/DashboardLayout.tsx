import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { AiAssistantChatBox } from '../components/AiAssistantChatBox';
import { useAuth } from '../context/AuthContext';

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans antialiased text-gray-900">
      {/* Top Navbar */}
      <Navbar />

      <div className="flex flex-1">
        {/* Collapsible / Role-aware Sidebar */}
        {user && <Sidebar />}

        {/* Dynamic Main View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children || <Outlet />}
        </main>
      </div>

      {/* Floating AI Clinical Assistant Copilot */}
      <AiAssistantChatBox />
    </div>
  );
};

export default DashboardLayout;

