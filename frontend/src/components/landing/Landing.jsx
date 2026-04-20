import React, { useState } from 'react';
import styles from './Landing.module.css';

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
    <div className={styles.page}>
      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroBadge}>🚀 Now in beta — free for early adopters</div>
        <h1 className={styles.heroTitle}>
          Your Product{' '}
          <span className={styles.heroGradient}>Tests, Understands</span>
          <br />& Improves Itself
        </h1>
        <p className={styles.heroSub}>
          No-code session recording → auto-generated tests → real user insights.
          Ship with confidence. Fix issues before users notice.
        </p>
        <div className={styles.heroCTAs}>
          <button className={styles.primaryBtn}>Start Free Trial →</button>
          <button className={styles.secondaryBtn}>Watch Demo</button>
        </div>
        <div className={styles.heroNote}>No credit card · 5 min setup · Cancel anytime</div>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        {STATS.map(s => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statValue}>{s.value}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className={styles.section}>
        <SectionHeading>How it works</SectionHeading>
        <div className={styles.howGrid}>
          {[
            { step: '01', title: 'Install script', desc: 'Paste one line into your <head>. 30 seconds.' },
            { step: '02', title: 'Sessions recorded', desc: 'Real users interact. Every action is captured.' },
            { step: '03', title: 'Tests auto-generated', desc: 'Playwright tests created from real flows.' },
            { step: '04', title: 'Issues surfaced', desc: 'AI finds drops, rages, and slow spots for you.' },
          ].map(item => (
            <div key={item.step} className={styles.stepCard}>
              <div className={styles.stepNum}>{item.step}</div>
              <div className={styles.stepTitle}>{item.title}</div>
              <div className={styles.stepDesc}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className={styles.section}>
        <SectionHeading>Everything you need</SectionHeading>
        <div className={styles.featuresGrid}>
          {FEATURES.map(f => (
            <div key={f.title} className={styles.featureCard} style={{ border: `1px solid ${f.border}` }}>
              <div className={styles.featureIcon} style={{ background: f.color }}>{f.icon}</div>
              <div className={styles.featureTitle}>{f.title}</div>
              <div className={styles.featureDesc}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div>
        <SectionHeading>Simple, transparent pricing</SectionHeading>
        <div className={styles.billingToggleRow}>
          <span className={`${styles.billingLabel} ${!billingAnnual ? styles.billingLabelActive : styles.billingLabelInactive}`}>Monthly</span>
          <div
            onClick={() => setBillingAnnual(p => !p)}
            className={`${styles.toggleTrack} ${billingAnnual ? styles.toggleTrackOn : ''}`}
          >
            <div className={`${styles.toggleThumb} ${billingAnnual ? styles.toggleThumbOn : ''}`} />
          </div>
          <span className={`${styles.billingLabel} ${billingAnnual ? styles.billingLabelActive : styles.billingLabelInactive}`}>
            Annual <span className={styles.savingLabel}>–20%</span>
          </span>
        </div>
        <div className={styles.plansGrid}>
          {PLANS.map(plan => {
            const price = billingAnnual && plan.price > 0 ? Math.round(plan.price * 0.8) : plan.price;
            return (
              <div key={plan.name} className={`${styles.planCard} ${plan.popular ? styles.planCardPopular : ''}`}>
                {plan.popular && <div className={styles.popularBadge}>MOST POPULAR</div>}
                <div className={styles.planName}>{plan.name}</div>
                <div className={styles.planPrice}>{plan.price === 0 ? 'Free' : `$${price}`}</div>
                <div className={styles.planPeriod}>{plan.period}</div>
                <div className={styles.planFeatures}>
                  {plan.features.map(f => (
                    <div key={f} className={styles.planFeatureItem}>
                      <span className={styles.planFeatureCheck}>✓</span> {f}
                    </div>
                  ))}
                </div>
                <button className={`${styles.planBtn} ${plan.popular ? styles.planBtnPopular : ''}`}>
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
    <div className={styles.sectionHeading}>
      <div className={styles.sectionLabel}>{children}</div>
      <div className={styles.sectionBar} />
    </div>
  );
}
