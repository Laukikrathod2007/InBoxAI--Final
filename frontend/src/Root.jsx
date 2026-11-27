import { lazy, Suspense, useEffect, useState } from 'react';
import Landing from './landing/Landing';

// The dashboard (and its API calls) only loads when the user opens it.
const App = lazy(() => import('./App'));
const TryIt = lazy(() => import('./demo/TryIt'));

const route = () => {
  const h = window.location.hash;
  if (h.startsWith('#/app')) return 'app';
  if (h.startsWith('#/try')) return 'try';
  return 'landing';
};

export default function Root() {
  const [page, setPage] = useState(route);
  useEffect(() => {
    const onHash = () => {
      setPage(route());
      if (!/#\/(app|try)/.test(window.location.hash)) {
        const id = window.location.hash.slice(1);
        if (id && !id.startsWith('/')) document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    document.title = page === 'app' ? 'InBoxIQ · Dashboard' : 'InBoxIQ · The private inbox firewall';
    if (page === 'landing' && window.location.hash === '#/') window.scrollTo(0, 0);
  }, [page]);

  if (page === 'landing') return <Landing />;
  if (page === 'try') {
    return (
      <Suspense fallback={<div className="grid min-h-screen place-items-center text-sm text-slate-500">Loading…</div>}>
        <TryIt />
      </Suspense>
    );
  }
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center text-sm text-slate-500">Loading dashboard…</div>}>
      <App />
    </Suspense>
  );
}
