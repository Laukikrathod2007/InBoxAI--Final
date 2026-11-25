import { ArrowRight, Github } from 'lucide-react';
import { BrandLogo } from '../components/SideBar';
import { REPO } from './data';
import { useScrolled } from './motion';

/** Full-width bar at the top that tucks into a floating pill once you scroll. */
export default function Nav() {
  const scrolled = useScrolled(24);
  return (
    <header className="sticky top-0 z-50 px-3 pt-3">
      <nav
        aria-label="Main"
        className={`mx-auto flex h-14 items-center gap-6 rounded-full px-3 transition-all duration-500 ease-out sm:px-5 ${
          scrolled
            ? 'max-w-4xl border border-slate-200/80 bg-white/80 shadow-[0_12px_40px_-16px_rgba(15,23,42,0.35)] backdrop-blur-xl'
            : 'max-w-6xl border border-transparent bg-transparent'
        }`}
      >
        <a href="#/" aria-label="InBoxIQ home"><BrandLogo /></a>
        <div className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          <a href="#features" className="hover:text-slate-950">Features</a>
          <a href="#demo" className="hover:text-slate-950">How it works</a>
          <a href="#results" className="hover:text-slate-950">Results</a>
          <a href="#faq" className="hover:text-slate-950">FAQ</a>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <a href={REPO} aria-label="GitHub" className="grid h-9 w-9 place-items-center rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-950">
            <Github size={17} aria-hidden="true" />
          </a>
          <a href="#/app" className="group inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
            Live demo <ArrowRight size={14} className="transition group-hover:translate-x-0.5" aria-hidden="true" />
          </a>
        </div>
      </nav>
    </header>
  );
}
