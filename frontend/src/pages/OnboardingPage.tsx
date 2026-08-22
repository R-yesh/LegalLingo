import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { User, MapPin, AlertCircle, Sparkles } from 'lucide-react';

const STATES = ['Maharashtra', 'Delhi', 'Karnataka', 'Gujarat', 'Other'];
const INCOME_BRACKETS = [
  { value: 'Up to ₹3 Lakhs', label: 'EWS (Up to ₹3 Lakhs)' },
  { value: '₹3 Lakhs - ₹6 Lakhs', label: 'LIG (₹3 - ₹6 Lakhs)' },
  { value: '₹6 Lakhs - ₹12 Lakhs', label: 'MIG-I (₹6 - ₹12 Lakhs)' },
  { value: '₹12 Lakhs - ₹18 Lakhs', label: 'MIG-II (₹12 - ₹18 Lakhs)' },
  { value: 'Above ₹18 Lakhs', label: 'HIG (Above ₹18 Lakhs)' },
];
const AREA_TYPES: Array<{ value: 'Urban' | 'Semi-Urban' | 'Rural'; label: string }> = [
  { value: 'Urban', label: 'Urban (Municipal Corporation)' },
  { value: 'Semi-Urban', label: 'Semi-Urban (Town / Nagar Parishad)' },
  { value: 'Rural', label: 'Rural (Gram Panchayat)' },
];

export const OnboardingPage: React.FC = () => {
  const { profile, session, saveProfile } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(profile?.display_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [state, setState] = useState(profile?.state || 'Maharashtra');
  const [occupation, setOccupation] = useState(profile?.occupation || '');
  const [income, setIncome] = useState(profile?.income_bracket || INCOME_BRACKETS[0].value);
  const [areaType, setAreaType] = useState<'Urban' | 'Semi-Urban' | 'Rural'>(
    (profile?.area_type as 'Urban' | 'Semi-Urban' | 'Rural') || 'Urban'
  );
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    try {
      await saveProfile({
        display_name: fullName.trim() || null,
        phone: phone.trim() || null,
        state,
        occupation: occupation.trim() || null,
        income_bracket: income,
        area_type: areaType,
        markOnboardingComplete: true,
      });
      navigate('/', { replace: true });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Could not save your details. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-4 sm:py-8">
      <div className="text-center mb-8 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>One quick step</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal font-display">Tell us a bit about you</h1>
        <p className="text-sm text-steel max-w-md mx-auto">
          {session?.user.email ? `Signed in as ${session.user.email}. ` : ''}
          These details help LegalLingo surface the right government schemes and welfare benefits for your documents.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-whisper space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-steel flex items-center gap-2">
            <User className="w-4 h-4 text-brand-600" />
            <span>Personal Information</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 XXXXX XXXXX"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-steel flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-600" />
            <span>Location & Welfare Eligibility Details</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">State of Residence</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {STATES.map((s) => (
                  <option key={s} value={s}>
                    {s === 'Other' ? 'Other State' : s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">Occupation</label>
              <input
                type="text"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder="e.g. Salaried, Farmer, Self-Employed"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">Annual Income Bracket</label>
              <select
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {INCOME_BRACKETS.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">Living Area Type</label>
              <select
                value={areaType}
                onChange={(e) => setAreaType(e.target.value as 'Urban' | 'Semi-Urban' | 'Rural')}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {AREA_TYPES.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <Button type="submit" variant="primary" size="lg" isLoading={isSaving} disabled={isSaving}>
            Continue to LegalLingo
          </Button>
        </div>
      </form>
    </div>
  );
};
