import React from 'react';

export default function RightPanel({ selectedView, stats, automationStatus, extractionStats, reviewQueue, aiBriefing = '', onRunBriefing, onAskOpen, onToggleAutomation }) {
  const recommendations = [
    {
      icon: 'mail_outline',
      color: 'bg-amber-100 text-amber-700',
      text: 'Unsubscribe from inactive newsletters'
    },
    {
      icon: 'folder_open',
      color: 'bg-slate-100 text-slate-800',
      text: "Create a 'Weekly Digest' folder for low-priority threads"
    },
    {
      icon: 'timer_off',
      color: 'bg-emerald-100 text-emerald-700',
      text: "Auto-archive 'Naukri' threads after 3 days"
    }
  ];

  return (
    <div className="col-span-4 flex flex-col gap-6">
      <div className="rounded-[32px] bg-white/90 border border-slate-200/75 shadow-sm sticky top-24 p-6 overflow-hidden">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-on-surface-variant">AI Cleanup Strategy</p>
            <h3 className="mt-3 text-3xl font-bold text-primary">{selectedView === 'Archive' ? 'Archive Review' : 'Inbox Intelligence'}</h3>
          </div>
          <button
            onClick={onAskOpen}
            className="rounded-full bg-primary px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-sm hover:bg-primary/90"
          >
            Ask InBoxIQ
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl bg-surface p-4">
            <p className="text-[10px] uppercase tracking-[0.25em] text-on-surface-variant">Processed</p>
            <p className="mt-2 text-3xl font-semibold text-primary">{stats?.total_processed ?? 0}</p>
          </div>
          <div className="rounded-3xl bg-surface p-4">
            <p className="text-[10px] uppercase tracking-[0.25em] text-on-surface-variant">Noise</p>
            <p className="mt-2 text-3xl font-semibold text-amber-700">{stats?.noise_count ?? 0}</p>
          </div>
          <div className="rounded-3xl bg-surface p-4">
            <p className="text-[10px] uppercase tracking-[0.25em] text-on-surface-variant">Needs reply</p>
            <p className="mt-2 text-3xl font-semibold text-rose-700">{stats?.needs_reply ?? 0}</p>
          </div>
          <div className="rounded-3xl bg-surface p-4">
            <p className="text-[10px] uppercase tracking-[0.25em] text-on-surface-variant">Automated</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-700">{automationStatus?.automation_active ? 'On' : 'Off'}</p>
          </div>
        </div>

        <div className="mt-6 rounded-3xl bg-slate-50 p-5 border border-slate-200">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-on-surface-variant">Workspace insight</p>
              <p className="mt-2 text-sm text-on-surface">AI is now curating noise and giving you one-click actions in the sidebar and inbox.</p>
            </div>
            <button
              onClick={onRunBriefing}
              className="rounded-full bg-primary px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white hover:bg-primary/90"
            >
              Run Briefing
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 mb-4">
            <div className="rounded-3xl bg-white p-4 border border-slate-200">
              <p className="text-[10px] uppercase tracking-[0.18em] text-on-surface-variant mb-2">Extraction count</p>
              <p className="text-2xl font-semibold text-primary">{extractionStats?.total_extractions ?? 0}</p>
            </div>
            <div className="rounded-3xl bg-white p-4 border border-slate-200">
              <p className="text-[10px] uppercase tracking-[0.18em] text-on-surface-variant mb-2">Review queue</p>
              <p className="text-2xl font-semibold text-rose-700">{reviewQueue?.length ?? 0}</p>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-4 border border-slate-200">
            <p className="text-xs uppercase tracking-[0.18em] text-on-surface-variant mb-2">Latest AI Briefing</p>
            {aiBriefing ? (
              <p className="text-sm leading-6 text-on-surface">{aiBriefing}</p>
            ) : (
              <p className="text-sm text-on-surface-variant">No briefing generated yet. Use the button above to summarize your inbox.</p>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-3xl bg-white p-5 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-on-surface-variant">Review queue</p>
              <p className="mt-2 text-sm text-on-surface-variant">Low confidence items that need a human check.</p>
            </div>
            <span className="rounded-full bg-rose-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-700">{reviewQueue?.length ?? 0}</span>
          </div>
          {reviewQueue?.length > 0 ? (
            <div className="space-y-3">
              {reviewQueue.slice(0, 3).map((item, idx) => (
                <div key={idx} className="rounded-3xl bg-slate-50 p-4 border border-slate-200">
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-2 text-xs text-on-surface-variant">Type: {item.type || 'unknown'}</p>
                  <div className="mt-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    <span>Confidence: {item.confidence ?? 0}%</span>
                    {item.priority && <span>Priority: {item.priority}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant">Your model is stable — no review items pending right now.</p>
          )}
        </div>

        <div className="mt-6">
          <h4 className="text-[10px] uppercase tracking-[0.24em] text-on-surface-variant mb-3">Recommended actions</h4>
          <div className="flex flex-col gap-3">
            {recommendations.map((rec, idx) => (
              <div key={idx} className={`flex items-center gap-3 rounded-3xl border border-slate-200 bg-white p-4 ${rec.color}`}>
                <span className="material-symbols-outlined text-xl">{rec.icon}</span>
                <p className="text-sm font-semibold text-slate-900">{rec.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
