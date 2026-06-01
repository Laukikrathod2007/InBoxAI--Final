import React, { useState } from 'react';

export default function AskModal({ open, onClose, onSubmit, response }) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    await onSubmit(message.trim());
    setSending(false);
    setMessage('');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4">
      <div className="w-full max-w-2xl rounded-[32px] bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-primary">Ask InBoxIQ</h2>
            <p className="text-sm text-on-surface-variant">Send a question to the inbox AI and receive an instant summary.</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-slate-100 p-3 text-slate-700 hover:bg-slate-200"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Ask a question like: 'Summarize the latest marketing noise'"
            className="w-full rounded-3xl border border-slate-200 bg-surface p-4 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              onClick={handleSend}
              disabled={sending}
              className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {sending ? 'Sending…' : 'Send Question'}
            </button>
            {response ? (
              <span className="text-sm text-on-surface-variant">Latest answer loaded.</span>
            ) : null}
          </div>
          {response ? (
            <div className="rounded-3xl bg-slate-50 p-4 text-sm leading-6 text-slate-700 border border-slate-200">
              <p className="font-semibold text-slate-900 mb-2">InBoxIQ response</p>
              <p>{response}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
