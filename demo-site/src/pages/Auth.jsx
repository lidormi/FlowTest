import React, { useState } from 'react';
import { navigate, useShopAuth } from '../App.jsx';

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
      const res  = await fetch(`${API}${endpoint}`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || 'Something went wrong'); return; }
      shopLogin(data.user);
      navigate('/');
    } catch { setErr('Cannot connect to backend. Check your network or try again.'); }
    finally  { setLoading(false); }
  }

  async function handleDemo() {
    setErr(''); setLoading(true);
    try {
      const r = await fetch(`${API}/auth/demo`, { method:'POST' });
      const d = await r.json();
      if (!r.ok) { setErr(d.error || 'Demo login failed'); return; }
      if (d.user) { shopLogin(d.user); navigate('/'); }
    } catch { setErr('Cannot connect to backend.'); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ display:'flex', minHeight:'100vh', fontFamily:'inherit' }}>

      {/* ══════════════════════════════════════
          LEFT — full-bleed image + Ken Burns
      ══════════════════════════════════════ */}
      <div style={{
        flex:'0 0 55%', position:'relative', overflow:'hidden',
        display:'flex', flexDirection:'column',
      }}>
        {/* The image — Ken Burns slow zoom + pan */}
        <img
          src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1400&q=85"
          alt="Shopping"
          style={{
            position:'absolute', inset:0,
            width:'100%', height:'100%',
            objectFit:'cover', objectPosition:'center 30%',
            animation:'kenBurns 18s ease-in-out infinite alternate',
            willChange:'transform',
          }}
        />

        {/* Dark gradient overlay — heavier at bottom for text readability */}
        <div style={{
          position:'absolute', inset:0,
          background:'linear-gradient(to bottom, rgba(5,5,26,0.35) 0%, rgba(5,5,26,0.15) 35%, rgba(5,5,26,0.55) 65%, rgba(5,5,26,0.92) 100%)',
        }} />

        {/* Subtle colour tint */}
        <div style={{
          position:'absolute', inset:0,
          background:'linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(139,92,246,0.1) 100%)',
          mixBlendMode:'multiply',
        }} />


        {/* ── Top: logo ── */}
        <div style={{ position:'relative', zIndex:2, padding:'32px 48px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:900, fontSize:14, boxShadow:'0 4px 14px rgba(99,102,241,0.45)', flexShrink:0 }}>SF</div>
            <span style={{ fontSize:20, fontWeight:900, letterSpacing:'-0.5px', color:'#fff', textShadow:'0 2px 12px rgba(0,0,0,0.3)' }}>ShopFlow</span>
          </div>
        </div>

        {/* ── Bottom: quote + stats ── */}
        <div style={{ position:'relative', zIndex:2, marginTop:'auto', padding:'0 48px 52px' }}>

          {/* Quote mark */}
          <div style={{ fontSize:72, lineHeight:1, color:'rgba(99,102,241,0.6)', fontFamily:'Georgia,serif', marginBottom:-12 }}>"</div>

          {/* The sentence */}
          <h2 style={{
            fontSize:'clamp(26px,3vw,38px)', fontWeight:900,
            color:'#fff', letterSpacing:'-1px', lineHeight:1.15,
            margin:'0 0 16px', textShadow:'0 2px 20px rgba(0,0,0,0.4)',
          }}>
            Your next great<br />purchase starts here.
          </h2>

          <p style={{ fontSize:15, color:'rgba(255,255,255,0.6)', margin:'0 0 36px', lineHeight:1.65, textShadow:'0 1px 8px rgba(0,0,0,0.3)' }}>
            Premium gear for creators. Free shipping over $50.<br />
            30-day returns, no questions asked.
          </p>

          {/* Stats row */}
          <div style={{ display:'flex', gap:0 }}>
            {[
              { val:'50K+', label:'Happy customers' },
              { val:'4.9★', label:'Average rating' },
              { val:'30d',  label:'Free returns' },
            ].map((s,i)=>(
              <div key={s.label} style={{
                paddingRight:28, marginRight:28,
                borderRight: i<2 ? '1px solid rgba(255,255,255,0.15)' : 'none',
              }}>
                <div style={{ fontSize:20, fontWeight:900, color:'#fff', letterSpacing:'-0.5px', textShadow:'0 2px 8px rgba(0,0,0,0.3)' }}>{s.val}</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', fontWeight:500, marginTop:2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          RIGHT — form
      ══════════════════════════════════════ */}
      <div style={{
        flex:1, background:'#fff',
        display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
        padding:'60px 48px', position:'relative',
      }}>

        {/* Back button */}
        <button onClick={()=>navigate('/')}
          style={{ position:'absolute', top:24, left:24, display:'flex', alignItems:'center', gap:6, background:'none', border:'1px solid #e8eaf0', borderRadius:10, padding:'8px 14px', fontSize:13, color:'#6b7280', cursor:'pointer', fontFamily:'inherit', fontWeight:600, transition:'all 0.2s' }}
          onMouseEnter={e=>{ e.currentTarget.style.borderColor='#6366f1'; e.currentTarget.style.color='#6366f1'; }}
          onMouseLeave={e=>{ e.currentTarget.style.borderColor='#e8eaf0'; e.currentTarget.style.color='#6b7280'; }}>
          ← Back
        </button>

        <div style={{ width:'100%', maxWidth:380 }}>

          {/* Header */}
          <div style={{ marginBottom:36 }}>
            <h2 style={{ fontSize:28, fontWeight:900, margin:'0 0 8px', letterSpacing:'-0.8px', color:'#0c0c1d', lineHeight:1.1 }}>
              {mode==='login' ? 'Welcome back 👋' : 'Create account'}
            </h2>
            <p style={{ fontSize:14, color:'#6b7280', margin:0 }}>
              {mode==='login' ? 'Enter your details to sign in' : 'Join 50,000+ shoppers today'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:18 }}>
            {mode==='register' && (
              <Field label="Full name" name="name" value={form.name}
                onChange={v=>setForm(p=>({...p,name:v.replace(/[0-9]/g,'')}))} placeholder="Yoni Cohen" />
            )}
            <Field label="Email address" type="email" name="email" value={form.email}
              onChange={v=>setForm(p=>({...p,email:v}))} placeholder="you@example.com" />

            {/* Password with show/hide */}
            <div>
              <label style={labelStyle}>Password</label>
              <div style={{ position:'relative' }}>
                <input
                  type={showPass?'text':'password'} name="password"
                  value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))}
                  placeholder="••••••••" required
                  style={{ ...inputStyle, paddingRight:46 }}
                />
                <button type="button" onClick={()=>setShowPass(!showPass)}
                  style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:16, color:'#9ca3af', padding:0, lineHeight:1 }}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {err && (
              <div style={{ background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:10, padding:'11px 14px', fontSize:13, color:'#ef4444', display:'flex', alignItems:'center', gap:8 }}>
                <span>⚠️</span>{err}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ background:loading?'#a5b4fc':'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', border:'none', borderRadius:12, padding:'14px', fontSize:15, fontWeight:800, cursor:loading?'not-allowed':'pointer', fontFamily:'inherit', letterSpacing:'-0.2px', boxShadow:loading?'none':'0 4px 18px rgba(99,102,241,0.35)', transition:'all 0.2s', marginTop:2 }}
              onMouseEnter={e=>{ if(!loading){ e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(99,102,241,0.45)'; }}}
              onMouseLeave={e=>{ e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow=loading?'none':'0 4px 18px rgba(99,102,241,0.35)'; }}>
              {loading ? '⏳  Please wait...' : mode==='login' ? 'Sign in →' : 'Create account →'}
            </button>
          </form>

          {mode==='login' && (
            <>
              <div style={{ display:'flex', alignItems:'center', gap:12, margin:'22px 0' }}>
                <div style={{ flex:1, height:1, background:'#f0f0f0' }} />
                <span style={{ fontSize:12, color:'#9ca3af', fontWeight:500 }}>or continue with</span>
                <div style={{ flex:1, height:1, background:'#f0f0f0' }} />
              </div>
              <button onClick={handleDemo}
                style={{ width:'100%', background:'#f8f9ff', color:'#374151', border:'1.5px solid #e8eaf0', borderRadius:12, padding:'12px', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}
                onMouseEnter={e=>{ e.currentTarget.style.borderColor='#6366f1'; e.currentTarget.style.background='rgba(99,102,241,0.04)'; e.currentTarget.style.color='#6366f1'; }}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor='#e8eaf0'; e.currentTarget.style.background='#f8f9ff'; e.currentTarget.style.color='#374151'; }}>
                <span style={{ fontSize:16 }}>⚡</span> Try demo account
              </button>
              <p style={{ textAlign:'center', fontSize:11.5, color:'#b0b7c3', margin:'10px 0 0' }}>
                demo@shopflow.io · demo123
              </p>
            </>
          )}

          <p style={{ textAlign:'center', marginTop:28, fontSize:13.5, color:'#6b7280' }}>
            {mode==='login'
              ? <><span>Don't have an account? </span><span onClick={()=>navigate('/register')} style={{ color:'#6366f1', cursor:'pointer', fontWeight:800 }}>Sign up free →</span></>
              : <><span>Already have an account? </span><span onClick={()=>navigate('/login')} style={{ color:'#6366f1', cursor:'pointer', fontWeight:800 }}>Sign in →</span></>
            }
          </p>

          <div style={{ marginTop:36, display:'flex', alignItems:'center', justifyContent:'center', gap:6, color:'#c4c8d0', fontSize:12 }}>
            <span>🔒</span><span>Secured with 256-bit SSL encryption</span>
          </div>
        </div>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes kenBurns {
          0%   { transform: scale(1)    translate(0%,    0%);   }
          25%  { transform: scale(1.06) translate(-1.5%, -1%);  }
          50%  { transform: scale(1.1)  translate(0.5%,  -2%);  }
          75%  { transform: scale(1.07) translate(1.5%,  -0.5%);}
          100% { transform: scale(1.03) translate(-0.5%, 1%);   }
        }
      `}</style>
    </div>
  );
}

function Field({ label, type='text', name, value, onChange, placeholder }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input type={type} name={name} value={value} onChange={e=>onChange(e.target.value)}
        placeholder={placeholder} required
        onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
        style={{ ...inputStyle, borderColor:focused?'#6366f1':'#e8eaf0', background:focused?'rgba(99,102,241,0.02)':'#f9fafb', boxShadow:focused?'0 0 0 4px rgba(99,102,241,0.1)':'none' }} />
    </div>
  );
}

const labelStyle = { fontSize:13, color:'#374151', display:'block', marginBottom:7, fontWeight:700, letterSpacing:'-0.1px' };
const inputStyle = { width:'100%', border:'1.5px solid #e8eaf0', borderRadius:11, padding:'12px 14px', color:'#0c0c1d', fontSize:14, outline:'none', fontFamily:'inherit', transition:'all 0.2s', boxSizing:'border-box' };
