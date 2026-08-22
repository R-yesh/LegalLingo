import React, { useEffect, useRef, useState } from 'react';
import { UploadCloud, FileSearch, Users, ShieldAlert, BookOpenCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Stage {
  label: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
  atMs: number;
}

/**
 * Staged copy timed against how long a real analysis actually takes: a
 * network upload, pypdf text extraction (or a Gemini OCR fallback for
 * scanned pages), then Gemini-backed enrichment on top of the deterministic
 * rules engine. None of this is simulated work -- the timings below just
 * describe, in order, what the backend is realistically doing while the
 * request is in flight, so the loading screen tells the truth about why a
 * real analysis takes on the order of 10-20 seconds rather than sitting on
 * a bare spinner.
 */
const STAGES: Stage[] = [
  { atMs: 0, label: 'Uploading your document', detail: 'Securely transferring your file…', icon: UploadCloud },
  { atMs: 2200, label: 'Reading every page', detail: 'Extracting text — scanned pages get OCR automatically.', icon: FileSearch },
  { atMs: 6000, label: 'Identifying parties & key terms', detail: 'Finding names, dates, and financial figures.', icon: Users },
  { atMs: 10500, label: 'Scanning for risks', detail: 'Checking clauses against common red flags.', icon: ShieldAlert },
  { atMs: 14500, label: 'Cross-checking relevant clauses', detail: 'Comparing against typical Indian agreement standards.', icon: BookOpenCheck },
  { atMs: 18000, label: 'Finalizing your plain-language report', detail: 'Putting it all together…', icon: Sparkles },
];

const PACE_DURATION_MS = 20000;
const MAX_PROGRESS_BEFORE_DONE = 95;

interface AnalyzingLoaderProps {
  /** True once the real network response has actually arrived. */
  isComplete: boolean;
  fileName?: string;
}

export const AnalyzingLoader: React.FC<AnalyzingLoaderProps> = ({ isComplete, fileName }) => {
  const [elapsedMs, setElapsedMs] = useState(0);
  const startRef = useRef<number>(Date.now());

  useEffect(() => {
    if (isComplete) return;
    const interval = setInterval(() => {
      setElapsedMs(Date.now() - startRef.current);
    }, 150);
    return () => clearInterval(interval);
  }, [isComplete]);

  const stageIndex = STAGES.reduce((acc, stage, idx) => (elapsedMs >= stage.atMs ? idx : acc), 0);
  const currentStage = STAGES[stageIndex];

  const progress = isComplete
    ? 100
    : Math.min(MAX_PROGRESS_BEFORE_DONE, (elapsedMs / PACE_DURATION_MS) * MAX_PROGRESS_BEFORE_DONE);

  const HeaderIcon = isComplete ? CheckCircle2 : currentStage.icon;

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors',
            isComplete ? 'bg-emerald-100 text-emerald-600' : 'bg-brand-50 text-brand-600'
          )}
        >
          <HeaderIcon className={cn('w-5 h-5', !isComplete && 'animate-pulse')} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-charcoal truncate">
            {isComplete ? 'Analysis complete' : currentStage.label}
          </p>
          <p className="text-xs text-steel truncate">
            {isComplete ? (fileName ? `${fileName} is ready.` : 'Redirecting…') : currentStage.detail}
          </p>
        </div>
        <span className="font-mono text-xs font-bold text-steel flex-shrink-0">{Math.round(progress)}%</span>
      </div>

      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            isComplete ? 'bg-emerald-500' : 'bg-brand-600'
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      <ol className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {STAGES.map((stage, idx) => {
          const reached = isComplete || elapsedMs >= stage.atMs;
          const active = !isComplete && idx === stageIndex;
          const StageIcon = stage.icon;
          return (
            <li
              key={stage.label}
              className={cn(
                'flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1.5 rounded-lg border transition-colors',
                active
                  ? 'border-brand-300 bg-brand-50 text-brand-700'
                  : reached
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-slate-50 text-slate-400'
              )}
            >
              <StageIcon className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{stage.label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
};
