/**
 * Smoke tests - verify modules load correctly and core functions work.
 * Checkpoint validation for tasks 1.2 and 2.1.
 */

describe('plan-hierarchy module', () => {
  const { PLAN_HIERARCHY, getUpgradeOptions } = require('../plan-hierarchy');

  test('exports PLAN_HIERARCHY array with 4 plans', () => {
    expect(Array.isArray(PLAN_HIERARCHY)).toBe(true);
    expect(PLAN_HIERARCHY).toHaveLength(4);
    expect(PLAN_HIERARCHY[0].name).toBe('Pro');
    expect(PLAN_HIERARCHY[3].name).toBe('Power');
  });

  test('getUpgradeOptions returns plans above current plan', () => {
    const options = getUpgradeOptions('Pro');
    expect(options).toHaveLength(3);
    expect(options[0].name).toBe('Pro+');
    expect(options[1].name).toBe('Pro Max');
    expect(options[2].name).toBe('Power');
  });

  test('getUpgradeOptions returns empty array for Power (highest plan)', () => {
    expect(getUpgradeOptions('Power')).toEqual([]);
  });

  test('getUpgradeOptions returns empty array for unknown plan', () => {
    expect(getUpgradeOptions('NonExistent')).toEqual([]);
  });

  test('getUpgradeOptions for Pro+ returns Pro Max and Power', () => {
    const options = getUpgradeOptions('Pro+');
    expect(options).toHaveLength(2);
    expect(options[0].name).toBe('Pro Max');
    expect(options[1].name).toBe('Power');
  });
});

describe('whatsapp-templates module', () => {
  const {
    CONFIG,
    formatDate,
    safeField,
    buildWhatsAppUrl,
    generateRenewalMessage,
    generateUpgradeMessage,
    generateCancellationMessage,
    openWhatsApp,
  } = require('../../whatsapp-templates');

  test('exports all expected functions', () => {
    expect(typeof formatDate).toBe('function');
    expect(typeof safeField).toBe('function');
    expect(typeof buildWhatsAppUrl).toBe('function');
    expect(typeof generateRenewalMessage).toBe('function');
    expect(typeof generateUpgradeMessage).toBe('function');
    expect(typeof generateCancellationMessage).toBe('function');
    expect(typeof openWhatsApp).toBe('function');
  });

  test('CONFIG has correct WHATSAPP_NUMBER', () => {
    expect(CONFIG.WHATSAPP_NUMBER).toBe('919019879108');
  });

  test('CONFIG has MAX_WHATSAPP_MESSAGE_LENGTH of 1000', () => {
    expect(CONFIG.MAX_WHATSAPP_MESSAGE_LENGTH).toBe(1000);
  });

  test('formatDate handles valid date', () => {
    const result = formatDate('2025-03-15');
    expect(result).toBe('15/03/2025');
  });

  test('formatDate returns N/A for null', () => {
    expect(formatDate(null)).toBe('N/A');
  });

  test('formatDate returns N/A for invalid date', () => {
    expect(formatDate('not-a-date')).toBe('N/A');
  });

  test('safeField returns empty string for null/undefined', () => {
    expect(safeField(null)).toBe('');
    expect(safeField(undefined)).toBe('');
  });

  test('safeField returns string representation of value', () => {
    expect(safeField('hello')).toBe('hello');
    expect(safeField(42)).toBe('42');
  });

  test('generateRenewalMessage returns valid WhatsApp URL', () => {
    const user = {
      name: 'Test User',
      email: 'test@example.com',
      currentPlan: 'Pro',
      planEndDate: '2025-06-01',
    };
    const url = generateRenewalMessage(user);
    expect(url).toMatch(/^https:\/\/api\.whatsapp\.com\/send\?phone=919019879108&text=/);
    const decoded = decodeURIComponent(url.split('text=')[1]);
    expect(decoded).toContain('Test User');
    expect(decoded).toContain('test@example.com');
    expect(decoded).toContain('Pro');
    expect(decoded).toContain('renew');
  });

  test('generateUpgradeMessage includes new plan name', () => {
    const user = {
      name: 'Test User',
      email: 'test@example.com',
      currentPlan: 'Pro',
      planEndDate: '2025-06-01',
    };
    const url = generateUpgradeMessage(user, 'Pro+');
    const decoded = decodeURIComponent(url.split('text=')[1]);
    expect(decoded).toContain('Pro+');
    expect(decoded).toContain('upgrade');
  });

  test('generateCancellationMessage produces valid URL', () => {
    const user = {
      name: 'Test User',
      email: 'test@example.com',
      currentPlan: 'Pro',
      planEndDate: '2025-06-01',
    };
    const url = generateCancellationMessage(user);
    expect(url).toMatch(/^https:\/\/api\.whatsapp\.com\/send\?phone=919019879108&text=/);
    const decoded = decodeURIComponent(url.split('text=')[1]);
    expect(decoded).toContain('cancel');
  });

  test('handles null planEndDate gracefully (shows N/A)', () => {
    const user = {
      name: 'Test User',
      email: 'test@example.com',
      currentPlan: 'Pro',
      planEndDate: null,
    };
    const url = generateRenewalMessage(user);
    const decoded = decodeURIComponent(url.split('text=')[1]);
    expect(decoded).toContain('N/A');
  });

  test('handles missing user fields gracefully', () => {
    const user = { name: null, email: null, currentPlan: null, planEndDate: null };
    // Should not throw
    const url = generateRenewalMessage(user);
    expect(url).toMatch(/^https:\/\/api\.whatsapp\.com\/send\?phone=/);
  });
});
