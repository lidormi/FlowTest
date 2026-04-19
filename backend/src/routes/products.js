import express from 'express';
import { query, run, queryOne } from '../db.js';
import { verifyToken } from './auth.js';

const router = express.Router();

function optionalAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) {
    const payload = verifyToken(auth.slice(7));
    if (payload) req.user = payload;
  }
  next();
}

async function seedProducts() {
  // Always upsert the ShopFlow demo products so they stay in sync with the frontend
  const items = [
    { id:'headphones',   slug:'headphones',   name:'Pro Wireless Headphones', price:7900,  category:'Audio',       badge:'Bestseller', desc:'Premium noise-cancelling over-ear headphones with 40h battery life and studio-quality sound.',        features:['Active Noise Cancellation','40h battery','Bluetooth 5.3','Foldable design','USB-C charging'] },
    { id:'keyboard',     slug:'keyboard',     name:'Mechanical Keyboard TKL', price:14900, category:'Peripherals', badge:'Popular',    desc:'Tenkeyless mechanical keyboard with Cherry MX switches and per-key RGB lighting.',                    features:['Cherry MX Brown switches','Per-key RGB','Aluminum frame','PBT keycaps','N-Key rollover'] },
    { id:'mouse',        slug:'mouse',        name:'Ergonomic Wireless Mouse', price:4900,  category:'Peripherals', badge:null,         desc:'Ergonomic vertical mouse designed to reduce wrist strain during long sessions.',                      features:['Vertical ergonomic design','2.4GHz wireless','6 programmable buttons','90-day battery','DPI 800-3200'] },
    { id:'hub',          slug:'hub',          name:'USB-C Hub 12-in-1',       price:3900,  category:'Accessories', badge:'New',        desc:'12-in-1 USB-C hub with 4K HDMI, SD card reader, and 100W PD pass-through.',                           features:['4K HDMI @ 60Hz','100W Power Delivery','4x USB-A 3.0','SD & microSD reader','Gigabit Ethernet'] },
    { id:'stand',        slug:'stand',        name:'Monitor Arm Dual',        price:8900,  category:'Accessories', badge:null,         desc:'Fully adjustable dual monitor arm with VESA 75/100 compatibility and cable management.',               features:['Dual monitor support','90 degree rotation','360 degree swivel','VESA 75/100','Max 9kg per arm'] },
    { id:'webcam',       slug:'webcam',       name:'4K Streaming Webcam',     price:8900,  category:'Audio',       badge:'Hot',        desc:'4K 30fps webcam with built-in ring light, background blur, and auto-framing.',                        features:['4K 30fps / 1080p 60fps','Built-in ring light','Auto-framing AI','Background blur','Plug-and-play USB-C'] },
    { id:'lamp',         slug:'lamp',         name:'LED Desk Lamp Pro',       price:3500,  category:'Accessories', badge:null,         desc:'Architect-style LED desk lamp with wireless charging pad and USB-A port.',                           features:['5 colour temps','10 brightness levels','Wireless Qi charging','USB-A charging port','Memory function'] },
    { id:'laptop-stand', slug:'laptop-stand', name:'Portable Laptop Stand',  price:4500,  category:'Accessories', badge:null,         desc:'Ultra-thin foldable aluminium laptop stand with 6 height levels.',                                    features:['6 adjustable heights','Aluminium alloy','Folds flat','Universal fit 11-17 inch','Under 350g'] },
  ];
  for (const p of items) {
    await run(
      'INSERT INTO products(id,name,slug,price,currency,category,badge,description,features,stock) VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name, price=EXCLUDED.price, category=EXCLUDED.category, badge=EXCLUDED.badge, description=EXCLUDED.description, features=EXCLUDED.features',
      [p.id, p.name, p.slug, p.price, 'USD', p.category, p.badge||null, p.desc, JSON.stringify(p.features), 999]
    );
  }
}

router.get('/', optionalAuth, async (req, res) => {
  try {
    await seedProducts();
    const { category } = req.query;
    let sql = 'SELECT * FROM products WHERE stock > 0';
    const params = [];
    if (category && category !== 'all') { sql += ' AND category=?'; params.push(category); }
    sql += ' ORDER BY price ASC';
    const products = (await query(sql, params)).map(p => ({ ...p, features: JSON.parse(p.features||'[]') }));
    res.json({ products });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/orders/list', optionalAuth, async (req, res) => {
  try {
    const orders = (await query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 50'))
      .map(o => ({ ...o, items: JSON.parse(o.items||'[]'), billing: JSON.parse(o.billing||'{}') }));
    res.json({ orders });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/orders', optionalAuth, async (req, res) => {
  try {
    const { items, billing, card } = req.body;
    if (!items?.length) return res.status(400).json({ error: 'No items in order' });
    if (!billing?.email || !billing?.name) return res.status(400).json({ error: 'Billing info required' });
    if (!card?.number || !card?.expiry || !card?.cvc) return res.status(400).json({ error: 'Card details required' });
    const digits = card.number.replace(/\D/g,'');
    const last4 = digits.slice(-4);
    let total = 0;
    const lineItems = [];
    for (const item of items) {
      const p = await queryOne('SELECT * FROM products WHERE id=?', [item.productId]);
      if (!p) return res.status(400).json({ error: `Product ${item.productId} not found` });
      const qty = Math.max(1, parseInt(item.qty)||1);
      total += p.price * qty;
      lineItems.push({ productId: p.id, name: p.name, price: p.price, qty });
    }
    if (digits !== '4242424242424242' && digits !== '5555555555554444' && Math.random() < 0.05) {
      return res.status(402).json({ error: 'Card declined. Please try a different card.', code: 'card_declined' });
    }
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
    await run('INSERT INTO orders(id,user_id,items,billing,total,status,created_at) VALUES(?,?,?,?,?,?,?)',
      [orderId, req.user?.userId||null, JSON.stringify(lineItems), JSON.stringify({ name:billing.name, email:billing.email, country:billing.country||'IL', card_last4: last4 }), total, 'paid', Date.now()]);
    res.json({ success:true, order:{ id:orderId, total, items:lineItems, billing:{ name:billing.name, email:billing.email }, status:'paid', createdAt:new Date().toISOString() } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const p = await queryOne('SELECT * FROM products WHERE id=? OR slug=?', [req.params.id, req.params.id]);
    if (!p) return res.status(404).json({ error: 'Product not found' });
    res.json({ product: { ...p, features: JSON.parse(p.features||'[]') } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
