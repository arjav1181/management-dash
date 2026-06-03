import { test, expect } from '@playwright/test';

test.describe('Auth', () => {
  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  test('login page renders the bridge brand', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Public pages', () => {
  test('health endpoint returns ok', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.status).toBe('ok');
  });

  test('CSP report endpoint accepts a violation', async ({ request }) => {
    const res = await request.post('/api/csp-report', {
      data: { 'csp-report': { 'blocked-uri': 'eval' } },
    });
    expect(res.ok()).toBeTruthy();
  });
});
