import { useEffect, useRef, useState } from 'react';
import { Loader2, Sparkles, X } from 'lucide-react';

const SUGGESTIONS = ['What needs a reply today?', 'Summarise my open tasks', 'Any invoices due?'];

export default function AskModal({ open, onClose, onSubmit, response }) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    inputRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const send = async (text = message) => {
    if (!text.trim() || sending) return;
    setSending(true);
    await onSubmit(text.trim());
    setSending(false);
    setMessage('');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-slate-950/40 p-4 pt-[12vh] backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="ask-title" className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-600 text-white"><Sparkles size={15} aria-hidden="true" /></span>
          <div className="min-w-0 flex-1">
            <h2 id="ask-title" className="text-sm font-semibold text-slate-900">Ask InBoxIQ</h2>
            <p className="text-xs text-slate-500">Answers come from your open action items.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100">
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="p-5">
          <label htmlFor="ask-input" className="sr-only">Your question</label>
          <textarea
            id="ask-input"
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            rows={3}
            placeholder="Ask about your inbox"
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" onClick={() => send(s)} className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:border-violet-300 hover:text-violet-700">
                {s}
              </button>
            ))}
            <button type="submit" disabled={sending || !message.trim()} className="ml-auto inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-40">
              {sending && <Loader2 size={14} className="animate-spin" aria-hidden="true" />} Ask
            </button>
          </div>

          {response && (
            <div className="mt-5 rounded-xl border border-violet-100 bg-violet-50/50 p-4" aria-live="polite">
              <p className="mb-1 text-xs font-semibold text-violet-700">Answer</p>
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{response}</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
