import React from 'react';
import { useApi } from '../../hooks/useApi.js';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, FunnelChart, Funnel, LabelList } from 'recharts';

export default function Insights() {
  const { data, loading } = useApi('/insights');

  const funnel = data?.funnel || [];
  const rageTargets = data?.rageTargets || [];
  const slowPages = data?.slowPages || [];
  const insights = data?.insights || [];

  const suggestions = insights.filter(i => i.type === 'suggestion');
  const issues = insights.filter(i => i.type !== 'suggestion');

  const maxVisits = funnel[0]?.visits || 1;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Top row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 12 }}>
        {/* Funnel */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">📉 Drop-off Funnel</span>
            <span style={{ fontSize: 10, color: 'var(--text3)' }}>Real session data</span>
          </div>
          {loading ? <Skeleton h={160} /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {funnel.map((step, i) => {
                const pct = Math.round((step.visits / maxVisits) * 100);
                const prevPct = i > 0 ? Math.round((funnel[i-1].visits / maxVisits) * 100) : 100;
                const dropped = prevPct - pct;
                const isBad = dropped > 30;
                return (
                  <div key={step.page} style={{
                    padding: '8px 10px', borderRadius: 7,
                    background: isBad ? 'rgba(239,68,68,0.04)' : 'var(--bg3)',
                    border: `1px solid ${isBad ? 'rgba(239,68,68,0.2)' : 'var(--border)'}`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, width: 90, color: isBad ? 'var(--red)' : 'var(--text)' }}>{step.page}</span>
                      <div style={{ flex: 1, height: 12, background: 'var(--bg4)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: isBad ? 'var(--red)' : pct > 60 ? 'var(--green)' : 'var(--amber)', borderRadius: 2, transition: 'width 0.8s ease' }} />
                      </div>
                      <span style={{ fontSize: 11, fontFamily: 'var(--mono)', width: 36, textAlign: 'right', color: isBad ? 'var(--red)' : 'var(--text)' }}>{pct}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text3)' }}>
                      <span>{step.visits} users</span>
                      {i > 0 && dropped > 0 && <span style={{ color: isBad ? 'var(--red)' : 'var(--text3)' }}>↓ {dropped}% dropped</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Rage Clicks */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">😡 Rage Clicks</span>
          </div>
          {loading ? <Skeleton h={160} /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {rageTargets.length === 0 && <div style={{ fontSize: 12, color: 'var(--text3)', padding: '20px 0', textAlign: 'center' }}>No rage clicks detected 🎉</div>}
              {rageTargets.map((t, i) => (
                <div key={i} style={{ padding: '8px 10px', background: 'var(--bg3)', borderRadius: 7, borderLeft: `2.5px solid ${i === 0 ? 'var(--red)' : i === 1 ? 'var(--amber)' : 'var(--text3)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{t.target}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--mono)', color: i === 0 ? 'var(--red)' : 'var(--amber)', marginLeft: 8 }}>×{t.c}</span>
                  </div>
                  <div style={{ height: 3, background: 'var(--bg4)', borderRadius: 2, overflow: 'hidden', marginTop: 5 }}>
                    <div style={{ width: `${Math.round((t.c / rageTargets[0].c) * 100)}%`, height: '100%', background: i === 0 ? 'var(--red)' : 'var(--amber)', borderRadius: 2 }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Slow Pages */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">⏱ Slow Pages</span>
          </div>
          {loading ? <Skeleton h={160} /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {slowPages.map((p, i) => {
                const isSlow = p.avg_duration > 60;
                return (
                  <div key={i} style={{ padding: '8px 10px', background: 'var(--bg3)', borderRadius: 7 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{p.url}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--mono)', color: isSlow ? 'var(--red)' : 'var(--amber)', marginLeft: 8 }}>{p.avg_duration}s</span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{p.views} page views</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Issues */}
      {issues.length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">🚨 Detected Issues</span>
            <span className="badge badge-fail">{issues.length} issues</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
            {issues.map(issue => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        </div>
      )}

      {/* AI Suggestions */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">💡 AI Suggestions</span>
          <span style={{ fontSize: 9, color: 'var(--purple)', background: 'rgba(139,92,246,0.12)', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>Powered by AI</span>
        </div>
        {loading ? <Skeleton h={80} /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {suggestions.map(s => (
              <div key={s.id} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                background: 'rgba(79,142,247,0.04)', border: '1px solid rgba(79,142,247,0.12)',
                borderRadius: 8
              }}>
                <span style={{ fontSize: 16 }}>💡</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500 }}>{s.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{s.description}</div>
                </div>
                {s.impact && (
                  <span style={{ fontSize: 10, color: 'var(--green)', background: 'var(--green-dim)', padding: '3px 10px', borderRadius: 5, fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {s.impact}
                  </span>
                )}
              </div>
            ))}
            {suggestions.length === 0 && (
              <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', padding: '20px 0' }}>No suggestions yet — record more sessions to generate insights</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function IssueCard({ issue }) {
  const parsed = issue.data ? (typeof issue.data === 'string' ? JSON.parse(issue.data) : issue.data) : {};
  const typeColors = { funnel_drop: 'var(--red)', rage_click: 'var(--amber)', performance: 'var(--amber)' };
  const color = typeColors[issue.type] || 'var(--blue)';
  return (
    <div style={{ background: 'var(--bg3)', border: `1px solid ${color}33`, borderRadius: 8, padding: '12px 14px' }}>
      <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>{issue.title}</div>
      <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 8 }}>{issue.description}</div>
      {issue.impact && (
        <div style={{ fontSize: 10, color: color, fontWeight: 600 }}>Impact: {issue.impact}</div>
      )}
      {parsed.drop_rate && (
        <div style={{ marginTop: 6, height: 3, background: 'var(--bg4)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${Math.round(parsed.drop_rate * 100)}%`, height: '100%', background: color, borderRadius: 2 }} />
        </div>
      )}
    </div>
  );
}

function Skeleton({ h }) {
  return <div style={{ height: h, background: 'var(--bg3)', borderRadius: 7 }} />;
}
