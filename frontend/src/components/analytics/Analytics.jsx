import React, { useState } from 'react';
import { useApi } from '../../hooks/useApi.js';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

const PIE_COLORS = ['#4f8ef7', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4'];

export default function Analytics() {
  const [heatmapPage, setHeatmapPage] = useState('/checkout');
  const heatmap = useApi(`/analytics/heatmap?page=${encodeURIComponent(heatmapPage)}`, [heatmapPage]);
  const devices  = useApi('/analytics/devices');
  const funnel   = useApi('/analytics/funnel-detail');

  const heatData  = heatmap.data || {};
  const devData   = devices.data || {};
  const funnelData = funnel.data || [];

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Top row: devices + countries + browsers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <ChartCard title="Device Breakdown" loading={devices.loading}>
          {devData.devices?.length > 0 && (
            <>
              <ResponsiveContainer width="100%" height={100}>
                <PieChart>
                  <Pie data={devData.devices} dataKey="sessions" nameKey="device" cx="50%" cy="50%" outerRadius={44} innerRadius={24}>
                    {devData.devices.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 7, fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
                {devData.devices.map((d, i) => (
                  <div key={d.device} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: PIE_COLORS[i], flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 11 }}>{d.device}</span>
                    <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text2)' }}>{d.sessions}</span>
                    <span style={{ fontSize: 10, color: 'var(--red)' }}>{d.sessions > 0 ? Math.round(d.dropped/d.sessions*100) : 0}% drop</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </ChartCard>

        <ChartCard title="Top Countries" loading={devices.loading}>
          {devData.countries?.length > 0 && (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={devData.countries} layout="vertical" margin={{ left: 0 }}>
                <XAxis type="number" tick={{ fontSize: 9, fill: 'var(--text3)' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="country" tick={{ fontSize: 10, fill: 'var(--text)' }} axisLine={false} tickLine={false} width={28} />
                <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 7, fontSize: 11 }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="sessions" fill="var(--blue)" radius={[0, 3, 3, 0]} opacity={0.7} />
                <Bar dataKey="dropped" fill="var(--red)" radius={[0, 3, 3, 0]} opacity={0.6} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Browser Share" loading={devices.loading}>
          {devData.browsers?.length > 0 && (
            <>
              <ResponsiveContainer width="100%" height={100}>
                <PieChart>
                  <Pie data={devData.browsers} dataKey="sessions" nameKey="browser" cx="50%" cy="50%" outerRadius={44} innerRadius={24}>
                    {devData.browsers.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 7, fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
                {devData.browsers.map((b, i) => (
                  <div key={b.browser} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: PIE_COLORS[i], flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 11 }}>{b.browser}</span>
                    <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text2)' }}>{b.sessions}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </ChartCard>
      </div>

      {/* Heatmap */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">🔥 Click Heatmap</span>
          <select value={heatmapPage} onChange={e => setHeatmapPage(e.target.value)} style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', color: 'var(--text)', borderRadius: 6, padding: '3px 8px', fontSize: 11, cursor: 'pointer', outline: 'none' }}>
            {(heatData.pages || []).map(p => (
              <option key={p.page} value={p.page}>{p.page} ({p.clicks} clicks)</option>
            ))}
          </select>
        </div>
        <Heatmap clicks={heatData.clicks || []} page={heatmapPage} loading={heatmap.loading} />
      </div>

      {/* Funnel detail */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">📊 Funnel Deep Dive</span>
          <span style={{ fontSize: 10, color: 'var(--text3)' }}>All pages · real session data</span>
        </div>
        {funnel.loading ? <Skeleton h={120} /> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Page', 'Sessions', 'Dropped', 'Drop Rate', 'Avg Time', 'Rage Clicks', 'Score'].map(h => (
                    <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {funnelData.map((row, i) => {
                  const score = Math.max(0, 100 - row.dropRate - Math.min(row.rageClicks * 2, 30));
                  return (
                    <tr key={row.page} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '8px 10px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--blue)' }}>{row.page}</td>
                      <td style={{ padding: '8px 10px', fontFamily: 'var(--mono)' }}>{row.total}</td>
                      <td style={{ padding: '8px 10px', color: row.dropped > 0 ? 'var(--red)' : 'var(--text2)', fontFamily: 'var(--mono)' }}>{row.dropped}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <div style={{ width: 50, height: 5, background: 'var(--bg4)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${row.dropRate}%`, height: '100%', background: row.dropRate > 40 ? 'var(--red)' : row.dropRate > 20 ? 'var(--amber)' : 'var(--green)', borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: row.dropRate > 40 ? 'var(--red)' : row.dropRate > 20 ? 'var(--amber)' : 'var(--green)' }}>{row.dropRate}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '8px 10px', fontFamily: 'var(--mono)', color: row.avgDuration > 60 ? 'var(--amber)' : 'var(--text2)' }}>{row.avgDuration}s</td>
                      <td style={{ padding: '8px 10px' }}>
                        {row.rageClicks > 0 ? <span style={{ color: 'var(--red)', fontFamily: 'var(--mono)' }}>×{row.rageClicks}</span> : <span style={{ color: 'var(--text3)' }}>—</span>}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <ScoreBadge score={score} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreBadge({ score }) {
  const color = score >= 75 ? 'var(--green)' : score >= 50 ? 'var(--amber)' : 'var(--red)';
  const bg = score >= 75 ? 'var(--green-dim)' : score >= 50 ? 'var(--amber-dim)' : 'var(--red-dim)';
  return (
    <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'var(--mono)', color, background: bg, padding: '2px 8px', borderRadius: 10 }}>
      {score}/100
    </span>
  );
}

function Heatmap({ clicks, page, loading }) {
  if (loading) return <Skeleton h={200} />;

  // Build 20-col × 14-row grid
  const COLS = 20, ROWS = 14;
  const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  const rageGrid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

  const maxCount = clicks.reduce((m, c) => Math.max(m, c.count), 1);

  clicks.forEach(c => {
    const col = Math.min(COLS - 1, Math.floor((c.x || 0) / 96));
    const row = Math.min(ROWS - 1, Math.floor((c.y || 0) / 54));
    if (c.type === 'rage_click') rageGrid[row][col] += c.count;
    else grid[row][col] += c.count;
  });

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 10, fontSize: 11 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: 2, background: 'rgba(79,142,247,0.7)' }} />
          <span style={{ color: 'var(--text2)' }}>Clicks</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: 2, background: 'rgba(239,68,68,0.8)' }} />
          <span style={{ color: 'var(--text2)' }}>Rage clicks</span>
        </div>
        <span style={{ color: 'var(--text3)', marginLeft: 'auto' }}>{page} · {clicks.length} click zones</span>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${COLS}, 1fr)`,
        gap: 2,
        background: 'var(--bg3)',
        borderRadius: 8,
        padding: 8,
        border: '1px solid var(--border)'
      }}>
        {Array.from({ length: ROWS }).map((_, row) =>
          Array.from({ length: COLS }).map((_, col) => {
            const val = grid[row][col];
            const rage = rageGrid[row][col];
            const intensity = Math.min(1, (val + rage) / maxCount);
            const isRage = rage > 0;
            return (
              <div
                key={`${row}-${col}`}
                title={val + rage > 0 ? `${val} clicks${rage > 0 ? `, ${rage} rage` : ''}` : ''}
                style={{
                  height: 14,
                  borderRadius: 2,
                  background: isRage
                    ? `rgba(239,68,68,${0.2 + intensity * 0.7})`
                    : intensity > 0
                    ? `rgba(79,142,247,${0.15 + intensity * 0.75})`
                    : 'rgba(255,255,255,0.03)',
                  transition: 'background 0.2s',
                  cursor: val + rage > 0 ? 'pointer' : 'default'
                }}
              />
            );
          })
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 10, color: 'var(--text3)' }}>
        <span>Low</span>
        {[0.1, 0.3, 0.5, 0.7, 0.9].map(v => (
          <div key={v} style={{ width: 18, height: 8, borderRadius: 2, background: `rgba(79,142,247,${v})` }} />
        ))}
        <span>High</span>
      </div>
    </div>
  );
}

function ChartCard({ title, loading, children }) {
  return (
    <div className="card">
      <div className="card-header"><span className="card-title">{title}</span></div>
      {loading ? <Skeleton h={160} /> : children}
    </div>
  );
}

function Skeleton({ h }) {
  return <div style={{ height: h, background: 'var(--bg3)', borderRadius: 7 }} />;
}
