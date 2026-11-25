import { Archive, Inbox, VolumeX } from 'lucide-react';

const STATUS = {
  REPLY: ['Reply', 'bg-violet-50 text-violet-700'],
  TASK: ['Task', 'bg-blue-50 text-blue-700'],
  SCHEDULE: ['Meeting', 'bg-cyan-50 text-cyan-700'],
  REVIEW: ['Review', 'bg-amber-50 text-amber-700'],
  PROCESS_INVOICE: ['Invoice', 'bg-emerald-50 text-emerald-700'],
  PROCESS_RESUME: ['Resume', 'bg-emerald-50 text-emerald-700'],
  FYI_KNOWLEDGE: ['FYI', 'bg-slate-100 text-slate-600'],
  ARCHIVE: ['Hidden', 'bg-slate-100 text-slate-500'],
  noise: ['Muted', 'bg-slate-100 text-slate-500'],
  archived: ['Done', 'bg-slate-100 text-slate-500'],
};

const PRIORITY_DOT = { urgent: 'bg-rose-500', high: 'bg-rose-400', medium: 'bg-amber-400', low: 'bg-slate-300' };

function senderName(s = '') {
  const name = s.replace(/<.*>/, '').replace(/"/g, '').trim();
  return name || s || 'Unknown sender';
}

function when(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const today = new Date().toDateString() === d.toDateString();
  return today ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function Skeleton() {
  return (
    <ul className="divide-y divide-slate-100" aria-busy="true" aria-label="Loading messages">
      {[0, 1, 2, 3, 4].map((i) => (
        <li key={i} className="flex gap-4 px-5 py-4">
          <div className="h-9 w-9 animate-pulse rounded-full bg-slate-100" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/4 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function EmailList({ emails = [], onArchive, onMute, isLoading }) {
  if (isLoading) return <Skeleton />;

  if (!emails.length) {
    return (
      <div className="flex flex-col items-center px-6 py-16 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400"><Inbox size={20} aria-hidden="true" /></span>
        <p className="mt-4 text-sm font-semibold text-slate-900">Nothing here</p>
        <p className="mt-1 max-w-xs text-sm text-slate-500">New mail appears after the next sync. You can also press Sync now in the sidebar.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {emails.map((email) => {
        const [label, tone] = STATUS[email.status] || [email.status || 'Processed', 'bg-slate-100 text-slate-600'];
        const name = senderName(email.sender);
        const dot = PRIORITY_DOT[(email.priority || '').toLowerCase()];
        return (
          <li key={email.id} className="group flex items-start gap-4 px-5 py-4 transition hover:bg-slate-50/80">
            <span className="relative mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-bold uppercase text-slate-600">
              {name.substring(0, 1)}
              {dot && <span className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white ${dot}`} title={`${email.priority} priority`} />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-[13px] font-semibold text-slate-900">{name}</span>
                <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${tone}`}>{label}</span>
                <span className="ml-auto shrink-0 text-xs text-slate-400">{when(email.received_at || email.last_updated)}</span>
              </div>
              <p className="mt-0.5 truncate text-[13px] font-medium text-slate-800">{email.subject || 'No subject'}</p>
              {email.summary && <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-slate-500">{email.summary}</p>}
            </div>
            {onArchive && onMute && (
              <div className="flex shrink-0 gap-1 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                <button type="button" onClick={() => onArchive(email.id)} aria-label={`Mark done: ${email.subject || 'email'}`}
                  className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm">
                  <Archive size={15} aria-hidden="true" />
                </button>
                <button type="button" onClick={() => onMute(email.id)} aria-label={`Mute: ${email.subject || 'email'}`}
                  className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm">
                  <VolumeX size={15} aria-hidden="true" />
                </button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
