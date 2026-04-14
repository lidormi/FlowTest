import React, { useState, useEffect } from 'react';
import { navigate } from '../App.jsx';

export default function Navbar({ cartCount, user, onLogout }) {
  const [scrolled, setScrolled] = useState(false);
  const [prevCount, setPrevCount] = useState(cartCount);
  const [cartAnim, setCartAnim] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (cartCount > prevCount) {
      setCartAnim(true);
      setTimeout(() => setCartAnim(false), 500);
    }
    setPrevCount(cartCount);
  }, [cartCount]);

  const isHome = location.pathname === '/';

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: 64, zIndex: 1000,
      background: (!isHome || scrolled) ? 'rgba(255,255,255,0.96)' : 'transparent',
      backdropFilter: (!isHome || scrolled) ? 'blur(20px)' : 'none',
      boxShadow: (!isHome || scrolled) ? '0 2px 24px rgba(0,0,0,0.07)' : 'none',
      borderBottom: (!isHome || scrolled) ? '1px solid rgba(0,0,0,0.055)' : 'none',
      display: 'flex', alignItems: 'center', padding: '0 28px', gap: 20,
      transition: 'background 0.35s ease, backdrop-filter 0.35s ease, box-shadow 0.35s ease',
    }}>

      {/* Logo */}
      <button onClick={() => navigate('/')}
        style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontFamily: 'inherit', padding: 0, flexShrink: 0 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 900, fontSize: 13,
          boxShadow: (!isHome || scrolled) ? '0 2px 10px rgba(99,102,241,0.35)' : 'none',
          transition: 'box-shadow 0.3s',
        }}>SF</div>
        <span style={{ fontSize: 19, fontWeight: 900, letterSpacing: '-0.5px', color: (!isHome || scrolled) ? '#0c0c1d' : '#fff', transition: 'color 0.3s' }}>ShopFlow</span>
      </button>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: 2, flex: 1 }}>
        {[['/', 'Home'], ['/products', 'Products']].map(([path, label]) => (
          <button key={path} onClick={() => navigate(path)}
            style={{
              background: 'none', border: 'none', padding: '7px 13px', borderRadius: 9,
              fontSize: 14, fontWeight: 600,
              color: (!isHome || scrolled) ? '#4b5563' : 'rgba(255,255,255,0.75)',
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = (!isHome || scrolled) ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.1)';
              e.currentTarget.style.color = (!isHome || scrolled) ? '#6366f1' : '#fff';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.color = (!isHome || scrolled) ? '#4b5563' : 'rgba(255,255,255,0.75)';
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

        {/* Cart */}
        <button onClick={() => navigate('/cart')} data-testid="cart-btn"
          style={{
            position: 'relative', borderRadius: 11,
            background: (!isHome || scrolled) ? 'transparent' : 'rgba(255,255,255,0.1)',
            border: (!isHome || scrolled) ? '1px solid #e5e7eb' : '1px solid rgba(255,255,255,0.2)',
            padding: '9px 16px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 7,
            fontSize: 13, fontWeight: 700,
            color: (!isHome || scrolled) ? '#374151' : '#fff',
            fontFamily: 'inherit', transition: 'all 0.25s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.color = '#6366f1'; }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = (!isHome || scrolled) ? '#e5e7eb' : 'rgba(255,255,255,0.2)';
            e.currentTarget.style.color = (!isHome || scrolled) ? '#374151' : '#fff';
          }}>
          🛒 Cart
          {cartCount > 0 && (
            <span data-testid="cart-count" className={cartAnim ? 'cart-badge-bounce' : ''}
              style={{ position: 'absolute', top: -9, right: -9, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, boxShadow: '0 2px 8px rgba(99,102,241,0.45)', border: '2px solid #fff' }}>
              {cartCount}
            </span>
          )}
        </button>

        {/* User / Sign in */}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 35, height: 35, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 900, boxShadow: '0 2px 8px rgba(99,102,241,0.3)', flexShrink: 0 }}>
              {user.name?.[0]?.toUpperCase() || '?'}
            </div>
            <span data-testid="welcome-msg" style={{ fontSize: 13, color: (!isHome || scrolled) ? '#374151' : 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
              {user.name?.split(' ')[0]}
            </span>
            <button onClick={onLogout}
              style={{ fontSize: 12, color: (!isHome || scrolled) ? '#9ca3af' : 'rgba(255,255,255,0.45)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
              onMouseLeave={e => e.currentTarget.style.color = (!isHome || scrolled) ? '#9ca3af' : 'rgba(255,255,255,0.45)'}>
              Sign out
            </button>
          </div>
        ) : (
          <button onClick={() => navigate('/login')}
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 11, padding: '10px 22px', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 14px rgba(99,102,241,0.38)', letterSpacing: '-0.2px', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.45)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 14px rgba(99,102,241,0.38)'; }}>
            Sign in
          </button>
        )}
      </div>
    </nav>
  );
}
