import React from 'react';

export default function EmailList({ emails = [], onArchive, onMute, isLoading }) {
  if (isLoading) {
    return <div className="py-12 text-center text-sm text-on-surface-variant">Loading messages...</div>;
  }

  if (!emails.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-surface p-8 text-center text-sm text-slate-500">
        No messages available yet. Try refreshing, running processing, or searching a keyword.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {emails.map((email) => (
        <div key={email.id} className="rounded-[28px] border border-slate-200 bg-surface p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                  {email.status || 'processed'}
                </span>
                <span className="text-xs text-on-surface-variant">
                  {(() => {
                    const timestamp = email.received_at || email.last_updated;
                    return timestamp ? new Date(timestamp).toLocaleString() : 'Unknown date';
                  })()}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-primary">{email.subject || email.summary || 'No subject'}</h3>
              <p className="text-sm text-on-surface-variant">
                {email.sender || (Array.isArray(email.participants) ? email.participants.join(', ') : email.participants) || 'Unknown sender'}
              </p>
            </div>
            {onArchive && onMute ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => onArchive(email.id)}
                className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Archive
              </button>
              <button
                onClick={() => onMute(email.id)}
                className="rounded-full bg-amber-100 px-4 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-200"
              >
                Mute
              </button>
            </div>
          ) : null}
          </div>
          {email.summary ? (
            <p className="mt-4 text-sm leading-6 text-on-surface-variant">{email.summary}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
