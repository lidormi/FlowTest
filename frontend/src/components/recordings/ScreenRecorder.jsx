import React, { useState, useRef, useEffect, useCallback } from 'react';

const STATES = { idle: 'idle', requesting: 'requesting', recording: 'recording', paused: 'paused', stopped: 'stopped', error: 'error' };

export default function ScreenRecorder({ onRecordingComplete }) {
  const [state, setState] = useState(STATES.idle);
  const [duration, setDuration] = useState(0);
  const [recordings, setRecordings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ft_recordings') || '[]'); } catch { return []; }
  });
  const [selectedRec, setSelectedRec] = useState(null);
  const [generatingTest, setGeneratingTest] = useState(false);
  const [error, setError] = useState('');

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const previewRef = useRef(null);
  const playbackRef = useRef(null);
  const domEventsRef = useRef([]); // Real DOM events captured during recording

  useEffect(() => {
    return () => {
      stopRecording(true);
      clearInterval(timerRef.current);
    };
  }, []);

  async function startRecording() {
    setError('');
    setState(STATES.requesting);
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen', width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } },
        audio: true,
      });
      streamRef.current = stream;

      // Show live preview
      if (previewRef.current) {
        previewRef.current.srcObject = stream;
        previewRef.current.play();
      }

      chunksRef.current = [];
      domEventsRef.current = []; // Reset DOM events

      // Track real DOM events during recording
      const trackDomClick = (e) => {
        const el = e.target?.closest('button,a,[data-testid],input,select');
        const testId = el?.getAttribute('data-testid');
        const selector = testId ? `[data-testid="${testId}"]` : el?.tagName?.toLowerCase() || 'element';
        domEventsRef.current.push({
          type: 'click',
          selector,
          target: testId || el?.textContent?.slice(0, 40) || selector,
          x: e.clientX, y: e.clientY,
          page: location.pathname,
          ts: Date.now(),
        });
      };
      const trackDomNav = () => {
        domEventsRef.current.push({ type: 'navigate', url: location.href, page: location.pathname, ts: Date.now() });
      };
      const trackDomInput = (e) => {
        const el = e.target;
        if (!el?.name || el.type === 'password') return;
        domEventsRef.current.push({ type: 'input', field: `[name="${el.name}"]`, value: el.value?.slice(0, 50), page: location.pathname, ts: Date.now() });
      };
      document.addEventListener('click', trackDomClick, true);
      document.addEventListener('change', trackDomInput, true);
      window.addEventListener('popstate', trackDomNav);
      domEventsRef.current._cleanup = () => {
        document.removeEventListener('click', trackDomClick, true);
        document.removeEventListener('change', trackDomInput, true);
        window.removeEventListener('popstate', trackDomNav);
      };
      trackDomNav(); // Record starting URL

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4';

      const mr = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mr;

      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = finalizeRecording;
      mr.start(1000); // chunk every second

      // Handle user stopping via browser's native "stop sharing" button
      stream.getVideoTracks()[0].addEventListener('ended', () => stopRecording());

      setState(STATES.recording);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);

    } catch (err) {
      const msg = err.name === 'NotAllowedError'
        ? 'Screen sharing was denied. Please allow access and try again.'
        : err.name === 'NotSupportedError'
        ? 'Screen recording is not supported in this browser.'
        : `Error: ${err.message}`;
      setError(msg);
      setState(STATES.error);
    }
  }

  function pauseRecording() {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause();
      clearInterval(timerRef.current);
      setState(STATES.paused);
    }
  }

  function resumeRecording() {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume();
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
      setState(STATES.recording);
    }
  }

  function stopRecording(silent = false) {
    clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (previewRef.current) {
      previewRef.current.srcObject = null;
    }
    // Cleanup DOM event listeners
    if (domEventsRef.current._cleanup) {
      domEventsRef.current._cleanup();
      delete domEventsRef.current._cleanup;
    }
    if (!silent) setState(STATES.stopped);
  }

  function finalizeRecording() {
    if (chunksRef.current.length === 0) return;
    const blob = new Blob(chunksRef.current, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const id = `rec_${Date.now()}`;
    const capturedEvents = [...domEventsRef.current].filter(e => !e._cleanup);
    const rec = {
      id,
      url,
      size: blob.size,
      duration: duration,
      timestamp: new Date().toISOString(),
      name: `Recording ${new Date().toLocaleTimeString()}`,
      generatedTest: null,
      domEvents: capturedEvents,
    };
    const updated = [rec, ...recordings];
    setRecordings(updated);
    // Note: we can't store blob URLs in localStorage (they die on reload)
    // Store metadata only, blobs live in memory for this session
    setSelectedRec(rec.id);
    setState(STATES.stopped);
    if (onRecordingComplete) onRecordingComplete(rec);
  }

  async function generateTest(recId) {
    const rec = recordings.find(r => r.id === recId);
    if (!rec) return;
    setGeneratingTest(recId);

    try {
      const events = rec.domEvents || [];
      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/ai/generate-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events,
          url: events.find(e => e.type === 'navigate')?.url || 'http://localhost:5174',
          recordingName: rec.name,
          duration: rec.duration,
        }),
      });
      const data = await res.json();
      const testCode = data.code || data.fallback || '// Could not generate test';
      const updated = recordings.map(r =>
        r.id === recId ? { ...r, generatedTest: testCode, aiGenerated: !data.fallback } : r
      );
      setRecordings(updated);
    } catch (err) {
      console.error('Test generation failed:', err);
    } finally {
      setGeneratingTest(null);
    }
  }

  function fmt(secs) {
    const m = Math.floor(secs / 60), s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
  function fmtBytes(b) {
    if (b < 1024) return `${b}B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)}KB`;
    return `${(b / 1024 / 1024).toFixed(1)}MB`;
  }

  const isRecording = state === STATES.recording;
  const isPaused = state === STATES.paused;
  const isActive = isRecording || isPaused;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Recorder Controls */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: isActive ? 14 : 0 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>Screen Recorder</div>
            <div style={{ fontSize: 11.5, color: 'var(--text2)' }}>
              {state === STATES.idle && 'Record your screen to auto-generate Playwright tests'}
              {state === STATES.requesting && 'Select the window or tab to record...'}
              {isRecording && <span style={{ color: 'var(--red)' }}>⏺ Recording — {fmt(duration)}</span>}
              {isPaused && <span style={{ color: 'var(--amber)' }}>⏸ Paused — {fmt(duration)}</span>}
              {state === STATES.stopped && <span style={{ color: 'var(--green)' }}>✓ Recording saved</span>}
              {state === STATES.error && <span style={{ color: 'var(--red)' }}>{error}</span>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {!isActive && state !== STATES.requesting && (
              <button onClick={startRecording} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} /> Record
              </button>
            )}
            {isRecording && <>
              <button onClick={pauseRecording} style={{ background: 'var(--amber)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>⏸ Pause</button>
              <button onClick={() => stopRecording()} style={{ background: 'var(--bg3)', color: 'var(--text)', border: '1px solid var(--border2)', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>⏹ Stop</button>
            </>}
            {isPaused && <>
              <button onClick={resumeRecording} style={{ background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>▶ Resume</button>
              <button onClick={() => stopRecording()} style={{ background: 'var(--bg3)', color: 'var(--text)', border: '1px solid var(--border2)', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>⏹ Stop</button>
            </>}
          </div>
        </div>

        {/* Live preview */}
        {isActive && (
          <div style={{ position: 'relative', background: '#000', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
            <video ref={previewRef} muted style={{ width: '100%', height: 200, objectFit: 'contain', display: 'block' }} />
            <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(0,0,0,0.7)', borderRadius: 20, padding: '4px 10px' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--red)', animation: isRecording ? 'recPulse 1s infinite' : 'none' }} />
              <span style={{ fontSize: 11, color: '#fff', fontFamily: 'monospace' }}>{fmt(duration)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Recordings list */}
      {recordings.length > 0 && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Recordings</div>
            <span style={{ fontSize: 11, color: 'var(--text2)', background: 'var(--bg3)', padding: '2px 8px', borderRadius: 8, fontFamily: 'monospace' }}>{recordings.length}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {recordings.map(rec => (
              <div key={rec.id}>
                <div onClick={() => setSelectedRec(selectedRec === rec.id ? null : rec.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 13px',
                  background: selectedRec === rec.id ? 'rgba(79,142,247,0.07)' : 'var(--bg3)',
                  border: `1px solid ${selectedRec === rec.id ? 'rgba(79,142,247,0.3)' : 'var(--border)'}`,
                  borderRadius: 9, cursor: 'pointer', transition: 'all 0.12s'
                }}>
                  <div style={{ width: 36, height: 28, borderRadius: 5, background: 'var(--bg4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>🎬</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500 }}>{rec.name}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--text2)', marginTop: 1 }}>
                      {fmt(rec.duration)} · {fmtBytes(rec.size)} · {new Date(rec.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  {rec.generatedTest && <span style={{ fontSize: 10, color: 'var(--green)', background: 'rgba(34,197,94,0.1)', padding: '2px 8px', borderRadius: 8, fontWeight: 600, flexShrink: 0 }}>✓ Test ready</span>}
                  <button onClick={e => { e.stopPropagation(); generateTest(rec.id); }} disabled={!!generatingTest} style={{ fontSize: 11, padding: '5px 11px', background: rec.generatedTest ? 'var(--bg4)' : 'rgba(79,142,247,0.15)', color: rec.generatedTest ? 'var(--text2)' : 'var(--blue)', border: `1px solid ${rec.generatedTest ? 'var(--border)' : 'rgba(79,142,247,0.3)'}`, borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, flexShrink: 0 }}>
                    {generatingTest === rec.id ? '⟳ Generating...' : rec.generatedTest ? '↻ Regenerate' : '🧪 Generate Test'}
                  </button>
                </div>

                {selectedRec === rec.id && (
                  <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {/* Video player */}
                    <div style={{ background: '#000', borderRadius: 9, overflow: 'hidden', border: '1px solid var(--border)' }}>
                      <video ref={playbackRef} src={rec.url} controls style={{ width: '100%', height: 220, display: 'block', objectFit: 'contain' }} />
                    </div>

                    {/* Generated test code */}
                    {rec.generatedTest && (
                      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 9, overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
                          <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--green)' }}>🧪 Generated Playwright Test</span>
                          <button onClick={() => navigator.clipboard?.writeText(rec.generatedTest)} style={{ fontSize: 10, padding: '3px 9px', background: 'var(--bg4)', border: '1px solid var(--border2)', borderRadius: 6, color: 'var(--text2)', cursor: 'pointer', fontFamily: 'inherit' }}>Copy</button>
                        </div>
                        <pre style={{ padding: '13px 15px', fontFamily: 'monospace', fontSize: 11, lineHeight: 1.65, color: '#a8b4c8', overflow: 'auto', maxHeight: 260, margin: 0 }}>
                          <code dangerouslySetInnerHTML={{ __html: highlight(rec.generatedTest) }} />
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!navigator.mediaDevices?.getDisplayMedia && (
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 9, padding: '12px 16px', fontSize: 12.5, color: 'var(--amber)', lineHeight: 1.6 }}>
          ⚠ Screen recording requires HTTPS or localhost. Open this app at http://localhost:5173 to use this feature.
        </div>
      )}

      <style>{`@keyframes recPulse { 0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(239,68,68,.5)} 50%{opacity:.7;box-shadow:0 0 0 5px rgba(239,68,68,0)} }`}</style>
    </div>
  );
}

function highlight(code) {
  return code
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\b(import|from|const|await|async|test|expect|describe)\b/g, '<span style="color:#8b5cf6">$1</span>')
    .replace(/\b(page|expect)\b(?=\.)/g, '<span style="color:#4f8ef7">$1</span>')
    .replace(/(\/\/.*)/g, '<span style="color:#4a5568">$1</span>')
    .replace(/('.*?'|`.*?`)/gs, '<span style="color:#22c55e">$1</span>');
}
