import { test, expect } from '@playwright/test';

// -------------------------------------------------------------------
// TEST HELPERS
// -------------------------------------------------------------------

const ADMIN_EMAIL = 'admin@emipos.com';
const ADMIN_PASSWORD = 'admin123';

/** Login using the UI, but handle NextAuth redirects carefully */
async function login(page) {
    console.log("Navigating to login...");
    await page.goto('/login');

    console.log("Filling credentials...");
    await page.locator('input[type="email"], input[name="email"]').first().fill(ADMIN_EMAIL);
    await page.locator('input[type="password"]').first().fill(ADMIN_PASSWORD);

    console.log("Clicking submit...");
    await page.locator('button[type="submit"]').click();

    console.log("Waiting for network idle or a specific page element...");
    // Just wait a few seconds and check the URL
    await page.waitForTimeout(5000);
    console.log("Current URL:", page.url());

    // Instead of waiting for URL precisely, look for something on the dashboard or navbar
    // This avoids Next.js router transition timeouts in Playwright
    try {
        // Any link that usually exists for authenticated users, e.g. "Dashboard" or "Products"
        await expect(page.getByRole('link', { name: /dashboard|home/i }).first()).toBeVisible({ timeout: 10000 });
        console.log("Successfully identified Dashboard link.");
    } catch (e) {
        console.error("Login verification failed. Current URL:", page.url());
        // Dump the page text to see where we landed
        const bodyText = await page.textContent('body');
        console.log("Body snippet:", bodyText.substring(0, 500));
        await page.screenshot({ path: 'login-failure-2.png' });
        throw new Error("Login failed or timed out.");
    }
}

test('Test Direct Login Fallback', async ({ page }) => {
    await login(page);
    await page.goto('/products');
    await expect(page.getByRole('button', { name: /opening stock/i })).toBeVisible({ timeout: 10000 });
    console.log("Products page and button verified.");
});
