import React, { useState, useEffect } from 'react';
import { ToastProvider, useToast } from './components/layout/Toast.jsx';
import { AuthProvider, useAuth, LoginPage } from './components/layout/Auth.jsx';
import Sidebar from './components/layout/Sidebar.jsx';
import Dashboard from './components/dashboard/Dashboard.jsx';
import Recordings from './components/recordings/Recordings.jsx';
import Tests from './components/tests/Tests.jsx';
import Scheduler from './components/tests/Scheduler.jsx';
import Insights from './components/insights/Insights.jsx';
import Analytics from './components/analytics/Analytics.jsx';
import Settings from './components/settings/Settings.jsx';
import Landing from './components/landing/Landing.jsx';
import Store from './components/store/Store.jsx';
import Abandonment from './components/abandonment/Abandonment.jsx';
import { useApi } from './hooks/useApi.js';
import { useWebSocket } from './hooks/useWebSocket.js';
import styles from './App.module.css';

const TITLES = {
  dashboard: 'Dashboard', recordings: 'Recordings', tests: 'Tests',
  scheduler: 'Test Scheduler', insights: 'Insights', analytics: 'Analytics',
  landing: 'Landing Page', settings: 'Settings',
  store: 'Marketplace', abandonment: 'Abandonment Analysis',
};

const THEME_VARS = {
  light: {
    '--bg': '#f4f5f7', '--bg2': '#ffffff', '--bg3': '#f0f1f4', '--bg4': '#e4e6eb',
    '--text': '#0f1117', '--text2': '#4a5568', '--text3': '#9aa5b4',
    '--border': '#e2e5ec', '--border2': '#cbd0da',
  },
  dark: {
    '--bg': '#0a0b0f', '--bg2': '#111318', '--bg3': '#1a1d24', '--bg4': '#22262f',
    '--text': '#e8eaf0', '--text2': '#8892a4', '--text3': '#4a5568',
    '--border': '#1e2433', '--border2': '#2a3044',
  },
};

function AppInner() {
  const { user, loading, login, logout } = useAuth();
  const toast = useToast();
  const [page, setPage] = useState('dashboard');
  const [alertCount, setAlertCount] = useState(0);
  const [liveEvents, setLiveEvents] = useState([]);
  const [theme, setTheme] = useState('dark');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const stats = useApi('/dashboard/stats');

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (stats.data?.activeAlerts != null) setAlertCount(stats.data.activeAlerts);
  }, [stats.data]);

  useWebSocket((msg) => {
    if (msg.type === 'new_session') {
      setLiveEvents(prev => [...prev.slice(-19), msg]);
    } else if (msg.type === 'alert') {
      setLiveEvents(prev => [...prev.slice(-19), msg]);
      toast(`🚨 ${msg.data?.title}`, 'warning');
      setAlertCount(c => c + 1);
    } else if (msg.type === 'test_completed') {
      const status = msg.data?.status;
      toast(`${status === 'pass' ? '✅' : '❌'} ${msg.data?.name}: ${status}`, status === 'pass' ? 'success' : 'error');
      stats.refetch();
    }
  });

  useEffect(() => {
    const vars = THEME_VARS[theme] || THEME_VARS.dark;
    for (const [k, v] of Object.entries(vars)) {
      document.documentElement.style.setProperty(k, v);
    }
  }, [theme]);

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingInner}>
          <div className={styles.loadingLogo}>FT</div>
          <div className={styles.loadingText}>Loading FlowTest...</div>
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage onLogin={login} />;

  const isLandingPage = page === 'landing';

  return (
    <div className={styles.layout}>
      <Sidebar
        page={page}
        setPage={setPage}
        alertCount={alertCount}
        isMobile={isMobile}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className={styles.main}>
        {/* Topbar */}
        <div className={styles.topbar}>
          {isMobile && (
            <button className={styles.hamburgerBtn} onClick={() => setSidebarOpen(true)}>
              ☰
            </button>
          )}

          <div className={styles.topbarTitle}>{TITLES[page]}</div>

          {!isMobile && (
            <div className={styles.liveIndicator}>
              <div className={styles.liveDot} />
              Live
            </div>
          )}

          <button
            className={styles.themeBtn}
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? '☀' : '🌙'}
          </button>

          {!isMobile && page === 'tests' && (
            <button className="btn btn-ghost" onClick={() => setPage('scheduler')} style={{ fontSize: 11 }}>
              📅 Schedule
            </button>
          )}

          <div className={styles.userMenu} onClick={logout}>
            <div className={styles.userAvatar}>
              {(user.name || 'U').slice(0, 2).toUpperCase()}
            </div>
            {!isMobile && <span className={styles.userName}>{user.name}</span>}
            <span className={isMobile ? styles.logoutIconMobile : styles.logoutIcon}>
              ↪ out
            </span>
          </div>
        </div>

        {/* Content */}
        <div className={`${styles.content} ${isLandingPage ? '' : styles.contentPadded}`}>
          {page === 'dashboard'  && <Dashboard onAlertChange={() => stats.refetch()} liveEvents={liveEvents} />}
          {page === 'recordings' && <Recordings />}
          {page === 'tests'      && <Tests />}
          {page === 'scheduler'  && <Scheduler />}
          {page === 'insights'   && <Insights />}
          {page === 'analytics'  && <Analytics />}
          {page === 'settings'   && <Settings user={user} />}
          {page === 'landing'    && <div style={{ padding: '0 22px' }}><Landing /></div>}
          {page === 'store'      && <Store />}
          {page === 'abandonment' && <Abandonment />}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppInner />
      </ToastProvider>
    </AuthProvider>
  );
}
