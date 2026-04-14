/**
 * Real Playwright test runner
 * Extracts test body from @playwright/test format, runs with real Chromium
 */
import { spawn } from 'child_process';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';

const __dir = dirname(fileURLToPath(import.meta.url));
// Must be inside backend/ so Node resolves 'playwright' from backend/node_modules
const TMP = join(__dir, '__runs__');

// Ensure temp dir exists
try { await mkdir(TMP, { recursive: true }); } catch {}

/**
 * Extract the body from: test('name', async ({ page }) => { BODY });
 */
function extractTestBody(code) {
  const startRe = /test\s*\([^,]*,\s*async\s*\(\s*\{[^}]*\}\s*\)\s*=>\s*\{/;
  const match = startRe.exec(code);
  if (!match) return null;

  const bodyStart = match.index + match[0].length;
  let depth = 1;
  let i = bodyStart;
  while (i < code.length && depth > 0) {
    if (code[i] === '{') depth++;
    else if (code[i] === '}') depth--;
    i++;
  }
  return code.slice(bodyStart, i - 1).trim();
}

/**
 * Build a standalone .mjs runner from a test's playwright_code
 */
function buildRunner(testCode) {
  const body = extractTestBody(testCode);
  if (!body) {
    // fallback: just run the code as-is but swap the import
    return testCode
      .replace(/^import\s*\{[^}]+\}\s*from\s*['"]@playwright\/test['"];?\n/m, '')
      + `\n// auto-fallback`;
  }

  return `
import { chromium } from 'playwright';
import { expect } from '@playwright/test';

let browser;
const steps = [];
let stepNum = 0;

// Wrap expect to count steps
const _expect = (v) => {
  const e = expect(v);
  return new Proxy(e, {
    get(target, prop) {
      const orig = target[prop];
      if (typeof orig === 'function') {
        return async (...args) => {
          stepNum++;
          steps.push({ step: stepNum, matcher: String(prop), passed: false });
          try {
            const r = await orig.apply(target, args);
            steps[steps.length - 1].passed = true;
            return r;
          } catch (err) {
            throw err;
          }
        };
      }
      // handle chained locators like .first(), .nth()
      return orig;
    }
  });
};

const startMs = Date.now();

try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'FlowTest-Runner/1.0',
  });
  const page = await context.newPage();

  // Replace expect with tracked version in scope
  const expect = _expect;

  ${body}

  const duration = Date.now() - startMs;
  process.stdout.write(JSON.stringify({
    status: 'pass',
    duration,
    steps,
    stepsTotal: Math.max(steps.length, 1),
    stepsPassed: steps.filter(s => s.passed).length,
  }) + '\\n');
} catch (err) {
  const duration = Date.now() - startMs;
  process.stdout.write(JSON.stringify({
    status: 'fail',
    duration,
    error: err.message.slice(0, 400),
    steps,
    stepsTotal: Math.max(steps.length + 1, 1),
    stepsPassed: steps.filter(s => s.passed).length,
  }) + '\\n');
} finally {
  if (browser) await browser.close().catch(() => {});
}
`.trim();
}

/**
 * Run a test and return { status, duration, error, stepsTotal, stepsPassed }
 */
export async function runTest(testCode) {
  const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const tmpFile = join(TMP, `${runId}.mjs`);

  try {
    const runner = buildRunner(testCode);
    await writeFile(tmpFile, runner, 'utf8');

    return await new Promise((resolve) => {
      const proc = spawn(process.execPath, [tmpFile], {
        env: { ...process.env, NODE_OPTIONS: '' },
        timeout: 60000,
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', d => { stdout += d.toString(); });
      proc.stderr.on('data', d => { stderr += d.toString(); });

      proc.on('close', (code) => {
        const lines = stdout.trim().split('\n').filter(Boolean);
        const last = lines[lines.length - 1];
        try {
          const result = JSON.parse(last);
          resolve(result);
        } catch {
          resolve({
            status: code === 0 ? 'pass' : 'fail',
            duration: 0,
            error: (stderr || 'Unknown error').slice(0, 400),
            stepsTotal: 1,
            stepsPassed: code === 0 ? 1 : 0,
          });
        }
      });

      proc.on('error', (err) => {
        resolve({ status: 'fail', duration: 0, error: err.message, stepsTotal: 1, stepsPassed: 0 });
      });
    });
  } finally {
    unlink(tmpFile).catch(() => {});
  }
}
