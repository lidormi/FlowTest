import React, { useState, useEffect, useRef, createContext, useContext } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('ft_token');
    if (token) {
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
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
      const t = Date.now() / 1000;
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
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = mode === 'login'
        ? { email: form.email, password: form.password }
        : { email: form.email, password: form.password, name: form.name };
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Something went wrong'); return; }
      onLogin(data.token, data.user);
    } catch {
      setError('Cannot connect — is the backend running on port 3001?');
    } finally { setLoading(false); }
  }

  async function handleDemo() {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/demo', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      onLogin(data.token, data.user);
    } catch { setError('Cannot connect to backend.'); }
    finally { setLoading(false); }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: '#06080f',
      fontFamily: "'DM Sans', 'Helvetica Neue', system-ui, sans-serif",
    }}>
      {/* LEFT HERO */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '64px 72px', overflow: 'hidden', minWidth: 0 }}>
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(79,142,247,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(79,142,247,0.03) 1px, transparent 1px)', backgroundSize: '48px 48px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '10%', left: '5%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(79,142,247,0.1) 0%, transparent 65%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 65%)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, animation: 'heroIn 0.8s ease forwards' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 52 }}>
            <div style={{ width: 42, height: 42, borderRadius: 11, background: 'linear-gradient(135deg, #4f8ef7 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: '#fff', fontFamily: 'monospace', boxShadow: '0 0 20px rgba(79,142,247,0.3)' }}>
              {BRAND.initials}
            </div>
            <span style={{ fontSize: 20, fontWeight: 700, color: '#e8eaf0', letterSpacing: '-0.4px' }}>{BRAND.name}</span>
            <span style={{ fontSize: 10, color: '#4f8ef7', background: 'rgba(79,142,247,0.12)', padding: '2px 8px', borderRadius: 4, fontFamily: 'monospace', marginLeft: 2 }}>v1.1</span>
          </div>

          <h1 style={{ fontSize: 58, fontWeight: 800, lineHeight: 1.08, letterSpacing: '-2px', color: '#fff', margin: '0 0 22px', maxWidth: 560 }}>
            {BRAND.tagline.split(' ').slice(0, -1).join(' ')}{' '}
            <span style={{ background: 'linear-gradient(90deg, #4f8ef7, #8b5cf6 50%, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {BRAND.tagline.split(' ').slice(-1)[0]}
            </span>
          </h1>

          <p style={{ fontSize: 16.5, color: '#6b7a94', lineHeight: 1.65, maxWidth: 500, margin: '0 0 42px' }}>
            {BRAND.sub}
          </p>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 52 }}>
            {BRAND.features.map((f, i) => (
              <div key={f} style={{ fontSize: 12.5, color: '#8892a4', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '6px 14px', animation: `fadeUp 0.5s ease ${0.1 + i * 0.07}s both` }}>{f}</div>
            ))}
          </div>

          {/* Social proof */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex' }}>
              {['#4f8ef7', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444'].map((c, i) => (
                <div key={i} style={{ width: 32, height: 32, borderRadius: '50%', background: c, border: '2px solid #06080f', marginLeft: i > 0 ? -10 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff', zIndex: 5 - i }}>
                  {['YN', 'DL', 'RM', 'SB', 'AK'][i]}
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 13.5, color: '#e8eaf0', fontWeight: 600 }}>4,200+ engineering teams</div>
              <div style={{ fontSize: 11.5, color: '#4a5568' }}>trust {BRAND.name} in production · ★★★★★</div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT FORM */}
      <div style={{ width: 440, flexShrink: 0, background: 'rgba(11,13,20,0.97)', borderLeft: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 44px' }}>
        <div style={{ width: '100%' }}>
          <div style={{ marginBottom: 30 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#e8eaf0', letterSpacing: '-0.4px', margin: '0 0 8px' }}>
              {mode === 'login' ? 'Welcome back' : 'Get started free'}
            </h2>
            <p style={{ fontSize: 13.5, color: '#4a5568', margin: 0 }}>
              {mode === 'login' ? `Sign in to your ${BRAND.name} workspace` : '14-day trial · No credit card required'}
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            {mode === 'register' && (
              <FormField label="Full name" type="text" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} placeholder="Yoni Natan" />
            )}
            <FormField label="Email address" type="email" value={form.email} onChange={v => setForm(p => ({ ...p, email: v }))} placeholder="you@company.io" />
            <FormField label="Password" type="password" value={form.password} onChange={v => setForm(p => ({ ...p, password: v }))} placeholder="••••••••" />

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 8, padding: '10px 13px', fontSize: 12.5, color: '#ef4444', lineHeight: 1.5 }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{ background: 'linear-gradient(135deg, #4f8ef7, #6366f1)', color: '#fff', border: 'none', borderRadius: 9, padding: '12px', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.75 : 1, marginTop: 4, letterSpacing: '-0.2px', boxShadow: loading ? 'none' : '0 0 20px rgba(79,142,247,0.25)' }}>
              {loading ? '...' : mode === 'login' ? `Sign in to ${BRAND.name} →` : 'Create free account →'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0' }}>
            <div style={{ flex: 1, height: '0.5px', background: 'rgba(255,255,255,0.07)' }} />
            <span style={{ fontSize: 11, color: '#4a5568', flexShrink: 0 }}>or try instantly</span>
            <div style={{ flex: 1, height: '0.5px', background: 'rgba(255,255,255,0.07)' }} />
          </div>

          <button onClick={handleDemo} disabled={loading} style={{ width: '100%', background: 'rgba(255,255,255,0.04)', color: '#8892a4', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, padding: '11px', fontSize: 13.5, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.target.style.background = 'rgba(255,255,255,0.08)'; e.target.style.color = '#e8eaf0'; }}
            onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.04)'; e.target.style.color = '#8892a4'; }}>
            ⚡ Demo account — see everything live
          </button>

          <p style={{ textAlign: 'center', marginTop: 22, fontSize: 12.5, color: '#4a5568' }}>
            {mode === 'login'
              ? <><span>No account? </span><span onClick={() => { setMode('register'); setError(''); }} style={{ color: '#4f8ef7', cursor: 'pointer', fontWeight: 500 }}>Start free trial</span></>
              : <><span>Have an account? </span><span onClick={() => { setMode('login'); setError(''); }} style={{ color: '#4f8ef7', cursor: 'pointer', fontWeight: 500 }}>Sign in</span></>
            }
          </p>
          <p style={{ textAlign: 'center', fontSize: 11, color: '#2a3044', marginTop: 6 }}>demo@flowtest.io / demo123</p>
        </div>
      </div>

      <style>{`
        @keyframes heroIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:none; } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
      `}</style>
    </div>
  );
}

function FormField({ label, type, value, onChange, placeholder }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ fontSize: 12, color: '#6b7a94', display: 'block', marginBottom: 6, fontWeight: 500, letterSpacing: '0.2px' }}>{label}</label>
      <input
        type={type} value={value} placeholder={placeholder} required
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: '100%', background: focused ? 'rgba(79,142,247,0.07)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${focused ? 'rgba(79,142,247,0.45)' : 'rgba(255,255,255,0.07)'}`,
          borderRadius: 8, padding: '10px 13px', color: '#e8eaf0', fontSize: 13.5,
          outline: 'none', fontFamily: 'inherit', transition: 'all 0.15s',
          boxShadow: focused ? '0 0 0 3px rgba(79,142,247,0.1)' : 'none',
        }}
      />
    </div>
  );
}
