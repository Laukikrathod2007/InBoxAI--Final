import { useRef, useState } from 'react';
import { Check, Cloud, Cpu, EyeOff, Laptop, Lock, Mail, ShieldCheck, Undo2 } from 'lucide-react';
import ProductMock from './ProductMock';
import { MAIL } from './data';
import { useCountUp, useInView, useScrollProgress, useTyping } from './motion';
import { Reveal, Tilt } from './fx';

const H2 = 'text-3xl font-bold tracking-tight sm:text-[40px] sm:leading-[1.15]';

export function Eyebrow({ children, dark = false }) {
  return (
    <p className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${dark ? 'bg-white/10 text-violet-200' : 'bg-violet-50 text-violet-700'}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </p>
  );
}

/* ---------- Sideways text ---------- */
const BAND = ['Local-first', 'Dry run by default', 'One-click undo', 'Measured on real mail', 'Open source', 'No cloud needed', 'Asks before it guesses'];

export function SidewaysBand() {
  const ref = useRef(null);
  useScrollProgress(ref, { mode: 'through' });
  const row = (dir) => (
    <div className={`band-row flex w-max gap-4 ${dir}`} aria-hidden="true">
      {[...BAND, ...BAND].map((t, i) => (
        <span key={i} className="whitespace-nowrap text-3xl font-extrabold tracking-tight text-slate-950/90 sm:text-[44px]">
          {t}<span className="mx-4 text-violet-500">✦</span>
        </span>
      ))}
    </div>
  );
  return (
    <section ref={ref} aria-label="Highlights" className="overflow-hidden border-y border-slate-100 bg-white py-8">
      <p className="sr-only">{BAND.join(', ')}</p>
      {row('band-left')}
      <div className="mt-2 opacity-25">{row('band-right')}</div>
    </section>
  );
}

/* ---------- Scroll-triggered demo (pinned) ---------- */
const STEPS = [
  { t: 'Read', d: 'New mail is pulled from Gmail every minute.' },
  { t: 'Filter', d: 'Strict rules hide only mail they are sure about.' },
  { t: 'Understand', d: 'The local model writes a summary, a category and a confidence score.' },
  { t: 'Decide', d: 'Confident mail is sorted. Unsure mail goes to review.' },
  { t: 'Act or log', d: 'Assist mode only logs. Autonomous mode acts, with undo.' },
];

export function ScrollDemo() {
  const ref = useRef(null);
  const [done, setDone] = useState(0);
  useScrollProgress(ref, {
    mode: 'pin',
    reducedValue: 1,
    onChange: (p) => setDone(Math.round(Math.min(1, p / 0.9) * MAIL.length)),
  });
  const step = Math.min(STEPS.length - 1, Math.floor((done / MAIL.length) * STEPS.length));

  return (
    <section id="demo" ref={ref} className="relative bg-slate-50/70 lg:h-[240vh]">
      <div className="lg:sticky lg:top-0 lg:flex lg:h-screen lg:items-center">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-24 lg:grid-cols-[1fr_1.4fr] lg:items-center lg:py-0">
          <div>
            <Eyebrow>How it works</Eyebrow>
            <h2 className={`mt-4 ${H2}`}>Scroll, and watch it sort</h2>
            <p className="mt-3 text-sm font-medium text-slate-600">
              {done}/{MAIL.length} emails sorted · 0 important emails hidden
            </p>
            <ol className="mt-7 space-y-1.5">
              {STEPS.map(({ t, d }, i) => (
                <li key={t} className={`flex gap-4 rounded-2xl p-3 transition-all duration-300 ${i === step ? 'bg-white shadow-sm ring-1 ring-slate-200' : 'opacity-55'}`}>
                  <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold transition-colors ${i <= step ? 'bg-violet-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    {i < step ? <Check size={13} aria-hidden="true" /> : i + 1}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">{t}</span>
                    <span className="block text-sm text-slate-600">{d}</span>
                  </span>
                </li>
              ))}
            </ol>
            <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-slate-200" aria-hidden="true">
              <div className="h-full origin-left rounded-full bg-gradient-to-r from-violet-600 to-sky-500" style={{ transform: 'scaleX(var(--p, 0))' }} />
            </div>
          </div>
          <ProductMock done={done} />
        </div>
      </div>
    </section>
  );
}

/* ---------- Features: each card = a tinted visual on top, copy below ---------- */
function FeatureCard({ tint, badge, title, text, children, className = '' }) {
  return (
    <Tilt className={`flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`}>
      <div className={`relative flex min-h-[190px] items-center justify-center overflow-hidden border-b border-slate-100 p-6 ${tint}`}>
        <div className="bg-dots absolute inset-0 opacity-60" aria-hidden="true" />
        <div className="relative w-full">{children}</div>
      </div>
      <div className="p-6">
        {badge}
        <h3 className="mt-3 text-lg font-semibold tracking-tight text-slate-900">{title}</h3>
        <p className="mt-1.5 text-sm leading-6 text-slate-600">{text}</p>
      </div>
    </Tilt>
  );
}

function Badge({ Icon, label, tone }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-semibold ${tone}`}>
      <Icon size={12} aria-hidden="true" /> {label}
    </span>
  );
}

function AuditTerminal() {
  const ref = useRef(null);
  const run = useInView(ref);
  const text = '✓ archive  "30% off your next order"   rule   8 ms\n→ review   "New sign-in to your account"  model  55%\n↺ undo     "Weekly digest"  back in inbox';
  const n = useTyping(text.length, run, 70);
  return (
    <div ref={ref} className="mx-auto w-full max-w-md overflow-hidden rounded-2xl bg-slate-950 shadow-xl ring-1 ring-black/5">
      <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        <span className="ml-2 font-mono text-[10px] text-slate-500">autopilot audit</span>
      </div>
      <pre className="min-h-[86px] whitespace-pre-wrap px-4 py-3 font-mono text-[11px] leading-6 text-emerald-300">
        {text.slice(0, n)}<span className="caret" aria-hidden="true">▍</span>
      </pre>
    </div>
  );
}

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-24">
      <div className="max-w-2xl">
        <Reveal><Eyebrow>Features</Eyebrow></Reveal>
        <Reveal delay={60}><h2 className={`mt-4 ${H2}`}>An inbox assistant you can check</h2></Reveal>
        <Reveal delay={120}><p className="mt-3 text-base text-slate-600 sm:text-[17px]">Most AI email tools ask for your trust. InBoxIQ shows its work and lets you take it back.</p></Reveal>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-6">
        <Reveal className="md:col-span-4">
          <FeatureCard
            tint="bg-gradient-to-br from-amber-50 via-orange-50/60 to-white"
            badge={<Badge Icon={ShieldCheck} label="Review queue" tone="bg-amber-100 text-amber-800" />}
            title="Unsure goes to review, not to the bin"
            text="If the model isn't confident, or can't read an email at all, the email waits for you. Nothing is hidden on a guess."
          >
            <div className="mx-auto max-w-lg space-y-2" aria-hidden="true">
              {[['Bank Security', 'New sign-in to your account', 55], ['Jira', 'PLAT-412 assigned to you', 61]].map(([f, s, c], i) => (
                <div key={s} className={`flex items-center gap-3 rounded-2xl border border-amber-100 bg-white px-4 py-3 shadow-sm ${i ? 'ml-6 opacity-90' : ''}`}>
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-amber-100 text-[11px] font-bold text-amber-800">{f[0]}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-slate-500">{f}</p>
                    <p className="truncate text-sm font-medium text-slate-800">{s}</p>
                  </div>
                  <span className="hidden rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200 sm:inline">{c}% sure</span>
                  <span className="rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white">Review</span>
                </div>
              ))}
            </div>
          </FeatureCard>
        </Reveal>

        <Reveal className="md:col-span-2" delay={80}>
          <Tilt className="relative flex h-full flex-col overflow-hidden rounded-3xl bg-slate-950 p-6 text-white">
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-violet-600/50 blur-3xl" aria-hidden="true" />
            <div className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-sky-500/30 blur-3xl" aria-hidden="true" />
            <div className="relative">
              <Badge Icon={Cpu} label="Local AI" tone="bg-white/10 text-violet-200" />
              <h3 className="mt-3 text-lg font-semibold tracking-tight">Runs on your computer</h3>
              <p className="mt-1.5 text-sm leading-6 text-slate-400">Llama 3 through Ollama. Nothing goes to a cloud model unless you add a key.</p>
            </div>
            <div className="relative mt-auto pt-8">
              <p className="bg-gradient-to-br from-white to-violet-300 bg-clip-text text-6xl font-extrabold tracking-tight text-transparent">$0</p>
              <p className="text-sm text-slate-400">per email</p>
              <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[11px] text-emerald-300">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> ollama · llama3 · local
              </p>
            </div>
          </Tilt>
        </Reveal>

        <Reveal className="md:col-span-3">
          <FeatureCard
            tint="bg-gradient-to-br from-sky-50 via-indigo-50/50 to-white"
            badge={<Badge Icon={EyeOff} label="Dry run" tone="bg-sky-100 text-sky-800" />}
            title="Watch first, then let it act"
            text="Assist mode logs what it would do and changes nothing in Gmail. Switch to autonomous only when you trust it."
          >
            <div className="mx-auto max-w-sm space-y-3" aria-hidden="true">
              <div className="mx-auto flex w-fit rounded-full bg-white p-1 text-xs font-semibold shadow-sm ring-1 ring-slate-200">
                <span className="rounded-full bg-sky-600 px-4 py-1.5 text-white">Assist</span>
                <span className="px-4 py-1.5 text-slate-500">Autonomous</span>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-sky-100 bg-white px-4 py-3 shadow-sm">
                <EyeOff size={15} className="text-sky-600" />
                <p className="min-w-0 flex-1 truncate text-sm text-slate-700">Would archive <span className="font-medium">&ldquo;30% off your next order&rdquo;</span></p>
                <span className="rounded-md bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700">Gmail unchanged</span>
              </div>
            </div>
          </FeatureCard>
        </Reveal>

        <Reveal className="md:col-span-3" delay={80}>
          <FeatureCard
            tint="bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white"
            badge={<Badge Icon={Undo2} label="Audit log" tone="bg-emerald-100 text-emerald-800" />}
            title="Every action written down, every action undoable"
            text="Each real Gmail change is logged after Gmail confirms it. One click puts the email back in your inbox."
          >
            <AuditTerminal />
          </FeatureCard>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- Privacy: stacking cards, each with its own proof visual ---------- */
function LockVisual() {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-4 font-mono text-[11px] leading-6 sm:text-xs">
      <p className="text-slate-500">$ curl 192.168.1.20:8001/api/history</p>
      <p className="text-rose-300">✗ connection refused <span className="text-slate-500">(127.0.0.1 only)</span></p>
      <p className="mt-2 text-slate-500">$ curl 127.0.0.1:8001/api/history</p>
      <p className="text-rose-300">✗ 401 missing token</p>
      <p className="mt-2 text-slate-500">$ open InBoxIQ on this laptop</p>
      <p className="text-emerald-300">✓ token handed to the local app</p>
    </div>
  );
}

function Node({ Icon, label, sub, cls }) {
  return (
    <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${cls}`}>
      <Icon size={18} aria-hidden="true" />
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-[11px] opacity-70">{sub}</p>
      </div>
    </div>
  );
}

function CloudVisual() {
  return (
    <div className="space-y-3">
      <Node Icon={Mail} label="Gmail" sub="Your mail" cls="border-white/10 bg-white/5 text-white" />
      <div className="ml-6 h-5 w-px bg-gradient-to-b from-sky-400 to-transparent" aria-hidden="true" />
      <Node Icon={Laptop} label="Your laptop" sub="Ollama · Llama 3 · on device" cls="border-sky-400/40 bg-sky-500/10 text-sky-100" />
      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-white/15 px-4 py-3 text-slate-500">
        <Cloud size={18} aria-hidden="true" />
        <p className="text-sm line-through">Cloud AI</p>
        <span className="ml-auto rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-semibold">not used by default</span>
      </div>
    </div>
  );
}

function SafeVisual() {
  const rows = [
    ['Ollama', 'offline', 'text-rose-300'],
    ['Model output', 'empty', 'text-amber-300'],
    ['Decision', 'REVIEW', 'text-emerald-300'],
    ['Gmail', 'unchanged', 'text-emerald-300'],
  ];
  return (
    <ul className="divide-y divide-white/5 rounded-2xl border border-white/10 bg-black/30">
      {rows.map(([k, v, c]) => (
        <li key={k} className="flex items-center justify-between px-4 py-3 text-sm">
          <span className="text-slate-400">{k}</span>
          <span className={`font-mono text-xs font-semibold ${c}`}>{v}</span>
        </li>
      ))}
    </ul>
  );
}

const PROMISES = [
  { Icon: Lock, title: 'Locked to your machine', text: 'The server only listens on 127.0.0.1, and every API call needs a local token. Other devices and websites get nothing.', glow: 'bg-violet-600/40', tile: 'bg-violet-500/15 text-violet-300 ring-violet-400/30', Visual: LockVisual },
  { Icon: Cpu, title: 'No cloud by default', text: 'Without a Gemini key, your email text never leaves your computer. The model runs on your own hardware.', glow: 'bg-sky-500/35', tile: 'bg-sky-500/15 text-sky-300 ring-sky-400/30', Visual: CloudVisual },
  { Icon: ShieldCheck, title: 'Fails safe', text: 'If the model is down or returns junk, the email goes to review. Nothing is invented, and nothing is archived.', glow: 'bg-emerald-500/30', tile: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30', Visual: SafeVisual },
];

export function Privacy() {
  return (
    <section id="privacy" className="relative bg-[#07061a] px-6 py-24 text-white">
      <div className="bg-grid-dark absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_40%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl">
        <div className="max-w-2xl">
          <Reveal><Eyebrow dark>Privacy</Eyebrow></Reveal>
          <Reveal delay={60}><h2 className={`mt-4 ${H2}`}>Your email stays on your computer</h2></Reveal>
          <Reveal delay={120}><p className="mt-3 text-slate-400">Built for people who can&apos;t, or won&apos;t, send their inbox to a third-party AI.</p></Reveal>
        </div>
        <div className="mt-12 space-y-5">
          {PROMISES.map(({ Icon, title, text, glow, tile, Visual }, i) => (
            <article
              key={title}
              className="stack-card sticky overflow-hidden rounded-[28px] border border-white/10 bg-[#0e0c26] p-7 shadow-[0_-24px_60px_-30px_rgba(0,0,0,0.9)] sm:p-10"
              style={{ top: `${96 + i * 24}px` }}
            >
              <div className={`absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl ${glow}`} aria-hidden="true" />
              <div className="relative grid items-center gap-8 md:grid-cols-[1fr_1.1fr]">
                <div>
                  <div className="flex items-center gap-3">
                    <span className={`grid h-11 w-11 place-items-center rounded-2xl ring-1 ${tile}`}><Icon size={20} aria-hidden="true" /></span>
                    <span className="font-mono text-xs text-white/30">0{i + 1} / 03</span>
                  </div>
                  <h3 className="mt-5 text-2xl font-semibold tracking-tight">{title}</h3>
                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">{text}</p>
                </div>
                <div aria-hidden="true"><Visual /></div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Results: line-by-line reveal + count-up ---------- */
const LINES = ['The first version hid', 'more than half of my', 'important email.', 'Now it hides none.'];

export function Results() {
  const ref = useRef(null);
  const inView = useInView(ref, { threshold: 0.3 });
  const before = useCountUp(0, 57.6, inView);
  const after = useCountUp(57.6, 0, inView, 1800);

  return (
    <section id="results" ref={ref} className="mx-auto max-w-6xl px-6 py-24">
      <Eyebrow>Results</Eyebrow>
      <h2 className="mt-5 text-3xl font-bold leading-[1.15] tracking-tight sm:text-[44px]">
        {LINES.map((l, i) => (
          <span key={l} className="block overflow-hidden">
            <span className={`line-up block ${inView ? 'is-in' : ''} ${i === 3 ? 'text-violet-600' : ''}`} style={{ transitionDelay: `${i * 120}ms` }}>{l}</span>
          </span>
        ))}
      </h2>

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        <div className="rounded-3xl border border-rose-100 bg-gradient-to-br from-rose-50 to-white p-6">
          <p className="text-sm font-semibold text-rose-700">Important mail wrongly hidden · before</p>
          <p className="mt-3 text-5xl font-extrabold tabular-nums tracking-tight text-rose-600">{before.toFixed(1)}%</p>
        </div>
        <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-6">
          <p className="text-sm font-semibold text-emerald-700">Important mail wrongly hidden · now</p>
          <p className="mt-3 text-5xl font-extrabold tabular-nums tracking-tight text-emerald-600">{after.toFixed(1)}%</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <p className="text-sm font-semibold text-slate-700">The honest trade-off</p>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Noise hidden fell from 47.1% to 17.6%. A few extra newsletters stay visible, so no real email is lost. Raising that number is the next job.
          </p>
        </div>
      </div>
      <p className="mt-4 text-xs text-slate-500">
        50 real emails, labelled by hand, one labeller. Reproduce with <code className="rounded bg-slate-100 px-1.5 py-0.5">python -m eval.real pipeline</code>.
      </p>
    </section>
  );
}
