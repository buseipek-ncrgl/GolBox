import { expect, test, type Page } from '@playwright/test';

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/admin');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto('/admin');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(password);
  await page.getByTestId('login-submit').click();
  await expect(page.getByTestId('admin-layout')).toBeVisible();
}

test.describe.configure({ mode: 'serial' });

test('1. yönetici girişi', async ({ page }) => {
  await page.goto('/admin');
  await expect(page.getByTestId('admin-layout')).toBeVisible();
  await expect(page.getByTestId('admin-page-title')).toHaveText('Genel Bakış');
});

test('2. rota yenileme oturumu korur', async ({ page }) => {
  await page.goto('/admin/vatandaslar');
  await expect(page.getByTestId('admin-layout')).toBeVisible();
  await page.reload();
  await expect(page.getByTestId('admin-layout')).toBeVisible();
  await expect(page.getByTestId('admin-page-title')).toHaveText('Vatandaşlar');
  await expect(page).toHaveURL(/\/admin\/vatandaslar/);
});

test('3. kenar menü gezintisi', async ({ page }) => {
  await page.goto('/admin');
  await page.getByRole('link', { name: 'QR İşlemleri' }).click();
  await expect(page.getByTestId('admin-page-title')).toHaveText('QR İşlemleri');
  await page.getByRole('link', { name: 'Ismarlıyor' }).click();
  await expect(page.getByTestId('admin-page-title')).toHaveText('Ismarlıyor');
  await page.getByRole('link', { name: 'Genel Bakış' }).click();
  await expect(page.getByTestId('admin-page-title')).toHaveText('Genel Bakış');
});

test('4. vatandaş arama ve detay', async ({ page }) => {
  await page.goto('/admin/vatandaslar');
  await page.getByTestId('citizen-search').fill('Ahmet');
  await page.getByRole('button', { name: 'Filtrele' }).click();
  await page.getByRole('button', { name: 'Detay' }).first().click();
  await expect(page.getByTestId('citizen-drawer')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Profil' })).toBeVisible();
});

test('5. manuel GölPuan onay penceresi', async ({ page }) => {
  await page.goto('/admin/vatandaslar');
  await page.getByRole('button', { name: 'Detay' }).first().click();
  await page.getByTestId('manual-gp-action').click();
  await page.getByLabel('Sebep').fill('Test düzeltmesi');
  await page.getByTestId('manual-gp-submit').click();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await expect(page.getByRole('alertdialog')).toContainText('GP');
  await page.getByRole('alertdialog').getByRole('button', { name: 'Vazgeç' }).click();
});

test('6. bildirim önizleme', async ({ page }) => {
  await page.goto('/admin/bildirimler');
  await page.getByLabel('Başlık').fill('Pilot duyuru');
  await page.getByLabel('Metin').fill('Bu bir önizleme metnidir.');
  await page.getByLabel('Kitle').selectOption('All');
  await page.getByTestId('notification-preview').click();
  await expect(page.getByRole('dialog', { name: 'Bildirim önizleme' })).toBeVisible();
  await expect(page.getByText('tüm uygun kullanıcılara gönderilecek')).toBeVisible();
});

test('7. sipariş durum geçişi', async ({ page }) => {
  await page.goto('/admin/ismarliyor');
  const next = page.getByTestId('order-next-action').first();
  await expect(next).toBeVisible();
  await next.click();
  const dialog = page.getByRole('alertdialog');
  if (await dialog.isVisible()) {
    await dialog.getByRole('button', { name: /Teslim|İptal Et|Devam/ }).click();
  }
  await expect(page.getByTestId('admin-layout')).toBeVisible();
});

test('8. etkinlik formu', async ({ page }) => {
  await page.goto('/admin/etkinlikler');
  await page.getByTestId('activity-create').click();
  await expect(page.getByTestId('activity-title')).toBeVisible();
  await expect(page.getByText('Belediye tesisi')).toBeVisible();
});

test('9. personel yasaklı rota', async ({ page }) => {
  await loginAs(page, 'staff@golbox.gov.tr', 'Staff123!');
  await page.goto('/admin/yetkilendirme');
  await expect(page).toHaveURL(/\/admin\/?$/);
  await expect(page.getByTestId('admin-page-title')).toHaveText('Genel Bakış');
  await expect(page.getByRole('link', { name: 'Yetkilendirme' })).toHaveCount(0);
});

test('10. 1024 duman testi', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto('/admin');
  await expect(page.getByTestId('admin-sidebar')).toBeVisible();
  await expect(page.getByTestId('admin-page-title')).toBeVisible();
  await page.getByRole('link', { name: 'Vatandaşlar' }).click();
  await expect(page.getByTestId('citizen-search')).toBeVisible();
});
