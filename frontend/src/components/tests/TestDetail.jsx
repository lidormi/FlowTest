import React, { useState, useEffect } from 'react';
import { useApi, runTest, getTestStatus } from '../../hooks/useApi.js';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function TestDetail({ testId, onBack }) {
  const { data, loading, refetch } = useApi(`/tests/${testId}`, [testId]);
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!running) return;
    const iv = setInterval(async () => {
      const s = await getTestStatus(testId);
      if (s.status !== 'running') { setRunning(false); refetch(); clearInterval(iv); }
    }, 1000);
    return () => clearInterval(iv);
  }, [running, testId]);

  async function handleRun() {
    setRunning(true);
    await runTest(testId);
  }

  function copyCode() {
    navigator.clipboard?.writeText(data?.playwright_code || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading || !data) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
      <div style={{ fontSize: 13, color: 'var(--text2)' }}>Loading test...</div>
    </div>
  );

  const runs = data.runs || [];
  const passCount = runs.filter(r => r.status === 'pass').length;
  const failCount = runs.filter(r => r.status === 'fail').length;
  const passRate = runs.length ? Math.round((passCount / runs.length) * 100) : 0;
  const avgDuration = runs.length ? Math.round(runs.reduce((a, r) => a + (r.duration || 0), 0) / runs.length) : 0;

  const chartData = [...runs].reverse().slice(-14).map((r, i) => ({
    i: i + 1,
    pass: r.status === 'pass' ? 1 : 0,
    duration: r.duration ? Math.round(r.duration / 100) / 10 : null,
    status: r.status,
  }));

  const statusColors = { pass: 'var(--green)', fail: 'var(--red)', idle: 'var(--text3)', running: 'var(--amber)' };
  const currentStatus = running ? 'running' : data.status;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 18, padding: '2px 4px', borderRadius: 5, transition: 'color 0.12s' }}
          onMouseEnter={e => e.target.style.color = 'var(--text)'}
          onMouseLeave={e => e.target.style.color = 'var(--text2)'}>
          ←
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: statusColors[currentStatus], flexShrink: 0, boxShadow: running ? '0 0 8px var(--amber)' : '' }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '-0.3px' }}>{data.name}</h2>
            <span className={`badge badge-${currentStatus}`}>{running ? 'Running...' : currentStatus}</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 3 }}>{data.description}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={copyCode} className="btn btn-ghost" style={{ fontSize: 12 }}>{copied ? '✓ Copied' : '⧉ Copy Code'}</button>
          <button onClick={handleRun} disabled={running} className="btn btn-primary" style={{ fontSize: 12 }}>
            {running ? '⟳ Running...' : '▶ Run Test'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
        {[
          { label: 'Total Runs', value: runs.length, color: 'var(--blue)' },
          { label: 'Passed', value: passCount, color: 'var(--green)' },
          { label: 'Failed', value: failCount, color: 'var(--red)' },
          { label: 'Pass Rate', value: `${passRate}%`, color: passRate >= 80 ? 'var(--green)' : passRate >= 50 ? 'var(--amber)' : 'var(--red)' },
          { label: 'Avg Duration', value: avgDuration ? `${(avgDuration / 1000).toFixed(1)}s` : '—', color: 'var(--text)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 10, color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'monospace', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
        {/* Left: chart + code */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Run history chart */}
          {chartData.length > 1 && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">Duration trend</span>
                <span style={{ fontSize: 10, color: 'var(--text3)' }}>last {chartData.length} runs</span>
              </div>
              <ResponsiveContainer width="100%" height={100}>
                <LineChart data={chartData}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="i" tick={{ fontSize: 9, fill: 'var(--text3)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: 'var(--text3)' }} axisLine={false} tickLine={false} width={28} unit="s" />
                  <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 7, fontSize: 11 }} formatter={v => [`${v}s`, 'Duration']} />
                  <Line type="monotone" dataKey="duration" stroke="var(--blue)" strokeWidth={2} dot={(props) => {
                    const run = runs[runs.length - chartData.length + (props.index || 0)];
                    const color = run?.status === 'pass' ? 'var(--green)' : 'var(--red)';
                    return <circle key={props.key} cx={props.cx} cy={props.cy} r={4} fill={color} stroke="var(--bg2)" strokeWidth={2} />;
                  }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Code */}
          <div className="card" style={{ flex: 1 }}>
            <div className="card-header">
              <span className="card-title">Playwright code</span>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: 'var(--blue)', background: 'var(--blue-dim)', padding: '1px 7px', borderRadius: 4, fontFamily: 'monospace' }}>TypeScript</span>
                <a href={`data:text/plain,${encodeURIComponent(data.playwright_code || '')}`} download={`${data.name.replace(/\s+/g, '-').toLowerCase()}.spec.ts`} style={{ fontSize: 10, color: 'var(--text2)', textDecoration: 'none', padding: '2px 7px', background: 'var(--bg3)', borderRadius: 5, border: '1px solid var(--border)' }}>⬇ Download</a>
              </div>
            </div>
            <pre style={{ background: '#0d0f14', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px', fontFamily: 'monospace', fontSize: 11.5, lineHeight: 1.7, color: '#a8b4c8', overflow: 'auto', margin: 0, maxHeight: 340 }}>
              <code dangerouslySetInnerHTML={{ __html: highlight(data.playwright_code || '') }} />
            </pre>
          </div>
        </div>

        {/* Right: run history */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <span className="card-title">Run history</span>
            <span style={{ fontSize: 10, color: 'var(--text2)', fontFamily: 'monospace' }}>{runs.length} runs</span>
          </div>
          <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
            {runs.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text3)', fontSize: 12 }}>No runs yet — click Run Test</div>
            )}
            {runs.map((r, i) => (
              <RunRow key={r.id || i} run={r} index={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RunRow({ run, index }) {
  const [open, setOpen] = useState(false);
  const timeAgo = ts => {
    if (!ts) return '—';
    const s = Math.floor(Date.now() / 1000) - ts;
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  return (
    <div>
      <div onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px',
        background: open ? 'var(--bg4)' : 'var(--bg3)',
        border: `1px solid ${run.status === 'fail' ? 'rgba(239,68,68,0.15)' : 'var(--border)'}`,
        borderRadius: 7, cursor: 'pointer', transition: 'all 0.12s',
      }}>
        <div style={{ width: 18, height: 18, borderRadius: '50%', background: run.status === 'pass' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: run.status === 'pass' ? 'var(--green)' : 'var(--red)', fontWeight: 700, flexShrink: 0 }}>
          {run.status === 'pass' ? '✓' : '✕'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11.5, fontWeight: 500 }}>Run #{(runs?.length || 0) - index}</span>
            <span style={{ fontSize: 10, color: 'var(--text3)' }}>{timeAgo(run.ran_at)}</span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 1 }}>
            {run.steps_passed}/{run.steps_total} steps · {run.duration ? `${(run.duration / 1000).toFixed(1)}s` : '—'}
          </div>
        </div>
        <span className={`badge badge-${run.status}`}>{run.status}</span>
        <span style={{ fontSize: 10, color: 'var(--text3)' }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && run.error && (
        <div style={{ margin: '3px 0 3px 6px', padding: '9px 12px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 7, fontSize: 11, fontFamily: 'monospace', color: '#ef4444', lineHeight: 1.6 }}>
          {run.error}
        </div>
      )}
      {open && !run.error && (
        <div style={{ margin: '3px 0 3px 6px', padding: '9px 12px', background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.12)', borderRadius: 7, fontSize: 11, color: 'var(--green)' }}>
          All {run.steps_total} steps completed successfully in {(run.duration / 1000).toFixed(2)}s
        </div>
      )}
    </div>
  );
}

function highlight(code) {
  return code
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\b(import|from|const|let|await|async|test|expect|describe|beforeEach)\b/g, '<span style="color:#8b5cf6">$1</span>')
    .replace(/\b(page|expect)\b(?=\.)/g, '<span style="color:#4f8ef7">$1</span>')
    .replace(/(\/\/.*)/g, '<span style="color:#4a5568">$1</span>')
    .replace(/('.*?'|`[\s\S]*?`)/g, '<span style="color:#22c55e">$1</span>');
}
