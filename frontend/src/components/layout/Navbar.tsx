import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useDocument } from '../../context/DocumentContext';
import { LanguageSelector } from '../common/LanguageSelector';
import { Button } from '../common/Button';
import { checkBackendHealth } from '../../services/api';
import { 
  FileText, 
  UploadCloud, 
  FolderGit2, 
  Sparkles, 
  Award, 
  User, 
  Menu, 
  X,
  Compass,
  Activity
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const Navbar: React.FC = () => {
  const { t } = useLanguage();
  const { loadSampleAgreement } = useDocument();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSampleLoading, setIsSampleLoading] = useState(false);
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;
    const check = async () => {
      const health = await checkBackendHealth();
      if (isMounted) {
        setBackendConnected(health !== null && health.status === 'ok');
      }
    };
    check();
    const interval = setInterval(check, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleTrySample = async () => {
    setIsSampleLoading(true);
    try {
      const docId = await loadSampleAgreement();
      navigate(`/documents/${docId}/analysis`);
      setMobileMenuOpen(false);
    } finally {
      setIsSampleLoading(false);
    }
  };

  const navLinks = [
    { to: '/', label: t.navHome, icon: Compass },
    { to: '/upload', label: t.navUpload, icon: UploadCloud },
    { to: '/documents', label: t.navDocuments, icon: FolderGit2 },
    { to: '/schemes', label: t.navSchemes, icon: Award },
    { to: '/ai', label: t.navAI, icon: Sparkles },
    { to: '/profile', label: t.navProfile, icon: User },
  ];

  return (
    <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Brand */}
          <Link 
            to="/" 
            className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-xl p-1"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-900 to-brand-600 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-charcoal font-display">
                  Legal<span className="text-brand-600">Lingo</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-brand-100 text-brand-800 hidden sm:inline-block">
                  India
                </span>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-[11px] text-steel font-medium hidden md:block leading-none">
                  Citizen Legal AI
                </p>
                {backendConnected !== null && (
                  <span
                    className={cn(
                      "hidden lg:inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.2 rounded-full",
                      backendConnected
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    )}
                    title={backendConnected ? "FastAPI backend connected" : "Backend offline"}
                  >
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        backendConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                      )}
                    />
                    <span>{backendConnected ? "Backend API Online" : "Backend Offline"}</span>
                  </span>
                )}
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all",
                    isActive
                      ? "text-brand-700 bg-brand-50 shadow-whisper"
                      : "text-steel hover:text-charcoal hover:bg-slate-100/70"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Header Actions */}
          <div className="hidden sm:flex items-center space-x-3">
            <LanguageSelector />
            
            <Button
              onClick={handleTrySample}
              variant="outline"
              size="sm"
              isLoading={isSampleLoading}
              className="text-brand-700 border-brand-200 bg-brand-50/50 hover:bg-brand-100/60 font-semibold"
            >
              {t.trySample}
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="flex sm:hidden items-center space-x-2">
            <LanguageSelector showIcon={false} />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-steel hover:text-charcoal hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-surface border-b border-slate-200 px-4 pt-2 pb-6 space-y-3 shadow-diffused">
          <div className="space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all",
                    isActive
                      ? "text-brand-700 bg-brand-50"
                      : "text-steel hover:text-charcoal hover:bg-slate-100"
                  )}
                >
                  <Icon className="w-5 h-5 text-brand-600" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100">
            <Button
              onClick={handleTrySample}
              variant="primary"
              size="md"
              isLoading={isSampleLoading}
              className="w-full justify-center"
            >
              {t.trySample}
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};
