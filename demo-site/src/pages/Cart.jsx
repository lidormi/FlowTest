import React from 'react';
import { navigate, useCart } from '../App.jsx';
import { fmt } from '../data/products.js';

export default function Cart() {
  const { cartItems, updateQty, cartTotal } = useCart();
  const shipping = cartTotal >= 5000 ? 0 : 799;
  const grandTotal = cartTotal + shipping;

  if (cartItems.length === 0) return (
    <div style={{ maxWidth:600,margin:'80px auto',textAlign:'center',padding:24 }}>
      <div style={{ fontSize:64,marginBottom:16 }}>🛒</div>
      <h2 style={{ fontSize:22,fontWeight:700,margin:'0 0 8px' }}>Your cart is empty</h2>
      <p style={{ color:'#6b7280',marginBottom:24 }}>Add some products to get started</p>
      <button onClick={() => navigate('/products')} style={primaryBtn}>Browse products</button>
    </div>
  );

  return (
    <div style={{ maxWidth:900,margin:'0 auto',padding:'40px 24px' }}>
      <h1 style={{ fontSize:26,fontWeight:800,margin:'0 0 28px',letterSpacing:'-0.4px' }}>Shopping Cart</h1>
      <div style={{ display:'grid',gridTemplateColumns:'1fr 340px',gap:28,alignItems:'start' }}>
        {/* Items */}
        <div>
          {cartItems.map(item => (
            <div key={item.id} style={{ display:'flex',gap:16,padding:'20px 0',borderBottom:'1px solid #f0f0f0',alignItems:'center' }}>
              <img src={item.image} alt={item.name} style={{ width:80,height:80,objectFit:'cover',borderRadius:10,border:'1px solid #e5e7eb' }} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14,fontWeight:700,marginBottom:3 }}>{item.name}</div>
                <div style={{ fontSize:12,color:'#6b7280',marginBottom:8 }}>{item.category}</div>
                <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                  <div style={{ display:'flex',alignItems:'center',border:'1px solid #e5e7eb',borderRadius:8,overflow:'hidden' }}>
                    <button onClick={() => updateQty(item.id,-1)} style={qBtn}>−</button>
                    <span style={{ padding:'0 10px',fontSize:13,fontWeight:600 }}>{item.qty}</span>
                    <button onClick={() => updateQty(item.id,+1)} style={qBtn}>+</button>
                  </div>
                  <button onClick={() => { for(let i=0;i<item.qty;i++) updateQty(item.id,-item.qty); }} style={{ fontSize:11,color:'#ef4444',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit' }}>Remove</button>
                </div>
              </div>
              <div style={{ fontSize:15,fontWeight:800,minWidth:64,textAlign:'right' }}>{fmt(item.price * item.qty)}</div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div style={{ background:'#fff',border:'1px solid #e5e7eb',borderRadius:14,padding:22,position:'sticky',top:80 }}>
          <h3 style={{ fontSize:15,fontWeight:700,margin:'0 0 18px' }}>Order Summary</h3>
          {cartItems.map(i => (
            <div key={i.id} style={{ display:'flex',justifyContent:'space-between',fontSize:12,color:'#6b7280',marginBottom:6 }}>
              <span>{i.name} ×{i.qty}</span><span>{fmt(i.price*i.qty)}</span>
            </div>
          ))}
          <div style={{ borderTop:'1px solid #f0f0f0',marginTop:12,paddingTop:12 }}>
            <div style={{ display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:6 }}>
              <span style={{ color:'#6b7280' }}>Subtotal</span><span>{fmt(cartTotal)}</span>
            </div>
            <div style={{ display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:6 }}>
              <span style={{ color:'#6b7280' }}>Shipping</span>
              <span style={{ color: shipping===0?'#22c55e':'#111' }}>{shipping===0?'Free':fmt(shipping)}</span>
            </div>
            {shipping > 0 && <div style={{ fontSize:11,color:'#9ca3af',marginBottom:8 }}>Add {fmt(5000-cartTotal)} more for free shipping</div>}
            <div style={{ display:'flex',justifyContent:'space-between',fontSize:15,fontWeight:800,borderTop:'1px solid #f0f0f0',paddingTop:10,marginTop:6 }}>
              <span>Total</span><span>{fmt(grandTotal)}</span>
            </div>
          </div>
          <button onClick={() => navigate('/checkout')} style={{ ...primaryBtn, width:'100%',marginTop:16,padding:'13px' }}>Proceed to Checkout →</button>
          <button onClick={() => navigate('/products')} style={{ width:'100%',marginTop:8,background:'none',border:'1px solid #e5e7eb',borderRadius:9,padding:'10px',fontSize:13,cursor:'pointer',fontFamily:'inherit',color:'#374151' }}>Continue shopping</button>
        </div>
      </div>
    </div>
  );
}

const primaryBtn = { background:'#6366f1',color:'#fff',border:'none',borderRadius:9,padding:'12px 24px',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit' };
const qBtn = { width:30,height:32,background:'#f9fafb',border:'none',fontSize:16,cursor:'pointer',fontFamily:'inherit',color:'#374151' };
