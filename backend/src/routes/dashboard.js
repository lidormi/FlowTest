import { Router } from 'express';
import { query, queryOne, run } from '../db.js';

const router = Router();
const PID = 'proj_demo_001';

router.get('/stats', async (req, res) => {
  try {
    const [t1, t2, t3, t4, t5, t6] = await Promise.all([
      queryOne('SELECT COUNT(*) as c FROM tests WHERE project_id=?', [PID]),
      queryOne("SELECT COUNT(*) as c FROM tests WHERE project_id=? AND status='fail'", [PID]),
      queryOne('SELECT COUNT(*) as c FROM sessions WHERE project_id=?', [PID]),
      queryOne("SELECT COUNT(*) as c FROM sessions WHERE project_id=? AND status='dropped'", [PID]),
      queryOne("SELECT COUNT(*) as c FROM events e JOIN sessions s ON e.session_id=s.id WHERE s.project_id=? AND e.type='rage_click'", [PID]),
      queryOne('SELECT COUNT(*) as c FROM alerts WHERE project_id=? AND resolved=0', [PID]),
    ]);
    const tot = Number(t3.c), drop = Number(t4.c);
    res.json({ totalTests: Number(t1.c), failedTests: Number(t2.c), dropRate: tot > 0 ? Math.round((drop/tot)*100) : 0, rageClicks: Number(t5.c), totalSessions: tot, droppedSessions: drop, activeAlerts: Number(t6.c) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/chart', async (req, res) => {
  try {
    const now = Math.floor(Date.now() / 1000);
    const data = [];
    for (let i = 13; i >= 0; i--) {
      const dayStart = now - (i + 1) * 86400;
      const dayEnd   = now - i * 86400;
      const [tot, drop] = await Promise.all([
        queryOne('SELECT COUNT(*) as c FROM sessions WHERE project_id=? AND start_time BETWEEN ? AND ?', [PID, dayStart, dayEnd]),
        queryOne("SELECT COUNT(*) as c FROM sessions WHERE project_id=? AND status='dropped' AND start_time BETWEEN ? AND ?", [PID, dayStart, dayEnd]),
      ]);
      const total = Number(tot.c), dropped = Number(drop.c);
      const date = new Date(dayEnd * 1000).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' });
      data.push({ date, total, dropped, dropRate: total > 0 ? Math.round((dropped/total)*100) : 0 });
    }
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/alerts', async (req, res) => {
  try {
    const alerts = await query('SELECT * FROM alerts WHERE project_id=? AND resolved=0 ORDER BY created_at DESC LIMIT 10', [PID]);
    res.json(alerts.map(a => ({ ...a, metadata: a.metadata ? JSON.parse(a.metadata) : null })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/alerts/:id/resolve', async (req, res) => {
  try {
    await run('UPDATE alerts SET resolved=1 WHERE id=?', [Number(req.params.id)]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
