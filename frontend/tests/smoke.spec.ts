import { test, expect } from '@playwright/test';

test.describe('Frontend Smoke & Authentication Checks', () => {
  test('renders Aura Hospital public landing page cleanly with all required sections', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/');

    // 1. Sticky Top Navigation Bar
    await expect(page.getByText('Aura Hospital').first()).toBeVisible();
    await expect(page.getByText('H+').first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Services', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Specialists', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'About Us', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Contact', exact: true })).toBeVisible();

    // 2. Hero Section
    await expect(page.getByText(/Emergency Care Open 24\/7/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /Advanced Healthcare,\s+Delivered with Compassion\./i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Access Patient Portal/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Explore Services/i })).toBeVisible();

    // 3. Quick Info & Statistics Bar
    await expect(page.getByText('24/7 Emergency & Triage')).toBeVisible();
    await expect(page.getByText('Board-Certified Consultants')).toBeVisible();
    await expect(page.getByText('Integrated Electronic Health Records')).toBeVisible();

    // 4. Comprehensive Medical Services Grid (01 to 06)
    await expect(page.getByRole('heading', { name: 'Comprehensive Medical Services' })).toBeVisible();
    await expect(page.getByText('General Medicine').first()).toBeVisible();
    await expect(page.getByText('Cardiology & Vascular').first()).toBeVisible();
    await expect(page.getByText('Pediatrics & Neonatal Care').first()).toBeVisible();
    await expect(page.getByText('Diagnostics & Pathology').first()).toBeVisible();
    await expect(page.getByText('Emergency & Trauma Care').first()).toBeVisible();
    await expect(page.getByText('Surgery & Recovery').first()).toBeVisible();

    // 5. About Our Facility Section
    await expect(page.getByText('About Our Facility').first()).toBeVisible();
    await expect(page.getByText(/Darbhanga, Bihar/i).first()).toBeVisible();
    await expect(page.getByText(/100% Unified Digital Health Records/i)).toBeVisible();

    // 6. Footer
    await expect(page.getByText(/Aura Hospital & Medical Institute\. All rights reserved\./i)).toBeVisible();

    // Route to Login via Patient Login outline button
    await page.getByRole('button', { name: /Patient Login/i }).first().click();
    await expect(page.getByRole('heading', { name: 'Clinical Authentication' })).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test('renders authentication page cleanly without console or page errors', async ({ page }) => {
    const pageErrors: string[] = [];
    const serverErrors: string[] = [];

    page.on('pageerror', (err) => pageErrors.push(err.message));
    page.on('response', (res) => {
      if (res.status() >= 500) {
        serverErrors.push(`${res.status()} ${res.url()}`);
      }
    });

    await page.goto('/#/login');

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

