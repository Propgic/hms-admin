import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import toast from 'react-hot-toast';
import endpoints from '../endpoints';

// We test only the non-network surface of the axios client:
//   • the exported `forceLogout` helper (auth-key cleanup + redirect)
//   • the default axios instance shape (it exists and has request methods)
//   • the endpoints map exposes the real groups it defines
// Interceptors are NOT exercised end-to-end (no HTTP, no fake servers).
//
// `forceLogout` guards itself with a module-level `loggingOut` flag so it only
// navigates once per module lifetime. To test each branch in isolation we use
// `vi.resetModules()` + a dynamic import so every test gets a fresh module with
// `loggingOut === false`.
async function loadAxiosModule() {
  vi.resetModules();
  return import('../axios');
}

// react-hot-toast is globally mocked in src/test/setup.js. Re-importing the
// default here gives us the same mock fns to assert against.

describe('api/axios — forceLogout', () => {
  let originalLocation;

  beforeEach(() => {
    originalLocation = window.location;
    // Replace window.location with a controllable stub. pathname drives the
    // "are we already on /login?" branch; replace is what we assert navigation.
    delete window.location;
    window.location = {
      pathname: '/dashboard',
      replace: vi.fn(),
      assign: vi.fn(),
      href: 'http://localhost/dashboard',
    };
    localStorage.setItem('hms_admin_token', 'tok-123');
    localStorage.setItem('hms_admin_user', JSON.stringify({ id: 1 }));
    // Leave an unrelated key to prove forceLogout only clears the admin keys.
    localStorage.setItem('unrelated_key', 'keep-me');
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  it('clears the admin auth keys from localStorage', async () => {
    const { forceLogout } = await loadAxiosModule();

    expect(localStorage.getItem('hms_admin_token')).toBe('tok-123');
    forceLogout();

    expect(localStorage.getItem('hms_admin_token')).toBeNull();
    expect(localStorage.getItem('hms_admin_user')).toBeNull();
  });

  it('does not touch unrelated localStorage keys', async () => {
    const { forceLogout } = await loadAxiosModule();

    forceLogout();

    expect(localStorage.getItem('unrelated_key')).toBe('keep-me');
  });

  it('redirects to /login when not already on the login page', async () => {
    const { forceLogout } = await loadAxiosModule();
    window.location.pathname = '/dashboard';

    forceLogout();

    expect(window.location.replace).toHaveBeenCalledWith('/login');
  });

  it('shows a toast with the default reason on redirect', async () => {
    const { forceLogout } = await loadAxiosModule();
    window.location.pathname = '/dashboard';

    forceLogout();

    expect(toast.error).toHaveBeenCalledWith('Session expired. Please login again.');
  });

  it('uses a custom reason when provided', async () => {
    const { forceLogout } = await loadAxiosModule();
    window.location.pathname = '/dashboard';

    forceLogout('Custom logout message');

    expect(toast.error).toHaveBeenCalledWith('Custom logout message');
  });

  it('does not navigate or toast when already on /login (but still clears keys)', async () => {
    const { forceLogout } = await loadAxiosModule();
    window.location.pathname = '/login';

    forceLogout();

    expect(window.location.replace).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
    // Keys are still cleared even when we don't navigate.
    expect(localStorage.getItem('hms_admin_token')).toBeNull();
    expect(localStorage.getItem('hms_admin_user')).toBeNull();
  });

  it('is idempotent — a second call in the same module does not navigate again', async () => {
    const { forceLogout } = await loadAxiosModule();
    window.location.pathname = '/dashboard';

    forceLogout();
    expect(window.location.replace).toHaveBeenCalledTimes(1);

    // Re-set a token to prove the second call is a true no-op (guarded out).
    localStorage.setItem('hms_admin_token', 'tok-again');
    forceLogout();

    expect(window.location.replace).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('hms_admin_token')).toBe('tok-again');
  });

  it('does not throw when reason is empty (no toast, still navigates)', async () => {
    const { forceLogout } = await loadAxiosModule();
    window.location.pathname = '/dashboard';

    expect(() => forceLogout('')).not.toThrow();
    expect(toast.error).not.toHaveBeenCalled();
    expect(window.location.replace).toHaveBeenCalledWith('/login');
  });
});

describe('api/axios — default instance', () => {
  it('exports a default axios instance with HTTP verb methods', async () => {
    const mod = await loadAxiosModule();
    const api = mod.default;

    expect(api).toBeTruthy();
    for (const verb of ['get', 'post', 'put', 'patch', 'delete']) {
      expect(typeof api[verb]).toBe('function');
    }
    expect(api.interceptors).toBeTruthy();
  });
});

describe('api/endpoints', () => {
  it('default-exports an object', () => {
    expect(endpoints).toBeTruthy();
    expect(typeof endpoints).toBe('object');
  });

  it('exposes the real top-level endpoint groups', () => {
    const expectedGroups = [
      'auth',
      'dashboard',
      'hospitals',
      'coupons',
      'invoices',
      'plans',
      'billing',
      'faqs',
      'faqCategories',
      'activityLogs',
      'reports',
      'impersonate',
      'announcements',
      'support',
      'publicSettings',
      'notifications',
      'settings',
    ];
    for (const group of expectedGroups) {
      expect(endpoints).toHaveProperty(group);
    }
  });

  it('auth group has the documented string endpoints under /platform', () => {
    expect(endpoints.auth.login).toBe('/platform/auth/login');
    expect(endpoints.auth.forgotPassword).toBe('/platform/auth/forgot-password');
    expect(endpoints.auth.resetPassword).toBe('/platform/auth/reset-password');
    expect(endpoints.auth.me).toBe('/platform/auth/me');
    expect(endpoints.auth.changePassword).toBe('/platform/auth/change-password');
  });

  it('hospitals group mixes static strings and id-builder functions', () => {
    expect(endpoints.hospitals.list).toBe('/platform/hospitals');
    expect(endpoints.hospitals.create).toBe('/platform/hospitals');
    expect(typeof endpoints.hospitals.get).toBe('function');
    expect(endpoints.hospitals.get('abc')).toBe('/platform/hospitals/abc');
    expect(endpoints.hospitals.toggleStatus('h1')).toBe('/platform/hospitals/h1/toggle-status');
    expect(endpoints.hospitals.saveAccessRole('h1', 'admin')).toBe(
      '/platform/hospitals/h1/access-control/admin'
    );
  });

  it('impersonate is a builder that interpolates the hospital id', () => {
    expect(typeof endpoints.impersonate).toBe('function');
    expect(endpoints.impersonate('h99')).toBe('/platform/impersonate/h99');
  });

  it('support group exposes list/get/update/reply/stats', () => {
    expect(endpoints.support.list).toBe('/platform/support-tickets');
    expect(endpoints.support.get('t1')).toBe('/platform/support-tickets/t1');
    expect(endpoints.support.reply('t1')).toBe('/platform/support-tickets/t1/messages');
    expect(endpoints.support.stats).toBe('/platform/support-tickets/stats');
  });

  it('publicSettings is a plain unauthenticated path string', () => {
    expect(endpoints.publicSettings).toBe('/platform/public-settings');
  });

  it('every group path begins with the /platform prefix', () => {
    const collectStrings = (val, acc = []) => {
      if (typeof val === 'string') acc.push(val);
      else if (val && typeof val === 'object') {
        for (const v of Object.values(val)) collectStrings(v, acc);
      }
      // functions are exercised separately; skip here
      return acc;
    };
    const allStrings = collectStrings(endpoints);
    expect(allStrings.length).toBeGreaterThan(0);
    for (const path of allStrings) {
      expect(path.startsWith('/platform')).toBe(true);
    }
  });
});
