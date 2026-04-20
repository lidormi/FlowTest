import React, { useState } from 'react';
import { navigate, useCart } from '../App.jsx';
import { fmt } from '../data/products.js';
import styles from './Checkout.module.css';

const API = (import.meta.env.VITE_API_URL || 'https://flowtest-production.up.railway.app') + '/api';

function luhn(num) {
  const d = num.replace(/\D/g,'');
  let s = 0;
  for (let i=0;i<d.length;i++){let x=parseInt(d[d.length-1-i]);if(i%2===1){x*=2;if(x>9)x-=9;}s+=x;}
  return s%10===0;
}
function fmtCard(v){ return v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim(); }
function fmtExp(v){ const d=v.replace(/\D/g,'').slice(0,4); return d.length>2?d.slice(0,2)+'/'+d.slice(2):d; }
function cardBrand(n){ const d=n.replace(/\D/g,''); if(d.startsWith('4'))return'Visa'; if(d.startsWith('5'))return'MC'; if(d.startsWith('34')||d.startsWith('37'))return'Amex'; return''; }

export default function Checkout() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const [step, setStep]           = useState(1);
  const [info, setInfo]           = useState({ name:'', email:'', address:'', city:'', country:'IL' });
  const [card, setCard]           = useState({ number:'', name:'', expiry:'', cvc:'' });
  const [err, setErr]             = useState('');
  const [processing, setProcessing] = useState(false);
  const [order, setOrder]         = useState(null);

  const shipping   = cartTotal >= 5000 ? 0 : 799;
  const grandTotal = cartTotal + shipping;

  if (cartItems.length === 0 && step !== 3) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyEmoji}>🛒</div>
        <h2>Your cart is empty</h2>
        <button onClick={() => navigate('/products')} className={styles.primaryBtn}>Shop now</button>
      </div>
    );
  }

  async function submitPayment(e) {
    e.preventDefault();
    setErr('');
    const digits = card.number.replace(/\D/g,'');
    if (digits.length < 13) { setErr('Invalid card number'); return; }
    const [mm,yy] = card.expiry.split('/');
    if (!mm||!yy||parseInt(mm)>12) { setErr('Invalid expiry date'); return; }
    if (new Date(2000+parseInt(yy),parseInt(mm)-1) < new Date()) { setErr('Card is expired'); return; }
    if (card.cvc.replace(/\D/g,'').length < 3) { setErr('Invalid CVC'); return; }
    setProcessing(true);
    try {
      const res = await fetch(`${API}/products/orders`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('ft_token')||''}` },
        body: JSON.stringify({
          items: cartItems.map(i => ({ productId: i.id, qty: i.qty })),
          billing: { name:info.name, email:info.email, country:info.country },
          card: { number:digits, expiry:card.expiry, cvc:card.cvc },
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error||'Payment failed'); setProcessing(false); return; }
      setOrder(data.order);
      clearCart();
      setStep(3);
    } catch { setErr('Network error — is the backend running?'); }
    finally { setProcessing(false); }
  }

  if (step === 3 && order) return (
    <div className={styles.successWrap}>
      <div data-testid="order-success" className={styles.successCard}>
        <div className={styles.successIcon}>✓</div>
        <h2 className={styles.successTitle}>Order confirmed!</h2>
        <p className={styles.successOrderId}>Order <code>{order.id}</code></p>
        <div className={styles.successItems}>
          {order.items.map(i => (
            <div key={i.productId} className={styles.successItem}>
              <span>{i.name} ×{i.qty}</span>
              <span className={styles.successItemPrice}>{fmt(i.price * i.qty)}</span>
            </div>
          ))}
          <div className={styles.successTotalRow}>
            <span>Total</span>
            <span className={styles.successTotalAmount}>{fmt(order.total)}</span>
          </div>
        </div>
        <p className={styles.successEmail}>Receipt sent to <strong>{order.billing.email}</strong></p>
        <button onClick={() => navigate('/')} className={styles.primaryBtn}>Back to shop</button>
      </div>
    </div>
  );

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Checkout</h1>

      {/* Progress */}
      <div className={styles.progress}>
        {[['1','Shipping'],['2','Payment']].map(([n,label],idx) => (
          <React.Fragment key={n}>
            <div className={styles.progressStep}>
              <div className={`${styles.progressDot} ${step >= parseInt(n) ? styles.progressDotActive : ''}`}>{n}</div>
              <span className={`${styles.progressLabel} ${step === parseInt(n) ? styles.progressLabelActive : ''}`}>{label}</span>
            </div>
            {idx < 1 && <div className={styles.progressLine} />}
          </React.Fragment>
        ))}
      </div>

      <div className={styles.layout}>
        {/* Form */}
        <div className={styles.formCard}>
          {step === 1 && (
            <form onSubmit={e => { e.preventDefault(); setStep(2); }}>
              <h3 className={styles.formTitle}>Shipping information</h3>
              <div className={styles.formFields}>
                <Field label="Full name"  name="name"    value={info.name}    onChange={v=>setInfo(p=>({...p,name:v}))}    placeholder="Yoni Natan"       required />
                <Field label="Email"      type="email"   name="email"   value={info.email}   onChange={v=>setInfo(p=>({...p,email:v}))}   placeholder="you@example.com" required />
                <Field label="Address"   name="address" value={info.address} onChange={v=>setInfo(p=>({...p,address:v}))} placeholder="123 Main St"      required />
                <div className={styles.formRow}>
                  <div className={styles.formRowItem}>
                    <Field label="City" name="city" value={info.city} onChange={v=>setInfo(p=>({...p,city:v}))} placeholder="Tel Aviv" required />
                  </div>
                  <div className={styles.formRowItem}>
                    <label className={styles.fieldLabel}>Country</label>
                    <select
                      name="country"
                      value={info.country}
                      onChange={e => setInfo(p=>({...p,country:e.target.value}))}
                      className={styles.fieldInput}
                    >
                      {[['IL','Israel'],['US','United States'],['GB','United Kingdom'],['DE','Germany'],['FR','France'],['CA','Canada'],['AU','Australia']].map(([v,l])=>(
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <button type="submit" data-testid="continue-to-payment" className={styles.primaryBtn}>
                Continue to payment →
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={submitPayment}>
              <h3 className={styles.formTitle}>Payment details</h3>
              <p className={styles.formSubtitle}>Test card: 4242 4242 4242 4242 · any future date · any CVC</p>
              <div className={styles.formFields}>
                <div>
                  <label className={styles.fieldLabel}>Card number</label>
                  <div className={styles.cardNumberWrap}>
                    <input
                      name="cardNumber"
                      value={card.number}
                      onChange={e => setCard(p=>({...p,number:fmtCard(e.target.value)}))}
                      placeholder="4242 4242 4242 4242"
                      maxLength={19}
                      required
                      className={`${styles.fieldInput} ${styles.fieldInputWithBrand}`}
                    />
                    {cardBrand(card.number) && (
                      <span className={styles.cardBrand}>{cardBrand(card.number)}</span>
                    )}
                  </div>
                </div>
                <Field label="Name on card" name="cardName" value={card.name} onChange={v=>setCard(p=>({...p,name:v}))} placeholder="Yoni Natan" required />
                <div className={styles.formRow}>
                  <div className={styles.formRowItem}>
                    <label className={styles.fieldLabel}>Expiry</label>
                    <input
                      name="expiry"
                      value={card.expiry}
                      onChange={e => setCard(p=>({...p,expiry:fmtExp(e.target.value)}))}
                      placeholder="MM/YY"
                      maxLength={5}
                      required
                      className={styles.fieldInput}
                    />
                  </div>
                  <div className={styles.formRowItem}>
                    <label className={styles.fieldLabel}>CVC</label>
                    <input
                      name="cvc"
                      value={card.cvc}
                      onChange={e => setCard(p=>({...p,cvc:e.target.value.replace(/\D/g,'').slice(0,4)}))}
                      placeholder="123"
                      maxLength={4}
                      required
                      className={styles.fieldInput}
                    />
                  </div>
                </div>
              </div>
              {err && <div className={styles.errorBox}>{err}</div>}
              <div className={styles.chargeRow}>
                <span className={styles.chargeLabel}>Total charged</span>
                <span className={styles.chargeTotal}>{fmt(grandTotal)}</span>
              </div>
              <button
                type="submit"
                data-testid="place-order"
                disabled={processing}
                className={styles.primaryBtn}
              >
                {processing ? '⏳ Processing...' : `🔒 Pay ${fmt(grandTotal)}`}
              </button>
              <button type="button" onClick={() => setStep(1)} className={styles.secondaryBtn}>
                ← Back
              </button>
              <div className={styles.sslNote}>Secured with 256-bit SSL encryption</div>
            </form>
          )}
        </div>

        {/* Order summary */}
        <div className={styles.summary}>
          <h3 className={styles.summaryTitle}>Your order</h3>
          {cartItems.map(i => (
            <div key={i.id} className={styles.summaryItem}>
              <img src={i.image} alt={i.name} className={styles.summaryItemImg} />
              <div className={styles.summaryItemInfo}>
                <div className={styles.summaryItemName}>{i.name}</div>
                <div className={styles.summaryItemQty}>×{i.qty}</div>
              </div>
              <span className={styles.summaryItemPrice}>{fmt(i.price * i.qty)}</span>
            </div>
          ))}
          <div className={styles.summaryDivider}>
            <div className={styles.summaryRow}>
              <span>Subtotal</span><span>{fmt(cartTotal)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Shipping</span>
              <span className={shipping === 0 ? styles.shippingFree : ''}>
                {shipping === 0 ? 'Free' : fmt(shipping)}
              </span>
            </div>
            <div className={styles.totalRow}>
              <span>Total</span><span>{fmt(grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, type='text', name, value, onChange, placeholder, required }) {
  return (
    <div>
      <label className={styles.fieldLabel}>{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={styles.fieldInput}
      />
    </div>
  );
}
