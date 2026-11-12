import { test, expect } from '@playwright/test';

test.describe('Frontend Smoke & Authentication Checks', () => {
  test('renders authentication page cleanly without console or page errors', async ({ page }) => {
    const pageErrors: string[] = [];
    const serverErrors: string[] = [];

    page.on('pageerror', (err) => pageErrors.push(err.message));
    page.on('response', (res) => {
      if (res.status() >= 500) {
        serverErrors.push(`${res.status()} ${res.url()}`);
      }
    });

    await page.goto('/');

    await expect(page.getByText('Hospital OS • RBAC Security')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Clinical Authentication' })).toBeVisible();

    // Sign In & Enrollment tabs toggle properly
    const signInBtn = page.getByRole('button', { name: 'Sign In' });
    const registerTabBtn = page.getByRole('button', { name: 'New Patient Enrollment' });
    await expect(signInBtn).toBeVisible();
    await expect(registerTabBtn).toBeVisible();
    await expect(page.getByRole('button', { name: 'Authenticate Session' })).toBeVisible();

    await registerTabBtn.click();
    await expect(page.getByText('Patient Intake Registration')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Complete Patient Enrollment' })).toBeVisible();

    await signInBtn.click();
    await expect(page.getByRole('button', { name: 'Authenticate Session' })).toBeVisible();

    // Verify quick 1-click role login shortcuts are present
    await expect(page.getByRole('button', { name: /ataah@gmail\.com/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Doctor\s+Clinical/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Pharmacist\s+Dispensary/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Patient\s+Intake Care/i })).toBeVisible();

    // Theme toggle switches root dark class cleanly
    const html = page.locator('html');
    const wasDark = await html.evaluate((el) => el.classList.contains('dark'));
    await page.getByRole('button', { name: 'Toggle theme' }).click();
    const isDarkAfter = await html.evaluate((el) => el.classList.contains('dark'));
    expect(isDarkAfter).not.toBe(wasDark);

    expect(pageErrors).toEqual([]);
    expect(serverErrors).toEqual([]);
  });
});

