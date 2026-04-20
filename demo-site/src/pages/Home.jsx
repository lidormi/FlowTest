import React, { useState, useEffect, useRef } from 'react';
import { navigate } from '../App.jsx';
import { useCart } from '../App.jsx';
import { PRODUCTS, fmt } from '../data/products.js';
import styles from './Home.module.css';

/* ── Animated counter ── */
function useCounter(target, duration = 1800) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting && !started) setStarted(true); }, { threshold: 0.5 });
    obs.observe(el); return () => obs.disconnect();
  }, [started]);
  useEffect(() => {
    if (!started) return;
    let startTs = null;
    const step = ts => {
      if (!startTs) startTs = ts;
      const p = Math.min((ts - startTs) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setCount(Math.floor(ease * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, target, duration]);
  return [count, ref];
}

export default function Home() {
  const { addToCart } = useCart();
  const [addedId, setAddedId] = useState(null);
  const featured = PRODUCTS.slice(0, 4);
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

  function handleAdd(p) { addToCart(p); setAddedId(p.id); setTimeout(() => setAddedId(null), 1500); }

  return (
    <div className={styles.page}>

      {/* ══ HERO ══ */}
      <section className={`${styles.hero} fade-in-up`}>
        <div className={styles.orb1} />
        <div className={styles.orb2} />
        <div className={styles.orb3} />
        <div className={styles.heroBg} />

        <div className={styles.heroContent}>
          <div className={styles.heroTag}>
            <span className={`${styles.heroDot} dot-pulse`} />
            <span className={styles.heroTagText}>New arrivals — Spring 2025</span>
          </div>

          <h1 className={`${styles.heroTitle} hero-title`}>
            Shop Smarter.<br />Live Better.
          </h1>

          <p className={styles.heroSub}>
            Premium tech, studio-grade audio, and smart accessories — handpicked for creators who demand the best.
          </p>

          <div className={styles.heroButtons}>
            <button
              onClick={() => navigate('/products')}
              data-testid="shop-now-btn"
              className={`${styles.heroPrimaryBtn} glow-btn`}
            >
              Shop now →
            </button>
            <button onClick={() => navigate('/products')} className={styles.heroSecondaryBtn}>
              View catalog
            </button>
          </div>

          <div className={styles.heroBadges}>
            {[['⭐','4.9/5 rating'],['🚚','Free shipping $50+'],['🔒','Secure checkout'],['↩️','30-day returns']].map(([icon,text]) => (
              <div key={text} className={styles.heroBadge}>
                <span className={styles.heroBadgeIcon}>{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Floating cards */}
        <div className={`${styles.floatCardRight} float-anim`}>
          <div className={styles.floatCardIconBlue}>🎧</div>
          <div>
            <div className={styles.floatCardTitle}>Studio Headphones</div>
            <div className={styles.floatCardPrices}>
              <span className={styles.floatCardOldPrice}>$109</span>
              <span className={styles.floatCardNewPrice}>$79.00</span>
            </div>
          </div>
        </div>

        <div className={`${styles.floatCardLeft} float-anim`}>
          <div className={styles.floatCardIconPurple}>⌨️</div>
          <div>
            <div className={styles.floatCardTitle}>Mech Keyboard Pro</div>
            <div className={styles.floatCardPrices}>
              <span className={styles.floatCardOldPrice}>$189</span>
              <span className={styles.floatCardNewPrice}>$149.00</span>
            </div>
          </div>
        </div>

        {/* Recently sold badge */}
        <div className={`${styles.soldBadge} float-anim`}>
          <span className={styles.soldDot} />
          <span className={styles.soldText}>12 people bought this today</span>
        </div>

        {/* Scroll cue */}
        <div className={`${styles.scrollCue} float-anim`}>
          <span>Scroll</span>
          <div className={styles.scrollCueLine} />
        </div>
      </section>

      {/* ══ TRUST / MARQUEE BAR ══ */}
      <div className={styles.marqueeBar}>
        <div className={styles.marqueeTrack}>
          {[...Array(2)].map((_,ri) => (
            <div key={ri} style={{ display:'flex', alignItems:'center', gap:0 }}>
              {[
                ['🚚','Free shipping on orders $50+'],['🔒','256-bit SSL encryption'],['↩️','30-day free returns'],
                ['⭐','4.9/5 from 12,400+ reviews'],['🎁','Gift wrapping available'],['💬','24/7 customer support'],
                ['🏆','#1 rated tech accessories 2025'],['⚡','Same-day dispatch before 2pm'],
              ].map(([icon,text]) => (
                <div key={text} className={styles.marqueeItem}>
                  <span className={styles.marqueeItemIcon}>{icon}</span>
                  <span className={styles.marqueeItemText}>{text}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ══ FLASH DEALS ══ */}
      <section className={styles.flashDeals}>
        <div className={styles.flashInner}>
          <div className={styles.flashLeft}>
            <span className={styles.flashEmoji}>⚡</span>
            <span className={styles.flashLabel}>Flash Deals</span>
            <span className={styles.flashEnds}>ends in</span>
          </div>
          <div className={styles.flashTimer}>
            {[String(time.h).padStart(2,'0'), String(time.m).padStart(2,'0'), String(time.s).padStart(2,'0')].map((v,i) => (
              <React.Fragment key={i}>
                <span className={styles.flashDigit}>{v}</span>
                {i < 2 && <span className={styles.flashSep}>:</span>}
              </React.Fragment>
            ))}
          </div>
          <div className={styles.flashRight}>
            <span className={styles.flashUpTo}>Up to 30% off</span>
            <button onClick={() => navigate('/products')} className={styles.flashCta}>
              See all deals →
            </button>
          </div>
        </div>
      </section>

      {/* ══ STATS ══ */}
      <StatsBar />

      {/* ══ CATEGORIES ══ */}
      <section className={styles.categoriesSection}>
        <SectionHeader title="Shop by Category" sub="Find exactly what you need" />
        <div className={styles.categoriesGrid}>
          {[
            { name:'Audio',       icon:'🎧', img:'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80' },
            { name:'Peripherals', icon:'⌨️', img:'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80' },
            { name:'Accessories', icon:'🔌', img:'https://images.unsplash.com/photo-1625895197185-efcec01cffe0?w=600&q=80' },
            { name:'Clothing',    icon:'👕', img:'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80' },
            { name:'Pet Food',    icon:'🐕', img:'https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?w=600&q=80' },
            { name:'Furniture',   icon:'🪑', img:'https://images.unsplash.com/photo-1505843490701-5be4e3f52f5e?w=600&q=80' },
          ].map(cat => (
            <div
              key={cat.name}
              className={styles.catCard}
              onClick={() => navigate('/products?cat=' + encodeURIComponent(cat.name))}
            >
              <img src={cat.img} alt={cat.name} />
              <div className={styles.catOverlay} />
              <div className={styles.catContent}>
                <span className={styles.catIcon}>{cat.icon}</span>
                <span className={styles.catCount}>
                  {PRODUCTS.filter(p => p.category === cat.name).length} products
                </span>
                <span className={styles.catName}>{cat.name}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ FEATURED PRODUCTS ══ */}
      <section className={styles.featuredSection}>
        <div className={styles.featuredHeader}>
          <SectionHeader title="Featured Products" sub="Handpicked for your setup" noMargin />
          <button onClick={() => navigate('/products')} className={styles.viewAllBtn}>
            View all →
          </button>
        </div>
        <div className={styles.productsGrid}>
          {featured.map(p => (
            <ProductCard key={p.id} p={p} added={addedId === p.id} onAdd={() => handleAdd(p)} />
          ))}
        </div>
      </section>

      {/* ══ SALE BANNER ══ */}
      <section className={styles.saleBannerSection}>
        <div className={styles.saleBannerInner}>
          <div className={styles.saleBubble1} />
          <div className={styles.saleBubble2} />
          <div className={styles.saleBannerContent}>
            <div className={styles.saleLimited}>Limited time</div>
            <h2 className={styles.saleTitle}>
              Up to 30% off<br />selected items
            </h2>
            <p className={styles.saleCode}>
              Use code <strong className={styles.saleCodeHighlight}>SAVE30</strong> at checkout
            </p>
          </div>
          <button onClick={() => navigate('/products')} className={styles.saleBtn}>
            Shop the sale →
          </button>
        </div>
      </section>

      {/* ══ VISION ══ */}
      <VisionSection />

      {/* ══ TESTIMONIALS ══ */}
      <TestimonialsSection />

      {/* ══ CTA BANNER ══ */}
      <section className={styles.cta}>
        <div className={styles.ctaBg} />
        <div className={styles.ctaContent}>
          <div className={`${styles.ctaEmoji} float-anim`}>🚀</div>
          <h2 className={styles.ctaTitle}>
            Ready to upgrade<br />your setup?
          </h2>
          <p className={styles.ctaSub}>
            Join 50,000+ creators who trust ShopFlow for premium tech gear. Free shipping on your first order.
          </p>
          <button onClick={() => navigate('/products')} className={`${styles.ctaBtn} glow-btn`}>
            Start shopping →
          </button>
          <div className={styles.ctaNote}>No credit card required for free account</div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerGrid}>
            <div>
              <div className={styles.footerBrand}>
                <div className={styles.footerLogoIcon}>SF</div>
                <span className={styles.footerLogoName}>ShopFlow</span>
              </div>
              <p className={styles.footerDesc}>Premium tech gear for creators who demand the best.</p>
            </div>
            {[
              { title:'Shop',    links:[['/',['Home']],['/products',['Products']],['/products',['Sale']],['/cart',['Cart']]] },
              { title:'Account', links:[['/login',['Sign in']],['/login',['Register']]] },
              { title:'Support', links:[['#',['Help Center']],['#',['Returns']],['#',['Contact us']]] },
            ].map(col => (
              <div key={col.title}>
                <div className={styles.footerColTitle}>{col.title}</div>
                <div className={styles.footerLinks}>
                  {col.links.map(([path,[label]]) => (
                    <button key={label} onClick={() => navigate(path)} className={styles.footerLink}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className={styles.footerBottom}>
            <span className={styles.footerCopyright}>© 2025 ShopFlow Demo Store · <em>Monitored by FlowTest Analytics</em></span>
            <div className={styles.footerLegal}>
              {['Privacy','Terms','Cookies'].map(l => (
                <span key={l} className={styles.footerLegalLink}>{l}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── Sub-components ── */

function SectionHeader({ title, sub, noMargin }) {
  return (
    <div className={noMargin ? styles.sectionHeaderNoMargin : styles.sectionHeader}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <p className={styles.sectionSub}>{sub}</p>
    </div>
  );
}

function StatsBar() {
  const items = [
    { target:50000, suffix:'+',  label:'Happy Customers', icon:'👥' },
    { target:200,   suffix:'+',  label:'Products',        icon:'📦' },
    { target:49,    suffix:'/5', label:'Avg Rating',      icon:'⭐', decimal:true },
    { target:99,    suffix:'%',  label:'Satisfaction',    icon:'💎' },
  ];
  return (
    <section className={styles.statsBar}>
      <div className={styles.statsGrid}>
        {items.map(s => <StatCard key={s.label} {...s} />)}
      </div>
    </section>
  );
}

function StatCard({ target, suffix, label, icon, decimal }) {
  const [count, ref] = useCounter(target, 2000);
  const display = decimal ? (count / 10).toFixed(1) : count.toLocaleString();
  return (
    <div ref={ref} className={styles.statCard}>
      <div className={styles.statIcon}>{icon}</div>
      <div className={styles.statValue}>
        {display}<span className={styles.statSuffix}>{suffix}</span>
      </div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
}

function ProductCard({ p, added, onAdd }) {
  const discount = p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;
  const badgeClass = p.badge === 'Hot' ? styles.productBadgeHot
    : p.badge === 'New'     ? styles.productBadgeNew
    : p.badge === 'Popular' ? styles.productBadgePopular
    : styles.productBadgeSale;

  return (
    <div data-testid="product-card" className={styles.productCard}>
      <div className={styles.productImageWrap} onClick={() => navigate(`/products/${p.slug}`)}>
        <img src={p.image} alt={p.name} loading="lazy" />
        {p.badge && (
          <span className={`${styles.productBadge} ${badgeClass}`}>{p.badge}</span>
        )}
        {discount > 0 && (
          <span
            className={styles.discountBadge}
            style={{ top: p.badge ? 40 : 10 }}
          >
            -{discount}%
          </span>
        )}
        <div className={styles.quickView}>
          <span className={styles.quickViewLabel}>Quick view →</span>
        </div>
      </div>

      <div className={styles.productBody}>
        <div data-testid="product-category" className={styles.productCategory}>{p.category}</div>
        <div className={styles.productName} onClick={() => navigate(`/products/${p.slug}`)}>
          {p.name}
        </div>
        <div className={styles.productRating}>
          <span className={styles.productStars}>{'★'.repeat(Math.floor(p.rating))}</span>
          <span className={styles.productReviews}>({p.reviews} reviews)</span>
        </div>
        <div className={styles.productPriceRow}>
          <span className={styles.productPrice}>{fmt(p.price)}</span>
          {p.originalPrice && <span className={styles.productOldPrice}>{fmt(p.originalPrice)}</span>}
        </div>
        <button
          onClick={onAdd}
          data-testid="add-to-cart"
          className={`${styles.addBtn} ${added ? styles.addBtnAdded : ''}`}
        >
          {added ? '✓ Added!' : '+ Add to cart'}
        </button>
      </div>
    </div>
  );
}

function VisionSection() {
  const pillars = [
    { icon:'⚡', title:'Built for Speed',     desc:'Every product tested for performance. We partner only with brands that meet our quality bar.' },
    { icon:'🎯', title:'Curated for Creators', desc:'No noise, just signal. Our team handpicks every SKU so you can shop with confidence.' },
    { icon:'🛡️', title:'Protected Always',     desc:'2-year warranty, 30-day returns, and 256-bit checkout security. Zero compromises.' },
  ];
  return (
    <section className={styles.vision}>
      <div className={styles.visionInner}>
        <div className={styles.visionHeader}>
          <div className={styles.visionTag}>
            <span className={styles.visionTagText}>Our Vision</span>
          </div>
          <h2 className={styles.visionTitle}>
            We believe great tools<br />change how you create.
          </h2>
          <p className={styles.visionSub}>
            ShopFlow was built by creators, for creators — on the belief that the right gear unlocks your full potential.
          </p>
        </div>
        <div className={styles.visionGrid}>
          {pillars.map(p => (
            <div key={p.title} className={styles.visionCard}>
              <div className={styles.visionCardIcon}>{p.icon}</div>
              <h3 className={styles.visionCardTitle}>{p.title}</h3>
              <p className={styles.visionCardDesc}>{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const reviews = [
    { name:'Sarah K.',  role:'UX Designer',      text:'The keyboard completely changed my workflow. Best purchase of the year, hands down.', stars:5, initials:'SK', color:'linear-gradient(135deg,#6366f1,#8b5cf6)' },
    { name:'Mark T.',   role:'Software Engineer', text:'Shipped fast, packaging was immaculate, and the product is exactly as described.',    stars:5, initials:'MT', color:'linear-gradient(135deg,#e879f9,#6366f1)' },
    { name:'Priya M.',  role:'Content Creator',   text:'The webcam quality is insane for the price. Recommended it to my entire team!',       stars:5, initials:'PM', color:'linear-gradient(135deg,#f59e0b,#ef4444)' },
  ];
  return (
    <section className={styles.testimonials}>
      <div className={styles.testimonialsInner}>
        <div className={styles.testimonialsHeader}>
          <h2 className={styles.testimonialsTitle}>Loved by 50,000+ customers</h2>
          <div className={styles.testimonialsRating}>
            <span className={styles.testimonialsStars}>★★★★★</span>
            <span className={styles.testimonialsCount}>4.9 out of 5 · 12,400+ verified reviews</span>
          </div>
        </div>
        <div className={styles.testimonialsGrid}>
          {reviews.map(r => (
            <div key={r.name} className={styles.reviewCard}>
              <div className={styles.reviewStars}>
                {'★★★★★'.split('').map((_,i) => <span key={i} className={styles.reviewStar}>★</span>)}
              </div>
              <p className={styles.reviewText}>"{r.text}"</p>
              <div className={styles.reviewAuthor}>
                <div className={styles.reviewAvatar} style={{ background: r.color }}>{r.initials}</div>
                <div>
                  <div className={styles.reviewName}>{r.name}</div>
                  <div className={styles.reviewRole}>{r.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
