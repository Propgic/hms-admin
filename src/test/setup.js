// Global test setup, loaded by vitest before every test file (see
// vite.config.js → test.setupFiles).
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

// ── Web Storage polyfill ──────────────────────────────────────────────────
// Node 25 ships an experimental built-in `localStorage`/`sessionStorage` that
// lacks a working Web Storage API (no `.clear`) and shadows jsdom's, so app
// code calling `localStorage.getItem(...)` blows up in tests. Rather than
// depend on host-runtime behaviour, install a simple in-memory Storage on both
// globalThis and window. Deterministic and fully isolated per run.
class MemoryStorage {
  constructor() { this._m = new Map(); }
  get length() { return this._m.size; }
  clear() { this._m.clear(); }
  getItem(k) { return this._m.has(String(k)) ? this._m.get(String(k)) : null; }
  setItem(k, v) { this._m.set(String(k), String(v)); }
  removeItem(k) { this._m.delete(String(k)); }
  key(i) { return Array.from(this._m.keys())[i] ?? null; }
}

const localStorageImpl = new MemoryStorage();
const sessionStorageImpl = new MemoryStorage();

function installStorage(target) {
  if (!target) return;
  try {
    Object.defineProperty(target, 'localStorage', {
      value: localStorageImpl, writable: true, configurable: true,
    });
    Object.defineProperty(target, 'sessionStorage', {
      value: sessionStorageImpl, writable: true, configurable: true,
    });
  } catch { /* property non-configurable on this target — skip */ }
}
installStorage(globalThis);
if (typeof window !== 'undefined') installStorage(window);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorageImpl.clear();
  sessionStorageImpl.clear();
});

beforeEach(() => {
  localStorageImpl.clear();
  sessionStorageImpl.clear();
});

// jsdom doesn't implement matchMedia; theme/responsive code reads it on mount.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

// react-hot-toast is pulled in transitively by the axios client. Stub it so
// tests don't need a toast container mounted.
vi.mock('react-hot-toast', () => ({
  default: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  }),
}));
