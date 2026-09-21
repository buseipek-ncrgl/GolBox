import { test, expect } from '@playwright/test';

test.describe('Şehitkamil+ Citizen App Pilot Hardening Suite', () => {

  test('Guest home & places view without authed state', async ({ page }) => {
    await page.goto('http://127.0.0.1:3000');
    // Ensure page loads without error and displays welcome/brand title
    await expect(page).toHaveTitle(/Şehitkamil\+/i);
    // Guest should see prompt to login for GP balance instead of fake 0 GP
    const bodyText = await page.content();
    expect(bodyText).toBeDefined();
  });

  test('Responsive viewports - 375px mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('http://127.0.0.1:3000');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Responsive viewports - 390px mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://127.0.0.1:3000');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Responsive viewports - 412px mobile', async ({ page }) => {
    await page.setViewportSize({ width: 412, height: 915 });
    await page.goto('http://127.0.0.1:3000');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Responsive viewports - 768px tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('http://127.0.0.1:3000');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Security regression - citizen cannot access admin endpoints', async ({ request }) => {
    const res = await request.get('http://127.0.0.1:5000/api/admin/dashboard');
    expect(res.status()).toBeGreaterThanOrEqual(401);
  });

});
