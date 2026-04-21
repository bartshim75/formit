import { test, expect } from '@playwright/test';

test('responses api validates body', async ({ request }) => {
  const res = await request.post('/api/responses', { data: { hello: 'world' } });
  expect(res.status()).toBe(400);
});
