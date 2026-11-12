import { test, expect, type Page } from '@playwright/test';

const VIEWPORTS = [
  { name: 'Desktop', width: 1280, height: 800 },
  { name: 'Mobile', width: 390, height: 844 },
];

async function assertNoHorizontalOverflow(page: Page, contextLabel: string) {
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(150);

    const metrics = await page.evaluate(() => {
      const vw = window.innerWidth;
      const docScrollW = document.documentElement.scrollWidth;
      const bodyScrollW = document.body.scrollWidth;
      const main = document.querySelector('main');
      const mainScrollW = main ? main.scrollWidth : null;
      const mainClientW = main ? main.clientWidth : null;

      // Any horizontal scrollers must hide ugly scrollbars
      const visibleHorizScrollbars: string[] = [];
      for (const el of document.querySelectorAll('body *')) {
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden' || el.tagName === 'TEXTAREA') continue;
        if (cs.overflowX === 'auto' || cs.overflowX === 'scroll') {
          const isHoriz = el.scrollWidth > el.clientWidth + 1 || cs.overflowY === 'hidden' || cs.overflowY === 'visible';
          if (isHoriz && cs.scrollbarWidth !== 'none') {
            visibleHorizScrollbars.push(`${el.tagName}.${(el.className || '').toString().slice(0, 50)}`);
          }
        }
      }

      return { vw, docScrollW, bodyScrollW, mainScrollW, mainClientW, visibleHorizScrollbars };
    });

    expect(
      metrics.docScrollW,
      `${contextLabel} [${vp.name}]: documentElement.scrollWidth (${metrics.docScrollW}) exceeded viewport (${metrics.vw})`,
    ).toBeLessThanOrEqual(metrics.vw);

    expect(
      metrics.bodyScrollW,
      `${contextLabel} [${vp.name}]: body.scrollWidth (${metrics.bodyScrollW}) exceeded viewport (${metrics.vw})`,
    ).toBeLessThanOrEqual(metrics.vw);

    if (metrics.mainScrollW !== null && metrics.mainClientW !== null) {
      expect(
        metrics.mainScrollW,
        `${contextLabel} [${vp.name}]: <main>.scrollWidth (${metrics.mainScrollW}) exceeded clientWidth (${metrics.mainClientW})`,
      ).toBeLessThanOrEqual(metrics.mainClientW + 1);
    }

    expect(
      metrics.visibleHorizScrollbars,
      `${contextLabel} [${vp.name}]: expected horizontal scrollers to hide visible scrollbars`,
    ).toEqual([]);
  }
}

test.describe('Responsive Layout & No Horizontal Overflow Checks', () => {
  test('Auth pages have zero horizontal overflow across Desktop & Mobile', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Clinical Authentication' })).toBeVisible();
    await assertNoHorizontalOverflow(page, 'Auth:Login');

    await page.getByRole('button', { name: 'New Patient Enrollment' }).click();
    await assertNoHorizontalOverflow(page, 'Auth:Register');
  });

  test('Admin Portal core management tabs have zero horizontal overflow', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /ataah@gmail\.com/i }).click();
    const main = page.locator('main');
    await expect(main).toBeVisible();
    await expect(main.getByRole('button', { name: /Doctors Management/i })).toBeVisible();

    await assertNoHorizontalOverflow(page, 'Admin:MasterOverview');

    for (const tabName of ['Doctors Management', 'Patients Registry', 'Hospital Staff']) {
      await main.getByRole('button', { name: new RegExp(tabName, 'i') }).first().click();
      await page.waitForTimeout(200);
      await assertNoHorizontalOverflow(page, `Admin:${tabName}`);
    }
  });

  test('Admin Portal RBAC, Financials & intake routes have zero horizontal overflow', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /ataah@gmail\.com/i }).click();
    const main = page.locator('main');
    await expect(main).toBeVisible();
    await expect(main.getByRole('button', { name: /Staff & RBAC/i })).toBeVisible();

    for (const tabName of ['Staff & RBAC', 'Financials']) {
      await main.getByRole('button', { name: new RegExp(tabName, 'i') }).first().click();
      await page.waitForTimeout(200);
      await assertNoHorizontalOverflow(page, `Admin:${tabName}`);
    }

    await page.evaluate(() => {
      window.location.hash = '#/daily-graph';
    });
    await page.waitForTimeout(200);
    await assertNoHorizontalOverflow(page, 'Admin:DailyGraph');

    await page.evaluate(() => {
      window.location.hash = '#/admit-patient';
    });
    await page.waitForTimeout(200);
    await assertNoHorizontalOverflow(page, 'Admin:AdmitPatient');
  });

  test('Doctor Portal views have zero horizontal overflow', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Doctor\s+Clinical/i }).click();
    const main = page.locator('main');
    await expect(main).toBeVisible();
    await expect(main.getByRole('button', { name: /Live Consultation Queue/i })).toBeVisible();

    await assertNoHorizontalOverflow(page, 'Doctor:Queue');

    await main.getByRole('button', { name: /Prescription Writer Interface/i }).click();
    await page.waitForTimeout(200);
    await assertNoHorizontalOverflow(page, 'Doctor:RxWriter');
  });

  test('Pharmacist Portal views have zero horizontal overflow', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Pharmacist\s+Dispensary/i }).click();
    const main = page.locator('main');
    await expect(main).toBeVisible();
    await expect(main.getByRole('button', { name: /Dispensary Orders/i })).toBeVisible();

    await assertNoHorizontalOverflow(page, 'Pharmacist:Overview');

    for (const tabName of ['Dispensary Orders', 'Sales & Revenue', 'Medicine Management']) {
      await main.getByRole('button', { name: new RegExp(tabName, 'i') }).first().click();
      await page.waitForTimeout(200);
      await assertNoHorizontalOverflow(page, `Pharmacist:${tabName}`);
    }
  });

  test('Patient Portal views have zero horizontal overflow', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Patient\s+Intake Care/i }).click();
    const main = page.locator('main');
    await expect(main).toBeVisible();
    await expect(main.getByText('Doctors Available for Consultation Today')).toBeVisible();

    await assertNoHorizontalOverflow(page, 'Patient:AvailableDoctors');

    for (const tabName of ['My Prescriptions', 'Billing & Payment Status']) {
      await main.getByRole('button', { name: new RegExp(tabName, 'i') }).first().click();
      await page.waitForTimeout(200);
      await assertNoHorizontalOverflow(page, `Patient:${tabName}`);
    }
  });
});

