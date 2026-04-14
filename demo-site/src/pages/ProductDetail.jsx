import React, { useState } from 'react';
import { navigate, useCart } from '../App.jsx';
import { getProduct, fmt } from '../data/products.js';

export default function ProductDetail({ slug }) {
  const { addToCart } = useCart();
  const p = getProduct(slug);
  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(1);

  if (!p) return (
    <div style={{ maxWidth:600,margin:'80px auto',textAlign:'center',padding:24 }}>
      <div style={{ fontSize:48,marginBottom:16 }}>🔍</div>
      <h2>Product not found</h2>
      <button onClick={() => navigate('/products')} style={backBtn}>← Back to products</button>
    </div>
  );

  function handleAdd() {
    for (let i = 0; i < qty; i++) addToCart(p);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div style={{ maxWidth:1000, margin:'0 auto', padding:'40px 24px' }}>
      <button onClick={() => navigate('/products')} style={backBtn}>← Back to products</button>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:48, marginTop:24, alignItems:'start' }}>
        {/* Image */}
        <div style={{ borderRadius:16, overflow:'hidden', border:'1px solid #e5e7eb', aspectRatio:'4/3' }}>
          <img src={p.image} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        </div>

        {/* Info */}
        <div>
          <div style={{ fontSize:11,color:'#6366f1',fontWeight:700,textTransform:'uppercase',letterSpacing:'1px',marginBottom:8 }} data-testid="product-category">{p.category}</div>
          <h1 style={{ fontSize:28,fontWeight:800,margin:'0 0 10px',letterSpacing:'-0.5px',lineHeight:1.2 }}>{p.name}</h1>
          <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:16 }}>
            <span style={{ color:'#f59e0b',fontSize:14 }}>{'★'.repeat(Math.floor(p.rating))}</span>
            <span style={{ fontSize:13,fontWeight:600 }}>{p.rating}</span>
            <span style={{ fontSize:13,color:'#9ca3af' }}>({p.reviews} reviews)</span>
          </div>
          <div style={{ fontSize:34,fontWeight:800,margin:'0 0 16px',color:'#111' }}>{fmt(p.price)}</div>
          <p style={{ fontSize:14,color:'#4b5563',lineHeight:1.7,margin:'0 0 20px' }}>{p.description}</p>

          <ul style={{ listStyle:'none',padding:0,margin:'0 0 28px',display:'flex',flexDirection:'column',gap:6 }}>
            {p.features.map(f => (
              <li key={f} style={{ display:'flex',gap:8,fontSize:13,color:'#374151' }}>
                <span style={{ color:'#22c55e',fontWeight:700 }}>✓</span>{f}
              </li>
            ))}
          </ul>

          <div style={{ display:'flex',gap:10,alignItems:'center',marginBottom:16 }}>
            <div style={{ display:'flex',alignItems:'center',border:'1px solid #e5e7eb',borderRadius:9,overflow:'hidden' }}>
              <button onClick={() => setQty(q => Math.max(1, q-1))} style={{ width:36,height:40,background:'#f9fafb',border:'none',fontSize:18,cursor:'pointer',color:'#374151',fontFamily:'inherit' }}>−</button>
              <span style={{ width:40,textAlign:'center',fontSize:14,fontWeight:600 }}>{qty}</span>
              <button onClick={() => setQty(q => q+1)} style={{ width:36,height:40,background:'#f9fafb',border:'none',fontSize:18,cursor:'pointer',color:'#374151',fontFamily:'inherit' }}>+</button>
            </div>
            <button onClick={handleAdd} data-testid="add-to-cart"
              style={{ flex:1,background: added?'#22c55e':'#6366f1',color:'#fff',border:'none',borderRadius:10,padding:'12px 24px',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'inherit',transition:'background .2s' }}>
              {added ? '✓ Added to cart!' : 'Add to cart'}
            </button>
          </div>
          <button onClick={() => { handleAdd(); navigate('/checkout'); }}
            style={{ width:'100%',background:'#111',color:'#fff',border:'none',borderRadius:10,padding:'12px 24px',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'inherit' }}>
            Buy now
          </button>

          <div style={{ marginTop:20,padding:'12px 14px',background:'#f9fafb',borderRadius:9,fontSize:12,color:'#6b7280',display:'flex',gap:16 }}>
            <span>🚚 Free shipping over $50</span>
            <span>🔁 30-day returns</span>
            <span>🛡 2yr warranty</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const backBtn = { background:'none',border:'none',color:'#6b7280',fontSize:13,cursor:'pointer',padding:'0 0 8px',fontFamily:'inherit',display:'flex',alignItems:'center',gap:4 };
