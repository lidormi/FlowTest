import React, { useState, useEffect } from 'react';
import { useApi, runTest, getTestStatus } from '../../hooks/useApi.js';
import TestDetail from './TestDetail.jsx';

export default function Tests() {
  const { data: tests, loading, refetch } = useApi('/tests');
  const [runningTests, setRunningTests] = useState({});
  const [selectedTest, setSelectedTest] = useState(null);

  async function handleRun(testId, e) {
    e?.stopPropagation();
    setRunningTests(p => ({ ...p, [testId]: true }));
    try {
      await runTest(testId);
      const poll = setInterval(async () => {
        const s = await getTestStatus(testId);
        if (s.status !== 'running') {
          clearInterval(poll);
          setRunningTests(p => ({ ...p, [testId]: false }));
          refetch();
        }
      }, 1000);
    } catch {
      setRunningTests(p => ({ ...p, [testId]: false }));
    }
  }

  if (selectedTest) {
    return <TestDetail testId={selectedTest} onBack={() => setSelectedTest(null)} />;
  }

  const statusDot = { pass: 'var(--green)', fail: 'var(--red)', idle: 'var(--text3)', running: 'var(--amber)' };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: 'var(--text2)' }}>Click any test to open its full detail page with run history, code, and analytics.</div>
        </div>
        <button className="btn btn-ghost" onClick={() => tests?.forEach(t => handleRun(t.id))}>⬡ Run All</button>
        <button className="btn btn-primary">+ Generate from Recording</button>
      </div>

      {/* Summary row */}
      {tests && (
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { label: 'Total', value: tests.length, color: 'var(--blue)' },
            { label: 'Passing', value: tests.filter(t => t.status === 'pass').length, color: 'var(--green)' },
            { label: 'Failing', value: tests.filter(t => t.status === 'fail').length, color: 'var(--red)' },
            { label: 'Idle', value: tests.filter(t => t.status === 'idle').length, color: 'var(--text2)' },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 9, padding: '10px 13px' }}>
              <div style={{ fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'monospace', color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {loading ? Array.from({ length: 5 }, (_, i) => (
          <div key={i} style={{ height: 68, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10 }} />
        )) : (tests || []).map(t => {
          const isRunning = runningTests[t.id] || t.status === 'running';
          const status = isRunning ? 'running' : t.status;
          const passRate = t.total_runs > 0 ? Math.round((t.passed_runs / t.total_runs) * 100) : null;

          return (
            <div key={t.id} onClick={() => setSelectedTest(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px',
              background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10,
              cursor: 'pointer', transition: 'all 0.13s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg3)'; e.currentTarget.style.borderColor = 'var(--border2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg2)'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: statusDot[status], boxShadow: status === 'pass' ? '0 0 6px var(--green)' : status === 'fail' ? '0 0 6px var(--red)' : 'none' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600 }}>{t.name}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>
                  {t.description} · {t.total_runs} runs
                  {t.last_duration && ` · ${(t.last_duration / 1000).toFixed(1)}s last`}
                </div>
              </div>

              {/* Mini run history */}
              <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                {Array.from({ length: Math.min(8, t.total_runs || 0) }, (_, i) => {
                  const isPassed = i < (t.passed_runs || 0);
                  return <div key={i} style={{ width: 6, height: 20, borderRadius: 2, background: isPassed ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)' }} />;
                })}
              </div>

              {passRate !== null && (
                <div style={{ textAlign: 'center', minWidth: 44 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'monospace', color: passRate >= 80 ? 'var(--green)' : passRate >= 50 ? 'var(--amber)' : 'var(--red)' }}>{passRate}%</div>
                  <div style={{ fontSize: 9, color: 'var(--text3)' }}>pass rate</div>
                </div>
              )}

              <span className={`badge badge-${isRunning ? 'run' : status}`}>{isRunning ? 'Running' : status}</span>
              <button onClick={e => handleRun(t.id, e)} disabled={isRunning} className="btn btn-ghost" style={{ fontSize: 11, padding: '5px 12px', flexShrink: 0 }}>
                {isRunning ? '⟳' : '▶ Run'}
              </button>
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>›</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
