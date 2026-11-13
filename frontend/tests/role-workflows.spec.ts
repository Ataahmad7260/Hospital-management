import { test, expect } from '@playwright/test';

test.describe('Core Role Workflows (Admin, Doctor, Pharmacist, Patient)', () => {
  test('Admin workflow: RBAC role separation, Hospital Staff roster, no Pharmacy Formulary, and Admit Patient payment gate', async ({ page }) => {
    await page.goto('/#/login');
    await page.getByRole('button', { name: /ataah@gmail\.com/i }).click();

    const main = page.locator('main');
    await expect(main).toBeVisible();

    // Ensure Admin Master Panel does NOT render Pharmacy Formulation / Add New Medicine or ADMIN CLEARANCE banner
    await expect(page.getByText(/Pharmacy Formulation/i)).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Add New Medicine/i })).toHaveCount(0);
    await expect(page.getByText('ADMIN CLEARANCE')).toHaveCount(0);
    await expect(page.getByText('Administrative Authority Master Panel')).toHaveCount(0);

    // Check Hospital Staff tab (Nurses, Ward Boys, Ward Girls, etc.)
    await main.getByRole('button', { name: /Hospital Staff/i }).first().click();
    await expect(main.getByText(/Nursing & Midwifery/i).first()).toBeVisible();
    await expect(main.getByText(/Ward Boys & Ward Girls/i).first()).toBeVisible();

    // Open Add Hospital Staff modal & verify presets then close
    await main.getByRole('button', { name: /Add Hospital Staff/i }).click();
    await expect(page.getByRole('heading', { name: /Add Hospital Staff Member/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Nurse', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ward Boy', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ward Girl', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Check Staff & RBAC Directory excludes Patient role
    await main.getByRole('button', { name: /Staff & RBAC/i }).first().click();
    await expect(main.getByText('Hospital Staff & Role-Based Access Control (RBAC)')).toBeVisible();
    await expect(main.getByRole('button', { name: /^Patients?$/i })).toHaveCount(0);

    // Check Register & Admit Patient modal upfront Consultation Fee gate
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /\+ Add Patient/i }).click();
    await expect(page.getByRole('heading', { name: 'Register & Admit Patient' })).toBeVisible();
    await expect(page.getByText(/Consultation Fee/i).first()).toBeVisible();

    // Fill minimal intake details and trigger upfront payment step (do NOT submit final DB write)
    await page.getByPlaceholder('Eleanor', { exact: true }).fill('Playwright');
    await page.getByPlaceholder('Rigby', { exact: true }).fill('TestCheck');
    await page.getByPlaceholder(/Primary symptoms/i).fill('Routine consultation payment gate check');
    await page.getByRole('button', { name: 'Admit Patient' }).click();

    await expect(page.getByRole('heading', { name: 'Consultation Fee Payment Required' })).toBeVisible();
    await expect(page.getByText('Stage 1 Upfront Gate')).toBeVisible();
    await expect(page.getByRole('button', { name: /Pay \$.*& Admit Patient/i })).toBeVisible();
    await page.getByRole('button', { name: /Back to Details/i }).click();
    await page.getByRole('button', { name: 'Cancel' }).click();
  });

  test('Pharmacist workflow: Exclusive Medicine Management, Dispensary Billing, and Sales Revenue Ledger', async ({ page }) => {
    await page.goto('/#/login');
    await page.getByRole('button', { name: /Pharmacist\s+Dispensary/i }).click();

    const main = page.locator('main');
    await expect(main).toBeVisible();

    // Pharmacist has exclusive Add New Medicine control
    await main.getByRole('button', { name: 'Add New Medicine' }).first().click();
    await expect(page.getByRole('heading', { name: 'Add New Medicine' })).toBeVisible();
    await expect(page.getByText(/Pharmacist Exclusive/i)).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Dispensary Orders & Billing tab
    await main.getByRole('button', { name: /Dispensary Orders/i }).click();
    await expect(main.getByText(/Pharmacist Dispensary Queue & Stage 2 Medicine Billing/i)).toBeVisible();

    // Sales & Revenue Ledger tab
    await main.getByRole('button', { name: /Sales & Revenue Ledger/i }).click();
    await expect(main.getByText('Last Month Sales (30d)')).toBeVisible();
    await expect(main.getByText('Overall Total Sales')).toBeVisible();

    // Medicine Management & Stock tab
    await main.getByRole('button', { name: /Medicine Management & Stock/i }).click();
    await expect(main.getByText('Medicine Management & Batch Inventory Control')).toBeVisible();
  });

  test('Doctor workflow: Consultation Queue and Prescription Writer with Medications & Lab Orders', async ({ page }) => {
    await page.goto('/#/login');
    await page.getByRole('button', { name: /Doctor\s+Clinical/i }).click();

    const main = page.locator('main');
    await expect(main).toBeVisible();
    await expect(main.getByRole('button', { name: /Live Consultation Queue/i })).toBeVisible();

    await main.getByRole('button', { name: /Prescription Writer Interface/i }).click();
    await expect(main.getByText(/Prescribed Medications/i).first()).toBeVisible();
    await expect(main.getByText(/Lab \/ Diagnostic Tests/i).first()).toBeVisible();
  });

  test('Patient workflow: Two-stage Billing separation and Formal Clinical Prescription Sheet', async ({ page }) => {
    await page.goto('/#/login');
    await page.getByRole('button', { name: /Patient\s+Intake Care/i }).click();

    const main = page.locator('main');
    await expect(main).toBeVisible();
    await expect(main.getByText('Doctors Available for Consultation Today')).toBeVisible();

    // Prescriptions tab & formal printable prescription sheet modal
    await main.getByRole('button', { name: /My Prescriptions/i }).click();
    const sheetBtn = main.getByRole('button', { name: /Formal Sheet \/ Print/i }).first();
    if ((await sheetBtn.count()) > 0) {
      await sheetBtn.click();
      await expect(page.getByRole('heading', { name: /Clinical Prescription Sheet/i })).toBeVisible();
      await expect(page.getByText(/Print \/ Save (PDF|All)/i)).toBeVisible();
      await page.getByRole('button', { name: 'Close' }).first().click();
    }

    // Two-stage Billing separation: Stage 1 Consultation Fees vs Stage 2 Pharmacy Dues
    await main.getByRole('button', { name: /Billing & Payment Status/i }).click();
    await expect(main.getByText(/Stage 1 • Consultation Fees/i)).toBeVisible();
    await expect(main.getByText(/Stage 2 • Pharmacy Dues/i)).toBeVisible();
  });
});
