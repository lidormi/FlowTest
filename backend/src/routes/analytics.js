import { Router } from 'express';
import { query, queryOne } from '../db.js';

const router = Router();
const PID = 'proj_demo_001';

router.get('/heatmap', async (req, res) => {
  try {
    const { page = '/checkout' } = req.query;
    const [clicks, pages, scrollData] = await Promise.all([
      query(`
        SELECT e.x, e.y, e.type, e.target, COUNT(*) as count
        FROM events e JOIN sessions s ON e.session_id = s.id
        WHERE s.project_id=? AND e.page=? AND e.type IN ('click','rage_click') AND e.x IS NOT NULL AND e.y IS NOT NULL
        GROUP BY CAST(e.x/96 AS INT), CAST(e.y/54 AS INT), e.type, e.x, e.y, e.target
        ORDER BY count DESC
      `, [PID, page]),
      query(`
        SELECT DISTINCT e.page, COUNT(*) as clicks
        FROM events e JOIN sessions s ON e.session_id=s.id
        WHERE s.project_id=? AND e.type IN ('click','rage_click')
        GROUP BY e.page ORDER BY clicks DESC LIMIT 10
      `, [PID]),
      query(`
        SELECT url, AVG(scroll_depth)::int as avg_depth, MAX(scroll_depth) as max_depth, COUNT(*) as sessions
        FROM page_views pv JOIN sessions s ON pv.session_id=s.id
        WHERE s.project_id=?
        GROUP BY url ORDER BY sessions DESC LIMIT 8
      `, [PID]),
    ]);
    res.json({ clicks, pages, scrollData, selectedPage: page });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/funnel-detail', async (req, res) => {
  try {
    const funnelPages = ['/', '/login', '/products', '/cart', '/checkout'];
    const detail = await Promise.all(funnelPages.map(async page => {
      const [sessions, avgDuration, rageClicks] = await Promise.all([
        queryOne(`
          SELECT COUNT(DISTINCT pv.session_id) as total,
            SUM(CASE WHEN s.status='dropped' THEN 1 ELSE 0 END) as dropped
          FROM page_views pv JOIN sessions s ON pv.session_id=s.id
          WHERE s.project_id=? AND pv.url=?
        `, [PID, page]),
        queryOne(`
          SELECT AVG(pv.duration)::int as avg FROM page_views pv
          JOIN sessions s ON pv.session_id=s.id
          WHERE s.project_id=? AND pv.url=? AND pv.duration > 0
        `, [PID, page]),
        queryOne(`
          SELECT COUNT(*) as c FROM events e JOIN sessions s ON e.session_id=s.id
          WHERE s.project_id=? AND e.page=? AND e.type='rage_click'
        `, [PID, page]),
      ]);
      const total = Number(sessions?.total || 0);
      const dropped = Number(sessions?.dropped || 0);
      return { page, total, dropped, avgDuration: avgDuration?.avg || 0, rageClicks: Number(rageClicks?.c || 0), dropRate: total > 0 ? Math.round((dropped/total)*100) : 0 };
    }));
    res.json(detail);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/devices', async (req, res) => {
  try {
    const [devices, countries, browsers] = await Promise.all([
      query(`
        SELECT CASE WHEN screen_width < 768 THEN 'Mobile' WHEN screen_width < 1024 THEN 'Tablet' ELSE 'Desktop' END as device,
          COUNT(*) as sessions, SUM(CASE WHEN status='dropped' THEN 1 ELSE 0 END) as dropped
        FROM sessions WHERE project_id=? GROUP BY device ORDER BY sessions DESC
      `, [PID]),
      query(`
        SELECT country, COUNT(*) as sessions, SUM(CASE WHEN status='dropped' THEN 1 ELSE 0 END) as dropped
        FROM sessions WHERE project_id=? AND country IS NOT NULL
        GROUP BY country ORDER BY sessions DESC LIMIT 8
      `, [PID]),
      query(`
        SELECT CASE WHEN user_agent LIKE '%Chrome%' THEN 'Chrome' WHEN user_agent LIKE '%Firefox%' THEN 'Firefox' WHEN user_agent LIKE '%Safari%' AND user_agent NOT LIKE '%Chrome%' THEN 'Safari' ELSE 'Other' END as browser,
          COUNT(*) as sessions
        FROM sessions WHERE project_id=? GROUP BY browser ORDER BY sessions DESC
      `, [PID]),
    ]);
    res.json({ devices, countries, browsers });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
