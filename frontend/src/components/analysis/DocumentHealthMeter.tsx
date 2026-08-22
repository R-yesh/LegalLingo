import React from 'react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface DocumentHealthMeterProps {
  score: number; // 0 to 100
  explanation?: string;
}

export const DocumentHealthMeter: React.FC<DocumentHealthMeterProps> = ({
  score,
  explanation,
}) => {
  const getScoreColor = () => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 60) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  const getProgressColor = () => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="bg-surface rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-whisper">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h4 className="font-bold text-charcoal text-base flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-600" />
            <span>Document Health Score</span>
          </h4>
          {explanation && (
            <p className="text-xs text-steel mt-0.5 max-w-sm">{explanation}</p>
          )}
        </div>

        <div className={cn("px-4 py-2 rounded-2xl border flex items-center gap-2 font-display", getScoreColor())}>
          <span className="text-2xl font-extrabold">{score}</span>
          <span className="text-xs font-semibold uppercase opacity-75">/ 100</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200/60">
        <div
          className={cn("h-full rounded-full transition-all duration-700 ease-out", getProgressColor())}
          style={{ width: `${score}%` }}
        />
      </div>

      <div className="flex justify-between items-center mt-2 text-[11px] text-steel font-medium">
        <span>Requires Major Due Diligence (0-59)</span>
        <span>Review Recommended (60-79)</span>
        <span className="text-emerald-700 font-bold">Standard & Verified (80-100)</span>
      </div>
    </div>
  );
};
