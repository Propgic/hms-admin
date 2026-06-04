import { describe, it, expect } from 'vitest';
import { getPageTitle } from '../pageTitles';

describe('getPageTitle', () => {
  it('returns Dashboard for the root path', () => {
    expect(getPageTitle('/')).toBe('Dashboard');
  });

  it('returns Hospitals for the hospitals list', () => {
    expect(getPageTitle('/hospitals')).toBe('Hospitals');
  });

  it('returns Hospital Details for a specific hospital', () => {
    expect(getPageTitle('/hospitals/abc-123')).toBe('Hospital Details');
  });

  it('returns Invoices for the invoices list', () => {
    expect(getPageTitle('/invoices')).toBe('Invoices');
  });

  it('returns Invoice Details for a specific invoice', () => {
    expect(getPageTitle('/invoices/INV-001')).toBe('Invoice Details');
  });

  it('returns Support Inbox for the support root', () => {
    expect(getPageTitle('/support')).toBe('Support Inbox');
  });

  it('returns Ticket Details for a specific ticket', () => {
    expect(getPageTitle('/support/42')).toBe('Ticket Details');
  });

  it('returns Subscription Plans for /plans', () => {
    expect(getPageTitle('/plans')).toBe('Subscription Plans');
  });

  it('returns Reports & Analytics for /reports', () => {
    expect(getPageTitle('/reports')).toBe('Reports & Analytics');
  });

  it('returns Settings for /settings', () => {
    expect(getPageTitle('/settings')).toBe('Settings');
  });

  it('matches nested settings sub-paths via prefix', () => {
    expect(getPageTitle('/settings/profile')).toBe('Settings');
  });

  it('returns an empty string for an unknown path', () => {
    expect(getPageTitle('/totally-unknown')).toBe('');
  });

  it('returns an empty string for an empty pathname', () => {
    expect(getPageTitle('')).toBe('');
  });
});
