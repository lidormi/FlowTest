import React from 'react';
import { useApi } from '../../hooks/useApi.js';
import styles from './Insights.module.css';

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
    <div className={`${styles.page} fade-in`}>
      {/* Top row */}
      <div className={styles.topRow}>
        {/* Funnel */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">📉 Drop-off Funnel</span>
            <span style={{ fontSize: 10, color: 'var(--text3)' }}>Real session data</span>
          </div>
          {loading ? <Skeleton h={160} /> : (
            <div className={styles.funnelList}>
              {funnel.map((step, i) => {
                const pct = Math.round((step.visits / maxVisits) * 100);
                const prevPct = i > 0 ? Math.round((funnel[i-1].visits / maxVisits) * 100) : 100;
                const dropped = prevPct - pct;
                const isBad = dropped > 30;
                return (
                  <div key={step.page} className={`${styles.funnelStep} ${isBad ? styles.funnelStepBad : styles.funnelStepNormal}`}>
                    <div className={styles.funnelStepRow}>
                      <span className={styles.funnelStepLabel} style={{ color: isBad ? 'var(--red)' : 'var(--text)' }}>{step.page}</span>
                      <div className={styles.funnelBar}>
                        <div
                          className={styles.funnelBarFill}
                          style={{
                            width: `${pct}%`,
                            background: isBad ? 'var(--red)' : pct > 60 ? 'var(--green)' : 'var(--amber)',
                          }}
                        />
                      </div>
                      <span className={styles.funnelPct} style={{ color: isBad ? 'var(--red)' : 'var(--text)' }}>{pct}%</span>
                    </div>
                    <div className={styles.funnelMeta}>
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
            <div className={styles.rageList}>
              {rageTargets.length === 0 && <div className={styles.rageEmpty}>No rage clicks detected 🎉</div>}
              {rageTargets.map((t, i) => {
                const borderColor = i === 0 ? 'var(--red)' : i === 1 ? 'var(--amber)' : 'var(--text3)';
                const countColor = i === 0 ? 'var(--red)' : 'var(--amber)';
                return (
                  <div key={i} className={styles.rageItem} style={{ borderLeftColor: borderColor }}>
                    <div className={styles.rageHeader}>
                      <span className={styles.rageTarget}>{t.target}</span>
                      <span className={styles.rageCount} style={{ color: countColor }}>×{t.c}</span>
                    </div>
                    <div className={styles.rageBarWrap}>
                      <div
                        className={styles.rageBarFill}
                        style={{
                          width: `${Math.round((t.c / rageTargets[0].c) * 100)}%`,
                          background: i === 0 ? 'var(--red)' : 'var(--amber)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Slow Pages */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">⏱ Slow Pages</span>
          </div>
          {loading ? <Skeleton h={160} /> : (
            <div className={styles.slowList}>
              {slowPages.map((p, i) => {
                const isSlow = p.avg_duration > 60;
                return (
                  <div key={i} className={styles.slowItem}>
                    <div className={styles.slowItemRow}>
                      <span className={styles.slowUrl}>{p.url}</span>
                      <span className={styles.slowDur} style={{ color: isSlow ? 'var(--red)' : 'var(--amber)' }}>{p.avg_duration}s</span>
                    </div>
                    <div className={styles.slowViews}>{p.views} page views</div>
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
          <div className={styles.issuesGrid}>
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
          <span className={styles.aiBadge}>Powered by AI</span>
        </div>
        {loading ? <Skeleton h={80} /> : (
          <div className={styles.suggestionList}>
            {suggestions.map(s => (
              <div key={s.id} className={styles.suggestion}>
                <span className={styles.suggestionIcon}>💡</span>
                <div className={styles.suggestionBody}>
                  <div className={styles.suggestionTitle}>{s.title}</div>
                  <div className={styles.suggestionDesc}>{s.description}</div>
                </div>
                {s.impact && (
                  <span className={styles.suggestionImpact}>{s.impact}</span>
                )}
              </div>
            ))}
            {suggestions.length === 0 && (
              <div className={styles.noSuggestions}>No suggestions yet — record more sessions to generate insights</div>
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
    <div className={styles.issueCard} style={{ borderColor: `${color}33` }}>
      <div className={styles.issueTitle}>{issue.title}</div>
      <div className={styles.issueDesc}>{issue.description}</div>
      {issue.impact && (
        <div className={styles.issueImpact} style={{ color }}> Impact: {issue.impact}</div>
      )}
      {parsed.drop_rate && (
        <div className={styles.issueProgressWrap}>
          <div
            className={styles.issueProgressFill}
            style={{ width: `${Math.round(parsed.drop_rate * 100)}%`, background: color }}
          />
        </div>
      )}
    </div>
  );
}

function Skeleton({ h }) {
  return <div className={styles.skeleton} style={{ height: h }} />;
}
