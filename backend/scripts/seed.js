import { config } from 'dotenv';
config({ path: new URL('../.env', import.meta.url).pathname });

import { initDb, query, queryOne, run } from '../src/db.js';
import { v4 as uuid } from 'uuid';
import { createHmac } from 'crypto';

await initDb();

const PID      = 'proj_demo_001';
const API_KEY  = 'ft_live_xk9m2p4r8s1t7u3v6w0demo';
const DEMO_URL = 'http://localhost:5174'; // ShopFlow demo site

// Pages match the demo site routes
const PAGES    = ['/', '/products', '/products/headphones', '/products/keyboard', '/cart', '/checkout', '/login', '/register'];
const UAS      = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) Firefox/122.0',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Mobile Safari/604.1',
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) Chrome/121.0 Mobile',
];
const COUNTRIES = ['IL','US','UK','DE','FR','CA','AU','NL'];
const SCREENS   = [[1920,1080],[1440,900],[1366,768],[375,812],[390,844]];
const now  = () => Math.floor(Date.now()/1000);
const rand = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
const pick = arr => arr[Math.floor(Math.random()*arr.length)];

// ── Clear existing data ───────────────────────────────────────────────────────
for (const t of ['insights','alerts','test_runs','tests','page_views','events','sessions','products','orders']) {
  await run(`DELETE FROM ${t}`);
}
// Keep users, delete only seeded project
await run('DELETE FROM projects WHERE id=?', [PID]);

// ── Project ───────────────────────────────────────────────────────────────────
await run('INSERT INTO projects(id,name,url,api_key) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name, url=EXCLUDED.url',
  [PID, 'ShopFlow Demo Store', DEMO_URL, API_KEY]);
console.log('✅ Project created');

// ── Sessions ──────────────────────────────────────────────────────────────────
const sessionIds = [];
for (let i = 0; i < 200; i++) {
  const id       = `sess_${uuid().replace(/-/g,'').slice(0,12)}`;
  const screen   = pick(SCREENS);
  const startTime = now() - rand(0, 14*86400);
  const duration  = rand(15, 600);
  const startPage = pick(PAGES);
  const completed = startPage === '/checkout' ? Math.random() > 0.67 : Math.random() > 0.15;
  await run('INSERT INTO sessions(id,project_id,user_agent,ip,country,screen_width,screen_height,start_time,end_time,page_count,status) VALUES(?,?,?,?,?,?,?,?,?,?,?)',
    [id, PID, pick(UAS), `${rand(1,255)}.${rand(1,255)}.${rand(1,255)}.${rand(1,255)}`,
     pick(COUNTRIES), screen[0], screen[1], startTime, startTime+duration, rand(1,8),
     completed ? 'completed' : 'dropped']);
  sessionIds.push({ id, startTime, duration, completed });
}
console.log(`✅ ${sessionIds.length} sessions`);

// ── Events + page_views ───────────────────────────────────────────────────────
const FLOW_PAGES = ['/', '/products', '/cart', '/checkout'];
const TARGETS    = ['#add-to-cart','button[type="submit"]','.nav-link','#email','#password','.product-card','#place-order'];

for (const sess of sessionIds.slice(0, 120)) {
  const numPages = rand(1, 5);
  let t = sess.startTime;
  for (let p = 0; p < numPages; p++) {
    const page = FLOW_PAGES[p] || pick(FLOW_PAGES);
    const dur  = rand(5, 120);
    await run('INSERT INTO page_views(session_id,url,entered_at,left_at,duration,scroll_depth) VALUES(?,?,?,?,?,?)',
      [sess.id, page, t, t+dur, dur, rand(20,100)]);
    const isCheckoutDrop = page === '/checkout' && !sess.completed;
    const clickCount = isCheckoutDrop ? rand(5,12) : rand(1,4);
    for (let c = 0; c < clickCount; c++) {
      const target = pick(TARGETS);
      const type   = isCheckoutDrop && c >= 4 ? 'rage_click' : 'click';
      await run('INSERT INTO events(session_id,type,page,x,y,target,timestamp) VALUES(?,?,?,?,?,?,?)',
        [sess.id, type, page, rand(0,1920), rand(0,1080), target, t+rand(0,dur)]);
    }
    await run('INSERT INTO events(session_id,type,page,y,timestamp,metadata) VALUES(?,?,?,?,?,?)',
      [sess.id, 'scroll', page, rand(100,3000), t+rand(0,dur), JSON.stringify({ depth: rand(20,100) })]);
    t += dur;
  }
}
console.log('✅ Events + page_views');

// ── Tests — targeting the demo site ──────────────────────────────────────────
const tests = [
  { id:'test_001', name:'Homepage loads', description:'Checks hero, nav, and featured products render', status:'pass', duration:1840,
    code:`import { test, expect } from '@playwright/test';

test('Homepage loads correctly', async ({ page }) => {
  await page.goto('http://localhost:5174');
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible();
  await expect(page.locator('nav')).toBeVisible();
});` },
  { id:'test_002', name:'Add to cart flow', description:'Adds a product and verifies cart count updates', status:'pass', duration:2600,
    code:`import { test, expect } from '@playwright/test';

test('Add product to cart', async ({ page }) => {
  await page.goto('http://localhost:5174/products');
  await page.locator('[data-testid="add-to-cart"]').first().click();
  await expect(page.locator('[data-testid="cart-count"]')).toContainText('1');
});` },
  { id:'test_003', name:'Checkout flow', description:'Full add → cart → checkout → order confirmation', status:'fail', duration:5200,
    code:`import { test, expect } from '@playwright/test';

test('Checkout completes', async ({ page }) => {
  await page.goto('http://localhost:5174/products');
  await page.locator('[data-testid="add-to-cart"]').first().click();
  await page.goto('http://localhost:5174/checkout');
  await page.fill('[name="name"]', 'Test User');
  await page.fill('[name="email"]', 'test@shopflow.io');
  await page.fill('[name="cardNumber"]', '4242 4242 4242 4242');
  await page.fill('[name="expiry"]', '12/27');
  await page.fill('[name="cvc"]', '123');
  await page.click('[data-testid="place-order"]');
  await expect(page.locator('[data-testid="order-success"]')).toBeVisible({ timeout: 8000 });
});` },
  { id:'test_004', name:'User login', description:'Login with demo credentials and verify redirect', status:'pass', duration:1500,
    code:`import { test, expect } from '@playwright/test';

test('User can log in', async ({ page }) => {
  await page.goto('http://localhost:5174/login');
  await page.fill('[name="email"]', 'demo@shopflow.io');
  await page.fill('[name="password"]', 'demo123');
  await page.click('button[type="submit"]');
  await expect(page.locator('[data-testid="welcome-msg"]')).toBeVisible({ timeout: 5000 });
});` },
  { id:'test_005', name:'User registration', description:'New account creation end-to-end', status:'pass', duration:2100,
    code:`import { test, expect } from '@playwright/test';

test('User can register', async ({ page }) => {
  await page.goto('http://localhost:5174/register');
  await page.fill('[name="name"]', 'New Tester');
  await page.fill('[name="email"]', \`tester\${Date.now()}@shopflow.io\`);
  await page.fill('[name="password"]', 'SecurePass123!');
  await page.click('button[type="submit"]');
  await expect(page.locator('[data-testid="welcome-msg"]')).toBeVisible({ timeout: 5000 });
});` },
  { id:'test_006', name:'Product search & filter', description:'Category filter shows correct products', status:'idle', duration:null,
    code:`import { test, expect } from '@playwright/test';

test('Category filter works', async ({ page }) => {
  await page.goto('http://localhost:5174/products');
  await page.click('[data-testid="filter-audio"]');
  const cards = page.locator('[data-testid="product-card"]');
  await expect(cards).toHaveCount(2);
  for (const card of await cards.all()) {
    await expect(card.locator('[data-testid="product-category"]')).toContainText('Audio');
  }
});` },
];

for (const t of tests) {
  await run('INSERT INTO tests(id,project_id,name,description,playwright_code,status,last_run,last_duration) VALUES(?,?,?,?,?,?,?,?)',
    [t.id, PID, t.name, t.description, t.code, t.status, t.status!=='idle' ? now()-rand(60,7200) : null, t.duration||null]);
  for (let i = 0; i < rand(6,18); i++) {
    const passed = Math.random() > (t.id==='test_003' ? 0.55 : 0.15);
    const steps  = 5;
    const sp     = passed ? steps : rand(1, steps-1);
    await run('INSERT INTO test_runs(test_id,status,duration,error,steps_total,steps_passed,ran_at) VALUES(?,?,?,?,?,?,?)',
      [t.id, passed?'pass':'fail', (t.duration||3000)+rand(-500,500),
       passed?null:'TimeoutError: element not found after 5000ms', steps, sp, now()-rand(0,14*86400)]);
  }
}
console.log(`✅ ${tests.length} tests`);

// ── Alerts ────────────────────────────────────────────────────────────────────
const alertsData = [
  ['test_failure','critical','Checkout test broken','selector [data-testid="place-order"] not found on step 3',JSON.stringify({test_id:'test_003',browser:'Chrome'}),now()-120],
  ['drop_spike','high','High drop rate on /checkout','67% abandon at payment step. Rage clicks on #place-order.',JSON.stringify({page:'/checkout',drop_rate:0.67,rage_clicks:47}),now()-840],
  ['element_issue','medium','Add-to-cart button unresponsive on mobile','z-index overlap on screens < 375px',JSON.stringify({selector:'#add-to-cart',device:'mobile'}),now()-3600],
  ['performance','medium','Slow load on /checkout','/checkout averaging 4.2s — above 3s threshold.',JSON.stringify({page:'/checkout',avg_ms:4200}),now()-7200],
  ['test_failure','low','Login test flaky','test_004 times out 20% of runs — auth redirect race condition.',JSON.stringify({test_id:'test_004',failure_rate:0.2}),now()-18000],
];
for (const [type,severity,title,description,metadata,created_at] of alertsData) {
  await run('INSERT INTO alerts(project_id,type,severity,title,description,metadata,resolved,created_at) VALUES(?,?,?,?,?,?,?,?)',
    [PID,type,severity,title,description,metadata,0,created_at]);
}
console.log('✅ Alerts');

// ── Insights ──────────────────────────────────────────────────────────────────
const insightsData = [
  ['funnel_drop',   '67% users drop at /checkout','Payment form has 6 fields — above the 3-field threshold.',   'Fixing = +18% conversion',JSON.stringify({page:'/checkout',drop_rate:0.67})],
  ['rage_click',    '#place-order receiving rage clicks','Appears unresponsive during payment API call.', 'Critical UX fix',JSON.stringify({selector:'#place-order',avg_clicks:6.4})],
  ['performance',   '/checkout loads in 4.2s','Above 3s threshold, causing frustration bounce.',               'Fixing = +22% conversion',JSON.stringify({page:'/checkout',avg_ms:4200})],
  ['suggestion',    'Show cart total in navbar','64% of users revisit cart page just to check the total.',       'Est. +8% checkout starts',JSON.stringify({})],
  ['suggestion',    'Reduce checkout to 2 steps','Current 3-step flow loses 26% per step.',                    'Est. +18% conversion',JSON.stringify({current_steps:3,recommended:2})],
];
for (const [type,title,description,impact,data] of insightsData) {
  await run('INSERT INTO insights(project_id,type,title,description,impact,data) VALUES(?,?,?,?,?,?)',
    [PID,type,title,description,impact,data]);
}
console.log('✅ Insights');

// ── Products (marketplace) ─────────────────────────────────────────────────────
const products = [
  { id:'prod_001', name:'Screen Recording Pro',  slug:'recording-pro',    price:2900,  cat:'analytics',    badge:'Popular',    desc:'Capture full session replays with rage click detection.',  features:['Unlimited recordings','Rage click detection','Heatmaps','7-day storage'] },
  { id:'prod_002', name:'AI Insights Package',   slug:'ai-insights',      price:4900,  cat:'analytics',    badge:'Hot',        desc:'AI-powered funnel analysis.',                              features:['Drop-off prediction','GPT-4 explanations','Weekly digest'] },
  { id:'prod_003', name:'Test Automation Suite', slug:'test-automation',  price:7900,  cat:'testing',      badge:null,         desc:'Auto-generate Playwright tests from sessions.',            features:['Auto-generate tests','CI/CD integration','Flaky detection'] },
  { id:'prod_004', name:'Full Platform Bundle',  slug:'full-platform',    price:19900, cat:'bundle',       badge:'Best Value', desc:'Everything: recordings, AI, and tests.',                   features:['All Pro features','Unlimited projects','Priority support'] },
  { id:'prod_005', name:'Slack Integration',     slug:'slack-integration',price:900,   cat:'integrations', badge:'New',        desc:'Real-time alerts to your Slack channels.',                 features:['Real-time alerts','Weekly digest','Custom thresholds'] },
  { id:'prod_006', name:'White-Label License',   slug:'white-label',      price:49900, cat:'enterprise',   badge:'Enterprise', desc:'Rebrand and resell the full platform.',                    features:['Custom domain','Reseller rights','SLA guarantee'] },
];
for (const p of products) {
  await run('INSERT INTO products(id,name,slug,price,currency,category,badge,description,features,stock) VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING',
    [p.id, p.name, p.slug, p.price, 'USD', p.cat, p.badge||null, p.desc, JSON.stringify(p.features), 999]);
}
console.log('✅ Products');

// ── Summary ───────────────────────────────────────────────────────────────────
const [sc, tc, ac, ec] = await Promise.all([
  queryOne('SELECT COUNT(*) as c FROM sessions'),
  queryOne('SELECT COUNT(*) as c FROM tests'),
  queryOne('SELECT COUNT(*) as c FROM alerts WHERE resolved=0'),
  queryOne('SELECT COUNT(*) as c FROM events'),
]);
console.log('\n🎉 Seed complete!');
console.log(`   📊 ${sc.c} sessions  ⬡ ${tc.c} tests  🚨 ${ac.c} alerts  📍 ${ec.c} events`);
console.log(`   🔑 API Key: ${API_KEY}`);
console.log(`   🌐 Demo site: ${DEMO_URL}`);
process.exit(0);
