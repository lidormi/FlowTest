import React, { useState, useEffect, useRef } from 'react';
import { navigate } from '../App.jsx';

const API = (import.meta.env.VITE_API_URL || 'https://flowtest-production.up.railway.app') + '/api';
const DASHBOARD_URL = import.meta.env.VITE_DASHBOARD_URL || '';

export default function Navbar({ cartCount, user, onLogout }) {
  const [scrolled, setScrolled]   = useState(false);
  const [prevCount, setPrevCount] = useState(cartCount);
  const [cartAnim, setCartAnim]   = useState(false);
  const [search, setSearch]       = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminForm, setAdminForm] = useState({ email: '', password: '' });
  const [adminErr, setAdminErr]   = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile]   = useState(window.innerWidth < 768);
  const searchRef = useRef(null);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const isHome = window.location.hash === '#/' || window.location.hash === '#' || window.location.hash === '' || window.location.pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (cartCount > prevCount) { setCartAnim(true); setTimeout(() => setCartAnim(false), 500); }
    setPrevCount(cartCount);
  }, [cartCount]);

  // Close search on outside click
  useEffect(() => {
    if (!searchOpen) return;
    const handler = e => { if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [searchOpen]);

  const light = (!isHome || scrolled);
  const textColor = light ? '#374151' : 'rgba(255,255,255,0.8)';

  function handleSearch(e) {
    e.preventDefault();
    if (search.trim()) {
      navigate('/products?q=' + encodeURIComponent(search.trim()));
      setSearch('');
      setSearchOpen(false);
    }
  }

  async function handleAdminLogin(e) {
    e.preventDefault();
    setAdminErr(''); setAdminLoading(true);
    try {
      const res  = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(adminForm) });
      const data = await res.json();
      if (!res.ok) { setAdminErr(data.error || 'Invalid credentials'); return; }
      const dest = DASHBOARD_URL
        ? `${DASHBOARD_URL}?token=${encodeURIComponent(data.token)}`
        : null;
      if (dest) { window.location.href = dest; setAdminOpen(false); }
      else { setAdminErr('Dashboard URL not configured — set VITE_DASHBOARD_URL in .env'); }
    } catch { setAdminErr('Cannot connect to backend.'); }
    finally   { setAdminLoading(false); }
  }

  return (
    <>
    <nav style={{
      position:'fixed',top:0,left:0,right:0,zIndex:1000,
      background: light ? 'rgba(255,255,255,0.97)' : 'transparent',
      backdropFilter: light ? 'blur(20px)' : 'none',
      boxShadow: light ? '0 2px 24px rgba(0,0,0,0.07)' : 'none',
      borderBottom: light ? '1px solid rgba(0,0,0,0.055)' : 'none',
      transition:'background 0.35s,box-shadow 0.35s',
    }}>
      {/* Main bar */}
      <div style={{ display:'flex',alignItems:'center',padding:'0 18px',height:64,gap:12 }}>

        {/* Logo */}
        <button onClick={()=>{ navigate('/'); setMobileMenuOpen(false); }}
          style={{ background:'none',border:'none',display:'flex',alignItems:'center',gap:10,cursor:'pointer',fontFamily:'inherit',padding:0,flexShrink:0 }}>
          <div style={{ width:34,height:34,borderRadius:10,background:'linear-gradient(135deg,#6366f1,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:900,fontSize:13,boxShadow:light?'0 2px 10px rgba(99,102,241,0.35)':'none',transition:'box-shadow 0.3s' }}>SF</div>
          <span style={{ fontSize:19,fontWeight:900,letterSpacing:'-0.5px',color:light?'#0c0c1d':'#fff',transition:'color 0.3s' }}>ShopFlow</span>
        </button>

        {/* Nav links — desktop only */}
        {!isMobile && <div style={{ display:'flex',gap:2 }}>
          {[['/', 'Home'], ['/products', 'Products']].map(([path, label]) => (
            <button key={path} onClick={()=>navigate(path)}
              style={{ background:'none',border:'none',padding:'7px 13px',borderRadius:9,fontSize:14,fontWeight:600,color:textColor,cursor:'pointer',fontFamily:'inherit',transition:'all 0.2s' }}
              onMouseEnter={e=>{ e.currentTarget.style.background=light?'rgba(99,102,241,0.08)':'rgba(255,255,255,0.1)'; e.currentTarget.style.color=light?'#6366f1':'#fff'; }}
              onMouseLeave={e=>{ e.currentTarget.style.background='none'; e.currentTarget.style.color=textColor; }}>
              {label}
            </button>
          ))}
        </div>}

        {/* Search bar — desktop only */}
        {!isMobile && <div ref={searchRef} style={{ flex:1,maxWidth:400,position:'relative' }}>
          <form onSubmit={handleSearch} style={{ display:'flex',borderRadius:10,overflow:'hidden',border:`1px solid ${light?'#e5e7eb':'rgba(255,255,255,0.18)'}`,background:light?'#f9fafb':'rgba(255,255,255,0.1)',transition:'all 0.2s',boxShadow:searchOpen?'0 0 0 3px rgba(99,102,241,0.15)':'none' }}>
            <input
              value={search}
              onChange={e=>setSearch(e.target.value)}
              onFocus={()=>setSearchOpen(true)}
              placeholder="Search products..."
              style={{ flex:1,padding:'9px 14px',fontSize:13,border:'none',outline:'none',fontFamily:'inherit',background:'transparent',color:'#0c0c1d' }}
            />
            <button type="submit" style={{ padding:'9px 14px',background:'none',border:'none',cursor:'pointer',color:light?'#9ca3af':'rgba(255,255,255,0.5)',fontSize:15,display:'flex',alignItems:'center',transition:'color 0.2s' }}
              onMouseEnter={e=>e.currentTarget.style.color='#6366f1'}
              onMouseLeave={e=>e.currentTarget.style.color=light?'#9ca3af':'rgba(255,255,255,0.5)'}>
              🔍
            </button>
          </form>
          {searchOpen && search.length === 0 && (
            <div style={{ position:'absolute',top:'calc(100% + 8px)',left:0,right:0,background:'#fff',borderRadius:12,boxShadow:'0 8px 32px rgba(0,0,0,0.12)',border:'1px solid #e8eaf0',overflow:'hidden',zIndex:100 }}>
              <div style={{ padding:'10px 14px 6px',fontSize:11,fontWeight:700,color:'#9ca3af',textTransform:'uppercase',letterSpacing:'1px' }}>Popular searches</div>
              {['Headphones','Office chair','Hoodie','Dog treats','Mechanical keyboard'].map(term=>(
                <button key={term} onClick={()=>{ navigate('/products?q=' + encodeURIComponent(term)); setSearch(''); setSearchOpen(false); }}
                  style={{ display:'flex',alignItems:'center',gap:10,width:'100%',padding:'9px 14px',border:'none',background:'none',cursor:'pointer',fontFamily:'inherit',fontSize:13,color:'#374151',textAlign:'left',transition:'background 0.15s' }}
                  onMouseEnter={e=>e.currentTarget.style.background='#f5f5ff'}
                  onMouseLeave={e=>e.currentTarget.style.background='none'}>
                  <span style={{ color:'#9ca3af',fontSize:14 }}>🔍</span>{term}
                </button>
              ))}
            </div>
          )}
        </div>}

        {/* Spacer on mobile */}
        {isMobile && <div style={{ flex:1 }} />}

        {/* Right side — desktop */}
        {!isMobile && <div style={{ display:'flex',alignItems:'center',gap:10 }}>
          {/* Cart */}
          <button onClick={()=>navigate('/cart')} data-testid="cart-btn"
            style={{ position:'relative',borderRadius:11,background:light?'transparent':'rgba(255,255,255,0.1)',border:`1px solid ${light?'#e5e7eb':'rgba(255,255,255,0.2)'}`,padding:'9px 16px',cursor:'pointer',display:'flex',alignItems:'center',gap:7,fontSize:13,fontWeight:700,color:light?'#374151':'#fff',fontFamily:'inherit',transition:'all 0.25s' }}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor='#6366f1'; e.currentTarget.style.color='#6366f1'; }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor=light?'#e5e7eb':'rgba(255,255,255,0.2)'; e.currentTarget.style.color=light?'#374151':'#fff'; }}>
            🛒 Cart
            {cartCount > 0 && (
              <span data-testid="cart-count" className={cartAnim?'cart-badge-bounce':''}
                style={{ position:'absolute',top:-9,right:-9,background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',borderRadius:'50%',width:20,height:20,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:900,boxShadow:'0 2px 8px rgba(99,102,241,0.45)',border:'2px solid #fff' }}>
                {cartCount}
              </span>
            )}
          </button>
          {/* Admin */}
          <button onClick={() => { setAdminOpen(true); setAdminErr(''); setAdminForm({ email: '', password: '' }); }}
            style={{ background:'none', border:`1px solid ${light?'rgba(99,102,241,0.25)':'rgba(255,255,255,0.15)'}`, borderRadius:10, padding:'8px 14px', cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:700, color:light?'#6366f1':'rgba(255,255,255,0.6)', fontFamily:'inherit', transition:'all 0.2s', letterSpacing:'-0.1px' }}
            onMouseEnter={e=>{ e.currentTarget.style.background='rgba(99,102,241,0.09)'; e.currentTarget.style.borderColor='#6366f1'; e.currentTarget.style.color='#6366f1'; }}
            onMouseLeave={e=>{ e.currentTarget.style.background='none'; e.currentTarget.style.borderColor=light?'rgba(99,102,241,0.25)':'rgba(255,255,255,0.15)'; e.currentTarget.style.color=light?'#6366f1':'rgba(255,255,255,0.6)'; }}>
            ⚙️ Admin
          </button>
          {/* User */}
          {user ? (
            <div style={{ display:'flex',alignItems:'center',gap:9 }}>
              <div style={{ width:35,height:35,borderRadius:'50%',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:13,fontWeight:900,boxShadow:'0 2px 8px rgba(99,102,241,0.3)',flexShrink:0 }}>
                {user.name?.[0]?.toUpperCase()||'?'}
              </div>
              <span data-testid="welcome-msg" style={{ fontSize:13,color:light?'#374151':'rgba(255,255,255,0.85)',fontWeight:600 }}>
                {user.name?.split(' ')[0]}
              </span>
              <button onClick={onLogout}
                style={{ fontSize:12,color:light?'#9ca3af':'rgba(255,255,255,0.45)',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',transition:'color 0.2s' }}
                onMouseEnter={e=>e.currentTarget.style.color='#ef4444'}
                onMouseLeave={e=>e.currentTarget.style.color=light?'#9ca3af':'rgba(255,255,255,0.45)'}>
                Sign out
              </button>
            </div>
          ) : (
            <button onClick={()=>navigate('/login')}
              style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',border:'none',borderRadius:11,padding:'10px 22px',fontSize:13,fontWeight:800,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 2px 14px rgba(99,102,241,0.38)',letterSpacing:'-0.2px',transition:'transform 0.2s,box-shadow 0.2s' }}
              onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(99,102,241,0.45)'; }}
              onMouseLeave={e=>{ e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 2px 14px rgba(99,102,241,0.38)'; }}>
              Sign in
            </button>
          )}
        </div>}

        {/* Mobile right: cart icon + hamburger */}
        {isMobile && <div style={{ display:'flex',alignItems:'center',gap:8 }}>
          <button onClick={()=>navigate('/cart')} data-testid="cart-btn"
            style={{ position:'relative',background:'none',border:'none',cursor:'pointer',fontSize:22,padding:'4px',color:light?'#374151':'#fff' }}>
            🛒
            {cartCount > 0 && (
              <span data-testid="cart-count" className={cartAnim?'cart-badge-bounce':''}
                style={{ position:'absolute',top:-4,right:-4,background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',borderRadius:'50%',width:18,height:18,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:900,border:'2px solid #fff' }}>
                {cartCount}
              </span>
            )}
          </button>
          <button onClick={()=>setMobileMenuOpen(o=>!o)}
            style={{ background:'none',border:'none',cursor:'pointer',fontSize:24,color:light?'#374151':'#fff',padding:'4px',lineHeight:1 }}>
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>}
      </div>

      {/* Mobile drawer */}
      {isMobile && mobileMenuOpen && (
        <div style={{ background:light?'rgba(255,255,255,0.98)':'rgba(15,15,30,0.97)',borderTop:`1px solid ${light?'#e5e7eb':'rgba(255,255,255,0.1)'}`,padding:'16px 18px 24px',display:'flex',flexDirection:'column',gap:10 }}>
          {/* Search */}
          <form onSubmit={e=>{ handleSearch(e); setMobileMenuOpen(false); }} style={{ display:'flex',borderRadius:10,overflow:'hidden',border:'1px solid #e5e7eb',background:'#f9fafb' }}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search products..."
              style={{ flex:1,padding:'11px 14px',fontSize:14,border:'none',outline:'none',fontFamily:'inherit',background:'transparent',color:'#0c0c1d' }} />
            <button type="submit" style={{ padding:'11px 14px',background:'none',border:'none',cursor:'pointer',fontSize:16 }}>🔍</button>
          </form>
          {/* Nav links */}
          {[['/', '🏠 Home'], ['/products', '🛍️ Products']].map(([path, label]) => (
            <button key={path} onClick={()=>{ navigate(path); setMobileMenuOpen(false); }}
              style={{ background:'none',border:'none',padding:'13px 4px',fontSize:15,fontWeight:600,color:light?'#374151':'rgba(255,255,255,0.85)',cursor:'pointer',fontFamily:'inherit',textAlign:'left',borderBottom:`1px solid ${light?'#f3f4f6':'rgba(255,255,255,0.07)'}` }}>
              {label}
            </button>
          ))}
          {/* Admin */}
          <button onClick={()=>{ setAdminOpen(true); setAdminErr(''); setAdminForm({ email:'',password:'' }); setMobileMenuOpen(false); }}
            style={{ background:'rgba(99,102,241,0.07)',border:'1.5px solid rgba(99,102,241,0.25)',borderRadius:11,padding:'13px',fontSize:14,fontWeight:700,color:'#6366f1',cursor:'pointer',fontFamily:'inherit',textAlign:'left' }}>
            ⚙️ Admin dashboard
          </button>
          {/* User */}
          {user ? (
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 4px' }}>
              <span style={{ fontSize:14,fontWeight:600,color:light?'#374151':'rgba(255,255,255,0.85)' }}>👤 {user.name?.split(' ')[0]}</span>
              <button onClick={()=>{ onLogout(); setMobileMenuOpen(false); }}
                style={{ fontSize:13,fontWeight:700,color:'#ef4444',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit' }}>
                Sign out
              </button>
            </div>
          ) : (
            <button onClick={()=>{ navigate('/login'); setMobileMenuOpen(false); }}
              style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',border:'none',borderRadius:11,padding:'13px',fontSize:14,fontWeight:800,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 2px 14px rgba(99,102,241,0.38)' }}>
              Sign in
            </button>
          )}
        </div>
      )}
    </nav>

    {/* ── Admin login modal ─────────────────────────────────────── */}
    {adminOpen && (
      <div onClick={() => setAdminOpen(false)} style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:20, padding:'40px 44px', width:380, boxShadow:'0 24px 80px rgba(0,0,0,0.18)', fontFamily:'inherit', position:'relative' }}>

          {/* Close */}
          <button onClick={() => setAdminOpen(false)} style={{ position:'absolute', top:16, right:16, background:'#f3f4f6', border:'none', borderRadius:8, width:32, height:32, cursor:'pointer', fontSize:16, color:'#9ca3af', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>

          {/* Header */}
          <div style={{ marginBottom:28 }}>
            <div style={{ width:42, height:42, borderRadius:12, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, marginBottom:16, boxShadow:'0 4px 16px rgba(99,102,241,0.3)' }}>⚙️</div>
            <h3 style={{ margin:'0 0 6px', fontSize:20, fontWeight:900, color:'#0c0c1d', letterSpacing:'-0.5px' }}>Admin access</h3>
            <p style={{ margin:0, fontSize:13, color:'#6b7280' }}>Sign in to the FlowTest analytics dashboard</p>
          </div>

          {/* Form */}
          <form onSubmit={handleAdminLogin} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:6 }}>Email</label>
              <input type="email" value={adminForm.email} onChange={e => setAdminForm(p => ({ ...p, email: e.target.value }))} placeholder="admin@example.com" required
                style={{ width:'100%', border:'1.5px solid #e5e7eb', borderRadius:10, padding:'11px 13px', fontSize:13.5, color:'#111', outline:'none', fontFamily:'inherit', boxSizing:'border-box', transition:'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor='#6366f1'} onBlur={e => e.target.style.borderColor='#e5e7eb'} />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:6 }}>Password</label>
              <input type="password" value={adminForm.password} onChange={e => setAdminForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" required
                style={{ width:'100%', border:'1.5px solid #e5e7eb', borderRadius:10, padding:'11px 13px', fontSize:13.5, color:'#111', outline:'none', fontFamily:'inherit', boxSizing:'border-box', transition:'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor='#6366f1'} onBlur={e => e.target.style.borderColor='#e5e7eb'} />
            </div>

            {adminErr && (
              <div style={{ background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.18)', borderRadius:9, padding:'10px 13px', fontSize:12.5, color:'#ef4444', display:'flex', alignItems:'center', gap:7 }}>
                ⚠️ {adminErr}
              </div>
            )}

            <button type="submit" disabled={adminLoading}
              style={{ background: adminLoading ? '#a5b4fc' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', border:'none', borderRadius:11, padding:'13px', fontSize:14, fontWeight:800, cursor: adminLoading ? 'not-allowed' : 'pointer', fontFamily:'inherit', boxShadow: adminLoading ? 'none' : '0 4px 16px rgba(99,102,241,0.35)', transition:'all 0.2s', marginTop:4 }}>
              {adminLoading ? '⏳ Signing in...' : 'Open dashboard →'}
            </button>

            {/* Divider */}
            <div style={{ display:'flex', alignItems:'center', gap:10, margin:'4px 0 0' }}>
              <div style={{ flex:1, height:1, background:'#f0f0f0' }} />
              <span style={{ fontSize:11, color:'#9ca3af', fontWeight:500 }}>or</span>
              <div style={{ flex:1, height:1, background:'#f0f0f0' }} />
            </div>

            {/* Demo button — fills credentials AND submits */}
            <button type="button" disabled={adminLoading}
              onClick={async () => {
                const creds = { email:'demo@flowtest.io', password:'demo123' };
                setAdminForm(creds);
                setAdminErr(''); setAdminLoading(true);
                try {
                  const res  = await fetch(`${API}/auth/login`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(creds) });
                  const data = await res.json();
                  if (!res.ok) { setAdminErr(data.error || 'Login failed'); return; }
                  const dest = DASHBOARD_URL ? `${DASHBOARD_URL}?token=${encodeURIComponent(data.token)}` : null;
                  if (dest) { window.location.href = dest; setAdminOpen(false); }
                  else { setAdminErr('Set VITE_DASHBOARD_URL in .env with your deployed dashboard URL'); }
                } catch { setAdminErr('Cannot connect to backend.'); }
                finally   { setAdminLoading(false); }
              }}
              style={{ background:'#f8f9ff', color:'#6366f1', border:'1.5px solid #e8eaf0', borderRadius:11, padding:'11px', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s' }}
              onMouseEnter={e=>{ e.currentTarget.style.borderColor='#6366f1'; e.currentTarget.style.background='rgba(99,102,241,0.06)'; }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor='#e8eaf0'; e.currentTarget.style.background='#f8f9ff'; }}>
              {adminLoading ? '⏳ Signing in...' : '⚡ Demo account → open dashboard'}
            </button>
          </form>
        </div>
      </div>
    )}
    </>
  );
}
