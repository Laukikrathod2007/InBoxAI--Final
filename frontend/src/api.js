import axios from 'axios';

// Attach the local API token to every request. The token comes from the
// same-origin /api/session endpoint (served only to this machine).
let tokenPromise = null;

function loadToken() {
  if (!tokenPromise) {
    tokenPromise = fetch('/api/session')
      .then((r) => (r.ok ? r.json() : { token: '' }))
      .then((d) => d.token || '')
      .catch(() => '');
  }
  return tokenPromise.then((t) => {
    if (!t) tokenPromise = null; // backend was not ready; try again next time
    return t;
  });
}

axios.interceptors.request.use(async (config) => {
  if (!String(config.url || '').endsWith('/api/session')) {
    config.headers['X-InBoxIQ-Token'] = await loadToken();
  }
  return config;
});

// On 401 (e.g. token rotated), fetch a fresh token once and retry.
axios.interceptors.response.use(undefined, async (error) => {
  const cfg = error.config;
  if (error.response?.status === 401 && cfg && !cfg._retried) {
    cfg._retried = true;
    tokenPromise = null;
    cfg.headers['X-InBoxIQ-Token'] = await loadToken();
    return axios(cfg);
  }
  return Promise.reject(error);
});
