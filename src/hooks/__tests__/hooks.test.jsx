import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

// Mock the axios api client so no real HTTP happens.
vi.mock('../../api/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
  forceLogout: vi.fn(),
}));

import api from '../../api/axios';
import { useFetch } from '../useFetch';

describe('useFetch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches immediately, exposes loading then data, unwrapping res.data.data', async () => {
    api.get.mockResolvedValueOnce({ data: { data: [{ id: 1 }, { id: 2 }] } });

    const { result } = renderHook(() => useFetch('/things'));

    // immediate: true -> starts loading right away
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual([{ id: 1 }, { id: 2 }]);
    expect(result.current.error).toBeNull();
    expect(api.get).toHaveBeenCalledTimes(1);
    expect(api.get).toHaveBeenCalledWith('/things', { params: {} });
  });

  it('falls back to res.data when res.data.data is absent', async () => {
    api.get.mockResolvedValueOnce({ data: { id: 42, name: 'flat' } });

    const { result } = renderHook(() => useFetch('/flat'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ id: 42, name: 'flat' });
  });

  it('passes options.params through to api.get', async () => {
    api.get.mockResolvedValueOnce({ data: { data: [] } });

    renderHook(() => useFetch('/search', { params: { q: 'abc', page: 2 } }));

    await waitFor(() =>
      expect(api.get).toHaveBeenCalledWith('/search', { params: { q: 'abc', page: 2 } })
    );
  });

  it('captures error message from err.response.data.message', async () => {
    api.get.mockRejectedValueOnce({ response: { data: { message: 'Boom from server' } } });

    // Use immediate: false + a caught refetch so the rethrow is handled
    // (the immediate-effect path rethrows with no catch -> unhandled rejection).
    const { result } = renderHook(() => useFetch('/boom', { immediate: false }));

    await act(async () => {
      await result.current.refetch().catch(() => {});
    });

    expect(result.current.error).toBe('Boom from server');
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('falls back to err.message, then to default message', async () => {
    api.get.mockRejectedValueOnce({ message: 'network down' });
    const { result: r1 } = renderHook(() => useFetch('/e1', { immediate: false }));
    await act(async () => {
      await r1.current.refetch().catch(() => {});
    });
    expect(r1.current.error).toBe('network down');

    api.get.mockRejectedValueOnce({});
    const { result: r2 } = renderHook(() => useFetch('/e2', { immediate: false }));
    await act(async () => {
      await r2.current.refetch().catch(() => {});
    });
    expect(r2.current.error).toBe('Something went wrong');
  });

  it('does not fetch when immediate is false, and refetch triggers a call', async () => {
    api.get.mockResolvedValue({ data: { data: 'lazy-result' } });

    const { result } = renderHook(() => useFetch('/lazy', { immediate: false }));

    // immediate: false -> loading starts false and no call made
    expect(result.current.loading).toBe(false);
    expect(api.get).not.toHaveBeenCalled();

    let returned;
    await act(async () => {
      returned = await result.current.refetch();
    });

    expect(returned).toBe('lazy-result');
    expect(result.current.data).toBe('lazy-result');
    expect(api.get).toHaveBeenCalledTimes(1);
  });

  it('refetch accepts override params used in place of options.params', async () => {
    api.get.mockResolvedValue({ data: { data: 'ok' } });

    const { result } = renderHook(() =>
      useFetch('/o', { immediate: false, params: { base: 1 } })
    );

    await act(async () => {
      await result.current.refetch({ override: true });
    });

    expect(api.get).toHaveBeenCalledWith('/o', { params: { override: true } });
  });

  it('refetch rethrows on failure so callers can catch', async () => {
    const failure = { response: { data: { message: 'nope' } } };
    api.get.mockRejectedValueOnce(failure);

    const { result } = renderHook(() => useFetch('/x', { immediate: false }));

    let caught;
    await act(async () => {
      try {
        await result.current.refetch();
      } catch (e) {
        caught = e;
      }
    });

    expect(caught).toBe(failure);
    expect(result.current.error).toBe('nope');
  });

  it('setData lets callers patch the cached data', async () => {
    api.get.mockResolvedValueOnce({ data: { data: ['a'] } });

    const { result } = renderHook(() => useFetch('/patchable'));
    await waitFor(() => expect(result.current.data).toEqual(['a']));

    act(() => {
      result.current.setData(['a', 'b']);
    });

    expect(result.current.data).toEqual(['a', 'b']);
  });

  it('does not auto-fetch when url is falsy even if immediate is true', async () => {
    renderHook(() => useFetch(''));
    // give effects a chance to flush
    await Promise.resolve();
    expect(api.get).not.toHaveBeenCalled();
  });
});
