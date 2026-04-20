import React, { useState, useEffect } from 'react';
import { useApi, runTest, getTestStatus } from '../../hooks/useApi.js';
import TestDetail from './TestDetail.jsx';
import styles from './Tests.module.css';

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

  const statusDotColor = { pass: 'var(--green)', fail: 'var(--red)', idle: 'var(--text3)', running: 'var(--amber)' };

  return (
    <div className={`${styles.page} fade-in`}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarHint}>
          Click any test to open its full detail page with run history, code, and analytics.
        </div>
        <button className="btn btn-ghost" onClick={() => tests?.forEach(t => handleRun(t.id))}>⬡ Run All</button>
        <button className="btn btn-primary">+ Generate from Recording</button>
      </div>

      {tests && (
        <div className={styles.summaryRow}>
          {[
            { label:'Total',   value:tests.length,                                color:'var(--blue)' },
            { label:'Passing', value:tests.filter(t=>t.status==='pass').length,   color:'var(--green)' },
            { label:'Failing', value:tests.filter(t=>t.status==='fail').length,   color:'var(--red)' },
            { label:'Idle',    value:tests.filter(t=>t.status==='idle').length,   color:'var(--text2)' },
          ].map(s => (
            <div key={s.label} className={styles.summaryCard}>
              <div className={styles.summaryCardLabel}>{s.label}</div>
              <div className={styles.summaryCardValue} style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.testList}>
        {loading
          ? Array.from({ length: 5 }, (_, i) => (
              <div key={i} className={styles.testSkeleton} style={{ height: 68 }} />
            ))
          : (tests || []).map(t => {
              const isRunning = runningTests[t.id] || t.status === 'running';
              const status    = isRunning ? 'running' : t.status;
              const passRate  = t.total_runs > 0 ? Math.round((t.passed_runs / t.total_runs) * 100) : null;
              const dotColor  = statusDotColor[status];

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTest(t.id)}
                  className={styles.testRow}
                >
                  <div
                    className={styles.testDot}
                    style={{
                      background: dotColor,
                      boxShadow: status === 'pass' ? '0 0 6px var(--green)' : status === 'fail' ? '0 0 6px var(--red)' : 'none',
                    }}
                  />
                  <div className={styles.testInfo}>
                    <div className={styles.testHeader}>
                      <span className={styles.testName}>{t.name}</span>
                    </div>
                    <div className={styles.testMeta}>
                      {t.description} · {t.total_runs} runs
                      {t.last_duration && ` · ${(t.last_duration / 1000).toFixed(1)}s last`}
                    </div>
                  </div>

                  <div className={styles.miniBars}>
                    {Array.from({ length: Math.min(8, t.total_runs || 0) }, (_, i) => (
                      <div
                        key={i}
                        className={styles.miniBar}
                        style={{ background: i < (t.passed_runs || 0) ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)' }}
                      />
                    ))}
                  </div>

                  {passRate !== null && (
                    <div className={styles.passRate}>
                      <div
                        className={styles.passRateVal}
                        style={{ color: passRate >= 80 ? 'var(--green)' : passRate >= 50 ? 'var(--amber)' : 'var(--red)' }}
                      >
                        {passRate}%
                      </div>
                      <div className={styles.passRateLabel}>pass rate</div>
                    </div>
                  )}

                  <span className={`badge badge-${isRunning ? 'run' : status}`}>
                    {isRunning ? 'Running' : status}
                  </span>
                  <button
                    onClick={e => handleRun(t.id, e)}
                    disabled={isRunning}
                    className="btn btn-ghost"
                    style={{ fontSize: 11, padding: '5px 12px', flexShrink: 0 }}
                  >
                    {isRunning ? '⟳' : '▶ Run'}
                  </button>
                  <span className={styles.testChevron}>›</span>
                </div>
              );
            })
        }
      </div>
    </div>
  );
}
