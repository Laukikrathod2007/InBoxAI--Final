import { Check, Cpu, EyeOff, History, Lock, ShieldCheck, Undo2, X } from 'lucide-react';

const FEATURES = [
  { icon: Cpu, title: 'Local AI, no cloud', text: 'Classification runs on Llama 3 through Ollama on your own computer. A cloud model is only used if you add a key yourself.' },
  { icon: ShieldCheck, title: 'Unsure goes to review', text: 'Low-confidence or unreadable results are never hidden. They wait in a review queue for you.' },
  { icon: EyeOff, title: 'Dry run by default', text: 'Assist mode logs what it would archive or label. Gmail stays exactly as it is until you switch on autonomous mode.' },
  { icon: Undo2, title: 'Every action can be undone', text: 'Each real Gmail change is recorded after Gmail confirms it. One click puts the email back in your inbox.' },
  { icon: History, title: 'An audit log you can read', text: 'See every decision, which rule or model made it, and how long it took.' },
  { icon: Lock, title: 'Locked to your machine', text: 'The server listens on 127.0.0.1 only and every API call needs a local token.' },
];

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-24">
      <h2 className="max-w-2xl text-4xl font-bold tracking-tight">An inbox assistant you can trust with real mail</h2>
      <p className="mt-4 max-w-2xl text-slate-600">Most AI email tools ask you to trust them. InBoxIQ shows you what it does and lets you take it back.</p>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <article key={title} className="rounded-2xl border border-slate-200 p-6 transition hover:border-slate-300 hover:shadow-sm">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Icon size={18} aria-hidden="true" />
            </span>
            <h3 className="mt-5 font-semibold text-slate-900">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

const STEPS = [
  ['Read', 'New mail is fetched from Gmail every minute.'],
  ['Filter', 'Strict rules hide only mail they are sure about, such as newsletters and promotions.'],
  ['Understand', 'Everything else goes to the local model for a summary, category and confidence score.'],
  ['Decide', 'High confidence: sorted into Needs you or FYI. Low confidence: sent to Review.'],
  ['Act or log', 'Assist mode logs the action. Autonomous mode applies it in Gmail, with undo.'],
];

export function HowItWorks() {
  return (
    <section id="how" className="bg-slate-50/60 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-4xl font-bold tracking-tight">How it works</h2>
        <ol className="mt-12 grid gap-4 md:grid-cols-5">
          {STEPS.map(([title, text], i) => (
            <li key={title} className="rounded-2xl border border-slate-200 bg-white p-5">
              <span className="text-xs font-semibold text-violet-600">Step {i + 1}</span>
              <h3 className="mt-2 font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const ROWS = [
  ['Original version', '52.9%', '57.6%', '66.7%', false],
  ['Rules + Llama 3, before the fix', '47.1%', '21.2%', '20.0%', false],
  ['Rules + Llama 3, current', '17.6%', '0.0%', '0.0%', true],
];

export function Results() {
  return (
    <section id="results" className="mx-auto max-w-6xl px-6 py-24">
      <h2 className="text-4xl font-bold tracking-tight">Measured, not promised</h2>
      <p className="mt-4 max-w-2xl text-slate-600">
        Scored on 50 real emails, each labelled by hand. The current version gives up some noise filtering to never hide important mail.
      </p>
      <div className="mt-10 overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-5 py-3 font-semibold">Version</th>
              <th scope="col" className="px-5 py-3 font-semibold">Noise hidden</th>
              <th scope="col" className="px-5 py-3 font-semibold">Important mail wrongly hidden</th>
              <th scope="col" className="px-5 py-3 font-semibold">Needs-action mail lost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ROWS.map(([name, noise, fh, lost, current]) => (
              <tr key={name} className={current ? 'bg-emerald-50/50 font-semibold' : ''}>
                <th scope="row" className="px-5 py-4 font-medium text-slate-900">{name}</th>
                <td className="px-5 py-4">{noise}</td>
                <td className="px-5 py-4">{fh}</td>
                <td className="px-5 py-4">{lost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-slate-500">Small sample with one labeller. Reproduce with <code className="rounded bg-slate-100 px-1.5 py-0.5">python -m eval.real pipeline</code>.</p>
    </section>
  );
}

const COMPARE = [
  ['Email processed on your computer', true, false],
  ['Publishes its own error rate', true, false],
  ['Dry run before changing your inbox', true, false],
  ['Undo for every automated action', true, false],
  ['Open source', true, false],
  ['Instant, zero setup', false, true],
];

export function Compare() {
  const Mark = ({ ok }) => ok
    ? <Check size={18} className="text-emerald-600" aria-label="Yes" />
    : <X size={18} className="text-slate-300" aria-label="No" />;
  return (
    <section className="bg-slate-50/60 py-24">
      <div className="mx-auto max-w-4xl px-6">
        <h2 className="text-4xl font-bold tracking-tight">Where it fits</h2>
        <p className="mt-4 text-slate-600">If you want instant and polished, a cloud tool is the better choice. If your mail must stay private, this is built for you.</p>
        <div className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-5 py-3 text-left font-semibold">&nbsp;</th>
                <th scope="col" className="px-5 py-3 font-semibold">InBoxIQ</th>
                <th scope="col" className="px-5 py-3 font-semibold">Typical cloud AI inbox</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {COMPARE.map(([label, us, them]) => (
                <tr key={label}>
                  <th scope="row" className="px-5 py-4 text-left font-medium text-slate-800">{label}</th>
                  <td className="px-5 py-4"><span className="flex justify-center"><Mark ok={us} /></span></td>
                  <td className="px-5 py-4"><span className="flex justify-center"><Mark ok={them} /></span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

const FAQS = [
  ['Does my email leave my computer?', 'Not by default. Without a Gemini key, all AI runs locally through Ollama. If you add a key and Ollama is down, email text is sent to Google Gemini.'],
  ['What if it hides something important?', 'In assist mode it hides nothing in Gmail; it only logs what it would do. In autonomous mode, every archive appears in the activity log with an Undo button.'],
  ['What do I need to run it?', 'Python 3.11, Node.js, Ollama with Llama 3, and a Google Cloud OAuth client for Gmail. Setup steps are in the README.'],
  ['Is it free?', 'Yes. It is MIT licensed, and local models cost nothing per email.'],
  ['Can several people share one install?', 'No. It is built for one person on one computer.'],
];

export function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-6 py-24">
      <h2 className="text-4xl font-bold tracking-tight">Questions</h2>
      <div className="mt-10 divide-y divide-slate-200 border-y border-slate-200">
        {FAQS.map(([q, a]) => (
          <details key={q} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-slate-900">
              {q}
              <span className="ml-4 text-slate-400 transition group-open:rotate-45" aria-hidden="true">+</span>
            </summary>
            <p className="mt-3 text-sm leading-6 text-slate-600">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
