// InBoxIQ's mascot: a small envelope guard holding a shield. Eyes follow the pointer.
export default function Mascot({ className = '', wave = false }) {
  return (
    <div className={`mascot-bob ${className}`} aria-hidden="true">
      <svg viewBox="0 0 160 150" className="h-auto w-full drop-shadow-[0_18px_22px_rgba(76,29,149,0.35)]">
        <defs>
          <linearGradient id="mascot-body" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#a78bfa" />
            <stop offset="1" stopColor="#6d28d9" />
          </linearGradient>
        </defs>
        <ellipse cx="80" cy="142" rx="44" ry="6" fill="#4c1d95" opacity="0.15" />
        <rect x="50" y="116" width="16" height="16" rx="8" fill="#5b21b6" />
        <rect x="94" y="116" width="16" height="16" rx="8" fill="#5b21b6" />
        <rect x="18" y="26" width="124" height="96" rx="28" fill="url(#mascot-body)" />
        <path d="M30 42 L80 80 L130 42" fill="none" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <g className="mascot-blink">
          <ellipse cx="60" cy="72" rx="12" ry="14" fill="#ffffff" />
          <ellipse cx="100" cy="72" rx="12" ry="14" fill="#ffffff" />
          <g className="mascot-eyes">
            <circle cx="60" cy="74" r="6" fill="#1e1b4b" />
            <circle cx="100" cy="74" r="6" fill="#1e1b4b" />
            <circle cx="62" cy="71" r="2" fill="#ffffff" />
            <circle cx="102" cy="71" r="2" fill="#ffffff" />
          </g>
        </g>
        <ellipse cx="40" cy="94" rx="8" ry="5" fill="#f9a8d4" opacity="0.75" />
        <ellipse cx="120" cy="94" rx="8" ry="5" fill="#f9a8d4" opacity="0.75" />
        <path d="M70 96 Q80 104 90 96" fill="none" stroke="#1e1b4b" strokeWidth="4" strokeLinecap="round" />
        <g transform="translate(134 102)">
          <g className={wave ? 'mascot-wave' : ''}>
            <path d="M0 -16 L13 -10 V1 C13 10 7 15 0 19 C-7 15 -13 10 -13 1 V-10 Z" fill="#34d399" stroke="#ffffff" strokeWidth="3" strokeLinejoin="round" />
            <path d="M-5 1 L-1 5 L6 -4" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </g>
      </svg>
    </div>
  );
}
