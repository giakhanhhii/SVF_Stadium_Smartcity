import { test, expect } from '@playwright/test';

const PAGE_IDS = ['overview', 'security', 'events', 'facilities', 'services', 'reports'];

test('Stadium uses Roboto across all dashboards and popup UI', async ({ page }) => {
  await page.goto('/stadium-ioc/stadium-index.html');
  await page.waitForSelector('#page-overview.active', { timeout: 15_000 });

  await expect.poll(() => page.evaluate(() => document.fonts.check('12px Roboto'))).toBe(true);

  for (const pageId of PAGE_IDS) {
    if (pageId !== 'overview') {
      await page.locator(`.page-view.active .nav-item[data-nav="${pageId}"]`).click();
      await page.waitForSelector(`#page-${pageId}.active`);
    }

    const fonts = await page.locator(`#page-${pageId}`).evaluate((root) => {
      const samples = [
        root,
        root.querySelector('.sidebar-nav--left'),
        root.querySelector('.sidebar-nav--right'),
        root.querySelector('.security-sidebar--left'),
        root.querySelector('.security-sidebar--right'),
      ].filter(Boolean);
      return samples.map((element) => getComputedStyle(element).fontFamily);
    });

    expect(fonts.length).toBeGreaterThan(0);
    fonts.forEach((font) => expect(font).toContain('Roboto'));
  }

  await page.locator('.page-view.active [data-notify-toggle]').click();
  const popup = page.locator('[data-notify-modal] [role="dialog"]');
  await expect(popup).toBeVisible();
  await expect(popup.evaluate((element) => getComputedStyle(element).fontFamily)).resolves.toContain('Roboto');
});

test('Overview white HUD metrics use native Roboto weights', async ({ page }) => {
  await page.goto('/stadium-ioc/stadium-index.html');
  await page.waitForSelector('#page-overview.active', { timeout: 15_000 });

  const primary = page.locator('#page-overview .overview-venue-badges b').first();
  const secondary = page.locator('#page-overview .overview-service-flow__row span').first();

  await expect(primary).toHaveCSS('font-family', /Roboto/);
  await expect(primary).toHaveCSS('font-weight', '700');
  await expect(secondary).toHaveCSS('font-weight', '700');
});

test('All Stadium tabs keep real Roboto bold without synthetic extra-bold weights', async ({ page }) => {
  await page.goto('/stadium-ioc/stadium-index.html');
  await page.waitForSelector('#page-overview.active', { timeout: 15_000 });

  for (const pageId of PAGE_IDS) {
    if (pageId !== 'overview') {
      await page.locator(`.page-view.active .nav-item[data-nav="${pageId}"]`).click();
      await page.waitForSelector(`#page-${pageId}.active`);
    }

    const weights = await page.locator(`#page-${pageId}`).evaluate((root) => {
      const values = [...root.querySelectorAll('*')]
        .map((element) => getComputedStyle(element))
        .filter((style) => style.fontFamily.includes('Roboto'))
        .map((style) => Number.parseInt(style.fontWeight, 10))
        .filter(Number.isFinite);

      return {
        max: Math.max(...values),
        hasBold: values.includes(700),
      };
    });

    expect(weights.max, `${pageId} must not exceed Roboto 700`).toBeLessThanOrEqual(700);
    expect(weights.hasBold, `${pageId} must retain bold text`).toBe(true);
  }
});
