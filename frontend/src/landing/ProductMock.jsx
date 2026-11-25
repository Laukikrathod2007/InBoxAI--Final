import { EyeOff, Inbox, ShieldAlert } from 'lucide-react';

// A static, illustrative product window. Rows are from the synthetic test mailbox.
const COLUMNS = [
  {
    title: 'Needs you', icon: Inbox, tone: 'text-emerald-700 bg-emerald-50',
    rows: [
      ['Dana Cole', 'Contract draft for your signature'],
      ['Accounts', 'Invoice #1004 for April'],
      ['Recruiter', 'Interview schedule for ML role'],
    ],
  },
  {
    title: 'Review', icon: ShieldAlert, tone: 'text-amber-700 bg-amber-50',
    rows: [
      ['Jira', 'PLAT-412 assigned to you'],
      ['Bank Security', 'New sign-in to your account'],
    ],
  },
  {
    title: 'Hidden today', icon: EyeOff, tone: 'text-slate-600 bg-slate-100',
    rows: [
      ['Shop Deals', '30% off your next order'],
      ['LinkedIn', '7 new jobs for you'],
      ['Quora Digest', 'Top stories for you'],
    ],
  },
];

export default function ProductMock() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_30px_80px_-20px_rgba(15,23,42,0.25)] overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-rose-300" />
        <span className="h-3 w-3 rounded-full bg-amber-300" />
        <span className="h-3 w-3 rounded-full bg-emerald-300" />
        <span className="ml-3 rounded-md bg-white px-3 py-1 text-[11px] font-medium text-slate-400 border border-slate-200">
          127.0.0.1:8001
        </span>
        <span className="ml-auto rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold text-indigo-700">
          Assist mode · Gmail unchanged
        </span>
      </div>
      <div className="grid gap-px bg-slate-100 sm:grid-cols-3">
        {COLUMNS.map(({ title, icon: Icon, tone, rows }) => (
          <div key={title} className="bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ${tone}`}>
                <Icon size={15} aria-hidden="true" />
              </span>
              <span className="text-sm font-semibold text-slate-900">{title}</span>
              <span className="ml-auto text-xs font-medium text-slate-400">{rows.length}</span>
            </div>
            <ul className="space-y-2">
              {rows.map(([from, subject]) => (
                <li key={subject} className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5">
                  <p className="text-[11px] font-semibold text-slate-500">{from}</p>
                  <p className="truncate text-[13px] font-medium text-slate-800">{subject}</p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
