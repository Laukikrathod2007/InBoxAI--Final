import { useEffect, useRef, useState } from 'react';
import { ArrowRight, EyeOff, Github, ShieldCheck, Undo2, Lock } from 'lucide-react';
import Mascot from './Mascot';
import ProductMock from './ProductMock';
import { REPO } from './data';
import { prefersReduced, useScrollProgress } from './motion';

const WORDS = [
  { w: 'private', Icon: Lock, tone: 'bg-violet-100 text-violet-700', chip: 'bg-violet-600' },
  { w: 'honest', Icon: ShieldCheck, tone: 'bg-emerald-100 text-emerald-700', chip: 'bg-emerald-500' },
  { w: 'quiet', Icon: EyeOff, tone: 'bg-sky-100 text-sky-700', chip: 'bg-sky-500' },
  { w: 'undoable', Icon: Undo2, tone: 'bg-amber-100 text-amber-800', chip: 'bg-amber-500' },
];

function WordPill() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (prefersReduced()) return undefined;
    const t = setInterval(() => setI((n) => (n + 1) % WORDS.length), 2400);
    return () => clearInterval(t);
  }, []);
  const { w, Icon, tone, chip } = WORDS[i];
  return (
    <span className={`relative mx-1 inline-flex items-center gap-2 rounded-2xl py-1 pl-1 pr-3.5 align-middle transition-colors duration-500 sm:gap-2.5 sm:rounded-[22px] sm:pl-1.5 sm:pr-4 ${tone}`}>
      <span key={`i-${w}`} className={`animate-pop grid h-8 w-8 shrink-0 place-items-center rounded-xl text-white sm:h-11 sm:w-11 sm:rounded-2xl ${chip}`}>
        <Icon className="h-4 w-4 sm:h-6 sm:w-6" aria-hidden="true" />
      </span>
      <span key={w} className="animate-word inline-block">{w}</span>
    </span>
  );
}

const FLOATERS = [
  { label: 'Invoice #1004', sub: 'Needs you', cls: 'left-[4%] top-[24%] bg-emerald-50 text-emerald-800 ring-emerald-100', depth: 28, rot: -6 },
  { label: '30% off today', sub: 'Hidden', cls: 'right-[5%] top-[20%] bg-white text-slate-600 ring-slate-200', depth: 40, rot: 5 },
  { label: 'New sign-in', sub: 'Review · 55%', cls: 'left-[7%] top-[50%] bg-amber-50 text-amber-800 ring-amber-100', depth: 52, rot: 4 },
  { label: 'Weekly digest', sub: 'Hidden', cls: 'right-[7%] top-[46%] bg-white text-slate-600 ring-slate-200', depth: 22, rot: -4 },
];

export default function Hero() {
  const stage = useRef(null);
  useScrollProgress(stage, { mode: 'through' });

  return (
    <section className="relative -mt-20 overflow-hidden pt-20">
      <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_70%_55%_at_50%_0%,black,transparent)]" aria-hidden="true" />
      <div className="parallax-blob absolute left-1/2 top-0 h-[520px] w-[1000px] -translate-x-1/2 rounded-full bg-gradient-to-br from-violet-300/45 via-fuchsia-200/30 to-sky-200/45 blur-3xl" aria-hidden="true" />

      {/* Layered parallax: floating email chips move at different depths with the pointer */}
      <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden="true">
        {FLOATERS.map((f) => (
          <div key={f.label} className={`floater absolute rounded-2xl px-4 py-2.5 shadow-lg ring-1 ${f.cls}`} style={{ '--d': f.depth, '--r': `${f.rot}deg` }}>
            <p className="text-[12px] font-semibold">{f.label}</p>
            <p className="text-[10px] font-medium opacity-70">{f.sub}</p>
          </div>
        ))}
      </div>

      <div className="relative mx-auto max-w-6xl px-6 pb-10 pt-16 text-center sm:pt-20">
        <a href="#results" className="group mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/85 py-1 pl-1 pr-3 text-xs font-medium text-slate-600 shadow-sm backdrop-blur hover:border-slate-300">
          <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-white">Measured</span>
          0% important mail hidden on 50 real emails
          <ArrowRight size={12} className="transition group-hover:translate-x-0.5" aria-hidden="true" />
        </a>

        <h1 className="mx-auto max-w-5xl text-[34px] font-extrabold leading-[1.15] tracking-[-0.04em] text-slate-950 sm:text-[52px] sm:leading-[1.1] lg:text-[62px]">
          <span className="sr-only">The private inbox firewall that runs on your computer</span>
          <span aria-hidden="true">
            The <WordPill /> inbox
            <br />
            that lives on your laptop
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-[17px]">
          InBoxIQ sorts Gmail with an AI model running on your own computer. It shows you what needs you,
          hides what doesn&apos;t, and asks before it guesses.
        </p>

        <div className="mx-auto mt-9 flex w-full max-w-sm flex-col gap-2 rounded-3xl border border-slate-200 bg-white/80 p-2 shadow-sm backdrop-blur sm:w-fit sm:max-w-none sm:flex-row sm:rounded-full sm:p-1.5">
          <a href="#/app" className="btn-sheen group inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800">
            Try the live demo <ArrowRight size={16} className="transition group-hover:translate-x-0.5" aria-hidden="true" />
          </a>
          <a href={REPO} className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-100">
            <Github size={16} aria-hidden="true" /> Star on GitHub
          </a>
        </div>
        <p className="mt-4 text-xs text-slate-500">Free · Open source · Works offline with Ollama</p>

        {/* 3D card zoom: the product window flattens and grows as you scroll */}
        <div ref={stage} className="relative mx-auto mt-16 max-w-5xl text-left [perspective:1400px]">
          <Mascot className="absolute -right-1 -top-12 z-10 w-16 sm:-right-6 sm:-top-16 sm:w-24" wave />
          <div className="zoom-card">
            <ProductMock />
          </div>
        </div>
      </div>
    </section>
  );
}
