import { Router } from 'express';
import { queryOne, run } from '../db.js';
import { v4 as uuid } from 'uuid';

const router = Router();

async function validateApiKey(req, res, next) {
  const key = req.headers['x-api-key'] || req.query.key;
  if (!key) return res.status(401).json({ error: 'Missing API key' });
  const project = await queryOne('SELECT * FROM projects WHERE api_key=?', [key]);
  if (!project) return res.status(401).json({ error: 'Invalid API key' });
  req.project = project;
  next();
}

router.post('/session/start', validateApiKey, async (req, res) => {
  try {
    const { userAgent, screenWidth, screenHeight, country } = req.body;
    const id = `sess_${uuid().replace(/-/g,'').slice(0,12)}`;
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || '0.0.0.0';
    await run('INSERT INTO sessions(id,project_id,user_agent,ip,country,screen_width,screen_height,start_time,status) VALUES(?,?,?,?,?,?,?,?,?)',
      [id, req.project.id, userAgent || '', ip, country || null, screenWidth || null, screenHeight || null, Math.floor(Date.now()/1000), 'active']);
    res.json({ sessionId: id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/events', validateApiKey, async (req, res) => {
  try {
    const { sessionId, events } = req.body;
    if (!sessionId || !Array.isArray(events)) return res.status(400).json({ error: 'Invalid payload' });
    const session = await queryOne('SELECT id FROM sessions WHERE id=? AND project_id=?', [sessionId, req.project.id]);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const clickCounts = {};
    for (const e of events) {
      await run('INSERT INTO events(session_id,type,page,x,y,target,value,timestamp,metadata) VALUES(?,?,?,?,?,?,?,?,?)',
        [sessionId, e.type, e.page||'', e.x||null, e.y||null, e.target||null, e.value||null, e.timestamp, e.metadata ? JSON.stringify(e.metadata) : null]);
      if (e.type === 'click' && e.target) {
        const key = `${e.target}:${e.page}`;
        clickCounts[key] = (clickCounts[key] || 0) + 1;
        if (clickCounts[key] >= 5) {
          await run('INSERT INTO events(session_id,type,page,x,y,target,timestamp) VALUES(?,?,?,?,?,?,?)',
            [sessionId, 'rage_click', e.page||'', e.x||null, e.y||null, e.target, e.timestamp]);
        }
      }
      if (e.type === 'pageview') {
        await run('INSERT INTO page_views(session_id,url,entered_at,scroll_depth) VALUES(?,?,?,?)',
          [sessionId, e.page||'/', e.timestamp, 0]);
      }
    }
    await run('UPDATE sessions SET page_count=(SELECT COUNT(DISTINCT page) FROM events WHERE session_id=?) WHERE id=?', [sessionId, sessionId]);
    res.json({ ok: true, received: events.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/session/end', validateApiKey, async (req, res) => {
  try {
    const { sessionId, status = 'completed' } = req.body;
    await run('UPDATE sessions SET end_time=?, status=? WHERE id=? AND project_id=?',
      [Math.floor(Date.now()/1000), status, sessionId, req.project.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
