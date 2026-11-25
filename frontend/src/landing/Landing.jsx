import './landing.css';
import { Check, X } from 'lucide-react';
import { BrandLogo } from '../components/SideBar';
import Nav from './Nav';
import Hero from './Hero';
import Mascot from './Mascot';
import { Features, Privacy, Results, ScrollDemo, SidewaysBand, Eyebrow } from './Story';
import { Reveal } from './fx';
import { REPO } from './data';
import { usePointerVars } from './motion';

const COMPARE = [
  ['Email processed on your computer', true, false],
  ['Publishes its own error rate', true, false],
  ['Dry run before changing your inbox', true, false],
  ['Undo for every automated action', true, false],
  ['Open source', true, false],
  ['Instant, zero setup', false, true],
];

function Mark({ ok }) {
  return ok
    ? <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-100"><Check size={15} className="text-emerald-700" aria-label="Yes" /></span>
    : <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-100"><X size={15} className="text-slate-400" aria-label="No" /></span>;
}

const FAQS = [
  ['Does my email leave my computer?', 'Not by default. Without a Gemini key, all AI runs locally through Ollama. If you add a key and Ollama is down, email text is sent to Google Gemini.'],
  ['What if it hides something important?', 'In assist mode it changes nothing in Gmail; it only logs what it would do. In autonomous mode every archive shows up in the activity log with an Undo button.'],
  ['Can I try it without connecting Gmail?', 'Yes. The demo runs on 80 synthetic emails: python scripts/demo_server.py.'],
  ['What do I need to run it for real?', 'Python 3.11, Node.js, Ollama with Llama 3, and a Google Cloud OAuth client for Gmail. The README has the steps.'],
  ['Is it free?', 'Yes. It is MIT licensed, and local models cost nothing per email.'],
];

export default function Landing() {
  usePointerVars();
  return (
    <div className="min-h-screen overflow-x-clip bg-white text-slate-900 antialiased">
      <Nav />
      <main>
        <Hero />
        <SidewaysBand />
        <Features />
        <ScrollDemo />
        <Privacy />
        <Results />

        <section className="mx-auto max-w-4xl px-6 pb-28">
          <Reveal><Eyebrow>Where it fits</Eyebrow></Reveal>
          <Reveal delay={60}><h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-[40px] sm:leading-[1.15]">Honest about the trade-off</h2></Reveal>
          <Reveal delay={120}><p className="mt-4 text-lg text-slate-600">Want instant and polished? A cloud tool is the better choice. Need your mail to stay private? This is built for you.</p></Reveal>
          <Reveal delay={160} className="mt-12 overflow-hidden rounded-3xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left font-semibold"><span className="sr-only">Capability</span></th>
                  <th scope="col" className="px-6 py-4 font-semibold text-violet-700">InBoxIQ</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Typical cloud AI inbox</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {COMPARE.map(([label, us, them]) => (
                  <tr key={label} className="transition hover:bg-slate-50/60">
                    <th scope="row" className="px-6 py-4 text-left font-medium text-slate-800">{label}</th>
                    <td className="px-6 py-4"><span className="flex justify-center"><Mark ok={us} /></span></td>
                    <td className="px-6 py-4"><span className="flex justify-center"><Mark ok={them} /></span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Reveal>
        </section>

        <section id="faq" className="mx-auto max-w-3xl px-6 pb-28">
          <Reveal><Eyebrow>FAQ</Eyebrow></Reveal>
          <Reveal delay={60}><h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-[40px] sm:leading-[1.15]">Questions</h2></Reveal>
          <div className="mt-12 space-y-3">
            {FAQS.map(([q, a], i) => (
              <Reveal key={q} delay={i * 50}>
                <details className="group rounded-2xl border border-slate-200 bg-white px-6 py-5 transition open:shadow-sm">
                  <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-slate-900">
                    {q}
                    <span className="ml-4 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 transition group-open:rotate-45 group-open:bg-violet-100 group-open:text-violet-700" aria-hidden="true">+</span>
                  </summary>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="px-4 pb-24 sm:px-6">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[36px] bg-slate-950 px-8 py-20 text-center text-white">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.5),transparent_60%)]" aria-hidden="true" />
            <div className="bg-grid-dark absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" aria-hidden="true" />
            <div className="relative">
              <Mascot className="mx-auto mb-6 w-28" />
              <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight sm:text-[40px] sm:leading-[1.15]">Keep the mail that matters.</h2>
              <p className="mx-auto mt-5 max-w-xl text-slate-300">It starts in dry-run mode. Watch what it would do for a week before it touches a single email.</p>
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <a href="#/app" className="btn-sheen rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-slate-950 hover:bg-slate-100">Try the live demo</a>
                <a href={REPO} className="rounded-full border border-white/20 px-7 py-3.5 text-sm font-semibold hover:bg-white/10">Read the setup guide</a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-100">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-[2fr_1fr_1fr]">
          <div>
            <BrandLogo />
            <p className="mt-3 max-w-xs text-sm text-slate-500">A local-first inbox firewall. Open source under the MIT license.</p>
          </div>
          <div className="text-sm">
            <p className="font-semibold text-slate-900">Product</p>
            <ul className="mt-3 space-y-2 text-slate-500">
              <li><a href="#features" className="hover:text-slate-900">Features</a></li>
              <li><a href="#demo" className="hover:text-slate-900">How it works</a></li>
              <li><a href="#/app" className="hover:text-slate-900">Live demo</a></li>
            </ul>
          </div>
          <div className="text-sm">
            <p className="font-semibold text-slate-900">Project</p>
            <ul className="mt-3 space-y-2 text-slate-500">
              <li><a href={REPO} className="hover:text-slate-900">GitHub</a></li>
              <li><a href={`${REPO}/blob/main/DECISIONS.md`} className="hover:text-slate-900">Engineering decisions</a></li>
              <li><a href={`${REPO}/blob/main/RISKS.md`} className="hover:text-slate-900">Security and risks</a></li>
            </ul>
          </div>
        </div>
        <p className="border-t border-slate-100 py-6 text-center text-xs text-slate-400">Built by Laukik Rathod</p>
      </footer>
    </div>
  );
}
