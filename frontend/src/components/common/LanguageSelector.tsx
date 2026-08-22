import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Language } from '../../types';
import { Globe } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface LanguageSelectorProps {
  className?: string;
  showIcon?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  className,
  showIcon = true,
}) => {
  const { language, setLanguage } = useLanguage();

  const options: { code: Language; label: string; nativeLabel: string }[] = [
    { code: 'en', label: 'English', nativeLabel: 'English' },
    { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
    { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी' },
  ];

  return (
    <div className={cn("inline-flex items-center p-1 bg-slate-100/90 border border-slate-200/80 rounded-xl", className)}>
      {showIcon && (
        <span className="pl-2 pr-1.5 text-steel flex items-center">
          <Globe className="w-4 h-4" />
        </span>
      )}
      <div className="flex space-x-1">
        {options.map((opt) => {
          const isActive = language === opt.code;
          return (
            <button
              key={opt.code}
              onClick={() => setLanguage(opt.code)}
              className={cn(
                "px-2.5 py-1 text-xs font-semibold rounded-lg transition-all duration-150",
                isActive
                  ? "bg-white text-brand-700 shadow-sm font-bold"
                  : "text-steel hover:text-charcoal hover:bg-slate-200/50"
              )}
              title={opt.label}
            >
              {opt.nativeLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
};
