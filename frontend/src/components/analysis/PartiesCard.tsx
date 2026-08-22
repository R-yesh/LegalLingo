import React from 'react';
import { DocumentParty } from '../../types';
import { Users, User, ShieldCheck, MapPin, Phone } from 'lucide-react';

export interface PartiesCardProps {
  parties: DocumentParty[];
}

export const PartiesCard: React.FC<PartiesCardProps> = ({ parties }) => {
  return (
    <div className="bg-surface rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-whisper">
      <h4 className="font-bold text-charcoal text-base flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
        <Users className="w-5 h-5 text-brand-600" />
        <span>Parties Involved in Agreement</span>
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {parties.map((party, index) => (
          <div
            key={index}
            className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">
                  {party.name.charAt(0)}
                </div>
                <div>
                  <h5 className="font-bold text-sm text-charcoal">{party.name}</h5>
                  <span className="text-[11px] font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-100 inline-block mt-0.5">
                    {party.role}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-steel mt-3 pt-2 border-t border-slate-200/60">
              {party.idNumber && (
                <div className="flex items-center gap-1.5 font-mono text-[11px] text-charcoal">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>{party.idNumber}</span>
                </div>
              )}
              {party.address && (
                <div className="flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{party.address}</span>
                </div>
              )}
              {party.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span>{party.phone}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
