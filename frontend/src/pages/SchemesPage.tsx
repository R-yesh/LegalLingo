import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getSchemes } from '../services/schemeService';
import { Scheme } from '../types';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { 
  Award, 
  ExternalLink, 
  CheckCircle2, 
  FileText, 
  Filter, 
  Sparkles, 
  HelpCircle,
  IndianRupee,
  Building2
} from 'lucide-react';
import { cn } from '../lib/utils';

export const SchemesPage: React.FC = () => {
  const { language, t } = useLanguage();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [selectedState, setSelectedState] = useState('All');
  const [selectedOccupation, setSelectedOccupation] = useState('All');
  const [selectedIncome, setSelectedIncome] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const data = await getSchemes({ state: selectedState });
        setSchemes(data);
      } catch (err) {
        setSchemes([]);
        setLoadError(err instanceof Error ? err.message : 'Failed to load schemes.');
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [selectedState, retryToken]);

  return (
    <div className="space-y-8 py-4">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold">
          <Award className="w-3.5 h-3.5 text-amber-500" />
          <span>Citizen Benefits & Subsidies</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-charcoal font-display">
          {t.schemesTitle}
        </h1>
        <p className="text-sm sm:text-base text-steel">
          {t.schemesSubtitle}
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-whisper">
        <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-steel">
          <Filter className="w-3.5 h-3.5 text-brand-600" />
          <span>Filter Matching Welfare Schemes</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* State Filter */}
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">{t.filterByState}</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="All">All States (National)</option>
              <option value="Maharashtra">Maharashtra</option>
              <option value="Delhi">Delhi</option>
              <option value="Karnataka">Karnataka</option>
              <option value="Gujarat">Gujarat</option>
            </select>
          </div>

          {/* Occupation Filter */}
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">{t.filterByOccupation}</label>
            <select
              value={selectedOccupation}
              onChange={(e) => setSelectedOccupation(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="All">All Occupations</option>
              <option value="Salaried">Salaried / Private Employee</option>
              <option value="SelfEmployed">Self-Employed / Business</option>
              <option value="Farmer">Farmer / Agriculture</option>
              <option value="Woman">Female Sole/Joint Applicant</option>
            </select>
          </div>

          {/* Income Bracket */}
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">{t.filterByIncome}</label>
            <select
              value={selectedIncome}
              onChange={(e) => setSelectedIncome(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="All">All Income Brackets</option>
              <option value="EWS">EWS (Up to ₹3 Lakhs)</option>
              <option value="LIG">LIG (₹3 - ₹6 Lakhs)</option>
              <option value="MIG">MIG (₹6 - ₹18 Lakhs)</option>
            </select>
          </div>

        </div>
      </div>

      {/* Schemes List */}
      {isLoading ? (
        <div className="bg-surface rounded-2xl border border-slate-200/80 p-8 text-center text-steel">
          Loading schemes…
        </div>
      ) : loadError ? (
        <div className="bg-rose-50 rounded-2xl border border-rose-200 p-8 text-center space-y-3">
          <p className="text-rose-700 text-sm font-medium">{loadError}</p>
          <button
            onClick={() => setRetryToken((n) => n + 1)}
            className="text-xs font-bold text-rose-700 underline underline-offset-2"
          >
            Retry
          </button>
        </div>
      ) : schemes.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-slate-200/80 p-8 text-center text-steel">
          {t.noSchemesFound}
        </div>
      ) : (
        <div className="space-y-6">
          {schemes.map((scheme) => {
            const name = scheme.name[language] || scheme.name.en;
            const description = scheme.description[language] || scheme.description.en;
            const whyItMatches = scheme.whyItMatches[language] || scheme.whyItMatches.en;
            const eligibilityList = scheme.eligibility[language] || scheme.eligibility.en;
            const docsList = scheme.requiredDocuments[language] || scheme.requiredDocuments.en;

            return (
              <div
                key={scheme.id}
                className="bg-surface rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-whisper hover:shadow-diffused transition-all space-y-5"
              >
                {/* Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
                        {scheme.category}
                      </span>
                      <span className="text-xs font-mono text-steel">
                        State: {scheme.state}
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-charcoal font-display">
                      {name}
                    </h3>
                  </div>

                  {/* Potential Match Badge */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-1.5 text-xs font-bold">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{t.potentialMatch}: {scheme.matchPercentage}%</span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-charcoal/90 leading-relaxed">
                  {description}
                </p>

                {/* Financial Benefit Banner */}
                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center gap-3 text-xs sm:text-sm font-semibold text-emerald-950">
                  <IndianRupee className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span><strong>Benefit:</strong> {scheme.financialBenefit}</span>
                </div>

                {/* Why It Matches Box */}
                <div className="p-3.5 rounded-xl bg-brand-50/60 border border-brand-100 text-xs leading-relaxed">
                  <span className="font-bold text-brand-900 block mb-0.5">Why this matches your contract/profile:</span>
                  <span className="text-brand-800">{whyItMatches}</span>
                </div>

                {/* Eligibility & Documents Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs">
                  
                  {/* Eligibility */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                    <h5 className="font-bold text-charcoal uppercase tracking-wider text-[11px]">
                      {t.schemeEligibility}
                    </h5>
                    <ul className="space-y-1.5 text-steel">
                      {eligibilityList.map((e, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span>{e}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Required Documents */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                    <h5 className="font-bold text-charcoal uppercase tracking-wider text-[11px]">
                      {t.schemeDocs}
                    </h5>
                    <ul className="space-y-1.5 text-steel">
                      {docsList.map((d, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-brand-600 flex-shrink-0 mt-0.5" />
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>

                {/* Action CTA */}
                <div className="pt-2 flex justify-end">
                  <a
                    href={scheme.officialPortalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    <span>{t.openPortalBtn}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
