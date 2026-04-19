import { Router } from 'express';
import { createHmac } from 'crypto';
import bcrypt from 'bcryptjs';
import { queryOne, run } from '../db.js';
import { v4 as uuid } from 'uuid';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'flowtest_dev_secret_2024';

// ── JWT (HMAC-SHA256 is correct for JWT signing) ────────────────────────────
function signToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body   = Buffer.from(JSON.stringify({ ...payload, iat: Math.floor(Date.now()/1000), exp: Math.floor(Date.now()/1000) + 7*24*3600 })).toString('base64url');
  const sig    = createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

export function verifyToken(token) {
  try {
    const [header, body, sig] = token.split('.');
    const expected = createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    if (sig !== expected) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (payload.exp < Math.floor(Date.now()/1000)) return null;
    return payload;
  } catch { return null; }
}

// ── Auth middleware ──────────────────────────────────────────────────────────
export function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Authentication required' });
  const payload = verifyToken(auth.slice(7));
  if (!payload) return res.status(401).json({ error: 'Invalid or expired token' });
  req.user = payload;
  next();
}

// ── Password hashing (bcrypt) ────────────────────────────────────────────────
export async function hashPassword(p) {
  return bcrypt.hash(p, 12);
}

export async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

// ── Input validation ─────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegister(email, name, password) {
  if (!email || !name || !password) return 'All fields required';
  if (!EMAIL_RE.test(email)) return 'Invalid email address';
  if (email.length > 254) return 'Email too long';
  if (name.length < 2 || name.length > 80) return 'Name must be 2–80 characters';
  if (password.length < 6 || password.length > 128) return 'Password must be 6–128 characters';
  return null;
}

// ── Routes ───────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { email, name, password } = req.body;
    const err = validateRegister(email, name, password);
    if (err) return res.status(400).json({ error: err });
    const exists = await queryOne('SELECT id FROM users WHERE email=?', [email.toLowerCase().trim()]);
    if (exists) return res.status(409).json({ error: 'Email already registered' });
    const id = uuid();
    const hash = await hashPassword(password);
    await run('INSERT INTO users(id,email,name,password_hash) VALUES(?,?,?,?)',
      [id, email.toLowerCase().trim(), name.trim(), hash]);
    const token = signToken({ userId: id, email: email.toLowerCase().trim(), name: name.trim() });
    res.json({ token, user: { id, email: email.toLowerCase().trim(), name: name.trim(), plan: 'starter' } });
  } catch { res.status(500).json({ error: 'Registration failed' }); }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    if (typeof email !== 'string' || typeof password !== 'string') return res.status(400).json({ error: 'Invalid input' });
    const user = await queryOne('SELECT * FROM users WHERE email=?', [email.toLowerCase().trim()]);
    const valid = user ? await comparePassword(password, user.password_hash) : false;
    if (!user || !valid) return res.status(401).json({ error: 'Invalid email or password' });
    const token = signToken({ userId: user.id, email: user.email, name: user.name });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, plan: user.plan } });
  } catch { res.status(500).json({ error: 'Login failed' }); }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await queryOne('SELECT id,email,name,plan FROM users WHERE id=?', [req.user.userId]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.post('/demo', async (req, res) => {
  try {
    const user = await queryOne("SELECT id,email,name,plan FROM users WHERE email='demo@flowtest.io'");
    if (!user) return res.status(500).json({ error: 'Demo user not found' });
    const token = signToken({ userId: user.id, email: user.email, name: user.name });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, plan: user.plan } });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

export default router;
