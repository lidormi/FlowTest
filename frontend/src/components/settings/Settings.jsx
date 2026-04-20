import React, { useState } from 'react';
import styles from './Settings.module.css';

const API_KEY = 'ft_live_xk9m2p4r8s1t7u3v6w0demo';
const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const SCRIPT_TAG = `<script src="https://cdn.flowtest.io/tracker.js"\n  data-key="${API_KEY}"\n  data-url="${BACKEND_URL}">\n</script>`;

export default function Settings() {
  const [copied, setCopied] = useState('');
  const [toggles, setToggles] = useState({
    production: true, autoTests: true, emailAlerts: false, aiSuggestions: true
  });

  function copy(text, key) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  }

  return (
    <div className={`${styles.page} fade-in`}>

      <Section title="Install Script" subtitle="Add to your website's <head> tag to start tracking">
        <pre className="code-block" style={{ fontSize: 11, whiteSpace: 'pre-wrap' }}>{SCRIPT_TAG}</pre>
        <button className="btn btn-ghost" style={{ marginTop: 8, fontSize: 11 }} onClick={() => copy(SCRIPT_TAG, 'script')}>
          {copied === 'script' ? '✓ Copied!' : '⧉ Copy Script'}
        </button>
      </Section>

      <Section title="API Key" subtitle="Use this key to authenticate your tracking script and API calls">
        <div className={styles.apiKeyRow}>
          <code className={styles.apiKeyText}>{API_KEY.slice(0, 20)}••••••••••••</code>
          <button className="btn btn-ghost" style={{ fontSize: 11 }} onClick={() => copy(API_KEY, 'key')}>
            {copied === 'key' ? '✓ Copied!' : '⧉ Copy'}
          </button>
          <button className="btn btn-danger" style={{ fontSize: 11 }}>↻ Regenerate</button>
        </div>
        <div className={styles.apiKeyHint}>⚠ Keep this key private. Regenerating will break existing integrations.</div>
      </Section>

      <Section title="Preferences">
        {[
          { key: 'production',    label: 'Record on production',                  desc: 'Capture real user sessions on your live site' },
          { key: 'autoTests',     label: 'Auto-generate tests from recordings',   desc: 'Automatically create Playwright tests from new recordings' },
          { key: 'emailAlerts',   label: 'Email alerts for critical failures',    desc: 'Get notified when a critical test fails or drop rate spikes' },
          { key: 'aiSuggestions', label: 'AI suggestions',                       desc: 'Analyze sessions and surface actionable improvement ideas' },
        ].map(item => (
          <div key={item.key} className={styles.toggleRow}>
            <div className={styles.toggleInfo}>
              <div className={styles.toggleLabel}>{item.label}</div>
              <div className={styles.toggleDesc}>{item.desc}</div>
            </div>
            <Toggle on={toggles[item.key]} onChange={() => setToggles(p => ({ ...p, [item.key]: !p[item.key] }))} />
          </div>
        ))}
      </Section>

      <Section title="Team Members" subtitle="Manage who has access to your FlowTest workspace">
        <div className={styles.memberList}>
          {[
            { initials:'YN', name:'Yoni Natan', email:'yoni@company.io', role:'Owner',     color:'linear-gradient(135deg,var(--purple),var(--blue))' },
            { initials:'DL', name:'Dana Levi',  email:'dana@company.io', role:'Developer', color:'linear-gradient(135deg,var(--green),var(--cyan))' },
            { initials:'RM', name:'Ron Mizrahi',email:'ron@company.io',  role:'Viewer',    color:'linear-gradient(135deg,var(--amber),var(--red))' },
          ].map(member => (
            <div key={member.email} className={styles.memberRow}>
              <div className={styles.memberAvatar} style={{ background: member.color }}>{member.initials}</div>
              <div className={styles.memberInfo}>
                <div className={styles.memberName}>{member.name}</div>
                <div className={styles.memberEmail}>{member.email}</div>
              </div>
              <span className={`badge ${member.role === 'Owner' ? 'badge-blue' : 'badge-idle'}`}>{member.role}</span>
              {member.role !== 'Owner' && (
                <button className="btn btn-ghost" style={{ fontSize: 10, padding: '3px 8px' }}>Remove</button>
              )}
            </div>
          ))}
        </div>
        <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}>
          + Invite Member
        </button>
      </Section>

      <Section title="Danger Zone" danger>
        <div className={styles.dangerRow}>
          <button className="btn btn-danger" style={{ fontSize: 12 }}>🗑 Delete All Sessions</button>
          <button className="btn btn-danger" style={{ fontSize: 12 }}>⚠ Delete Project</button>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, subtitle, children, danger }) {
  return (
    <div className={`${styles.section} ${danger ? styles.sectionDanger : ''}`}>
      <div className={styles.sectionHead}>
        <div className={`${styles.sectionTitle} ${danger ? styles.sectionTitleDanger : ''}`}>{title}</div>
        {subtitle && <div className={styles.sectionSub}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ on, onChange }) {
  return (
    <div onClick={onChange} className={`${styles.toggle} ${on ? styles.toggleOn : styles.toggleOff}`}>
      <div className={`${styles.toggleThumb} ${on ? styles.toggleThumbOn : styles.toggleThumbOff}`} />
    </div>
  );
}
