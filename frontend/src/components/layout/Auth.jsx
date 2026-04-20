import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import styles from './Auth.module.css';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Support ?token= URL param for cross-app redirect login (e.g. from demo-site admin button)
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    if (urlToken) {
      // Remove the token param from the URL immediately (avoid it being bookmarked)
      const clean = window.location.pathname;
      history.replaceState({}, '', clean);
      localStorage.setItem('ft_token', urlToken);
    }

    const token = urlToken || localStorage.getItem('ft_token');
    if (token) {
      const base = (import.meta.env.VITE_API_URL || 'https://flowtest-production.up.railway.app') + '/api';
      fetch(`${base}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data?.user) setUser(data.user); })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  function login(token, userData) {
    localStorage.setItem('ft_token', token);
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('ft_token');
    setUser(null);
    const siteUrl = import.meta.env.VITE_SITE_URL || 'https://flowshopp.netlify.app';
    window.location.href = siteUrl;
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }

const BRAND = {
  name: 'QualityFlow',
  initials: 'QF',
  tagline: 'Ship code that actually works.',
  sub: 'Record real sessions → auto-generate Playwright tests → get AI-powered drop-off insights. Catch bugs before your users do.',
  features: ['🎥 Screen recording', '🧪 Auto-generate tests', '🧠 AI insights', '🚨 Live alerts'],
};

const API = (import.meta.env.VITE_API_URL || 'https://flowtest-production.up.railway.app') + '/api';

const AVATAR_COLORS = ['#4f8ef7', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444'];
const AVATAR_INITIALS = ['YN', 'DL', 'RM', 'SB', 'AK'];

export function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const nodesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      nodesRef.current = Array.from({ length: 45 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        r: Math.random() * 1.8 + 0.8,
        phase: Math.random() * Math.PI * 2,
      }));
    };
    resize();
    window.addEventListener('resize', resize);

    function tick() {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      const nodes = nodesRef.current;

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 140) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(79,142,247,${(1 - d / 140) * 0.15})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }

      nodes.forEach(n => {
        n.phase += 0.018;
        const alpha = 0.35 + Math.sin(n.phase) * 0.25;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(79,142,247,${alpha})`;
        ctx.fill();
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
      });

      animRef.current = requestAnimationFrame(tick);
    }
    tick();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const endpoint = mode === 'login' ? `${API}/auth/login` : `${API}/auth/register`;
      const body = mode === 'login'
        ? { email: form.email, password: form.password }
        : { email: form.email, password: form.password, name: form.name };
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Something went wrong'); return; }
      onLogin(data.token, data.user);
    } catch {
      setError('Cannot connect to backend. Check your network or try again.');
    } finally { setLoading(false); }
  }

  async function handleDemo() {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/auth/demo`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      onLogin(data.token, data.user);
    } catch { setError('Cannot connect to backend.'); }
    finally { setLoading(false); }
  }

  return (
    <div className={styles.page}>
      {/* LEFT HERO */}
      <div className={styles.leftPanel}>
        <canvas ref={canvasRef} className={styles.canvas} />
        <div className={styles.gridBg} />
        <div className={styles.orb1} />
        <div className={styles.orb2} />

        <div className={styles.heroContent}>
          {/* Logo */}
          <div className={styles.logoRow}>
            <div className={styles.logoMark}>{BRAND.initials}</div>
            <span className={styles.logoName}>{BRAND.name}</span>
            <span className={styles.logoVersion}>v1.1</span>
          </div>

          <h1 className={styles.heroTitle}>
            {BRAND.tagline.split(' ').slice(0, -1).join(' ')}{' '}
            <span className={styles.heroGradient}>
              {BRAND.tagline.split(' ').slice(-1)[0]}
            </span>
          </h1>

          <p className={styles.heroSub}>{BRAND.sub}</p>

          <div className={styles.featureList}>
            {BRAND.features.map((f, i) => (
              <div key={f} className={styles.featureChip} style={{ animation: `fadeUp 0.5s ease ${0.1 + i * 0.07}s both` }}>{f}</div>
            ))}
          </div>

          {/* Social proof */}
          <div className={styles.socialProof}>
            <div className={styles.avatarStack}>
              {AVATAR_COLORS.map((c, i) => (
                <div key={i} className={styles.avatar} style={{ background: c, marginLeft: i > 0 ? -10 : 0, zIndex: 5 - i }}>
                  {AVATAR_INITIALS[i]}
                </div>
              ))}
            </div>
            <div>
              <div className={styles.socialTitle}>4,200+ engineering teams</div>
              <div className={styles.socialSub}>trust {BRAND.name} in production · ★★★★★</div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT FORM */}
      <div className={styles.rightPanel}>
        <div className={styles.formWrap}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>
              {mode === 'login' ? 'Welcome back' : 'Get started free'}
            </h2>
            <p className={styles.formSub}>
              {mode === 'login' ? `Sign in to your ${BRAND.name} workspace` : '14-day trial · No credit card required'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.formFields}>
            {mode === 'register' && (
              <FormField label="Full name" type="text" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} placeholder="Yoni Natan" />
            )}
            <FormField label="Email address" type="email" value={form.email} onChange={v => setForm(p => ({ ...p, email: v }))} placeholder="you@company.io" />
            <FormField label="Password" type="password" value={form.password} onChange={v => setForm(p => ({ ...p, password: v }))} placeholder="••••••••" />

            {error && <div className={styles.errorBox}>{error}</div>}

            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? '...' : mode === 'login' ? `Sign in to ${BRAND.name} →` : 'Create free account →'}
            </button>
          </form>

          <div className={styles.divider}>
            <div className={styles.dividerLine} />
            <span className={styles.dividerText}>or try instantly</span>
            <div className={styles.dividerLine} />
          </div>

          <button onClick={handleDemo} disabled={loading} className={styles.demoBtn}>
            ⚡ Demo account — see everything live
          </button>

          <p className={styles.formFooter}>
            {mode === 'login'
              ? <><span>No account? </span><span onClick={() => { setMode('register'); setError(''); }} className={styles.formFooterLink}>Start free trial</span></>
              : <><span>Have an account? </span><span onClick={() => { setMode('login'); setError(''); }} className={styles.formFooterLink}>Sign in</span></>
            }
          </p>
          <p className={styles.hint}>demo@flowtest.io / demo123</p>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, type, value, onChange, placeholder }) {
  return (
    <div>
      <label className={styles.fieldLabel}>{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        required
        onChange={e => onChange(e.target.value)}
        className={styles.fieldInput}
      />
    </div>
  );
}
