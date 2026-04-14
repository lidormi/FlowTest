import React, { useState, useEffect, useRef, useCallback } from 'react';

export default function ReplayPlayer({ session }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [eventIdx, setEventIdx] = useState(0);
  const frameRef = useRef(0);

  const events = (session?.events || []).filter(e => e.x != null && e.y != null);
  const pageViews = session?.pageViews || [];
  const duration = session?.duration || 60;

  // Build playback timeline: interpolate mouse positions
  const timeline = buildTimeline(events, session?.start_time);

  const draw = useCallback((t) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Background — mock browser viewport
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    // Mock page outline
    drawMockPage(ctx, W, H, pageViews, t);

    // Draw click trails
    const pastEvents = timeline.filter(e => e.t <= t);
    for (let i = 0; i < pastEvents.length; i++) {
      const e = pastEvents[i];
      const age = t - e.t;
      if (age > 3) continue;
      const alpha = Math.max(0, 1 - age / 3);
      const isRage = e.type === 'rage_click';
      const isClick = e.type === 'click';

      if (isClick || isRage) {
        // Click ripple
        ctx.beginPath();
        const radius = isRage ? 20 + age * 8 : 12 + age * 5;
        ctx.arc(e.x, e.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = isRage ? `rgba(239,68,68,${alpha * 0.8})` : `rgba(79,142,247,${alpha * 0.6})`;
        ctx.lineWidth = isRage ? 2 : 1.5;
        ctx.stroke();

        if (isRage) {
          ctx.beginPath();
          ctx.arc(e.x, e.y, 5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(239,68,68,${alpha})`;
          ctx.fill();
        }
      }
    }

    // Current mouse position + cursor
    const cur = interpolatePosition(timeline, t);
    if (cur) {
      // Mouse trail
      const trail = timeline.filter(e => e.t >= t - 0.5 && e.t <= t);
      if (trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(trail[0].x, trail[0].y);
        for (let i = 1; i < trail.length; i++) {
          ctx.lineTo(trail[i].x, trail[i].y);
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Cursor arrow
      drawCursor(ctx, cur.x, cur.y);
    }
  }, [timeline, pageViews]);

  useEffect(() => {
    if (!playing) return;
    let start = null;
    const totalTime = Math.min(duration, 120); // cap at 2 min for demo

    function frame(ts) {
      if (!start) start = ts;
      const elapsed = ((ts - start) / 1000) * speed;
      const t = Math.min(elapsed, totalTime);
      const pct = (t / totalTime) * 100;

      setProgress(pct);
      draw(t);

      if (t < totalTime) {
        animRef.current = requestAnimationFrame(frame);
      } else {
        setPlaying(false);
        setProgress(100);
      }
    }

    animRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animRef.current);
  }, [playing, speed, draw, duration]);

  // Draw static frame when not playing
  useEffect(() => {
    if (!playing) draw((progress / 100) * Math.min(duration, 120));
  }, [playing, progress, draw, duration]);

  function handlePlayPause() {
    if (progress >= 100) { setProgress(0); }
    setPlaying(p => !p);
  }

  if (!session) {
    return (
      <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d1117', borderRadius: 8, border: '1px solid var(--border)' }}>
        <div style={{ textAlign: 'center', color: 'var(--text3)' }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>▶</div>
          <div style={{ fontSize: 12 }}>Select a session to replay</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Canvas */}
      <div style={{ position: 'relative', background: '#0d1117', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
        <canvas ref={canvasRef} width={560} height={280} style={{ width: '100%', height: 'auto', display: 'block' }} />
        {/* Page indicator overlay */}
        <div style={{ position: 'absolute', top: 8, left: 8, fontSize: 10, background: 'rgba(0,0,0,0.6)', color: 'var(--text2)', padding: '3px 8px', borderRadius: 5, fontFamily: 'var(--mono)' }}>
          {pageViews[0]?.url || session.first_page || '/—'} · {session.country}
        </div>
        {/* Event count */}
        <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 10, background: 'rgba(0,0,0,0.6)', color: 'var(--text2)', padding: '3px 8px', borderRadius: 5 }}>
          {events.length} events
        </div>
      </div>

      {/* Controls */}
      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* Progress bar */}
        <div style={{ position: 'relative', height: 4, background: 'var(--bg4)', borderRadius: 2, cursor: 'pointer' }}
          onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = ((e.clientX - rect.left) / rect.width) * 100;
            setProgress(Math.max(0, Math.min(100, pct)));
            setPlaying(false);
          }}>
          <div style={{ width: `${progress}%`, height: '100%', background: 'var(--blue)', borderRadius: 2, transition: playing ? 'none' : 'width 0.1s' }} />
          <div style={{ position: 'absolute', top: '50%', left: `${progress}%`, transform: 'translate(-50%,-50%)', width: 12, height: 12, borderRadius: '50%', background: 'var(--blue)', border: '2px solid var(--bg2)', transition: playing ? 'none' : 'left 0.1s' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={handlePlayPause} style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--blue)', border: 'none', color: '#fff', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {playing ? '⏸' : progress >= 100 ? '↺' : '▶'}
          </button>
          <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text2)', flex: 1 }}>
            {formatTime((progress / 100) * Math.min(duration, 120))} / {formatTime(Math.min(duration, 120))}
          </span>
          {/* Speed */}
          <div style={{ display: 'flex', gap: 3 }}>
            {[0.5, 1, 2, 4].map(s => (
              <button key={s} onClick={() => setSpeed(s)} style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, cursor: 'pointer', fontFamily: 'var(--font)', background: speed === s ? 'var(--blue-dim)' : 'var(--bg4)', color: speed === s ? 'var(--blue)' : 'var(--text3)', border: `1px solid ${speed === s ? 'rgba(79,142,247,0.3)' : 'var(--border)'}` }}>
                {s}×
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Event legend */}
      <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 10, color: 'var(--text3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--blue)' }}/> Click</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--red)' }}/> Rage click</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: 1, background: 'rgba(255,255,255,0.15)' }}/> Mouse trail</div>
      </div>
    </div>
  );
}

function buildTimeline(events, startTime) {
  if (!events.length) return [];
  const base = startTime || 0;
  return events.map(e => ({
    t: e.timestamp - base,
    x: Math.max(5, Math.min(555, (e.x || 0) * (560 / 1920))),
    y: Math.max(5, Math.min(275, (e.y || 0) * (280 / 1080))),
    type: e.type,
    target: e.target
  })).sort((a, b) => a.t - b.t);
}

function interpolatePosition(timeline, t) {
  if (!timeline.length) return null;
  const after = timeline.find(e => e.t >= t);
  const before = [...timeline].reverse().find(e => e.t <= t);
  if (!before) return timeline[0];
  if (!after) return timeline[timeline.length - 1];
  if (before === after) return before;
  const ratio = (t - before.t) / (after.t - before.t);
  return {
    x: before.x + (after.x - before.x) * ratio,
    y: before.y + (after.y - before.y) * ratio
  };
}

function drawCursor(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 14);
  ctx.lineTo(3.5, 10.5);
  ctx.lineTo(6, 14);
  ctx.lineTo(7.5, 13.5);
  ctx.lineTo(5, 9.5);
  ctx.lineTo(9, 9.5);
  ctx.closePath();
  ctx.fillStyle = 'white';
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 0.8;
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawMockPage(ctx, W, H, pageViews, t) {
  // Simple mock UI skeleton
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  ctx.fillRect(0, 0, W, 28); // nav bar
  ctx.fillStyle = 'rgba(255,255,255,0.015)';
  ctx.fillRect(12, 7, 60, 14); // logo
  ctx.fillRect(W - 80, 7, 70, 14); // nav items

  // Content blocks
  const blocks = [
    { x: 20, y: 40, w: W * 0.55, h: 60, color: 'rgba(255,255,255,0.025)' },
    { x: W * 0.62, y: 40, w: W * 0.34, h: 100, color: 'rgba(79,142,247,0.06)' },
    { x: 20, y: 112, w: W * 0.35, h: 14, color: 'rgba(255,255,255,0.02)' },
    { x: 20, y: 132, w: W * 0.42, h: 36, color: 'rgba(255,255,255,0.015)' },
    { x: 20, y: 176, w: W * 0.38, h: 14, color: 'rgba(255,255,255,0.02)' },
    { x: 20, y: 196, w: W * 0.42, h: 36, color: 'rgba(255,255,255,0.015)' },
    { x: 20, y: 242, w: 110, h: 28, color: 'rgba(79,142,247,0.18)' }, // CTA button
  ];

  for (const b of blocks) {
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.roundRect(b.x, b.y, b.w, b.h, 3);
    ctx.fill();
  }

  // CTA label
  ctx.fillStyle = 'rgba(79,142,247,0.6)';
  ctx.font = '10px monospace';
  ctx.fillText('Submit', 55, 261);
}

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}
