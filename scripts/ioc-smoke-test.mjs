/**
 * Playwright-style smoke test via Edge CDP (no npm required).
 * Run: node scripts/ioc-smoke-test.mjs
 */
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const EDGE = `${process.env['ProgramFiles(x86)']}\\Microsoft\\Edge\\Application\\msedge.exe`;
const BASE = process.env.IOC_BASE || 'http://localhost:3457';
const PAGES = [
  { name: 'stadium', url: `${BASE}/stadium-ioc/stadium-index.html`, expect: 'IOC Sân vận động' },
  { name: 'smartcity', url: `${BASE}/smartcity-ioc/smartcity-index.html`, expect: 'IOC Smart City' },
];

async function cdp(port, method, params = {}) {
  const res = await fetch(`http://127.0.0.1:${port}/json`);
  const tabs = await res.json();
  const wsUrl = tabs[0]?.webSocketDebuggerUrl;
  if (!wsUrl) throw new Error('No CDP target');

  return new Promise((resolve, reject) => {
    import('node:http').then(({ default: http }) => {
      const ws = new (require('node:module').createRequire(import.meta.url)('ws'))(wsUrl);
    });
  });
}

// Fallback: use Runtime.evaluate via raw WebSocket is heavy without ws package.
// Use simpler DOM check via Edge dump-dom with virtual time budget.

async function checkPage(name, url, expect) {
  return new Promise((resolve) => {
    const args = [
      '--headless=new', '--disable-gpu', '--no-sandbox',
      `--virtual-time-budget=10000`,
      '--dump-dom', url,
    ];
    const proc = spawn(EDGE, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    proc.stdout.on('data', (d) => { out += d; });
    proc.stderr.on('data', (d) => { out += d; });
    proc.on('close', () => {
      const hasHeader = out.includes('header-title') || out.includes(expect);
      const hasPage = out.includes('page-view') && out.includes('page-overview');
      const hasContent = out.includes('module-name') || out.includes('vital-item') || out.includes('domain-banner');
      const blank = out.includes('id="app-pages"></div>') && !hasHeader;
      resolve({ name, url, ok: hasHeader && hasPage && hasContent && !blank, blank, hasHeader, hasContent, snippet: out.slice(0, 500) });
    });
  });
}

async function main() {
  if (!process.env['ProgramFiles(x86)']) {
    console.error('Edge not found');
    process.exit(1);
  }
  let failed = 0;
  for (const p of PAGES) {
    const r = await checkPage(p.name, p.url, p.expect);
    console.log(JSON.stringify(r, null, 2));
    if (!r.ok) failed++;
  }
  process.exit(failed ? 1 : 0);
}

main();
