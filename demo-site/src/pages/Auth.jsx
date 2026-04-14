import React, { useState } from 'react';
import { navigate, useShopAuth } from '../App.jsx';

const API = 'http://localhost:3001/api';

export default function Auth({ mode = 'login' }) {
  const { shopLogin } = useShopAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [err, setErr]   = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const body = mode === 'login'
        ? { email: form.email, password: form.password }
        : { email: form.email, password: form.password, name: form.name };
      const res  = await fetch(`${API}${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || 'Something went wrong'); return; }
      shopLogin(data.user);
      navigate('/');
    } catch { setErr('Cannot connect — is the backend running on port 3001?'); }
    finally  { setLoading(false); }
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'linear-gradient(135deg,#f5f6ff 0%,#eef0ff 100%)' }}>
      <div style={{ width: '100%', maxWidth: 440 }}>

        {/* Card */}
        <div style={{ background: '#fff', border: '1px solid #e8eaf0', borderRadius: 22, padding: '44px 38px', boxShadow: '0 8px 40px rgba(99,102,241,0.1)' }}>

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ width: 54, height: 54, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 15, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 18, marginBottom: 18, boxShadow: '0 4px 20px rgba(99,102,241,0.35)' }}>SF</div>
            <h2 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 7px', letterSpacing: '-0.6px', color: '#0c0c1d' }}>
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h2>
            <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
              {mode === 'login' ? 'Sign in to your ShopFlow account' : 'Start shopping in seconds'}
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {mode === 'register' && (
              <Field label="Full name" name="name" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} placeholder="Yoni Cohen" />
            )}
            <Field label="Email address" type="email" name="email" value={form.email} onChange={v => setForm(p => ({ ...p, email: v }))} placeholder="you@shopflow.io" />
            <Field label="Password" type="password" name="password" value={form.password} onChange={v => setForm(p => ({ ...p, password: v }))} placeholder="••••••••" />

            {err && (
              <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '11px 14px', fontSize: 13, color: '#ef4444', lineHeight: 1.5, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>⚠️</span> {err}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ background: loading ? '#a5b4fc' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', letterSpacing: '-0.2px', marginTop: 4, boxShadow: loading ? 'none' : '0 4px 18px rgba(99,102,241,0.35)', transition: 'all 0.2s' }}>
              {loading ? '...' : mode === 'login' ? 'Sign in →' : 'Create account →'}
            </button>
          </form>

          {mode === 'login' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
                <div style={{ flex: 1, height: 1, background: '#f0f0f0' }} />
                <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>or</span>
                <div style={{ flex: 1, height: 1, background: '#f0f0f0' }} />
              </div>
              <button onClick={async () => {
                setLoading(true);
                try {
                  const r = await fetch(`${API}/auth/demo`, { method: 'POST' });
                  const d = await r.json();
                  if (d.user) { shopLogin(d.user); navigate('/'); }
                } catch {}
                setLoading(false);
              }} style={{ width: '100%', background: '#f8f9ff', color: '#374151', border: '1.5px solid #e8eaf0', borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.color = '#6366f1'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e8eaf0'; e.currentTarget.style.color = '#374151'; }}>
                ⚡ Try demo account
              </button>
              <p style={{ textAlign: 'center', fontSize: 11.5, color: '#9ca3af', margin: '10px 0 0' }}>demo@shopflow.io / demo123</p>
            </>
          )}

          <p style={{ textAlign: 'center', marginTop: 22, fontSize: 13, color: '#6b7280' }}>
            {mode === 'login'
              ? <><span>No account? </span><span onClick={() => navigate('/register')} style={{ color: '#6366f1', cursor: 'pointer', fontWeight: 700 }}>Register free →</span></>
              : <><span>Have an account? </span><span onClick={() => navigate('/login')} style={{ color: '#6366f1', cursor: 'pointer', fontWeight: 700 }}>Sign in →</span></>
            }
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, type = 'text', name, value, onChange, placeholder }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ fontSize: 12.5, color: '#374151', display: 'block', marginBottom: 6, fontWeight: 600, letterSpacing: '-0.1px' }}>{label}</label>
      <input type={type} name={name} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ width: '100%', background: focused ? 'rgba(99,102,241,0.03)' : '#f8f9ff', border: `1.5px solid ${focused ? '#6366f1' : '#e8eaf0'}`, borderRadius: 10, padding: '11px 14px', color: '#0c0c1d', fontSize: 14, outline: 'none', fontFamily: 'inherit', transition: 'all 0.2s', boxSizing: 'border-box', boxShadow: focused ? '0 0 0 4px rgba(99,102,241,0.1)' : 'none' }} />
    </div>
  );
}
