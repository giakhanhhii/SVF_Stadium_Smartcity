import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.join(process.cwd(), 'tests', 'screenshots');

async function waitForStadiumScene(page, pageId = 'overview') {
  const mount = page.locator(`#page-${pageId} [data-mount="stadium-scene"]`);
  await expect(mount).toBeVisible();
  await expect(mount.locator('.scene-loading')).toHaveCount(0, { timeout: 45_000 });
  const canvas = mount.locator('canvas');
  await expect(canvas).toBeVisible();
  await page.waitForTimeout(2000);
  return mount;
}

test.describe('PVF Stadium 3D visual', () => {
  test.beforeAll(() => {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  });

  test('overview — dome on top, scene loaded', async ({ page }) => {
    await page.goto('/stadium-ioc/index.html');
    await page.waitForSelector('#page-overview.active', { timeout: 15_000 });
    const mount = await waitForStadiumScene(page, 'overview');
    await mount.screenshot({
      path: path.join(SCREENSHOT_DIR, 'stadium-overview.png'),
    });

    const canvas = mount.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box?.width).toBeGreaterThan(200);
    expect(box?.height).toBeGreaterThan(200);

    const glReady = await page.evaluate(() => {
      const canvasEl = document.querySelector('[data-mount="stadium-scene"] canvas');
      if (!canvasEl) return false;
      const gl = canvasEl.getContext('webgl') || canvasEl.getContext('webgl2');
      return Boolean(gl);
    });
    expect(glReady).toBe(true);
  });

  test('facilities — roof view camera', async ({ page }) => {
    await page.goto('/stadium-ioc/index.html');
    await page.locator('.nav-item[data-nav="facilities"]').click();
    await page.waitForSelector('#page-facilities.active', { timeout: 15_000 });
    const mount = await waitForStadiumScene(page, 'facilities');
    await mount.screenshot({
      path: path.join(SCREENSHOT_DIR, 'stadium-facilities-roof.png'),
    });
  });

  test('facilities — roof open animation', async ({ page }) => {
    await page.goto('/stadium-ioc/index.html');
    await page.locator('.nav-item[data-nav="facilities"]').click();
    await page.waitForSelector('#page-facilities.active', { timeout: 15_000 });
    await waitForStadiumScene(page, 'facilities');

    await page.locator('[data-roof="open"]').click();
    await expect(page.locator('[data-roof-status]').first()).toHaveText(/Đang mở|Đã mở/, {
      timeout: 20_000,
    });

    const mount = page.locator('#page-facilities [data-mount="stadium-scene"]');
    await page.waitForTimeout(500);
    await mount.screenshot({
      path: path.join(SCREENSHOT_DIR, 'stadium-roof-opening.png'),
    });
  });
});
