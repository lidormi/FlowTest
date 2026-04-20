import React, { useState } from 'react';

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
    <div className="fade-in" style={{ maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Install Script */}
      <Section title="Install Script" subtitle="Add to your website's <head> tag to start tracking">
        <pre className="code-block" style={{ fontSize: 11, whiteSpace: 'pre-wrap' }}>{SCRIPT_TAG}</pre>
        <button className="btn btn-ghost" style={{ marginTop: 8, fontSize: 11 }} onClick={() => copy(SCRIPT_TAG, 'script')}>
          {copied === 'script' ? '✓ Copied!' : '⧉ Copy Script'}
        </button>
      </Section>

      {/* API Key */}
      <Section title="API Key" subtitle="Use this key to authenticate your tracking script and API calls">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, padding: '10px 14px' }}>
          <code style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text2)', flex: 1, letterSpacing: 1 }}>
            {API_KEY.slice(0, 20)}••••••••••••
          </code>
          <button className="btn btn-ghost" style={{ fontSize: 11 }} onClick={() => copy(API_KEY, 'key')}>
            {copied === 'key' ? '✓ Copied!' : '⧉ Copy'}
          </button>
          <button className="btn btn-danger" style={{ fontSize: 11 }}>↻ Regenerate</button>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8 }}>⚠ Keep this key private. Regenerating will break existing integrations.</div>
      </Section>

      {/* Preferences */}
      <Section title="Preferences">
        {[
          { key: 'production', label: 'Record on production', desc: 'Capture real user sessions on your live site' },
          { key: 'autoTests', label: 'Auto-generate tests from recordings', desc: 'Automatically create Playwright tests from new recordings' },
          { key: 'emailAlerts', label: 'Email alerts for critical failures', desc: 'Get notified when a critical test fails or drop rate spikes' },
          { key: 'aiSuggestions', label: 'AI suggestions', desc: 'Analyze sessions and surface actionable improvement ideas' },
        ].map(item => (
          <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{item.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{item.desc}</div>
            </div>
            <Toggle on={toggles[item.key]} onChange={() => setToggles(p => ({ ...p, [item.key]: !p[item.key] }))} />
          </div>
        ))}
      </Section>

      {/* Team */}
      <Section title="Team Members" subtitle="Manage who has access to your FlowTest workspace">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
          {[
            { initials: 'YN', name: 'Yoni Natan', email: 'yoni@company.io', role: 'Owner', color: 'linear-gradient(135deg,var(--purple),var(--blue))' },
            { initials: 'DL', name: 'Dana Levi', email: 'dana@company.io', role: 'Developer', color: 'linear-gradient(135deg,var(--green),var(--cyan))' },
            { initials: 'RM', name: 'Ron Mizrahi', email: 'ron@company.io', role: 'Viewer', color: 'linear-gradient(135deg,var(--amber),var(--red))' },
          ].map(member => (
            <div key={member.email} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: 'var(--bg3)', borderRadius: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: member.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{member.initials}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 500 }}>{member.name}</div>
                <div style={{ fontSize: 10, color: 'var(--text2)' }}>{member.email}</div>
              </div>
              <span className={`badge ${member.role === 'Owner' ? 'badge-blue' : 'badge-idle'}`}>{member.role}</span>
              {member.role !== 'Owner' && <button className="btn btn-ghost" style={{ fontSize: 10, padding: '3px 8px' }}>Remove</button>}
            </div>
          ))}
        </div>
        <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}>+ Invite Member</button>
      </Section>

      {/* Danger zone */}
      <Section title="Danger Zone" danger>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-danger" style={{ fontSize: 12 }}>🗑 Delete All Sessions</button>
          <button className="btn btn-danger" style={{ fontSize: 12 }}>⚠ Delete Project</button>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, subtitle, children, danger }) {
  return (
    <div style={{
      background: 'var(--bg2)', border: `1px solid ${danger ? 'rgba(239,68,68,0.25)' : 'var(--border)'}`,
      borderRadius: 'var(--radius)', padding: 16
    }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: danger ? 'var(--red)' : 'var(--text)' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 3 }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ on, onChange }) {
  return (
    <div onClick={onChange} style={{
      width: 36, height: 20, borderRadius: 10,
      background: on ? 'var(--blue)' : 'var(--bg4)',
      border: `1px solid ${on ? 'var(--blue)' : 'var(--border2)'}`,
      cursor: 'pointer', position: 'relative', transition: 'all 0.2s', flexShrink: 0
    }}>
      <div style={{
        position: 'absolute', top: 2, left: on ? 17 : 2,
        width: 14, height: 14, borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
      }} />
    </div>
  );
}
