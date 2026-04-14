import React, { useState, useEffect, useRef } from 'react';
import { navigate } from '../App.jsx';
import { useCart } from '../App.jsx';
import { PRODUCTS, fmt } from '../data/products.js';

/* ── Animated counter hook (triggers on scroll into view) ── */
function useCounter(target, duration = 1800) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    let startTs = null;
    const step = (ts) => {
      if (!startTs) startTs = ts;
      const progress = Math.min((ts - startTs) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, target, duration]);

  return [count, ref];
}

/* ════════════════════════════════════════════════ HOME PAGE ════ */
export default function Home() {
  const { addToCart } = useCart();
  const [addedId, setAddedId] = useState(null);
  const featured = PRODUCTS.slice(0, 4);

  // Flash-deals countdown
  const [time, setTime] = useState({ h: 7, m: 42, s: 17 });
  useEffect(() => {
    const t = setInterval(() => {
      setTime(prev => {
        let { h, m, s } = prev;
        s--; if (s < 0) { s = 59; m--; } if (m < 0) { m = 59; h--; } if (h < 0) h = 23;
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  function handleAdd(p) {
    addToCart(p);
    setAddedId(p.id);
    setTimeout(() => setAddedId(null), 1500);
  }

  return (
    <div style={{ fontFamily: 'inherit', overflowX: 'hidden' }}>

      {/* ══════════════ HERO ══════════════ */}
      <section style={{
        position: 'relative', minHeight: '100vh',
        background: '#05051a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {/* Animated orbs */}
        <div className="orb-1" style={{ position: 'absolute', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.22) 0%, transparent 70%)', top: '-180px', left: '-200px', pointerEvents: 'none' }} />
        <div className="orb-2" style={{ position: 'absolute', width: 560, height: 560, borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,121,249,0.18) 0%, transparent 70%)', bottom: '-100px', right: '-120px', pointerEvents: 'none' }} />
        <div className="orb-3" style={{ position: 'absolute', width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(251,191,36,0.1) 0%, transparent 70%)', top: '45%', left: '48%', pointerEvents: 'none' }} />

        {/* Grid overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(99,102,241,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.055) 1px, transparent 1px)',
          backgroundSize: '64px 64px', pointerEvents: 'none',
        }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '80px 24px 0', maxWidth: 960 }}>
          {/* Badge */}
          <div className="fade-in-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(99,102,241,0.13)', border: '1px solid rgba(99,102,241,0.35)', borderRadius: 100, padding: '6px 18px', marginBottom: 32 }}>
            <span className="dot-pulse" style={{ width: 7, height: 7, borderRadius: '50%', background: '#818cf8', display: 'inline-block' }} />
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#a5b4fc', letterSpacing: '1.5px', textTransform: 'uppercase' }}>New arrivals — Spring 2025</span>
          </div>

          {/* Headline */}
          <h1 className="hero-title fade-in-up-d1" style={{
            fontSize: 'clamp(50px, 9vw, 100px)',
            fontWeight: 900, lineHeight: 1.02,
            letterSpacing: '-4px', margin: '0 0 26px',
          }}>
            Shop Smarter.<br />Live Better.
          </h1>

          {/* Subheading */}
          <p className="fade-in-up-d2" style={{ fontSize: 'clamp(15px, 2vw, 19px)', color: 'rgba(255,255,255,0.55)', maxWidth: 540, margin: '0 auto 44px', lineHeight: 1.75 }}>
            Premium tech, studio-grade audio, and smart accessories — handpicked for creators who demand the best.
          </p>

          {/* CTAs */}
          <div className="fade-in-up-d2" style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/products')} data-testid="shop-now-btn" className="glow-btn"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 13, padding: '17px 44px', fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.3px' }}>
              Shop now →
            </button>
            <button onClick={() => navigate('/products')}
              style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.82)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 13, padding: '17px 34px', fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', backdropFilter: 'blur(12px)', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.13)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}>
              View catalog
            </button>
          </div>

          {/* Trust line */}
          <div className="fade-in-up-d3" style={{ display: 'flex', gap: 28, justifyContent: 'center', marginTop: 52, flexWrap: 'wrap' }}>
            {[['⭐', '4.9/5 rating'], ['🚚', 'Free shipping $50+'], ['🔒', 'Secure checkout'], ['↩️', '30-day returns']].map(([icon, text]) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.38)', fontSize: 12.5, fontWeight: 500 }}>
                <span style={{ fontSize: 15 }}>{icon}</span><span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Floating product preview cards */}
        <div className="float-anim" style={{ position: 'absolute', right: '6%', bottom: '18%', background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, zIndex: 2, minWidth: 220 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🎧</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Studio Headphones</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>$79.00 · ★★★★★</div>
          </div>
        </div>
        <div className="float-anim" style={{ position: 'absolute', left: '5%', bottom: '28%', background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, zIndex: 2, animationDelay: '1s', minWidth: 190 }}>
          <div style={{ width: 40, height: 40, borderRadius: 9, background: 'linear-gradient(135deg,#e879f9,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>⌨️</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Mech Keyboard Pro</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>$149.00 · In stock</div>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="float-anim" style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.25)', fontSize: 11, letterSpacing: '1px', textTransform: 'uppercase', animationDelay: '0.5s' }}>
          <span>Scroll</span>
          <div style={{ width: 1, height: 44, background: 'linear-gradient(to bottom, rgba(255,255,255,0.25), transparent)' }} />
        </div>
      </section>

      {/* ══════════════ FLASH DEALS BAR ══════════════ */}
      <section style={{ background: 'linear-gradient(90deg, #1e1b4b, #2d1b6e, #1e1b4b)', padding: '18px 24px', backgroundSize: '200% 100%' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>⚡</span>
            <span style={{ fontWeight: 800, color: '#fff', fontSize: 15, letterSpacing: '-0.2px' }}>Flash Deals</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginLeft: 2 }}>ends in</span>
          </div>
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            {[String(time.h).padStart(2, '0'), String(time.m).padStart(2, '0'), String(time.s).padStart(2, '0')].map((v, i) => (
              <React.Fragment key={i}>
                <span style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', fontWeight: 800, fontSize: 17, padding: '5px 11px', borderRadius: 7, fontVariantNumeric: 'tabular-nums', minWidth: 40, textAlign: 'center', display: 'inline-block' }}>{v}</span>
                {i < 2 && <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 900, fontSize: 17 }}>:</span>}
              </React.Fragment>
            ))}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Up to 40% off</span>
            <button onClick={() => navigate('/products')}
              style={{ background: '#f59e0b', color: '#000', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
              See all deals →
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════ STATS ══════════════ */}
      <StatsBar />

      {/* ══════════════ CATEGORIES ══════════════ */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px 50px' }}>
        <SectionHeader title="Shop by Category" sub="Find exactly what you need" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 16 }}>
          {[
            { name: 'Audio', icon: '🎧', img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80' },
            { name: 'Peripherals', icon: '⌨️', img: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80' },
            { name: 'Accessories', icon: '🔌', img: 'https://images.unsplash.com/photo-1625895197185-efcec01cffe0?w=600&q=80' },
            { name: 'All Products', icon: '✨', img: 'https://images.unsplash.com/photo-1593640495253-23196b27a87f?w=600&q=80' },
          ].map(cat => (
            <div key={cat.name} className="hover-card img-zoom" onClick={() => navigate('/products')}
              style={{ position: 'relative', height: 210, borderRadius: 18, overflow: 'hidden', cursor: 'pointer' }}>
              <img src={cat.img} alt={cat.name} />
              <div className="cat-overlay" />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '20px 22px', zIndex: 1 }}>
                <span style={{ fontSize: 24, marginBottom: 4 }}>{cat.icon}</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Explore</span>
                <span style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1.1 }}>{cat.name}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════ FEATURED PRODUCTS ══════════════ */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '10px 24px 80px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 36 }}>
          <SectionHeader title="Featured Products" sub="Handpicked for your setup" noMargin />
          <button onClick={() => navigate('/products')}
            style={{ fontSize: 13, color: '#6366f1', background: 'none', border: '1px solid #e0e3ef', borderRadius: 9, padding: '9px 18px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, whiteSpace: 'nowrap' }}>
            View all →
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 22 }}>
          {featured.map(p => (
            <ProductCard key={p.id} p={p} added={addedId === p.id} onAdd={() => handleAdd(p)} />
          ))}
        </div>
      </section>

      {/* ══════════════ VISION ══════════════ */}
      <VisionSection />

      {/* ══════════════ TESTIMONIALS ══════════════ */}
      <TestimonialsSection />

      {/* ══════════════ BIG CTA BANNER ══════════════ */}
      <section style={{ position: 'relative', background: 'linear-gradient(135deg, #050520 0%, #1e1b4b 50%, #2d1b6e 100%)', padding: '100px 24px', textAlign: 'center', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 25% 50%, rgba(99,102,241,0.18) 0%, transparent 55%), radial-gradient(circle at 75% 50%, rgba(232,121,249,0.12) 0%, transparent 55%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 640, margin: '0 auto' }}>
          <div style={{ fontSize: 52, marginBottom: 20 }} className="float-anim">🚀</div>
          <h2 style={{ fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 900, color: '#fff', letterSpacing: '-2px', margin: '0 0 18px', lineHeight: 1.05 }}>
            Ready to upgrade<br />your setup?
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', margin: '0 0 40px', lineHeight: 1.7 }}>
            Join 50,000+ creators who trust ShopFlow for premium tech gear. Free shipping on your first order.
          </p>
          <button onClick={() => navigate('/products')} className="glow-btn"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 14, padding: '20px 56px', fontSize: 18, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.3px' }}>
            Start shopping →
          </button>
          <div style={{ marginTop: 28, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>No credit card required for free account</div>
        </div>
      </section>

      {/* ══════════════ FOOTER ══════════════ */}
      <footer style={{ background: '#030312', color: 'rgba(255,255,255,0.35)', padding: '48px 24px 32px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {/* Top row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24, marginBottom: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 14 }}>SF</div>
              <span style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 800, fontSize: 18, letterSpacing: '-0.4px' }}>ShopFlow</span>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[['/', 'Home'], ['/products', 'Products'], ['/cart', 'Cart'], ['/login', 'Sign In']].map(([path, label]) => (
                <button key={path} onClick={() => navigate(path)}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.32)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', padding: '4px 10px', borderRadius: 6, transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.32)'}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 24, textAlign: 'center', fontSize: 11 }}>
            © 2025 ShopFlow Demo Store &nbsp;·&nbsp; <em>Monitored by FlowTest Analytics</em>
          </div>
        </div>
      </footer>

    </div>
  );
}

/* ════════════════════════════════════ SUB-COMPONENTS ════ */

function SectionHeader({ title, sub, noMargin }) {
  return (
    <div style={{ marginBottom: noMargin ? 0 : 36 }}>
      <h2 style={{ fontSize: 32, fontWeight: 900, margin: '0 0 7px', letterSpacing: '-0.8px', color: '#0c0c1d' }}>{title}</h2>
      <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>{sub}</p>
    </div>
  );
}

function StatsBar() {
  const items = [
    { target: 50000, suffix: '+', label: 'Happy Customers', icon: '👥' },
    { target: 200,   suffix: '+', label: 'Products',        icon: '📦' },
    { target: 49,    suffix: '/5',label: 'Avg Rating',      icon: '⭐', decimal: true },
    { target: 99,    suffix: '%', label: 'Satisfaction',    icon: '💎' },
  ];
  return (
    <section style={{ background: '#f5f6ff', borderTop: '1px solid #e4e6f5', borderBottom: '1px solid #e4e6f5', padding: '50px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 28 }}>
        {items.map(s => <StatCard key={s.label} {...s} />)}
      </div>
    </section>
  );
}

function StatCard({ target, suffix, label, icon, decimal }) {
  const displayTarget = decimal ? target : target;
  const [count, ref] = useCounter(displayTarget, 2000);
  const display = decimal ? (count / 10).toFixed(1) : count.toLocaleString();
  return (
    <div ref={ref} style={{ textAlign: 'center', padding: '8px 0' }}>
      <div style={{ fontSize: 32, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 42, fontWeight: 900, color: '#0c0c1d', letterSpacing: '-2px', lineHeight: 1 }}>
        {display}<span style={{ fontSize: 24, color: '#6366f1', fontWeight: 800 }}>{suffix}</span>
      </div>
      <div style={{ fontSize: 13, color: '#6b7280', marginTop: 8, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

function ProductCard({ p, added, onAdd }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div data-testid="product-card" className="hover-card"
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ background: '#fff', border: '1px solid #e8eaf0', borderRadius: 18, overflow: 'hidden', cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
      <div className="img-zoom" style={{ position: 'relative', aspectRatio: '4/3' }} onClick={() => navigate(`/products/${p.slug}`)}>
        <img src={p.image} alt={p.name} loading="lazy" />
        {p.badge && (
          <span style={{ position: 'absolute', top: 10, left: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20, letterSpacing: '0.3px' }}>{p.badge}</span>
        )}
        {hovered && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(5,5,26,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
            <span style={{ background: 'rgba(255,255,255,0.96)', color: '#6366f1', fontSize: 12, fontWeight: 800, padding: '8px 18px', borderRadius: 22, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', letterSpacing: '-0.2px' }}>Quick view →</span>
          </div>
        )}
      </div>
      <div style={{ padding: '18px 20px' }}>
        <div data-testid="product-category" style={{ fontSize: 10, color: '#6366f1', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>{p.category}</div>
        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 8, lineHeight: 1.3, color: '#0c0c1d', letterSpacing: '-0.3px' }} onClick={() => navigate(`/products/${p.slug}`)}>{p.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 16 }}>
          <span style={{ fontSize: 12, color: '#f59e0b' }}>{'★'.repeat(Math.floor(p.rating))}</span>
          <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>({p.reviews} reviews)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 22, fontWeight: 900, color: '#0c0c1d', letterSpacing: '-0.8px' }}>{fmt(p.price)}</span>
          <button onClick={onAdd} data-testid="add-to-cart"
            style={{ background: added ? '#22c55e' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.25s', minWidth: 108, letterSpacing: '-0.1px' }}>
            {added ? '✓ Added!' : 'Add to cart'}
          </button>
        </div>
      </div>
    </div>
  );
}

function VisionSection() {
  const pillars = [
    { icon: '⚡', title: 'Built for Speed', desc: 'Every product in our catalog is tested for performance. We partner only with brands that meet our quality bar.' },
    { icon: '🎯', title: 'Curated for Creators', desc: 'No noise, just signal. Our team handpicks every SKU so you can shop with confidence, not confusion.' },
    { icon: '🛡️', title: 'Protected Always', desc: '2-year warranty, 30-day returns, and 256-bit checkout security on every order. Zero compromises.' },
  ];
  return (
    <section style={{ background: '#0c0c20', padding: '96px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ display: 'inline-block', background: 'rgba(99,102,241,0.14)', border: '1px solid rgba(99,102,241,0.28)', borderRadius: 100, padding: '5px 18px', marginBottom: 20 }}>
            <span style={{ fontSize: 11, color: '#a5b4fc', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Our Vision</span>
          </div>
          <h2 style={{ fontSize: 'clamp(26px, 4vw, 46px)', fontWeight: 900, color: '#fff', letterSpacing: '-1.5px', margin: '0 0 16px', lineHeight: 1.1 }}>
            We believe great tools<br />change how you create.
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', maxWidth: 480, margin: '0 auto', lineHeight: 1.75 }}>
            ShopFlow was built by creators, for creators — on the belief that the right gear unlocks your full potential.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 22 }}>
          {pillars.map(p => (
            <div key={p.title}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: '34px 30px', transition: 'all 0.3s ease', cursor: 'default' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.09)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.28)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'none'; }}>
              <div style={{ fontSize: 38, marginBottom: 20 }}>{p.icon}</div>
              <h3 style={{ fontSize: 21, fontWeight: 800, color: '#fff', margin: '0 0 13px', letterSpacing: '-0.5px' }}>{p.title}</h3>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.42)', lineHeight: 1.75, margin: 0 }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const reviews = [
    { name: 'Sarah K.', role: 'UX Designer', text: 'The keyboard completely changed my workflow. Best purchase of the year, hands down. Would buy again instantly.', stars: 5, initials: 'SK', color: 'linear-gradient(135deg,#6366f1,#8b5cf6)' },
    { name: 'Mark T.', role: 'Software Engineer', text: 'Shipped fast, packaging was immaculate, and the product is exactly as described. ShopFlow is my go-to now.', stars: 5, initials: 'MT', color: 'linear-gradient(135deg,#e879f9,#6366f1)' },
    { name: 'Priya M.', role: 'Content Creator', text: "The webcam quality is insane for the price. I've already recommended it to my entire team and they all love it.", stars: 5, initials: 'PM', color: 'linear-gradient(135deg,#f59e0b,#ef4444)' },
  ];
  return (
    <section style={{ background: '#f8f9ff', padding: '88px 24px', borderTop: '1px solid #e8eaf5' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <h2 style={{ fontSize: 32, fontWeight: 900, color: '#0c0c1d', letterSpacing: '-0.8px', margin: '0 0 10px' }}>
            Loved by 50,000+ customers
          </h2>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20, color: '#f59e0b', letterSpacing: '-2px' }}>★★★★★</span>
            <span style={{ fontSize: 14, color: '#6b7280', fontWeight: 500 }}>4.9 out of 5 · 12,400+ verified reviews</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 22 }}>
          {reviews.map(r => (
            <div key={r.name} className="hover-card"
              style={{ background: '#fff', border: '1px solid #e8eaf0', borderRadius: 18, padding: '30px 26px', boxShadow: '0 2px 14px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', gap: 3, marginBottom: 16 }}>
                {'★★★★★'.split('').map((_, i) => <span key={i} style={{ color: '#f59e0b', fontSize: 15 }}>★</span>)}
              </div>
              <p style={{ fontSize: 14.5, color: '#374151', lineHeight: 1.75, margin: '0 0 24px', fontStyle: 'italic' }}>"{r.text}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: r.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 900, flexShrink: 0 }}>{r.initials}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0c0c1d', letterSpacing: '-0.2px' }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>{r.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
