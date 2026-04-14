import { Router } from 'express';
import { createHmac } from 'crypto';
import { queryOne, run } from '../db.js';
import { v4 as uuid } from 'uuid';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'flowtest_dev_secret_2024';

function signToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, iat: Math.floor(Date.now()/1000), exp: Math.floor(Date.now()/1000) + 7*24*3600 })).toString('base64url');
  const sig = createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
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

function hashPassword(p) {
  return createHmac('sha256', JWT_SECRET).update(p).digest('hex');
}

router.post('/register', async (req, res) => {
  try {
    const { email, name, password } = req.body;
    if (!email || !name || !password) return res.status(400).json({ error: 'All fields required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be 6+ chars' });
    const exists = await queryOne('SELECT id FROM users WHERE email=?', [email.toLowerCase()]);
    if (exists) return res.status(409).json({ error: 'Email already registered' });
    const id = uuid();
    await run('INSERT INTO users(id,email,name,password_hash) VALUES(?,?,?,?)',
      [id, email.toLowerCase(), name, hashPassword(password)]);
    const token = signToken({ userId: id, email, name });
    res.json({ token, user: { id, email, name, plan: 'starter' } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const user = await queryOne('SELECT * FROM users WHERE email=?', [email.toLowerCase()]);
    if (!user || user.password_hash !== hashPassword(password)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = signToken({ userId: user.id, email: user.email, name: user.name });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, plan: user.plan } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
    const payload = verifyToken(authHeader.slice(7));
    if (!payload) return res.status(401).json({ error: 'Invalid or expired token' });
    const user = await queryOne('SELECT id,email,name,plan FROM users WHERE id=?', [payload.userId]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/demo', async (req, res) => {
  try {
    const user = await queryOne("SELECT * FROM users WHERE email='demo@flowtest.io'");
    if (!user) return res.status(500).json({ error: 'Demo user not found — run npm run seed first' });
    const token = signToken({ userId: user.id, email: user.email, name: user.name });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, plan: user.plan } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
