import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, 
  History, 
  Terminal, 
  Settings, 
  Mail, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  TrendingUp,
  Search,
  RefreshCw
} from 'lucide-react';

const API_BASE = '/api';

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({
    total_processed: 0,
    invoices_count: 0,
    resumes_count: 0,
    system_errors: 0
  });
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [historyRes, statsRes, logsRes] = await Promise.all([
        axios.get(`${API_BASE}/history`),
        axios.get(`${API_BASE}/stats`),
        axios.get(`${API_BASE}/logs`)
      ]);
      setHistory(historyRes.data || []);
      setStats(statsRes.data || {});
      setLogs(logsRes.data || []);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch data", error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const triggerPoll = async () => {
    try {
      await axios.post(`${API_BASE}/process-now`);
      fetchData();
    } catch (error) {
      console.error("Trigger failed", error);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0c0e14] text-slate-200 antialiased">
      {/* Sidebar */}
      <aside className="w-64 bg-[#12151c] border-r border-slate-800/50 flex flex-col p-6 space-y-8">
        <div className="flex items-center space-x-3 px-2">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Mail className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white italic">InBoxIQ</span>
        </div>

        <nav className="flex-1 space-y-1">
          <NavItem active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<LayoutDashboard size={20} />} label="Overview" />
          <NavItem active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History size={20} />} label="History" />
          <NavItem active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} icon={<Terminal size={20} />} label="Console" />
          <NavItem active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings size={20} />} label="AI Studio" />
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-bold text-white capitalize">{activeTab}</h1>
          <button onClick={triggerPoll} className="flex items-center space-x-2 bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2.5 rounded-xl transition-all">
            <RefreshCw size={18} />
            <span>Sync</span>
          </button>
        </header>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard label="Total" value={stats.total_processed} icon={<FileText className="text-blue-400" />} />
            <StatCard label="Invoices" value={stats.invoices_count} icon={<TrendingUp className="text-cyan-400" />} />
            <StatCard label="Resumes" value={stats.resumes_count} icon={<CheckCircle className="text-emerald-400" />} />
            <StatCard label="Errors" value={stats.system_errors} icon={<AlertCircle className="text-rose-400" />} />
          </div>
        )}
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:bg-slate-800/50'}`}>
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="bg-[#12151c] p-6 rounded-3xl border border-slate-800/50 shadow-xl">
      <div className="w-12 h-12 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4">{icon}</div>
      <p className="text-slate-400 text-sm mb-1">{label}</p>
      <h3 className="text-2xl font-bold text-white">{value}</h3>
    </div>
  );
}

export default App;
