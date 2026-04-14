import { Router } from 'express';
import { query, queryOne } from '../db.js';

const router = Router();
const PID = 'proj_demo_001';

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    let where = 'WHERE s.project_id=?';
    const params = [PID];
    if (status) { where += ' AND s.status=?'; params.push(status); }

    const [sessions, totalRow] = await Promise.all([
      query(`
        SELECT s.*,
          (SELECT COUNT(*) FROM events WHERE session_id=s.id AND type='rage_click') as rage_clicks,
          (SELECT url FROM page_views WHERE session_id=s.id ORDER BY entered_at ASC LIMIT 1) as first_page,
          (SELECT url FROM page_views WHERE session_id=s.id ORDER BY entered_at DESC LIMIT 1) as last_page
        FROM sessions s ${where} ORDER BY s.start_time DESC LIMIT ? OFFSET ?
      `, [...params, Number(limit), offset]),
      queryOne(`SELECT COUNT(*) as c FROM sessions s ${where}`, params),
    ]);
    const total = Number(totalRow.c);
    res.json({ sessions, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const [session, events, pageViews] = await Promise.all([
      queryOne('SELECT * FROM sessions WHERE id=?', [req.params.id]),
      query('SELECT * FROM events WHERE session_id=? ORDER BY timestamp ASC', [req.params.id]),
      query('SELECT * FROM page_views WHERE session_id=? ORDER BY entered_at ASC', [req.params.id]),
    ]);
    if (!session) return res.status(404).json({ error: 'Not found' });
    res.json({ ...session, events, pageViews, duration: session.end_time ? session.end_time - session.start_time : null });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
