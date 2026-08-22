import React, { useState } from 'react';
import { ExtractedField } from '../../types';
import { FileSearch, CheckCircle2, AlertCircle, Pencil, Check, X } from 'lucide-react';

export interface ExtractedInfoGridProps {
  fields: ExtractedField[];
  /** When provided, each field becomes editable (pencil icon -> inline input). */
  onUpdateField?: (fieldId: string, value: string) => void;
}

export const ExtractedInfoGrid: React.FC<ExtractedInfoGridProps> = ({ fields, onUpdateField }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftValue, setDraftValue] = useState('');

  const startEdit = (field: ExtractedField) => {
    setEditingId(field.id);
    setDraftValue(field.value);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraftValue('');
  };

  const saveEdit = (fieldId: string) => {
    const trimmed = draftValue.trim();
    if (trimmed && onUpdateField) {
      onUpdateField(fieldId, trimmed);
    }
    setEditingId(null);
    setDraftValue('');
  };

  return (
    <div className="bg-surface rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-whisper">
      <h4 className="font-bold text-charcoal text-base flex items-center gap-2 mb-1 pb-3 border-b border-slate-100">
        <FileSearch className="w-5 h-5 text-brand-600" />
        <span>Extracted Key Property & Contract Data</span>
      </h4>
      {onUpdateField && (
        <p className="text-[11px] text-steel mt-2 mb-3">
          Spot something extracted incorrectly? Click the pencil to correct it.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {fields.map((field) => {
          const isEditing = editingId === field.id;
          return (
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
                    {onUpdateField && !isEditing && (
                      <button
                        type="button"
                        onClick={() => startEdit(field)}
                        className="p-0.5 text-steel hover:text-brand-600 transition-colors"
                        title="Correct this value"
                        aria-label={`Edit ${field.label}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      autoFocus
                      type="text"
                      value={draftValue}
                      onChange={(e) => setDraftValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(field.id);
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      className="flex-1 min-w-0 text-sm font-semibold text-charcoal bg-white border border-brand-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <button
                      type="button"
                      onClick={() => saveEdit(field.id)}
                      className="p-1 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex-shrink-0"
                      title="Save"
                      aria-label="Save"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="p-1 rounded-lg bg-slate-100 text-steel hover:bg-slate-200 flex-shrink-0"
                      title="Cancel"
                      aria-label="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <p className="text-sm font-semibold text-charcoal leading-snug">
                    {field.value}
                  </p>
                )}
              </div>

              {field.confidence !== undefined && !isEditing && (
                <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-steel">
                  <span>Extraction Confidence</span>
                  <span className="font-mono font-bold text-brand-700">
                    {(field.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
