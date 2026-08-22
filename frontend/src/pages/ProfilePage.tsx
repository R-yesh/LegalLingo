import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useDocument } from '../context/DocumentContext';
import { Button } from '../components/common/Button';
import { Language } from '../types';
import { 
  User, 
  Settings, 
  Save, 
  CheckCircle2, 
  MapPin, 
  Briefcase, 
  IndianRupee, 
  Globe, 
  ShieldCheck 
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const { userProfile, updateProfile } = useDocument();

  const [fullName, setFullName] = useState(userProfile.fullName);
  const [phone, setPhone] = useState(userProfile.phone);
  const [email, setEmail] = useState(userProfile.email);
  const [state, setState] = useState(userProfile.state);
  const [occupation, setOccupation] = useState(userProfile.occupation);
  const [income, setIncome] = useState(userProfile.annualIncomeBracket);
  const [areaType, setAreaType] = useState(userProfile.areaType);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      fullName,
      phone,
      email,
      state,
      occupation,
      annualIncomeBracket: income,
      areaType: areaType as 'Urban' | 'Rural' | 'Semi-Urban',
    });
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4">
      
      {/* Page Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-charcoal font-display">
          {t.profileTitle}
        </h1>
        <p className="text-sm sm:text-base text-steel">
          {t.profileSubtitle}
        </p>
      </div>

      {/* Success Notification */}
      {showSuccessToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{t.profileSaved}</span>
        </div>
      )}

      {/* Profile Form Card */}
      <form onSubmit={handleSave} className="bg-surface rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-whisper space-y-6">
        
        {/* Personal Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-steel flex items-center gap-2">
            <User className="w-4 h-4 text-brand-600" />
            <span>Personal Information</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">{t.fullName}</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">{t.phone}</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-charcoal mb-1">{t.email}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Welfare & Location Criteria */}
        <div className="pt-6 border-t border-slate-100 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-steel flex items-center gap-2">
            <Settings className="w-4 h-4 text-brand-600" />
            <span>Location & Welfare Eligibility Details</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">{t.stateResidence}</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="Maharashtra">Maharashtra</option>
                <option value="Delhi">Delhi</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Gujarat">Gujarat</option>
                <option value="Other">Other State</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">{t.occupation}</label>
              <input
                type="text"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">{t.incomeBracket}</label>
              <select
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="Up to ₹3 Lakhs">EWS (Up to ₹3 Lakhs)</option>
                <option value="₹3 Lakhs - ₹6 Lakhs">LIG (₹3 - ₹6 Lakhs)</option>
                <option value="₹6 Lakhs - ₹12 Lakhs">MIG-I (₹6 - ₹12 Lakhs)</option>
                <option value="₹12 Lakhs - ₹18 Lakhs">MIG-II (₹12 - ₹18 Lakhs)</option>
                <option value="Above ₹18 Lakhs">HIG (Above ₹18 Lakhs)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">{t.areaType}</label>
              <select
                value={areaType}
                onChange={(e) => setAreaType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="Urban">Urban (Municipal Corporation)</option>
                <option value="Semi-Urban">Semi-Urban (Town / Nagar Parishad)</option>
                <option value="Rural">Rural (Gram Panchayat)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Language Preference */}
        <div className="pt-6 border-t border-slate-100 space-y-3">
          <label className="block text-xs font-semibold text-charcoal">{t.preferredLang}</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { code: 'en', label: 'English' },
              { code: 'hi', label: 'हिन्दी (Hindi)' },
              { code: 'mr', label: 'मराठी (Marathi)' },
            ].map((opt) => (
              <button
                key={opt.code}
                type="button"
                onClick={() => setLanguage(opt.code as Language)}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                  language === opt.code
                    ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 text-charcoal bg-slate-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            leftIcon={<Save className="w-4 h-4" />}
          >
            {t.saveProfileBtn}
          </Button>
        </div>

      </form>

    </div>
  );
};
