import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { ShieldCheck, Scale, PhoneCall, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="mt-auto bg-slate-900 text-slate-300 pt-12 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Trust Disclaimer Box */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 mb-10 text-slate-300">
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl flex-shrink-0 mt-0.5">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-base mb-1">
                {t.disclaimerTitle}
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {t.disclaimerText}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-white font-display">
                Legal<span className="text-brand-400">Lingo</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Empowering Indian citizens with transparent, plain-language document analysis across English, Hindi, and Marathi.
            </p>
          </div>

          <div>
            <h5 className="text-white text-xs font-bold uppercase tracking-wider mb-3">Quick Navigation</h5>
            <ul className="space-y-2 text-xs">
              <li><Link to="/" className="hover:text-white transition-colors">{t.navHome}</Link></li>
              <li><Link to="/upload" className="hover:text-white transition-colors">{t.navUpload}</Link></li>
              <li><Link to="/documents" className="hover:text-white transition-colors">{t.navDocuments}</Link></li>
              <li><Link to="/schemes" className="hover:text-white transition-colors">{t.navSchemes}</Link></li>
              <li><Link to="/ai" className="hover:text-white transition-colors">{t.navAI}</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="text-white text-xs font-bold uppercase tracking-wider mb-3">Citizen Protections</h5>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Transfer of Property Act Sec 55</li>
              <li className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Registration Act, 1908 Verification</li>
              <li className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> MahaRERA Dispute Guidelines</li>
              <li className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 100% Client Privacy Guarantee</li>
            </ul>
          </div>

          <div>
            <h5 className="text-white text-xs font-bold uppercase tracking-wider mb-3">Support & Helpline</h5>
            <p className="text-xs text-slate-400 mb-2">For urgent assistance regarding property document verification:</p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 text-white font-mono text-xs font-semibold border border-slate-700">
              <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
              <span>1800-LEGAL-IND</span>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 border-t border-slate-800 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} LegalLingo India. {t.allRightsReserved}</p>
          <p className="flex items-center gap-1 text-[11px]">
            Designed with <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> for Indian Property Buyers
          </p>
        </div>

      </div>
    </footer>
  );
};
