import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('랜딩 페이지에 치명·심각 접근성 위반이 없다', async ({ page }) => {
  await page.goto('/');
  const { violations } = await new AxeBuilder({ page }).analyze();
  const serious = violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
  expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
});
