import React, { useState, useMemo, useEffect } from 'react';
import { navigate, useCart } from '../App.jsx';
import { PRODUCTS, fmt } from '../data/products.js';

const CATS = ['All', 'Audio', 'Peripherals', 'Accessories', 'Clothing', 'Pet Food', 'Furniture'];

const CAT_ICONS = {
  'All': '✦', 'Audio': '🎧', 'Peripherals': '⌨️', 'Accessories': '🔌',
  'Clothing': '👕', 'Pet Food': '🐕', 'Furniture': '🪑',
};
const PRICE_RANGES = [
  { label: 'Under $50',     max: 5000 },
  { label: '$50 – $100',    min: 5000, max: 10000 },
  { label: '$100 – $200',   min: 10000, max: 20000 },
  { label: 'Over $200',     min: 20000 },
];
const SORT_OPTS = [
  { value: 'default',  label: '✦  Featured' },
  { value: 'low',      label: 'Price: Low → High' },
  { value: 'high',     label: 'Price: High → Low' },
  { value: 'rating',   label: 'Best Rated' },
  { value: 'reviews',  label: 'Most Reviewed' },
  { value: 'discount', label: 'Biggest Discount' },
];

export default function Products() {
  const { addToCart } = useCart();
  const [cat, setCat]           = useState('All');
  const [sort, setSort]         = useState('default');
  const [added, setAdded]       = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch]     = useState('');
  const [priceRange, setPriceRange] = useState(null);
  const [minRating, setMinRating]   = useState(0);
  const [freeOnly, setFreeOnly]     = useState(false);
  const [wishlist, setWishlist]     = useState(new Set());

  // Read ?q= and ?cat= from URL on mount / navigation
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q   = params.get('q')   || '';
    const cat = params.get('cat') || '';
    if (q)   { setSearch(q);   setSearchInput(q); }
    if (cat && CATS.includes(cat)) setCat(cat);
  }, [location.search]);

  const list = useMemo(() => {
    let f = PRODUCTS;
    if (cat !== 'All')  f = f.filter(p => p.category === cat);
    if (search)         f = f.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase()));
    if (priceRange) {
      if (priceRange.min) f = f.filter(p => p.price >= priceRange.min);
      if (priceRange.max) f = f.filter(p => p.price <  priceRange.max);
    }
    if (minRating > 0) f = f.filter(p => p.rating >= minRating);
    if (freeOnly)      f = f.filter(p => p.price >= 5000);
    if (sort === 'low')      return [...f].sort((a, b) => a.price - b.price);
    if (sort === 'high')     return [...f].sort((a, b) => b.price - a.price);
    if (sort === 'rating')   return [...f].sort((a, b) => b.rating - a.rating);
    if (sort === 'reviews')  return [...f].sort((a, b) => b.reviews - a.reviews);
    if (sort === 'discount') return [...f].sort((a, b) => {
      const da = a.originalPrice ? Math.round((1 - a.price / a.originalPrice) * 100) : 0;
      const db = b.originalPrice ? Math.round((1 - b.price / b.originalPrice) * 100) : 0;
      return db - da;
    });
    return f;
  }, [cat, sort, search, priceRange, minRating, freeOnly]);

  function handleAdd(p) {
    addToCart(p);
    setAdded(p.id);
    setTimeout(() => setAdded(null), 1600);
  }
  function toggleWishlist(id) {
    setWishlist(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function clearFilters() {
    setCat('All'); setPriceRange(null); setMinRating(0); setFreeOnly(false); setSearch(''); setSearchInput('');
  }
  const hasFilters = cat !== 'All' || priceRange || minRating > 0 || freeOnly || search;

  return (
    <div style={{ background: '#f5f6fa', minHeight: '100vh', fontFamily: 'inherit' }}>

      {/* ══ HERO ══ */}
      <div style={{ background: 'linear-gradient(135deg,#05051a 0%,#1a1745 55%,#2d2060 100%)', padding: '72px 24px 56px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position:'absolute',inset:0,backgroundImage:'radial-gradient(circle at 18% 60%, rgba(99,102,241,0.22) 0%, transparent 50%), radial-gradient(circle at 82% 40%, rgba(139,92,246,0.15) 0%, transparent 50%)',pointerEvents:'none' }} />
        <div style={{ position:'relative',zIndex:1 }}>
          <div style={{ display:'inline-flex',alignItems:'center',gap:7,background:'rgba(99,102,241,0.18)',border:'1px solid rgba(99,102,241,0.4)',borderRadius:100,padding:'4px 16px',marginBottom:18 }}>
            <span style={{ width:6,height:6,background:'#22c55e',borderRadius:'50%',display:'inline-block' }} />
            <span style={{ fontSize:11,color:'#a5b4fc',fontWeight:700,letterSpacing:'1.5px',textTransform:'uppercase' }}>{PRODUCTS.length} products · free shipping $50+</span>
          </div>
          <h1 style={{ fontSize:'clamp(32px,5vw,54px)',fontWeight:900,color:'#fff',letterSpacing:'-1.5px',margin:'0 0 10px',lineHeight:1.1 }}>Shop Our Collection</h1>
          <p style={{ fontSize:15,color:'rgba(255,255,255,0.42)',margin:'0 0 32px' }}>Premium tech gear, handpicked for creators who demand the best</p>

          {/* Search */}
          <form onSubmit={e => { e.preventDefault(); setSearch(searchInput); }}
            style={{ maxWidth:580,margin:'0 auto',display:'flex',borderRadius:14,overflow:'hidden',boxShadow:'0 8px 40px rgba(0,0,0,0.35)',border:'1px solid rgba(255,255,255,0.1)' }}>
            <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
              placeholder="Search headphones, keyboards, accessories..."
              style={{ flex:1,padding:'16px 22px',fontSize:14,border:'none',outline:'none',fontFamily:'inherit',background:'#fff',color:'#0c0c1d',WebkitTextFillColor:'#0c0c1d' }} />
            <button type="submit"
              style={{ padding:'16px 28px',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',border:'none',color:'#fff',fontSize:18,cursor:'pointer',fontWeight:800,fontFamily:'inherit',transition:'filter 0.2s' }}
              onMouseEnter={e=>e.currentTarget.style.filter='brightness(1.15)'}
              onMouseLeave={e=>e.currentTarget.style.filter='none'}>
              🔍
            </button>
          </form>
        </div>
      </div>

      {/* ══ BODY ══ */}
      <div style={{ maxWidth:1300,margin:'0 auto',padding:'32px 24px 80px',display:'flex',gap:28,alignItems:'flex-start' }}>

        {/* ── SIDEBAR ── */}
        <aside style={{ width:248,flexShrink:0,position:'sticky',top:80 }}>
          <div style={{ background:'#fff',borderRadius:16,border:'1px solid #e8eaf0',overflow:'hidden',boxShadow:'0 2px 12px rgba(0,0,0,0.04)' }}>

            {/* Header */}
            <div style={{ padding:'16px 18px',borderBottom:'1px solid #f0f0f5',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
              <span style={{ fontSize:14,fontWeight:800,color:'#0c0c1d',letterSpacing:'-0.3px' }}>Filters</span>
              {hasFilters && <button onClick={clearFilters} style={{ fontSize:11,color:'#6366f1',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',fontWeight:700,padding:0 }}>Clear all</button>}
            </div>

            {/* Category */}
            <FilterSection title="Category">
              {CATS.map(c => (
                <SidebarBtn key={c} active={cat===c} onClick={() => setCat(c)}
                  label={`${CAT_ICONS[c]}  ${c === 'All' ? 'All Products' : c}`}
                  count={c==='All' ? PRODUCTS.length : PRODUCTS.filter(p=>p.category===c).length}
                  showCount />
              ))}
            </FilterSection>

            {/* Price */}
            <FilterSection title="Price Range">
              <RadioBtn active={priceRange===null} onClick={()=>setPriceRange(null)} label="Any price" />
              {PRICE_RANGES.map(r => (
                <RadioBtn key={r.label} active={priceRange===r} onClick={()=>setPriceRange(r)} label={r.label} />
              ))}
            </FilterSection>

            {/* Rating */}
            <FilterSection title="Min Rating">
              <RadioBtn active={minRating===0} onClick={()=>setMinRating(0)} label="All ratings" />
              {[[4,'★★★★☆ 4.0+'],[4.5,'★★★★½ 4.5+'],[4.8,'★★★★★ 4.8+']].map(([val,label])=>(
                <RadioBtn key={val} active={minRating===val} onClick={()=>setMinRating(val)} label={label} />
              ))}
            </FilterSection>

            {/* Free shipping toggle */}
            <div style={{ padding:'14px 18px' }}>
              <div style={{ fontSize:11,color:'#9ca3af',fontWeight:700,textTransform:'uppercase',letterSpacing:'1px',marginBottom:12 }}>Shipping</div>
              <label style={{ display:'flex',alignItems:'center',gap:10,cursor:'pointer' }} onClick={()=>setFreeOnly(!freeOnly)}>
                <div style={{ width:40,height:22,borderRadius:11,background:freeOnly?'#6366f1':'#e5e7eb',position:'relative',transition:'background 0.25s',flexShrink:0 }}>
                  <div style={{ position:'absolute',top:3,left:freeOnly?20:3,width:16,height:16,borderRadius:'50%',background:'#fff',transition:'left 0.25s',boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }} />
                </div>
                <div>
                  <div style={{ fontSize:13,fontWeight:600,color:'#374151' }}>Free Shipping Only</div>
                  <div style={{ fontSize:11,color:'#9ca3af' }}>Orders over $50</div>
                </div>
              </label>
            </div>
          </div>

          {/* Sale banner in sidebar */}
          <div style={{ marginTop:16,background:'linear-gradient(135deg,#6366f1,#8b5cf6)',borderRadius:14,padding:'18px 20px',color:'#fff',position:'relative',overflow:'hidden' }}>
            <div style={{ position:'absolute',top:-20,right:-20,width:80,height:80,borderRadius:'50%',background:'rgba(255,255,255,0.08)' }} />
            <div style={{ fontSize:22,marginBottom:6 }}>🏷️</div>
            <div style={{ fontSize:13,fontWeight:800,letterSpacing:'-0.3px',marginBottom:4 }}>Sale up to 30% off</div>
            <div style={{ fontSize:11,color:'rgba(255,255,255,0.7)',marginBottom:12 }}>Limited time offer on select items</div>
            <button onClick={()=>{ setSort('discount'); }} style={{ background:'rgba(255,255,255,0.2)',border:'1px solid rgba(255,255,255,0.3)',color:'#fff',borderRadius:8,padding:'7px 14px',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit',width:'100%',backdropFilter:'blur(4px)' }}>
              Shop sale →
            </button>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <div style={{ flex:1,minWidth:0 }}>

          {/* Results bar */}
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18,flexWrap:'wrap',gap:10 }}>
            <div style={{ display:'flex',alignItems:'center',gap:8,flexWrap:'wrap' }}>
              <span style={{ fontSize:14,color:'#4b5563',fontWeight:600 }}>
                <strong style={{ color:'#0c0c1d' }}>{list.length}</strong> {list.length===1?'product':'products'}
                {cat!=='All'&&<span style={{ color:'#6b7280' }}> in {cat}</span>}
                {search&&<span style={{ color:'#6b7280' }}> for "{search}"</span>}
              </span>
              {cat!=='All'  && <Chip label={cat} onRemove={()=>setCat('All')} />}
              {priceRange   && <Chip label={priceRange.label} onRemove={()=>setPriceRange(null)} />}
              {minRating>0  && <Chip label={`★ ${minRating}+`} onRemove={()=>setMinRating(0)} />}
              {freeOnly     && <Chip label="Free shipping" onRemove={()=>setFreeOnly(false)} />}
              {search       && <Chip label={`"${search}"`} onRemove={()=>{ setSearch(''); setSearchInput(''); }} />}
            </div>
            <select value={sort} onChange={e=>setSort(e.target.value)}
              style={{ padding:'9px 14px',paddingRight:34,borderRadius:10,border:'1.5px solid #e8eaf0',fontSize:13,color:'#374151',cursor:'pointer',background:'#fff',fontFamily:'inherit',fontWeight:600,outline:'none',appearance:'none',backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%236b7280'/%3E%3C/svg%3E")`,backgroundRepeat:'no-repeat',backgroundPosition:'right 12px center' }}>
              {SORT_OPTS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Grid */}
          {list.length===0 ? (
            <div style={{ textAlign:'center',padding:'80px 24px',background:'#fff',borderRadius:18,border:'1px solid #e8eaf0' }}>
              <div style={{ fontSize:48,marginBottom:16 }}>🔍</div>
              <div style={{ fontSize:18,fontWeight:800,color:'#0c0c1d',marginBottom:8 }}>No products found</div>
              <div style={{ fontSize:14,color:'#9ca3af',marginBottom:24 }}>Try adjusting your filters or search terms</div>
              <button onClick={clearFilters} style={{ background:'#6366f1',color:'#fff',border:'none',borderRadius:10,padding:'11px 28px',fontSize:14,fontWeight:800,cursor:'pointer',fontFamily:'inherit' }}>Clear all filters</button>
            </div>
          ) : (
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(268px,1fr))',gap:22 }}>
              {list.map(p => (
                <Card key={p.id} p={p} added={added===p.id} onAdd={()=>handleAdd(p)} wishlisted={wishlist.has(p.id)} onWishlist={()=>toggleWishlist(p.id)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function FilterSection({ title, children }) {
  return (
    <div style={{ padding:'14px 18px',borderBottom:'1px solid #f0f0f5' }}>
      <div style={{ fontSize:11,color:'#9ca3af',fontWeight:700,textTransform:'uppercase',letterSpacing:'1px',marginBottom:10 }}>{title}</div>
      <div style={{ display:'flex',flexDirection:'column',gap:2 }}>{children}</div>
    </div>
  );
}

function SidebarBtn({ active, onClick, label, count, showCount }) {
  return (
    <button onClick={onClick}
      style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 10px',borderRadius:9,border:'none',background:active?'rgba(99,102,241,0.08)':'transparent',color:active?'#6366f1':'#374151',fontSize:13,fontWeight:active?700:500,cursor:'pointer',fontFamily:'inherit',textAlign:'left',transition:'all 0.14s' }}
      onMouseEnter={e=>{ if(!active){ e.currentTarget.style.background='#f5f5ff'; } }}
      onMouseLeave={e=>{ if(!active){ e.currentTarget.style.background='transparent'; } }}>
      <span>{label}</span>
      {showCount && <span style={{ fontSize:11,background:active?'rgba(99,102,241,0.14)':'#f0f0f5',color:active?'#6366f1':'#9ca3af',padding:'1px 7px',borderRadius:100,fontWeight:700,flexShrink:0 }}>{count}</span>}
    </button>
  );
}

function RadioBtn({ active, onClick, label }) {
  return (
    <button onClick={onClick}
      style={{ display:'flex',alignItems:'center',gap:9,padding:'7px 10px',borderRadius:8,border:'none',background:active?'rgba(99,102,241,0.08)':'transparent',color:active?'#6366f1':'#374151',fontSize:13,fontWeight:active?700:400,cursor:'pointer',fontFamily:'inherit',textAlign:'left',transition:'all 0.14s' }}>
      <span style={{ width:15,height:15,borderRadius:'50%',border:`2px solid ${active?'#6366f1':'#d1d5db'}`,background:active?'#6366f1':'transparent',display:'inline-flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all 0.15s' }}>
        {active && <span style={{ width:5,height:5,borderRadius:'50%',background:'#fff',display:'block' }} />}
      </span>
      {label}
    </button>
  );
}

function Chip({ label, onRemove }) {
  return (
    <span style={{ display:'inline-flex',alignItems:'center',gap:4,background:'rgba(99,102,241,0.08)',color:'#6366f1',fontSize:12,fontWeight:700,padding:'4px 10px',borderRadius:100,border:'1px solid rgba(99,102,241,0.18)' }}>
      {label}
      <button onClick={onRemove} style={{ background:'none',border:'none',cursor:'pointer',color:'#6366f1',padding:0,fontSize:14,lineHeight:1,display:'flex',alignItems:'center',marginTop:-1 }}>×</button>
    </span>
  );
}

function Card({ p, added, onAdd, wishlisted, onWishlist }) {
  const [hovered, setHovered] = useState(false);
  const discount = p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;
  const lowStock = p.stock <= 10;

  return (
    <div data-testid="product-card"
      onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}
      style={{
        background:'#fff',borderRadius:20,overflow:'hidden',
        boxShadow: hovered ? '0 24px 60px rgba(99,102,241,0.15),0 4px 20px rgba(0,0,0,0.06)' : '0 2px 14px rgba(0,0,0,0.05)',
        transform: hovered ? 'translateY(-6px)' : 'none',
        transition: 'all 0.32s cubic-bezier(.22,.68,0,1.2)',
        border: hovered ? '1.5px solid rgba(99,102,241,0.18)' : '1.5px solid transparent',
      }}>

      {/* Image */}
      <div onClick={()=>navigate(`/products/${p.slug}`)}
        style={{ position:'relative',aspectRatio:'4/3',overflow:'hidden',cursor:'pointer',background:'#f8f9ff' }}>
        <img src={p.image} alt={p.name} loading="lazy"
          style={{ width:'100%',height:'100%',objectFit:'cover',transition:'transform 0.5s ease',transform:hovered?'scale(1.08)':'scale(1)' }} />

        {/* Badges row */}
        <div style={{ position:'absolute',top:12,left:12,display:'flex',flexDirection:'column',gap:5 }}>
          {p.badge && (
            <span style={{ background: p.badge==='Hot'?'linear-gradient(135deg,#ef4444,#f97316)':p.badge==='New'?'linear-gradient(135deg,#22c55e,#16a34a)':p.badge==='Popular'?'linear-gradient(135deg,#f59e0b,#d97706)':'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff',fontSize:10,fontWeight:900,padding:'4px 11px',borderRadius:100,letterSpacing:'0.4px',boxShadow:'0 2px 8px rgba(0,0,0,0.2)',display:'inline-block' }}>
              {p.badge}
            </span>
          )}
          {discount > 0 && (
            <span style={{ background:'rgba(239,68,68,0.92)',color:'#fff',fontSize:10,fontWeight:900,padding:'3px 10px',borderRadius:100,display:'inline-block' }}>
              -{discount}%
            </span>
          )}
        </div>

        {/* Wishlist btn */}
        <button onClick={e=>{ e.stopPropagation(); onWishlist(); }}
          style={{ position:'absolute',top:12,right:12,width:36,height:36,borderRadius:'50%',background:wishlisted?'#ef4444':'rgba(255,255,255,0.92)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,opacity:hovered||wishlisted?1:0,transition:'all 0.22s ease',boxShadow:'0 2px 12px rgba(0,0,0,0.15)',backdropFilter:'blur(4px)' }}>
          {wishlisted ? '❤️' : '🤍'}
        </button>

        {/* Hover overlay */}
        <div style={{ position:'absolute',inset:0,background:'rgba(12,12,32,0.42)',display:'flex',alignItems:'center',justifyContent:'center',opacity:hovered?1:0,transition:'opacity 0.25s ease' }}>
          <span style={{ background:'#fff',color:'#6366f1',fontSize:13,fontWeight:800,padding:'10px 24px',borderRadius:100,boxShadow:'0 4px 20px rgba(0,0,0,0.2)' }}>
            View details →
          </span>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding:'16px 18px 18px' }}>
        <div data-testid="product-category" style={{ fontSize:10,color:'#6366f1',fontWeight:800,textTransform:'uppercase',letterSpacing:'1.2px',marginBottom:5 }}>{p.category}</div>

        <div onClick={()=>navigate(`/products/${p.slug}`)}
          style={{ fontSize:15,fontWeight:800,color:'#0c0c1d',lineHeight:1.3,marginBottom:8,cursor:'pointer',letterSpacing:'-0.3px' }}>
          {p.name}
        </div>

        {/* Stars */}
        <div style={{ display:'flex',alignItems:'center',gap:5,marginBottom:10 }}>
          <div style={{ display:'flex',gap:1 }}>
            {[1,2,3,4,5].map(s=>(
              <span key={s} style={{ fontSize:12,color:s<=Math.floor(p.rating)?'#f59e0b':'#e5e7eb' }}>★</span>
            ))}
          </div>
          <span style={{ fontSize:12,fontWeight:700,color:'#374151' }}>{p.rating}</span>
          <span style={{ fontSize:11,color:'#9ca3af' }}>({p.reviews.toLocaleString()})</span>
        </div>

        {/* Low stock warning */}
        {lowStock && (
          <div style={{ fontSize:11,color:'#ef4444',fontWeight:700,marginBottom:10,display:'flex',alignItems:'center',gap:4 }}>
            <span style={{ width:6,height:6,borderRadius:'50%',background:'#ef4444',display:'inline-block' }} />
            Only {p.stock} left in stock
          </div>
        )}

        {/* Price row */}
        <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:14,flexWrap:'wrap' }}>
          <span style={{ fontSize:23,fontWeight:900,color:'#0c0c1d',letterSpacing:'-0.8px',lineHeight:1 }}>{fmt(p.price)}</span>
          {p.originalPrice && (
            <span style={{ fontSize:13,color:'#9ca3af',textDecoration:'line-through',fontWeight:500 }}>{fmt(p.originalPrice)}</span>
          )}
          {discount>0 && (
            <span style={{ fontSize:11,background:'rgba(239,68,68,0.08)',color:'#ef4444',fontWeight:800,padding:'2px 7px',borderRadius:6,border:'1px solid rgba(239,68,68,0.15)' }}>
              Save {fmt(p.originalPrice - p.price)}
            </span>
          )}
        </div>

        {/* CTA */}
        <button onClick={onAdd} data-testid="add-to-cart"
          style={{ width:'100%',background:added?'linear-gradient(135deg,#22c55e,#16a34a)':'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',border:'none',borderRadius:12,padding:'12px',fontSize:14,fontWeight:800,cursor:'pointer',fontFamily:'inherit',transition:'all 0.22s ease',boxShadow:added?'0 4px 16px rgba(34,197,94,0.4)':'0 4px 16px rgba(99,102,241,0.3)',letterSpacing:'-0.1px' }}>
          {added ? '✓ Added to cart!' : '+ Add to cart'}
        </button>
      </div>
    </div>
  );
}
