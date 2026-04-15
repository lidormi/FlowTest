// FlowTest Tracker — embedded in ShopFlow demo site
const API       = import.meta.env.VITE_API_URL || 'https://flowtest-production.up.railway.app';
const API_KEY   = 'ft_live_xk9m2p4r8s1t7u3v6w0demo';
const BATCH_MS  = 4000;

let sessionId   = null;
let queue       = [];
let flushTimer  = null;

async function startSession() {
  try {
    const res = await fetch(`${API}/api/track/session/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
      body: JSON.stringify({
        userAgent: navigator.userAgent,
        screenWidth: screen.width,
        screenHeight: screen.height,
        country: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
    });
    const data = await res.json();
    sessionId = data.sessionId;
    trackEvent({ type: 'pageview', page: location.pathname });
  } catch {}
}

function trackEvent(event) {
  if (!sessionId) return;
  queue.push({ ...event, timestamp: Date.now() });
  if (!flushTimer) flushTimer = setTimeout(flush, BATCH_MS);
}

async function flush() {
  flushTimer = null;
  if (!sessionId || !queue.length) return;
  const batch = queue.splice(0);
  try {
    await fetch(`${API}/api/track/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
      body: JSON.stringify({ sessionId, events: batch }),
    });
  } catch {}
}

async function endSession(status = 'completed') {
  if (!sessionId) return;
  await flush();
  try {
    navigator.sendBeacon(
      `${API}/api/track/session/end`,
      new Blob([JSON.stringify({ sessionId, status })], { type: 'application/json' })
    );
  } catch {}
}

// Click tracking
document.addEventListener('click', (e) => {
  const el = e.target.closest('button,a,[data-testid]');
  const target = el?.getAttribute('data-testid') || el?.tagName?.toLowerCase() || e.target.tagName?.toLowerCase();
  trackEvent({ type: 'click', page: location.pathname, x: e.clientX, y: e.clientY, target });
}, true);

// Scroll depth
let maxScroll = 0;
document.addEventListener('scroll', () => {
  const depth = Math.round(((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight) * 100);
  if (depth > maxScroll) {
    maxScroll = depth;
    trackEvent({ type: 'scroll', page: location.pathname, y: window.scrollY, metadata: { depth } });
  }
}, { passive: true });

// Page visibility / unload
document.addEventListener('visibilitychange', () => {
  if (document.hidden) endSession('dropped');
});
window.addEventListener('pagehide', () => endSession());

// SPA navigation — track page changes
let lastPage = location.pathname;
const origPush = history.pushState.bind(history);
history.pushState = (...args) => {
  origPush(...args);
  if (location.pathname !== lastPage) {
    lastPage = location.pathname;
    trackEvent({ type: 'pageview', page: location.pathname });
  }
};
window.addEventListener('popstate', () => {
  if (location.pathname !== lastPage) {
    lastPage = location.pathname;
    trackEvent({ type: 'pageview', page: location.pathname });
  }
});

startSession();

export { trackEvent };
