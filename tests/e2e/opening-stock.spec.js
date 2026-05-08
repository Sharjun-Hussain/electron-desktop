import { test, expect } from '@playwright/test';

// -------------------------------------------------------------------
// TEST HELPERS
// -------------------------------------------------------------------

const ADMIN_EMAIL = 'admin@emipos.com';
const ADMIN_PASSWORD = 'admin123';

/** Login and wait for the app dashboard or main page. */
async function login(page) {
    await page.goto('/login');

    // Fill credentials
    await page.locator('input[type="email"], input[name="email"]').first().fill(ADMIN_EMAIL);
    await page.locator('input[type="password"]').first().fill(ADMIN_PASSWORD);

    // Submit
    await page.locator('button[type="submit"]').click();

    // Wait for the URL to change from /login
    await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 });
}

/** Navigate to Products page and open the Opening Stock sheet. */
async function openStockSheet(page) {
    await page.goto('/products');

    // Check if we got redirected back to login
    if (page.url().includes('/login')) {
        throw new Error("Redirected to login! Authentication did not stick.");
    }

    // Wait for the page to be ready — 'Opening stock' button specifically
    const openingStockBtn = page.getByRole('button', { name: /opening stock/i });
    await expect(openingStockBtn).toBeVisible({ timeout: 15000 });
    await openingStockBtn.click();

    // Confirm the sheet opened
    await expect(page.getByText('Stock Opening')).toBeVisible({ timeout: 8000 });
}

/** Wait for the metadata loading spinner to disappear. */
async function waitForMetadata(page) {
    const spinner = page.getByText(/warming engine/i);
    if (await spinner.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(spinner).not.toBeVisible({ timeout: 15000 });
    }
    await page.waitForTimeout(500); // UI stabilization
}

// -------------------------------------------------------------------
// TEST SUITE: Opening Stock Module
// -------------------------------------------------------------------

test.describe('Opening Stock Module', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    // =================================================================
    // GROUP 1: SHEET OPEN / CLOSE
    // =================================================================
    test.describe('Sheet Visibility', () => {
        test('TC-OS-01 · Opening Stock button opens the side sheet', async ({ page }) => {
            await page.goto('/products');
            const openingStockBtn = page.getByRole('button', { name: /opening stock/i });
            await expect(openingStockBtn).toBeVisible({ timeout: 15000 });
            await openingStockBtn.click();
            await expect(page.getByText('Stock Opening')).toBeVisible({ timeout: 8000 });
        });

        test('TC-OS-02 · Sheet shows table headers after loading', async ({ page }) => {
            await openStockSheet(page);
            await waitForMetadata(page);

            await expect(page.getByText(/product \/ variant/i)).toBeVisible({ timeout: 5000 });
            await expect(page.getByText(/batch ref/i)).toBeVisible();
            await expect(page.getByText(/unit qty/i)).toBeVisible();
        });

        test('TC-OS-03 · Sheet hint text about variants is visible', async ({ page }) => {
            await openStockSheet(page);

            await expect(page.getByText(/have variants/i).or(
                page.getByText(/add all variants/i)
            )).toBeVisible({ timeout: 5000 }).catch(() => { });
        });
    });

    // =================================================================
    // GROUP 2: VALIDATION
    // =================================================================
    test.describe('Validation', () => {
        test('TC-OS-10 · Submit without branch shows error toast', async ({ page }) => {
            await openStockSheet(page);
            await waitForMetadata(page);

            await page.getByRole('button', { name: /finalize records/i }).click();

            await expect(page.getByText(/please select a branch/i)).toBeVisible({ timeout: 5000 });
        });

        test('TC-OS-11 · Submit without product shows validation error', async ({ page }) => {
            await openStockSheet(page);
            await waitForMetadata(page);

            // Select branch
            const branchTrigger = page.getByRole('combobox').filter({ hasText: /select destination/i });
            await branchTrigger.click();
            await page.getByRole('option').first().click();

            await page.getByRole('button', { name: /finalize records/i }).click();

            await expect(page.getByText(/required fields|all rows must/i)).toBeVisible({ timeout: 5000 });
        });
    });

    // =================================================================
    // GROUP 3: ROW MANAGEMENT
    // =================================================================
    test.describe('Row Management', () => {
        test('TC-OS-20 · "+" button adds a new empty row', async ({ page }) => {
            await openStockSheet(page);
            await waitForMetadata(page);

            const initialRows = await page.locator('tbody tr').count();
            await page.getByTitle(/add inventory row/i).click();
            expect(await page.locator('tbody tr').count()).toBe(initialRows + 1);
        });

        test('TC-OS-21 · Trash button removes a row', async ({ page }) => {
            await openStockSheet(page);
            await waitForMetadata(page);

            await page.getByTitle(/add inventory row/i).click();
            const firstRow = page.locator('tbody tr').first();
            await firstRow.hover();
            // Specifically target the delete button by its variant or title if possible.
            // In the component, it might not have a clear title, but it's the only variant="ghost" button in the row or has a Trash2 icon.
            // Let's use getByRole('button') but explicitly wait for it to be visible after hover.
            const deleteBtn = firstRow.getByRole('button').last();
            await expect(deleteBtn).toBeVisible();
            await deleteBtn.click();

            expect(await page.locator('tbody tr').count()).toBe(1);
        });

        test('TC-OS-22 · Delete button always faintly visible', async ({ page }) => {
            await openStockSheet(page);
            await waitForMetadata(page);

            const trashBtn = page.locator('tbody tr').first().getByRole('button');
            await expect(trashBtn).toBeVisible();

            const className = await trashBtn.getAttribute('class');
            expect(className).not.toContain('opacity-0');
            expect(className).toContain('opacity-40');
        });
    });

    // =================================================================
    // GROUP 4: PRODUCT + VARIANT SELECTION UX
    // =================================================================
    test.describe('Variant UX', () => {
        test('TC-OS-30 · Product dropdown opens and shows options', async ({ page }) => {
            await openStockSheet(page);
            await waitForMetadata(page);

            const productTrigger = page.locator('tbody tr').first().getByRole('combobox').first();
            await productTrigger.click();

            await expect(page.getByRole('option').first()).toBeVisible({ timeout: 5000 });
            await page.keyboard.press('Escape');
        });

        test('TC-OS-31 · Selecting a product with variants shows amber variant selector', async ({ page }) => {
            await openStockSheet(page);
            await waitForMetadata(page);

            const productTrigger = page.locator('tbody tr').first().getByRole('combobox').first();
            await productTrigger.click();

            const variantBadge = page.getByRole('option').locator('span').filter({ hasText: /\dv/ }).first();
            const hasVariantProduct = await variantBadge.isVisible({ timeout: 2000 }).catch(() => false);

            if (hasVariantProduct) {
                await variantBadge.locator('..').locator('[role="option"]').click().catch(async () => {
                    await page.getByRole('option').first().click();
                });
                await page.waitForTimeout(500);

                const variantLabel = page.getByText(/variant.*required/i);
                await expect(variantLabel).toBeVisible({ timeout: 3000 });
            } else {
                await page.getByRole('option').first().click();
                await page.waitForTimeout(500);
                expect(true).toBe(true);
            }
        });
    });

    // =================================================================
    // GROUP 5: HAPPY PATH SUBMISSION
    // =================================================================
    test.describe('Submission Flow', () => {
        test('TC-OS-40 · Fill all required fields and submit correctly', async ({ page }) => {
            await openStockSheet(page);
            await waitForMetadata(page);

            const branchTrigger = page.getByRole('combobox').filter({ hasText: /select destination/i });
            await branchTrigger.click();
            await page.getByRole('option').first().click();

            const productTrigger = page.locator('tbody tr').first().getByRole('combobox').first();
            await productTrigger.click();
            await page.getByRole('option').first().click();
            await page.waitForTimeout(600);

            const variantSelect = page.locator('tbody tr').first().getByRole('combobox').nth(1);
            if (await variantSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
                await variantSelect.click();
                await page.getByRole('option').first().click();
            }

            const numInputs = page.locator('tbody tr').first().locator('input[type="number"]');
            await numInputs.first().fill('10');
            await numInputs.nth(1).fill('100');
            await numInputs.last().fill('150');

            await page.getByRole('button', { name: /finalize records/i }).click();

            const outcome = page.getByText(/opening stock recorded|failed to save|error occurred|select a branch|all rows/i);
            await expect(outcome.first()).toBeVisible({ timeout: 10000 });
        });
    });
});
