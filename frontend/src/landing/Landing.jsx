import { useEffect, useState } from 'react';
import { ArrowRight, Github } from 'lucide-react';
import { BrandLogo } from '../components/SideBar';
import ProductMock from './ProductMock';
import { Features, HowItWorks, Results, Compare, Faq } from './Sections';

export const REPO = 'https://github.com/Laukikrathod2007/InBoxAI--Final';
const WORDS = ['private', 'honest', 'reversible', 'measured'];

function RotatingWord() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % WORDS.length), 2200);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="relative inline-block overflow-hidden align-bottom">
      <span key={WORDS[i]} className="animate-word inline-block bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
        {WORDS[i]}
      </span>
    </span>
  );
}

const STATS = [
  ['57.6% → 0.0%', 'important mail wrongly hidden, on 50 hand-labelled real emails'],
  ['$0', 'per email with a local Llama 3 model'],
  ['36 tests', 'run in CI on every push'],
  ['Dry run', 'by default. Nothing changes in Gmail until you say so'],
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased">
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur">
        <nav aria-label="Main" className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-6">
          <a href="#/" aria-label="InBoxIQ home"><BrandLogo /></a>
          <div className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <a href="#features" className="hover:text-slate-900">Features</a>
            <a href="#how" className="hover:text-slate-900">How it works</a>
            <a href="#results" className="hover:text-slate-900">Results</a>
            <a href="#faq" className="hover:text-slate-900">FAQ</a>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <a href={REPO} className="hidden items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 sm:flex">
              <Github size={16} aria-hidden="true" /> GitHub
            </a>
            <a href="#/app" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
              Open the app
            </a>
          </div>
        </nav>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" aria-hidden="true" />
          <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-20 text-center">
            <p className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Open source · runs on your computer
            </p>
            <h1 className="mx-auto max-w-4xl text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-7xl">
              <span className="sr-only">The private, honest, reversible inbox firewall</span>
              <span aria-hidden="true">The <RotatingWord /><br />inbox firewall</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
              InBoxIQ sorts your Gmail with a local AI model. It shows you what needs you, hides what doesn&apos;t,
              and sends anything it&apos;s unsure about to review. Your email never leaves your machine.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <a href="#/app" className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700">
                Open the app <ArrowRight size={16} aria-hidden="true" />
              </a>
              <a href={REPO} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50">
                <Github size={16} aria-hidden="true" /> View the code
              </a>
            </div>
            <div className="mx-auto mt-16 max-w-5xl text-left"><ProductMock /></div>
          </div>
        </section>

        <section aria-label="Key numbers" className="border-y border-slate-100 bg-slate-50/60">
          <dl className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map(([v, l]) => (
              <div key={v}>
                <dt className="text-2xl font-bold tracking-tight text-slate-900">{v}</dt>
                <dd className="mt-1 text-sm text-slate-500">{l}</dd>
              </div>
            ))}
          </dl>
        </section>

        <Features />
        <HowItWorks />
        <Results />
        <Compare />
        <Faq />

        <section className="px-6 py-24">
          <div className="mx-auto max-w-5xl rounded-3xl bg-slate-900 px-8 py-16 text-center text-white">
            <h2 className="text-4xl font-bold tracking-tight">Keep the mail that matters.</h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-300">Free and open source. Starts in dry-run mode, so you can watch what it would do before it does anything.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a href="#/app" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100">Open the app</a>
              <a href={REPO} className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold hover:bg-white/10">Read the setup guide</a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-100">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-6 py-8 text-sm text-slate-500">
          <BrandLogo />
          <span className="ml-auto">MIT licensed · Built by Laukik Rathod</span>
        </div>
      </footer>
    </div>
  );
}
