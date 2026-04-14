import React, { useState } from 'react';
import { useApi } from '../../hooks/useApi.js';

export default function Scheduler() {
  const { data, loading, refetch } = useApi('/schedules');
  const [form, setForm] = useState({ testId: '', cronExpr: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const schedules = data?.schedules || [];
  const tests = data?.tests || [];
  const presets = data?.presets || [];

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.testId || !form.cronExpr) return;
    setSaving(true); setMsg('');
    try {
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const d = await res.json();
      if (!res.ok) { setMsg(`Error: ${d.error}`); return; }
      setMsg('✓ Schedule created');
      setForm({ testId: '', cronExpr: '' });
      refetch();
    } catch (e) { setMsg('Connection error'); }
    finally { setSaving(false); }
  }

  async function handleDelete(testId) {
    await fetch(`/api/schedules/${testId}`, { method: 'DELETE' });
    refetch();
  }

  return (
    <div className="fade-in" style={{ maxWidth: 740, display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Add schedule */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 12 }}>Add Schedule</div>
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text2)', display: 'block', marginBottom: 5 }}>Test</label>
              <select value={form.testId} onChange={e => setForm(p => ({ ...p, testId: e.target.value }))} required style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border2)', color: 'var(--text)', borderRadius: 7, padding: '8px 10px', fontSize: 12, cursor: 'pointer', outline: 'none', fontFamily: 'var(--font)' }}>
                <option value="">— Select test —</option>
                {tests.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text2)', display: 'block', marginBottom: 5 }}>Schedule</label>
              <select value={form.cronExpr} onChange={e => setForm(p => ({ ...p, cronExpr: e.target.value }))} required style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border2)', color: 'var(--text)', borderRadius: 7, padding: '8px 10px', fontSize: 12, cursor: 'pointer', outline: 'none', fontFamily: 'var(--font)' }}>
                <option value="">— Select frequency —</option>
                {presets.map(p => <option key={p.expr} value={p.expr}>{p.label}</option>)}
              </select>
            </div>
          </div>
          {form.cronExpr && (
            <div style={{ fontSize: 11, color: 'var(--text2)', fontFamily: 'var(--mono)', background: 'var(--bg3)', padding: '6px 10px', borderRadius: 6 }}>
              cron: <span style={{ color: 'var(--blue)' }}>{form.cronExpr}</span>
            </div>
          )}
          {msg && <div style={{ fontSize: 12, color: msg.startsWith('✓') ? 'var(--green)' : 'var(--red)' }}>{msg}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'Saving...' : '+ Add Schedule'}</button>
          </div>
        </form>
      </div>

      {/* Active schedules */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 12 }}>Active Schedules</div>
        {loading ? <div style={{ height: 60, background: 'var(--bg3)', borderRadius: 7 }} /> : (
          <>
            {schedules.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text3)', fontSize: 12 }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>📅</div>
                No schedules yet — add one above
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {schedules.map(s => {
                  const test = tests.find(t => t.id === s.test_id);
                  return (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 6px var(--green)', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 500 }}>{test?.name || s.test_id}</div>
                        <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 1 }}>
                          <span style={{ fontFamily: 'var(--mono)', color: 'var(--blue)' }}>{s.cron_expr}</span>
                          {' · '}{s.label}
                          {s.last_triggered && <span style={{ color: 'var(--text3)' }}> · Last ran {new Date(s.last_triggered * 1000).toLocaleTimeString()}</span>}
                        </div>
                      </div>
                      <span className={`badge badge-${test?.status || 'idle'}`}>{test?.status || 'idle'}</span>
                      <button onClick={() => handleDelete(s.test_id)} className="btn btn-ghost" style={{ fontSize: 10, padding: '4px 10px', color: 'var(--red)' }}>Remove</button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Cron reference */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 10 }}>Cron Reference</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {presets.map(p => (
            <div key={p.expr} onClick={() => setForm(f => ({ ...f, cronExpr: p.expr }))} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', background: 'var(--bg3)', borderRadius: 7, cursor: 'pointer', transition: 'background 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg4)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--bg3)'}>
              <span style={{ fontSize: 11, color: 'var(--text2)' }}>{p.label}</span>
              <code style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--blue)' }}>{p.expr}</code>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
