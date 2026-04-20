import React, { useState, useEffect } from 'react';
import styles from './Store.module.css';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api';

function fmt(cents) {
  return '$' + (cents / 100).toFixed(2).replace(/\.00$/, '');
}

function cardType(n) {
  const d = n.replace(/\D/g, '');
  if (d.startsWith('4')) return 'Visa';
  if (d.startsWith('5')) return 'Mastercard';
  if (d.startsWith('34') || d.startsWith('37')) return 'Amex';
  return '';
}

const CATS = ['all', 'analytics', 'testing', 'integrations', 'bundle', 'enterprise'];
const CAT_LABELS = { all: 'All', analytics: 'Analytics', testing: 'Testing', integrations: 'Integrations', bundle: 'Bundles', enterprise: 'Enterprise' };

const BADGE_COLORS = {
  'Popular': { bg: 'rgba(79,142,247,0.15)', color: '#4f8ef7' },
  'Hot': { bg: 'rgba(239,68,68,0.12)', color: '#ef4444' },
  'Best Value': { bg: 'rgba(34,197,94,0.12)', color: '#22c55e' },
  'New': { bg: 'rgba(139,92,246,0.12)', color: '#8b5cf6' },
  'Enterprise': { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
};

export default function Store() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(null);
  const [billing, setBilling] = useState({ name: '', email: '', company: '', country: 'IL' });
  const [card, setCard] = useState({ number: '', expiry: '', cvc: '', name: '' });
  const [cardErr, setCardErr] = useState('');
  const [processing, setProcessing] = useState(false);
  const [order, setOrder] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const url = category === 'all' ? `${API}/products` : `${API}/products?category=${category}`;
    fetch(url).then(r => r.json()).then(d => { setProducts(d.products || []); setLoading(false); }).catch(() => setLoading(false));
  }, [category]);

  function addToCart(p) {
    setCart(prev => {
      const ex = prev.find(i => i.id === p.id);
      if (ex) return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...p, qty: 1 }];
    });
    setToast(`${p.name} added to cart`);
    setTimeout(() => setToast(null), 2500);
  }

  function updateQty(id, delta) {
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i).filter(i => i.qty > 0));
  }

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  function fmtCard(v) {
    const d = v.replace(/\D/g, '').slice(0, 16);
    return d.replace(/(.{4})/g, '$1 ').trim();
  }
  function fmtExpiry(v) {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d;
  }

  async function processPayment(e) {
    e.preventDefault();
    setCardErr('');
    const rawNum = card.number.replace(/\D/g, '');
    if (rawNum.length < 13) { setCardErr('Invalid card number'); return; }
    const [mm, yy] = card.expiry.split('/');
    if (!mm || !yy || parseInt(mm) > 12 || parseInt(mm) < 1) { setCardErr('Invalid expiry date'); return; }
    const now = new Date();
    const exp = new Date(2000 + parseInt(yy), parseInt(mm) - 1);
    if (exp < now) { setCardErr('Card is expired'); return; }
    if (card.cvc.replace(/\D/g, '').length < 3) { setCardErr('Invalid CVC'); return; }

    setProcessing(true);
    try {
      const res = await fetch(`${API}/products/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('ft_token')}` },
        body: JSON.stringify({
          items: cart.map(i => ({ productId: i.id, qty: i.qty })),
          billing,
          card: { number: rawNum, expiry: card.expiry, cvc: card.cvc },
        }),
      });
      const data = await res.json();
      if (!res.ok) { setCardErr(data.error || 'Payment failed'); setProcessing(false); return; }
      setOrder(data.order);
      setCart([]);
      setCheckoutStep('success');
    } catch {
      setCardErr('Network error — please try again');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className={styles.page}>
      {toast && <div className={styles.toast}>✓ {toast}</div>}

      <div className={styles.header}>
        <h2 className={styles.headerTitle}>Marketplace</h2>
        <p className={styles.headerSub}>Add-ons and plans to supercharge your FlowTest workflow</p>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.catBtns}>
          {CATS.map(c => (
            <button key={c} onClick={() => setCategory(c)} className={`${styles.catBtn} ${category === c ? styles.catBtnActive : ''}`}>
              {CAT_LABELS[c]}
            </button>
          ))}
        </div>
        <button onClick={() => setCartOpen(true)} className={styles.cartBtn}>
          🛒 Cart
          {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
        </button>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className={styles.loadingText}>Loading products...</div>
      ) : (
        <div className={styles.productGrid}>
          {products.map(p => <ProductCard key={p.id} p={p} onAdd={() => addToCart(p)} inCart={cart.some(i => i.id === p.id)} />)}
        </div>
      )}

      {/* Cart Drawer */}
      {cartOpen && (
        <div className={styles.drawerOverlay}>
          <div onClick={() => setCartOpen(false)} className={styles.drawerBg} />
          <div className={styles.drawer}>
            <div className={styles.drawerHeader}>
              <span className={styles.drawerTitle}>Shopping Cart ({cartCount})</span>
              <button onClick={() => setCartOpen(false)} className={styles.drawerCloseBtn}>✕</button>
            </div>
            <div className={styles.drawerBody}>
              {cart.length === 0 ? (
                <div className={styles.cartEmpty}>
                  <div className={styles.cartEmptyIcon}>🛒</div>
                  <div className={styles.cartEmptyText}>Your cart is empty</div>
                </div>
              ) : cart.map(item => (
                <div key={item.id} className={styles.cartItem}>
                  <div className={styles.cartItemInfo}>
                    <div className={styles.cartItemName}>{item.name}</div>
                    <div className={styles.cartItemPrice}>{fmt(item.price)}/mo</div>
                  </div>
                  <div className={styles.qtyRow}>
                    <button onClick={() => updateQty(item.id, -1)} className={styles.qtyBtn}>−</button>
                    <span className={styles.qtyVal}>{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className={styles.qtyBtn}>+</button>
                  </div>
                  <div className={styles.cartItemTotal}>{fmt(item.price * item.qty)}</div>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div className={styles.drawerFooter}>
                <div className={styles.cartTotalRow}>
                  <span className={styles.cartTotalLabel}>Total</span>
                  <span className={styles.cartTotalValue}>{fmt(cartTotal)}/mo</span>
                </div>
                <button onClick={() => { setCartOpen(false); setCheckoutStep('billing'); }} className={styles.checkoutBtn}>
                  Proceed to Checkout →
                </button>
                <div className={styles.drawerSecurity}>🔒 Secure 256-bit SSL encryption</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {checkoutStep && checkoutStep !== 'success' && (
        <div className={styles.modalOverlay}>
          <div onClick={() => setCheckoutStep(null)} className={styles.modalBg} />
          <div className={styles.modal}>
            {/* Steps */}
            <div className={styles.stepBar}>
              {[['billing', 'Billing Info', 1], ['payment', 'Payment', 2]].map(([id, label, num], idx) => (
                <React.Fragment key={id}>
                  <div className={styles.stepDotWrap}>
                    <div className={`${styles.stepDot} ${checkoutStep === id ? styles.stepDotActive : (checkoutStep === 'payment' && id === 'billing') ? styles.stepDotDone : styles.stepDotInactive}`}>
                      {checkoutStep === 'payment' && id === 'billing' ? '✓' : num}
                    </div>
                    <span className={`${styles.stepLabel} ${checkoutStep === id ? styles.stepLabelActive : styles.stepLabelInactive}`}>{label}</span>
                  </div>
                  {idx < 1 && <div className={styles.stepConnector} />}
                </React.Fragment>
              ))}
            </div>

            {checkoutStep === 'billing' && (
              <form onSubmit={e => { e.preventDefault(); setCheckoutStep('payment'); }}>
                <h3 className={styles.formTitle}>Billing Information</h3>
                <div className={styles.formFields}>
                  <CField label="Full Name" value={billing.name} onChange={v => setBilling(p => ({ ...p, name: v }))} placeholder="Yoni Natan" required />
                  <CField label="Email Address" type="email" value={billing.email} onChange={v => setBilling(p => ({ ...p, email: v }))} placeholder="you@company.io" required />
                  <CField label="Company (optional)" value={billing.company} onChange={v => setBilling(p => ({ ...p, company: v }))} placeholder="Acme Inc." />
                  <div>
                    <label className={styles.fieldLabel}>Country</label>
                    <select value={billing.country} onChange={e => setBilling(p => ({ ...p, country: e.target.value }))} className={styles.fieldSelect}>
                      {[['IL','Israel'],['US','United States'],['GB','United Kingdom'],['DE','Germany'],['FR','France'],['CA','Canada'],['AU','Australia'],['SG','Singapore'],['IN','India']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                </div>
                <div className={styles.orderSummary}>
                  <div className={styles.orderSummaryLabel}>Order Summary</div>
                  {cart.map(i => <div key={i.id} className={styles.orderItem}><span>{i.name} ×{i.qty}</span><span>{fmt(i.price * i.qty)}</span></div>)}
                  <div className={styles.orderTotal}><span>Total</span><span>{fmt(cartTotal)}/mo</span></div>
                </div>
                <button type="submit" className={styles.submitBtn}>Continue to Payment →</button>
                <button type="button" onClick={() => { setCheckoutStep(null); setCartOpen(true); }} className={styles.backBtn}>← Back to Cart</button>
              </form>
            )}

            {checkoutStep === 'payment' && (
              <form onSubmit={processPayment}>
                <h3 className={styles.formTitle}>Payment</h3>
                <p className={styles.paySubtitle}>Test card: 4242 4242 4242 4242 · Any future date · Any CVC</p>
                <div className={styles.formFields}>
                  <div>
                    <label className={styles.fieldLabel}>Card Number</label>
                    <div className={styles.cardNumberWrap}>
                      <input value={card.number} onChange={e => setCard(p => ({ ...p, number: fmtCard(e.target.value) }))} placeholder="4242 4242 4242 4242" maxLength={19} required className={styles.fieldInput} style={{ paddingRight: 60 }} />
                      {cardType(card.number) && <span className={styles.cardTypeTag}>{cardType(card.number)}</span>}
                    </div>
                  </div>
                  <CField label="Name on Card" value={card.name} onChange={v => setCard(p => ({ ...p, name: v }))} placeholder="Yoni Natan" required />
                  <div className={styles.expiryRow}>
                    <div className={styles.expiryField}>
                      <label className={styles.fieldLabel}>Expiry</label>
                      <input value={card.expiry} onChange={e => setCard(p => ({ ...p, expiry: fmtExpiry(e.target.value) }))} placeholder="MM/YY" maxLength={5} required className={styles.fieldInput} />
                    </div>
                    <div className={styles.expiryField}>
                      <label className={styles.fieldLabel}>CVC</label>
                      <input value={card.cvc} onChange={e => setCard(p => ({ ...p, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) }))} placeholder="123" maxLength={4} required className={styles.fieldInput} />
                    </div>
                  </div>
                </div>
                {cardErr && <div className={styles.cardErr}>{cardErr}</div>}
                <div className={styles.totalRow}>
                  <span className={styles.totalLabel}>Total charged today</span>
                  <span className={styles.totalValue}>{fmt(cartTotal)}</span>
                </div>
                <button type="submit" disabled={processing} className={styles.submitBtn} style={{ opacity: processing ? 0.7 : 1, cursor: processing ? 'not-allowed' : 'pointer' }}>
                  {processing ? '⏳ Processing...' : `🔒 Pay ${fmt(cartTotal)} →`}
                </button>
                <button type="button" onClick={() => setCheckoutStep('billing')} className={styles.backBtn}>← Back</button>
                <div className={styles.paySecurity}>Your payment is secured with 256-bit SSL encryption</div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Success Modal */}
      {checkoutStep === 'success' && order && (
        <div className={styles.modalOverlay}>
          <div onClick={() => setCheckoutStep(null)} className={styles.modalBg} />
          <div className={styles.successModal}>
            <div className={styles.successIcon}>✓</div>
            <h2 className={styles.successTitle}>Payment Successful!</h2>
            <p className={styles.successSubtitle}>Order <span className={styles.successOrderId}>{order.id}</span> confirmed.</p>
            <div className={styles.successItems}>
              {order.items.map(i => (
                <div key={i.productId} className={styles.successItem}>
                  <span>{i.name} ×{i.qty}</span>
                  <span className={styles.successItemValue}>{fmt(i.price * i.qty)}</span>
                </div>
              ))}
              <div className={styles.successTotal}>
                <span>Total</span>
                <span className={styles.successTotalValue}>{fmt(order.total)}/mo</span>
              </div>
            </div>
            <p className={styles.successNote}>A receipt has been sent to <strong>{order.billing.email}</strong>. Your features are now active.</p>
            <button onClick={() => setCheckoutStep(null)} className={styles.successBtn}>Back to Marketplace</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductCard({ p, onAdd, inCart }) {
  const badge = BADGE_COLORS[p.badge];
  return (
    <div className={styles.productCard}>
      {p.badge === 'Best Value' && <div className={styles.bestValueGlow} />}
      {badge && (
        <span className={styles.productBadge} style={{ background: badge.bg, color: badge.color }}>{p.badge}</span>
      )}
      <div className={styles.productName}>{p.name}</div>
      <div className={styles.productDesc}>{p.description}</div>
      <ul className={styles.featureList}>
        {(p.features || []).slice(0, 4).map((f, i) => (
          <li key={i} className={styles.featureItem}>
            <span className={styles.featureCheck}>✓</span>{f}
          </li>
        ))}
      </ul>
      <div className={styles.productFooter}>
        <div>
          <span className={styles.productPrice}>{fmt(p.price)}</span>
          <span className={styles.productPricePer}>/mo</span>
        </div>
        <button onClick={onAdd} className={`${styles.addBtn} ${inCart ? styles.addBtnInCart : styles.addBtnDefault}`}>
          {inCart ? '✓ In Cart' : '+ Add to Cart'}
        </button>
      </div>
    </div>
  );
}

function CField({ label, type = 'text', value, onChange, placeholder, required }) {
  return (
    <div>
      <label className={styles.fieldLabel}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={styles.fieldInput}
      />
    </div>
  );
}
