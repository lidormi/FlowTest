/**
 * FlowTest Embeddable Tracker v1.0
 *
 * Usage — add to ANY website:
 *   <script>
 *     window.FlowTestConfig = {
 *       apiKey:   'ft_live_xxxx',          // your project API key
 *       endpoint: 'http://localhost:3001', // your FlowTest backend URL
 *     };
 *   </script>
 *   <script src="http://localhost:3001/tracker.js"></script>
 */
(function () {
  'use strict';

  var cfg    = window.FlowTestConfig || {};
  var API    = (cfg.endpoint || 'http://localhost:3001').replace(/\/$/, '');
  var KEY    = cfg.apiKey   || (document.currentScript && document.currentScript.getAttribute('data-key')) || '';
  var BATCH  = cfg.batchMs  || 4000;

  if (!KEY) {
    console.warn('[FlowTest] No apiKey. Set window.FlowTestConfig = { apiKey: "ft_live_..." } before this script.');
    return;
  }

  var sessionId = null;
  var queue     = [];
  var timer     = null;
  var maxScroll = 0;
  var lastPage  = location.pathname;

  // ─── Session start ────────────────────────────────────────────────────────
  function startSession() {
    fetch(API + '/api/track/session/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': KEY },
      body: JSON.stringify({
        userAgent:    navigator.userAgent,
        screenWidth:  screen.width,
        screenHeight: screen.height,
        country:      Intl.DateTimeFormat().resolvedOptions().timeZone,
        referrer:     document.referrer || '',
        href:         location.href,
      }),
    })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      sessionId = d.sessionId;
      push({ type: 'pageview', page: location.pathname, metadata: JSON.stringify({ title: document.title }) });
    })
    .catch(function () {});
  }

  // ─── Event queue ─────────────────────────────────────────────────────────
  function push(evt) {
    if (!sessionId) return;
    queue.push(Object.assign({ timestamp: Date.now() }, evt));
    if (!timer) timer = setTimeout(flush, BATCH);
  }

  function flush() {
    timer = null;
    if (!sessionId || !queue.length) return;
    var batch = queue.splice(0);
    fetch(API + '/api/track/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': KEY },
      body: JSON.stringify({ sessionId: sessionId, events: batch }),
    }).catch(function () {});
  }

  function endSession(status) {
    if (!sessionId) return;
    flush();
    var payload = JSON.stringify({ sessionId: sessionId, status: status || 'completed' });
    try {
      navigator.sendBeacon(
        API + '/api/track/session/end',
        new Blob([payload], { type: 'application/json' })
      );
    } catch (_) {
      fetch(API + '/api/track/session/end', {
        method: 'POST', keepalive: true,
        headers: { 'Content-Type': 'application/json', 'x-api-key': KEY },
        body: payload,
      }).catch(function () {});
    }
  }

  // ─── Click tracking ───────────────────────────────────────────────────────
  document.addEventListener('click', function (e) {
    var el = e.target;
    for (var i = 0; i < 5 && el && el !== document.body; i++) {
      if (el.getAttribute && (el.getAttribute('data-testid') || /^(A|BUTTON|INPUT|SELECT)$/.test(el.tagName)))
        break;
      el = el.parentElement;
    }
    var target = (el && el.getAttribute && el.getAttribute('data-testid')) ||
                 (el && el.tagName && el.tagName.toLowerCase()) || 'unknown';
    push({ type: 'click', page: location.pathname, x: e.clientX, y: e.clientY, target: target });
  }, true);

  // ─── Scroll depth ─────────────────────────────────────────────────────────
  document.addEventListener('scroll', function () {
    var d = document.documentElement;
    var depth = Math.round(((window.scrollY + window.innerHeight) / d.scrollHeight) * 100);
    if (depth > maxScroll) {
      maxScroll = depth;
      push({ type: 'scroll', page: location.pathname, y: window.scrollY, value: String(depth) });
    }
  }, { passive: true });

  // ─── Form changes (field names only, never passwords) ────────────────────
  document.addEventListener('change', function (e) {
    var el = e.target;
    if (!el || !el.name || el.type === 'password') return;
    push({ type: 'input', page: location.pathname, target: el.name || el.id || el.type });
  }, true);

  // ─── Page visibility / unload ─────────────────────────────────────────────
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) endSession('dropped');
  });
  window.addEventListener('pagehide',     function () { endSession('completed'); });
  window.addEventListener('beforeunload', function () { flush(); });

  // ─── SPA navigation ───────────────────────────────────────────────────────
  function onNav() {
    if (location.pathname !== lastPage) {
      lastPage  = location.pathname;
      maxScroll = 0;
      push({ type: 'pageview', page: location.pathname });
    }
  }
  var _push    = history.pushState.bind(history);
  var _replace = history.replaceState.bind(history);
  history.pushState    = function () { _push.apply(history, arguments);    onNav(); };
  history.replaceState = function () { _replace.apply(history, arguments); onNav(); };
  window.addEventListener('popstate', onNav);

  // ─── Public API ───────────────────────────────────────────────────────────
  window.FlowTest = { track: push, flush: flush, end: endSession };

  startSession();
})();
