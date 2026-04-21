import { test, expect } from '@playwright/test';

test('opengraph image returns png', async ({ request }) => {
  const res = await request.get('/r/00000000-0000-0000-0000-000000000000/opengraph-image');
  expect(res.status()).toBe(200);
  const ct = res.headers()['content-type'] ?? '';
  expect(ct).toContain('image/png');
});
