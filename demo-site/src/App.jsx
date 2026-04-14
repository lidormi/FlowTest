import React, { useState, useEffect, createContext, useContext } from 'react';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import Products from './pages/Products.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import Auth from './pages/Auth.jsx';

// ── Cart Context ──────────────────────────────────────────────────────────────
const CartContext = createContext(null);
export function useCart() { return useContext(CartContext); }

// ── Auth Context ──────────────────────────────────────────────────────────────
const AuthCtx = createContext(null);
export function useShopAuth() { return useContext(AuthCtx); }

// ── Simple router ─────────────────────────────────────────────────────────────
function getRoute() {
  const p = location.pathname;
  if (p === '/' || p === '') return { page: 'home' };
  if (p === '/products') return { page: 'products' };
  if (p.startsWith('/products/')) return { page: 'product', slug: p.split('/')[2] };
  if (p === '/cart') return { page: 'cart' };
  if (p === '/checkout') return { page: 'checkout' };
  if (p === '/login') return { page: 'auth', mode: 'login' };
  if (p === '/register') return { page: 'auth', mode: 'register' };
  return { page: 'home' };
}

export function navigate(path) {
  history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export default function App() {
  const [route, setRoute] = useState(getRoute());
  const [cartItems, setCartItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sf_cart') || '[]'); } catch { return []; }
  });
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sf_user') || 'null'); } catch { return null; }
  });

  useEffect(() => {
    const handler = () => setRoute(getRoute());
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  useEffect(() => { localStorage.setItem('sf_cart', JSON.stringify(cartItems)); }, [cartItems]);

  function addToCart(product) {
    setCartItems(prev => {
      const ex = prev.find(i => i.id === product.id);
      return ex ? prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i) : [...prev, { ...product, qty: 1 }];
    });
  }
  function updateQty(id, delta) {
    setCartItems(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i).filter(i => i.qty > 0));
  }
  function clearCart() { setCartItems([]); }
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);

  function shopLogin(userData) {
    setUser(userData);
    localStorage.setItem('sf_user', JSON.stringify(userData));
  }
  function shopLogout() {
    setUser(null);
    localStorage.removeItem('sf_user');
    navigate('/');
  }

  return (
    <CartContext.Provider value={{ cartItems, addToCart, updateQty, clearCart, cartCount, cartTotal }}>
      <AuthCtx.Provider value={{ user, shopLogin, shopLogout }}>
        <div style={{ minHeight: '100vh', background: '#f8f9ff', fontFamily: "'Inter', system-ui, sans-serif", color: '#111' }}>
          <Navbar cartCount={cartCount} user={user} onLogout={shopLogout} />
          <main style={{ paddingTop: route.page === 'home' ? 0 : 64 }}>
            {route.page === 'home'     && <Home />}
            {route.page === 'products' && <Products />}
            {route.page === 'product'  && <ProductDetail slug={route.slug} />}
            {route.page === 'cart'     && <Cart />}
            {route.page === 'checkout' && <Checkout />}
            {route.page === 'auth'     && <Auth mode={route.mode} />}
          </main>
        </div>
      </AuthCtx.Provider>
    </CartContext.Provider>
  );
}
