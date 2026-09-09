/**
 * What the studio remembers about the design currently on the bench: which
 * saved project it came from, and what it looked like the last time it was
 * pushed.
 *
 * Without this, signing in could only guess whether the local design is
 * unsaved new work or an already-saved project, and would either duplicate
 * projects on every sign-in or overwrite one it should not have touched.
 */

const SYNC_KEY = "qr_design_studio_sync:v1";

export interface SyncState {
  /** The saved project this design belongs to, if any. */
  projectId: number | null;
  /** Fingerprint at the moment of the last successful push. */
  syncedFingerprint: string | null;
  /** Server timestamp of that push, for the conflict guard. */
  syncedUpdatedAt: string | null;
  /**
   * Which account the link belongs to. A different user signing in on the same
   * browser must not inherit a link into someone else's project.
   */
  ownerUserId: number | null;
}

const EMPTY: SyncState = {
  projectId: null,
  syncedFingerprint: null,
  syncedUpdatedAt: null,
  ownerUserId: null,
};

export function readSyncState(): SyncState {
  try {
    const stored = localStorage.getItem(SYNC_KEY);
    if (!stored) return { ...EMPTY };
    const parsed = JSON.parse(stored) as Partial<SyncState>;
    return {
      projectId: typeof parsed.projectId === "number" ? parsed.projectId : null,
      syncedFingerprint: typeof parsed.syncedFingerprint === "string" ? parsed.syncedFingerprint : null,
      syncedUpdatedAt: typeof parsed.syncedUpdatedAt === "string" ? parsed.syncedUpdatedAt : null,
      ownerUserId: typeof parsed.ownerUserId === "number" ? parsed.ownerUserId : null,
    };
  } catch {
    return { ...EMPTY };
  }
}

export function writeSyncState(state: SyncState): void {
  try {
    localStorage.setItem(SYNC_KEY, JSON.stringify(state));
  } catch {
    // Storage blocked: sync falls back to treating the design as unlinked,
    // which creates a project rather than losing one.
  }
}

export function clearSyncState(): void {
  try {
    localStorage.removeItem(SYNC_KEY);
  } catch {
    // Nothing to do.
  }
}
