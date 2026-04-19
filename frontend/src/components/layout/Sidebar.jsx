import React from 'react';
import styles from './Sidebar.module.css';

const MAIN_PAGES = [
  { id: 'dashboard',   icon: '◈',  label: 'Dashboard' },
  { id: 'recordings',  icon: '⏺',  label: 'Recordings' },
  { id: 'tests',       icon: '⬡',  label: 'Tests' },
  { id: 'scheduler',   icon: '📅', label: 'Scheduler' },
  { id: 'insights',    icon: '◎',  label: 'Insights' },
  { id: 'analytics',   icon: '📊', label: 'Analytics' },
  { id: 'abandonment', icon: '📉', label: 'Abandonment' },
];
const CONFIG_PAGES = [
  { id: 'store',    icon: '🛒', label: 'Marketplace' },
  { id: 'landing',  icon: '⊕',  label: 'Landing Page' },
  { id: 'settings', icon: '◉',  label: 'Settings' },
];

export default function Sidebar({ page, setPage, alertCount, isMobile, open, onClose }) {
  if (isMobile && !open) return null;

  const nav = (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>FT</div>
          <div>
            <div className={styles.logoName}>FlowTest</div>
            <span className={styles.logoVersion}>v1.1</span>
          </div>
        </div>
        {isMobile && (
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        )}
      </div>

      <nav className={styles.nav}>
        <Section label="Main" />
        {MAIN_PAGES.map(p => (
          <NavItem
            key={p.id}
            {...p}
            active={page === p.id}
            onClick={() => { setPage(p.id); if (isMobile) onClose(); }}
            badge={p.id === 'dashboard' && alertCount > 0 ? alertCount : null}
          />
        ))}
        <Section label="Config" />
        {CONFIG_PAGES.map(p => (
          <NavItem
            key={p.id}
            {...p}
            active={page === p.id}
            onClick={() => { setPage(p.id); if (isMobile) onClose(); }}
          />
        ))}
      </nav>

      <div className={styles.footer}>
        <div className={styles.status}>
          <div className={styles.statusDot} />
          <span className={styles.statusText}>All systems operational</span>
        </div>
      </div>
    </aside>
  );

  if (isMobile) {
    return (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.overlayPanel} onClick={e => e.stopPropagation()}>
          {nav}
        </div>
      </div>
    );
  }

  return nav;
}

function Section({ label }) {
  return <div className={styles.sectionLabel}>{label}</div>;
}

function NavItem({ icon, label, active, onClick, badge }) {
  return (
    <div
      className={`${styles.navItem} ${active ? styles.active : ''}`}
      onClick={onClick}
    >
      <span className={styles.navIcon}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {badge && <span className={styles.navBadge}>{badge}</span>}
    </div>
  );
}
