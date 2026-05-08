import { test, expect } from '@playwright/test';

// -------------------------------------------------------------------
// TEST HELPERS
// -------------------------------------------------------------------

/**
 * Navigate to the login page and authenticate.
 * Adjust credentials and selectors to match your actual login page.
 */
async function loginAsSuperAdmin(page) {
    await page.goto('/login');
    await page.waitForURL(/login/, { timeout: 10000 });

    await page.getByLabel(/email/i).fill('admin@example.com');
    await page.getByLabel(/password/i).fill('password');
    await page.getByRole('button', { name: /sign in|login/i }).click();

    // Wait for successful auth redirect
    await page.waitForURL(/\/dashboard|\/organizations/i, { timeout: 15000 });
}

/**
 * Fill core required fields on the Business Profile form.
 */
async function fillRequiredFields(page, overrides = {}) {
    const data = {
        name: 'Acme Corp',
        email: 'acme@example.com',
        phone: '+94771234567',
        city: 'Colombo',
        status: 'active',
        ...overrides,
    };

    await page.getByLabel(/organization name|profile name/i).fill(data.name);
    await page.getByLabel(/email/i).first().fill(data.email);
    await page.getByLabel(/phone/i).fill(data.phone);
    await page.getByLabel(/city/i).fill(data.city);

    // Select status via combobox
    const statusTrigger = page.locator('[name="status"]').or(
        page.getByRole('combobox').filter({ hasText: /status/i })
    );
    // fallback: click the first Select with "Select status" placeholder
    await page.getByText('Select status').click();
    await page.getByRole('option', { name: /active profile/i }).click();
}

// -------------------------------------------------------------------
// TEST SUITE: Business Profile Module
// -------------------------------------------------------------------

test.describe('Business Profile Module', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsSuperAdmin(page);
    });

    // =================================================================
    // GROUP 1: LIST PAGE
    // =================================================================
    test.describe('Business Profile List', () => {
        test('TC-01 · List page loads and shows table', async ({ page }) => {
            await page.goto('/organizations');
            await expect(page).toHaveTitle(/business profiles|organizations/i);

            // Header
            await expect(page.getByRole('heading', { name: /business profiles/i })).toBeVisible();

            // Table or empty state
            const tableOrEmpty = page.locator('table, [data-testid="empty-state"]');
            await expect(tableOrEmpty.first()).toBeVisible();
        });

        test('TC-02 · "Add Profile" button navigates to creation form', async ({ page }) => {
            await page.goto('/organizations');
            const addButton = page.getByRole('button', { name: /add|create|new/i }).first();
            await addButton.click();
            await expect(page).toHaveURL(/\/organizations\/new/);
            await expect(page.getByRole('heading', { name: /create business profile/i })).toBeVisible();
        });

        test('TC-03 · Search / filter input narrows the table', async ({ page }) => {
            await page.goto('/organizations');
            const searchInput = page.getByPlaceholder(/search/i);
            await searchInput.fill('zzz_nonexistent_org');
            // After search the table should be empty or show no results
            await expect(page.getByText(/no result|no data|empty/i)).toBeVisible({ timeout: 5000 });
        });
    });

    // =================================================================
    // GROUP 2: CREATE FLOW
    // =================================================================
    test.describe('Create Business Profile', () => {
        test.beforeEach(async ({ page }) => {
            await page.goto('/organizations/new');
        });

        test('TC-10 · Create form page renders all required sections', async ({ page }) => {
            await expect(page.getByRole('heading', { name: /create business profile/i })).toBeVisible();

            // Sections
            await expect(page.getByText(/profile details/i)).toBeVisible();
            await expect(page.getByText(/ownership|initial access/i)).toBeVisible();
            await expect(page.getByText(/branding|logo/i)).toBeVisible();
            await expect(page.getByText(/visibility|access/i)).toBeVisible();
            await expect(page.getByText(/corporate bank accounts/i)).toBeVisible();
        });

        test('TC-11 · Submitting empty form shows validation errors', async ({ page }) => {
            // Click submit without filling anything
            await page.getByRole('button', { name: /publish profile/i }).click();

            // Expect required field errors
            await expect(page.getByText(/at least 2 characters|organization name/i)).toBeVisible();
            await expect(page.getByText(/valid email/i)).toBeVisible();
            await expect(page.getByText(/invalid phone|phone/i)).toBeVisible();
            await expect(page.getByText(/city must/i)).toBeVisible();
        });

        test('TC-12 · Create profile with all required fields (happy path)', async ({ page }) => {
            await fillRequiredFields(page);

            // Optional: website & address
            await page.getByLabel(/website/i).fill('https://acmecorp.com');
            await page.getByLabel(/address/i).fill('123 Main St, Colombo 01');

            // Owner section (create mode)
            const ownerName = page.getByLabel(/owner name|owner's name/i);
            if (await ownerName.isVisible()) {
                await ownerName.fill('John Doe');
                await page.getByLabel(/owner email/i).fill('john@acmecorp.com');
                await page.getByLabel(/password/i).last().fill('secure123');
            }

            // Submit
            await page.getByRole('button', { name: /publish profile/i }).click();

            // Expect success toast or redirect
            const success = page
                .getByText(/created|success|profile saved/i)
                .or(page.getByRole('status').filter({ hasText: /success/i }));
            await expect(success.first()).toBeVisible({ timeout: 10000 });
        });

        test('TC-13 · Validates name field minimum length', async ({ page }) => {
            await page.getByLabel(/organization name|profile name/i).fill('A');
            await page.getByRole('button', { name: /publish profile/i }).click();
            await expect(page.getByText(/at least 2 characters/i)).toBeVisible();
        });

        test('TC-14 · Validates email format', async ({ page }) => {
            await page.getByLabel(/email/i).first().fill('not-an-email');
            await page.getByRole('button', { name: /publish profile/i }).click();
            await expect(page.getByText(/valid email/i)).toBeVisible();
        });

        test('TC-15 · Logo upload preview renders', async ({ page }) => {
            // Trigger the file picker without actually uploading
            const fileInput = page.locator('input[type="file"]');
            // Create a simple PNG buffer file
            await fileInput.setInputFiles({
                name: 'logo.png',
                mimeType: 'image/png',
                buffer: Buffer.from(
                    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=',
                    'base64'
                ),
            });

            // Preview image should update (AvatarImage src changes)
            const avatar = page.locator('img[alt="Logo"]');
            await expect(avatar).toHaveAttribute('src', /blob:/);
        });

        test('TC-16 · Add bank account inline and validate fields', async ({ page }) => {
            // Click "Add Account"
            await page.getByRole('button', { name: /add account/i }).click();

            // Expect a new account card to appear
            await expect(page.getByText('Account #1')).toBeVisible();
            await expect(page.getByPlaceholder(/bank of ceylon/i)).toBeVisible();
            await expect(page.getByPlaceholder(/XXXX XXXX XXXX/i)).toBeVisible();
        });

        test('TC-17 · Remove bank account removes it from the list', async ({ page }) => {
            // Add two accounts
            await page.getByRole('button', { name: /add account/i }).click();
            await page.getByRole('button', { name: /add account/i }).click();

            await expect(page.getByText('Account #2')).toBeVisible();

            // Hover the first account to reveal the delete button
            const firstCard = page.locator('.group').first();
            await firstCard.hover();
            await firstCard.getByRole('button').filter({ hasText: '' }).click(); // trash icon btn

            await expect(page.getByText('Account #2')).not.toBeVisible();
            await expect(page.getByText('Account #1')).toBeVisible();
        });

        test('TC-18 · Discard button navigates back', async ({ page }) => {
            await page.getByRole('button', { name: /discard/i }).click();
            await expect(page).not.toHaveURL(/\/organizations\/new/);
        });

        test('TC-19 · Ownership section visible in create mode only', async ({ page }) => {
            // "Shop Owner Details" or similar section should be visible
            await expect(page.getByText(/ownership|initial access|shop owner/i)).toBeVisible();
        });

        test('TC-20 · Subscription management section NOT visible in create mode', async ({ page }) => {
            // The subscription plan edit section should NOT be present
            await expect(page.getByText(/subscription management/i)).not.toBeVisible();
        });
    });

    // =================================================================
    // GROUP 3: EDIT FLOW
    // =================================================================
    test.describe('Edit Business Profile', () => {
        let organizationId;

        test.beforeAll(async ({ browser }) => {
            // Get the first organization's ID from the list to edit
            const page = await browser.newPage();
            await loginAsSuperAdmin(page);
            await page.goto('/organizations');

            // Try to get the ID from the first row edit link
            const editLink = page.locator('a[href*="/edit"]').first();
            const href = await editLink.getAttribute('href');
            organizationId = href?.match(/organizations\/(\d+)\/edit/)?.[1] || '1';
            await page.close();
        });

        test.beforeEach(async ({ page }) => {
            await loginAsSuperAdmin(page);
            await page.goto(`/organizations/${organizationId}/edit`);
            await expect(page.getByRole('heading', { name: /edit business profile/i })).toBeVisible({ timeout: 10000 });
        });

        test('TC-30 · Edit form has name pre-populated', async ({ page }) => {
            const nameInput = page.getByLabel(/organization name|profile name/i);
            const value = await nameInput.inputValue();
            expect(value.length).toBeGreaterThan(0);
        });

        test('TC-31 · Subscription management visible in edit mode', async ({ page }) => {
            await expect(page.getByText(/subscription|plan|billing/i)).toBeVisible();
        });

        test('TC-32 · Ownership section NOT visible in edit mode', async ({ page }) => {
            await expect(page.getByText(/initial access|branch name|shop owner/i)).not.toBeVisible();
        });

        test('TC-33 · Update profile name and save', async ({ page }) => {
            const nameInput = page.getByLabel(/organization name|profile name/i);
            await nameInput.clear();
            await nameInput.fill('Updated Corp Name');

            await page.getByRole('button', { name: /commit changes|save|update/i }).click();

            // Expect success
            const success = page
                .getByText(/updated|success|saved/i)
                .or(page.getByRole('status').filter({ hasText: /success/i }));
            await expect(success.first()).toBeVisible({ timeout: 10000 });
        });

        test('TC-34 · Status dropdown is functional', async ({ page }) => {
            const statusTrigger = page.locator('[data-radix-select-trigger]').first();
            await statusTrigger.click();
            await page.getByRole('option', { name: /suspended/i }).click();
            // Verify the trigger now shows "Suspended"
            await expect(statusTrigger).toContainText(/suspended/i);
        });

        test('TC-35 · Add bank account in edit mode persists', async ({ page }) => {
            await page.getByRole('button', { name: /add account/i }).click();

            const bankNameInput = page.getByPlaceholder(/bank of ceylon/i);
            await bankNameInput.fill('Commercial Bank');

            const accountNoInput = page.getByPlaceholder(/XXXX XXXX XXXX/i);
            await accountNoInput.fill('123456789012');

            // Save
            await page.getByRole('button', { name: /commit changes|save/i }).click();

            const success = page
                .getByText(/updated|success|saved/i)
                .or(page.getByRole('status').filter({ hasText: /success/i }));
            await expect(success.first()).toBeVisible({ timeout: 10000 });
        });

        test('TC-36 · Cancelling edit navigates back to list', async ({ page }) => {
            await page.getByRole('button', { name: /discard/i }).click();
            await expect(page).not.toHaveURL(/\/edit/);
        });
    });

    // =================================================================
    // GROUP 4: DELETE / STATUS ACTIONS
    // =================================================================
    test.describe('Delete & Status Actions', () => {
        test.beforeEach(async ({ page }) => {
            await page.goto('/organizations');
        });

        test('TC-40 · Delete confirmation dialog appears on delete click', async ({ page }) => {
            // Open actions menu on first row & click delete
            const actionsMenu = page.getByRole('button', { name: /actions|options|more/i }).first();
            await actionsMenu.click();
            const deleteOption = page.getByRole('menuitem', { name: /delete|remove/i });
            await deleteOption.click();

            // Expect an Alert Dialog
            await expect(page.getByRole('alertdialog')).toBeVisible();
            await expect(page.getByText(/are you sure|confirm delete/i)).toBeVisible();
        });

        test('TC-41 · Cancel in delete dialog closes without deleting', async ({ page }) => {
            const actionsMenu = page.getByRole('button', { name: /actions|options|more/i }).first();
            await actionsMenu.click();
            await page.getByRole('menuitem', { name: /delete|remove/i }).click();

            // Click Cancel in the dialog
            await page.getByRole('button', { name: /cancel/i }).click();
            await expect(page.getByRole('alertdialog')).not.toBeVisible();
        });
    });

    // =================================================================
    // GROUP 5: BACK NAVIGATION & URL ROUTING
    // =================================================================
    test.describe('Navigation & Routing', () => {
        test('TC-50 · Direct URL to /organizations/new renders create form', async ({ page }) => {
            await page.goto('/organizations/new');
            await expect(page.getByRole('heading', { name: /create business profile/i })).toBeVisible();
        });

        test('TC-51 · Back to Profiles button links to /organizations', async ({ page }) => {
            await page.goto('/organizations/new');
            await page.getByRole('link', { name: /back to profiles/i }).click();
            await expect(page).toHaveURL(/\/organizations$/i);
        });

        test('TC-52 · Invalid org ID returns error or 404', async ({ page }) => {
            await page.goto('/organizations/999999999/edit');
            // Either redirect to list or show error
            const errorState = page.getByText(/failed to load|not found|error/i);
            const redirectedToList = page.getByRole('heading', { name: /business profiles/i });
            await expect(errorState.or(redirectedToList)).toBeVisible({ timeout: 8000 });
        });
    });
});
