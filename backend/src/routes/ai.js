/**
 * AI Routes — Real Claude API calls
 * POST /api/ai/generate-test   → generate Playwright test from recorded events
 * POST /api/ai/insights        → generate real UX recommendations from session data
 */
import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { query, queryOne, run } from '../db.js';
import { requireAuth } from './auth.js';

const router = Router();
const PID = 'proj_demo_001';

router.use(requireAuth);

function getClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  return new Anthropic({ apiKey: key });
}

/* ─────────────────────────────────────────────
   POST /api/ai/generate-test
   Body: { events: [...], url: 'http://...' }
   Returns: { code: '...' }
───────────────────────────────────────────── */
router.post('/generate-test', async (req, res) => {
  try {
    const { events = [], url = 'http://localhost:5174' } = req.body;
    if (!events.length) return res.status(400).json({ error: 'No events provided' });

    const client = getClient();
    if (!client) {
      return res.status(503).json({
        error: 'ANTHROPIC_API_KEY not set in backend/.env',
        fallback: true,
        code: buildFallbackTest(events, url),
      });
    }

    // Format events for Claude
    const eventSummary = events.map((e, i) => {
      if (e.type === 'navigate') return `${i + 1}. Navigate to ${e.url}`;
      if (e.type === 'click')    return `${i + 1}. Click on "${e.target || e.selector || 'element'}" at (${e.x},${e.y})`;
      if (e.type === 'input')    return `${i + 1}. Type "${e.value}" into "${e.field || e.target}"`;
      if (e.type === 'scroll')   return `${i + 1}. Scroll to ${e.y}px (depth ${e.depth}%)`;
      return `${i + 1}. ${e.type}`;
    }).join('\n');

    const prompt = `You are an expert Playwright test engineer. Convert these recorded user actions into a complete Playwright test.

Base URL: ${url}

Recorded actions:
${eventSummary}

Rules:
- Use data-testid selectors when actions mention them (e.g. [data-testid="add-to-cart"])
- Add meaningful assertions after key actions
- Use { timeout: 5000 } on expects
- The test should be self-contained and runnable
- Use realistic test data
- Add a comment for each logical step

Return ONLY the TypeScript/JavaScript code, no explanations, no markdown fences.`;

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const code = message.content[0]?.text?.trim() || '';
    res.json({ code });

  } catch (e) {
    console.error('[AI] generate-test error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

/* ─────────────────────────────────────────────
   POST /api/ai/insights
   Returns: { recommendations: [...] }
   Also refreshes the insights table in DB
───────────────────────────────────────────── */
router.post('/insights', async (req, res) => {
  try {
    const client = getClient();

    // Gather real metrics from DB
    const pages = ['/', '/login', '/products', '/cart', '/checkout'];
    const [rageTargets, slowPages, ...funnelRows] = await Promise.all([
      query(`
        SELECT target, COUNT(*) as c FROM events e
        JOIN sessions s ON e.session_id = s.id
        WHERE s.project_id = ? AND e.type = 'rage_click' AND e.target IS NOT NULL
        GROUP BY e.target ORDER BY c DESC LIMIT 8
      `, [PID]),
      query(`
        SELECT url, CAST(AVG(duration) AS INTEGER) as avg_ms, COUNT(*) as views
        FROM page_views pv JOIN sessions s ON pv.session_id = s.id
        WHERE s.project_id = ? AND duration > 0
        GROUP BY url ORDER BY avg_ms DESC LIMIT 5
      `, [PID]),
      ...pages.map(p =>
        queryOne(
          'SELECT COUNT(DISTINCT pv.session_id) as c FROM page_views pv JOIN sessions s ON pv.session_id=s.id WHERE s.project_id=? AND pv.url=?',
          [PID, p]
        )
      ),
    ]);

    const funnelData = pages.map((page, i) => ({
      page,
      visits: Number(funnelRows[i]?.c || 0),
    }));

    // Compute drop rates
    const funnelWithDrop = funnelData.map((f, i) => {
      const prev = i > 0 ? funnelData[i - 1].visits : null;
      const drop = prev && prev > 0 ? Math.round((1 - f.visits / prev) * 100) : null;
      return { ...f, dropFromPrev: drop };
    });

    if (!client) {
      return res.json({
        recommendations: getStaticRecommendations(funnelWithDrop, rageTargets, slowPages),
        source: 'static',
        metrics: { funnel: funnelWithDrop, rageTargets, slowPages },
      });
    }

    const dataPrompt = `
Funnel drop rates (page → visits → drop% from previous page):
${funnelWithDrop.map(f => `  ${f.page}: ${f.visits} visits${f.dropFromPrev !== null ? ` (${f.dropFromPrev}% drop)` : ''}`).join('\n')}

Top rage-click targets (element → count):
${rageTargets.map(r => `  "${r.target}": ${r.c} rage clicks`).join('\n') || '  none detected'}

Slowest pages (url → avg load ms → view count):
${slowPages.map(p => `  ${p.url}: ${p.avg_ms}ms avg, ${p.views} views`).join('\n') || '  no data'}
`.trim();

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `You are a senior UX/CRO (Conversion Rate Optimization) expert analyzing real user data from an e-commerce site.

${dataPrompt}

Generate 5 specific, actionable recommendations to improve conversion rate. Each recommendation must be based on the data above.

Return a JSON array (and nothing else) with this exact structure:
[
  {
    "title": "Short action title",
    "problem": "What the data shows is wrong",
    "solution": "Specific implementation steps",
    "impact": "Estimated improvement (e.g. +12% checkout completion)",
    "priority": "high|medium|low",
    "type": "ux|performance|copy|flow|trust"
  }
]`
      }],
    });

    let recommendations;
    try {
      const text = message.content[0]?.text?.trim() || '[]';
      // Strip markdown fences if present
      const clean = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '');
      recommendations = JSON.parse(clean);
    } catch {
      recommendations = getStaticRecommendations(funnelWithDrop, rageTargets, slowPages);
    }

    // Persist to DB (clear old AI insights, insert new ones)
    await run("DELETE FROM insights WHERE project_id=? AND type='ai_recommendation'", [PID]);
    for (const r of recommendations) {
      await run(
        'INSERT INTO insights(project_id,type,title,description,impact,data) VALUES(?,?,?,?,?,?)',
        [PID, 'ai_recommendation', r.title, r.problem + ' → ' + r.solution,
         r.impact, JSON.stringify({ priority: r.priority, type: r.type })]
      );
    }

    res.json({
      recommendations,
      source: 'claude',
      metrics: { funnel: funnelWithDrop, rageTargets, slowPages },
    });

  } catch (e) {
    console.error('[AI] insights error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── Fallback helpers ──────────────────────────────────────────────────────────

function buildFallbackTest(events, url) {
  const steps = events.map((e, i) => {
    if (e.type === 'navigate') return `  await page.goto('${e.url}');`;
    if (e.type === 'click' && e.selector) return `  await page.click('${e.selector}');`;
    if (e.type === 'click' && e.target) return `  await page.click('[data-testid="${e.target}"]');`;
    if (e.type === 'input') return `  await page.fill('${e.field || 'input'}', '${e.value}');`;
    return `  // ${e.type}`;
  }).join('\n');

  return `import { test, expect } from '@playwright/test';

// Auto-generated from ${events.length} recorded events
test('Recorded user flow', async ({ page }) => {
  await page.goto('${url}');
${steps}
  await expect(page).toHaveURL(/./);
});`;
}

function getStaticRecommendations(funnel, rageTargets, slowPages) {
  const checkoutDrop = funnel.find(f => f.page === '/checkout')?.dropFromPrev;
  const cartDrop = funnel.find(f => f.page === '/cart')?.dropFromPrev;
  return [
    {
      title: 'Reduce checkout friction',
      problem: checkoutDrop ? `${checkoutDrop}% of users drop at checkout` : 'High checkout abandonment detected',
      solution: 'Consolidate to a single-page checkout with inline validation',
      impact: 'Est. +15–20% checkout completions',
      priority: 'high', type: 'flow',
    },
    {
      title: 'Fix rage-click elements',
      problem: rageTargets.length > 0 ? `"${rageTargets[0]?.target}" has ${rageTargets[0]?.c} rage clicks` : 'Rage clicks detected',
      solution: 'Audit unresponsive buttons and fix click hitboxes',
      impact: 'Est. +8% engagement',
      priority: 'high', type: 'ux',
    },
    {
      title: 'Cart-to-checkout nudge',
      problem: cartDrop ? `${cartDrop}% abandon at the cart page` : 'Cart abandonment is high',
      solution: 'Add urgency copy ("X left in stock") and a sticky checkout CTA',
      impact: 'Est. +10% cart conversion',
      priority: 'medium', type: 'copy',
    },
  ];
}

export default router;
