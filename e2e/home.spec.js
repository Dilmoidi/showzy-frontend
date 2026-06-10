import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {

  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have the site header', async ({ page }) => {
    await page.goto('/');
    const header = page.locator('header, nav').first();
    await expect(header).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    const loginLink = page.locator('a[href="/login"]').first();
    if (await loginLink.isVisible()) {
      await loginLink.click();
      await expect(page).toHaveURL(/\/login/);
    }
  });

});
