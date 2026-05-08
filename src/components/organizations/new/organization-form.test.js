/**
 * Unit Tests: OrganizationForm Schema Validation
 *
 * Tests the Zod schema used by OrganizationForm in isolation.
 * No rendering needed — just pure schema validation logic.
 *
 * Run with: npx vitest run src/components/organizations/new/organization-form.test.js
 */

import { describe, it, expect } from 'vitest';
import { formSchema } from './organization-form';

// ===========================================================================
// HELPERS
// ===========================================================================

function buildValidPayload(overrides = {}) {
    return {
        name: 'Acme Corporation',
        email: 'contact@acme.com',
        phone: '+94771234567',
        city: 'Colombo',
        status: 'active',
        address: '123 Business Park',
        website: 'https://acme.com',
        bank_accounts: [],
        ...overrides,
    };
}

function parse(data) {
    return formSchema.safeParse(data);
}

// ===========================================================================
// TC-U01 – HAPPY PATH
// ===========================================================================

describe('OrganizationForm schema – valid data', () => {
    it('TC-U01 accepts a fully valid payload', () => {
        const result = parse(buildValidPayload());
        expect(result.success).toBe(true);
    });

    it('TC-U02 accepts payload without optional fields', () => {
        const result = parse({
            name: 'Simple Org',
            email: 'simple@org.com',
            phone: '+94771234567',
            city: 'Kandy',
            status: 'active',
        });
        expect(result.success).toBe(true);
    });

    it('TC-U03 accepts an empty bank_accounts array', () => {
        const result = parse(buildValidPayload({ bank_accounts: [] }));
        expect(result.success).toBe(true);
    });

    it('TC-U04 accepts multiple valid bank accounts', () => {
        const result = parse(
            buildValidPayload({
                bank_accounts: [
                    { name: 'Commercial Bank', accountNo: '12345678', currency: 'LKR', status: 'active' },
                    { name: 'HNB', accountNo: '87654321', currency: 'USD', status: 'active' },
                ],
            })
        );
        expect(result.success).toBe(true);
    });

    it('TC-U05 accepts subscription fields', () => {
        const result = parse(
            buildValidPayload({
                subscription_tier: 'Pro',
                billing_cycle: 'Monthly',
                subscription_status: 'Active',
            })
        );
        expect(result.success).toBe(true);
    });
});

// ===========================================================================
// TC-U10 – NAME VALIDATION
// ===========================================================================

describe('OrganizationForm schema – name field', () => {
    it('TC-U10 rejects name shorter than 2 characters', () => {
        const result = parse(buildValidPayload({ name: 'A' }));
        expect(result.success).toBe(false);
        const issue = result.error?.issues.find((i) => i.path.includes('name'));
        expect(issue?.message).toMatch(/at least 2 characters/i);
    });

    it('TC-U11 rejects missing name', () => {
        const payload = buildValidPayload();
        delete payload.name;
        const result = parse(payload);
        expect(result.success).toBe(false);
    });

    it('TC-U12 accepts name with exactly 2 characters (boundary)', () => {
        const result = parse(buildValidPayload({ name: 'AB' }));
        expect(result.success).toBe(true);
    });

    it('TC-U13 accepts a very long name', () => {
        const result = parse(buildValidPayload({ name: 'A'.repeat(255) }));
        expect(result.success).toBe(true);
    });
});

// ===========================================================================
// TC-U20 – EMAIL VALIDATION
// ===========================================================================

describe('OrganizationForm schema – email field', () => {
    it('TC-U20 rejects invalid email format', () => {
        const result = parse(buildValidPayload({ email: 'not-an-email' }));
        expect(result.success).toBe(false);
        const issue = result.error?.issues.find((i) => i.path.includes('email'));
        expect(issue?.message).toMatch(/valid email/i);
    });

    it('TC-U21 rejects email without domain', () => {
        const result = parse(buildValidPayload({ email: 'user@' }));
        expect(result.success).toBe(false);
    });

    it('TC-U22 accepts standard email formats', () => {
        for (const email of ['user@example.com', 'u+tag@sub.domain.co.uk', 'name123@org.lk']) {
            const result = parse(buildValidPayload({ email }));
            expect(result.success, `Expected valid for ${email}`).toBe(true);
        }
    });

    it('TC-U23 rejects missing email', () => {
        const payload = buildValidPayload();
        delete payload.email;
        const result = parse(payload);
        expect(result.success).toBe(false);
    });
});

// ===========================================================================
// TC-U30 – PHONE VALIDATION
// ===========================================================================

describe('OrganizationForm schema – phone field', () => {
    it('TC-U30 rejects completely non-numeric phone', () => {
        const result = parse(buildValidPayload({ phone: 'not-a-phone' }));
        expect(result.success).toBe(false);
        const issue = result.error?.issues.find((i) => i.path.includes('phone'));
        expect(issue?.message).toMatch(/invalid phone/i);
    });

    it('TC-U31 accepts international format', () => {
        const result = parse(buildValidPayload({ phone: '+94711234567' }));
        expect(result.success).toBe(true);
    });

    it('TC-U32 accepts local format with dashes', () => {
        const result = parse(buildValidPayload({ phone: '071-123-4567' }));
        expect(result.success).toBe(true);
    });
});

// ===========================================================================
// TC-U40 – CITY VALIDATION
// ===========================================================================

describe('OrganizationForm schema – city field', () => {
    it('TC-U40 rejects city shorter than 2 characters', () => {
        const result = parse(buildValidPayload({ city: 'A' }));
        expect(result.success).toBe(false);
        const issue = result.error?.issues.find((i) => i.path.includes('city'));
        expect(issue?.message).toMatch(/at least 2 characters/i);
    });

    it('TC-U41 accepts city with exactly 2 characters', () => {
        const result = parse(buildValidPayload({ city: 'AB' }));
        expect(result.success).toBe(true);
    });
});

// ===========================================================================
// TC-U50 – STATUS VALIDATION
// ===========================================================================

describe('OrganizationForm schema – status field', () => {
    it('TC-U50 rejects missing status', () => {
        const payload = buildValidPayload();
        delete payload.status;
        const result = parse(payload);
        expect(result.success).toBe(false);
        const issue = result.error?.issues.find((i) => i.path.includes('status'));
        expect(issue).toBeDefined();
    });

    it('TC-U51 accepts any non-empty status string', () => {
        for (const status of ['active', 'suspended', 'pending']) {
            const result = parse(buildValidPayload({ status }));
            expect(result.success, `Expected valid for status="${status}"`).toBe(true);
        }
    });
});

// ===========================================================================
// TC-U60 – BANK ACCOUNTS VALIDATION
// ===========================================================================

describe('OrganizationForm schema – bank_accounts field', () => {
    it('TC-U60 rejects bank account with empty name', () => {
        const result = parse(
            buildValidPayload({
                bank_accounts: [{ name: 'X', accountNo: '12345678', currency: 'LKR' }],
            })
        );
        expect(result.success).toBe(false);
        const issue = result.error?.issues.find(
            (i) => JSON.stringify(i.path).includes('name')
        );
        expect(issue?.message).toMatch(/bank name is required/i);
    });

    it('TC-U61 rejects bank account with short account number', () => {
        const result = parse(
            buildValidPayload({
                bank_accounts: [{ name: 'BOC', accountNo: '123', currency: 'LKR' }],
            })
        );
        expect(result.success).toBe(false);
        const issue = result.error?.issues.find(
            (i) => JSON.stringify(i.path).includes('accountNo')
        );
        expect(issue?.message).toMatch(/account number is required/i);
    });

    it('TC-U62 accepts a valid bank account entry', () => {
        const result = parse(
            buildValidPayload({
                bank_accounts: [
                    { name: 'Bank of Ceylon', accountNo: '00123456789', currency: 'LKR', status: 'active' },
                ],
            })
        );
        expect(result.success).toBe(true);
    });

    it('TC-U63 allows bank_accounts to be undefined (optional)', () => {
        const payload = buildValidPayload();
        delete payload.bank_accounts;
        const result = parse(payload);
        expect(result.success).toBe(true);
    });
});

// ===========================================================================
// TC-U70 – SUBSCRIPTION FIELDS
// ===========================================================================

describe('OrganizationForm schema – subscription fields', () => {
    it('TC-U70 rejects invalid subscription_tier', () => {
        const result = parse(buildValidPayload({ subscription_tier: 'InvalidTier' }));
        expect(result.success).toBe(false);
    });

    it('TC-U71 rejects invalid billing_cycle', () => {
        const result = parse(buildValidPayload({ billing_cycle: 'Weekly' }));
        expect(result.success).toBe(false);
    });

    it('TC-U72 rejects invalid subscription_status', () => {
        const result = parse(buildValidPayload({ subscription_status: 'Unknown' }));
        expect(result.success).toBe(false);
    });

    it('TC-U73 accepts valid subscription_tier values', () => {
        for (const tier of ['Basic', 'Pro', 'Enterprise']) {
            const result = parse(buildValidPayload({ subscription_tier: tier }));
            expect(result.success, `Expected valid for tier="${tier}"`).toBe(true);
        }
    });

    it('TC-U74 accepts valid billing_cycle values', () => {
        for (const cycle of ['Monthly', 'Yearly', 'Lifetime']) {
            const result = parse(buildValidPayload({ billing_cycle: cycle }));
            expect(result.success, `Expected valid for cycle="${cycle}"`).toBe(true);
        }
    });
});

// ===========================================================================
// TC-U80 – WEBSITE & ADDRESS (OPTIONAL)
// ===========================================================================

describe('OrganizationForm schema – optional fields', () => {
    it('TC-U80 accepts empty string for website', () => {
        const result = parse(buildValidPayload({ website: '' }));
        expect(result.success).toBe(true);
    });

    it('TC-U81 accepts valid URL for website', () => {
        const result = parse(buildValidPayload({ website: 'https://company.com' }));
        expect(result.success).toBe(true);
    });

    it('TC-U82 accepts empty string for address', () => {
        const result = parse(buildValidPayload({ address: '' }));
        expect(result.success).toBe(true);
    });
});
