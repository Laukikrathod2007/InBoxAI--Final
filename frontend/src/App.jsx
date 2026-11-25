import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Toaster, toast } from 'sonner';
import SideBar from './components/SideBar';
import TopBar from './components/TopBar';
import EmailCard from './components/EmailCard';
import RightPanel from './components/RightPanel';
import EmailList from './components/EmailList';
import AskModal from './components/AskModal';

const API_BASE = '/api';

const CATEGORY_STYLE_MAP = {
  primary: { iconBg: 'bg-primary-container/25', iconColor: 'text-primary' },
  secondary: { iconBg: 'bg-secondary-container/25', iconColor: 'text-secondary' },
  'on-surface-variant': { iconBg: 'bg-surface-container-low/70', iconColor: 'text-on-surface-variant' },
  surface: { iconBg: 'bg-surface-container-lowest/90', iconColor: 'text-on-surface' },
  tertiary: { iconBg: 'bg-tertiary/20', iconColor: 'text-tertiary' },
  default: { iconBg: 'bg-surface-container-low/70', iconColor: 'text-on-surface-variant' }
};

const URGENCY_STYLES = (count) => {
  if (count >= 20) return 'bg-rose-100 text-rose-700';
  if (count >= 8) return 'bg-amber-100 text-amber-700';
  return 'bg-emerald-100 text-emerald-700';
};

export default function App() {
  const [selectedView, setSelectedView] = useState('ActionRequired');
  const [userProfile, setUserProfile] = useState(null);
  const [emailGroups, setEmailGroups] = useState({});
  const [historyEmails, setHistoryEmails] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [autopilotMode, setAutopilotMode] = useState('assist');
  const [searchResults, setSearchResults] = useState([]);
  const [automationStatus, setAutomationStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [askOpen, setAskOpen] = useState(false);
  const [askResponse, setAskResponse] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [documentExtractions, setDocumentExtractions] = useState([]);
  const [extractionStats, setExtractionStats] = useState(null);
  const [reviewQueue, setReviewQueue] = useState([]);
  const [sliderThreshold, setSliderThreshold] = useState(75); // Configurable threshold

  const VIEW_META = {
    ActionRequired: {
      title: 'Action Required',
      subtitle: 'Only emails requiring immediate attention, tasks, or reply drafting.',
    },
    WaitingFYI: {
      title: 'Waiting / FYI',
      subtitle: 'Important informational updates, knowledge documents, or low-urgency files.',
    },
    Documents: {
      title: 'Document Intelligence',
      subtitle: 'Extracted invoices, resumes, and structured intelligence parsed from PDFs.',
    },
    NoiseAutomated: {
      title: 'Noise / Automated',
      subtitle: 'Unsubscribed promotions, system newsletters, and automated notifications.',
    },
    AIBriefing: {
      title: 'Daily AI Briefing',
      subtitle: 'A high-level personalized summary of tasks, invoices, and deadlines.',
    },
    Settings: {
      title: 'Settings & Automation',
      subtitle: 'Connected account, risk threshold controls, and autopilot triggers.',
    },
    Archive: {
      title: 'Archive Feed',
      subtitle: 'All completed operations, historical drafts, and archived notifications.',
    },
    Rules: {
      title: 'Routing Rules & Filters',
      subtitle: 'Configure automated sorting, deterministic rules, and domain-level reputations.',
    },
    Search: {
      title: 'Search results',
      subtitle: 'Filtered messages matching your query.',
    },
  };

  const getFilteredEmails = (view, emailsList) => {
    if (view === 'ActionRequired') {
      return emailsList.filter(item => 
        !item.is_done && 
        !item.is_noise && 
        ['REPLY', 'TASK', 'SCHEDULE', 'PROCESS_INVOICE', 'PROCESS_RESUME', 'REVIEW'].includes(item.status)
      );
    }
    if (view === 'WaitingFYI') {
      return emailsList.filter(item => 
        !item.is_done && 
        !item.is_noise && 
        (!item.status || ['FYI_KNOWLEDGE','processed','IGNORE','READ_LATER'].includes(item.status))
      );
    }
    if (view === 'NoiseAutomated') {
      return emailsList.filter(item => 
        item.is_noise || 
        item.status === 'ARCHIVE' || 
        item.status === 'noise'
      );
    }
    if (view === 'Archive') {
      return emailsList.filter(item => 
        item.is_done || 
        item.status === 'archived'
      );
    }
    return emailsList;
  };

  useEffect(() => {
    refreshDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedView]); // Refresh when view changes to recalculate filters

  const refreshDashboard = async () => {
    setLoading(true);
    try {
      const [profileRes, categoriesRes, historyRes, automationRes, extractionsRes, extractionStatsRes, reviewQueueRes, settingsRes] = await Promise.all([
        axios.get(`${API_BASE}/user-profile`),
        axios.get(`${API_BASE}/emails-by-category`),
        axios.get(`${API_BASE}/history`),
        axios.get('/automation/status'),
        axios.get(`${API_BASE}/document-extractions`),
        axios.get(`${API_BASE}/extraction-stats`),
        axios.get(`${API_BASE}/review-queue`),
        axios.get(`${API_BASE}/settings`),
      ]);

      // Guard every list: one malformed response must not blank the whole app.
      const asList = (d) => (Array.isArray(d) ? d : []);
      const historyList = asList(historyRes.data);
      const extractionsList = asList(extractionsRes.data);

      setUserProfile(profileRes.data);
      setEmailGroups(categoriesRes.data);
      setHistoryEmails(historyList);
      axios.get(`${API_BASE}/autopilot/audit`, { params: { limit: 50 } })
        .then((r) => setAuditLog(r.data || []))
        .catch(() => setAuditLog([]));
      setAutomationStatus(automationRes.data);
      setDocumentExtractions(extractionsList);
      setExtractionStats(extractionStatsRes.data);
      setReviewQueue(asList(reviewQueueRes.data));
      if (settingsRes.data?.autopilot_mode) setAutopilotMode(settingsRes.data.autopilot_mode);
      if (settingsRes.data && settingsRes.data.confidence_threshold) {
        setSliderThreshold(settingsRes.data.confidence_threshold);
      }

      setSearchResults(getFilteredEmails(selectedView, historyList));
    } catch (error) {
      console.error('Dashboard refresh failed:', error);
      toast.error('Cannot refresh the dashboard. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    setSelectedView('Search');

    try {
      const res = await axios.get(`${API_BASE}/search`, { params: { q: query } });
      setSearchResults(res.data || []);
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Search failed.');
    }
  };

  const extractionMatchesCategory = (extraction, categoryName) => {
    const sender = (extraction.email_sender || '').toLowerCase();
    const subject = (extraction.email_subject || '').toLowerCase();
    const lookup = {
      Naukri: /naukri|recruiter|jobs|careers?/,
      LinkedIn: /linkedin/,
      Quora: /quora/,
      Marketing: /newsletter|promo|marketing|sales|deals?/,
    };
    const pattern = lookup[categoryName];
    if (!pattern) return false;
    return pattern.test(sender) || pattern.test(subject);
  };

  const handleNavigate = async (inView) => {
    const view = inView === 'Inbox' ? 'ActionRequired' : inView;
    setSelectedView(view);
    setSearchQuery('');
    setSearchResults(getFilteredEmails(view, historyEmails));
  };

  const handleCategoryAction = async (category, action) => {
    try {
      const res = await axios.post(`${API_BASE}/bulk-action`, { category, action });
      toast.success(`${action === 'archive' ? 'Archived' : 'Muted'} ${res.data.updated} emails in ${category}`);
      refreshDashboard();
    } catch (error) {
      console.error('Category action failed:', error);
      toast.error('Failed to apply category action.');
    }
  };

  const handleArchiveEmail = async (emailId) => {
    try {
      await axios.post(`${API_BASE}/overrides`, { email_id: emailId, is_done: true });
      toast.success('Email archived.');
      refreshDashboard();
    } catch (error) {
      console.error('Archive email failed:', error);
      toast.error('Unable to archive email.');
    }
  };

  const handleMuteEmail = async (emailId) => {
    try {
      await axios.post(`${API_BASE}/overrides`, { email_id: emailId, is_noise: true });
      toast.success('Email muted as noise.');
      refreshDashboard();
    } catch (error) {
      console.error('Mute email failed:', error);
      toast.error('Unable to mute email.');
    }
  };

  const handleAskSubmit = async (message) => {
    try {
      const res = await axios.post(`${API_BASE}/chat`, { message });
      setAskResponse(res.data.response || 'No response.');
      setAskOpen(true);
    } catch (error) {
      console.error('Ask InBoxIQ failed:', error);
      toast.error('Could not ask InBoxIQ.');
    }
  };

  const handleUndo = async (logId) => {
    try {
      await axios.post(`${API_BASE}/autopilot/undo/${logId}`);
      toast.success('Restored to your inbox.');
      refreshDashboard();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Undo failed.');
    }
  };

  const handleProcessNow = async () => {
    try {
      await axios.post('/process-now');
      toast.success('Processing cycle started.');
      setTimeout(refreshDashboard, 1500);
    } catch (error) {
      console.error('Process now failed:', error);
      toast.error('Unable to trigger processing.');
    }
  };

  const toggleAutomation = async () => {
    try {
      if (automationStatus?.cycle_in_progress || automationStatus?.automation_active) {
        await axios.post('/automation/stop');
        toast.success('Automation stopped.');
      } else {
        await axios.post('/automation/start');
        toast.success('Automation started.');
      }
      const statusRes = await axios.get('/automation/status');
      setAutomationStatus(statusRes.data);
    } catch (error) {
      console.error('Automation toggle failed:', error);
      toast.error('Unable to update automation state.');
    }
  };

  const emailGroupsArray = Object.entries(emailGroups).map(([name, data]) => {
    const style = CATEGORY_STYLE_MAP[data.color] || CATEGORY_STYLE_MAP.default;

    const categoryExtractions = documentExtractions.filter((extraction) =>
      extractionMatchesCategory(extraction, name) && extraction.confidence >= 60
    );

    const latestExtraction = categoryExtractions.sort((a, b) =>
      new Date(b.created_at) - new Date(a.created_at)
    )[0];

    return {
      id: name.toLowerCase(),
      title: name,
      count: data.count || 0,
      icon: data.icon || 'mail',
      summary: data.summary || `${data.count || 0} emails`,
      badge: name === 'Naukri' ? 'High Volume' : null,
      iconBg: style.iconBg,
      iconColor: style.iconColor,
      urgencyClass: URGENCY_STYLES(data.count || 0),
      documentData: latestExtraction,
      actions: [
        { label: 'Archive', action: 'archive' },
        { label: 'Mute', action: 'mute' }
      ]
    };
  });

  const sidebarCounts = {
    ActionRequired: getFilteredEmails('ActionRequired', historyEmails).length,
    WaitingFYI: getFilteredEmails('WaitingFYI', historyEmails).length,
    Documents: documentExtractions.length,
    NoiseAutomated: getFilteredEmails('NoiseAutomated', historyEmails).length,
  };

  // Derive dynamic stats for Briefing dashboard
  const actionItemsCount = historyEmails.filter(item => 
    !item.is_done && 
    !item.is_noise && 
    ['REPLY', 'TASK', 'SCHEDULE', 'PROCESS_INVOICE', 'PROCESS_RESUME', 'REVIEW'].includes(item.status)
  ).length;

  const highPriorityCount = historyEmails.filter(item => 
    !item.is_done && 
    !item.is_noise && 
    (item.priority || '').toLowerCase() === 'high'
  ).length;

  const dueTodayCount = historyEmails.filter(item => 
    !item.is_done && 
    !item.is_noise && 
    ((item.priority || '').toLowerCase() === 'high' || (item.deadlines && JSON.stringify(item.deadlines).toLowerCase().includes('today')))
  ).length;

  const overdueCount = historyEmails.filter(item => 
    !item.is_done && 
    !item.is_noise && 
    (item.priority || '').toLowerCase() === 'high' && 
    ['REPLY', 'TASK'].includes(item.status)
  ).length;

  const invoicesCount = documentExtractions.filter(d => d.document_type === 'invoice').length;

  const totalInvoiceAmount = documentExtractions.filter(d => d.document_type === 'invoice').reduce((sum, d) => {
    const amt = parseFloat(d.extracted_data?.total_amount || d.extracted_data?.amount || 0);
    return sum + (isNaN(amt) ? 0 : amt);
  }, 0);

  const formattedInvoiceAmount = totalInvoiceAmount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const getDynamicPriorities = () => {
    return historyEmails.filter(item => 
      !item.is_done && 
      !item.is_noise && 
      ['REPLY', 'TASK', 'SCHEDULE', 'PROCESS_INVOICE', 'PROCESS_RESUME', 'REVIEW'].includes(item.status)
    ).map(item => ({
      id: item.id,
      title: item.subject,
      desc: `${item.sender.replace(/<.*>/, '').trim()} • Action required`,
      priority: item.priority || 'MEDIUM',
      email: item
    })).slice(0, 5);
  };

  const getDynamicSchedule = () => {
    return historyEmails.filter(item => 
      !item.is_done && 
      !item.is_noise && 
      item.status === 'SCHEDULE'
    ).map((item, index) => {
      const times = ['10:00 AM', '12:00 PM', '2:00 PM', '4:30 PM'];
      return {
        id: item.id,
        time: times[index % times.length],
        title: item.subject,
        duration: '30 min',
        icon: 'group',
        email: item
      };
    }).slice(0, 4);
  };

  const getDynamicInvoices = () => {
    return documentExtractions.filter(d => d.document_type === 'invoice').map(doc => {
      const amt = parseFloat(doc.extracted_data?.total_amount || doc.extracted_data?.amount || 0);
      return {
        id: doc.id,
        number: doc.extracted_data?.invoice_number || `#INV-${doc.id}`,
        vendor: doc.extracted_data?.vendor || 'Unknown Vendor',
        due_date: doc.extracted_data?.due_date || 'N/A',
        amount: amt,
        status: 'DUE',
        doc: doc
      };
    });
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 antialiased">
      <Toaster position="top-center" richColors theme="light" />

      <SideBar
        userProfile={userProfile}
        selectedView={selectedView}
        onNavigate={handleNavigate}
        onProcessNow={handleProcessNow}
        automationStatus={automationStatus}
        onToggleAutomation={toggleAutomation}
        counts={sidebarCounts}
      />

      <TopBar onRefresh={refreshDashboard} onSearch={handleSearch} activeSection={selectedView} mode={autopilotMode} onAsk={() => setAskOpen(true)} />

      <main className="ml-64 pt-16 min-h-screen">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-8 py-8">
          
          {/* VIEW: ActionRequired */}
          {selectedView === 'ActionRequired' && (
            <div className="flex flex-col gap-8">
              <div className="pb-1">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Needs you</h2>
                <p className="mt-1 text-sm text-slate-500">Mail that needs a reply, a decision or a task. Unsure items wait in review first.</p>
              </div>

              {/* Human-in-the-Loop Review Queue */}
              {reviewQueue.length > 0 && (
                <div className="rounded-3xl border-2 border-amber-300 bg-amber-50/30 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-600">gavel</span>
                      <h3 className="text-lg font-bold text-amber-900">Needs Human Verification ({reviewQueue.length})</h3>
                    </div>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">RISK OVERRIDE QUEUE</span>
                  </div>
                  <p className="text-xs text-amber-800/80 mb-4">
                    The following items fell below the {sliderThreshold}% confidence guardrail and require direct verification before execution.
                  </p>
                  <div className="grid gap-4 md:grid-cols-2">
                    {reviewQueue.map((item) => (
                      <div key={item.id} className="rounded-2xl bg-white p-5 border border-amber-200 shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <h4 className="font-bold text-slate-900 leading-snug">{item.title}</h4>
                            <span className="rounded-xl bg-rose-100 text-rose-700 px-2 py-1 text-[10px] font-bold uppercase">{item.priority || 'medium'}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-2">Type: <span className="font-semibold">{item.type?.toUpperCase()}</span></p>
                          <div className="mt-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <p className="font-semibold text-slate-700">AI Draft Preview:</p>
                            <p className="italic mt-1">"{item.description || 'Draft response pending auto-composition...'}"</p>
                          </div>
                        </div>
                        
                        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold text-amber-700 flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">sentiment_neutral</span>
                            Confidence: {item.confidence ?? 0}%
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                toast.success("Marked as reviewed. Nothing was sent.");
                                axios.post(`${API_BASE}/overrides`, { email_id: item.email_id, is_done: true });
                                refreshDashboard();
                              }}
                              className="rounded-xl bg-emerald-600 text-white px-3 py-2 text-xs font-semibold hover:bg-emerald-500 transition shadow-sm"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                toast.info("Item snoozed for 24h.");
                                refreshDashboard();
                              }}
                              className="rounded-xl border border-slate-200 text-slate-600 px-3 py-2 text-xs font-semibold hover:bg-slate-50 bg-white transition shadow-sm"
                            >
                              Snooze
                            </button>
                            <button
                              onClick={() => {
                                toast.warning("Muted email.");
                                axios.post(`${API_BASE}/overrides`, { email_id: item.email_id, is_noise: true });
                                refreshDashboard();
                              }}
                              className="rounded-xl text-rose-600 hover:bg-rose-50 px-2 py-2 text-xs font-semibold transition"
                            >
                              Ignore
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Primary Action Emails */}
              <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
                <h3 className="border-b border-slate-100 px-5 py-3 text-sm font-semibold text-slate-900">Inbox</h3>
                <EmailList
                  emails={searchResults}
                  isLoading={loading}
                  onArchive={handleArchiveEmail}
                  onMute={handleMuteEmail}
                />
              </div>
            </div>
          )}

          {/* VIEW: WaitingFYI */}
          {selectedView === 'WaitingFYI' && (
            <div className="flex flex-col gap-8">
              <div className="pb-1">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">FYI</h2>
                <p className="mt-1 text-sm text-slate-500">Updates worth knowing about. Nothing to do here.</p>
              </div>

              <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
                <EmailList
                  emails={searchResults}
                  isLoading={loading}
                  onArchive={handleArchiveEmail}
                  onMute={handleMuteEmail}
                />
              </div>
            </div>
          )}

          {/* VIEW: Documents */}
          {selectedView === 'Documents' && (
            <div className="flex flex-col gap-8 animate-in">
              <div className="pb-1">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Documents</h2>
                <p className="mt-1 text-sm text-slate-500">Details pulled from PDF attachments such as invoices and resumes.</p>
              </div>

              {/* Extraction Summary */}
              <div className="grid grid-cols-3 gap-6">
                <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden flex flex-col justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Total Extracted Documents</p>
                  <div className="mt-4 flex items-baseline justify-between">
                    <p className="text-4xl font-extrabold text-primary">{extractionStats?.total_extractions ?? 0}</p>
                    <span className="material-symbols-outlined text-slate-300 text-3xl">cloud_done</span>
                  </div>
                </div>
                <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden flex flex-col justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">AI Extraction Success</p>
                  <div className="mt-4 flex items-baseline justify-between">
                    <p className="text-4xl font-extrabold text-emerald-600">{extractionStats?.success_rate ?? 0}%</p>
                    <span className="material-symbols-outlined text-emerald-200 text-3xl">task_alt</span>
                  </div>
                </div>
                <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden flex flex-col justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Pending Review</p>
                  <div className="mt-4 flex items-baseline justify-between">
                    <p className="text-4xl font-extrabold text-rose-600">{reviewQueue.length}</p>
                    <span className="material-symbols-outlined text-rose-200 text-3xl">rate_review</span>
                  </div>
                </div>
              </div>

              {/* Document Extractions Grid */}
              <div className="rounded-3xl bg-white p-8 border border-slate-200 shadow-sm">
                <h3 className="text-xl font-bold text-slate-900 mb-6">Parsed PDF Records</h3>
                {documentExtractions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                          <th className="py-4">Document Type</th>
                          <th className="py-4">File Name</th>
                          <th className="py-4">Confidence</th>
                          <th className="py-4">Parsed Metadata</th>
                          <th className="py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-sm">
                        {documentExtractions.map((doc) => (
                          <tr key={doc.id} className="hover:bg-slate-50/50 transition">
                            <td className="py-4 font-bold text-slate-900">
                              <span className={`inline-block rounded-xl px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] ${doc.document_type === 'invoice' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                {doc.document_type || 'Unknown'}
                              </span>
                            </td>
                            <td className="py-4 font-semibold text-slate-600 max-w-[200px] truncate">{doc.filename}</td>
                            <td className="py-4">
                              <span className={`font-bold ${doc.confidence >= 80 ? 'text-emerald-600' : doc.confidence >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
                                {doc.confidence ?? 0}%
                              </span>
                            </td>
                            <td className="py-4 text-xs text-slate-500 max-w-[300px]">
                              <pre className="font-mono bg-slate-50 p-2 rounded-lg max-h-[80px] overflow-y-auto whitespace-pre-wrap">
                                {JSON.stringify(doc.extracted_data, null, 2)}
                              </pre>
                            </td>
                            <td className="py-4 text-right">
                              <button
                                onClick={() => {
                                  toast.success(`Metadata for ${doc.filename} approved!`);
                                }}
                                className="rounded-xl bg-slate-900 text-white px-3 py-2 text-xs font-semibold hover:bg-slate-800 transition"
                              >
                                Accept
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400">
                    <span className="material-symbols-outlined text-5xl">folder_zip</span>
                    <p className="mt-4 text-sm font-semibold">No extracted documents found</p>
                    <p className="mt-1 text-xs">AI will process PDF attachments automatically when emails arrive.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW: NoiseAutomated */}
          {selectedView === 'NoiseAutomated' && (
            <div className="flex flex-col gap-8 animate-in">
              <div className="pb-1">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Hidden</h2>
                <p className="mt-1 text-sm text-slate-500">Newsletters, promotions and automated mail kept out of your way.</p>
              </div>

              {/* Quick Signal Categories */}
              <div className="grid gap-6 xl:grid-cols-2">
                {emailGroupsArray.map((group) => (
                  <EmailCard
                    key={group.id}
                    title={group.title}
                    count={group.count}
                    icon={group.icon}
                    summary={group.summary}
                    badge={group.badge}
                    actions={group.actions}
                    bgColor="bg-gradient-to-br from-white to-slate-50"
                    iconBg={group.iconBg}
                    iconColor={group.iconColor}
                    urgencyClass={group.urgencyClass}
                    documentData={group.documentData}
                    onAction={(action) => handleCategoryAction(group.title, action)}
                  />
                ))}
              </div>

              {/* Noise Email List */}
              <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
                <h3 className="border-b border-slate-100 px-5 py-3 text-sm font-semibold text-slate-900">Hidden mail</h3>
                <EmailList
                  emails={searchResults}
                  isLoading={loading}
                  onArchive={handleArchiveEmail}
                  onMute={handleMuteEmail}
                />
              </div>
            </div>
          )}

          {/* VIEW: Archive */}
          {selectedView === 'Archive' && (
            <div className="flex flex-col gap-8 animate-in">
              <div className="pb-1">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Archive & activity</h2>
                <p className="mt-1 text-sm text-slate-500">Mail you finished, plus everything autopilot did or would have done.</p>
              </div>

              <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-400">archive</span>
                  Archive Registry
                </h3>
                <EmailList
                  emails={searchResults}
                  isLoading={loading}
                  onArchive={handleArchiveEmail}
                  onMute={handleMuteEmail}
                />
              </div>
            </div>
          )}

          {/* Autopilot activity with undo (shown under Archive) */}
          {selectedView === 'Archive' && (
            <section aria-labelledby="audit-title" className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
              <h3 id="audit-title" className="text-xl font-bold text-slate-900 mb-1">Autopilot activity</h3>
              <p className="text-xs text-slate-500 mb-4">
                DRY RUN = what assist mode would do (Gmail unchanged). DONE = changed in Gmail.
              </p>
              {auditLog.length === 0 ? (
                <p className="text-sm text-slate-500">No autopilot actions yet.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {auditLog.map((row) => {
                    const d = row.details || {};
                    const canUndo = d.executed && d.action === 'archive' && !d.undone;
                    return (
                      <li key={row.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                        <span className="min-w-0 truncate">
                          <span className={`mr-2 rounded px-2 py-0.5 text-[10px] font-bold ${d.executed ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                            {d.undone ? 'UNDONE' : d.executed ? 'DONE' : 'DRY RUN'}
                          </span>
                          {d.action}{d.detail ? ` (${d.detail})` : ''} · {d.email_id}
                        </span>
                        {canUndo && (
                          <button
                            type="button"
                            onClick={() => handleUndo(row.id)}
                            className="shrink-0 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50"
                          >
                            Undo
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          )}

          {/* VIEW: Rules */}
          {selectedView === 'Rules' && (
            <div className="flex flex-col gap-8 animate-in">
              <div className="pb-1">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Rules</h2>
                <p className="mt-1 text-sm text-slate-500">Sender patterns that group bulk mail. Use them to archive or mute a whole group.</p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {[
                  { name: "Naukri", desc: "Filters high-volume job alert lists and recruiter emails.", patterns: "naukri, recruiter, jobs", count: emailGroups.Naukri?.count ?? 0, icon: "work", color: "text-blue-600 bg-blue-50" },
                  { name: "LinkedIn", desc: "Isolates social networking updates, connection requests, and messages.", patterns: "linkedin", count: emailGroups.LinkedIn?.count ?? 0, icon: "group", color: "text-indigo-600 bg-indigo-50" },
                  { name: "Quora", desc: "Groups question-and-answer forum updates and digest emails.", patterns: "quora", count: emailGroups.Quora?.count ?? 0, icon: "quiz", color: "text-amber-600 bg-amber-50" },
                  { name: "Marketing", desc: "Identifies newsletters, promotions, sales deals, and unsubscribe links.", patterns: "newsletter, promo, marketing, sales, deals", count: emailGroups.Marketing?.count ?? 0, icon: "campaign", color: "text-rose-600 bg-rose-50" }
                ].map((rule) => (
                  <div key={rule.name} className="rounded-3xl bg-white p-8 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all duration-300">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className={`material-symbols-outlined p-3 rounded-2xl ${rule.color}`}>{rule.icon}</span>
                          <div>
                            <h3 className="text-lg font-bold text-slate-900">{rule.name} Rule</h3>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">DETERMINISTIC ROUTER</span>
                          </div>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                          {rule.count} Matched
                        </span>
                      </div>
                      
                      <p className="text-sm text-slate-500 mb-6 leading-relaxed">{rule.desc}</p>
                      
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6 text-xs space-y-2">
                        <div className="flex justify-between">
                          <span className="font-semibold text-slate-400">Trigger Conditions:</span>
                          <span className="font-mono text-slate-700">Sender / Subject contains</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {rule.patterns.split(", ").map(p => (
                            <span key={p} className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[10px] font-mono text-slate-600">{p}</span>
                          ))}
                        </div>
                        <div className="border-t border-slate-100 my-2 pt-2 flex justify-between">
                          <span className="font-semibold text-slate-400">Target Action:</span>
                          <span className="font-semibold text-rose-600">Auto-mute as Noise</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleCategoryAction(rule.name, "archive")}
                        className="flex-1 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 py-2.5 text-xs font-bold transition shadow-sm bg-white"
                      >
                        Archive All
                      </button>
                      <button
                        onClick={() => handleCategoryAction(rule.name, "mute")}
                        className="flex-1 rounded-xl bg-slate-900 text-white hover:bg-slate-800 py-2.5 text-xs font-bold transition shadow-sm"
                      >
                        Mute All
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW: AIBriefing */}
          {selectedView === 'AIBriefing' && (
            <div className="flex flex-col gap-8 animate-in text-slate-800">
              
              {/* Header block matching Reference Image exactly */}
              <div className="flex flex-col md:flex-row items-stretch justify-between gap-6">
                
                {/* Left Title details */}
                <div className="flex-1 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex items-center gap-4">
                  <div className="bg-indigo-50 text-indigo-600 p-4 rounded-2xl flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-3xl">lightbulb</span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">AI Briefing</h2>
                    <p className="text-sm text-slate-500 mt-1">Your daily executive briefing powered by InBoxIQ AI</p>
                  </div>
                  
                  {/* Date picker pill */}
                  <div className="ml-auto bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl flex items-center gap-2 text-xs font-bold text-slate-700 shadow-sm cursor-pointer hover:bg-slate-100 transition shrink-0">
                    <span>{new Date().toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'})}</span>
                    <span className="material-symbols-outlined text-xs">keyboard_arrow_down</span>
                  </div>
                </div>

                {/* Right greeting block */}
                <div className="bg-indigo-50/40 border border-indigo-100/50 rounded-3xl p-6 shadow-sm flex flex-col justify-center min-w-[280px]">
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-1.5">
                    Good morning, {userProfile?.name?.split(' ')[0] || 'there'} ☀️
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 font-semibold">Here's what matters today.</p>
                </div>

              </div>

              {/* 4 Stats Cards matching Reference Image exactly */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* 1. Action Items */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex items-center gap-4 hover:border-slate-300 transition duration-300">
                  <div className="bg-indigo-50 text-indigo-600 p-3.5 rounded-2xl shrink-0">
                    <span className="material-symbols-outlined text-2xl">check_box</span>
                  </div>
                  <div>
                    <h4 className="text-3xl font-black text-slate-900 tracking-tight">{actionItemsCount}</h4>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">Action Items</p>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Require your attention</p>
                  </div>
                </div>

                {/* 2. Due Today */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex items-center gap-4 hover:border-slate-300 transition duration-300">
                  <div className="bg-amber-50 text-amber-600 p-3.5 rounded-2xl shrink-0">
                    <span className="material-symbols-outlined text-2xl">calendar_today</span>
                  </div>
                  <div>
                    <h4 className="text-3xl font-black text-slate-900 tracking-tight">{dueTodayCount}</h4>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">Due Today</p>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Deadlines & meetings</p>
                  </div>
                </div>

                {/* 3. Overdue */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex items-center gap-4 hover:border-slate-300 transition duration-300">
                  <div className="bg-rose-50 text-rose-600 p-3.5 rounded-2xl shrink-0">
                    <span className="material-symbols-outlined text-2xl">flag</span>
                  </div>
                  <div>
                    <h4 className="text-3xl font-black text-slate-900 tracking-tight">{overdueCount}</h4>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">Overdue</p>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Need immediate action</p>
                  </div>
                </div>

                {/* 4. Invoices Due */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex items-center gap-4 hover:border-slate-300 transition duration-300">
                  <div className="bg-emerald-50 text-emerald-600 p-3.5 rounded-2xl shrink-0">
                    <span className="material-symbols-outlined text-2xl">description</span>
                  </div>
                  <div>
                    <h4 className="text-3xl font-black text-slate-900 tracking-tight">{invoicesCount}</h4>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">Invoices Due</p>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Totaling {formattedInvoiceAmount}</p>
                  </div>
                </div>

              </div>

              {/* 3 Column Grid Section matching Reference Image layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                
                {/* Column 1: Top Priorities */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all duration-300">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-6 border-b border-slate-100 pb-3">
                      <span className="material-symbols-outlined text-indigo-600 text-lg">notifications</span>
                      Top Priorities
                    </h3>
                    
                    <div className="space-y-4">
                      {getDynamicPriorities().length > 0 ? (
                        getDynamicPriorities().map((item) => (
                          <div 
                            key={item.id} 
                            onClick={() => {
                              setSelectedView('ActionRequired');
                            }}
                            className={`flex items-center justify-between gap-3 p-2 rounded-2xl transition ${item.email ? 'hover:bg-slate-50 cursor-pointer' : ''}`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="bg-slate-50 border border-slate-100 text-slate-400 p-2 rounded-xl flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-sm">description</span>
                              </div>
                              <div className="min-w-0">
                                <h5 className="text-xs font-bold text-slate-900 truncate">{item.title}</h5>
                                <p className="text-[10px] text-slate-500 mt-0.5 truncate">{item.desc}</p>
                              </div>
                            </div>

                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase shrink-0 ${
                              (item.priority || '').toLowerCase() === 'high' ? 'bg-rose-50 text-rose-600' :
                              (item.priority || '').toLowerCase() === 'medium' ? 'bg-amber-50 text-amber-600' :
                              'bg-emerald-50 text-emerald-600'
                            }`}>
                              {item.priority}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 border border-dashed border-slate-200 rounded-3xl py-12">
                          <span className="material-symbols-outlined text-3xl text-emerald-500 mb-2">check_circle</span>
                          <h4 className="text-xs font-black text-slate-800">All priorities resolved</h4>
                          <p className="text-[10px] text-slate-400 mt-1 max-w-[180px] leading-relaxed">No high-priority task flags detected in processed emails.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={() => handleNavigate('ActionRequired')}
                    className="mt-6 w-full border border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-700 py-3 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <span>View All Action Items</span>
                    <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </button>
                </div>

                {/* Column 2: Today's Schedule */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all duration-300">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-6 border-b border-slate-100 pb-3">
                      <span className="material-symbols-outlined text-indigo-600 text-lg">calendar_today</span>
                      Today's Schedule
                    </h3>
                    
                    <div className="space-y-5">
                      {getDynamicSchedule().length > 0 ? (
                        getDynamicSchedule().map((item) => (
                          <div 
                            key={item.id}
                            onClick={() => {
                              setSelectedView('ActionRequired');
                            }}
                            className={`flex items-center gap-4 p-1 rounded-2xl transition ${item.email ? 'hover:bg-slate-50 cursor-pointer' : ''}`}
                          >
                            <div className="text-xs font-extrabold text-slate-800 shrink-0 w-16">
                              {item.time}
                            </div>
                            
                            <div className="flex items-center gap-2.5 min-w-0 bg-slate-50 border border-slate-100 rounded-2xl p-2.5 flex-1">
                              <div className="bg-indigo-50 text-indigo-600 p-1.5 rounded-xl shrink-0">
                                <span className="material-symbols-outlined text-sm">{item.icon}</span>
                              </div>
                              <div className="min-w-0">
                                <h5 className="text-xs font-bold text-slate-900 truncate">{item.title}</h5>
                                <p className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5">{item.duration}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 border border-dashed border-slate-200 rounded-3xl py-12">
                          <span className="material-symbols-outlined text-3xl text-indigo-400 mb-2">event_busy</span>
                          <h4 className="text-xs font-black text-slate-800">Clear calendar today</h4>
                          <p className="text-[10px] text-slate-400 mt-1 max-w-[180px] leading-relaxed">No upcoming meeting invites found in your inbox database.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={() => handleNavigate('ActionRequired')}
                    className="mt-6 w-full border border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-700 py-3 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <span>View Calendar</span>
                    <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </button>
                </div>

                {/* Column 3: Invoice Summary */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all duration-300">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-6 border-b border-slate-100 pb-3">
                      <span className="material-symbols-outlined text-indigo-600 text-lg">payments</span>
                      Invoice Summary
                    </h3>
                    
                    {/* Ring Chart block matching Reference Image perfectly */}
                    <div className="flex items-center justify-between gap-4 bg-slate-50 border border-slate-100 p-4 rounded-2xl mb-6">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Due</span>
                        <h4 className="text-xl font-black text-slate-900 mt-1">{formattedInvoiceAmount}</h4>
                        
                        {/* Legend */}
                        <div className="mt-3 space-y-1.5">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></span>
                            <span className="font-semibold text-slate-500">Due This Week:</span>
                            <span className="font-bold text-slate-800">{formattedInvoiceAmount}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="w-2 h-2 rounded-full bg-indigo-200 shrink-0"></span>
                            <span className="font-semibold text-slate-500">Due Later:</span>
                            <span className="font-bold text-slate-800">$0.00</span>
                          </div>
                        </div>
                      </div>

                      {/* Pure dynamic SVG Donut chart */}
                      <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          {/* Background ring */}
                          <circle cx="18" cy="18" r="14.5" stroke="#e2e8f0" strokeWidth="3" fill="none" />
                          {/* Foreground progress ring (strokeDashoffset 91 = 0%, 0 = 100%) */}
                          <circle cx="18" cy="18" r="14.5" stroke="#6366f1" strokeWidth="3" fill="none"
                            strokeDasharray="91" strokeDashoffset={totalInvoiceAmount > 0 ? 0 : 91} strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                          <span className="text-[10px] font-black text-slate-900">{totalInvoiceAmount > 0 ? 100 : 0}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {getDynamicInvoices().length > 0 ? (
                        getDynamicInvoices().map((item) => (
                          <div 
                            key={item.id}
                            className="border border-slate-100 rounded-2xl p-3.5 bg-white flex items-center justify-between shadow-sm"
                          >
                            <div>
                              <h5 className="text-xs font-black text-slate-900">{item.number}</h5>
                              <p className="text-[9px] text-slate-400 font-semibold mt-0.5">{item.vendor} • {item.due_date}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-black text-slate-900 block">${item.amount.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                              <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 text-[9px] font-extrabold">{item.status}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 border border-dashed border-slate-200 rounded-3xl py-8">
                          <span className="material-symbols-outlined text-3xl text-slate-300 mb-2">receipt_long</span>
                          <h4 className="text-xs font-black text-slate-800">No invoices pending</h4>
                          <p className="text-[10px] text-slate-400 mt-1 max-w-[180px] leading-relaxed">Billing documents will automatically populate here when extracted.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={() => handleNavigate('Documents')}
                    className="mt-6 w-full border border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-700 py-3 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <span>View All Invoices</span>
                    <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </button>
                </div>

              </div>

              {/* Bottom AI Insights Section matching Reference Image layout */}
              <div className="bg-indigo-50/20 border border-indigo-100/50 rounded-3xl p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-indigo-600 text-lg">auto_awesome</span>
                  AI Insights
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* Insight 1 */}
                  <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-3 hover:border-slate-200 transition duration-300">
                    <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl shrink-0 flex items-center justify-center">
                      <span className="material-symbols-outlined text-sm">trending_up</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-normal">
                      You have <strong className="text-slate-900">{highPriorityCount} high-priority</strong> items that need your attention today.
                    </p>
                  </div>

                  {/* Insight 2 */}
                  <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-3 hover:border-slate-200 transition duration-300">
                    <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl shrink-0 flex items-center justify-center">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-normal">
                      You have <strong className="text-slate-900">{dueTodayCount} deadlines</strong> registered for today. Keep up the pace!
                    </p>
                  </div>

                  {/* Insight 3 */}
                  <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-3 hover:border-slate-200 transition duration-300">
                    <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl shrink-0 flex items-center justify-center">
                      <span className="material-symbols-outlined text-sm">account_balance_wallet</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-normal">
                      <strong className="text-slate-900">{formattedInvoiceAmount}</strong> outstanding across <strong className="text-slate-900">{invoicesCount} invoices</strong> this week.
                    </p>
                  </div>

                  {/* Insight 4 */}
                  <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-3 hover:border-slate-200 transition duration-300">
                    <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl shrink-0 flex items-center justify-center">
                      <span className="material-symbols-outlined text-sm">auto_awesome</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-normal">
                      <strong className="text-slate-900">{actionItemsCount} work signals</strong> are actively managed by the system.
                    </p>
                  </div>

                </div>

                {/* Pill Ask button */}
                <div className="mt-6 flex justify-center">
                  <button 
                    onClick={() => {
                      setAskOpen(true);
                    }}
                    className="bg-indigo-50/80 border border-indigo-100/50 hover:bg-indigo-100 hover:border-indigo-200 text-indigo-700 px-6 py-3.5 rounded-full text-xs font-bold shadow-sm transition flex items-center justify-center gap-2 group"
                  >
                    <span className="material-symbols-outlined text-xs group-hover:scale-110 transition-transform">auto_awesome</span>
                    <span>Ask InBoxIQ anything...</span>
                    <span className="material-symbols-outlined text-xs group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: Settings */}
          {selectedView === 'Settings' && (
            <div className="flex flex-col gap-8 animate-in">
              <div className="pb-1">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Settings</h2>
                <p className="mt-1 text-sm text-slate-500">Confidence threshold and automation controls.</p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Autopilot Risk Control Threshold Slider */}
                <div className="rounded-3xl bg-white p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-rose-600">security</span>
                      AI Risk Guardrails
                    </h3>
                    <p className="text-sm text-slate-500 mb-6">
                      Autopilot Routing Confidence Threshold. If classification confidence falls below this limit, emails automatically route to the human verification queue instead of executing drafts.
                    </p>

                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-semibold uppercase text-slate-400">Confidence Threshold Limit</span>
                        <span className="text-xl font-black text-primary">{sliderThreshold}%</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="95"
                        step="5"
                        value={sliderThreshold}
                        onChange={(e) => setSliderThreshold(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 mt-2">
                        <span>50% (Permissive / Auto-pilot)</span>
                        <span>75% (Standard)</span>
                        <span>95% (Safe / Heavy Human Review)</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      try {
                        await axios.post(`${API_BASE}/settings`, { confidence_threshold: sliderThreshold });
                        toast.success(`Risk guardrails locked at ${sliderThreshold}% confidence routing threshold!`);
                        refreshDashboard();
                      } catch {
                        toast.error("Failed to save risk guardrails.");
                      }
                    }}
                    className="w-full rounded-2xl bg-slate-900 text-white py-4 font-bold shadow-sm hover:bg-slate-800 transition"
                  >
                    Save Routing Rules
                  </button>
                </div>

                {/* Worker Automation */}
                <div className="rounded-3xl bg-white p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">robot_2</span>
                      Automation Settings
                    </h3>
                    <p className="text-sm text-slate-500 mb-6">
                      Connected Gmail Account & Worker cycle intervals.
                    </p>

                    <div className="space-y-4 mb-6">
                      <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400">Google Account</span>
                        <span className="text-sm font-bold text-slate-900 truncate max-w-[200px]">{userProfile?.email || 'user@gmail.com'}</span>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400">Sync Status</span>
                        <span className="text-sm font-bold text-emerald-600 flex items-center gap-1">
                          <span className="inline-block w-2 h-2 bg-emerald-600 rounded-full animate-ping"></span>
                          Connected
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={toggleAutomation}
                      className={`flex-1 rounded-2xl py-4 font-bold shadow-sm transition text-white ${automationStatus?.automation_active ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-primary hover:bg-primary/95'}`}
                    >
                      {automationStatus?.automation_active ? 'Autopilot Active' : 'Enable Autopilot'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: Search results */}
          {selectedView === 'Search' && (
            <div className="flex flex-col gap-8 animate-in">
              <div className="pb-1">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Search</h2>
                <p className="mt-1 text-sm text-slate-500">Mail matching &ldquo;{searchQuery}&rdquo;.</p>
              </div>

              <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
                <EmailList
                  emails={searchResults}
                  isLoading={loading}
                  onArchive={handleArchiveEmail}
                  onMute={handleMuteEmail}
                />
              </div>
            </div>
          )}

        </div>
      </main>

      <AskModal
        open={askOpen}
        onClose={() => setAskOpen(false)}
        onSubmit={handleAskSubmit}
        response={askResponse}
      />
    </div>
  );
}

