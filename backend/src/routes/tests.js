import { Router } from 'express';
import { query, queryOne, run } from '../db.js';
import { broadcast } from '../websocket.js';
import { runTest } from '../test-runner.js';
import { requireAuth } from './auth.js';

const router = Router();
const PID = 'proj_demo_001';

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const tests = await query(`
      SELECT t.*,
        (SELECT COUNT(*) FROM test_runs WHERE test_id=t.id) as total_runs,
        (SELECT COUNT(*) FROM test_runs WHERE test_id=t.id AND status='pass') as passed_runs
      FROM tests t WHERE t.project_id=? ORDER BY t.created_at DESC
    `, [PID]);
    res.json(tests);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const [test, runs] = await Promise.all([
      queryOne('SELECT * FROM tests WHERE id=?', [req.params.id]),
      query('SELECT * FROM test_runs WHERE test_id=? ORDER BY ran_at DESC LIMIT 20', [req.params.id]),
    ]);
    if (!test) return res.status(404).json({ error: 'Not found' });
    res.json({ ...test, runs });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/run', async (req, res) => {
  try {
    const test = await queryOne('SELECT * FROM tests WHERE id=?', [req.params.id]);
    if (!test) return res.status(404).json({ error: 'Not found' });
    if (!test.playwright_code) return res.status(400).json({ error: 'No test code' });

    // Mark as running immediately
    await run('UPDATE tests SET status=?, last_run=? WHERE id=?',
      ['running', Math.floor(Date.now() / 1000), req.params.id]);

    res.json({ ok: true, message: 'Running real Playwright test...' });

    // Run the actual test in background
    console.log(`[Test] Running: ${test.name}`);
    const result = await runTest(test.playwright_code);
    console.log(`[Test] ${test.name} → ${result.status} (${result.duration}ms)`);

    const status = result.status;
    const stepsPassed = result.stepsPassed ?? (status === 'pass' ? 5 : 1);
    const stepsTotal  = result.stepsTotal  ?? 5;

    await run('UPDATE tests SET status=?, last_duration=? WHERE id=?',
      [status, result.duration, req.params.id]);

    await run(
      'INSERT INTO test_runs(test_id,status,duration,error,steps_total,steps_passed,ran_at) VALUES(?,?,?,?,?,?,?)',
      [test.id, status, result.duration, result.error || null, stepsTotal, stepsPassed, Math.floor(Date.now() / 1000)]
    );

    if (status === 'fail') {
      await run(
        'INSERT INTO alerts(project_id,type,severity,title,description,metadata) VALUES(?,?,?,?,?,?)',
        [PID, 'test_failure', 'high', `Test failed: ${test.name}`,
         result.error || 'Test did not pass', JSON.stringify({ test_id: test.id })]
      );
    }

    broadcast('test_completed', {
      testId: test.id, name: test.name, status,
      duration: result.duration, stepsPassed, steps: stepsTotal,
      error: result.error || null, time: Date.now(),
    });

  } catch (e) {
    console.error('[Test] Error:', e.message);
    res.status(200).json({ ok: false, error: e.message });
  }
});

router.get('/:id/status', async (req, res) => {
  try {
    const test = await queryOne('SELECT id,status,last_run,last_duration FROM tests WHERE id=?', [req.params.id]);
    if (!test) return res.status(404).json({ error: 'Not found' });
    res.json(test);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
