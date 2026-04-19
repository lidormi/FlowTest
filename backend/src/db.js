import pg from 'pg';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set — add it in Railway Variables.');
}

const pool = process.env.DATABASE_URL ? new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
}) : null;

if (pool) pool.on('error', (err) => console.error('DB pool error:', err.message));

// Convert SQLite ? placeholders to PostgreSQL $1, $2, ...
function toParams(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

export async function initDb() {
  if (!pool) throw new Error('DATABASE_URL not set');
  await createSchema();
  await seedDemoUser();
  return pool;
}

export async function query(sql, params = []) {
  if (!pool) throw new Error('DATABASE_URL not set');
  const { rows } = await pool.query(toParams(sql), params);
  return rows;
}

export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

export async function run(sql, params = []) {
  await pool.query(toParams(sql), params);
  return {};
}


async function createSchema() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      api_key TEXT UNIQUE NOT NULL,
      created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT
    )`,
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      plan TEXT DEFAULT 'starter',
      created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT
    )`,
    `CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      user_agent TEXT,
      ip TEXT,
      country TEXT,
      screen_width INTEGER,
      screen_height INTEGER,
      start_time BIGINT,
      end_time BIGINT,
      page_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT
    )`,
    `CREATE TABLE IF NOT EXISTS events (
      id BIGSERIAL PRIMARY KEY,
      session_id TEXT NOT NULL,
      type TEXT NOT NULL,
      page TEXT,
      x INTEGER,
      y INTEGER,
      target TEXT,
      value TEXT,
      timestamp BIGINT NOT NULL,
      metadata TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS page_views (
      id BIGSERIAL PRIMARY KEY,
      session_id TEXT NOT NULL,
      url TEXT NOT NULL,
      entered_at BIGINT,
      left_at BIGINT,
      duration INTEGER,
      scroll_depth INTEGER DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS tests (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      playwright_code TEXT,
      status TEXT DEFAULT 'idle',
      last_run BIGINT,
      last_duration INTEGER,
      created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT
    )`,
    `CREATE TABLE IF NOT EXISTS test_runs (
      id BIGSERIAL PRIMARY KEY,
      test_id TEXT NOT NULL,
      status TEXT NOT NULL,
      duration INTEGER,
      error TEXT,
      steps_total INTEGER,
      steps_passed INTEGER,
      ran_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT
    )`,
    `CREATE TABLE IF NOT EXISTS test_schedules (
      id BIGSERIAL PRIMARY KEY,
      test_id TEXT NOT NULL UNIQUE,
      cron_expr TEXT NOT NULL,
      enabled INTEGER DEFAULT 1,
      last_triggered BIGINT,
      created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT
    )`,
    `CREATE TABLE IF NOT EXISTS alerts (
      id BIGSERIAL PRIMARY KEY,
      project_id TEXT NOT NULL,
      type TEXT NOT NULL,
      severity TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      metadata TEXT,
      resolved INTEGER DEFAULT 0,
      created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT
    )`,
    `CREATE TABLE IF NOT EXISTS insights (
      id BIGSERIAL PRIMARY KEY,
      project_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      impact TEXT,
      data TEXT,
      created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT
    )`,
    `CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE,
      price INTEGER NOT NULL,
      currency TEXT DEFAULT 'USD',
      category TEXT,
      badge TEXT,
      description TEXT,
      features TEXT,
      stock INTEGER DEFAULT 999,
      created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT
    )`,
    `CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      items TEXT,
      billing TEXT,
      total INTEGER,
      status TEXT DEFAULT 'pending',
      created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT
    )`,
    `CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project_id)`,
    `CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id)`,
    `CREATE INDEX IF NOT EXISTS idx_tests_project ON tests(project_id)`,
    `CREATE INDEX IF NOT EXISTS idx_alerts_project ON alerts(project_id, resolved)`,
    `CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id)`,
  ];

  for (const stmt of statements) {
    await pool.query(stmt);
  }
}

async function seedDemoUser() {
  const bcrypt = await import('bcryptjs');
  const hash = await bcrypt.default.hash('demo123', 12);

  const exists = await queryOne("SELECT id FROM users WHERE email='demo@flowtest.io'");
  if (!exists) {
    const { v4: uuid } = await import('uuid');
    await run('INSERT INTO users(id,email,name,password_hash,plan) VALUES(?,?,?,?,?)',
      [uuid(), 'demo@flowtest.io', 'Demo User', hash, 'pro']);
    console.log('✅ Demo user created');
  } else {
    // Always update hash to bcrypt format in case it was seeded with old HMAC
    await run("UPDATE users SET password_hash=? WHERE email='demo@flowtest.io'", [hash]);
  }
}
