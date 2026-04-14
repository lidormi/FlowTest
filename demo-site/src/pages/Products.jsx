import React, { useState } from 'react';
import { navigate, useCart } from '../App.jsx';
import { PRODUCTS, fmt } from '../data/products.js';

const CATS = [
  { key: 'All',         icon: '✦',  label: 'All' },
  { key: 'Audio',       icon: '🎧', label: 'Audio' },
  { key: 'Peripherals', icon: '⌨️', label: 'Peripherals' },
  { key: 'Accessories', icon: '🔌', label: 'Accessories' },
];

const SORT_OPTS = [
  { value: 'default', label: 'Featured' },
  { value: 'low',     label: 'Price: Low → High' },
  { value: 'high',    label: 'Price: High → Low' },
  { value: 'rating',  label: 'Best Rated' },
];

export default function Products() {
  const { addToCart } = useCart();
  const [cat, setCat]   = useState('All');
  const [sort, setSort] = useState('default');
  const [added, setAdded] = useState(null);

  let list = cat === 'All' ? PRODUCTS : PRODUCTS.filter(p => p.category === cat);
  if (sort === 'low')    list = [...list].sort((a, b) => a.price - b.price);
  if (sort === 'high')   list = [...list].sort((a, b) => b.price - a.price);
  if (sort === 'rating') list = [...list].sort((a, b) => b.rating - a.rating);

  function handleAdd(p) {
    addToCart(p);
    setAdded(p.id);
    setTimeout(() => setAdded(null), 1600);
  }

  return (
    <div style={{ background: '#f4f5fb', minHeight: '100vh' }}>

      {/* ── Hero banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0c0c20 0%, #1e1b4b 60%, #2d2060 100%)',
        padding: '52px 24px 44px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(99,102,241,0.18) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(139,92,246,0.12) 0%, transparent 50%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 100, padding: '4px 14px', marginBottom: 16 }}>
            <span style={{ width: 6, height: 6, background: '#818cf8', borderRadius: '50%', display: 'inline-block' }} />
            <span style={{ fontSize: 11, color: '#a5b4fc', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Free shipping on orders over $50</span>
          </div>
          <h1 style={{ fontSize: 'clamp(28px,5vw,48px)', fontWeight: 900, color: '#fff', letterSpacing: '-1.5px', margin: '0 0 10px', lineHeight: 1.1 }}>
            Shop Our Collection
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
            {list.length} products &nbsp;·&nbsp; {cat === 'All' ? 'All categories' : cat}
          </p>
        </div>
      </div>

      {/* ── Sticky filter bar ── */}
      <div style={{
        position: 'sticky', top: 64, zIndex: 50,
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid #e8eaf0',
        boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
        padding: '0 24px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', padding: '12px 0' }}>
          {/* Category pills */}
          <div style={{ display: 'flex', gap: 7, flex: 1, flexShrink: 0 }}>
            {CATS.map(c => (
              <button key={c.key} onClick={() => setCat(c.key)}
                data-testid={`filter-${c.key.toLowerCase()}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 18px', borderRadius: 100,
                  border: cat === c.key ? '1.5px solid #6366f1' : '1.5px solid transparent',
                  background: cat === c.key ? '#6366f1' : '#f1f2f8',
                  color: cat === c.key ? '#fff' : '#4b5563',
                  fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.18s ease',
                  boxShadow: cat === c.key ? '0 4px 14px rgba(99,102,241,0.35)' : 'none',
                }}>
                <span style={{ fontSize: 14 }}>{c.icon}</span>
                {c.label}
                {cat === c.key && (
                  <span style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 100, fontSize: 11, fontWeight: 800, padding: '1px 7px' }}>
                    {c.key === 'All' ? PRODUCTS.length : PRODUCTS.filter(p => p.category === c.key).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 28, background: '#e8eaf0', flexShrink: 0 }} />

          {/* Sort */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600, whiteSpace: 'nowrap' }}>Sort by</span>
            <select value={sort} onChange={e => setSort(e.target.value)}
              style={{ padding: '7px 12px', borderRadius: 10, border: '1.5px solid #e8eaf0', fontSize: 13, color: '#374151', cursor: 'pointer', background: '#fff', fontFamily: 'inherit', fontWeight: 600, outline: 'none', appearance: 'none', paddingRight: 28, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%236b7280'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}>
              {SORT_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── Product grid ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '36px 24px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 24 }}>
          {list.map((p, i) => (
            <Card key={p.id} p={p} added={added === p.id} onAdd={() => handleAdd(p)} idx={i} />
          ))}
        </div>
      </div>

    </div>
  );
}

/* ── Product card ── */
function Card({ p, added, onAdd, idx }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      data-testid="product-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: hovered
          ? '0 20px 50px rgba(99,102,241,0.14), 0 4px 16px rgba(0,0,0,0.06)'
          : '0 2px 12px rgba(0,0,0,0.05)',
        transform: hovered ? 'translateY(-6px)' : 'none',
        transition: 'all 0.3s cubic-bezier(.22,.68,0,1.2)',
        border: hovered ? '1.5px solid rgba(99,102,241,0.2)' : '1.5px solid transparent',
      }}
    >
      {/* Image */}
      <div
        onClick={() => navigate(`/products/${p.slug}`)}
        style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden', cursor: 'pointer', background: '#f8f9ff' }}
      >
        <img
          src={p.image} alt={p.name} loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease', transform: hovered ? 'scale(1.07)' : 'scale(1)' }}
        />

        {/* Badge */}
        {p.badge && (
          <span style={{
            position: 'absolute', top: 12, left: 12,
            background: p.badge === 'Hot' ? 'linear-gradient(135deg,#ef4444,#f97316)'
                      : p.badge === 'New' ? 'linear-gradient(135deg,#22c55e,#16a34a)'
                      : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            color: '#fff', fontSize: 10, fontWeight: 900,
            padding: '4px 11px', borderRadius: 100, letterSpacing: '0.4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}>{p.badge}</span>
        )}

        {/* Free shipping badge */}
        {p.price >= 5000 && (
          <span style={{
            position: 'absolute', top: 12, right: 12,
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
            color: '#fff', fontSize: 9, fontWeight: 700,
            padding: '3px 9px', borderRadius: 100, letterSpacing: '0.3px',
          }}>Free shipping</span>
        )}

        {/* Hover overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(12,12,32,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.25s ease',
        }}>
          <span style={{
            background: '#fff', color: '#6366f1',
            fontSize: 13, fontWeight: 800,
            padding: '10px 22px', borderRadius: 100,
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            letterSpacing: '-0.2px',
          }}>View details →</span>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '18px 20px 20px' }}>
        {/* Category + name */}
        <div data-testid="product-category" style={{ fontSize: 10, color: '#6366f1', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 6 }}>{p.category}</div>
        <div
          onClick={() => navigate(`/products/${p.slug}`)}
          style={{ fontSize: 16, fontWeight: 800, color: '#0c0c1d', lineHeight: 1.3, marginBottom: 10, cursor: 'pointer', letterSpacing: '-0.3px' }}
        >{p.name}</div>

        {/* Stars + review count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 1 }}>
            {[1,2,3,4,5].map(s => (
              <span key={s} style={{ fontSize: 13, color: s <= Math.floor(p.rating) ? '#f59e0b' : '#e5e7eb' }}>★</span>
            ))}
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{p.rating}</span>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>({p.reviews.toLocaleString()})</span>
        </div>

        {/* Price + CTA */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#0c0c1d', letterSpacing: '-1px', lineHeight: 1 }}>{fmt(p.price)}</div>
            {p.price >= 5000 && <div style={{ fontSize: 10, color: '#22c55e', fontWeight: 700, marginTop: 3 }}>FREE SHIPPING</div>}
          </div>
          <button
            onClick={onAdd}
            data-testid="add-to-cart"
            style={{
              background: added ? '#22c55e' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              color: '#fff', border: 'none', borderRadius: 12,
              padding: '11px 18px', fontSize: 13, fontWeight: 800,
              cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all 0.22s ease',
              minWidth: 118,
              boxShadow: added ? '0 4px 14px rgba(34,197,94,0.4)' : '0 4px 14px rgba(99,102,241,0.35)',
              transform: added ? 'scale(0.97)' : 'scale(1)',
            }}
          >
            {added ? '✓ Added!' : '+ Add to cart'}
          </button>
        </div>
      </div>
    </div>
  );
}
