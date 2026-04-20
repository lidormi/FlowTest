import React, { useState } from 'react';
import { navigate, useCart } from '../App.jsx';
import { getProduct, fmt } from '../data/products.js';
import styles from './ProductDetail.module.css';

export default function ProductDetail({ slug }) {
  const { addToCart } = useCart();
  const p = getProduct(slug);
  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(1);

  if (!p) return (
    <div className={styles.notFound}>
      <div className={styles.notFoundEmoji}>🔍</div>
      <h2>Product not found</h2>
      <button onClick={() => navigate('/products')} className={styles.backBtn}>
        ← Back to products
      </button>
    </div>
  );

  function handleAdd() {
    for (let i = 0; i < qty; i++) addToCart(p);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className={styles.page}>
      <button onClick={() => navigate('/products')} className={styles.backBtn}>
        ← Back to products
      </button>

      <div className={styles.layout}>
        {/* Image */}
        <div className={styles.imageWrap}>
          <img src={p.image} alt={p.name} className={styles.image} />
        </div>

        {/* Info */}
        <div>
          <div className={styles.category} data-testid="product-category">{p.category}</div>
          <h1 className={styles.name}>{p.name}</h1>
          <div className={styles.ratingRow}>
            <span className={styles.stars}>{'★'.repeat(Math.floor(p.rating))}</span>
            <span className={styles.ratingVal}>{p.rating}</span>
            <span className={styles.ratingCount}>({p.reviews} reviews)</span>
          </div>
          <div className={styles.price}>{fmt(p.price)}</div>
          <p className={styles.description}>{p.description}</p>

          <ul className={styles.features}>
            {p.features.map(f => (
              <li key={f} className={styles.featureItem}>
                <span className={styles.featureCheck}>✓</span>{f}
              </li>
            ))}
          </ul>

          <div className={styles.ctaRow}>
            <div className={styles.qtyRow}>
              <button onClick={() => setQty(q => Math.max(1, q-1))} className={styles.qtyBtn}>−</button>
              <span className={styles.qtyVal}>{qty}</span>
              <button onClick={() => setQty(q => q+1)} className={styles.qtyBtn}>+</button>
            </div>
            <button
              onClick={handleAdd}
              data-testid="add-to-cart"
              className={`${styles.addBtn} ${added ? styles.addBtnAdded : ''}`}
            >
              {added ? '✓ Added to cart!' : 'Add to cart'}
            </button>
          </div>

          <button onClick={() => { handleAdd(); navigate('/checkout'); }} className={styles.buyBtn}>
            Buy now
          </button>

          <div className={styles.trustRow}>
            <span>🚚 Free shipping over $50</span>
            <span>🔁 30-day returns</span>
            <span>🛡 2yr warranty</span>
          </div>
        </div>
      </div>
    </div>
  );
}
