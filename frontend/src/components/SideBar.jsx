import React from 'react';

export function BrandLogo({ className = "" }) {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* 4-pointed Star SVG Icon */}
      <div className="relative flex items-center justify-center w-8 h-8">
        <svg viewBox="0 0 100 100" className="w-8 h-8 drop-shadow-[0_0_8px_rgba(99,102,241,0.3)]">
          <defs>
            <linearGradient id="star-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" /> {/* Purple */}
              <stop offset="60%" stopColor="#3b82f6" /> {/* Blue */}
              <stop offset="100%" stopColor="#60a5fa" /> {/* Light Blue */}
            </linearGradient>
          </defs>
          {/* 4-pointed curved star shape */}
          <path
            d="M 50,0 C 50,35 65,50 100,50 C 65,50 50,65 50,100 C 50,65 35,50 0,50 C 35,50 50,35 50,0 Z"
            fill="url(#star-grad)"
          />
          {/* Small gold sparkle star next to it */}
          <path
            d="M 80,12 C 80,17 82,19 86,19 C 82,19 80,21 80,26 C 80,21 78,19 74,19 C 78,19 80,17 80,12 Z"
            fill="#fbbf24"
          />
        </svg>
      </div>
      
      {/* Brand Text */}
      <div className="flex flex-col leading-none">
        <div className="flex items-baseline">
          <span className="text-xl font-bold tracking-tight text-slate-800">InBox</span>
          <span className="text-xl font-extrabold tracking-tight text-blue-600">IQ</span>
        </div>
        <span className="text-[9px] uppercase tracking-[0.2em] text-slate-400 font-bold mt-1">
          AI Work Operating System
        </span>
      </div>
    </div>
  );
}

export default function SideBar({ userProfile, selectedView, onNavigate, onProcessNow, automationStatus, onToggleAutomation }) {
  const navItems = [
    { icon: 'notifications_active', label: 'Action Required', id: 'ActionRequired', count: 6 },
    { icon: 'hourglass_empty', label: 'Waiting / FYI', id: 'WaitingFYI', count: 12 },
    { icon: 'folder_open', label: 'Documents', id: 'Documents', count: 18 },
    { icon: 'volume_off', label: 'Noise / Automated', id: 'NoiseAutomated', count: 132 },
    { icon: 'lightbulb', label: 'AI Briefing', id: 'AIBriefing', badge: 'New' },
    { icon: 'settings', label: 'Settings', id: 'Settings' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-72 bg-white text-slate-800 flex flex-col p-5 shadow-sm z-50 border-r border-slate-200 font-sans select-none">
      
      {/* 1. Header Brand Logo */}
      <div className="px-2 mb-6 mt-2">
        <BrandLogo />
      </div>

      {/* 2. Premium White User Profile Widget (Conforming to Image 5) */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl mb-6 shadow-sm">
        <div className="text-[10px] uppercase font-extrabold tracking-[0.2em] text-slate-400 mb-3">Profile</div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-12 w-12 rounded-full bg-slate-500 text-white font-extrabold flex items-center justify-center text-sm shadow-inner uppercase">
              {userProfile?.name ? userProfile.name.substring(0, 2) : 'RA'}
            </div>
            <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white"></span>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-slate-800 truncate">{userProfile?.name || 'Rathodlaukik184'}</h2>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">{userProfile?.email || 'rathodlaukik184@gmail.com'}</p>
          </div>
        </div>
        
        {/* Messages & Threads Counts */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-center border-t border-slate-100 pt-3">
          <div>
            <p className="text-[9px] uppercase font-extrabold tracking-[0.2em] text-slate-400">Messages</p>
            <p className="text-sm font-bold text-slate-700 mt-0.5">{userProfile?.total_messages || '10,317'}</p>
          </div>
          <div className="border-l border-slate-100">
            <p className="text-[9px] uppercase font-extrabold tracking-[0.2em] text-slate-400">Threads</p>
            <p className="text-sm font-bold text-slate-700 mt-0.5">{userProfile?.labels || '9,568'}</p>
          </div>
        </div>
      </div>

      {/* 3. Navigation Links */}
      <nav className="flex-1 flex flex-col gap-1.5">
        {navItems.map((item) => {
          const isActive = selectedView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`group flex items-center justify-between rounded-full px-4 py-2.5 text-left transition-all duration-200 border ${
                isActive
                  ? 'bg-slate-100 border-slate-300 text-slate-900 font-bold shadow-sm'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`material-symbols-outlined text-[20px] transition-colors ${
                  isActive ? 'text-slate-800 font-semibold' : 'text-slate-400 group-hover:text-slate-600'
                }`}>{item.icon}</span>
                <span className="text-[13px] font-semibold">{item.label}</span>
              </div>
              
              {/* Badge or Counts */}
              {item.count && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-slate-200 text-slate-800' : 'bg-slate-100 text-slate-500'
                }`}>
                  {item.count}
                </span>
              )}
              {item.badge && (
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* 4. Settings & Automation Actions */}
      <div className="mt-auto space-y-4 pt-4 border-t border-slate-100">
        
        {/* Automation Status Indicator (Pill Banner at the bottom from Image 5) */}
        <button
          onClick={onToggleAutomation}
          className={`w-full py-2.5 px-4 rounded-full font-bold text-center text-xs tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 ${
            automationStatus?.cycle_in_progress || automationStatus?.automation_active
              ? 'bg-[#0F9D58] hover:bg-[#0B8043] text-white'
              : 'bg-slate-200 hover:bg-slate-300 text-slate-600'
          }`}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-white"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
          {automationStatus?.cycle_in_progress || automationStatus?.automation_active ? 'AUTOMATION ON' : 'AUTOMATION OFF'}
        </button>

        {/* Live Sync Status Info */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 shadow-sm text-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                Live Sync
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                Worker status: <span className="font-semibold text-[#0F9D58]">Running</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Last sync: 18 sec ago
              </p>
            </div>
            
            {/* Minimal SVG soundwave graphics */}
            <div className="flex items-center gap-0.5 h-6">
              <span className="w-0.5 bg-blue-500 rounded-full h-4 animate-pulse"></span>
              <span className="w-0.5 bg-blue-400 rounded-full h-6 animate-pulse delay-75"></span>
              <span className="w-0.5 bg-blue-500 rounded-full h-3 animate-pulse delay-150"></span>
            </div>
          </div>
          
          <button
            onClick={onProcessNow}
            className="w-full mt-3 rounded-xl bg-white border border-slate-200 text-slate-700 py-2 text-xs font-semibold hover:bg-slate-50 transition flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-xs">play_arrow</span>
            Run Processing Now
          </button>
        </div>
      </div>
    </aside>
  );
}
