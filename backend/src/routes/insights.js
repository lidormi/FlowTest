import { Router } from 'express';
import { query, queryOne, run } from '../db.js';

const router = Router();
const PID = 'proj_demo_001';

router.get('/', async (req, res) => {
  try {
    const pages = ['/', '/login', '/products', '/cart', '/checkout'];

    const [rageTargets, slowPages, ...funnelRows] = await Promise.all([
      query(`
        SELECT target, COUNT(*) as c FROM events e
        JOIN sessions s ON e.session_id=s.id
        WHERE s.project_id=? AND e.type='rage_click' AND e.target IS NOT NULL
        GROUP BY e.target ORDER BY c DESC LIMIT 5
      `, [PID]),
      query(`
        SELECT url, CAST(AVG(duration) AS INTEGER) as avg_duration, COUNT(*) as views
        FROM page_views pv JOIN sessions s ON pv.session_id=s.id
        WHERE s.project_id=? AND duration > 0
        GROUP BY url ORDER BY avg_duration DESC LIMIT 5
      `, [PID]),
      ...pages.map(page =>
        queryOne(
          'SELECT COUNT(DISTINCT pv.session_id) as c FROM page_views pv JOIN sessions s ON pv.session_id=s.id WHERE s.project_id=? AND pv.url=?',
          [PID, page]
        )
      ),
    ]);

    const funnel = pages.map((page, i) => ({
      page,
      visits: Number(funnelRows[i]?.c || 0),
    }));

    // Load AI-generated insights from DB (populated by POST /api/ai/insights)
    const aiInsights = await query(
      "SELECT * FROM insights WHERE project_id=? AND type='ai_recommendation' ORDER BY created_at DESC LIMIT 10",
      [PID]
    );

    // Load legacy seed insights
    const seedInsights = await query(
      "SELECT * FROM insights WHERE project_id=? AND type != 'ai_recommendation' ORDER BY created_at DESC",
      [PID]
    );

    res.json({
      insights: [...aiInsights, ...seedInsights].map(i => ({
        ...i,
        data: i.data ? JSON.parse(i.data) : null,
      })),
      funnel,
      rageTargets,
      slowPages,
      aiReady: aiInsights.length > 0,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
