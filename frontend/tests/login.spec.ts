import { test, expect } from '@playwright/test';

test('login page loads and displays form', async ({ page }) => {
  // Navigate to the login page
  await page.goto('http://localhost:3000/login');

  // Check if the main heading is visible (using a more specific locator)
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();

  // Check if the email input field is visible
  await expect(page.locator('input[type="email"]')).toBeVisible();

  // Check if the login button is visible
  await expect(page.getByRole('button', { name: 'Log In' })).toBeVisible();
});
