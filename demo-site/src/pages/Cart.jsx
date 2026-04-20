import React from 'react';
import { navigate, useCart } from '../App.jsx';
import { fmt } from '../data/products.js';
import styles from './Cart.module.css';

export default function Cart() {
  const { cartItems, updateQty, cartTotal } = useCart();
  const shipping = cartTotal >= 5000 ? 0 : 799;
  const grandTotal = cartTotal + shipping;

  if (cartItems.length === 0) return (
    <div className={styles.empty}>
      <div className={styles.emptyEmoji}>🛒</div>
      <h2 className={styles.emptyTitle}>Your cart is empty</h2>
      <p className={styles.emptySub}>Add some products to get started</p>
      <button onClick={() => navigate('/products')} className={styles.primaryBtn} style={{ marginTop: 0 }}>
        Browse products
      </button>
    </div>
  );

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Shopping Cart</h1>
      <div className={styles.layout}>

        {/* Items */}
        <div>
          {cartItems.map(item => (
            <div key={item.id} className={styles.item}>
              <img src={item.image} alt={item.name} className={styles.itemImg} />
              <div className={styles.itemInfo}>
                <div className={styles.itemName}>{item.name}</div>
                <div className={styles.itemCategory}>{item.category}</div>
                <div className={styles.itemControls}>
                  <div className={styles.qtyRow}>
                    <button onClick={() => updateQty(item.id, -1)} className={styles.qtyBtn}>−</button>
                    <span className={styles.qtyVal}>{item.qty}</span>
                    <button onClick={() => updateQty(item.id, +1)} className={styles.qtyBtn}>+</button>
                  </div>
                  <button
                    onClick={() => updateQty(item.id, -item.qty)}
                    className={styles.removeBtn}
                  >
                    Remove
                  </button>
                </div>
              </div>
              <div className={styles.itemTotal}>{fmt(item.price * item.qty)}</div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className={styles.summary}>
          <h3 className={styles.summaryTitle}>Order Summary</h3>
          {cartItems.map(i => (
            <div key={i.id} className={styles.summaryItem}>
              <span>{i.name} ×{i.qty}</span>
              <span>{fmt(i.price * i.qty)}</span>
            </div>
          ))}
          <div className={styles.summaryDivider}>
            <div className={styles.summaryRow}>
              <span className={styles.summaryRowLabel}>Subtotal</span>
              <span>{fmt(cartTotal)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryRowLabel}>Shipping</span>
              <span className={shipping === 0 ? styles.shippingFree : ''}>
                {shipping === 0 ? 'Free' : fmt(shipping)}
              </span>
            </div>
            {shipping > 0 && (
              <div className={styles.freeHint}>
                Add {fmt(5000 - cartTotal)} more for free shipping
              </div>
            )}
            <div className={styles.totalRow}>
              <span>Total</span>
              <span>{fmt(grandTotal)}</span>
            </div>
          </div>
          <button onClick={() => navigate('/checkout')} className={styles.primaryBtn}>
            Proceed to Checkout →
          </button>
          <button onClick={() => navigate('/products')} className={styles.secondaryBtn}>
            Continue shopping
          </button>
        </div>
      </div>
    </div>
  );
}
