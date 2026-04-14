import cron from 'node-cron';
import { query, queryOne, run } from './db.js';
import { broadcast } from './websocket.js';

const PID = 'proj_demo_001';
const schedules = new Map();

const CRON_PRESETS = {
  '*/5 * * * *':  'Every 5 minutes',
  '*/15 * * * *': 'Every 15 minutes',
  '*/30 * * * *': 'Every 30 minutes',
  '0 * * * *':    'Every hour',
  '0 */6 * * *':  'Every 6 hours',
  '0 9 * * *':    'Daily at 9am',
  '0 9 * * 1':    'Weekly Monday 9am',
};

async function simulateTestRun(testId) {
  const test = await queryOne('SELECT * FROM tests WHERE id=?', [testId]);
  if (!test || test.status === 'running') return;

  await run('UPDATE tests SET status=?, last_run=? WHERE id=?',
    ['running', Math.floor(Date.now()/1000), testId]);

  broadcast('test_started', { testId, name: test.name, time: Date.now() });

  const duration = Math.floor(Math.random() * 4000) + 1200;
  setTimeout(async () => {
    const passed = testId === 'test_001' ? Math.random() > 0.5 : Math.random() > 0.12;
    const status = passed ? 'pass' : 'fail';
    const steps = 5;
    const stepsPassed = passed ? steps : Math.floor(Math.random() * (steps - 1)) + 1;

    await run('UPDATE tests SET status=?, last_duration=? WHERE id=?', [status, duration, testId]);
    await run('INSERT INTO test_runs(test_id,status,duration,error,steps_total,steps_passed,ran_at) VALUES(?,?,?,?,?,?,?)',
      [testId, status, duration,
       passed ? null : 'TimeoutError: element not found after 5000ms',
       steps, stepsPassed, Math.floor(Date.now()/1000)]);

    if (!passed) {
      await run('INSERT INTO alerts(project_id,type,severity,title,description,metadata) VALUES(?,?,?,?,?,?)',
        [PID, 'test_failure', 'high',
         `Scheduled test failed: ${test.name}`,
         `${test.name} failed at step ${stepsPassed}/${steps} (scheduled run)`,
         JSON.stringify({ test_id: testId, scheduled: true })]);
    }

    broadcast('test_completed', {
      testId, name: test.name, status, duration, stepsPassed, steps, time: Date.now()
    });
  }, duration);
}

export async function getSchedules() {
  const rows = await query('SELECT * FROM test_schedules');
  return rows.map(row => ({
    ...row,
    label: CRON_PRESETS[row.cron_expr] || row.cron_expr,
    active: schedules.has(row.test_id),
  }));
}

export function startSchedule(testId, cronExpr) {
  if (!cron.validate(cronExpr)) return { error: 'Invalid cron expression' };
  stopSchedule(testId);
  const task = cron.schedule(cronExpr, async () => {
    console.log(`[Scheduler] Running test ${testId} (${cronExpr})`);
    await run('UPDATE test_schedules SET last_triggered=? WHERE test_id=?',
      [Math.floor(Date.now()/1000), testId]);
    simulateTestRun(testId);
  });
  schedules.set(testId, task);
  return { ok: true };
}

export function stopSchedule(testId) {
  const existing = schedules.get(testId);
  if (existing) { existing.stop(); schedules.delete(testId); }
}

export async function loadSchedules() {
  try {
    const rows = await query("SELECT * FROM test_schedules WHERE enabled=1");
    for (const row of rows) startSchedule(row.test_id, row.cron_expr);
    console.log(`📅 Loaded ${rows.length} test schedule(s)`);
  } catch (e) {
    console.log('📅 Scheduler ready (no schedules yet)');
  }
}

export function getCronPresets() {
  return Object.entries(CRON_PRESETS).map(([expr, label]) => ({ expr, label }));
}
