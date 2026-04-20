import React, { useState, useEffect, useCallback } from 'react';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api';

function fmt(cents) {
  return '$' + (cents / 100).toFixed(2).replace(/\.00$/, '');
}

function luhn(num) {
  const d = num.replace(/\D/g, '');
  let s = 0;
  for (let i = 0; i < d.length; i++) {
    let x = parseInt(d[d.length - 1 - i]);
    if (i % 2 === 1) { x *= 2; if (x > 9) x -= 9; }
    s += x;
  }
  return s % 10 === 0;
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
  const [checkoutStep, setCheckoutStep] = useState(null); // null | 'billing' | 'payment' | 'success'
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
    <div style={{ position: 'relative' }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#22c55e', color: '#fff', borderRadius: 10, padding: '10px 22px', fontSize: 13, fontWeight: 600, zIndex: 9999, animation: 'fadeUp .3s ease', pointerEvents: 'none', boxShadow: '0 4px 24px rgba(34,197,94,0.3)' }}>
          ✓ {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px', letterSpacing: '-0.4px' }}>Marketplace</h2>
        <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0 }}>Add-ons and plans to supercharge your FlowTest workflow</p>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 22, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6, flex: 1, flexWrap: 'wrap' }}>
          {CATS.map(c => (
            <button key={c} onClick={() => setCategory(c)} style={{ padding: '6px 14px', borderRadius: 8, border: category === c ? '1px solid var(--blue)' : '1px solid var(--border)', background: category === c ? 'rgba(79,142,247,0.12)' : 'var(--bg2)', color: category === c ? 'var(--blue)' : 'var(--text2)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}>
              {CAT_LABELS[c]}
            </button>
          ))}
        </div>
        <button onClick={() => setCartOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'linear-gradient(135deg,var(--blue),#6366f1)', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', position: 'relative' }}>
          🛒 Cart
          {cartCount > 0 && <span style={{ background: '#ef4444', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{cartCount}</span>}
        </button>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text3)' }}>Loading products...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 16 }}>
          {products.map(p => <ProductCard key={p.id} p={p} onAdd={() => addToCart(p)} inCart={cart.some(i => i.id === p.id)} />)}
        </div>
      )}

      {/* Cart Drawer */}
      {cartOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 800 }}>
          <div onClick={() => setCartOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 380, background: 'var(--bg2)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', animation: 'slideInRight .25s ease' }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>Shopping Cart ({cartCount})</span>
              <button onClick={() => setCartOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)' }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>🛒</div>
                  <div style={{ fontSize: 13 }}>Your cart is empty</div>
                </div>
              ) : cart.map(item => (
                <div key={item.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)' }}>{fmt(item.price)}/mo</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={() => updateQty(item.id, -1)} style={qBtnStyle}>−</button>
                    <span style={{ fontSize: 13, fontWeight: 600, minWidth: 16, textAlign: 'center' }}>{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} style={qBtnStyle}>+</button>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue)', minWidth: 60, textAlign: 'right' }}>{fmt(item.price * item.qty)}</div>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, fontSize: 14 }}>
                  <span style={{ color: 'var(--text2)' }}>Total</span>
                  <span style={{ fontWeight: 700, fontSize: 16 }}>{fmt(cartTotal)}/mo</span>
                </div>
                <button onClick={() => { setCartOpen(false); setCheckoutStep('billing'); }} style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg,var(--blue),#6366f1)', color: '#fff', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Proceed to Checkout →
                </button>
                <div style={{ textAlign: 'center', marginTop: 10, fontSize: 11, color: 'var(--text3)' }}>🔒 Secure 256-bit SSL encryption</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {checkoutStep && checkoutStep !== 'success' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={() => setCheckoutStep(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)' }} />
          <div style={{ position: 'relative', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', padding: 32, animation: 'scaleIn .2s ease' }}>
            {/* Steps */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28 }}>
              {[['billing', 'Billing Info', 1], ['payment', 'Payment', 2]].map(([id, label, num], idx) => (
                <React.Fragment key={id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: checkoutStep === id ? 'var(--blue)' : (checkoutStep === 'payment' && id === 'billing') ? 'var(--green)' : 'var(--bg3)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: (checkoutStep === id || (checkoutStep === 'payment' && id === 'billing')) ? '#fff' : 'var(--text3)' }}>
                      {checkoutStep === 'payment' && id === 'billing' ? '✓' : num}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: checkoutStep === id ? 600 : 400, color: checkoutStep === id ? 'var(--text)' : 'var(--text3)' }}>{label}</span>
                  </div>
                  {idx < 1 && <div style={{ flex: 1, height: 1, background: 'var(--border)', margin: '0 10px' }} />}
                </React.Fragment>
              ))}
            </div>

            {checkoutStep === 'billing' && (
              <form onSubmit={e => { e.preventDefault(); setCheckoutStep('payment'); }}>
                <h3 style={{ margin: '0 0 20px', fontSize: 17, fontWeight: 700 }}>Billing Information</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <CField label="Full Name" value={billing.name} onChange={v => setBilling(p => ({ ...p, name: v }))} placeholder="Yoni Natan" required />
                  <CField label="Email Address" type="email" value={billing.email} onChange={v => setBilling(p => ({ ...p, email: v }))} placeholder="you@company.io" required />
                  <CField label="Company (optional)" value={billing.company} onChange={v => setBilling(p => ({ ...p, company: v }))} placeholder="Acme Inc." />
                  <div>
                    <label style={labelStyle}>Country</label>
                    <select value={billing.country} onChange={e => setBilling(p => ({ ...p, country: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                      {[['IL','Israel'],['US','United States'],['GB','United Kingdom'],['DE','Germany'],['FR','France'],['CA','Canada'],['AU','Australia'],['SG','Singapore'],['IN','India']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginTop: 20, padding: '12px 14px', background: 'rgba(79,142,247,0.07)', borderRadius: 9, border: '1px solid rgba(79,142,247,0.12)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 6, fontWeight: 600 }}>Order Summary</div>
                  {cart.map(i => <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text2)', marginBottom: 3 }}><span>{i.name} ×{i.qty}</span><span>{fmt(i.price * i.qty)}</span></div>)}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 6 }}><span>Total</span><span>{fmt(cartTotal)}/mo</span></div>
                </div>
                <button type="submit" style={submitBtnStyle}>Continue to Payment →</button>
                <button type="button" onClick={() => { setCheckoutStep(null); setCartOpen(true); }} style={backBtnStyle}>← Back to Cart</button>
              </form>
            )}

            {checkoutStep === 'payment' && (
              <form onSubmit={processPayment}>
                <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 700 }}>Payment</h3>
                <p style={{ margin: '0 0 20px', fontSize: 12.5, color: 'var(--text2)' }}>Test card: 4242 4242 4242 4242 · Any future date · Any CVC</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Card Number</label>
                    <div style={{ position: 'relative' }}>
                      <input value={card.number} onChange={e => setCard(p => ({ ...p, number: fmtCard(e.target.value) }))} placeholder="4242 4242 4242 4242" maxLength={19} required style={{ ...inputStyle, paddingRight: 60 }} />
                      {cardType(card.number) && <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>{cardType(card.number)}</span>}
                    </div>
                  </div>
                  <CField label="Name on Card" value={card.name} onChange={v => setCard(p => ({ ...p, name: v }))} placeholder="Yoni Natan" required />
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle}>Expiry</label>
                      <input value={card.expiry} onChange={e => setCard(p => ({ ...p, expiry: fmtExpiry(e.target.value) }))} placeholder="MM/YY" maxLength={5} required style={inputStyle} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle}>CVC</label>
                      <input value={card.cvc} onChange={e => setCard(p => ({ ...p, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) }))} placeholder="123" maxLength={4} required style={inputStyle} />
                    </div>
                  </div>
                </div>
                {cardErr && <div style={{ marginTop: 12, padding: '10px 13px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 8, fontSize: 12.5, color: '#ef4444' }}>{cardErr}</div>}
                <div style={{ marginTop: 18, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text2)' }}>Total charged today</span>
                  <span style={{ fontWeight: 700, fontSize: 16 }}>{fmt(cartTotal)}</span>
                </div>
                <button type="submit" disabled={processing} style={{ ...submitBtnStyle, opacity: processing ? 0.7 : 1, cursor: processing ? 'not-allowed' : 'pointer' }}>
                  {processing ? '⏳ Processing...' : `🔒 Pay ${fmt(cartTotal)} →`}
                </button>
                <button type="button" onClick={() => setCheckoutStep('billing')} style={backBtnStyle}>← Back</button>
                <div style={{ textAlign: 'center', marginTop: 8, fontSize: 11, color: 'var(--text3)' }}>Your payment is secured with 256-bit SSL encryption</div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Success Modal */}
      {checkoutStep === 'success' && order && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={() => setCheckoutStep(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)' }} />
          <div style={{ position: 'relative', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, width: '100%', maxWidth: 440, padding: 36, textAlign: 'center', animation: 'scaleIn .25s ease' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(34,197,94,0.12)', border: '2px solid #22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 20px' }}>✓</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px', color: '#22c55e' }}>Payment Successful!</h2>
            <p style={{ fontSize: 13.5, color: 'var(--text2)', margin: '0 0 24px' }}>Order <span style={{ fontFamily: 'var(--mono)', color: 'var(--text)', fontSize: 11 }}>{order.id}</span> confirmed.</p>
            <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: '14px 16px', marginBottom: 22, textAlign: 'left' }}>
              {order.items.map(i => (
                <div key={i.productId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 6, color: 'var(--text2)' }}>
                  <span>{i.name} ×{i.qty}</span><span style={{ fontWeight: 600, color: 'var(--text)' }}>{fmt(i.price * i.qty)}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 6, display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 14 }}>
                <span>Total</span><span style={{ color: '#22c55e' }}>{fmt(order.total)}/mo</span>
              </div>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 20 }}>A receipt has been sent to <strong>{order.billing.email}</strong>. Your features are now active.</p>
            <button onClick={() => setCheckoutStep(null)} style={{ ...submitBtnStyle, background: '#22c55e', boxShadow: '0 0 20px rgba(34,197,94,0.25)' }}>Back to Marketplace</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInRight { from { transform:translateX(100%); } to { transform:translateX(0); } }
        @keyframes scaleIn { from { opacity:0; transform:scale(0.94); } to { opacity:1; transform:scale(1); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px) translateX(-50%); } to { opacity:1; transform:translateY(0) translateX(-50%); } }
      `}</style>
    </div>
  );
}

function ProductCard({ p, onAdd, inCart }) {
  const badge = BADGE_COLORS[p.badge];
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', gap: 0, transition: 'border-color .2s, transform .2s', cursor: 'default', position: 'relative', overflow: 'hidden' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(79,142,247,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}>
      {p.badge === 'Best Value' && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(34,197,94,0.04),transparent)', pointerEvents: 'none', borderRadius: 14 }} />}
      {badge && (
        <span style={{ ...badge, fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 10, display: 'inline-block', marginBottom: 12, width: 'fit-content' }}>{p.badge}</span>
      )}
      <div style={{ fontSize: 15.5, fontWeight: 700, marginBottom: 6, letterSpacing: '-0.3px' }}>{p.name}</div>
      <div style={{ fontSize: 12.5, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 14, flex: 1 }}>{p.description}</div>
      <ul style={{ listStyle: 'none', margin: '0 0 18px', padding: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
        {(p.features || []).slice(0, 4).map((f, i) => (
          <li key={i} style={{ fontSize: 11.5, color: 'var(--text2)', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
            <span style={{ color: '#22c55e', fontWeight: 700, marginTop: 1, flexShrink: 0 }}>✓</span>{f}
          </li>
        ))}
      </ul>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
        <div>
          <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>{fmt(p.price)}</span>
          <span style={{ fontSize: 12, color: 'var(--text3)', marginLeft: 3 }}>/mo</span>
        </div>
        <button onClick={onAdd} style={{ padding: '8px 16px', background: inCart ? 'rgba(34,197,94,0.12)' : 'rgba(79,142,247,0.12)', color: inCart ? '#22c55e' : 'var(--blue)', border: `1px solid ${inCart ? 'rgba(34,197,94,0.25)' : 'rgba(79,142,247,0.25)'}`, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}>
          {inCart ? '✓ In Cart' : '+ Add to Cart'}
        </button>
      </div>
    </div>
  );
}

function CField({ label, type = 'text', value, onChange, placeholder, required }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ ...inputStyle, borderColor: focused ? 'rgba(79,142,247,0.5)' : 'var(--border)', boxShadow: focused ? '0 0 0 3px rgba(79,142,247,0.1)' : 'none', background: focused ? 'rgba(79,142,247,0.05)' : 'var(--bg3)' }} />
    </div>
  );
}

const labelStyle = { fontSize: 11.5, color: 'var(--text2)', display: 'block', marginBottom: 5, fontWeight: 500 };
const inputStyle = { width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', color: 'var(--text)', fontSize: 13.5, outline: 'none', fontFamily: 'inherit', transition: 'all .15s', boxSizing: 'border-box' };
const submitBtnStyle = { width: '100%', marginTop: 18, padding: '12px', background: 'linear-gradient(135deg,var(--blue),#6366f1)', color: '#fff', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 0 20px rgba(79,142,247,0.2)' };
const backBtnStyle = { width: '100%', marginTop: 8, padding: '10px', background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 9, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' };
const qBtnStyle = { width: 26, height: 26, borderRadius: 6, background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' };
