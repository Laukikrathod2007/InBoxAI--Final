import React, { useState } from 'react';

export default function TopBar({ userProfile, onRefresh, onSearch, activeSection, onNavigate }) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    onSearch(searchQuery.trim());
  };

  const sections = [
    { id: 'Inbox', label: 'Focus', icon: 'center_focus_strong' },
    { id: 'Archive', label: 'Archive', icon: 'archive' },
    { id: 'Rules', label: 'Rules', icon: 'shield' },
  ];

  return (
    <header className="fixed top-0 left-72 right-0 h-20 bg-white flex items-center justify-between px-8 z-40 border-b border-slate-200 shadow-sm select-none">
      <div className="flex items-center gap-8">
        
        {/* 1. Pill-shaped Search Box with Distinct Border (Image 5 standard) */}
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <span className="absolute left-4 material-symbols-outlined text-slate-400 text-[18px]">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search signals..."
            className="w-[320px] rounded-full border border-slate-800 bg-white pl-11 pr-14 py-2 text-[13px] text-slate-800 placeholder-slate-400 outline-none transition-all focus:ring-4 focus:ring-slate-100 font-sans shadow-sm"
          />
          <span className="absolute right-3.5 px-2 py-0.5 rounded border border-slate-200 bg-white text-[10px] font-bold text-slate-400 tracking-wide font-sans shadow-sm pointer-events-none">
            ⌘ K
          </span>
        </form>

        {/* 2. Top Navigation Tabs (Pill Buttons) */}
        <nav className="hidden md:flex items-center gap-2">
          {sections.map((section) => {
            const isActive = activeSection === section.id || (section.id === 'Inbox' && activeSection === 'ActionRequired');
            return (
              <button
                key={section.id}
                onClick={() => onNavigate(section.id)}
                className={`rounded-full px-5 py-2 text-[13px] font-bold flex items-center gap-1.5 transition-all border ${
                  isActive
                    ? 'bg-slate-100 border-slate-300 text-slate-900 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{section.icon}</span>
                {section.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 3. Right side toolbar actions */}
      <div className="flex items-center gap-3">
        
        {/* Refresh button (Circle layout) */}
        <button
          onClick={onRefresh}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
          title="Refresh dashboard"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
        </button>

        {/* AI SORT (White Pill with Border) */}
        <button
          onClick={() => onNavigate('Inbox')}
          className="rounded-full bg-white text-slate-700 border border-slate-200 px-5 py-2 text-[12px] font-extrabold hover:bg-slate-50 transition flex items-center gap-1.5 shadow-sm active:scale-95"
        >
          <span className="material-symbols-outlined text-[14px] text-blue-500">auto_awesome</span>
          AI SORT
        </button>

        {/* User profile dropdown badge */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-full p-1 pr-2 shadow-sm cursor-pointer hover:bg-slate-50 transition">
          <div className="h-8 w-8 rounded-full bg-slate-500 text-white font-extrabold text-xs flex items-center justify-center uppercase shadow-inner">
            {userProfile?.name ? userProfile.name.substring(0, 2) : 'RA'}
          </div>
          <span className="material-symbols-outlined text-slate-400 text-[14px] ml-0.5">keyboard_arrow_down</span>
        </div>

      </div>
    </header>
  );
}
