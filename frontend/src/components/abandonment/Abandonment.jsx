import React, { useState } from 'react';

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
      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px', letterSpacing: '-0.4px' }}>Abandonment Analysis</h2>
        <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0 }}>Why users leave — and exactly how to fix each drop-off point</p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 22 }}>
        {[
          { label: 'Overall Conversion', value: `${overallConv}%`, sub: 'product → paid', color: '#4f8ef7', icon: '📈' },
          { label: 'Sessions Lost', value: totalLost.toLocaleString(), sub: 'per month', color: '#ef4444', icon: '📉' },
          { label: 'Revenue Lost', value: '$82,400', sub: 'est. per month', color: '#f59e0b', icon: '💰' },
          { label: 'Recoverable (est.)', value: '+$29,700/mo', sub: 'with P0 fixes', color: '#22c55e', icon: '🚀' },
        ].map(c => (
          <div key={c.label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 500 }}>{c.label}</span>
              <span style={{ fontSize: 16 }}>{c.icon}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: c.color, letterSpacing: '-0.5px' }}>{c.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
        {[['reasons', 'Top Reasons'], ['funnel', 'Conversion Funnel'], ['device', 'By Device & Browser'], ['solutions', 'Action Plan']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding: '7px 16px', borderRadius: 8, border: tab === id ? '1px solid var(--blue)' : '1px solid var(--border)', background: tab === id ? 'rgba(79,142,247,0.1)' : 'var(--bg2)', color: tab === id ? 'var(--blue)' : 'var(--text2)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Top Reasons */}
      {tab === 'reasons' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {REASONS.map(r => (
            <div key={r.rank} onClick={() => setActiveReason(activeReason === r.rank ? null : r.rank)}
              style={{ background: 'var(--bg2)', border: `1px solid ${activeReason === r.rank ? r.color : 'var(--border)'}`, borderRadius: 12, padding: 16, cursor: 'pointer', transition: 'border-color .15s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{r.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700 }}>{r.title}</span>
                    <span style={{ fontSize: 10, color: 'var(--text3)' }}>#{r.rank}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${r.pct}%`, background: r.color, borderRadius: 3, transition: 'width .4s ease' }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: r.color, minWidth: 36 }}>{r.pct}%</span>
                  </div>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text3)', transform: activeReason === r.rank ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▾</span>
              </div>

              {activeReason === r.rank && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 12.5, color: 'var(--text2)', lineHeight: 1.65, margin: '0 0 12px' }}>{r.desc}</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                    {r.pages.map(p => <span key={p} style={{ fontSize: 10.5, fontFamily: 'var(--mono)', color: 'var(--text2)', background: 'var(--bg3)', padding: '3px 8px', borderRadius: 5 }}>{p}</span>)}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 11.5, color: 'var(--text2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Recommended Fixes</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {r.solutions.map((s, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg3)', borderRadius: 8, padding: '10px 12px' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: PRIORITY_COLORS[s.priority], background: `${PRIORITY_COLORS[s.priority]}18`, padding: '2px 6px', borderRadius: 4, flexShrink: 0 }}>{s.priority}</span>
                        <span style={{ flex: 1, fontSize: 12.5 }}>{s.action}</span>
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
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: 24 }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 14, fontWeight: 700 }}>Conversion Funnel — Last 30 Days</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {FUNNEL.map((step, i) => (
              <div key={step.page}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--text2)', width: 130, flexShrink: 0 }}>{step.page}</span>
                  <div style={{ flex: 1, height: 32, background: 'var(--bg3)', borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
                    <div style={{ height: '100%', width: `${step.pct}%`, background: step.color, borderRadius: 6, display: 'flex', alignItems: 'center', paddingLeft: 10, transition: 'width .6s ease' }}>
                      {step.pct > 15 && <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{step.sessions.toLocaleString()}</span>}
                    </div>
                    {step.pct <= 15 && <span style={{ position: 'absolute', left: `${step.pct + 1}%`, top: '50%', transform: 'translateY(-50%)', fontSize: 11, fontWeight: 700, color: 'var(--text2)' }}>{step.sessions.toLocaleString()}</span>}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, minWidth: 40, textAlign: 'right', color: step.color }}>{step.pct}%</span>
                  {step.drop > 0 && <span style={{ fontSize: 11, color: '#ef4444', minWidth: 55, textAlign: 'right' }}>−{step.drop}% drop</span>}
                  {step.drop === 0 && <span style={{ minWidth: 55 }} />}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, padding: '12px 16px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 9 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#ef4444', marginBottom: 4 }}>Biggest drop-off: Add to Cart → Cart Review (−26%)</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
              26% of users who add items to cart never reach the cart review page. Root cause: cart drawer closes unexpectedly on mobile tap-outside. Fix: change dismissal to require an explicit "Close" button tap.
            </div>
          </div>
        </div>
      )}

      {/* Tab: Device & Browser */}
      {tab === 'device' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700 }}>By Device</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {BY_DEVICE.map(d => (
                <div key={d.device} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, width: 70, color: 'var(--text2)' }}>{d.device}</span>
                  <div style={{ flex: 1, height: 28, background: 'var(--bg3)', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(d.sessions / 14200) * 100}%`, background: d.color, borderRadius: 6 }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, minWidth: 50, textAlign: 'right', color: 'var(--text2)' }}>{d.sessions.toLocaleString()}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: d.color, minWidth: 45, textAlign: 'right' }}>{d.conv}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, padding: '10px 12px', background: 'rgba(239,68,68,0.07)', borderRadius: 8, fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
              <strong style={{ color: '#ef4444' }}>Mobile converts at 7.1%</strong> vs 14.2% desktop — 2× gap. Priority: mobile payment UX improvements.
            </div>
          </div>

          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700 }}>By Browser</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {BY_BROWSER.map(b => (
                <div key={b.browser} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, width: 70, color: 'var(--text2)' }}>{b.browser}</span>
                  <div style={{ flex: 1, height: 28, background: 'var(--bg3)', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${b.pct}%`, background: '#4f8ef7', borderRadius: 6, opacity: 0.6 + b.pct / 200 }} />
                  </div>
                  <span style={{ fontSize: 11, minWidth: 30, textAlign: 'right', color: 'var(--text3)' }}>{b.pct}%</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#4f8ef7', minWidth: 45, textAlign: 'right' }}>{b.conv}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, padding: '10px 12px', background: 'rgba(245,158,11,0.07)', borderRadius: 8, fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
              <strong style={{ color: '#f59e0b' }}>Safari (28% of traffic)</strong> has 36% lower conversion than Firefox. Likely cause: iOS Safari keyboard overlap bug on payment form.
            </div>
          </div>
        </div>
      )}

      {/* Tab: Action Plan */}
      {tab === 'solutions' && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
            {[['P0', 'Critical — fix this week', '#ef4444'], ['P1', 'High — fix this sprint', '#f59e0b'], ['P2', 'Medium — backlog', '#22c55e']].map(([p, label, color]) => (
              <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: `${color}12`, border: `1px solid ${color}25`, borderRadius: 8, fontSize: 12 }}>
                <span style={{ fontWeight: 700, color }}>{p}</span>
                <span style={{ color: 'var(--text2)' }}>{label}</span>
              </div>
            ))}
          </div>

          {['P0', 'P1', 'P2'].map(priority => {
            const items = REASONS.flatMap(r => r.solutions.filter(s => s.priority === priority).map(s => ({ ...s, reason: r.title, icon: r.icon })));
            if (!items.length) return null;
            return (
              <div key={priority} style={{ marginBottom: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: PRIORITY_COLORS[priority], background: `${PRIORITY_COLORS[priority]}18`, padding: '3px 9px', borderRadius: 5 }}>{priority}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{priority === 'P0' ? 'Critical Actions' : priority === 'P1' ? 'High Priority' : 'Medium Priority'}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {items.map((s, i) => (
                    <div key={i} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>{s.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{s.action}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>From: {s.reason}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#22c55e' }}>{s.impact}</div>
                        <div style={{ fontSize: 10, color: EFFORT_COLORS[s.effort], marginTop: 2 }}>{s.effort} effort</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <div style={{ background: 'rgba(79,142,247,0.06)', border: '1px solid rgba(79,142,247,0.15)', borderRadius: 12, padding: '16px 18px', marginTop: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue)', marginBottom: 6 }}>Estimated total impact if all P0 + P1 fixes ship</div>
            <div style={{ fontSize: 12.5, color: 'var(--text2)', lineHeight: 1.7 }}>
              Conversion rate: <strong>10.4% → 16–18%</strong> &nbsp;·&nbsp; Revenue recovered: <strong>+$29,700/mo</strong> &nbsp;·&nbsp; Payback period: <strong>&lt; 2 sprints</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
