import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { fromMock, useAuthStoreMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  useAuthStoreMock: vi.fn(),
}));

vi.mock('../../config/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('../../store/useAuthStore', () => ({ useAuthStore: useAuthStoreMock }));
vi.mock('react-router-dom', () => ({ useLocation: () => ({ pathname: '/admin' }) }));

import { useOnboarding } from './useOnboarding';

describe('useOnboarding', () => {
  beforeEach(() => {
    useAuthStoreMock.mockReturnValue({ user: { id: 'user-1' }, role: 'admin' });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('ends loading and exposes a recoverable error when a network request rejects', async () => {
    const networkError = new TypeError('Network unavailable');
    fromMock.mockImplementation(() => {
      const rejected = Promise.reject(networkError);
      const query = {
        select: () => query,
        eq: () => query,
        order: () => query,
        maybeSingle: () => query,
        then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) => rejected.then(resolve, reject),
      };
      return query;
    });

    const { result } = renderHook(() => useOnboarding());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe(networkError);
    expect(result.current.pasos).toEqual([]);
    expect(fromMock).toHaveBeenCalledTimes(3);
  });

  it('does not query Supabase when onboarding is disabled', async () => {
    const { result } = renderHook(() => useOnboarding(false));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBeNull();
    expect(result.current.pasos).toEqual([]);
    expect(fromMock).not.toHaveBeenCalled();
  });
});
