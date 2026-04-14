import React, { useState } from 'react';
import { useApi } from '../../hooks/useApi.js';
import ReplayPlayer from './ReplayPlayer.jsx';
import ScreenRecorder from './ScreenRecorder.jsx';

export default function Recordings() {
  const [view, setView] = useState('list'); // 'list' | 'record'
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const { data, loading } = useApi(`/sessions?page=${page}&limit=12${status ? `&status=${status}` : ''}`, [page, status]);
  const detail = useApi(selected ? `/sessions/${selected}` : null, [selected]);

  const sessions = data?.sessions || [];
  const fmt = (s, e) => { if (!s || !e) return '—'; const d = e - s; return d < 60 ? `${d}s` : `${Math.floor(d / 60)}m ${d % 60}s`; };
  const ago = ts => { const s = Math.floor(Date.now() / 1000) - ts; return s < 60 ? `${s}s ago` : s < 3600 ? `${Math.floor(s / 60)}m ago` : s < 86400 ? `${Math.floor(s / 3600)}h ago` : `${Math.floor(s / 86400)}d ago`; };

  const filtered = sessions.filter(s => !search || s.page?.includes(search) || s.country?.toLowerCase().includes(search.toLowerCase()) || s.id?.includes(search));

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
        {[
          { id: 'list', label: '📋 Session Recordings', count: data?.total },
          { id: 'record', label: '🔴 Screen Recorder' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setView(tab.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', border: 'none', fontFamily: 'inherit', background: view === tab.id ? 'rgba(79,142,247,0.12)' : 'transparent', color: view === tab.id ? 'var(--blue)' : 'var(--text2)', transition: 'all 0.12s' }}>
            {tab.label}
            {tab.count != null && <span style={{ fontSize: 10, background: 'var(--bg4)', padding: '1px 6px', borderRadius: 8, fontFamily: 'monospace' }}>{tab.count}</span>}
          </button>
        ))}
      </div>

      {view === 'record' && <ScreenRecorder />}

      {view === 'list' && (
        <>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by page, country, session ID..." style={{ flex: 1, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 12px', color: 'var(--text)', fontSize: 12.5, outline: 'none', fontFamily: 'inherit' }} />
            <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 7, padding: '7px 10px', fontSize: 12, cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}>
              <option value="">All status</option>
              <option value="completed">Completed</option>
              <option value="dropped">Dropped</option>
            </select>
            <a href="/api/export/sessions.csv" className="btn btn-ghost" style={{ fontSize: 11.5, textDecoration: 'none' }}>⬇ Export CSV</a>
          </div>

          {data && (
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { l: 'Total', v: data.total, c: 'var(--blue)' },
                { l: 'Completed', v: sessions.filter(s => s.status === 'completed').length, c: 'var(--green)' },
                { l: 'Dropped', v: sessions.filter(s => s.status === 'dropped').length, c: 'var(--red)' },
                { l: 'Rage Clicks', v: sessions.reduce((a, s) => a + (s.rage_clicks || 0), 0), c: 'var(--amber)' },
              ].map(s => (
                <div key={s.l} style={{ flex: 1, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 9, padding: '9px 12px' }}>
                  <div style={{ fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.l}</div>
                  <div style={{ fontSize: 19, fontWeight: 700, fontFamily: 'monospace', color: s.c }}>{s.v}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
              {loading ? Array.from({ length: 8 }, (_, i) => <div key={i} style={{ height: 52, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8 }} />) : filtered.map(s => (
                <div key={s.id} onClick={() => setSelected(s.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: selected === s.id ? 'rgba(79,142,247,0.07)' : 'var(--bg2)', border: `1px solid ${selected === s.id ? 'rgba(79,142,247,0.3)' : 'var(--border)'}`, borderRadius: 8, cursor: 'pointer', transition: 'all 0.12s' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: s.status === 'completed' ? 'var(--green)' : 'var(--red)', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.last_page || s.first_page || '/'}</div>
                    <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 1 }}>{s.id.slice(0, 16)} · {s.country} · {ago(s.start_time)} · {fmt(s.start_time, s.end_time)}</div>
                  </div>
                  {s.rage_clicks > 0 && <span style={{ fontSize: 9, color: 'var(--red)', background: 'rgba(239,68,68,0.12)', padding: '1px 6px', borderRadius: 8 }}>😡 {s.rage_clicks}</span>}
                  <span className={`badge badge-${s.status === 'completed' ? 'pass' : 'fail'}`}>{s.status === 'completed' ? 'Pass' : 'Drop'}</span>
                </div>
              ))}
              {data?.pages > 1 && (
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 6 }}>
                  <button className="btn btn-ghost" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ fontSize: 11, padding: '4px 10px' }}>← Prev</button>
                  <span style={{ fontSize: 11, color: 'var(--text2)', padding: '4px 10px' }}>{page} / {data.pages}</span>
                  <button className="btn btn-ghost" onClick={() => setPage(p => p + 1)} disabled={page >= data.pages} style={{ fontSize: 11, padding: '4px 10px' }}>Next →</button>
                </div>
              )}
            </div>

            {selected && (
              <div style={{ width: 295, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Session</span>
                    <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 14, cursor: 'pointer' }}>✕</button>
                  </div>
                  {detail.loading ? <div style={{ height: 120, background: 'var(--bg3)', borderRadius: 7 }} /> : detail.data && <SessionDetail session={detail.data} />}
                </div>
                <div className="card">
                  <div className="card-header"><span className="card-title">▶ Replay</span><span style={{ fontSize: 9, color: 'var(--blue)', background: 'var(--blue-dim)', padding: '1px 6px', borderRadius: 4, fontFamily: 'monospace' }}>animated</span></div>
                  <ReplayPlayer session={detail.data} />
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function SessionDetail({ session }) {
  const pages = session.pageViews || [];
  const events = session.events || [];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {[['Duration', session.duration ? `${session.duration}s` : '—'], ['Pages', pages.length], ['Clicks', events.filter(e => e.type === 'click').length], ['Rage', events.filter(e => e.type === 'rage_click').length]].map(([l, v]) => (
          <div key={l} style={{ background: 'var(--bg3)', borderRadius: 6, padding: '7px 9px' }}>
            <div style={{ fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase' }}>{l}</div>
            <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'monospace' }}>{v}</div>
          </div>
        ))}
      </div>
      <div>
        {pages.slice(0, 4).map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--bg4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: 'var(--text3)', flexShrink: 0 }}>{i + 1}</div>
            <div style={{ flex: 1, fontSize: 10.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.url}</div>
            <span style={{ fontSize: 9, color: 'var(--text3)' }}>{p.duration}s</span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 10.5, color: 'var(--text2)', display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div><span style={{ color: 'var(--text3)' }}>Country:</span> {session.country}</div>
        <div><span style={{ color: 'var(--text3)' }}>Screen:</span> {session.screen_width}×{session.screen_height}</div>
      </div>
    </div>
  );
}
