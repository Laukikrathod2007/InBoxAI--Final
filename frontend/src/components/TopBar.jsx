import { useEffect, useRef, useState } from 'react';
import { PenSquare, RefreshCw, Search, Sparkles } from 'lucide-react';

const TITLES = {
  ActionRequired: 'Needs you', WaitingFYI: 'FYI', NoiseAutomated: 'Hidden', Documents: 'Documents',
  Archive: 'Archive & activity', AIBriefing: 'Daily briefing', Rules: 'Rules', Settings: 'Settings', Search: 'Search',
};

export default function TopBar({ onRefresh, onSearch, activeSection, mode, onAsk, onCompose }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  // Ctrl/Cmd + K focuses search.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const assist = (mode || 'assist') !== 'autonomous';

  return (
    <header className="fixed left-64 right-0 top-0 z-40 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/85 px-6 backdrop-blur">
      <h1 className="text-[15px] font-semibold text-slate-900">{TITLES[activeSection] || 'Inbox'}</h1>
      <span
        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${assist ? 'bg-indigo-50 text-indigo-700' : 'bg-rose-50 text-rose-700'}`}
        title={assist ? 'Gmail is not changed. Actions are logged as a dry run.' : 'Autopilot changes Gmail. Every action can be undone.'}
      >
        {assist ? 'Assist mode · Gmail unchanged' : 'Autonomous · changes Gmail'}
      </span>

      <form
        role="search"
        onSubmit={(e) => { e.preventDefault(); onSearch(query.trim()); }}
        className="relative ml-auto w-full max-w-sm"
      >
        <label htmlFor="global-search" className="sr-only">Search mail</label>
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <input
          id="global-search"
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search mail"
          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-14 text-[13px] outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
        />
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 text-[10px] font-medium text-slate-400">Ctrl K</kbd>
      </form>

      <button
        type="button"
        onClick={onCompose}
        className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[13px] font-semibold text-slate-800 hover:bg-slate-50"
      >
        <PenSquare size={14} aria-hidden="true" /> Compose
      </button>
      <button
        type="button"
        onClick={onAsk}
        className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-[13px] font-semibold text-white hover:bg-slate-700"
      >
        <Sparkles size={14} aria-hidden="true" /> Ask
      </button>
      <button
        type="button"
        onClick={onRefresh}
        aria-label="Refresh"
        className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
      >
        <RefreshCw size={15} aria-hidden="true" />
      </button>
    </header>
  );
}
