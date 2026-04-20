import React, { useState, useEffect } from 'react';
import { useApi, runTest, getTestStatus } from '../../hooks/useApi.js';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import styles from './TestDetail.module.css';

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
    <div className={styles.loading}>
      <div className={styles.loadingText}>Loading test...</div>
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
    <div className={`${styles.page} fade-in`}>
      {/* Header */}
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backBtn}>←</button>
        <div className={styles.headerMeta}>
          <div className={styles.headerTitleRow}>
            <div className={styles.statusDot} style={{ background: statusColors[currentStatus], boxShadow: running ? '0 0 8px var(--amber)' : '' }} />
            <h2 className={styles.testTitle}>{data.name}</h2>
            <span className={`badge badge-${currentStatus}`}>{running ? 'Running...' : currentStatus}</span>
          </div>
          <div className={styles.testDesc}>{data.description}</div>
        </div>
        <div className={styles.headerActions}>
          <button onClick={copyCode} className="btn btn-ghost" style={{ fontSize: 12 }}>{copied ? '✓ Copied' : '⧉ Copy Code'}</button>
          <button onClick={handleRun} disabled={running} className="btn btn-primary" style={{ fontSize: 12 }}>
            {running ? '⟳ Running...' : '▶ Run Test'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statGrid}>
        {[
          { label: 'Total Runs', value: runs.length, color: 'var(--blue)' },
          { label: 'Passed', value: passCount, color: 'var(--green)' },
          { label: 'Failed', value: failCount, color: 'var(--red)' },
          { label: 'Pass Rate', value: `${passRate}%`, color: passRate >= 80 ? 'var(--green)' : passRate >= 50 ? 'var(--amber)' : 'var(--red)' },
          { label: 'Avg Duration', value: avgDuration ? `${(avgDuration / 1000).toFixed(1)}s` : '—', color: 'var(--text)' },
        ].map(s => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={styles.statValue} style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className={styles.mainLayout}>
        {/* Left: chart + code */}
        <div className={styles.leftCol}>
          {chartData.length > 1 && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">Duration trend</span>
                <span className={styles.chartNote}>last {chartData.length} runs</span>
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

          <div className="card" style={{ flex: 1 }}>
            <div className="card-header">
              <span className="card-title">Playwright code</span>
              <div className={styles.codeActions}>
                <span className={styles.typeBadge}>TypeScript</span>
                <a href={`data:text/plain,${encodeURIComponent(data.playwright_code || '')}`} download={`${data.name.replace(/\s+/g, '-').toLowerCase()}.spec.ts`} className={styles.downloadLink}>⬇ Download</a>
              </div>
            </div>
            <pre className={styles.codePre}>
              <code dangerouslySetInnerHTML={{ __html: highlight(data.playwright_code || '') }} />
            </pre>
          </div>
        </div>

        {/* Right: run history */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <span className="card-title">Run history</span>
            <span className={styles.runListNote}>{runs.length} runs</span>
          </div>
          <div className={styles.runList}>
            {runs.length === 0 && (
              <div className={styles.noRuns}>No runs yet — click Run Test</div>
            )}
            {runs.map((r, i) => (
              <RunRow key={r.id || i} run={r} index={i} totalRuns={runs.length} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RunRow({ run, index, totalRuns }) {
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
      <div
        onClick={() => setOpen(o => !o)}
        className={styles.runRow}
        style={{
          background: open ? 'var(--bg4)' : 'var(--bg3)',
          border: `1px solid ${run.status === 'fail' ? 'rgba(239,68,68,0.15)' : 'var(--border)'}`,
        }}
      >
        <div className={`${styles.runDot} ${run.status === 'pass' ? styles.runDotPass : styles.runDotFail}`}>
          {run.status === 'pass' ? '✓' : '✕'}
        </div>
        <div className={styles.runInfo}>
          <div className={styles.runTitleRow}>
            <span className={styles.runTitle}>Run #{totalRuns - index}</span>
            <span className={styles.runTime}>{timeAgo(run.ran_at)}</span>
          </div>
          <div className={styles.runMeta}>
            {run.steps_passed}/{run.steps_total} steps · {run.duration ? `${(run.duration / 1000).toFixed(1)}s` : '—'}
          </div>
        </div>
        <span className={`badge badge-${run.status}`}>{run.status}</span>
        <span className={styles.runChevron}>{open ? '▲' : '▼'}</span>
      </div>
      {open && run.error && (
        <div className={styles.runErrorPanel}>{run.error}</div>
      )}
      {open && !run.error && (
        <div className={styles.runPassPanel}>
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
