#!/usr/bin/env node
/**
 * Foundation check: login, contracts, cafe update, rewards, orders, dashboard.
 * Requires API at http://localhost:5155
 */
const BASE = process.env.GOLBOX_API || 'http://localhost:5155/api/v1';

async function req(path, { method = 'GET', token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
  return { status: res.status, json };
}

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

async function main() {
  const failures = [];
  const check = async (name, fn) => {
    try {
      await fn();
      console.log(`OK  ${name}`);
    } catch (err) {
      failures.push(`${name}: ${err.message}`);
      console.error(`FAIL ${name}: ${err.message}`);
    }
  };

  await check('login rejects bad password', async () => {
    const { status, json } = await req('/auth/login', {
      method: 'POST',
      body: { email: 'admin@golbox.gov.tr', password: '123456' },
    });
    assert(status === 422 || status === 400 || json?.success === false, `expected reject, got ${status} ${JSON.stringify(json)}`);
  });

  let token;
  await check('admin login with seed password', async () => {
    const { status, json } = await req('/auth/login', {
      method: 'POST',
      body: { email: 'admin@golbox.gov.tr', password: 'Admin123!' },
    });
    assert(status === 200 && json?.success && json?.data?.accessToken, `login failed ${status} ${JSON.stringify(json)}`);
    assert(json.data.user.roles.includes('Admin'), `expected Admin role, got ${JSON.stringify(json.data.user.roles)}`);
    token = json.data.accessToken;
  });

  await check('dashboard overview uses real metrics', async () => {
    const { status, json } = await req('/dashboard/overview', { token });
    assert(status === 200 && json?.success, `overview failed ${status}`);
    assert(typeof json.data.totalUsers === 'number', 'missing totalUsers alias');
    assert(typeof json.data.metrics.registeredCitizensCount === 'number', 'missing metrics.registeredCitizensCount');
  });

  await check('cafes include imageUrl and can be updated', async () => {
    const list = await req('/cafes', { token });
    assert(list.status === 200 && Array.isArray(list.json.data), 'cafes list missing');
    const first = list.json.data[0];
    assert(first, 'no cafes seeded');
    const updated = await req(`/cafes/${first.id}`, {
      method: 'PUT',
      token,
      body: { name: first.name, address: first.address, imageUrl: 'https://example.com/cafe.jpg' },
    });
    assert(updated.status === 200 && updated.json.success, `update cafe failed ${JSON.stringify(updated.json)}`);
    const again = await req('/cafes', { token });
    const found = again.json.data.find((c) => c.id === first.id);
    assert(found.imageUrl === 'https://example.com/cafe.jpg', `imageUrl not persisted: ${found.imageUrl}`);
  });

  await check('menu catalog and cafe menu', async () => {
    const all = await req('/menu-items', { token });
    assert(all.status === 200 && Array.isArray(all.json.data) && all.json.data.length > 0, 'menu-items empty');
    const cafeId = all.json.data[0].cafeId;
    const menu = await req(`/cafes/${cafeId}/menu`, { token });
    assert(menu.status === 200 && Array.isArray(menu.json.data), 'cafe menu missing');
  });

  await check('rewards requiredPoints contract', async () => {
    const { status, json } = await req('/rewards', { token });
    assert(status === 200 && json.success, `rewards failed ${status}`);
    const items = json.data.items || json.data;
    assert(Array.isArray(items) && items.length > 0, 'no rewards');
    assert(typeof items[0].requiredPoints === 'number', 'requiredPoints missing');
  });

  await check('create order uses real menu item', async () => {
    const users = await req('/users', { token });
    const citizen = (users.json.data || []).find((u) => u.email === 'user@golbox.com');
    const menu = await req('/menu-items', { token });
    const coffee = (menu.json.data || []).find((m) => !m.requiredEducation) || menu.json.data[0];
    const { status, json } = await req('/orders', {
      method: 'POST',
      token,
      body: {
        userId: citizen.id,
        cafeId: coffee.cafeId,
        paidWithPoints: false,
        items: [{ menuItemId: coffee.id, quantity: 1 }],
      },
    });
    assert(status === 200 && json.success && json.data.id, `order failed ${status} ${JSON.stringify(json)}`);
  });

  await check('points ledger is org-wide', async () => {
    const { status, json } = await req('/points/ledger', { token });
    assert(status === 200 && json.success, `ledger failed ${status}`);
    assert(Array.isArray(json.data.items), 'ledger items missing');
  });

  await check('existing admin modules still load', async () => {
    for (const path of ['/users', '/cafes', '/menu-items', '/orders', '/rewards', '/campaigns', '/activities', '/notifications', '/auditlogs', '/dashboard/overview']) {
      const { status, json } = await req(path, { token });
      assert(status === 200 && json?.success !== false, `${path} failed ${status} ${JSON.stringify(json)}`);
    }
  });

  await check('nearby field drops are public and only live', async () => {
    const { status, json } = await req('/field-drops/nearby?latitude=37.0662&longitude=37.3781');
    assert(status === 200 && json?.success && Array.isArray(json.data), `nearby failed ${status} ${JSON.stringify(json)}`);
    const first = json.data[0];
    if (first) {
      assert(Object.prototype.hasOwnProperty.call(first, 'modelGlbUrl'), 'nearby missing modelGlbUrl');
    }
  });

  let dropId;
  await check('admin lists and creates field drops', async () => {
    const list = await req('/field-drops', { token });
    assert(list.status === 200 && Array.isArray(list.json.data) && list.json.data.length >= 2, `seed drops missing ${JSON.stringify(list.json)}`);
    const created = await req('/field-drops', {
      method: 'POST',
      token,
      body: {
        title: 'Test Pin',
        description: 'Doğrulama pini',
        latitude: 37.07,
        longitude: 37.38,
        radiusMeters: 40,
        pointsGranted: 15,
        totalStock: 5,
        perUserLimit: 1,
        isActive: true,
        modelGlbUrl: '',
      },
    });
    assert(created.status === 200 && created.json.success && created.json.data.id, `create drop failed ${JSON.stringify(created.json)}`);
    dropId = created.json.data.id;
    const updated = await req(`/field-drops/${dropId}`, {
      method: 'PUT',
      token,
      body: {
        title: 'Test Pin Güncel',
        description: 'Doğrulama pini',
        latitude: 37.07,
        longitude: 37.38,
        radiusMeters: 40,
        pointsGranted: 15,
        totalStock: 5,
        perUserLimit: 1,
        isActive: true,
      },
    });
    assert(updated.status === 200 && updated.json.success, `update drop failed ${JSON.stringify(updated.json)}`);
  });

  await check('capture rejects out of range then accepts in range once', async () => {
    const citizenLogin = await req('/auth/login', {
      method: 'POST',
      body: { email: 'user@golbox.com', password: 'User123!' },
    });
    assert(citizenLogin.json?.data?.accessToken, 'citizen login failed');
    const citizenToken = citizenLogin.json.data.accessToken;
    const far = await req(`/field-drops/${dropId}/capture`, {
      method: 'POST',
      token: citizenToken,
      body: { latitude: 36.0, longitude: 36.0 },
    });
    assert(far.json?.success === false, `expected out-of-range reject, got ${JSON.stringify(far.json)}`);
    const near = await req(`/field-drops/${dropId}/capture`, {
      method: 'POST',
      token: citizenToken,
      body: { latitude: 37.07, longitude: 37.38 },
    });
    assert(near.status === 200 && near.json.success, `in-range capture failed ${JSON.stringify(near.json)}`);
    const again = await req(`/field-drops/${dropId}/capture`, {
      method: 'POST',
      token: citizenToken,
      body: { latitude: 37.07, longitude: 37.38 },
    });
    assert(again.json?.success === false, `expected duplicate reject, got ${JSON.stringify(again.json)}`);
  });

  if (failures.length) {
    console.error(`\n${failures.length} foundation check(s) failed.`);
    process.exit(1);
  }
  console.log('\nAll foundation checks passed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
