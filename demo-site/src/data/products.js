export const PRODUCTS = [

  /* ── AUDIO ─────────────────────────────────────────────── */
  {
    id:'headphones', slug:'headphones', name:'Pro Wireless Headphones',
    category:'Audio', price:7900, originalPrice:10900,
    rating:4.8, reviews:312, badge:'Bestseller', stock:23,
    image:'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
    description:'Premium noise-cancelling over-ear headphones with 40h battery life.',
    features:['Active Noise Cancellation','40h battery','Bluetooth 5.3','Foldable','USB-C charging'],
  },
  {
    id:'webcam', slug:'webcam', name:'4K Streaming Webcam',
    category:'Audio', price:8900, originalPrice:11900,
    rating:4.4, reviews:267, badge:'Hot', stock:19,
    image:'https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=400&q=80',
    description:'4K 30fps webcam with built-in ring light, background blur, and auto-framing.',
    features:['4K 30fps / 1080p 60fps','Built-in ring light','Auto-framing AI','Background blur','USB-C'],
  },
  {
    id:'earbuds', slug:'earbuds', name:'True Wireless Earbuds',
    category:'Audio', price:5900, originalPrice:7900,
    rating:4.6, reviews:541, badge:'New', stock:38,
    image:'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&q=80',
    description:'IPX5 waterproof earbuds with 28h total battery and active noise cancellation.',
    features:['ANC','IPX5 waterproof','28h total battery','Touch controls','Fast charge'],
  },

  /* ── PERIPHERALS ────────────────────────────────────────── */
  {
    id:'keyboard', slug:'keyboard', name:'Mechanical Keyboard TKL',
    category:'Peripherals', price:14900, originalPrice:18900,
    rating:4.7, reviews:198, badge:'Popular', stock:11,
    image:'https://images.unsplash.com/photo-1561112078-7d24e04c3407?w=400&q=80',
    description:'Tenkeyless mechanical keyboard with Cherry MX switches and per-key RGB.',
    features:['Cherry MX Brown','Per-key RGB','Aluminum frame','PBT keycaps','N-Key rollover'],
  },
  {
    id:'mouse', slug:'mouse', name:'Ergonomic Wireless Mouse',
    category:'Peripherals', price:4900, originalPrice:null,
    rating:4.6, reviews:524, badge:null, stock:58,
    image:'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&q=80',
    description:'Vertical ergonomic mouse designed to reduce wrist strain.',
    features:['Vertical ergonomic','2.4GHz wireless','6 buttons','90-day battery','DPI 800–3200'],
  },
  {
    id:'mousepad', slug:'mousepad', name:'XXL Desk Mouse Pad',
    category:'Peripherals', price:2900, originalPrice:3900,
    rating:4.5, reviews:873, badge:null, stock:91,
    image:'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=400&q=80',
    description:'900×400mm stitched-edge desk mat with non-slip rubber base.',
    features:['900×400mm','Stitched edges','Non-slip rubber','Washable','2mm thick'],
  },

  /* ── ACCESSORIES ────────────────────────────────────────── */
  {
    id:'hub', slug:'hub', name:'USB-C Hub 12-in-1',
    category:'Accessories', price:3900, originalPrice:5500,
    rating:4.5, reviews:881, badge:'New', stock:34,
    image:'https://images.unsplash.com/photo-1625842268584-8f3296236761?w=400&q=80',
    description:'12-in-1 USB-C hub with 4K HDMI, SD reader, and 100W PD.',
    features:['4K HDMI @ 60Hz','100W PD','4× USB-A 3.0','SD & microSD','Gigabit Ethernet'],
  },
  {
    id:'stand', slug:'stand', name:'Monitor Arm Dual',
    category:'Accessories', price:8900, originalPrice:null,
    rating:4.9, reviews:156, badge:null, stock:7,
    image:'https://images.unsplash.com/photo-1586227740560-8cf2732c1531?w=400&q=80',
    description:'Fully adjustable dual monitor arm with VESA 75/100 compatibility.',
    features:['Dual monitor','±90° rotation','360° swivel','VESA 75/100','Max 9kg per arm'],
  },
  {
    id:'lamp', slug:'lamp', name:'LED Desk Lamp Pro',
    category:'Accessories', price:3500, originalPrice:4900,
    rating:4.3, reviews:423, badge:null, stock:41,
    image:'https://images.unsplash.com/photo-1524275539700-cf51138f679b?w=400&q=80',
    description:'Architect-style LED lamp with wireless charging pad and USB-A.',
    features:['5 colour temps','10 brightness levels','Wireless Qi charging','USB-A port','Memory function'],
  },
  {
    id:'laptop-stand', slug:'laptop-stand', name:'Portable Laptop Stand',
    category:'Accessories', price:4500, originalPrice:null,
    rating:4.6, reviews:612, badge:null, stock:62,
    image:'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&q=80',
    description:'Ultra-thin foldable aluminium laptop stand with 6 height levels.',
    features:['6 height levels','Aluminium alloy','Folds flat','Universal 11"–17"','Under 350g'],
  },

  /* ── CLOTHING ────────────────────────────────────────────── */
  {
    id:'tshirt', slug:'tshirt', name:'Classic Cotton T-Shirt',
    category:'Clothing', price:1900, originalPrice:2900,
    rating:4.4, reviews:1204, badge:'New', stock:120,
    image:'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80',
    description:'100% organic cotton unisex tee. Pre-shrunk, ribbed collar, available in 12 colours.',
    features:['100% organic cotton','Pre-shrunk','Ribbed crew neck','12 colour options','Unisex fit'],
  },
  {
    id:'hoodie', slug:'hoodie', name:'Fleece Zip Hoodie',
    category:'Clothing', price:4400, originalPrice:5900,
    rating:4.7, reviews:387, badge:'Popular', stock:55,
    image:'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=400&q=80',
    description:'Heavyweight 350gsm fleece hoodie with kangaroo pocket and YKK zip.',
    features:['350gsm fleece','Full YKK zip','Kangaroo pocket','Brushed interior','6 colours'],
  },
  {
    id:'sneakers', slug:'sneakers', name:'Running Sneakers Ultra',
    category:'Clothing', price:8900, originalPrice:11900,
    rating:4.8, reviews:962, badge:'Hot', stock:28,
    image:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',
    description:'Lightweight responsive running shoe with carbon-fibre midsole and breathable mesh upper.',
    features:['Carbon-fibre midsole','Breathable mesh','Grip outsole','6mm drop','240g per shoe'],
  },
  {
    id:'chinos', slug:'chinos', name:'Slim Fit Chinos',
    category:'Clothing', price:3900, originalPrice:null,
    rating:4.3, reviews:276, badge:null, stock:84,
    image:'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80',
    description:'Stretch cotton-blend chinos with a modern slim fit. Wrinkle-resistant.',
    features:['98% cotton / 2% elastane','Wrinkle-resistant','Slim fit','5 pockets','Machine washable'],
  },
  {
    id:'cap', slug:'cap', name:'Structured Baseball Cap',
    category:'Clothing', price:2200, originalPrice:2900,
    rating:4.5, reviews:533, badge:null, stock:99,
    image:'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&q=80',
    description:'6-panel structured cap with embroidered logo, adjustable snapback.',
    features:['6-panel structured','Embroidered logo','Snapback closure','One size fits all','UV protection 50+'],
  },

  /* ── PET FOOD ────────────────────────────────────────────── */
  {
    id:'dog-food-dry', slug:'dog-food-dry', name:'Premium Dry Dog Food 5kg',
    category:'Pet Food', price:4200, originalPrice:5400,
    rating:4.8, reviews:2341, badge:'Bestseller', stock:77,
    image:'https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?w=400&q=80',
    description:'High-protein dry kibble with real chicken, brown rice, and vegetables. No artificial additives.',
    features:['Real chicken #1 ingredient','28% protein','Omega-3 & 6','No artificial colours','All breeds & ages'],
  },
  {
    id:'dog-food-puppy', slug:'dog-food-puppy', name:'Grain-Free Puppy Food 3kg',
    category:'Pet Food', price:3400, originalPrice:null,
    rating:4.6, reviews:788, badge:'New', stock:43,
    image:'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=400&q=80',
    description:'Grain-free recipe for puppies with salmon, sweet potato, and DHA for brain development.',
    features:['Grain-free','DHA for brain development','Salmon protein','No wheat/corn/soy','Puppies 0–12 months'],
  },
  {
    id:'dog-treats', slug:'dog-treats', name:'Natural Dog Treats 500g',
    category:'Pet Food', price:1600, originalPrice:2200,
    rating:4.9, reviews:4102, badge:'Hot', stock:200,
    image:'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80',
    description:'Single-ingredient freeze-dried chicken breast treats. Perfect for training.',
    features:['Single ingredient','Freeze-dried','No preservatives','High value for training','Grain-free'],
  },
  {
    id:'dog-food-wet', slug:'dog-food-wet', name:'Wet Food Variety Pack ×12',
    category:'Pet Food', price:2800, originalPrice:3600,
    rating:4.5, reviews:621, badge:null, stock:55,
    image:'https://images.unsplash.com/photo-1583511655826-05700d52f4d9?w=400&q=80',
    description:'12 × 400g pouches in 4 flavours: chicken, beef, salmon, and lamb.',
    features:['4 flavours included','95% meat content','No added sugar','Easy-open pouches','Adult dogs'],
  },

  /* ── FURNITURE ───────────────────────────────────────────── */
  {
    id:'office-chair', slug:'office-chair', name:'Ergonomic Mesh Office Chair',
    category:'Furniture', price:19900, originalPrice:27900,
    rating:4.7, reviews:514, badge:'Hot', stock:14,
    image:'https://images.unsplash.com/photo-1505843490701-5be4e3f52f5e?w=400&q=80',
    description:'Full-mesh ergonomic chair with lumbar support, adjustable armrests, and 5-year warranty.',
    features:['Breathable mesh back','Adjustable lumbar','4D armrests','Seat depth adjust','5-year warranty'],
  },
  {
    id:'desk', slug:'desk', name:'L-Shaped Computer Desk',
    category:'Furniture', price:24900, originalPrice:31900,
    rating:4.6, reviews:287, badge:null, stock:9,
    image:'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400&q=80',
    description:'160×120cm L-shaped desk with cable management tray and monitor shelf.',
    features:['160×120cm surface','Cable management','Monitor shelf','Steel frame','Easy assembly'],
  },
  {
    id:'bookshelf', slug:'bookshelf', name:'5-Tier Ladder Bookshelf',
    category:'Furniture', price:11900, originalPrice:15900,
    rating:4.5, reviews:341, badge:'New', stock:22,
    image:'https://images.unsplash.com/photo-1594620302200-9a762244a156?w=400&q=80',
    description:'Modern ladder-style bookshelf in solid pine with steel frame. Holds up to 25kg per shelf.',
    features:['5 shelves','Solid pine boards','Steel frame','25kg per shelf','183cm tall'],
  },
  {
    id:'floor-lamp', slug:'floor-lamp', name:'Arc Floor Lamp',
    category:'Furniture', price:7900, originalPrice:9900,
    rating:4.4, reviews:198, badge:null, stock:31,
    image:'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&q=80',
    description:'Modern arc floor lamp with marble base, linen shade, and dimmer switch.',
    features:['Arc design','Marble base','Linen drum shade','Inline dimmer','E27 socket (bulb incl.)'],
  },
];

export function getProduct(slug) {
  return PRODUCTS.find(p => p.slug === slug);
}

export function fmt(cents) {
  return '$' + (cents / 100).toFixed(2).replace(/\.00$/, '');
}
