import { Archive, BellRing, FileText, Hourglass, Lightbulb, Play, Settings, ShieldCheck, VolumeX } from 'lucide-react';

export function BrandLogo({ className = '' }) {
  return (
    <span className={`flex items-center gap-2.5 select-none ${className}`}>
      <svg viewBox="0 0 100 100" className="h-7 w-7" aria-hidden="true">
        <defs>
          <linearGradient id="iq-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
        </defs>
        <path d="M 50,0 C 50,35 65,50 100,50 C 65,50 50,65 50,100 C 50,65 35,50 0,50 C 35,50 50,35 50,0 Z" fill="url(#iq-grad)" />
      </svg>
      <span className="text-[17px] font-bold tracking-tight text-slate-900">
        InBox<span className="text-violet-600">IQ</span>
      </span>
    </span>
  );
}

const NAV = [
  { id: 'ActionRequired', label: 'Needs you', icon: BellRing },
  { id: 'WaitingFYI', label: 'FYI', icon: Hourglass },
  { id: 'NoiseAutomated', label: 'Hidden', icon: VolumeX },
  { id: 'Documents', label: 'Documents', icon: FileText },
  { id: 'Archive', label: 'Archive & activity', icon: Archive },
];

const MORE = [
  { id: 'AIBriefing', label: 'Daily briefing', icon: Lightbulb },
  { id: 'Rules', label: 'Rules', icon: ShieldCheck },
  { id: 'Settings', label: 'Settings', icon: Settings },
];

function NavItem({ item, active, count, onNavigate }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={() => onNavigate(item.id)}
      aria-current={active ? 'page' : undefined}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition ${
        active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <Icon size={16} aria-hidden="true" />
      <span className="flex-1">{item.label}</span>
      {count > 0 && (
        <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
          {count}
        </span>
      )}
    </button>
  );
}

export default function SideBar({ userProfile, selectedView, onNavigate, onProcessNow, automationStatus, onToggleAutomation, counts }) {
  const running = automationStatus?.automation_active;
  const lastSync = automationStatus?.last_cycle_at
    ? new Date(automationStatus.last_cycle_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'never';

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white px-3 py-4">
      <a href="#/" className="mb-6 px-2" aria-label="Back to InBoxIQ home"><BrandLogo /></a>

      <nav aria-label="Inbox views" className="space-y-0.5">
        {NAV.map((item) => (
          <NavItem key={item.id} item={item} active={selectedView === item.id} count={counts?.[item.id]} onNavigate={onNavigate} />
        ))}
      </nav>
      <p className="mb-1 mt-6 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">More</p>
      <nav aria-label="Tools" className="space-y-0.5">
        {MORE.map((item) => (
          <NavItem key={item.id} item={item} active={selectedView === item.id} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="mt-auto space-y-3">
        <div className="rounded-xl border border-slate-200 p-3">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${running ? 'bg-emerald-500' : 'bg-slate-300'}`} aria-hidden="true" />
            <span className="text-xs font-semibold text-slate-800">Worker {running ? 'running' : 'stopped'}</span>
            <button
              type="button"
              onClick={onToggleAutomation}
              className="ml-auto text-xs font-medium text-violet-600 hover:text-violet-800"
            >
              {running ? 'Stop' : 'Start'}
            </button>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Last sync: {lastSync}</p>
          <button
            type="button"
            onClick={onProcessNow}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-100 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-200"
          >
            <Play size={13} aria-hidden="true" /> Sync now
          </button>
        </div>

        <div className="flex items-center gap-3 px-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-blue-500 text-xs font-bold uppercase text-white">
            {userProfile?.name ? userProfile.name.substring(0, 2) : '?'}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-xs font-semibold text-slate-900">{userProfile?.name || 'Not connected'}</span>
            <span className="block truncate text-[11px] text-slate-500">{userProfile?.email || 'Gmail not connected'}</span>
          </span>
        </div>
      </div>
    </aside>
  );
}
