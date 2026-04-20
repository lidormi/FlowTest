import React, { useState } from 'react';
import { useApi } from '../../hooks/useApi.js';
import styles from './Scheduler.module.css';

const API = (import.meta.env.VITE_API_URL || 'https://flowtest-production.up.railway.app') + '/api';

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
      const res = await fetch(`${API}/schedules`, {
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
    await fetch(`${API}/schedules/${testId}`, { method: 'DELETE' });
    refetch();
  }

  return (
    <div className={`${styles.page} fade-in`}>

      {/* Add schedule */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Add Schedule</div>
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className={styles.formGrid}>
            <div>
              <label className={styles.formLabel}>Test</label>
              <select value={form.testId} onChange={e => setForm(p => ({ ...p, testId: e.target.value }))} required className={styles.formSelect}>
                <option value="">— Select test —</option>
                {tests.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className={styles.formLabel}>Schedule</label>
              <select value={form.cronExpr} onChange={e => setForm(p => ({ ...p, cronExpr: e.target.value }))} required className={styles.formSelect}>
                <option value="">— Select frequency —</option>
                {presets.map(p => <option key={p.expr} value={p.expr}>{p.label}</option>)}
              </select>
            </div>
          </div>
          {form.cronExpr && (
            <div className={styles.cronPreview}>
              cron: <span className={styles.cronPreviewVal}>{form.cronExpr}</span>
            </div>
          )}
          {msg && <div className={msg.startsWith('✓') ? styles.msgSuccess : styles.msgError}>{msg}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'Saving...' : '+ Add Schedule'}</button>
          </div>
        </form>
      </div>

      {/* Active schedules */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Active Schedules</div>
        {loading ? <div className={styles.skeleton} /> : (
          <>
            {schedules.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📅</div>
                No schedules yet — add one above
              </div>
            ) : (
              <div className={styles.scheduleList}>
                {schedules.map(s => {
                  const test = tests.find(t => t.id === s.test_id);
                  return (
                    <div key={s.id} className={styles.scheduleRow}>
                      <div className={styles.liveDot} />
                      <div className={styles.scheduleInfo}>
                        <div className={styles.scheduleName}>{test?.name || s.test_id}</div>
                        <div className={styles.scheduleMeta}>
                          <span className={styles.scheduleExpr}>{s.cron_expr}</span>
                          {' · '}{s.label}
                          {s.last_triggered && <span className={styles.scheduleTime}> · Last ran {new Date(s.last_triggered * 1000).toLocaleTimeString()}</span>}
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
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Cron Reference</div>
        <div className={styles.presetGrid}>
          {presets.map(p => (
            <div key={p.expr} onClick={() => setForm(f => ({ ...f, cronExpr: p.expr }))} className={styles.presetItem}>
              <span className={styles.presetLabel}>{p.label}</span>
              <code className={styles.presetExpr}>{p.expr}</code>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
