import React, { useState, useMemo, useEffect } from 'react';
import { navigate, useCart } from '../App.jsx';
import { PRODUCTS, fmt } from '../data/products.js';
import styles from './Products.module.css';

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
  const [cat, setCat]               = useState('All');
  const [sort, setSort]             = useState('default');
  const [added, setAdded]           = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch]         = useState('');
  const [priceRange, setPriceRange] = useState(null);
  const [minRating, setMinRating]   = useState(0);
  const [freeOnly, setFreeOnly]     = useState(false);
  const [wishlist, setWishlist]     = useState(new Set());

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q   = params.get('q')   || '';
    const cat = params.get('cat') || '';
    if (q)   { setSearch(q); setSearchInput(q); }
    if (cat && CATS.includes(cat)) setCat(cat);
  }, [location.search]);

  const list = useMemo(() => {
    let f = PRODUCTS;
    if (cat !== 'All') f = f.filter(p => p.category === cat);
    if (search)        f = f.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase()));
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
    addToCart(p); setAdded(p.id); setTimeout(() => setAdded(null), 1600);
  }
  function toggleWishlist(id) {
    setWishlist(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function clearFilters() {
    setCat('All'); setPriceRange(null); setMinRating(0); setFreeOnly(false); setSearch(''); setSearchInput('');
  }
  const hasFilters = cat !== 'All' || priceRange || minRating > 0 || freeOnly || search;

  return (
    <div className={styles.page}>

      {/* ══ HERO ══ */}
      <div className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroInner}>
          <div className={styles.heroTag}>
            <span className={styles.heroTagDot} />
            <span className={styles.heroTagText}>{PRODUCTS.length} products · free shipping $50+</span>
          </div>
          <h1 className={styles.heroTitle}>Shop Our Collection</h1>
          <p className={styles.heroSub}>Premium tech gear, handpicked for creators who demand the best</p>

          <form
            className={styles.searchForm}
            onSubmit={e => { e.preventDefault(); setSearch(searchInput); }}
          >
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search headphones, keyboards, accessories..."
              className={styles.searchInput}
            />
            <button type="submit" className={styles.searchBtn}>🔍</button>
          </form>
        </div>
      </div>

      {/* ══ BODY ══ */}
      <div className={styles.body}>

        {/* ── SIDEBAR ── */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarCard}>

            <div className={styles.sidebarHeader}>
              <span className={styles.sidebarHeaderTitle}>Filters</span>
              {hasFilters && (
                <button onClick={clearFilters} className={styles.clearBtn}>Clear all</button>
              )}
            </div>

            {/* Category */}
            <FilterSection title="Category">
              {CATS.map(c => (
                <SidebarBtn
                  key={c}
                  active={cat === c}
                  onClick={() => setCat(c)}
                  label={`${CAT_ICONS[c]}  ${c === 'All' ? 'All Products' : c}`}
                  count={c === 'All' ? PRODUCTS.length : PRODUCTS.filter(p => p.category === c).length}
                />
              ))}
            </FilterSection>

            {/* Price */}
            <FilterSection title="Price Range">
              <RadioBtn active={priceRange === null} onClick={() => setPriceRange(null)} label="Any price" />
              {PRICE_RANGES.map(r => (
                <RadioBtn key={r.label} active={priceRange === r} onClick={() => setPriceRange(r)} label={r.label} />
              ))}
            </FilterSection>

            {/* Rating */}
            <FilterSection title="Min Rating">
              <RadioBtn active={minRating === 0} onClick={() => setMinRating(0)} label="All ratings" />
              {[[4,'★★★★☆ 4.0+'],[4.5,'★★★★½ 4.5+'],[4.8,'★★★★★ 4.8+']].map(([val,label]) => (
                <RadioBtn key={val} active={minRating === val} onClick={() => setMinRating(val)} label={label} />
              ))}
            </FilterSection>

            {/* Shipping toggle */}
            <div className={styles.shippingSection}>
              <div className={styles.shippingTitle}>Shipping</div>
              <div className={styles.shippingToggle} onClick={() => setFreeOnly(!freeOnly)}>
                <div className={`${styles.toggleTrack} ${freeOnly ? styles.toggleTrackOn : ''}`}>
                  <div className={`${styles.toggleThumb} ${freeOnly ? styles.toggleThumbOn : ''}`} />
                </div>
                <div>
                  <div className={styles.shippingLabelMain}>Free Shipping Only</div>
                  <div className={styles.shippingLabelSub}>Orders over $50</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sale banner */}
          <div className={styles.sidebarSale}>
            <div className={styles.sidebarSaleBubble} />
            <div className={styles.sidebarSaleEmoji}>🏷️</div>
            <div className={styles.sidebarSaleTitle}>Sale up to 30% off</div>
            <div className={styles.sidebarSaleSub}>Limited time offer on select items</div>
            <button onClick={() => setSort('discount')} className={styles.sidebarSaleBtn}>
              Shop sale →
            </button>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <div className={styles.main}>

          {/* Results bar */}
          <div className={styles.resultsBar}>
            <div className={styles.resultsLeft}>
              <span className={styles.resultsCount}>
                <strong className={styles.resultsCountBold}>{list.length}</strong>{' '}
                {list.length === 1 ? 'product' : 'products'}
                {cat !== 'All' && <span className={styles.resultsCountDim}> in {cat}</span>}
                {search && <span className={styles.resultsCountDim}> for "{search}"</span>}
              </span>
              {cat !== 'All'  && <Chip label={cat} onRemove={() => setCat('All')} />}
              {priceRange     && <Chip label={priceRange.label} onRemove={() => setPriceRange(null)} />}
              {minRating > 0  && <Chip label={`★ ${minRating}+`} onRemove={() => setMinRating(0)} />}
              {freeOnly       && <Chip label="Free shipping" onRemove={() => setFreeOnly(false)} />}
              {search         && <Chip label={`"${search}"`} onRemove={() => { setSearch(''); setSearchInput(''); }} />}
            </div>
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className={styles.sortSelect}
            >
              {SORT_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Grid */}
          {list.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateEmoji}>🔍</div>
              <div className={styles.emptyStateTitle}>No products found</div>
              <div className={styles.emptyStateSub}>Try adjusting your filters or search terms</div>
              <button onClick={clearFilters} className={styles.emptyStateBtn}>Clear all filters</button>
            </div>
          ) : (
            <div className={styles.productsGrid}>
              {list.map(p => (
                <Card
                  key={p.id}
                  p={p}
                  added={added === p.id}
                  onAdd={() => handleAdd(p)}
                  wishlisted={wishlist.has(p.id)}
                  onWishlist={() => toggleWishlist(p.id)}
                />
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
    <div className={styles.filterSection}>
      <div className={styles.filterSectionTitle}>{title}</div>
      <div className={styles.filterSectionItems}>{children}</div>
    </div>
  );
}

function SidebarBtn({ active, onClick, label, count }) {
  return (
    <button
      onClick={onClick}
      className={`${styles.sidebarBtn} ${active ? styles.sidebarBtnActive : ''}`}
    >
      <span>{label}</span>
      <span className={`${styles.sidebarBtnCount} ${active ? styles.sidebarBtnCountActive : ''}`}>
        {count}
      </span>
    </button>
  );
}

function RadioBtn({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`${styles.radioBtn} ${active ? styles.radioBtnActive : ''}`}
    >
      <span className={`${styles.radioDot} ${active ? styles.radioDotActive : ''}`}>
        {active && <span className={styles.radioDotInner} />}
      </span>
      {label}
    </button>
  );
}

function Chip({ label, onRemove }) {
  return (
    <span className={styles.chip}>
      {label}
      <button onClick={onRemove} className={styles.chipRemove}>×</button>
    </span>
  );
}

function Card({ p, added, onAdd, wishlisted, onWishlist }) {
  const discount = p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;
  const lowStock = p.stock <= 10;
  const badgeClass = p.badge === 'Hot' ? styles.badgeHot
    : p.badge === 'New'     ? styles.badgeNew
    : p.badge === 'Popular' ? styles.badgePopular
    : styles.badgeSale;

  return (
    <div data-testid="product-card" className={styles.card}>

      <div className={styles.cardImage} onClick={() => navigate(`/products/${p.slug}`)}>
        <img src={p.image} alt={p.name} loading="lazy" />

        <div className={styles.badgeRow}>
          {p.badge && <span className={`${styles.badge} ${badgeClass}`}>{p.badge}</span>}
          {discount > 0 && <span className={styles.discountBadge}>-{discount}%</span>}
        </div>

        <button
          onClick={e => { e.stopPropagation(); onWishlist(); }}
          className={`${styles.wishlistBtn} ${wishlisted ? styles.wishlistBtnActive : ''}`}
        >
          {wishlisted ? '❤️' : '🤍'}
        </button>

        <div className={styles.hoverOverlay}>
          <span className={styles.hoverOverlayLabel}>View details →</span>
        </div>
      </div>

      <div className={styles.cardBody}>
        <div data-testid="product-category" className={styles.cardCategory}>{p.category}</div>

        <div className={styles.cardName} onClick={() => navigate(`/products/${p.slug}`)}>
          {p.name}
        </div>

        <div className={styles.cardStars}>
          <div className={styles.cardStarRow}>
            {[1,2,3,4,5].map(s => (
              <span key={s} className={`${styles.cardStar} ${s <= Math.floor(p.rating) ? styles.cardStarFilled : ''}`}>★</span>
            ))}
          </div>
          <span className={styles.cardRatingVal}>{p.rating}</span>
          <span className={styles.cardReviews}>({p.reviews.toLocaleString()})</span>
        </div>

        {lowStock && (
          <div className={styles.lowStock}>
            <span className={styles.lowStockDot} />
            Only {p.stock} left in stock
          </div>
        )}

        <div className={styles.priceRow}>
          <span className={styles.price}>{fmt(p.price)}</span>
          {p.originalPrice && <span className={styles.oldPrice}>{fmt(p.originalPrice)}</span>}
          {discount > 0 && (
            <span className={styles.saveBadge}>Save {fmt(p.originalPrice - p.price)}</span>
          )}
        </div>

        <button
          onClick={onAdd}
          data-testid="add-to-cart"
          className={`${styles.addBtn} ${added ? styles.addBtnAdded : ''}`}
        >
          {added ? '✓ Added to cart!' : '+ Add to cart'}
        </button>
      </div>
    </div>
  );
}
