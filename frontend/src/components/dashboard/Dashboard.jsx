import React, { useState } from 'react';
import { useApi, resolveAlert } from '../../hooks/useApi.js';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import LiveFeed from './LiveFeed.jsx';

function StatCard({ label, value, change, color, up }) {
  return (
    <div style={{ background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'14px 16px',borderTop:`2px solid ${color}` }}>
      <div style={{ fontSize:10,color:'var(--text2)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:8 }}>{label}</div>
      <div style={{ fontSize:26,fontWeight:700,fontFamily:'var(--mono)',color,lineHeight:1 }}>{value ?? <span style={{fontSize:16,color:'var(--text3)'}}>—</span>}</div>
      {change && <div style={{ fontSize:10,color:up?'var(--green)':'var(--red)',marginTop:6 }}>{change}</div>}
    </div>
  );
}

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'var(--bg3)',border:'1px solid var(--border2)',borderRadius:7,padding:'8px 12px' }}>
      <div style={{ fontSize:10,color:'var(--text2)',marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:12,color:'var(--blue)' }}>Total: {payload[0]?.value}</div>
      <div style={{ fontSize:12,color:'var(--red)' }}>Dropped: {payload[1]?.value}</div>
    </div>
  );
};

export default function Dashboard({ onAlertChange, liveEvents }) {
  const stats = useApi('/dashboard/stats');
  const chart = useApi('/dashboard/chart');
  const alerts = useApi('/dashboard/alerts');
  const [chartType, setChartType] = useState('bar');

  async function handleResolve(id) {
    await resolveAlert(id);
    alerts.refetch(); stats.refetch(); onAlertChange?.();
  }

  const s = stats.data || {};
  const chartData = (chart.data || []).map(d => ({ ...d, date: d.date?.split(',')[0] }));
  const alertList = alerts.data || [];

  return (
    <div className="fade-in" style={{ display:'flex',flexDirection:'column',gap:14 }}>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10 }}>
        <StatCard label="Total Tests" value={s.totalTests} color="var(--blue)" change="↑ 12% this week" up />
        <StatCard label="Failed Tests" value={s.failedTests} color="var(--red)" change={s.failedTests>0?'needs attention':'✓ all passing'} up={s.failedTests===0} />
        <StatCard label="Drop Rate" value={s.dropRate!=null?`${s.dropRate}%`:null} color="var(--amber)" change={`${s.droppedSessions??0} dropped`} up={false} />
        <StatCard label="Rage Clicks" value={s.rageClicks} color="var(--green)" change={`${s.totalSessions??0} total sessions`} up />
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'1.7fr 1fr',gap:12 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Sessions — 14 days</span>
            <div style={{ display:'flex',gap:4 }}>
              {['bar','line'].map(t => (
                <button key={t} onClick={() => setChartType(t)} style={{ fontSize:10,padding:'2px 8px',borderRadius:5,cursor:'pointer',fontFamily:'var(--font)',background:chartType===t?'var(--blue-dim)':'transparent',color:chartType===t?'var(--blue)':'var(--text3)',border:`1px solid ${chartType===t?'rgba(79,142,247,0.3)':'var(--border)'}` }}>{t}</button>
              ))}
              <a href="/api/export/sessions.csv" style={{ fontSize:10,padding:'2px 8px',borderRadius:5,textDecoration:'none',background:'var(--bg4)',color:'var(--text2)',border:'1px solid var(--border)',display:'inline-flex',alignItems:'center',gap:3 }}>⬇ CSV</a>
            </div>
          </div>
          {chart.loading ? <Skeleton h={140} /> : (
            <ResponsiveContainer width="100%" height={140}>
              {chartType==='bar' ? (
                <BarChart data={chartData} barGap={2}>
                  <XAxis dataKey="date" tick={{fontSize:9,fill:'var(--text3)'}} interval={1} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:9,fill:'var(--text3)'}} axisLine={false} tickLine={false} width={22}/>
                  <Tooltip content={<ChartTooltip/>} cursor={{fill:'rgba(255,255,255,0.03)'}}/>
                  <Bar dataKey="total" fill="rgba(79,142,247,0.3)" radius={[3,3,0,0]}/>
                  <Bar dataKey="dropped" fill="rgba(239,68,68,0.5)" radius={[3,3,0,0]}/>
                </BarChart>
              ) : (
                <LineChart data={chartData}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false}/>
                  <XAxis dataKey="date" tick={{fontSize:9,fill:'var(--text3)'}} interval={1} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:9,fill:'var(--text3)'}} axisLine={false} tickLine={false} width={22}/>
                  <Tooltip content={<ChartTooltip/>}/>
                  <Line type="monotone" dataKey="total" stroke="var(--blue)" strokeWidth={2} dot={false}/>
                  <Line type="monotone" dataKey="dropped" stroke="var(--red)" strokeWidth={2} dot={false}/>
                </LineChart>
              )}
            </ResponsiveContainer>
          )}
          <div style={{ display:'flex',gap:14,marginTop:8,paddingTop:8,borderTop:'1px solid var(--border)' }}>
            {[['rgba(79,142,247,0.5)','Total sessions'],['rgba(239,68,68,0.5)','Dropped']].map(([bg,lbl])=>(
              <div key={lbl} style={{ display:'flex',alignItems:'center',gap:5,fontSize:10,color:'var(--text2)' }}>
                <div style={{ width:10,height:10,borderRadius:2,background:bg }}/>{lbl}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">🚨 Active Alerts</span>
            {alertList.length>0 && <span className="badge badge-fail">{alertList.length}</span>}
          </div>
          {alerts.loading ? <Skeleton h={140}/> : (
            <div style={{ display:'flex',flexDirection:'column',gap:5 }}>
              {alertList.length===0 && <div style={{ fontSize:12,color:'var(--text3)',textAlign:'center',padding:'24px 0' }}><div style={{fontSize:22,marginBottom:6}}>✓</div>No active alerts</div>}
              {alertList.slice(0,4).map(a => <AlertItem key={a.id} alert={a} onResolve={()=>handleResolve(a.id)}/>)}
            </div>
          )}
        </div>
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12 }}>
        <RecentSessions/>
        <InsightsSummary stats={s}/>
        <div className="card">
          <div className="card-header">
            <span className="card-title">📡 Live Feed</span>
            <div style={{ display:'flex',alignItems:'center',gap:5,fontSize:10,color:'var(--green)' }}>
              <div style={{ width:6,height:6,borderRadius:'50%',background:'var(--green)',animation:'pulse-dot 2s infinite' }}/> Live
            </div>
          </div>
          <LiveFeed events={liveEvents||[]}/>
        </div>
      </div>
    </div>
  );
}

function AlertItem({ alert, onResolve }) {
  const icons = { critical:'🔴', high:'🟡', medium:'🔵', low:'⚪' };
  const colors = { critical:'var(--red)', high:'var(--amber)', medium:'var(--blue)', low:'var(--text3)' };
  const timeAgo = ts => { const s=Math.floor(Date.now()/1000)-ts; return s<60?`${s}s`:s<3600?`${Math.floor(s/60)}m`:`${Math.floor(s/3600)}h`; };
  return (
    <div style={{ display:'flex',alignItems:'flex-start',gap:8,padding:'7px 9px',background:'var(--bg3)',borderRadius:7,borderLeft:`2.5px solid ${colors[alert.severity]||'var(--text3)'}` }}>
      <span style={{ fontSize:12,marginTop:1 }}>{icons[alert.severity]||'⚪'}</span>
      <div style={{ flex:1,minWidth:0 }}>
        <div style={{ fontSize:11.5,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{alert.title}</div>
        <div style={{ fontSize:10,color:'var(--text2)',marginTop:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{alert.description?.slice(0,50)}</div>
      </div>
      <div style={{ display:'flex',flexDirection:'column',alignItems:'flex-end',gap:3,flexShrink:0 }}>
        <span style={{ fontSize:9,color:'var(--text3)',fontFamily:'var(--mono)' }}>{timeAgo(alert.created_at)}</span>
        <button onClick={onResolve} style={{ fontSize:8,padding:'1px 6px',background:'var(--bg4)',border:'1px solid var(--border2)',borderRadius:4,color:'var(--text2)',cursor:'pointer' }}>✓ Resolve</button>
      </div>
    </div>
  );
}

function RecentSessions() {
  const { data, loading } = useApi('/sessions?limit=5');
  const sessions = data?.sessions || [];
  return (
    <div className="card">
      <div className="card-header"><span className="card-title">Recent Sessions</span><a href="/api/export/sessions.csv" style={{ fontSize:10,color:'var(--blue)',textDecoration:'none' }}>⬇ Export</a></div>
      {loading ? <Skeleton h={120}/> : (
        <div style={{ display:'flex',flexDirection:'column',gap:5 }}>
          {sessions.map(s => (
            <div key={s.id} style={{ display:'flex',alignItems:'center',gap:7,padding:'6px 7px',background:'var(--bg3)',borderRadius:6 }}>
              <div style={{ width:7,height:7,borderRadius:'50%',background:s.status==='completed'?'var(--green)':'var(--red)',flexShrink:0 }}/>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontSize:11,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{s.last_page||s.first_page||'/'}</div>
                <div style={{ fontSize:9,color:'var(--text2)' }}>{s.country} · {s.screen_width}×{s.screen_height}</div>
              </div>
              <span className={`badge badge-${s.status==='completed'?'pass':'fail'}`} style={{fontSize:8}}>{s.status==='completed'?'✓':'✗'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InsightsSummary({ stats: s }) {
  const dropRate = s.dropRate||0;
  const passRate = s.totalTests>0?Math.round(((s.totalTests-s.failedTests)/s.totalTests)*100):0;
  const items = [
    { icon:'📉', label:'Drop Rate', value:`${dropRate}%`, color:dropRate>30?'var(--red)':'var(--amber)', pct:dropRate },
    { icon:'😡', label:'Rage Clicks', value:s.rageClicks??0, color:'var(--amber)', pct:Math.min(100,(s.rageClicks||0)/2) },
    { icon:'✅', label:'Pass Rate', value:`${passRate}%`, color:'var(--green)', pct:passRate },
    { icon:'🚨', label:'Open Alerts', value:s.activeAlerts??0, color:s.activeAlerts>0?'var(--red)':'var(--green)', pct:Math.min(100,(s.activeAlerts||0)*20) },
  ];
  return (
    <div className="card">
      <div className="card-header"><span className="card-title">Snapshot</span></div>
      <div style={{ display:'flex',flexDirection:'column',gap:9 }}>
        {items.map(item => (
          <div key={item.label} style={{ display:'flex',alignItems:'center',gap:9 }}>
            <span style={{ fontSize:13,width:20 }}>{item.icon}</span>
            <span style={{ fontSize:11,color:'var(--text2)',width:72,flexShrink:0 }}>{item.label}</span>
            <div style={{ flex:1,height:5,background:'var(--bg4)',borderRadius:3,overflow:'hidden' }}>
              <div style={{ width:`${item.pct}%`,height:'100%',background:item.color,borderRadius:3,transition:'width 0.6s ease' }}/>
            </div>
            <span style={{ fontSize:11,fontFamily:'var(--mono)',fontWeight:600,color:item.color,width:36,textAlign:'right' }}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Skeleton({ h }) { return <div style={{ height:h,background:'var(--bg3)',borderRadius:7 }}/>; }
