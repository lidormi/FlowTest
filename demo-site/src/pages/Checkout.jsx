import React, { useState } from 'react';
import { navigate, useCart } from '../App.jsx';
import { fmt } from '../data/products.js';

const API = 'http://localhost:3001/api';

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
  const [step, setStep] = useState(1); // 1=info, 2=payment, 3=success
  const [info, setInfo]   = useState({ name:'', email:'', address:'', city:'', country:'IL' });
  const [card, setCard]   = useState({ number:'', name:'', expiry:'', cvc:'' });
  const [err, setErr]     = useState('');
  const [processing, setProcessing] = useState(false);
  const [order, setOrder] = useState(null);

  const shipping = cartTotal >= 5000 ? 0 : 799;
  const grandTotal = cartTotal + shipping;

  if (cartItems.length === 0 && step !== 3) {
    return (
      <div style={{ maxWidth:500,margin:'80px auto',textAlign:'center',padding:24 }}>
        <div style={{ fontSize:48,marginBottom:12 }}>🛒</div>
        <h2>Your cart is empty</h2>
        <button onClick={() => navigate('/products')} style={primaryBtn}>Shop now</button>
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
    <div style={{ maxWidth:500,margin:'60px auto',textAlign:'center',padding:24 }}>
      <div data-testid="order-success" style={{ background:'#fff',border:'1px solid #e5e7eb',borderRadius:16,padding:40 }}>
        <div style={{ width:64,height:64,borderRadius:'50%',background:'rgba(34,197,94,0.1)',border:'2px solid #22c55e',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,margin:'0 auto 20px' }}>✓</div>
        <h2 style={{ fontSize:22,fontWeight:800,color:'#22c55e',margin:'0 0 8px' }}>Order confirmed!</h2>
        <p style={{ fontSize:13,color:'#6b7280',margin:'0 0 20px' }}>Order <code style={{ fontSize:11 }}>{order.id}</code></p>
        <div style={{ background:'#f9fafb',borderRadius:10,padding:'14px',marginBottom:20,textAlign:'left' }}>
          {order.items.map(i=>(
            <div key={i.productId} style={{ display:'flex',justifyContent:'space-between',fontSize:12,color:'#6b7280',marginBottom:4 }}>
              <span>{i.name} ×{i.qty}</span><span style={{ fontWeight:600,color:'#111' }}>{fmt(i.price*i.qty)}</span>
            </div>
          ))}
          <div style={{ borderTop:'1px solid #e5e7eb',paddingTop:8,marginTop:6,display:'flex',justifyContent:'space-between',fontWeight:800,fontSize:14 }}>
            <span>Total</span><span style={{ color:'#22c55e' }}>{fmt(order.total)}</span>
          </div>
        </div>
        <p style={{ fontSize:12,color:'#9ca3af',marginBottom:20 }}>Receipt sent to <strong>{order.billing.email}</strong></p>
        <button onClick={() => navigate('/')} style={{ ...primaryBtn,width:'100%' }}>Back to shop</button>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth:900,margin:'0 auto',padding:'40px 24px' }}>
      <h1 style={{ fontSize:24,fontWeight:800,margin:'0 0 28px',letterSpacing:'-0.4px' }}>Checkout</h1>

      {/* Progress */}
      <div style={{ display:'flex',alignItems:'center',marginBottom:32 }}>
        {[['1','Shipping'],['2','Payment']].map(([n,label],idx) => (
          <React.Fragment key={n}>
            <div style={{ display:'flex',alignItems:'center',gap:8 }}>
              <div style={{ width:28,height:28,borderRadius:'50%',background:step>=parseInt(n)?'#6366f1':'#e5e7eb',color:step>=parseInt(n)?'#fff':'#9ca3af',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700 }}>{n}</div>
              <span style={{ fontSize:13,fontWeight:step===parseInt(n)?600:400,color:step>=parseInt(n)?'#111':'#9ca3af' }}>{label}</span>
            </div>
            {idx<1 && <div style={{ flex:1,height:1,background:'#e5e7eb',margin:'0 12px' }} />}
          </React.Fragment>
        ))}
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'1fr 320px',gap:28,alignItems:'start' }}>
        {/* Form */}
        <div style={{ background:'#fff',border:'1px solid #e5e7eb',borderRadius:14,padding:24 }}>
          {step === 1 && (
            <form onSubmit={e => { e.preventDefault(); setStep(2); }}>
              <h3 style={{ margin:'0 0 20px',fontSize:15,fontWeight:700 }}>Shipping information</h3>
              <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
                <Field label="Full name" name="name" value={info.name} onChange={v=>setInfo(p=>({...p,name:v}))} placeholder="Yoni Natan" required />
                <Field label="Email" type="email" name="email" value={info.email} onChange={v=>setInfo(p=>({...p,email:v}))} placeholder="you@example.com" required />
                <Field label="Address" name="address" value={info.address} onChange={v=>setInfo(p=>({...p,address:v}))} placeholder="123 Main St" required />
                <div style={{ display:'flex',gap:12 }}>
                  <div style={{ flex:1 }}><Field label="City" name="city" value={info.city} onChange={v=>setInfo(p=>({...p,city:v}))} placeholder="Tel Aviv" required /></div>
                  <div style={{ flex:1 }}>
                    <label style={labelStyle}>Country</label>
                    <select name="country" value={info.country} onChange={e=>setInfo(p=>({...p,country:e.target.value}))} style={{ ...inputStyle,cursor:'pointer' }}>
                      {[['IL','Israel'],['US','United States'],['GB','United Kingdom'],['DE','Germany'],['FR','France'],['CA','Canada'],['AU','Australia']].map(([v,l])=><option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <button type="submit" data-testid="continue-to-payment" style={{ ...primaryBtn,width:'100%',marginTop:20,padding:'13px' }}>Continue to payment →</button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={submitPayment}>
              <h3 style={{ margin:'0 0 6px',fontSize:15,fontWeight:700 }}>Payment details</h3>
              <p style={{ fontSize:11.5,color:'#9ca3af',margin:'0 0 20px' }}>Test card: 4242 4242 4242 4242 · any future date · any CVC</p>
              <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
                <div>
                  <label style={labelStyle}>Card number</label>
                  <div style={{ position:'relative' }}>
                    <input name="cardNumber" value={card.number} onChange={e=>setCard(p=>({...p,number:fmtCard(e.target.value)}))} placeholder="4242 4242 4242 4242" maxLength={19} required style={{ ...inputStyle,paddingRight:50 }} />
                    {cardBrand(card.number) && <span style={{ position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',fontSize:10,color:'#6b7280',fontWeight:600 }}>{cardBrand(card.number)}</span>}
                  </div>
                </div>
                <Field label="Name on card" name="cardName" value={card.name} onChange={v=>setCard(p=>({...p,name:v}))} placeholder="Yoni Natan" required />
                <div style={{ display:'flex',gap:12 }}>
                  <div style={{ flex:1 }}>
                    <label style={labelStyle}>Expiry</label>
                    <input name="expiry" value={card.expiry} onChange={e=>setCard(p=>({...p,expiry:fmtExp(e.target.value)}))} placeholder="MM/YY" maxLength={5} required style={inputStyle} />
                  </div>
                  <div style={{ flex:1 }}>
                    <label style={labelStyle}>CVC</label>
                    <input name="cvc" value={card.cvc} onChange={e=>setCard(p=>({...p,cvc:e.target.value.replace(/\D/g,'').slice(0,4)}))} placeholder="123" maxLength={4} required style={inputStyle} />
                  </div>
                </div>
              </div>
              {err && <div style={{ marginTop:12,padding:'10px 13px',background:'rgba(239,68,68,0.07)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:8,fontSize:12.5,color:'#ef4444' }}>{err}</div>}
              <div style={{ marginTop:16,display:'flex',justifyContent:'space-between',fontSize:13 }}>
                <span style={{ color:'#6b7280' }}>Total charged</span>
                <span style={{ fontWeight:800,fontSize:16 }}>{fmt(grandTotal)}</span>
              </div>
              <button type="submit" data-testid="place-order" disabled={processing} style={{ ...primaryBtn,width:'100%',marginTop:14,padding:'13px',opacity:processing?.7:1,cursor:processing?'not-allowed':'pointer' }}>
                {processing ? '⏳ Processing...' : `🔒 Pay ${fmt(grandTotal)}`}
              </button>
              <button type="button" onClick={()=>setStep(1)} style={{ width:'100%',marginTop:8,background:'none',border:'1px solid #e5e7eb',borderRadius:9,padding:'10px',fontSize:13,cursor:'pointer',fontFamily:'inherit',color:'#374151' }}>← Back</button>
              <div style={{ textAlign:'center',marginTop:8,fontSize:11,color:'#9ca3af' }}>Secured with 256-bit SSL encryption</div>
            </form>
          )}
        </div>

        {/* Order summary */}
        <div style={{ background:'#fff',border:'1px solid #e5e7eb',borderRadius:14,padding:20,position:'sticky',top:80 }}>
          <h3 style={{ fontSize:14,fontWeight:700,margin:'0 0 16px' }}>Your order</h3>
          {cartItems.map(i=>(
            <div key={i.id} style={{ display:'flex',gap:10,marginBottom:12,alignItems:'center' }}>
              <img src={i.image} alt={i.name} style={{ width:44,height:44,objectFit:'cover',borderRadius:7,border:'1px solid #e5e7eb' }} />
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontSize:12,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>{i.name}</div>
                <div style={{ fontSize:11,color:'#9ca3af' }}>×{i.qty}</div>
              </div>
              <span style={{ fontSize:13,fontWeight:700 }}>{fmt(i.price*i.qty)}</span>
            </div>
          ))}
          <div style={{ borderTop:'1px solid #f0f0f0',paddingTop:10,marginTop:4 }}>
            <div style={{ display:'flex',justifyContent:'space-between',fontSize:12,color:'#6b7280',marginBottom:4 }}><span>Subtotal</span><span>{fmt(cartTotal)}</span></div>
            <div style={{ display:'flex',justifyContent:'space-between',fontSize:12,color:'#6b7280',marginBottom:4 }}><span>Shipping</span><span style={{ color:shipping===0?'#22c55e':'#111' }}>{shipping===0?'Free':fmt(shipping)}</span></div>
            <div style={{ display:'flex',justifyContent:'space-between',fontWeight:800,fontSize:15,borderTop:'1px solid #f0f0f0',paddingTop:8,marginTop:4 }}><span>Total</span><span>{fmt(grandTotal)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, type='text', name, value, onChange, placeholder, required }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input type={type} name={name} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} required={required}
        onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
        style={{ ...inputStyle, borderColor:focused?'#6366f1':'#e5e7eb', boxShadow:focused?'0 0 0 3px rgba(99,102,241,.12)':'none' }} />
    </div>
  );
}

const labelStyle = { fontSize:12,color:'#374151',display:'block',marginBottom:5,fontWeight:500 };
const inputStyle = { width:'100%',background:'#f9fafb',border:'1px solid #e5e7eb',borderRadius:8,padding:'9px 12px',color:'#111',fontSize:13.5,outline:'none',fontFamily:'inherit',transition:'all .15s',boxSizing:'border-box' };
const primaryBtn = { background:'#6366f1',color:'#fff',border:'none',borderRadius:9,fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit' };
