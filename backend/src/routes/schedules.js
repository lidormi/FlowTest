import { Router } from 'express';
import { query, queryOne, run } from '../db.js';
import { getSchedules, startSchedule, stopSchedule, getCronPresets } from '../scheduler.js';
import { requireAuth } from './auth.js';

const router = Router();

router.use(requireAuth);
const PID = 'proj_demo_001';

router.get('/', async (req, res) => {
  try {
    const [schedules, tests] = await Promise.all([
      getSchedules(),
      query('SELECT id, name, status FROM tests WHERE project_id=?', [PID]),
    ]);
    res.json({ schedules, tests, presets: getCronPresets() });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { testId, cronExpr } = req.body;
    if (!testId || !cronExpr) return res.status(400).json({ error: 'testId and cronExpr required' });
    const test = await queryOne('SELECT id FROM tests WHERE id=? AND project_id=?', [testId, PID]);
    if (!test) return res.status(404).json({ error: 'Test not found' });
    const existing = await queryOne('SELECT id FROM test_schedules WHERE test_id=?', [testId]);
    if (existing) {
      await run('UPDATE test_schedules SET cron_expr=?, enabled=1 WHERE test_id=?', [cronExpr, testId]);
    } else {
      await run('INSERT INTO test_schedules(test_id, cron_expr) VALUES(?,?)', [testId, cronExpr]);
    }
    const result = startSchedule(testId, cronExpr);
    if (result.error) return res.status(400).json({ error: result.error });
    res.json({ ok: true, message: `Scheduled: ${cronExpr}` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:testId', async (req, res) => {
  try {
    stopSchedule(req.params.testId);
    await run('UPDATE test_schedules SET enabled=0 WHERE test_id=?', [req.params.testId]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
