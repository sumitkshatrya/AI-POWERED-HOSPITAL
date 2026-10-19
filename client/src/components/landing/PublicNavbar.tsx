import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, LogIn, ArrowRight, Menu, X } from 'lucide-react';

interface PublicNavbarProps {
  onOpenDemo?: () => void;
}

export const PublicNavbar: React.FC<PublicNavbarProps> = ({ onOpenDemo }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
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
    <header className={`sticky top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-slate-950/90 backdrop-blur-md border-b border-slate-800 py-3 shadow-xl' : 'bg-slate-950 py-4 border-b border-slate-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30 group-hover:scale-105 transition-transform">
              <Activity className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold text-white tracking-tight">MediCore</span>
              <span className="text-[10px] text-blue-400 font-medium tracking-wider -mt-1 uppercase">Healthcare SaaS</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <Link to="/doctors" className="text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 transition">
              Find Doctors & Treatments
            </Link>
            <a href="/#platform" className="hover:text-white transition">Platform</a>
            <a href="/#roles" className="hover:text-white transition">Solutions</a>
            <a href="/#features" className="hover:text-white transition">Features</a>
            <a href="/#ai" className="hover:text-white transition">AI Assistant</a>
            <a href="/#pricing" className="hover:text-white transition">Pricing</a>
          </nav>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-sm font-semibold text-slate-200 hover:text-white flex items-center gap-1.5 transition"
            >
              <LogIn className="w-4 h-4 text-blue-400" /> Sign In
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-900 bg-slate-100 hover:bg-white transition"
            >
              Get Started
            </button>
            <button
              onClick={handleDemoClick}
              className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition shadow-md shadow-blue-600/20 flex items-center gap-1.5"
            >
              Book a Demo <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-slate-900 text-slate-300 hover:text-white border border-slate-800"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 pb-6 border-t border-slate-800 flex flex-col gap-4 text-slate-200 animate-in fade-in slide-in-from-top-2">
            <a href="/#platform" onClick={() => setMobileMenuOpen(false)} className="py-2 text-base font-medium">Platform</a>
            <a href="/#roles" onClick={() => setMobileMenuOpen(false)} className="py-2 text-base font-medium">Solutions</a>
            <a href="/#features" onClick={() => setMobileMenuOpen(false)} className="py-2 text-base font-medium">Features</a>
            <a href="/#ai" onClick={() => setMobileMenuOpen(false)} className="py-2 text-base font-medium">AI Assistant</a>
            <Link to="/doctors" onClick={() => setMobileMenuOpen(false)} className="py-2 text-base font-medium">Doctor Directory</Link>
            <a href="/#about" onClick={() => setMobileMenuOpen(false)} className="py-2 text-base font-medium">About MediCore</a>
            <a href="/#contact" onClick={() => setMobileMenuOpen(false)} className="py-2 text-base font-medium">Contact Us</a>
            <a href="/#pricing" onClick={() => setMobileMenuOpen(false)} className="py-2 text-base font-medium">Pricing & Plans</a>

            <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
              <button
                onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}
                className="w-full py-2.5 rounded-lg text-slate-200 border border-slate-700 font-medium text-sm flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4 text-blue-400" /> Sign In to Portal
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); navigate('/register'); }}
                className="w-full py-2.5 rounded-lg bg-slate-100 text-slate-900 font-semibold text-sm"
              >
                Get Started (Register)
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); handleDemoClick(); }}
                className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-semibold text-sm flex items-center justify-center gap-2"
              >
                Book a Demo <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
