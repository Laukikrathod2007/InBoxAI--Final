import React, { useState } from 'react';
import { X, Sparkles, Send, Loader2, ShieldCheck, ArrowRight, MessageSquare, CornerUpRight, Palette, Zap, BrainCircuit, Globe } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API_BASE = '/api';

function ComposeModal({ onClose, threadId = null, initialRecipient = "", initialSubject = "", prefillIntent = "" }) {
  // Logic: If prefillIntent looks like a draft (long text with spaces), skip the prompt phase
  const [isPreDrafted, setIsPreDrafted] = useState(prefillIntent.length > 50 && prefillIntent.includes(' '));
  
  const [intent, setIntent] = useState(isPreDrafted ? "" : prefillIntent);
  const [draft, setDraft] = useState(isPreDrafted ? { subject: initialSubject, body: prefillIntent } : null);
  const [loading, setLoading] = useState(false);
  const [tone, setTone] = useState("Professional");
  const [sending, setSending] = useState(false);

  const generateDraft = async () => {
    if (!intent.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/compose-draft`, { 
        intent, 
        thread_id: threadId,
        tone: tone
      });
      setDraft(res.data);
    } catch {
      toast.error("Ghostwriter agent failed to respond.");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!draft) return;
    setSending(true);
    toast.promise(
        axios.post(`${API_BASE}/send`, {
            recipient: initialRecipient || draft.recipient || "", 
            subject: draft.subject,
            body: draft.body,
            thread_id: threadId
        }),
        {
            loading: 'Dispatching encrypted packet...',
            success: () => {
                onClose();
                return 'Signal transmitted successfully';
            },
            error: 'Transmission failed'
        }
    );
    setSending(false); // toast handles the visible state
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0c10]/80 backdrop-blur-2xl animate-fade-in p-6 overflow-hidden">
      <div className="bg-[#0f1115] border border-white/10 w-full max-w-2xl rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden animate-slide-up relative">
        
        {/* Animated Background Pulse */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 primary-gradient animate-pulse" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full" />

        <header className="px-12 py-10 flex justify-between items-center bg-white/2">
            <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl primary-gradient flex items-center justify-center text-white shadow-2xl shadow-blue-500/20 ring-4 ring-blue-500/10">
                    <Sparkles size={22} fill="currentColor" />
                </div>
                <div>
                    <h2 className="text-2xl font-black tracking-tighter text-white uppercase">Neural Draft Agent</h2>
                    <div className="flex items-center gap-2 mt-1.5">
                        <Zap size={10} className="text-amber-400" fill="currentColor" />
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ghostwriter | Llama-3-70B Logic</p>
                    </div>
                </div>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-2xl hover:bg-white/5 flex items-center justify-center transition-all text-slate-500 hover:text-white border border-transparent hover:border-white/10">
                <X size={20} />
            </button>
        </header>

        <div className="px-12 pb-12 space-y-10 flex-1 overflow-y-auto custom-scrollbar">
            {!draft ? (
                <div className="space-y-10 animate-fade-in">
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-5">
                            <BrainCircuit size={14} className="text-blue-500" />
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Contextual Intent</label>
                        </div>
                        <textarea 
                            value={intent}
                            onChange={(e) => setIntent(e.target.value)}
                            placeholder="Instruct the agent... (e.g., 'Draft a formal acceptance for the meeting')"
                            className="w-full min-h-[200px] bg-white/5 border border-white/5 focus:border-blue-500/50 rounded-[2rem] p-8 text-sm font-bold text-white outline-none transition-all placeholder:text-slate-700 shadow-inner group"
                        />
                         <div className="absolute bottom-6 right-6 flex items-center gap-2 opacity-40">
                            <Globe size={12} className="text-slate-500" />
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Awaiting Command...</span>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center justify-between gap-6 pt-4">
                        <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5">
                             {["Professional", "Casual", "Short", "Direct"].map(t => (
                                <button 
                                    key={t}
                                    onClick={() => setTone(t)}
                                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tone === t ? 'bg-blue-600 text-white shadow-2xl shadow-blue-600/30' : 'text-slate-600 hover:text-slate-300'}`}
                                >
                                    {t}
                                </button>
                             ))}
                        </div>
                        <button 
                            onClick={generateDraft}
                            disabled={!intent.trim() || loading}
                            className={`flex items-center gap-4 px-10 py-4 rounded-[1.5rem] font-black text-xs primary-gradient text-white shadow-[0_20px_40px_-10px_rgba(59,130,246,0.3)] hover:scale-[1.03] active:scale-95 transition-all disabled:opacity-50 border border-white/10`}
                        >
                            {loading ? <Loader2 size={18} className="animate-spin text-white" /> : <Sparkles size={18} />}
                            SYNC NEURAL DRAFT
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-10 animate-fade-in">
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-4">
                             <InputField icon={<CornerUpRight size={14}/>} label="Signal Destination" value={initialRecipient || draft.recipient || "Global Discovery"} readOnly={!!initialRecipient} />
                             <InputField icon={<Palette size={14}/>} label="Thread Header" value={draft.subject} onChange={(v) => setDraft({...draft, subject: v})} />
                        </div>
                        <div className="bg-black/40 rounded-[2.5rem] p-10 min-h-[300px] relative group border border-white/5 shadow-inner">
                            <div className="flex items-center gap-3 mb-8">
                                <ShieldCheck size={14} className="text-emerald-500" />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Verified AI Signal</span>
                                {isPreDrafted && (
                                    <div className="ml-auto flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                        <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Proactive Mode</span>
                                    </div>
                                )}
                            </div>
                            <textarea 
                                value={draft.body}
                                onChange={(e) => setDraft({...draft, body: e.target.value})}
                                className="w-full min-h-[220px] bg-transparent border-none focus:ring-0 text-slate-200 text-sm leading-relaxed outline-none resize-none font-bold custom-scrollbar"
                            />
                            <div className="absolute top-10 right-10 opacity-20 group-hover:opacity-100 transition-opacity">
                                <div className="px-5 py-2 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20 text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl">Cognitive Layer V2</div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-4">
                         <button onClick={() => { setDraft(null); setIsPreDrafted(false); }} className="text-[10px] font-black text-slate-500 hover:text-white transition-all uppercase tracking-[0.2em] flex items-center gap-3 group">
                             <ArrowRight size={14} className="rotate-180 group-hover:-translate-x-1 transition-transform"/>
                             Discard & Re-Prompt
                         </button>
                         <button 
                            onClick={handleSend}
                            disabled={sending}
                            className={`flex items-center gap-4 px-12 py-5 rounded-[2rem] font-black text-sm accent-gradient text-white shadow-[0_30px_60px_-15px_rgba(59,130,246,0.3)] hover:scale-[1.03] active:scale-95 transition-all disabled:opacity-50 border border-white/10`}
                         >
                            {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                            EXECUTE DISPATCH
                         </button>
                    </div>
                </div>
            )}
        </div>

        <footer className="px-12 py-8 bg-black/20 border-t border-white/5 flex items-center justify-center gap-10">
             <div className="flex items-center gap-3 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">
                <ShieldCheck size={16} className="text-blue-500" />
                <span>Signal Verified</span>
             </div>
             <div className="w-1.5 h-1.5 rounded-full bg-white/5" />
             <div className="flex items-center gap-3 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">
                <Zap size={16} className="text-amber-500" />
                <span>Low Latency Layer</span>
             </div>
        </footer>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, icon, readOnly = false }) {
    return (
        <div className="flex-1 glass rounded-2xl p-6 border border-white/5 shadow-2xl bg-white/2">
            <div className="flex items-center gap-3 mb-2.5 opacity-40">
                {icon}
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300">{label}</label>
            </div>
            <input 
                type="text"
                value={value}
                readOnly={readOnly}
                onChange={(e) => onChange && onChange(e.target.value)}
                className={`w-full bg-transparent text-sm outline-none font-bold text-white placeholder:text-slate-800 ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
        </div>
    );
}

export default ComposeModal;
