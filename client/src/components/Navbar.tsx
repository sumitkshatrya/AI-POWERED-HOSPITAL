import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon, Building2, ShieldCheck } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { brandConfig } from '../config/brand';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Tenant Identity */}
          <div className="flex items-center space-x-3">
            <Link to="/dashboard" className="flex items-center space-x-2.5 group">
              <img 
                src="/favicon.svg" 
                alt="MediCore Logo" 
                className="w-8 h-8 rounded-lg shadow-sm group-hover:scale-105 transition-transform" 
              />
              <span className="font-extrabold text-gray-900 text-lg tracking-tight hidden sm:inline">
                {brandConfig.name}
              </span>
            </Link>

            {user.hospital && (
              <div className="flex items-center space-x-2 pl-4 border-l border-gray-200">
                <Building2 className="w-4 h-4 text-sky-600" />
                <span className="text-xs font-semibold px-2 py-0.5 bg-sky-50 text-sky-700 rounded-full border border-sky-100">
                  {user.hospital.name}
                  {user.branch ? ` (${user.branch.name})` : ''}
                </span>
              </div>
            )}
          </div>

          {/* User Badge & Navigation Actions */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                {user.role}
              </span>
            </div>

            <Link
              to="/profile"
              className="flex items-center space-x-2 text-gray-700 hover:text-sky-600 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
            >
              <UserIcon className="w-4 h-4" />
              <span className="hidden md:inline">{user.firstName} {user.lastName}</span>
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

