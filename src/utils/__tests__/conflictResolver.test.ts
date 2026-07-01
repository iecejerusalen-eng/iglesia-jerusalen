import { describe, it, expect } from 'vitest';
import { resolveConflict } from '../conflictResolver';

describe('conflictResolver', () => {
  it('local wins if updated_at is more recent and versions are equal', () => {
    const local = { id: '1', version: 1, updated_at: '2026-07-01T10:00:00Z', name: 'Local' };
    const remote = { id: '1', version: 1, updated_at: '2026-07-01T09:00:00Z', name: 'Remote' };
    
    const result = resolveConflict(local, remote);
    
    expect(result.winner).toBe('local');
    expect(result.resolvedRecord).toEqual(local);
  });

  it('remote wins if updated_at is more recent and versions are equal', () => {
    const local = { id: '1', version: 1, updated_at: '2026-07-01T09:00:00Z', name: 'Local' };
    const remote = { id: '1', version: 1, updated_at: '2026-07-01T10:00:00Z', name: 'Remote' };
    
    const result = resolveConflict(local, remote);
    
    expect(result.winner).toBe('remote');
    expect(result.resolvedRecord).toEqual(remote);
  });

  it('local wins if local version is higher', () => {
    const local = { id: '1', version: 2, updated_at: '2026-07-01T09:00:00Z', name: 'Local' };
    const remote = { id: '1', version: 1, updated_at: '2026-07-01T10:00:00Z', name: 'Remote' };
    
    const result = resolveConflict(local, remote);
    
    expect(result.winner).toBe('local');
    expect(result.resolvedRecord).toEqual(local);
  });

  it('remote wins if remote version is higher', () => {
    const local = { id: '1', version: 1, updated_at: '2026-07-01T10:00:00Z', name: 'Local' };
    const remote = { id: '1', version: 2, updated_at: '2026-07-01T09:00:00Z', name: 'Remote' };
    
    const result = resolveConflict(local, remote);
    
    expect(result.winner).toBe('remote');
    expect(result.resolvedRecord).toEqual(remote);
  });
});
