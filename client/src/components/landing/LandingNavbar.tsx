import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  LogIn,
  ArrowRight,
  Menu,
  X,
  Stethoscope,
  Sparkles,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { brandConfig } from '../../config/brand';

export interface LandingNavbarProps {
  onOpenDemo?: () => void;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({ onOpenDemo }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDemoClick = () => {
    if (onOpenDemo) {
      onOpenDemo();
    } else {
      navigate('/login');
    }
  };

  return (
    <header
      className={`sticky top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-slate-950/90 backdrop-blur-md border-b border-slate-800 py-3 shadow-xl'
          : 'bg-slate-950 py-4 border-b border-slate-900'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo & Brand Name */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30 group-hover:scale-105 transition-transform">
              <Activity className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold text-white tracking-tight">
                {brandConfig.name}
              </span>
              <span className="text-[10px] text-blue-400 font-semibold tracking-wider -mt-1 uppercase">
                {brandConfig.tagline}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-300">
            <Link
              to="/doctors"
              className="text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1.5 transition px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20"
            >
              <Stethoscope className="w-4 h-4 text-sky-400" />
              <span>Find Doctors</span>
            </Link>
            <a href="/#platform" className="hover:text-white transition">Platform</a>
            <a href="/#roles" className="hover:text-white transition">Solutions</a>
            <a href="/#features" className="hover:text-white transition">Features</a>
            <a href="/#ai" className="hover:text-white transition flex items-center gap-1">
              <span>AI Assistant</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                AI
              </span>
            </a>
            <Link to="/about" className="hover:text-white transition">About</Link>
            <Link to="/pricing" className="hover:text-white transition">Pricing</Link>
            <Link to="/contact" className="hover:text-white transition">Contact</Link>
          </nav>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-sm font-semibold text-slate-200 hover:text-white flex items-center gap-1.5 transition rounded-lg hover:bg-slate-900"
            >
              <LogIn className="w-4 h-4 text-blue-400" />
              <span>Sign In</span>
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-900 bg-slate-100 hover:bg-white transition shadow-sm"
            >
              <span>Get Started</span>
            </button>
            <button
              onClick={handleDemoClick}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition shadow-md shadow-blue-600/25 flex items-center gap-1.5"
            >
              <span>Book a Demo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-slate-900 text-slate-300 hover:text-white border border-slate-800 focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 pt-4 pb-6 border-t border-slate-800 flex flex-col gap-4 text-slate-200 animate-in fade-in slide-in-from-top-2">
            <Link
              to="/doctors"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 text-base font-semibold text-sky-400 flex items-center gap-2"
            >
              <Stethoscope className="w-4 h-4" />
              <span>Find Doctors & Clinics</span>
            </Link>
            <a href="/#platform" onClick={() => setMobileMenuOpen(false)} className="py-2 text-base font-medium">Platform</a>
            <a href="/#roles" onClick={() => setMobileMenuOpen(false)} className="py-2 text-base font-medium">Solutions by Role</a>
            <a href="/#features" onClick={() => setMobileMenuOpen(false)} className="py-2 text-base font-medium">Features</a>
            <a href="/#ai" onClick={() => setMobileMenuOpen(false)} className="py-2 text-base font-medium flex items-center gap-2">
              <span>AI Clinical Assistant</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/20 text-blue-400">AI</span>
            </a>
            <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="py-2 text-base font-medium">About MediCore</Link>
            <Link to="/pricing" onClick={() => setMobileMenuOpen(false)} className="py-2 text-base font-medium">Pricing Plans</Link>
            <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="py-2 text-base font-medium">Contact & Support</Link>

            <div className="pt-4 border-t border-slate-800 flex flex-col gap-2.5">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/login');
                }}
                className="w-full py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white font-semibold text-sm flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4 text-blue-400" />
                <span>Sign In to Healthcare Portal</span>
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/register');
                }}
                className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-900 font-bold text-sm"
              >
                <span>Create Account</span>
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleDemoClick();
                }}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30"
              >
                <span>Schedule Live Demonstration</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </header>
  );
};

export default LandingNavbar;
