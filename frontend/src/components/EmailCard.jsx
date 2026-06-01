import React, { useState } from 'react';

export default function EmailCard({
  title,
  count,
  icon,
  summary,
  badge,
  actions = [],
  bgColor = 'bg-surface-container-lowest',
  iconBg = 'bg-surface-container-high',
  iconColor = 'text-primary',
  urgencyClass = '',
  onAction,
  documentData = null, // New: extracted document data
}) {
  const [isHovered, setIsHovered] = useState(false);

  // Format document data for display
  const formatDocumentData = (data) => {
    if (!data || !data.extracted_data) return null;

    const extracted = data.extracted_data;
    const highlights = [];

    if (data.document_type === 'invoice') {
      if (extracted.invoice_number) highlights.push(`#${extracted.invoice_number}`);
      if (extracted.total_amount) highlights.push(`$${extracted.total_amount}`);
      if (extracted.vendor_name) highlights.push(extracted.vendor_name);
    } else if (data.document_type === 'resume') {
      if (extracted.name) highlights.push(extracted.name);
      if (extracted.current_position) highlights.push(extracted.current_position);
      if (extracted.experience_years) highlights.push(`${extracted.experience_years}y exp`);
    } else if (data.document_type) {
      highlights.push(data.document_type.replace(/_/g, ' '));
      if (data.filename) highlights.push(data.filename);
    }

    return highlights.length > 0 ? highlights : null;
  };

  const documentHighlights = documentData ? formatDocumentData(documentData) : null;

  return (
    <div
      className={`${bgColor} p-6 rounded-[28px] border border-slate-200/20 shadow-sm hover:shadow-xl transition-all duration-300 group`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-3xl ${iconBg} flex items-center justify-center ${iconColor}`}>
            <span className="material-symbols-outlined text-3xl">{icon}</span>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-primary">
              {title} <span className="text-sm font-medium text-on-surface-variant">({count} emails)</span>
            </h3>
            <p className="mt-2 text-sm text-on-surface-variant">{summary}</p>

            {/* Document extraction highlights */}
            {documentHighlights && (
              <div className="mt-3 flex flex-wrap gap-2">
                {documentHighlights.map((highlight, index) => (
                  <span
                    key={index}
                    className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                  >
                    {highlight}
                  </span>
                ))}
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                  {documentData.confidence}% confidence
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {badge && (
            <span className="rounded-full bg-rose-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-rose-700">
              {badge}
            </span>
          )}
          {urgencyClass ? (
            <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] ${urgencyClass}`}>
              {count >= 20 ? 'High urgency' : count >= 8 ? 'Medium' : 'Low'}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 justify-end">
        {actions.map((action, idx) => (
          <button
            key={idx}
            onClick={() => onAction && onAction(action.action)}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${action.action === 'mute' ? 'bg-amber-100 text-amber-900 hover:bg-amber-200' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'}`}
          >
            {action.label}
          </button>
        ))}
        {isHovered && (
          <button className="rounded-full border border-slate-200 px-3 py-2 text-slate-500 hover:text-primary transition-colors">
            <span className="material-symbols-outlined">more_horiz</span>
          </button>
        )}
      </div>
    </div>
  );
}
