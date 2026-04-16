import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { initDb } from './db.js';
import { initWebSocket, broadcast } from './websocket.js';
import { loadSchedules } from './scheduler.js';

import dashboardRoutes from './routes/dashboard.js';
import sessionsRoutes from './routes/sessions.js';
import testsRoutes from './routes/tests.js';
import insightsRoutes from './routes/insights.js';
import trackRoutes from './routes/track.js';
import authRoutes from './routes/auth.js';
import exportRoutes from './routes/export.js';
import schedulesRoutes from './routes/schedules.js';
import analyticsRoutes from './routes/analytics.js';
import productsRoutes from './routes/products.js';
import aiRoutes from './routes/ai.js';

const app = express();
const port = process.env.PORT || 3001;

process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err.message, err.stack);
});

process.on('unhandledRejection', (reason) => {
  console.error('💥 Unhandled Rejection:', reason);
});

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});
app.use(express.json({ limit: '2mb' }));

// ── Health check — always available, registered before DB init ────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), version: '1.1.0' });
});

// ── Static tracker script ─────────────────────────────────────────────────────
app.get('/tracker.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(new URL('../scripts/tracker.js', import.meta.url).pathname);
});

// ── Start server immediately so Railway sees a live process ───────────────────
const server = createServer(app);
initWebSocket(server);

server.listen(port, '0.0.0.0', () => {
  console.log(`🚀 FlowTest API  → http://localhost:${port}`);
  console.log(`🔌 WebSocket     → ws://localhost:${port}`);
});

// ── Initialize DB and register routes asynchronously ─────────────────────────
try {
  await initDb();
  console.log('✅ Database ready');

  app.use('/api/auth',      authRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/sessions',  sessionsRoutes);
  app.use('/api/tests',     testsRoutes);
  app.use('/api/insights',  insightsRoutes);
  app.use('/api/track',     trackRoutes);
  app.use('/api/export',    exportRoutes);
  app.use('/api/schedules', schedulesRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/products',  productsRoutes);
  app.use('/api/ai',        aiRoutes);

  loadSchedules();
  console.log('📅 Scheduler     → ready');

  // Live demo WebSocket events
  let liveCounter = 4821;
  const DEMO_PAGES    = ['/checkout','/login','/signup','/dashboard','/pricing','/'];
  const DEMO_COUNTRIES = ['IL','US','UK','DE','FR','CA','AU'];
  setInterval(() => {
    liveCounter++;
    broadcast('new_session', {
      id:      `sess_live_${liveCounter}`,
      page:    DEMO_PAGES[Math.floor(Math.random() * DEMO_PAGES.length)],
      country: DEMO_COUNTRIES[Math.floor(Math.random() * DEMO_COUNTRIES.length)],
      status:  Math.random() > 0.3 ? 'completed' : 'dropped',
      time:    Date.now()
    });
  }, 8000);

  setInterval(() => {
    if (Math.random() > 0.65) {
      broadcast('alert', {
        title:       'Drop rate spike on /checkout',
        severity:    'high',
        description: 'Above threshold in last 5 minutes'
      });
    }
  }, 35000);

} catch (e) {
  console.error('❌ Database init failed:', e.message);
  console.error('   API routes are unavailable. Check DATABASE_URL in Railway Variables.');
}
