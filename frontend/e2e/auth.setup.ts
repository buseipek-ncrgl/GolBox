import { expect, test as setup } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const authFile = path.join(import.meta.dirname, '.auth/admin.json');

setup('admin oturumu', async ({ page }) => {
  mkdirSync(path.dirname(authFile), { recursive: true });
  await page.goto(process.env.PLAYWRIGHT_ADMIN_URL || 'http://127.0.0.1:5173/admin');
  await page.getByTestId('login-email').fill('admin@golbox.gov.tr');
  await page.getByTestId('login-password').fill('Admin123!');
  await page.getByTestId('login-submit').click();
  await expect(page.getByTestId('admin-layout')).toBeVisible();
  await page.context().storageState({ path: authFile });
});
