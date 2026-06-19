interface VersionedRecord {
  id: string;
  version: number;
  updated_at: string;
  [key: string]: any;
}

export interface ConflictResult<T> {
  winner: 'local' | 'remote' | 'merged';
  resolvedRecord: T;
}

/**
 * Resolves conflict between a local copy and a remote copy of a record.
 * Uses version checking and Last-Write-Wins (LWW) based on updated_at.
 */
export function resolveConflict<T extends VersionedRecord>(
  localRecord: T,
  remoteRecord: T
): ConflictResult<T> {
  // If versions are the same, compare updated_at timestamps (Last-Write-Wins)
  if (localRecord.version === remoteRecord.version) {
    const localTime = new Date(localRecord.updated_at).getTime();
    const remoteTime = new Date(remoteRecord.updated_at).getTime();

    if (localTime >= remoteTime) {
      return { winner: 'local', resolvedRecord: localRecord };
    } else {
      return { winner: 'remote', resolvedRecord: remoteRecord };
    }
  }

  // If local version is higher, local wins
  if (localRecord.version > remoteRecord.version) {
    return { winner: 'local', resolvedRecord: localRecord };
  }

  // Otherwise, server/remote wins
  return { winner: 'remote', resolvedRecord: remoteRecord };
}
