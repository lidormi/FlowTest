import React, { useState } from 'react';
import { useApi } from '../../hooks/useApi.js';
import ReplayPlayer from './ReplayPlayer.jsx';
import ScreenRecorder from './ScreenRecorder.jsx';
import styles from './Recordings.module.css';

export default function Recordings() {
  const [view, setView]       = useState('list');
  const [page, setPage]       = useState(1);
  const [status, setStatus]   = useState('');
  const [search, setSearch]   = useState('');
  const [selected, setSelected] = useState(null);

  const { data, loading } = useApi(`/sessions?page=${page}&limit=12${status ? `&status=${status}` : ''}`, [page, status]);
  const detail = useApi(selected ? `/sessions/${selected}` : null, [selected]);

  const sessions = data?.sessions || [];
  const fmt = (s, e) => { if (!s || !e) return '—'; const d = e - s; return d < 60 ? `${d}s` : `${Math.floor(d/60)}m ${d%60}s`; };
  const ago = ts => { const s=Math.floor(Date.now()/1000)-ts; return s<60?`${s}s ago`:s<3600?`${Math.floor(s/60)}m ago`:s<86400?`${Math.floor(s/3600)}h ago`:`${Math.floor(s/86400)}d ago`; };

  const filtered = sessions.filter(s =>
    !search || s.page?.includes(search) || s.country?.toLowerCase().includes(search.toLowerCase()) || s.id?.includes(search)
  );

  return (
    <div className={`${styles.page} fade-in`}>
      {/* Tab bar */}
      <div className={styles.tabBar}>
        {[
          { id:'list',   label:'📋 Session Recordings', count: data?.total },
          { id:'record', label:'🔴 Screen Recorder' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            className={`${styles.tab} ${view === tab.id ? styles.tabActive : styles.tabInactive}`}
          >
            {tab.label}
            {tab.count != null && <span className={styles.tabCount}>{tab.count}</span>}
          </button>
        ))}
      </div>

      {view === 'record' && <ScreenRecorder />}

      {view === 'list' && (
        <>
          <div className={styles.filters}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by page, country, session ID..."
              className={styles.searchInput}
            />
            <select
              value={status}
              onChange={e => { setStatus(e.target.value); setPage(1); }}
              className={styles.statusSelect}
            >
              <option value="">All status</option>
              <option value="completed">Completed</option>
              <option value="dropped">Dropped</option>
            </select>
            <a href="/api/export/sessions.csv" className="btn btn-ghost" style={{ fontSize: 11.5, textDecoration: 'none' }}>⬇ Export CSV</a>
          </div>

          {data && (
            <div className={styles.statsRow}>
              {[
                { l:'Total',       v:data.total,                                              c:'var(--blue)' },
                { l:'Completed',   v:sessions.filter(s=>s.status==='completed').length,       c:'var(--green)' },
                { l:'Dropped',     v:sessions.filter(s=>s.status==='dropped').length,         c:'var(--red)' },
                { l:'Rage Clicks', v:sessions.reduce((a,s)=>a+(s.rage_clicks||0),0),          c:'var(--amber)' },
              ].map(s => (
                <div key={s.l} className={styles.statCard}>
                  <div className={styles.statLabel}>{s.l}</div>
                  <div className={styles.statValue} style={{ color: s.c }}>{s.v}</div>
                </div>
              ))}
            </div>
          )}

          <div className={styles.mainLayout}>
            <div className={styles.sessionList}>
              {loading
                ? Array.from({ length: 8 }, (_, i) => (
                    <div key={i} className={styles.sessionSkeleton} style={{ height: 52 }} />
                  ))
                : filtered.map(s => (
                    <div
                      key={s.id}
                      onClick={() => setSelected(s.id)}
                      className={`${styles.sessionRow} ${selected === s.id ? styles.sessionRowSelected : ''}`}
                    >
                      <div className={styles.sessionDot} style={{ background: s.status === 'completed' ? 'var(--green)' : 'var(--red)' }} />
                      <div className={styles.sessionInfo}>
                        <div className={styles.sessionPage}>{s.last_page || s.first_page || '/'}</div>
                        <div className={styles.sessionMeta}>{s.id.slice(0,16)} · {s.country} · {ago(s.start_time)} · {fmt(s.start_time, s.end_time)}</div>
                      </div>
                      {s.rage_clicks > 0 && <span className={styles.rageBadge}>😡 {s.rage_clicks}</span>}
                      <span className={`badge badge-${s.status === 'completed' ? 'pass' : 'fail'}`}>
                        {s.status === 'completed' ? 'Pass' : 'Drop'}
                      </span>
                    </div>
                  ))
              }
              {data?.pages > 1 && (
                <div className={styles.pagination}>
                  <button className="btn btn-ghost" onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} style={{ fontSize:11, padding:'4px 10px' }}>← Prev</button>
                  <span className={styles.pageInfo}>{page} / {data.pages}</span>
                  <button className="btn btn-ghost" onClick={() => setPage(p => p+1)} disabled={page>=data.pages} style={{ fontSize:11, padding:'4px 10px' }}>Next →</button>
                </div>
              )}
            </div>

            {selected && (
              <div className={styles.detailPanel}>
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Session</span>
                    <button onClick={() => setSelected(null)} className={styles.closeBtn}>✕</button>
                  </div>
                  {detail.loading
                    ? <div className={styles.skeleton} style={{ height: 120 }} />
                    : detail.data && <SessionDetail session={detail.data} />
                  }
                </div>
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">▶ Replay</span>
                    <span className={styles.replayBadge}>animated</span>
                  </div>
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
  const pages  = session.pageViews || [];
  const events = session.events   || [];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      <div className={styles.detailGrid}>
        {[
          ['Duration', session.duration ? `${session.duration}s` : '—'],
          ['Pages',    pages.length],
          ['Clicks',   events.filter(e=>e.type==='click').length],
          ['Rage',     events.filter(e=>e.type==='rage_click').length],
        ].map(([l,v]) => (
          <div key={l} className={styles.detailStat}>
            <div className={styles.detailStatLabel}>{l}</div>
            <div className={styles.detailStatVal}>{v}</div>
          </div>
        ))}
      </div>
      <div>
        {pages.slice(0,4).map((p,i) => (
          <div key={i} className={styles.pageViewRow}>
            <div className={styles.pageViewNum}>{i+1}</div>
            <div className={styles.pageViewUrl}>{p.url}</div>
            <span className={styles.pageViewDur}>{p.duration}s</span>
          </div>
        ))}
      </div>
      <div className={styles.detailMeta}>
        <div><span className={styles.detailMetaLabel}>Country:</span> {session.country}</div>
        <div><span className={styles.detailMetaLabel}>Screen:</span> {session.screen_width}×{session.screen_height}</div>
      </div>
    </div>
  );
}
