import React from 'react';
import { VerificationStep } from '../../types';
import { CheckCircle2, Circle, ExternalLink, FileCheck } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface CitizenChecklistProps {
  items: VerificationStep[];
  onToggleItem: (id: string) => void;
}

export const CitizenChecklist: React.FC<CitizenChecklistProps> = ({
  items,
  onToggleItem,
}) => {
  const completedCount = items.filter(i => i.status === 'completed').length;

  return (
    <div className="bg-surface rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-whisper">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
        <div>
          <h4 className="font-bold text-charcoal text-base flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-600" />
            <span>Citizen Action Checklist</span>
          </h4>
          <p className="text-xs text-steel">
            Mark off completed tasks before appearing before the Sub-Registrar.
          </p>
        </div>
        <div className="text-xs font-bold text-brand-700 bg-brand-50 px-3 py-1 rounded-full self-start sm:self-auto border border-brand-200">
          {completedCount} of {items.length} Completed
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const isCompleted = item.status === 'completed';
          return (
            <div
              key={item.id}
              onClick={() => onToggleItem(item.id)}
              className={cn(
                "p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none",
                isCompleted
                  ? "bg-emerald-50/50 border-emerald-200 text-slate-700"
                  : "bg-white border-slate-200 hover:border-slate-300 text-charcoal hover:bg-slate-50/50"
              )}
            >
              <button
                type="button"
                className="mt-0.5 text-steel flex-shrink-0 focus:outline-none"
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-300 hover:text-slate-400" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <h5 className={cn("text-sm font-semibold", isCompleted && "line-through text-slate-500")}>
                    {item.title}
                  </h5>
                  {item.requiredDocument && (
                    <span className="text-[10px] font-mono font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      Doc: {item.requiredDocument}
                    </span>
                  )}
                </div>
                <p className={cn("text-xs text-steel mt-0.5", isCompleted && "text-slate-400")}>
                  {item.description}
                </p>

                {item.authorityPortalUrl && (
                  <a
                    href={item.authorityPortalUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-[11px] text-brand-600 hover:text-brand-800 font-medium mt-2"
                  >
                    <span>Check Official Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
