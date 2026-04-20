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

const TITLES = {
  dashboard:'Dashboard', recordings:'Recordings', tests:'Tests',
  scheduler:'Test Scheduler', insights:'Insights', analytics:'Analytics',
  landing:'Landing Page', settings:'Settings',
  store:'Marketplace', abandonment:'Abandonment Analysis'
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
    const vars = theme === 'light' ? {
      '--bg':'#f4f5f7','--bg2':'#ffffff','--bg3':'#f0f1f4','--bg4':'#e4e6eb',
      '--text':'#0f1117','--text2':'#4a5568','--text3':'#9aa5b4',
      '--border':'#e2e5ec','--border2':'#cbd0da'
    } : {
      '--bg':'#0a0b0f','--bg2':'#111318','--bg3':'#1a1d24','--bg4':'#22262f',
      '--text':'#e8eaf0','--text2':'#8892a4','--text3':'#4a5568',
      '--border':'#1e2433','--border2':'#2a3044'
    };
    for (const [k, v] of Object.entries(vars)) document.documentElement.style.setProperty(k, v);
  }, [theme]);

  if (loading) return (
    <div style={{ height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:44,height:44,borderRadius:12,background:'linear-gradient(135deg,var(--blue),var(--purple))',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:800,color:'#fff',fontFamily:'var(--mono)',marginBottom:12 }}>FT</div>
        <div style={{ fontSize:12,color:'var(--text2)' }}>Loading FlowTest...</div>
      </div>
    </div>
  );

  if (!user) return <LoginPage onLogin={login} />;

  return (
    <div style={{ display:'flex',height:'100vh',overflow:'hidden' }}>
      <Sidebar page={page} setPage={setPage} alertCount={alertCount} isMobile={isMobile} open={sidebarOpen} onClose={()=>setSidebarOpen(false)} />
      <div style={{ flex:1,display:'flex',flexDirection:'column',overflow:'hidden',background:'var(--bg)' }}>
        {/* Topbar */}
        <div style={{ height:52,borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',padding:'0 14px',gap:10,background:'var(--bg)',flexShrink:0 }}>
          {isMobile && (
            <button onClick={()=>setSidebarOpen(true)} style={{ background:'none',border:'none',cursor:'pointer',fontSize:22,color:'var(--text2)',padding:'4px',lineHeight:1,flexShrink:0 }}>☰</button>
          )}
          <div style={{ flex:1,fontSize:15,fontWeight:600 }}>{TITLES[page]}</div>
          {!isMobile && <div style={{ display:'flex',alignItems:'center',gap:5,fontSize:11,color:'var(--green)' }}>
            <div style={{ width:6,height:6,borderRadius:'50%',background:'var(--green)',animation:'pulse-dot 2s infinite' }}/>
            Live
          </div>}
          <button onClick={()=>setTheme(t=>t==='dark'?'light':'dark')} style={{ background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:7,padding:'5px 9px',cursor:'pointer',fontSize:14,color:'var(--text2)',flexShrink:0 }}>
            {theme==='dark'?'☀':'🌙'}
          </button>
          {!isMobile && page==='tests' && <button className="btn btn-ghost" onClick={()=>setPage('scheduler')} style={{ fontSize:11 }}>📅 Schedule</button>}
          <div onClick={logout} style={{ display:'flex',alignItems:'center',gap:6,padding:'4px 8px',background:'var(--bg3)',borderRadius:7,cursor:'pointer',flexShrink:0 }}>
            <div style={{ width:22,height:22,borderRadius:'50%',background:'linear-gradient(135deg,var(--purple),var(--blue))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:700,color:'#fff' }}>
              {(user.name||'U').slice(0,2).toUpperCase()}
            </div>
            {!isMobile && <span style={{ fontSize:11,color:'var(--text2)' }}>{user.name}</span>}
            <span style={{ fontSize:isMobile?11:9,color:isMobile?'var(--red)':'var(--text3)',fontWeight:isMobile?700:400 }}>↪ out</span>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex:1,overflowY:'auto',padding:page==='landing'?0:'18px 22px',boxSizing:'border-box' }}>
          {page==='dashboard'  && <Dashboard onAlertChange={()=>stats.refetch()} liveEvents={liveEvents}/>}
          {page==='recordings' && <Recordings/>}
          {page==='tests'      && <Tests/>}
          {page==='scheduler'  && <Scheduler/>}
          {page==='insights'   && <Insights/>}
          {page==='analytics'  && <Analytics/>}
          {page==='settings'    && <Settings user={user}/>}
          {page==='landing'     && <div style={{ padding:'0 22px' }}><Landing/></div>}
          {page==='store'       && <Store/>}
          {page==='abandonment' && <Abandonment/>}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppInner/>
      </ToastProvider>
    </AuthProvider>
  );
}
