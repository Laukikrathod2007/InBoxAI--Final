// Browser-only backend for the public demo (no server, no Gmail, no model).
// Every request the dashboard makes is answered here from the synthetic mailbox.
// Changes (archive, mute, undo) live in memory and reset on reload.
import axios from 'axios';
import { EMAILS, REVIEW_IDS, HIDDEN_IDS } from './data.js';

const now = Date.now();
const state = {
  emails: EMAILS.map((e) => ({ ...e })),
  audit: HIDDEN_IDS.map((id, i) => ({
    id: i + 1, component: 'autopilot', level: 'INFO', message: 'DRY_RUN archive',
    details: { email_id: id, action: 'archive', detail: '', executed: false },
    timestamp: new Date(now - i * 600000).toISOString(),
  })),
  threshold: 70,
};

const CATEGORY = {
  Naukri: /naukri|recruiter|jobs/i, LinkedIn: /linkedin/i, Quora: /quora/i, Marketing: /newsletter|promo|marketing|sales|deals/i,
};

function reviewQueue() {
  return state.emails
    .filter((e) => REVIEW_IDS.includes(e.id) && !e.is_done)
    .map((e, i) => ({ id: i + 1, email_id: e.id, type: 'task', title: e.subject, description: 'Low confidence. Check before acting.', priority: 'high', status: 'open', confidence: 55 }));
}

function byCategory() {
  const out = {};
  for (const [name, re] of Object.entries(CATEGORY)) {
    const hits = state.emails.filter((e) => re.test(e.sender));
    out[name] = {
      count: hits.length, icon: 'mail', color: 'primary',
      summary: `${hits.length} emails from ${new Set(hits.map((h) => h.sender)).size} senders`,
      senders: [...new Set(hits.map((h) => h.sender))].slice(0, 5), latest: [],
    };
  }
  return out;
}

const DRAFT = (intent) => ({
  subject: 'Re: your message',
  body: `Hi,\n\nThanks for your email. ${intent.trim().replace(/\.?$/, '.')}\n\nBest regards,`,
});

function respond(method, path, params, body) {
  const find = (id) => state.emails.find((e) => e.id === id);
  if (method === 'get') {
    switch (path) {
      case '/api/session': return { token: 'demo' };
      case '/api/user-profile': return { email: 'demo@inboxiq.example', name: 'Demo User', total_messages: state.emails.length, labels: state.emails.length };
      case '/api/history': return state.emails;
      case '/api/search': {
        const q = String(params?.q || '').toLowerCase();
        return state.emails.filter((e) => !q || `${e.subject} ${e.sender} ${e.summary}`.toLowerCase().includes(q));
      }
      case '/api/emails-by-category': return byCategory();
      case '/api/document-extractions': return [];
      case '/api/extraction-stats': return { total_extractions: 0, by_type: [], confidence_distribution: { high: 0, medium: 0, low: 0 }, success_rate: 0 };
      case '/api/review-queue': return reviewQueue();
      case '/api/settings': return { confidence_threshold: state.threshold, autopilot_mode: 'assist', autopilot_active: true };
      case '/api/autopilot/audit': return state.audit;
      case '/api/stats': return { total_processed: state.emails.length, noise_count: HIDDEN_IDS.length, needs_reply: 0, system_errors: 0 };
      case '/automation/status': return { automation_active: false, cycle_in_progress: false, last_cycle_at: new Date(now).toISOString(), polling_interval_seconds: 60 };
      case '/health': return { status: 'healthy' };
      default: return null;
    }
  }
  if (path === '/api/overrides') {
    const e = find(body.email_id);
    if (e) {
      if (body.is_done) { e.is_done = true; e.status = 'archived'; }
      if (body.is_noise) { e.is_done = true; e.status = 'noise'; }
    }
    return { status: 'success' };
  }
  if (path === '/api/bulk-action') {
    const re = CATEGORY[body.category];
    const hits = re ? state.emails.filter((e) => re.test(e.sender)) : [];
    hits.forEach((e) => { e.is_done = true; e.status = body.action === 'archive' ? 'archived' : 'noise'; });
    return { updated: hits.length };
  }
  if (path.startsWith('/api/autopilot/undo/')) return { status: 'undone' };
  if (path === '/api/compose-draft') return DRAFT(body.intent || '');
  if (path === '/api/send') return { status: 'success', message_id: 'demo' };
  if (path === '/api/chat') {
    const open = reviewQueue().length;
    return { response: `This is the demo, so answers are canned. You have ${open} emails waiting for review and ${HIDDEN_IDS.length} hidden as noise. In the real app a local model answers from your own inbox.` };
  }
  if (path === '/api/settings') { state.threshold = body.confidence_threshold; return { status: 'success' }; }
  return { status: 'ok' };
}

export function installMockApi() {
  axios.defaults.adapter = async (config) => {
    const url = new URL(config.url, window.location.origin);
    const path = url.pathname.replace(/^.*?(?=\/(api|automation|process-now|health))/, '');
    const body = typeof config.data === 'string' ? JSON.parse(config.data || '{}') : (config.data || {});
    const data = respond((config.method || 'get').toLowerCase(), path, config.params, body);
    if (data === null) return Promise.reject(Object.assign(new Error('Not found'), { config, response: { status: 404, data: {} } }));
    await new Promise((r) => setTimeout(r, 120)); // feel like a real request
    return { data, status: 200, statusText: 'OK', headers: {}, config, request: {} };
  };
  // Only intercept this app's own API paths. Everything else (Pyodide's .wasm,
  // fonts, rules.py) must reach the real network.
  const realFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const url = new URL(typeof input === 'string' ? input : input.url, window.location.origin);
    const isApi = url.origin === window.location.origin && /\/(api|automation|process-now|health)(\/|$)/.test(url.pathname);
    if (!isApi) return realFetch(input, init);
    const path = url.pathname.replace(/^.*?(?=\/(api|automation|process-now|health))/, '');
    const data = respond('get', path, {}, {});
    return new Response(JSON.stringify(data ?? {}), { status: data ? 200 : 404, headers: { 'Content-Type': 'application/json' } });
  };
}
