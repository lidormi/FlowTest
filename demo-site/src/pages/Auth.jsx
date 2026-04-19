import React, { useState } from 'react';
import { navigate, useShopAuth } from '../App.jsx';
import styles from './Auth.module.css';

const API = (import.meta.env.VITE_API_URL || 'https://flowtest-production.up.railway.app') + '/api';

export default function Auth({ mode = 'login' }) {
  const { shopLogin } = useShopAuth();
  const [form, setForm]       = useState({ name: '', email: '', password: '' });
  const [err, setErr]         = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

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
    } catch { setErr('Cannot connect to backend. Check your network or try again.'); }
    finally { setLoading(false); }
  }

  async function handleDemo() {
    setErr(''); setLoading(true);
    try {
      const r = await fetch(`${API}/auth/demo`, { method: 'POST' });
      const d = await r.json();
      if (!r.ok) { setErr(d.error || 'Demo login failed'); return; }
      if (d.user) { shopLogin(d.user); navigate('/'); }
    } catch { setErr('Cannot connect to backend.'); }
    finally { setLoading(false); }
  }

  return (
    <div className={styles.page}>

      {/* Left panel */}
      <div className={styles.leftPanel}>
        <img
          src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1400&q=85"
          alt="Shopping"
          className={styles.heroImage}
        />
        <div className={styles.overlay} />
        <div className={styles.tint} />

        <div className={styles.leftTop}>
          <div className={styles.brand}>
            <div className={styles.brandIcon}>SF</div>
            <span className={styles.brandName}>ShopFlow</span>
          </div>
        </div>

        <div className={styles.leftBottom}>
          <div className={styles.quoteIcon}>"</div>
          <h2 className={styles.quoteText}>
            Your next great<br />purchase starts here.
          </h2>
          <p className={styles.quoteSubtext}>
            Premium gear for creators. Free shipping over $50.<br />
            30-day returns, no questions asked.
          </p>
          <div className={styles.stats}>
            {[
              { val: '50K+', label: 'Happy customers' },
              { val: '4.9★', label: 'Average rating' },
              { val: '30d',  label: 'Free returns' },
            ].map(s => (
              <div key={s.label} className={styles.statItem}>
                <div className={styles.statVal}>{s.val}</div>
                <div className={styles.statLabel}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className={styles.rightPanel}>
        <button className={styles.backBtn} onClick={() => navigate('/')}>← Back</button>

        <div className={styles.formWrap}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>
              {mode === 'login' ? 'Welcome back 👋' : 'Create account'}
            </h2>
            <p className={styles.formSubtitle}>
              {mode === 'login' ? 'Enter your details to sign in' : 'Join 50,000+ shoppers today'}
            </p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            {mode === 'register' && (
              <Field
                label="Full name"
                name="name"
                value={form.name}
                onChange={v => setForm(p => ({ ...p, name: v.replace(/[0-9]/g, '') }))}
                placeholder="Yoni Cohen"
                styles={styles}
              />
            )}
            <Field
              label="Email address"
              type="email"
              name="email"
              value={form.email}
              onChange={v => setForm(p => ({ ...p, email: v }))}
              placeholder="you@example.com"
              styles={styles}
            />

            <div>
              <label className={styles.fieldLabel}>Password</label>
              <div className={styles.passwordWrap}>
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••"
                  required
                  className={`${styles.fieldInput} ${styles.passwordInput}`}
                />
                <button type="button" className={styles.showPassBtn} onClick={() => setShowPass(!showPass)}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {err && (
              <div className={styles.errorBox}>
                <span>⚠️</span>{err}
              </div>
            )}

            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? '⏳  Please wait...' : mode === 'login' ? 'Sign in →' : 'Create account →'}
            </button>
          </form>

          {mode === 'login' && (
            <>
              <div className={styles.divider}>
                <div className={styles.dividerLine} />
                <span className={styles.dividerText}>or continue with</span>
                <div className={styles.dividerLine} />
              </div>
              <button onClick={handleDemo} className={styles.demoBtn}>
                <span style={{ fontSize: 16 }}>⚡</span> Try demo account
              </button>
              <p className={styles.demoHint}>demo@shopflow.io · demo123</p>
            </>
          )}

          <p className={styles.switchLink}>
            {mode === 'login' ? (
              <>Don't have an account?{' '}
                <span className={styles.switchLinkAction} onClick={() => navigate('/register')}>Sign up free →</span>
              </>
            ) : (
              <>Already have an account?{' '}
                <span className={styles.switchLinkAction} onClick={() => navigate('/login')}>Sign in →</span>
              </>
            )}
          </p>

          <div className={styles.secureNote}>
            <span>🔒</span><span>Secured with 256-bit SSL encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, type = 'text', name, value, onChange, placeholder, styles }) {
  return (
    <div>
      <label className={styles.fieldLabel}>{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required
        className={styles.fieldInput}
      />
    </div>
  );
}
