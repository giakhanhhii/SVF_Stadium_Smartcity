import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const out = path.join(process.cwd(), 'tests', 'screenshots', 'stadium-security-seats.png');
fs.mkdirSync(path.dirname(out), { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:3457/stadium-ioc/index.html');
await page.locator('.nav-item[data-nav="events"]').click();
await page.waitForTimeout(6000);
await page.locator('#page-events [data-mount="stadium-scene"]').screenshot({ path: path.join(process.cwd(), 'tests', 'screenshots', 'stadium-events-seats.png') });
console.log('Saved', out);
await browser.close();
