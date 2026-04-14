import React from 'react';

const MAIN_PAGES = [
  { id: 'dashboard',    icon: '◈',  label: 'Dashboard' },
  { id: 'recordings',   icon: '⏺',  label: 'Recordings' },
  { id: 'tests',        icon: '⬡',  label: 'Tests' },
  { id: 'scheduler',    icon: '📅', label: 'Scheduler' },
  { id: 'insights',     icon: '◎',  label: 'Insights' },
  { id: 'analytics',    icon: '📊', label: 'Analytics' },
  { id: 'abandonment',  icon: '📉', label: 'Abandonment' },
];
const CONFIG_PAGES = [
  { id: 'store',    icon: '🛒', label: 'Marketplace' },
  { id: 'landing',  icon: '⊕',  label: 'Landing Page' },
  { id: 'settings', icon: '◉',  label: 'Settings' },
];

export default function Sidebar({ page, setPage, alertCount }) {
  return (
    <aside style={{ width: 200, background: 'var(--bg2)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,var(--blue),var(--purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', fontFamily: 'var(--mono)' }}>FT</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.3px' }}>FlowTest</div>
            <div style={{ fontSize: 9, color: 'var(--blue)', background: 'var(--blue-dim)', padding: '1px 6px', borderRadius: 4, fontFamily: 'var(--mono)', display: 'inline-block' }}>v1.1</div>
          </div>
        </div>
      </div>
      <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
        <Section label="Main" />
        {MAIN_PAGES.map(p => <NavItem key={p.id} {...p} active={page===p.id} onClick={()=>setPage(p.id)} badge={p.id==='dashboard'&&alertCount>0?alertCount:null}/>)}
        <Section label="Config" />
        {CONFIG_PAGES.map(p => <NavItem key={p.id} {...p} active={page===p.id} onClick={()=>setPage(p.id)}/>)}
      </nav>
      <div style={{ padding: 12, borderTop: '1px solid var(--border)' }}>
        <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '6px 9px', display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', animation: 'pulse-dot 2s infinite', flexShrink: 0 }}/>
          <span style={{ fontSize: 10, color: 'var(--text2)' }}>All systems operational</span>
        </div>
      </div>
    </aside>
  );
}

function Section({ label }) {
  return <div style={{ padding: '8px 14px 3px', fontSize: 9, fontWeight: 600, color: 'var(--text3)', letterSpacing: '1.2px', textTransform: 'uppercase' }}>{label}</div>;
}

function NavItem({ icon, label, active, onClick, badge }) {
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 14px', fontSize: 12.5, cursor: 'pointer', color: active?'var(--blue)':'var(--text2)', background: active?'rgba(79,142,247,0.08)':'transparent', borderLeft: active?'2.5px solid var(--blue)':'2.5px solid transparent', transition: 'all 0.12s', userSelect: 'none' }}>
      <span style={{ fontSize: 13, width: 16, textAlign: 'center' }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {badge && <span style={{ fontSize: 9, background: 'var(--red-dim)', color: 'var(--red)', padding: '1px 6px', borderRadius: 10, fontFamily: 'var(--mono)' }}>{badge}</span>}
    </div>
  );
}
