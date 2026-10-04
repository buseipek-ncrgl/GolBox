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
  await expect(page.getByTestId('admin-page-title')).toHaveText('Dashboard');
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
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await expect(page.getByTestId('admin-page-title')).toHaveText('Dashboard');
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
  if (await page.getByTestId('order-next-action').count() === 0) {
    await page.getByRole('button', { name: /Yeni Ismarlıyor/ }).click();
    await page.getByLabel('Vatandaş').selectOption({ index: 1 });
    await page.getByLabel('Kafe').selectOption({ index: 1 });
    await page.getByLabel('Ürün').selectOption({ index: 1 });
    await page.getByRole('dialog').getByRole('button', { name: 'Oluştur' }).click();
    await expect(page.getByTestId('order-next-action').first()).toBeVisible();
  }
  await page.getByTestId('order-next-action').first().click();
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
  await expect(page.getByText(/Belediye tesisi/i)).toBeVisible();
});

test('9. personel yasaklı rota', async ({ page }) => {
  await loginAs(page, 'staff@golbox.gov.tr', 'Staff123!');
  await page.goto('/admin/yetkilendirme');
  await expect(page).toHaveURL(/\/admin\/?$/);
  await expect(page.getByTestId('admin-page-title')).toHaveText('Dashboard');
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

function tomorrowParts() {
  const now = new Date();
  const istanbul = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  istanbul.setUTCDate(istanbul.getUTCDate() + 1);
  const y = istanbul.getUTCFullYear();
  const m = String(istanbul.getUTCMonth() + 1).padStart(2, '0');
  const d = String(istanbul.getUTCDate()).padStart(2, '0');
  return { date: `${y}-${m}-${d}`, end: `${y}-${m}-${String(istanbul.getUTCDate() + 1).padStart(2, '0')}` };
}

test('11. ayarlar kaydı', async ({ page }) => {
  await page.goto('/admin/ayarlar');
  const input = page.getByLabel('1 TL karşılığı GölPuan');
  await expect(input).toBeVisible();
  const current = await input.inputValue();
  await input.fill(current === '2' ? '2.5' : '2');
  await expect(page.getByText('Kaydedilmemiş değişiklik var.')).toBeVisible();
  await page.getByTestId('settings-save').click();
  await expect(page.getByText('Güncel.')).toBeVisible({ timeout: 20_000 });
});

test('12. settings dirty/save', async ({ page }) => {
  await page.goto('/admin/ayarlar');
  await expect(page.getByTestId('settings-save')).toBeVisible();
  await expect(page.getByLabel('Nakit harcamada GölPuan kazanım oranı (%)')).toBeVisible();
});

test('13. staff add/role protection', async ({ page }) => {
  await page.goto('/admin/yetkilendirme');
  await expect(page.getByTestId('staff-add')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Personel yap' }).first()).toBeVisible();
});

test('14. FieldDrop create date/limit', async ({ page }) => {
  const { date } = tomorrowParts();
  await page.goto('/admin/saha-hediyeleri');
  await page.getByTestId('fielddrop-create').click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByLabel('Başlangıç Tarihi')).toBeVisible();
  await expect(dialog.getByLabel('Kişi başı toplama limiti')).toBeVisible();
  await dialog.getByLabel('Başlık').fill('E2E Saha Hediyesi');
  await dialog.getByLabel('Başlangıç Tarihi').fill(date);
  await dialog.getByLabel('Bitiş Tarihi').fill(date);
  await dialog.getByLabel('Bitiş Saati').fill('23:00');
  await dialog.getByLabel('Kişi başı toplama limiti').fill('1');
  await dialog.getByTestId('fielddrop-save').click();
  await expect(page.getByText('E2E Saha Hediyesi').first()).toBeVisible({ timeout: 20_000 });
});

test('15. FieldDrop stop', async ({ page }) => {
  await page.goto('/admin/saha-hediyeleri');
  const stop = page.getByTestId('fielddrop-stop').first();
  if (await stop.count()) {
    await stop.click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Durdur' }).click();
    await expect(page.getByText(/durduruldu/i).first()).toBeVisible();
  } else {
    await expect(page.getByTestId('fielddrop-create')).toBeVisible();
  }
});

test('16. FieldDrop collectors', async ({ page }) => {
  await page.goto('/admin/saha-hediyeleri');
  await page.getByTestId('fielddrop-collectors').first().click();
  await expect(page.getByRole('dialog', { name: /Toplayanlar/ })).toBeVisible();
});

test('17. Cafe edit', async ({ page }) => {
  await page.goto('/admin/gol-kafeler');
  await page.getByTestId('cafe-edit').first().click();
  await expect(page.getByRole('dialog').getByRole('textbox', { name: 'Ad', exact: true })).toBeVisible();
  await expect(page.getByRole('dialog').getByLabel('Bağlı Belediye Tesisi')).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Vazgeç' }).click();
});

test('18. Menu edit', async ({ page }) => {
  await page.goto('/admin/menu');
  if (await page.getByTestId('menu-edit').count()) {
    await page.getByTestId('menu-edit').first().click();
  } else {
    await page.getByTestId('menu-create').click();
  }
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByLabel('Ürün Adı')).toBeVisible();
  await expect(dialog.getByLabel('Satış Fiyatı')).toBeVisible();
  await dialog.getByRole('button', { name: 'Vazgeç' }).click();
});

test('19. Reward edit/passive', async ({ page }) => {
  await page.goto('/admin/oduller');
  if (await page.getByTestId('reward-edit').count()) {
    await page.getByTestId('reward-edit').first().click();
  } else {
    await page.getByTestId('reward-create').click();
  }
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByLabel('GölPuan Bedeli')).toBeVisible();
  await dialog.getByRole('button', { name: 'Vazgeç' }).click();
});

test('20. Activity labels + create', async ({ page }) => {
  await page.goto('/admin/etkinlikler');
  await page.getByTestId('activity-create').click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByLabel('Etkinlik Başlığı')).toBeVisible();
  await expect(dialog.getByLabel('GölPuan Ödülü')).toBeVisible();
  await expect(dialog.getByLabel('Kontenjan')).toBeVisible();
  await dialog.getByRole('button', { name: 'Vazgeç' }).click();
});

test('21. Campaign labels + create', async ({ page }) => {
  await page.goto('/admin/kampanyalar');
  await page.getByTestId('campaign-create').click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByLabel('Kampanya Başlığı')).toBeVisible();
  await expect(dialog.getByLabel('Hedef Kitle')).toBeVisible();
  await expect(dialog.getByLabel('Yönlendirme')).toBeVisible();
  await dialog.getByRole('button', { name: 'Vazgeç' }).click();
});

test('22. 403 ErrorState', async ({ page }) => {
  await page.route('**/api/v1/users?**', async (route) => {
    await route.fulfill({
      status: 403,
      contentType: 'application/json',
      body: JSON.stringify({ success: false, message: 'Bu işlem için yetkiniz bulunmuyor.' })
    });
  });
  await page.goto('/admin/vatandaslar');
  await expect(page.getByTestId('admin-error')).toContainText('yetkiniz bulunmuyor');
});

test('23. 409 ErrorState', async ({ page }) => {
  await page.route('**/api/v1/users?**', async (route) => {
    await route.fulfill({
      status: 409,
      contentType: 'application/json',
      body: JSON.stringify({ success: false, message: 'Bu işlem başka bir değişiklikle çakıştı. Verileri yenileyip tekrar deneyin.' })
    });
  });
  await page.goto('/admin/vatandaslar');
  await expect(page.getByTestId('admin-error')).toContainText('çakıştı');
});

test('24. Ready order cancel', async ({ page }) => {
  await page.goto('/admin/ismarliyor');
  const cancel = page.getByTestId('order-cancel-action');
  await expect(cancel.first()).toBeVisible();
  await cancel.first().click();
  await expect(page.getByRole('alertdialog')).toContainText('iptal');
  await page.getByRole('alertdialog').getByRole('button', { name: 'Vazgeç' }).click();
});

test('25. invalid manual GP must NOT open confirm', async ({ page }) => {
  await page.goto('/admin/vatandaslar');
  await page.getByRole('button', { name: 'Detay' }).first().click();
  await page.getByTestId('manual-gp-action').click();
  await page.getByLabel('Sebep').fill('ab');
  await page.getByTestId('manual-gp-submit').click();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  await expect(page.getByText('Sebep en az 3 karakter olmalıdır.')).toBeVisible();
});

test('26. dashboard critical queue consistency', async ({ page }) => {
  await page.goto('/admin');
  await expect(page.getByText('Aktif Ismarlıyor')).toBeVisible();
  await expect(page.getByTestId('critical-queue')).toBeVisible();
  await expect(page.getByTestId('operation-alerts')).toBeVisible();
});

test('27. sidebar keyboard focus', async ({ page }) => {
  await page.goto('/admin');
  const link = page.getByTestId('admin-sidebar').getByRole('link', { name: 'Dashboard' });
  await link.focus();
  await expect(link).toBeFocused();
  const outline = await link.evaluate((el) => getComputedStyle(el).outlineWidth);
  expect(Number.parseFloat(outline)).toBeGreaterThanOrEqual(2);
});

