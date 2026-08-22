import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useDocument } from '../context/DocumentContext';
import { Button } from '../components/common/Button';
import { 
  FileText, 
  UploadCloud, 
  Sparkles, 
  ShieldCheck, 
  Award, 
  CheckCircle2, 
  ArrowRight, 
  Search, 
  Languages, 
  HelpCircle,
  Clock,
  FileSearch,
  Scale
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { loadSampleAgreement } = useDocument();
  const navigate = useNavigate();
  const [isSampleLoading, setIsSampleLoading] = useState(false);

  const handleTrySample = async () => {
    setIsSampleLoading(true);
    try {
      const docId = await loadSampleAgreement();
      navigate(`/documents/${docId}/analysis`);
    } finally {
      setIsSampleLoading(false);
    }
  };

  return (
    <div className="space-y-16 sm:space-y-24 py-4 sm:py-8">
      
      {/* Asymmetric Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        
        {/* Left Headline & Value Prop (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-200/80 text-brand-700 text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{t.heroBadge}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-charcoal font-display leading-[1.1]">
            {t.heroTitle1}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600">
              {t.heroTitle2}
            </span>
          </h1>

          <p className="text-base sm:text-lg text-steel max-w-2xl leading-relaxed">
            {t.heroSubtitle}
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Button
              onClick={() => navigate('/upload')}
              variant="primary"
              size="lg"
              leftIcon={<UploadCloud className="w-5 h-5" />}
              className="shadow-lg shadow-brand-600/20"
            >
              {t.heroUploadCTA}
            </Button>

            <Button
              onClick={handleTrySample}
              variant="outline"
              size="lg"
              isLoading={isSampleLoading}
              leftIcon={<FileText className="w-5 h-5 text-brand-600" />}
            >
              {t.heroSampleCTA}
            </Button>
          </div>

          {/* Trust points */}
          <div className="pt-4 flex items-center gap-2 text-xs font-medium text-steel">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{t.heroTrustBadge}</span>
          </div>
        </div>

        {/* Right Interactive Preview Card (5 cols) */}
        <div className="lg:col-span-5">
          <div className="relative bg-surface rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-diffused-lg overflow-hidden">
            
            {/* Ambient Background Gradient Accent */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-brand-100/50 rounded-full blur-3xl -z-10" />

            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
                  <FileSearch className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-charcoal">Live Contract Intelligence</h3>
                  <span className="text-[10px] text-steel">Sample: Residential Sale Agreement</span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Health: 78/100
              </span>
            </div>

            {/* Micro clause preview */}
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/80">
                <div className="flex items-center justify-between text-xs font-bold text-rose-900 mb-1">
                  <span>HIGH ATTENTION: Property Tax Liability</span>
                  <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.2 rounded font-mono">Page 4</span>
                </div>
                <p className="text-xs text-rose-800">
                  Seller shifts unbilled municipal arrears to buyer after possession date.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80">
                <div className="flex items-center justify-between text-xs font-bold text-amber-900 mb-1">
                  <span>REVIEW: 90-Day Unilateral Delay</span>
                  <span className="text-[10px] bg-amber-500 text-white px-1.5 py-0.2 rounded font-mono">Page 6</span>
                </div>
                <p className="text-xs text-amber-800">
                  Seller holds 3 months grace period with zero monthly compensation.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/80">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-900 mb-1">
                  <span>VERIFIED: Free from Mortgage & Disputes</span>
                  <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-mono">Page 2</span>
                </div>
                <p className="text-xs text-emerald-800">
                  Absolute freehold ownership backed by registered 2014 title chain.
                </p>
              </div>
            </div>

            {/* Quick interactive trigger */}
            <button
              onClick={handleTrySample}
              className="mt-4 w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <span>Explore Full Analysis & AI Assistant</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </section>

      {/* Feature Bento Grid Section */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-charcoal font-display">
            {t.featuresTitle}
          </h2>
          <p className="text-sm sm:text-base text-steel">
            {t.featuresSubtitle}
          </p>
        </div>

        {/* Bento Grid: Row 1 (3 items), Row 2 (2 items with 70/30 split) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1 */}
          <div className="bg-surface rounded-2xl p-6 border border-slate-200/80 shadow-whisper hover:shadow-diffused transition-all">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Languages className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-charcoal mb-2">{t.feature1Title}</h3>
            <p className="text-xs sm:text-sm text-steel leading-relaxed">{t.feature1Desc}</p>
          </div>

          {/* Card 2 */}
          <div className="bg-surface rounded-2xl p-6 border border-slate-200/80 shadow-whisper hover:shadow-diffused transition-all">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <Scale className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-charcoal mb-2">{t.feature2Title}</h3>
            <p className="text-xs sm:text-sm text-steel leading-relaxed">{t.feature2Desc}</p>
          </div>

          {/* Card 3 */}
          <div className="bg-surface rounded-2xl p-6 border border-slate-200/80 shadow-whisper hover:shadow-diffused transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-charcoal mb-2">{t.feature3Title}</h3>
            <p className="text-xs sm:text-sm text-steel leading-relaxed">{t.feature3Desc}</p>
          </div>

        </div>

        {/* Row 2: 70/30 Split */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Bento Item 4 (8 cols) */}
          <div className="md:col-span-8 bg-surface rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-whisper flex flex-col sm:flex-row items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-charcoal mb-2">{t.feature4Title}</h3>
              <p className="text-xs sm:text-sm text-steel leading-relaxed mb-4">{t.feature4Desc}</p>
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg">English</span>
                <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg">हिन्दी (Hindi)</span>
                <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg">मराठी (Marathi)</span>
              </div>
            </div>
          </div>

          {/* Bento Item 5 (4 cols) */}
          <div className="md:col-span-4 bg-gradient-to-br from-brand-900 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-whisper">
            <div>
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="font-bold text-lg text-white mb-2">100% Privacy Focused</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Your private legal documents are parsed securely and never shared with unauthorized parties.
              </p>
            </div>
            <button
              onClick={() => navigate('/upload')}
              className="mt-6 text-xs font-bold text-brand-300 hover:text-white flex items-center gap-1 self-start"
            >
              <span>Start Document Audit</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </section>

      {/* 3-Step Process Section */}
      <section className="bg-slate-50/70 rounded-3xl p-8 sm:p-12 border border-slate-200/80">
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-charcoal font-display">
            {t.howItWorksTitle}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 space-y-2 shadow-whisper">
            <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h4 className="font-bold text-base text-charcoal pt-2">{t.step1Title}</h4>
            <p className="text-xs text-steel leading-relaxed">{t.step1Desc}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 space-y-2 shadow-whisper">
            <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h4 className="font-bold text-base text-charcoal pt-2">{t.step2Title}</h4>
            <p className="text-xs text-steel leading-relaxed">{t.step2Desc}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 space-y-2 shadow-whisper">
            <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h4 className="font-bold text-base text-charcoal pt-2">{t.step3Title}</h4>
            <p className="text-xs text-steel leading-relaxed">{t.step3Desc}</p>
          </div>
        </div>
      </section>

    </div>
  );
};
