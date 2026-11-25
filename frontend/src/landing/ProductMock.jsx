import { EyeOff, Inbox, ShieldAlert, Sparkles } from 'lucide-react';
import { MAIL } from './data';

const BUCKETS = [
  { id: 'needs', title: 'Needs you', Icon: Inbox, tone: 'bg-emerald-50 text-emerald-700 ring-emerald-100', card: 'border-emerald-100 bg-emerald-50/50' },
  { id: 'review', title: 'Review', Icon: ShieldAlert, tone: 'bg-amber-50 text-amber-700 ring-amber-100', card: 'border-amber-100 bg-amber-50/50' },
  { id: 'hidden', title: 'Hidden', Icon: EyeOff, tone: 'bg-slate-100 text-slate-600 ring-slate-200', card: 'border-slate-100 bg-slate-50' },
];

/** Illustrative app window. `done` = how many emails have been sorted so far. */
export default function ProductMock({ done = MAIL.length }) {
  const incoming = MAIL.slice(done);
  const sorted = MAIL.slice(0, done);
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_50px_120px_-40px_rgba(76,29,149,0.5)]">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-rose-300" />
        <span className="h-3 w-3 rounded-full bg-amber-300" />
        <span className="h-3 w-3 rounded-full bg-emerald-300" />
        <span className="ml-3 truncate rounded-md border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-400">127.0.0.1:8001</span>
        <span className="ml-auto hidden rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-semibold text-violet-700 sm:inline">Assist mode · Gmail unchanged</span>
      </div>
      <div className="grid gap-px bg-slate-100 md:grid-cols-[1fr_2fr]">
        <div className="bg-white p-3 sm:p-4">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles size={15} className="text-violet-600" aria-hidden="true" />
            <span className="text-sm font-semibold text-slate-900">Incoming</span>
            <span className="ml-auto text-xs font-medium tabular-nums text-slate-400">{incoming.length}</span>
          </div>
          <ul className="space-y-2">
            {incoming.slice(0, 3).map((m, i) => (
              <li key={m.subject} className={`rounded-xl border px-3 py-2 transition-colors duration-300 ${i === 0 ? 'border-violet-200 bg-violet-50/70' : 'border-slate-100 bg-slate-50/60'}`}>
                <p className="text-[11px] font-semibold text-slate-500">{m.from}</p>
                <p className="truncate text-[13px] font-medium text-slate-800">{m.subject}</p>
                {i === 0 && (
                  <p className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold text-violet-600">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-500" /> Local model is reading
                  </p>
                )}
              </li>
            ))}
            {!incoming.length && (
              <li className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 px-3 py-5 text-center text-xs font-medium text-emerald-700">
                All caught up · 0 important emails hidden
              </li>
            )}
          </ul>
        </div>
        <div className="grid grid-cols-3 gap-px bg-slate-100">
          {BUCKETS.map(({ id, title, Icon, tone, card }) => {
            const items = sorted.filter((m) => m.to === id);
            return (
              <div key={id} className="min-h-[180px] bg-white p-2.5 sm:min-h-[250px] sm:p-4">
                <div className="mb-2 flex items-center gap-1.5 sm:mb-3 sm:gap-2">
                  <span className={`hidden h-7 w-7 items-center justify-center rounded-lg ring-1 sm:inline-flex ${tone}`}><Icon size={14} aria-hidden="true" /></span>
                  <span className="text-xs font-semibold text-slate-900 sm:text-sm">{title}</span>
                  <span className="ml-auto text-xs font-medium tabular-nums text-slate-400">{items.length}</span>
                </div>
                <ul className="space-y-1.5 sm:space-y-2">
                  {items.map((m) => (
                    <li key={m.subject} className={`animate-drop rounded-lg border px-2 py-1.5 sm:rounded-xl sm:px-3 sm:py-2 ${card}`}>
                      <p className="truncate text-[10px] font-semibold text-slate-500 sm:text-[11px]">{m.from}</p>
                      <p className="truncate text-[11px] font-medium text-slate-800 sm:text-[12px]">{m.subject}</p>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
