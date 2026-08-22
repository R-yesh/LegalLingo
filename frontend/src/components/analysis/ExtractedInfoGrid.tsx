import React from 'react';
import { ExtractedField } from '../../types';
import { FileSearch, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ExtractedInfoGridProps {
  fields: ExtractedField[];
}

export const ExtractedInfoGrid: React.FC<ExtractedInfoGridProps> = ({ fields }) => {
  return (
    <div className="bg-surface rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-whisper">
      <h4 className="font-bold text-charcoal text-base flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
        <FileSearch className="w-5 h-5 text-brand-600" />
        <span>Extracted Key Property & Contract Data</span>
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => (
          <div
            key={field.id}
            className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-steel">
                  {field.label}
                </span>
                <div className="flex items-center gap-1.5">
                  {field.pageNumber && (
                    <span className="text-[10px] font-mono text-steel bg-slate-200/60 px-1.5 py-0.5 rounded">
                      Page {field.pageNumber}
                    </span>
                  )}
                  {field.verified ? (
                    <span title="Verified in Title Chain">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    </span>
                  ) : (
                    <span title="Needs Verification">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                    </span>
                  )}
                </div>
              </div>

              <p className="text-sm font-semibold text-charcoal leading-snug">
                {field.value}
              </p>
            </div>

            {field.confidence !== undefined && (
              <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-steel">
                <span>Extraction Confidence</span>
                <span className="font-mono font-bold text-brand-700">
                  {(field.confidence * 100).toFixed(0)}%
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
