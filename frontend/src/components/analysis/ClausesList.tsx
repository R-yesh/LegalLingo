import React from 'react';
import { Link } from 'react-router-dom';
import { Clause, Language } from '../../types';
import { Badge } from '../common/Badge';
import { getSeverityStyles, cn } from '../../lib/utils';
import { ArrowRight, BookOpen } from 'lucide-react';

export interface ClausesListProps {
  clauses: Clause[];
  documentId: string;
  language: Language;
}

/**
 * Every clause the analysis engine identified, browsable in one place —
 * not just the ones that happened to trigger an attention item. Each card
 * shows the plain-language "simplified" meaning and links through to the
 * full clause breakdown (original text, why it matters, what to verify).
 */
export const ClausesList: React.FC<ClausesListProps> = ({ clauses, documentId, language }) => {
  if (clauses.length === 0) return null;

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-xl font-bold text-charcoal font-display flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-brand-600" />
          <span>All Clauses, Simplified</span>
        </h3>
        <p className="text-xs text-steel">
          Every clause identified in this document, explained in plain language.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {clauses.map((clause) => {
          const styles = getSeverityStyles(clause.severity);
          const simpleMeaning = clause.simpleMeaning[language] || clause.simpleMeaning.en;
          return (
            <Link
              key={clause.id}
              to={`/documents/${documentId}/clause/${clause.id}`}
              className={cn(
                'group bg-white rounded-2xl border p-4 sm:p-5 hover:shadow-diffused transition-all duration-200 border-l-4',
                styles.cardBorder,
                styles.border
              )}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-mono font-extrabold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                  Clause {clause.clauseNumber}
                </span>
                <Badge severity={clause.severity}>{clause.severity}</Badge>
              </div>
              <h4 className="font-bold text-charcoal text-sm mb-1.5 group-hover:text-brand-700 transition-colors">
                {clause.title}
              </h4>
              <p className="text-xs text-steel leading-relaxed line-clamp-3">
                {simpleMeaning}
              </p>
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-[11px]">
                <span className="text-steel font-mono capitalize">
                  Page {clause.pageNumber} · {clause.category}
                </span>
                <span className="inline-flex items-center gap-1 font-bold text-brand-600 group-hover:translate-x-1 transition-transform flex-shrink-0">
                  <span>Read more</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};
