import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './ReplayPlayer.module.css';

export default function ReplayPlayer({ session }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1);
  const frameRef = useRef(0);

  const events = (session?.events || []).filter(e => e.x != null && e.y != null);
  const pageViews = session?.pageViews || [];
  const duration = session?.duration || 60;

  const timeline = buildTimeline(events, session?.start_time);

  const draw = useCallback((t) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    drawMockPage(ctx, W, H, pageViews, t);

    const pastEvents = timeline.filter(e => e.t <= t);
    for (let i = 0; i < pastEvents.length; i++) {
      const e = pastEvents[i];
      const age = t - e.t;
      if (age > 3) continue;
      const alpha = Math.max(0, 1 - age / 3);
      const isRage = e.type === 'rage_click';
      const isClick = e.type === 'click';

      if (isClick || isRage) {
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

    const cur = interpolatePosition(timeline, t);
    if (cur) {
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
      drawCursor(ctx, cur.x, cur.y);
    }
  }, [timeline, pageViews]);

  useEffect(() => {
    if (!playing) return;
    let start = null;
    const totalTime = Math.min(duration, 120);

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

  useEffect(() => {
    if (!playing) draw((progress / 100) * Math.min(duration, 120));
  }, [playing, progress, draw, duration]);

  function handlePlayPause() {
    if (progress >= 100) { setProgress(0); }
    setPlaying(p => !p);
  }

  if (!session) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyContent}>
          <div className={styles.emptyIcon}>▶</div>
          <div className={styles.emptyText}>Select a session to replay</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Canvas */}
      <div className={styles.canvasWrap}>
        <canvas ref={canvasRef} width={560} height={280} className={styles.canvas} />
        <div className={styles.overlayTopLeft}>
          {pageViews[0]?.url || session.first_page || '/—'} · {session.country}
        </div>
        <div className={styles.overlayTopRight}>{events.length} events</div>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <div
          className={styles.progressWrap}
          onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = ((e.clientX - rect.left) / rect.width) * 100;
            setProgress(Math.max(0, Math.min(100, pct)));
            setPlaying(false);
          }}
        >
          <div className={styles.progressBar} style={{ width: `${progress}%`, transition: playing ? 'none' : 'width 0.1s' }} />
          <div className={styles.progressThumb} style={{ left: `${progress}%`, transition: playing ? 'none' : 'left 0.1s' }} />
        </div>

        <div className={styles.controlsRow}>
          <button onClick={handlePlayPause} className={styles.playBtn}>
            {playing ? '⏸' : progress >= 100 ? '↺' : '▶'}
          </button>
          <span className={styles.timeDisplay}>
            {formatTime((progress / 100) * Math.min(duration, 120))} / {formatTime(Math.min(duration, 120))}
          </span>
          <div className={styles.speedBtns}>
            {[0.5, 1, 2, 4].map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`${styles.speedBtn} ${speed === s ? styles.speedBtnActive : ''}`}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Event legend */}
      <div className={styles.legend}>
        <div className={styles.legendItem}><div className={styles.legendDot} style={{ background: 'var(--blue)' }} /> Click</div>
        <div className={styles.legendItem}><div className={styles.legendDot} style={{ background: 'var(--red)' }} /> Rage click</div>
        <div className={styles.legendItem}><div className={styles.legendSquare} /> Mouse trail</div>
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
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  ctx.fillRect(0, 0, W, 28);
  ctx.fillStyle = 'rgba(255,255,255,0.015)';
  ctx.fillRect(12, 7, 60, 14);
  ctx.fillRect(W - 80, 7, 70, 14);

  const blocks = [
    { x: 20, y: 40, w: W * 0.55, h: 60, color: 'rgba(255,255,255,0.025)' },
    { x: W * 0.62, y: 40, w: W * 0.34, h: 100, color: 'rgba(79,142,247,0.06)' },
    { x: 20, y: 112, w: W * 0.35, h: 14, color: 'rgba(255,255,255,0.02)' },
    { x: 20, y: 132, w: W * 0.42, h: 36, color: 'rgba(255,255,255,0.015)' },
    { x: 20, y: 176, w: W * 0.38, h: 14, color: 'rgba(255,255,255,0.02)' },
    { x: 20, y: 196, w: W * 0.42, h: 36, color: 'rgba(255,255,255,0.015)' },
    { x: 20, y: 242, w: 110, h: 28, color: 'rgba(79,142,247,0.18)' },
  ];

  for (const b of blocks) {
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.roundRect(b.x, b.y, b.w, b.h, 3);
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(79,142,247,0.6)';
  ctx.font = '10px monospace';
  ctx.fillText('Submit', 55, 261);
}

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}
