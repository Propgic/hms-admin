import { describe, it, expect } from 'vitest';
import { formatCurrency, formatCompactCurrency, getCurrencySymbol } from '../formatters';

// Smoke + behaviour coverage for the currency formatters. These run in the
// default platform currency (whatever formatters.js initialises to) — we
// assert structural properties (symbol present, compact suffixes) rather than
// a hard-coded currency so the suite is locale/config independent.
describe('formatters', () => {
  it('formatCurrency coerces non-finite input to zero', () => {
    const zero = formatCurrency(0);
    expect(formatCurrency(NaN)).toBe(zero);
    expect(formatCurrency(undefined)).toBe(zero);
    expect(formatCurrency('not-a-number')).toBe(zero);
  });

  it('formatCurrency renders a number for finite input', () => {
    const out = formatCurrency(1234);
    expect(typeof out).toBe('string');
    expect(out.length).toBeGreaterThan(0);
  });

  it('getCurrencySymbol returns a non-empty string', () => {
    expect(getCurrencySymbol('USD')).toBeTruthy();
    expect(getCurrencySymbol('INR')).toBeTruthy();
  });

  it('formatCompactCurrency abbreviates large USD values with M/B', () => {
    expect(formatCompactCurrency(2_500_000, 'USD')).toMatch(/M$/);
    expect(formatCompactCurrency(3_000_000_000, 'USD')).toMatch(/B$/);
  });

  it('formatCompactCurrency abbreviates large INR values with L/Cr', () => {
    expect(formatCompactCurrency(500_000, 'INR')).toMatch(/L$/);
    expect(formatCompactCurrency(20_000_000, 'INR')).toMatch(/Cr$/);
  });
});
