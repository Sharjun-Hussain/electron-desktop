import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = 'admin@emipos.com';
const ADMIN_PASSWORD = 'admin123';

test('Test Login and Navigation Map', async ({ page }) => {
    console.log("Navigating to login...");
    await page.goto('/login');

    console.log("Filling email and password...");
    await page.locator('input[type="email"], input[name="email"]').first().fill(ADMIN_EMAIL);
    await page.locator('input[type="password"]').first().fill(ADMIN_PASSWORD);

    console.log("Clicking submit...");
    await page.locator('button[type="submit"]').click();

    console.log("Waiting for network idle...");
    await page.waitForLoadState('networkidle');

    console.log("Current URL after login:", page.url());

    console.log("Navigating to /products...");
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    console.log("Current URL after going to /products:", page.url());

    console.log("Looking for buttons on the page...");
    const buttons = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim());
    });
    console.log("Buttons found:", buttons);

    console.log("Taking screenshot...");
    await page.screenshot({ path: 'debug-products-page.png', fullPage: true });
});
