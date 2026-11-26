import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, Send, Sparkles, X } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API_BASE = '/api';
const TONES = ['Professional', 'Casual', 'Short', 'Direct'];

function ComposeModal({ onClose, threadId = null, initialRecipient = '', initialSubject = '', prefillIntent = '' }) {
  // A long prefill is an existing AI draft: open straight on the editor.
  const preDrafted = prefillIntent.length > 50 && prefillIntent.includes(' ');
  const [intent, setIntent] = useState(preDrafted ? '' : prefillIntent);
  const [draft, setDraft] = useState(preDrafted ? { subject: initialSubject, body: prefillIntent } : null);
  const [recipient, setRecipient] = useState(initialRecipient);
  const [tone, setTone] = useState('Professional');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const generateDraft = async () => {
    if (!intent.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/compose-draft`, { intent, thread_id: threadId, tone });
      const d = res.data || {};
      setDraft({ subject: d.subject || initialSubject || '', body: d.body || d.summary || '' });
    } catch {
      toast.error('Could not write a draft. Check that the local model is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!draft || !recipient.trim()) {
      toast.error('Add a recipient first.');
      return;
    }
    setSending(true);
    try {
      await axios.post(`${API_BASE}/send`, { recipient: recipient.trim(), subject: draft.subject, body: draft.body, thread_id: threadId });
      toast.success('Email sent.');
      onClose();
    } catch {
      toast.error('Sending failed. Nothing was sent.');
    } finally {
      setSending(false);
    }
  };

  const field = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100';

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-slate-950/40 p-4 pt-[8vh] backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="compose-title" className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-600 text-white"><Sparkles size={15} aria-hidden="true" /></span>
          <div className="min-w-0 flex-1">
            <h2 id="compose-title" className="text-sm font-semibold text-slate-900">{draft ? 'Review and send' : 'Write with AI'}</h2>
            <p className="text-xs text-slate-500">{draft ? 'Edit anything before sending. Nothing is sent until you press Send.' : 'Say what you want to say. The local model drafts it.'}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100">
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {!draft ? (
            <>
              <div>
                <label htmlFor="compose-intent" className="mb-1.5 block text-xs font-semibold text-slate-700">What should the email say?</label>
                <textarea id="compose-intent" value={intent} onChange={(e) => setIntent(e.target.value)} rows={5}
                  placeholder="e.g. Accept the meeting on Friday and ask for the agenda" className={`${field} resize-none`} />
              </div>
              <div>
                <p className="mb-1.5 text-xs font-semibold text-slate-700">Tone</p>
                <div className="inline-flex rounded-lg bg-slate-100 p-1" role="radiogroup" aria-label="Tone">
                  {TONES.map((t) => (
                    <button key={t} type="button" role="radio" aria-checked={tone === t} onClick={() => setTone(t)}
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${tone === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label htmlFor="compose-to" className="mb-1.5 block text-xs font-semibold text-slate-700">To</label>
                <input id="compose-to" type="email" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="name@example.com" className={field} />
              </div>
              <div>
                <label htmlFor="compose-subject" className="mb-1.5 block text-xs font-semibold text-slate-700">Subject</label>
                <input id="compose-subject" value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} className={field} />
              </div>
              <div>
                <label htmlFor="compose-body" className="mb-1.5 block text-xs font-semibold text-slate-700">Message</label>
                <textarea id="compose-body" value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} rows={10} className={`${field} resize-y leading-6`} />
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
          {draft && (
            <button type="button" onClick={() => setDraft(null)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900">
              <ArrowLeft size={14} aria-hidden="true" /> Start over
            </button>
          )}
          <div className="ml-auto flex gap-2">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
            {!draft ? (
              <button type="button" onClick={generateDraft} disabled={!intent.trim() || loading}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-40">
                {loading ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Sparkles size={14} aria-hidden="true" />} Write draft
              </button>
            ) : (
              <button type="button" onClick={handleSend} disabled={sending}
                className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-40">
                {sending ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Send size={14} aria-hidden="true" />} Send
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComposeModal;
