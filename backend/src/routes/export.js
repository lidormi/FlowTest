import { Router } from 'express';
import { query } from '../db.js';

const router = Router();
const PID = 'proj_demo_001';

router.get('/sessions.csv', async (req, res) => {
  try {
    const sessions = await query(`
      SELECT s.id, s.status, s.country, s.screen_width, s.screen_height,
             s.start_time, s.end_time, s.page_count,
             (SELECT COUNT(*) FROM events WHERE session_id=s.id AND type='rage_click') as rage_clicks,
             (SELECT url FROM page_views WHERE session_id=s.id ORDER BY entered_at ASC LIMIT 1) as entry_page,
             (SELECT url FROM page_views WHERE session_id=s.id ORDER BY entered_at DESC LIMIT 1) as exit_page
      FROM sessions s WHERE s.project_id=? ORDER BY s.start_time DESC
    `, [PID]);

    const headers = ['id','status','country','screen_width','screen_height','start_time','end_time','duration_seconds','page_count','rage_clicks','entry_page','exit_page'];
    const rows = sessions.map(s => [
      s.id, s.status, s.country, s.screen_width, s.screen_height,
      s.start_time, s.end_time,
      s.end_time ? s.end_time - s.start_time : '',
      s.page_count, s.rage_clicks, s.entry_page||'', s.exit_page||''
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v ?? ''}"`).join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="sessions.csv"');
    res.send(csv);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/tests.csv', async (req, res) => {
  try {
    const tests = await query(`
      SELECT t.id, t.name, t.status, t.last_run, t.last_duration,
        (SELECT COUNT(*) FROM test_runs WHERE test_id=t.id) as total_runs,
        (SELECT COUNT(*) FROM test_runs WHERE test_id=t.id AND status='pass') as passed_runs,
        (SELECT COUNT(*) FROM test_runs WHERE test_id=t.id AND status='fail') as failed_runs
      FROM tests t WHERE t.project_id=?
    `, [PID]);
    const headers = ['id','name','status','last_run','last_duration_ms','total_runs','passed_runs','failed_runs','pass_rate'];
    const rows = tests.map(t => [
      t.id, t.name, t.status, t.last_run||'', t.last_duration||'',
      t.total_runs, t.passed_runs, t.failed_runs,
      t.total_runs > 0 ? `${Math.round((t.passed_runs/t.total_runs)*100)}%` : ''
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v ?? ''}"`).join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="tests.csv"');
    res.send(csv);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
