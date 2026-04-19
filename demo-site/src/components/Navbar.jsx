import React, { useState, useEffect, useRef } from 'react';
import { navigate } from '../App.jsx';
import styles from './Navbar.module.css';

const API = (import.meta.env.VITE_API_URL || 'https://flowtest-production.up.railway.app') + '/api';
const DASHBOARD_URL = import.meta.env.VITE_DASHBOARD_URL || '';

export default function Navbar({ cartCount, user, onLogout }) {
  const [scrolled, setScrolled]       = useState(false);
  const [prevCount, setPrevCount]     = useState(cartCount);
  const [cartAnim, setCartAnim]       = useState(false);
  const [search, setSearch]           = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [adminOpen, setAdminOpen]     = useState(false);
  const [adminForm, setAdminForm]     = useState({ email: '', password: '' });
  const [adminErr, setAdminErr]       = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile]       = useState(window.innerWidth < 768);
  const searchRef = useRef(null);

  const isHome = window.location.hash === '#/' || window.location.hash === '#'
    || window.location.hash === '' || window.location.pathname === '/';
  const light = !isHome || scrolled;

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (cartCount > prevCount) { setCartAnim(true); setTimeout(() => setCartAnim(false), 500); }
    setPrevCount(cartCount);
  }, [cartCount]);

  useEffect(() => {
    if (!searchFocused) return;
    const handler = e => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchFocused(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [searchFocused]);

  function handleSearch(e) {
    e.preventDefault();
    if (search.trim()) {
      navigate('/products?q=' + encodeURIComponent(search.trim()));
      setSearch('');
      setSearchFocused(false);
    }
  }

  async function handleAdminLogin(e) {
    e.preventDefault();
    setAdminErr(''); setAdminLoading(true);
    try {
      const res  = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(adminForm) });
      const data = await res.json();
      if (!res.ok) { setAdminErr(data.error || 'Invalid credentials'); return; }
      const dest = DASHBOARD_URL ? `${DASHBOARD_URL}?token=${encodeURIComponent(data.token)}` : null;
      if (dest) { window.location.href = dest; setAdminOpen(false); }
      else { setAdminErr('Dashboard URL not configured — set VITE_DASHBOARD_URL'); }
    } catch { setAdminErr('Cannot connect to backend.'); }
    finally { setAdminLoading(false); }
  }

  async function handleDemoLogin() {
    const creds = { email: 'demo@flowtest.io', password: 'demo123' };
    setAdminForm(creds);
    setAdminErr(''); setAdminLoading(true);
    try {
      const res  = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(creds) });
      const data = await res.json();
      if (!res.ok) { setAdminErr(data.error || 'Login failed'); return; }
      const dest = DASHBOARD_URL ? `${DASHBOARD_URL}?token=${encodeURIComponent(data.token)}` : null;
      if (dest) { window.location.href = dest; setAdminOpen(false); }
      else { setAdminErr('Set VITE_DASHBOARD_URL in .env with your deployed dashboard URL'); }
    } catch { setAdminErr('Cannot connect to backend.'); }
    finally { setAdminLoading(false); }
  }

  const navClass = `${styles.nav}${light ? ' ' + styles.light : ''}`;

  return (
    <>
      <nav className={navClass}>
        {/* ── Main bar ── */}
        <div className={styles.bar}>

          {/* Logo */}
          <button className={styles.logoBtn} onClick={() => { navigate('/'); setMobileMenuOpen(false); }}>
            <div className={styles.logoIcon}>SF</div>
            <span className={styles.logoName}>ShopFlow</span>
          </button>

          {/* Nav links — desktop */}
          {!isMobile && (
            <div className={styles.navLinks}>
              {[['/', 'Home'], ['/products', 'Products']].map(([path, label]) => (
                <button key={path} className={styles.navLink} onClick={() => navigate(path)}>
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Search — desktop */}
          {!isMobile && (
            <div ref={searchRef} className={styles.searchWrap}>
              <form
                onSubmit={handleSearch}
                className={`${styles.searchForm}${searchFocused ? ' ' + styles.focused : ''}`}
              >
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  placeholder="Search products..."
                  className={styles.searchInput}
                />
                <button type="submit" className={styles.searchBtn}>🔍</button>
              </form>

              {searchFocused && search.length === 0 && (
                <div className={styles.searchDropdown}>
                  <div className={styles.searchDropdownLabel}>Popular searches</div>
                  {['Headphones', 'Office chair', 'Hoodie', 'Dog treats', 'Mechanical keyboard'].map(term => (
                    <button
                      key={term}
                      className={styles.searchSuggestion}
                      onClick={() => { navigate('/products?q=' + encodeURIComponent(term)); setSearch(''); setSearchFocused(false); }}
                    >
                      <span className={styles.searchSuggestionIcon}>🔍</span>{term}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {isMobile && <div className={styles.spacer} />}

          {/* Right side — desktop */}
          {!isMobile && (
            <div className={styles.rightSide}>
              <button className={styles.cartBtn} onClick={() => navigate('/cart')} data-testid="cart-btn">
                🛒 Cart
                {cartCount > 0 && (
                  <span data-testid="cart-count" className={`${styles.cartBadge}${cartAnim ? ' cart-badge-bounce' : ''}`}>
                    {cartCount}
                  </span>
                )}
              </button>

              <button className={styles.adminBtn} onClick={() => { setAdminOpen(true); setAdminErr(''); setAdminForm({ email: '', password: '' }); }}>
                ⚙️ Admin
              </button>

              {user ? (
                <div className={styles.userRow}>
                  <div className={styles.userAvatar}>{user.name?.[0]?.toUpperCase() || '?'}</div>
                  <span className={styles.userName} data-testid="welcome-msg">{user.name?.split(' ')[0]}</span>
                  <button className={styles.signOutBtn} onClick={onLogout}>Sign out</button>
                </div>
              ) : (
                <button className={styles.signInBtn} onClick={() => navigate('/login')}>Sign in</button>
              )}
            </div>
          )}

          {/* Mobile right: cart + hamburger */}
          {isMobile && (
            <div className={styles.mobileRight}>
              <button className={styles.mobileCartBtn} onClick={() => navigate('/cart')} data-testid="cart-btn">
                🛒
                {cartCount > 0 && (
                  <span data-testid="cart-count" className={`${styles.mobileCartBadge}${cartAnim ? ' cart-badge-bounce' : ''}`}>
                    {cartCount}
                  </span>
                )}
              </button>
              <button className={styles.hamburgerBtn} onClick={() => setMobileMenuOpen(o => !o)}>
                {mobileMenuOpen ? '✕' : '☰'}
              </button>
            </div>
          )}
        </div>

        {/* ── Mobile drawer ── */}
        {isMobile && mobileMenuOpen && (
          <div className={styles.drawer}>
            <form className={styles.drawerSearch} onSubmit={e => { handleSearch(e); setMobileMenuOpen(false); }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search products..."
                className={styles.drawerSearchInput}
              />
              <button type="submit" className={styles.drawerSearchBtn}>🔍</button>
            </form>

            {[['/', '🏠 Home'], ['/products', '🛍️ Products']].map(([path, label]) => (
              <button
                key={path}
                className={styles.drawerNavLink}
                onClick={() => { navigate(path); setMobileMenuOpen(false); }}
              >
                {label}
              </button>
            ))}

            <button
              className={styles.drawerAdminBtn}
              onClick={() => { setAdminOpen(true); setAdminErr(''); setAdminForm({ email: '', password: '' }); setMobileMenuOpen(false); }}
            >
              ⚙️ Admin dashboard
            </button>

            {user ? (
              <div className={styles.drawerUserRow}>
                <span className={styles.drawerUserName}>👤 {user.name?.split(' ')[0]}</span>
                <button className={styles.drawerSignOutBtn} onClick={() => { onLogout(); setMobileMenuOpen(false); }}>
                  Sign out
                </button>
              </div>
            ) : (
              <button className={styles.drawerSignInBtn} onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}>
                Sign in
              </button>
            )}
          </div>
        )}
      </nav>

      {/* ── Admin modal ── */}
      {adminOpen && (
        <div className={styles.modalBackdrop} onClick={() => setAdminOpen(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <button className={styles.modalCloseBtn} onClick={() => setAdminOpen(false)}>✕</button>

            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderIcon}>⚙️</div>
              <h3 className={styles.modalTitle}>Admin access</h3>
              <p className={styles.modalSubtitle}>Sign in to the FlowTest analytics dashboard</p>
            </div>

            <form className={styles.modalForm} onSubmit={handleAdminLogin}>
              <div>
                <label className={styles.modalLabel}>Email</label>
                <input
                  type="email"
                  value={adminForm.email}
                  onChange={e => setAdminForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="admin@example.com"
                  required
                  className={styles.modalInput}
                />
              </div>
              <div>
                <label className={styles.modalLabel}>Password</label>
                <input
                  type="password"
                  value={adminForm.password}
                  onChange={e => setAdminForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••"
                  required
                  className={styles.modalInput}
                />
              </div>

              {adminErr && <div className={styles.modalError}>⚠️ {adminErr}</div>}

              <button type="submit" disabled={adminLoading} className={styles.modalSubmitBtn}>
                {adminLoading ? '⏳ Signing in...' : 'Open dashboard →'}
              </button>

              <div className={styles.modalDivider}>
                <div className={styles.modalDividerLine} />
                <span className={styles.modalDividerText}>or</span>
                <div className={styles.modalDividerLine} />
              </div>

              <button type="button" disabled={adminLoading} className={styles.modalDemoBtn} onClick={handleDemoLogin}>
                {adminLoading ? '⏳ Signing in...' : '⚡ Demo account → open dashboard'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
