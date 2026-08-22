import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AttentionItem, Language } from '../../types';
import { Badge } from '../common/Badge';
import { getSeverityStyles } from '../../lib/utils';
import { ArrowRight, AlertCircle, CheckCircle, Clock, ShieldAlert } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface AttentionCardProps {
  item: AttentionItem;
  documentId: string;
  language: Language;
}

export const AttentionCard: React.FC<AttentionCardProps> = ({
  item,
  documentId,
  language,
}) => {
  const navigate = useNavigate();
  const styles = getSeverityStyles(item.severity);

  const getIcon = () => {
    switch (item.severity) {
      case 'VERIFIED':
        return <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />;
      case 'STANDARD':
        return <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />;
      case 'REVIEW':
        return <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />;
      case 'HIGH ATTENTION':
        return <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />;
    }
  };

  const title = item.title[language] || item.title.en;
  const shortExplanation = item.shortExplanation[language] || item.shortExplanation.en;
  const whyItMatters = item.whyItMatters[language] || item.whyItMatters.en;
  const recommendedAction = item.recommendedAction[language] || item.recommendedAction.en;

  const handleClick = () => {
    navigate(`/documents/${documentId}/clause/${item.clauseId}`);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "group relative bg-white rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden p-5 sm:p-6 hover:shadow-diffused",
        styles.cardBorder,
        "border-l-4",
        styles.border
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          {getIcon()}
          <h4 className="font-bold text-charcoal text-base group-hover:text-brand-700 transition-colors">
            {title}
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <Badge severity={item.severity}>
            {item.severity}
          </Badge>
          <span className="text-[11px] font-mono font-medium text-steel bg-slate-100 px-2 py-0.5 rounded">
            Page {item.evidencePage} • {item.evidenceClause}
          </span>
        </div>
      </div>

      <p className="text-sm text-charcoal/90 mb-3 leading-relaxed">
        {shortExplanation}
      </p>

      {/* Why it matters box */}
      <div className="bg-slate-50 rounded-xl p-3 mb-3 border border-slate-100 text-xs leading-relaxed">
        <span className="font-bold text-steel block mb-0.5">Why This Matters:</span>
        <span className="text-charcoal/80">{whyItMatters}</span>
      </div>

      {/* Recommended Action & CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
        <div className="text-brand-800 font-medium">
          <strong className="text-brand-900">Recommended Action:</strong> {recommendedAction}
        </div>
        <div className="inline-flex items-center gap-1 font-bold text-brand-600 group-hover:translate-x-1 transition-transform flex-shrink-0">
          <span>View Clause Breakdown</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};
