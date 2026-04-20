import React, { useState } from 'react';
import styles from './Abandonment.module.css';

const REASONS = [
  {
    rank: 1,
    title: 'Long / confusing checkout process',
    pct: 26,
    icon: '🛒',
    color: '#ef4444',
    desc: 'Users drop off after step 2 of checkout. Average of 4.2 form fields is above the 3-field threshold that maximizes conversion.',
    pages: ['/checkout/shipping', '/checkout/payment'],
    solutions: [
      { action: 'Reduce checkout to 2 steps max (billing → pay)', impact: '+18% conv.', effort: 'Medium', priority: 'P0' },
      { action: 'Add "Buy in 1 click" for returning users', impact: '+12% conv.', effort: 'High', priority: 'P1' },
      { action: 'Show progress bar and estimated completion time', impact: '+6% conv.', effort: 'Low', priority: 'P1' },
    ]
  },
  {
    rank: 2,
    title: 'Surprise costs (shipping, taxes, fees)',
    pct: 21,
    icon: '💸',
    color: '#f59e0b',
    desc: 'Drop-off spikes 340% at the payment step when users see the final total. Rage-click rate on the "Total" row is 4.7×.',
    pages: ['/checkout/payment', '/cart'],
    solutions: [
      { action: 'Show all costs upfront on the product page', impact: '+14% conv.', effort: 'Low', priority: 'P0' },
      { action: 'Add "No hidden fees" trust badge near price', impact: '+7% conv.', effort: 'Low', priority: 'P1' },
      { action: 'Offer free shipping threshold or flat-rate', impact: '+9% conv.', effort: 'Medium', priority: 'P1' },
    ]
  },
  {
    rank: 3,
    title: 'Mandatory account creation',
    pct: 17,
    icon: '🔐',
    color: '#8b5cf6',
    desc: '63% of first-time visitors exit immediately when they see a required sign-up wall before checkout.',
    pages: ['/register', '/checkout'],
    solutions: [
      { action: 'Add "Guest Checkout" option (no account needed)', impact: '+22% conv.', effort: 'Medium', priority: 'P0' },
      { action: 'Offer social login (Google / Apple)', impact: '+11% conv.', effort: 'Medium', priority: 'P1' },
      { action: 'Prompt account creation AFTER purchase completes', impact: '+8% conv.', effort: 'Low', priority: 'P2' },
    ]
  },
  {
    rank: 4,
    title: 'Slow page load (>3 seconds)',
    pct: 13,
    icon: '🐢',
    color: '#06b6d4',
    desc: 'Mobile users on 4G wait 4.8 s on /checkout. Every 1 s delay costs ~7% conversions.',
    pages: ['/checkout', '/products'],
    solutions: [
      { action: 'Lazy-load images below the fold', impact: '-1.8 s LCP', effort: 'Low', priority: 'P0' },
      { action: 'Move payment SDK script to async/defer', impact: '-0.9 s', effort: 'Low', priority: 'P1' },
      { action: 'Enable CDN edge caching for static assets', impact: '-1.2 s', effort: 'Medium', priority: 'P1' },
    ]
  },
  {
    rank: 5,
    title: 'Lack of trust signals',
    pct: 9,
    icon: '🛡',
    color: '#22c55e',
    desc: 'No SSL badge, reviews, or money-back guarantee visible at checkout. Trust-signal A/B test showed +14% lift when added.',
    pages: ['/checkout/payment', '/pricing'],
    solutions: [
      { action: 'Add SSL lock badge + "Secured by Stripe" near pay button', impact: '+8% conv.', effort: 'Low', priority: 'P0' },
      { action: 'Display 30-day money-back guarantee prominently', impact: '+9% conv.', effort: 'Low', priority: 'P0' },
      { action: 'Show recent customer reviews on checkout page', impact: '+5% conv.', effort: 'Medium', priority: 'P2' },
    ]
  },
  {
    rank: 6,
    title: 'Mobile UX issues',
    pct: 8,
    icon: '📱',
    color: '#f472b6',
    desc: 'iOS users have a 61% drop-off on the payment form due to keyboard overlapping the CVC field.',
    pages: ['/checkout/payment'],
    solutions: [
      { action: 'Fix viewport scrolling to reveal card fields on iOS', impact: '+11% mobile conv.', effort: 'Low', priority: 'P0' },
      { action: 'Set inputmode="numeric" on card number/CVC inputs', impact: '+4% mobile', effort: 'Low', priority: 'P1' },
      { action: 'Add Apple Pay / Google Pay as primary mobile option', impact: '+19% mobile', effort: 'High', priority: 'P1' },
    ]
  },
  {
    rank: 7,
    title: 'Confusing pricing / plan options',
    pct: 6,
    icon: '❓',
    color: '#fb923c',
    desc: 'Session recordings show users toggling between plan pages 3+ times. Avg. 2.4 min spent on pricing page with no action.',
    pages: ['/pricing', '/plans'],
    solutions: [
      { action: 'Highlight the most popular plan with a visual callout', impact: '+7% plan-page conv.', effort: 'Low', priority: 'P0' },
      { action: 'Add interactive "Which plan is right for me?" quiz', impact: '+12% conv.', effort: 'High', priority: 'P2' },
      { action: 'Include a simple feature comparison table', impact: '+6% conv.', effort: 'Low', priority: 'P1' },
    ]
  },
];

const FUNNEL = [
  { page: 'Product Page', sessions: 14200, pct: 100, drop: 0, color: '#4f8ef7' },
  { page: 'Add to Cart', sessions: 9118, pct: 64, drop: 36, color: '#6366f1' },
  { page: 'Cart Review', sessions: 5471, pct: 38, drop: 26, color: '#8b5cf6' },
  { page: 'Billing Info', sessions: 3283, pct: 23, drop: 15, color: '#a855f7' },
  { page: 'Payment', sessions: 1970, pct: 14, drop: 9, color: '#d946ef' },
  { page: 'Order Confirmed', sessions: 1478, pct: 10, drop: 4, color: '#22c55e' },
];

const BY_DEVICE = [
  { device: 'Desktop', sessions: 8200, conv: '14.2%', dropRate: '85.8%', color: '#4f8ef7' },
  { device: 'Mobile', sessions: 4800, conv: '7.1%', dropRate: '92.9%', color: '#ef4444' },
  { device: 'Tablet', sessions: 1200, conv: '11.3%', dropRate: '88.7%', color: '#f59e0b' },
];

const BY_BROWSER = [
  { browser: 'Chrome', pct: 54, conv: '12.4%' },
  { browser: 'Safari', pct: 28, conv: '8.9%' },
  { browser: 'Firefox', pct: 11, conv: '13.1%' },
  { browser: 'Edge', pct: 7, conv: '11.8%' },
];

const PRIORITY_COLORS = { P0: '#ef4444', P1: '#f59e0b', P2: '#22c55e' };
const EFFORT_COLORS = { Low: '#22c55e', Medium: '#f59e0b', High: '#ef4444' };

export default function Abandonment() {
  const [activeReason, setActiveReason] = useState(null);
  const [tab, setTab] = useState('reasons');

  const totalLost = 14200 - 1478;
  const overallConv = 10.4;

  return (
    <div>
      <div className={styles.header}>
        <h2 className={styles.headerTitle}>Abandonment Analysis</h2>
        <p className={styles.headerSub}>Why users leave — and exactly how to fix each drop-off point</p>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        {[
          { label: 'Overall Conversion', value: `${overallConv}%`, sub: 'product → paid', color: '#4f8ef7', icon: '📈' },
          { label: 'Sessions Lost', value: totalLost.toLocaleString(), sub: 'per month', color: '#ef4444', icon: '📉' },
          { label: 'Revenue Lost', value: '$82,400', sub: 'est. per month', color: '#f59e0b', icon: '💰' },
          { label: 'Recoverable (est.)', value: '+$29,700/mo', sub: 'with P0 fixes', color: '#22c55e', icon: '🚀' },
        ].map(c => (
          <div key={c.label} className={styles.kpiCard}>
            <div className={styles.kpiCardTop}>
              <span className={styles.kpiLabel}>{c.label}</span>
              <span className={styles.kpiIcon}>{c.icon}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: c.color, letterSpacing: '-0.5px' }}>{c.value}</div>
            <div className={styles.kpiSub}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {[['reasons', 'Top Reasons'], ['funnel', 'Conversion Funnel'], ['device', 'By Device & Browser'], ['solutions', 'Action Plan']].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={styles.tab}
            style={{
              border: tab === id ? '1px solid var(--blue)' : '1px solid var(--border)',
              background: tab === id ? 'rgba(79,142,247,0.1)' : 'var(--bg2)',
              color: tab === id ? 'var(--blue)' : 'var(--text2)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Top Reasons */}
      {tab === 'reasons' && (
        <div className={styles.reasonsList}>
          {REASONS.map(r => (
            <div
              key={r.rank}
              onClick={() => setActiveReason(activeReason === r.rank ? null : r.rank)}
              className={styles.reasonCard}
              style={{ border: `1px solid ${activeReason === r.rank ? r.color : 'var(--border)'}` }}
            >
              <div className={styles.reasonCardBody}>
                <span className={styles.reasonIcon}>{r.icon}</span>
                <div className={styles.reasonContent}>
                  <div className={styles.reasonTitleRow}>
                    <span className={styles.reasonTitle}>{r.title}</span>
                    <span className={styles.reasonRank}>#{r.rank}</span>
                  </div>
                  <div className={styles.barRow}>
                    <div className={styles.barWrap}>
                      <div className={styles.barFill} style={{ width: `${r.pct}%`, background: r.color }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: r.color, minWidth: 36 }}>{r.pct}%</span>
                  </div>
                </div>
                <span className={`${styles.chevron} ${activeReason === r.rank ? styles.chevronOpen : ''}`}>▾</span>
              </div>

              {activeReason === r.rank && (
                <div className={styles.reasonDetail}>
                  <p className={styles.reasonDesc}>{r.desc}</p>
                  <div className={styles.pageTagList}>
                    {r.pages.map(p => <span key={p} className={styles.pageTag}>{p}</span>)}
                  </div>
                  <div className={styles.fixesLabel}>Recommended Fixes</div>
                  <div className={styles.fixesList}>
                    {r.solutions.map((s, i) => (
                      <div key={i} className={styles.fixRow}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: PRIORITY_COLORS[s.priority], background: `${PRIORITY_COLORS[s.priority]}18`, padding: '2px 6px', borderRadius: 4, flexShrink: 0 }}>{s.priority}</span>
                        <span className={styles.fixAction}>{s.action}</span>
                        <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 600, flexShrink: 0 }}>{s.impact}</span>
                        <span style={{ fontSize: 10, color: EFFORT_COLORS[s.effort], background: `${EFFORT_COLORS[s.effort]}15`, padding: '2px 7px', borderRadius: 4, flexShrink: 0 }}>{s.effort}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab: Funnel */}
      {tab === 'funnel' && (
        <div className={styles.funnelCard}>
          <h3 className={styles.funnelTitle}>Conversion Funnel — Last 30 Days</h3>
          <div className={styles.funnelSteps}>
            {FUNNEL.map((step, i) => (
              <div key={step.page}>
                <div className={styles.funnelStepRow}>
                  <span className={styles.funnelStepLabel}>{step.page}</span>
                  <div className={styles.funnelBarWrap}>
                    <div className={styles.funnelBarFill} style={{ width: `${step.pct}%`, background: step.color }}>
                      {step.pct > 15 && <span className={styles.funnelBarLabel}>{step.sessions.toLocaleString()}</span>}
                    </div>
                    {step.pct <= 15 && <span className={styles.funnelBarLabelOut} style={{ left: `${step.pct + 1}%` }}>{step.sessions.toLocaleString()}</span>}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, minWidth: 40, textAlign: 'right', color: step.color }}>{step.pct}%</span>
                  {step.drop > 0 && <span style={{ fontSize: 11, color: '#ef4444', minWidth: 55, textAlign: 'right' }}>−{step.drop}% drop</span>}
                  {step.drop === 0 && <span style={{ minWidth: 55 }} />}
                </div>
              </div>
            ))}
          </div>
          <div className={styles.dropNote}>
            <div className={styles.dropNoteTitle}>Biggest drop-off: Add to Cart → Cart Review (−26%)</div>
            <div className={styles.dropNoteDesc}>
              26% of users who add items to cart never reach the cart review page. Root cause: cart drawer closes unexpectedly on mobile tap-outside. Fix: change dismissal to require an explicit "Close" button tap.
            </div>
          </div>
        </div>
      )}

      {/* Tab: Device & Browser */}
      {tab === 'device' && (
        <div className={styles.deviceGrid}>
          <div className={styles.deviceCard}>
            <h3 className={styles.deviceCardTitle}>By Device</h3>
            <div className={styles.deviceRows}>
              {BY_DEVICE.map(d => (
                <div key={d.device} className={styles.deviceRow}>
                  <span className={styles.deviceLabel}>{d.device}</span>
                  <div className={styles.deviceBarWrap}>
                    <div className={styles.deviceBarFill} style={{ width: `${(d.sessions / 14200) * 100}%`, background: d.color }} />
                  </div>
                  <span className={styles.deviceCount}>{d.sessions.toLocaleString()}</span>
                  <span className={styles.deviceConv} style={{ color: d.color }}>{d.conv}</span>
                </div>
              ))}
            </div>
            <div className={styles.deviceNote} style={{ background: 'rgba(239,68,68,0.07)' }}>
              <strong style={{ color: '#ef4444' }}>Mobile converts at 7.1%</strong> vs 14.2% desktop — 2× gap. Priority: mobile payment UX improvements.
            </div>
          </div>

          <div className={styles.deviceCard}>
            <h3 className={styles.deviceCardTitle}>By Browser</h3>
            <div className={styles.deviceRows}>
              {BY_BROWSER.map(b => (
                <div key={b.browser} className={styles.deviceRow}>
                  <span className={styles.deviceLabel}>{b.browser}</span>
                  <div className={styles.deviceBarWrap}>
                    <div className={styles.deviceBarFill} style={{ width: `${b.pct}%`, background: '#4f8ef7', opacity: 0.6 + b.pct / 200 }} />
                  </div>
                  <span style={{ fontSize: 11, minWidth: 30, textAlign: 'right', color: 'var(--text3)' }}>{b.pct}%</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#4f8ef7', minWidth: 45, textAlign: 'right' }}>{b.conv}</span>
                </div>
              ))}
            </div>
            <div className={styles.deviceNote} style={{ background: 'rgba(245,158,11,0.07)' }}>
              <strong style={{ color: '#f59e0b' }}>Safari (28% of traffic)</strong> has 36% lower conversion than Firefox. Likely cause: iOS Safari keyboard overlap bug on payment form.
            </div>
          </div>
        </div>
      )}

      {/* Tab: Action Plan */}
      {tab === 'solutions' && (
        <div>
          <div className={styles.priorityLegend}>
            {[['P0', 'Critical — fix this week', '#ef4444'], ['P1', 'High — fix this sprint', '#f59e0b'], ['P2', 'Medium — backlog', '#22c55e']].map(([p, label, color]) => (
              <div key={p} className={styles.priorityTag} style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
                <span style={{ fontWeight: 700, color }}>{p}</span>
                <span className={styles.priorityTagLabel}>{label}</span>
              </div>
            ))}
          </div>

          {['P0', 'P1', 'P2'].map(priority => {
            const items = REASONS.flatMap(r => r.solutions.filter(s => s.priority === priority).map(s => ({ ...s, reason: r.title, icon: r.icon })));
            if (!items.length) return null;
            return (
              <div key={priority} className={styles.priorityGroup}>
                <div className={styles.priorityGroupTitle}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: PRIORITY_COLORS[priority], background: `${PRIORITY_COLORS[priority]}18`, padding: '3px 9px', borderRadius: 5 }}>{priority}</span>
                  <span className={styles.priorityGroupLabel}>{priority === 'P0' ? 'Critical Actions' : priority === 'P1' ? 'High Priority' : 'Medium Priority'}</span>
                </div>
                <div className={styles.actionItems}>
                  {items.map((s, i) => (
                    <div key={i} className={styles.actionItem}>
                      <span className={styles.actionIcon}>{s.icon}</span>
                      <div className={styles.actionContent}>
                        <div className={styles.actionTitle}>{s.action}</div>
                        <div className={styles.actionFrom}>From: {s.reason}</div>
                      </div>
                      <div className={styles.actionRight}>
                        <div className={styles.actionImpact}>{s.impact}</div>
                        <div className={styles.actionEffort} style={{ color: EFFORT_COLORS[s.effort] }}>{s.effort} effort</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <div className={styles.totalImpactBox}>
            <div className={styles.totalImpactTitle}>Estimated total impact if all P0 + P1 fixes ship</div>
            <div className={styles.totalImpactDesc}>
              Conversion rate: <strong>10.4% → 16–18%</strong> &nbsp;·&nbsp; Revenue recovered: <strong>+$29,700/mo</strong> &nbsp;·&nbsp; Payback period: <strong>&lt; 2 sprints</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
