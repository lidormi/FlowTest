import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from './ScreenRecorder.module.css';

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
  const domEventsRef = useRef([]);

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

      if (previewRef.current) {
        previewRef.current.srcObject = stream;
        previewRef.current.play();
      }

      chunksRef.current = [];
      domEventsRef.current = [];

      const trackDomClick = (e) => {
        const el = e.target?.closest('button,a,[data-testid],input,select');
        const testId = el?.getAttribute('data-testid');
        const selector = testId ? `[data-testid="${testId}"]` : el?.tagName?.toLowerCase() || 'element';
        domEventsRef.current.push({
          type: 'click', selector, target: testId || el?.textContent?.slice(0, 40) || selector,
          x: e.clientX, y: e.clientY, page: location.pathname, ts: Date.now(),
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
      trackDomNav();

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4';

      const mr = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mr;

      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = finalizeRecording;
      mr.start(1000);

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
      id, url, size: blob.size, duration,
      timestamp: new Date().toISOString(),
      name: `Recording ${new Date().toLocaleTimeString()}`,
      generatedTest: null,
      domEvents: capturedEvents,
    };
    const updated = [rec, ...recordings];
    setRecordings(updated);
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
    <div className={styles.page}>
      {/* Recorder Controls */}
      <div className={styles.recorderCard}>
        <div className={`${styles.recorderHeader} ${isActive ? styles.recorderHeaderActive : ''}`}>
          <div className={styles.recorderMeta}>
            <div className={styles.recorderTitle}>Screen Recorder</div>
            <div className={styles.recorderStatus}>
              {state === STATES.idle && 'Record your screen to auto-generate Playwright tests'}
              {state === STATES.requesting && 'Select the window or tab to record...'}
              {isRecording && <span className={styles.statusRecording}>⏺ Recording — {fmt(duration)}</span>}
              {isPaused && <span className={styles.statusPaused}>⏸ Paused — {fmt(duration)}</span>}
              {state === STATES.stopped && <span className={styles.statusStopped}>✓ Recording saved</span>}
              {state === STATES.error && <span className={styles.statusError}>{error}</span>}
            </div>
          </div>

          <div className={styles.recorderBtns}>
            {!isActive && state !== STATES.requesting && (
              <button onClick={startRecording} className={styles.recordBtn}>
                <div className={styles.recordBtnDot} /> Record
              </button>
            )}
            {isRecording && <>
              <button onClick={pauseRecording} className={styles.pauseBtn}>⏸ Pause</button>
              <button onClick={() => stopRecording()} className={styles.stopBtn}>⏹ Stop</button>
            </>}
            {isPaused && <>
              <button onClick={resumeRecording} className={styles.resumeBtn}>▶ Resume</button>
              <button onClick={() => stopRecording()} className={styles.stopBtn}>⏹ Stop</button>
            </>}
          </div>
        </div>

        {isActive && (
          <div className={styles.previewWrap}>
            <video ref={previewRef} muted className={styles.previewVideo} />
            <div className={styles.previewBadge}>
              <div className={`${styles.recPulseDot} ${isRecording ? styles.recPulseDotActive : ''}`} />
              <span className={styles.previewTime}>{fmt(duration)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Recordings list */}
      {recordings.length > 0 && (
        <div className={styles.listCard}>
          <div className={styles.listHeader}>
            <div className={styles.listTitle}>Recordings</div>
            <span className={styles.listCount}>{recordings.length}</span>
          </div>

          <div className={styles.recItems}>
            {recordings.map(rec => (
              <div key={rec.id}>
                <div
                  onClick={() => setSelectedRec(selectedRec === rec.id ? null : rec.id)}
                  className={`${styles.recItem} ${selectedRec === rec.id ? styles.recItemSelected : ''}`}
                >
                  <div className={styles.recThumb}>🎬</div>
                  <div className={styles.recInfo}>
                    <div className={styles.recName}>{rec.name}</div>
                    <div className={styles.recMeta}>
                      {fmt(rec.duration)} · {fmtBytes(rec.size)} · {new Date(rec.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  {rec.generatedTest && <span className={styles.testReadyBadge}>✓ Test ready</span>}
                  <button
                    onClick={e => { e.stopPropagation(); generateTest(rec.id); }}
                    disabled={!!generatingTest}
                    style={{
                      fontSize: 11, padding: '5px 11px',
                      background: rec.generatedTest ? 'var(--bg4)' : 'rgba(79,142,247,0.15)',
                      color: rec.generatedTest ? 'var(--text2)' : 'var(--blue)',
                      border: `1px solid ${rec.generatedTest ? 'var(--border)' : 'rgba(79,142,247,0.3)'}`,
                      borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, flexShrink: 0
                    }}
                  >
                    {generatingTest === rec.id ? '⟳ Generating...' : rec.generatedTest ? '↻ Regenerate' : '🧪 Generate Test'}
                  </button>
                </div>

                {selectedRec === rec.id && (
                  <div className={styles.recDetail}>
                    <div className={styles.videoPlayer}>
                      <video ref={playbackRef} src={rec.url} controls className={styles.videoPlayerEl} />
                    </div>

                    {rec.generatedTest && (
                      <div className={styles.codeBlock}>
                        <div className={styles.codeHeader}>
                          <span className={styles.codeTitle}>🧪 Generated Playwright Test</span>
                          <button onClick={() => navigator.clipboard?.writeText(rec.generatedTest)} className={styles.codeCopyBtn}>Copy</button>
                        </div>
                        <pre className={styles.codePre}>
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
        <div className={styles.warning}>
          ⚠ Screen recording requires HTTPS or localhost. Open this app at http://localhost:5173 to use this feature.
        </div>
      )}
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
