import React, { useState } from 'react';

const FEATURES = [
  { icon: '🎥', title: 'Record User Flows', desc: 'One-line script captures every click, scroll, and input. Zero configuration needed.', color: 'rgba(79,142,247,0.1)', border: 'rgba(79,142,247,0.15)' },
  { icon: '🧪', title: 'Auto-Generate Tests', desc: 'Recordings become Playwright tests instantly. No manual coding, ever.', color: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.15)' },
  { icon: '🧠', title: 'Understand Drop-offs', desc: 'AI pinpoints exactly where and why users leave — with fix suggestions.', color: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.15)' },
  { icon: '🚨', title: 'Real-time Alerts', desc: 'Instant notifications when a test breaks or a critical flow degrades.', color: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.15)' },
  { icon: '⚡', title: 'Performance Insights', desc: 'Surface slow pages and bottlenecks before users notice them.', color: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.15)' },
  { icon: '👥', title: 'Team Collaboration', desc: 'Share recordings, tests, and insights with your entire team.', color: 'rgba(6,182,212,0.1)', border: 'rgba(6,182,212,0.15)' },
];

const PLANS = [
  { name: 'Starter', price: 0, period: 'forever free', features: ['1,000 sessions/mo', '5 automated tests', 'Basic insights', '7-day history'], popular: false },
  { name: 'Pro', price: 49, period: 'per month', features: ['50,000 sessions/mo', 'Unlimited tests', 'AI suggestions', '90-day history', 'Priority support'], popular: true },
  { name: 'Business', price: 199, period: 'per month', features: ['Unlimited sessions', 'Unlimited tests', 'Full AI suite', '1-year history', 'SSO + SLA', 'Dedicated CSM'], popular: false },
];

const STATS = [
  { value: '2.4M+', label: 'Sessions recorded' },
  { value: '98.7%', label: 'Uptime SLA' },
  { value: '340ms', label: 'Avg detection time' },
  { value: '4,200+', label: 'Active teams' },
];

export default function Landing() {
  const [billingAnnual, setBillingAnnual] = useState(false);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 40 }}>
      {/* Hero */}
      <div style={{
        textAlign: 'center', padding: '40px 20px 36px',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(79,142,247,0.08) 0%, transparent 70%)',
        borderBottom: '1px solid var(--border)', marginBottom: 32
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(79,142,247,0.1)', border: '1px solid rgba(79,142,247,0.2)', borderRadius: 20, padding: '4px 12px', fontSize: 11, color: 'var(--blue)', fontWeight: 600, marginBottom: 18 }}>
          🚀 Now in beta — free for early adopters
        </div>
        <h1 style={{ fontSize: 38, fontWeight: 700, lineHeight: 1.2, letterSpacing: '-1px', marginBottom: 14 }}>
          Your Product{' '}
          <span style={{ background: 'linear-gradient(90deg, var(--blue), var(--purple))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Tests, Understands
          </span>
          <br />& Improves Itself
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text2)', maxWidth: 480, margin: '0 auto 24px', lineHeight: 1.7 }}>
          No-code session recording → auto-generated tests → real user insights.
          Ship with confidence. Fix issues before users notice.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', alignItems: 'center' }}>
          <button style={{ padding: '11px 24px', background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)' }}>
            Start Free Trial →
          </button>
          <button style={{ padding: '11px 20px', background: 'transparent', color: 'var(--text)', border: '1px solid var(--border2)', borderRadius: 9, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font)' }}>
            Watch Demo
          </button>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 12 }}>No credit card · 5 min setup · Cancel anytime</div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 32, padding: '0 4px' }}>
        {STATS.map(s => (
          <div key={s.label} style={{ textAlign: 'center', padding: '14px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10 }}>
            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--blue)' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div style={{ marginBottom: 32 }}>
        <SectionHeading>How it works</SectionHeading>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          {[
            { step: '01', title: 'Install script', desc: 'Paste one line into your <head>. 30 seconds.' },
            { step: '02', title: 'Sessions recorded', desc: 'Real users interact. Every action is captured.' },
            { step: '03', title: 'Tests auto-generated', desc: 'Playwright tests created from real flows.' },
            { step: '04', title: 'Issues surfaced', desc: 'AI finds drops, rages, and slow spots for you.' },
          ].map(item => (
            <div key={item.step} style={{ padding: '14px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--blue)', fontWeight: 600, marginBottom: 8 }}>{item.step}</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 5 }}>{item.title}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.5 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div style={{ marginBottom: 32 }}>
        <SectionHeading>Everything you need</SectionHeading>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{ background: 'var(--bg2)', border: `1px solid ${f.border}`, borderRadius: 10, padding: '16px' }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, marginBottom: 10 }}>{f.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 5 }}>{f.title}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div>
        <SectionHeading>Simple, transparent pricing</SectionHeading>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: billingAnnual ? 'var(--text3)' : 'var(--text)' }}>Monthly</span>
          <div onClick={() => setBillingAnnual(p => !p)} style={{ width: 40, height: 22, borderRadius: 11, background: billingAnnual ? 'var(--blue)' : 'var(--bg4)', border: '1px solid var(--border2)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
            <div style={{ position: 'absolute', top: 3, left: billingAnnual ? 19 : 3, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
          </div>
          <span style={{ fontSize: 12, color: billingAnnual ? 'var(--text)' : 'var(--text3)' }}>Annual <span style={{ color: 'var(--green)', fontWeight: 600 }}>–20%</span></span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          {PLANS.map(plan => {
            const price = billingAnnual && plan.price > 0 ? Math.round(plan.price * 0.8) : plan.price;
            return (
              <div key={plan.name} style={{
                background: plan.popular ? 'rgba(79,142,247,0.04)' : 'var(--bg2)',
                border: `1px solid ${plan.popular ? 'rgba(79,142,247,0.4)' : 'var(--border)'}`,
                borderRadius: 12, padding: '20px 18px', textAlign: 'center', position: 'relative'
              }}>
                {plan.popular && (
                  <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: 'var(--blue)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '3px 12px', borderRadius: 10, whiteSpace: 'nowrap' }}>MOST POPULAR</div>
                )}
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>{plan.name}</div>
                <div style={{ fontSize: 32, fontWeight: 700, fontFamily: 'var(--mono)', marginBottom: 4 }}>{plan.price === 0 ? 'Free' : `$${price}`}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 16 }}>{plan.period}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18, textAlign: 'left' }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: 'flex', gap: 7, fontSize: 12, color: 'var(--text2)' }}>
                      <span style={{ color: 'var(--green)', flexShrink: 0 }}>✓</span> {f}
                    </div>
                  ))}
                </div>
                <button style={{
                  width: '100%', padding: '9px', borderRadius: 7, fontSize: 12.5, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'var(--font)', transition: 'all 0.15s',
                  background: plan.popular ? 'var(--blue)' : 'transparent',
                  color: plan.popular ? '#fff' : 'var(--text)',
                  border: plan.popular ? 'none' : '1px solid var(--border2)'
                }}>
                  {plan.price === 0 ? 'Get Started Free' : 'Start Free Trial'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ children }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: 18 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>{children}</div>
      <div style={{ width: 30, height: 2, background: 'var(--blue)', margin: '0 auto', borderRadius: 2 }} />
    </div>
  );
}
