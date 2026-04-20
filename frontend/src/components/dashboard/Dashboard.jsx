import React, { useState } from 'react';
import { useApi, resolveAlert } from '../../hooks/useApi.js';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import LiveFeed from './LiveFeed.jsx';
import styles from './Dashboard.module.css';

function StatCard({ label, value, change, color, up }) {
  return (
    <div className={styles.statCard} style={{ borderTop: `2px solid ${color}` }}>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue} style={{ color }}>
        {value ?? <span className={styles.statValueEmpty}>—</span>}
      </div>
      {change && (
        <div className={styles.statChange} style={{ color: up ? 'var(--green)' : 'var(--red)' }}>
          {change}
        </div>
      )}
    </div>
  );
}

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:7, padding:'8px 12px' }}>
      <div style={{ fontSize:10, color:'var(--text2)', marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:12, color:'var(--blue)' }}>Total: {payload[0]?.value}</div>
      <div style={{ fontSize:12, color:'var(--red)' }}>Dropped: {payload[1]?.value}</div>
    </div>
  );
};

export default function Dashboard({ onAlertChange, liveEvents }) {
  const stats  = useApi('/dashboard/stats');
  const chart  = useApi('/dashboard/chart');
  const alerts = useApi('/dashboard/alerts');
  const [chartType, setChartType] = useState('bar');

  async function handleResolve(id) {
    await resolveAlert(id);
    alerts.refetch(); stats.refetch(); onAlertChange?.();
  }

  const s         = stats.data || {};
  const chartData = (chart.data || []).map(d => ({ ...d, date: d.date?.split(',')[0] }));
  const alertList = alerts.data || [];

  return (
    <div className={`${styles.page} fade-in`}>
      <div className={styles.statsRow}>
        <StatCard label="Total Tests"  value={s.totalTests}  color="var(--blue)"  change="↑ 12% this week" up />
        <StatCard label="Failed Tests" value={s.failedTests} color="var(--red)"   change={s.failedTests > 0 ? 'needs attention' : '✓ all passing'} up={s.failedTests === 0} />
        <StatCard label="Drop Rate"    value={s.dropRate != null ? `${s.dropRate}%` : null} color="var(--amber)" change={`${s.droppedSessions ?? 0} dropped`} up={false} />
        <StatCard label="Rage Clicks"  value={s.rageClicks}  color="var(--green)" change={`${s.totalSessions ?? 0} total sessions`} up />
      </div>

      <div className={styles.midRow}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Sessions — 14 days</span>
            <div className={styles.chartControls}>
              {['bar','line'].map(t => (
                <button
                  key={t}
                  onClick={() => setChartType(t)}
                  className={`${styles.chartTypeBtn} ${chartType === t ? styles.chartTypeBtnActive : styles.chartTypeBtnInactive}`}
                >
                  {t}
                </button>
              ))}
              <a href="/api/export/sessions.csv" className={styles.csvLink}>⬇ CSV</a>
            </div>
          </div>
          {chart.loading ? <div className={styles.skeleton} style={{ height: 140 }} /> : (
            <ResponsiveContainer width="100%" height={140}>
              {chartType === 'bar' ? (
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
          <div className={styles.chartLegend}>
            {[['rgba(79,142,247,0.5)','Total sessions'],['rgba(239,68,68,0.5)','Dropped']].map(([bg,lbl]) => (
              <div key={lbl} className={styles.legendItem}>
                <div className={styles.legendDot} style={{ background: bg }}/>{lbl}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">🚨 Active Alerts</span>
            {alertList.length > 0 && <span className="badge badge-fail">{alertList.length}</span>}
          </div>
          {alerts.loading ? <div className={styles.skeleton} style={{ height: 140 }} /> : (
            <div className={styles.sessionsList}>
              {alertList.length === 0 && (
                <div className={styles.noAlerts}>
                  <div className={styles.noAlertsIcon}>✓</div>
                  No active alerts
                </div>
              )}
              {alertList.slice(0, 4).map(a => (
                <AlertItem key={a.id} alert={a} onResolve={() => handleResolve(a.id)} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.bottomRow}>
        <RecentSessions />
        <InsightsSummary stats={s} />
        <div className="card">
          <div className="card-header">
            <span className="card-title">📡 Live Feed</span>
            <div className={styles.liveIndicator}>
              <div className={styles.liveDot} /> Live
            </div>
          </div>
          <LiveFeed events={liveEvents || []} />
        </div>
      </div>
    </div>
  );
}

function AlertItem({ alert, onResolve }) {
  const icons  = { critical:'🔴', high:'🟡', medium:'🔵', low:'⚪' };
  const colors = { critical:'var(--red)', high:'var(--amber)', medium:'var(--blue)', low:'var(--text3)' };
  const timeAgo = ts => { const s=Math.floor(Date.now()/1000)-ts; return s<60?`${s}s`:s<3600?`${Math.floor(s/60)}m`:`${Math.floor(s/3600)}h`; };
  const borderColor = colors[alert.severity] || 'var(--text3)';

  return (
    <div className={styles.alertItem} style={{ borderLeftColor: borderColor }}>
      <span className={styles.alertIcon}>{icons[alert.severity] || '⚪'}</span>
      <div className={styles.alertBody}>
        <div className={styles.alertTitle}>{alert.title}</div>
        <div className={styles.alertDesc}>{alert.description?.slice(0, 50)}</div>
      </div>
      <div className={styles.alertMeta}>
        <span className={styles.alertTime}>{timeAgo(alert.created_at)}</span>
        <button onClick={onResolve} className={styles.resolveBtn}>✓ Resolve</button>
      </div>
    </div>
  );
}

function RecentSessions() {
  const { data, loading } = useApi('/sessions?limit=5');
  const sessions = data?.sessions || [];
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Recent Sessions</span>
        <a href="/api/export/sessions.csv" className={styles.exportLink}>⬇ Export</a>
      </div>
      {loading ? <div className={styles.skeleton} style={{ height: 120 }} /> : (
        <div className={styles.sessionsList}>
          {sessions.map(s => (
            <div key={s.id} className={styles.sessionRow}>
              <div
                className={styles.sessionDot}
                style={{ background: s.status === 'completed' ? 'var(--green)' : 'var(--red)' }}
              />
              <div className={styles.sessionInfo}>
                <div className={styles.sessionPage}>{s.last_page || s.first_page || '/'}</div>
                <div className={styles.sessionMeta}>{s.country} · {s.screen_width}×{s.screen_height}</div>
              </div>
              <span className={`badge badge-${s.status === 'completed' ? 'pass' : 'fail'}`} style={{fontSize:8}}>
                {s.status === 'completed' ? '✓' : '✗'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InsightsSummary({ stats: s }) {
  const dropRate = s.dropRate || 0;
  const passRate = s.totalTests > 0 ? Math.round(((s.totalTests - s.failedTests) / s.totalTests) * 100) : 0;
  const items = [
    { icon:'📉', label:'Drop Rate',   value:`${dropRate}%`,         color:dropRate>30?'var(--red)':'var(--amber)', pct:dropRate },
    { icon:'😡', label:'Rage Clicks', value:s.rageClicks ?? 0,      color:'var(--amber)', pct:Math.min(100,(s.rageClicks||0)/2) },
    { icon:'✅', label:'Pass Rate',   value:`${passRate}%`,          color:'var(--green)', pct:passRate },
    { icon:'🚨', label:'Open Alerts', value:s.activeAlerts ?? 0,    color:s.activeAlerts>0?'var(--red)':'var(--green)', pct:Math.min(100,(s.activeAlerts||0)*20) },
  ];
  return (
    <div className="card">
      <div className="card-header"><span className="card-title">Snapshot</span></div>
      <div className={styles.snapshotList}>
        {items.map(item => (
          <div key={item.label} className={styles.snapshotRow}>
            <span className={styles.snapshotIcon}>{item.icon}</span>
            <span className={styles.snapshotLabel}>{item.label}</span>
            <div className={styles.snapshotBar}>
              <div className={styles.snapshotBarFill} style={{ width:`${item.pct}%`, background:item.color }} />
            </div>
            <span className={styles.snapshotValue} style={{ color:item.color }}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
