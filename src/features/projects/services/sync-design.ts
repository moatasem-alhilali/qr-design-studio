import { saveProject, type Project, type ProjectPayload } from "@/features/projects/api/projects-api";
import { fingerprintDesign, isPristineDesign } from "@/features/projects/services/design-fingerprint";
import { readSyncState, writeSyncState, type SyncState } from "@/features/projects/services/sync-state";
import { ApiError } from "@/shared/api/console-client";

/**
 * Reconciling the design on the bench with the account, on sign-in.
 *
 * Two rules, in this order:
 *
 * 1. Local work is never discarded.
 * 2. Nothing is created behind the user's back. Signing in used to mint a
 *    project called "Local design" on its own, which produced a rack of
 *    near-identical throwaway projects nobody asked for. Unlinked work is now
 *    *reported* as unsaved and waits for a name.
 *
 * Automatic writes happen only into a project the design already belongs to.
 */

export type SyncOutcome =
  /** Nothing was worth saving — the design is still the untouched default. */
  | { kind: "pristine" }
  /**
   * There is real local work that belongs to no project. Nothing was written;
   * the UI offers to save it, and it stays on this device until the user does.
   */
  | { kind: "unsaved" }
  /** Local work had no home and was explicitly given one. */
  | { kind: "created"; project: Project }
  /** Local edits were pushed into the project they belong to. */
  | { kind: "updated"; project: Project }
  /** The design already matches what is stored; nothing to do. */
  | { kind: "unchanged"; projectId: number }
  /**
   * The project changed elsewhere while this design was edited offline. Nothing
   * has been written; the caller has to ask the user which side wins.
   */
  | { kind: "conflict"; projectId: number }
  /** The API could not be reached. The design stays local and intact. */
  | { kind: "offline" };

export interface SyncInput {
  token: string;
  userId: number;
  payload: ProjectPayload;
}

function link(state: Partial<SyncState>): void {
  writeSyncState({
    projectId: state.projectId ?? null,
    syncedFingerprint: state.syncedFingerprint ?? null,
    syncedUpdatedAt: state.syncedUpdatedAt ?? null,
    ownerUserId: state.ownerUserId ?? null,
  });
}

/**
 * Decides what the design on the bench means for this account, and carries it
 * out. Returns what happened so the UI can say so plainly.
 */
export async function syncDesignOnSignIn(input: SyncInput): Promise<SyncOutcome> {
  const { config, frame } = input.payload;

  if (isPristineDesign(config, frame)) {
    // Nothing the user made. Drop any stale link and stay quiet.
    link({ ownerUserId: input.userId });
    return { kind: "pristine" };
  }

  const fingerprint = fingerprintDesign(config, frame);
  const state = readSyncState();
  // A link belonging to another account says nothing about this one.
  const linkedId = state.ownerUserId === input.userId ? state.projectId : null;

  if (linkedId === null) {
    // Real work, no home. Say so and let the user name it; creating one here
    // is what produced duplicate "Local design" projects on every sign-in.
    link({ ownerUserId: input.userId });
    return { kind: "unsaved" };
  }

  try {
    if (state.syncedFingerprint === fingerprint) {
      // Same bytes as the last push; re-uploading would only bump a timestamp.
      return { kind: "unchanged", projectId: linkedId };
    }

    const project = await saveProject(input.token, linkedId, {
      payload: input.payload,
      expectedUpdatedAt: state.syncedUpdatedAt,
    });
    link({
      projectId: project.id,
      syncedFingerprint: fingerprint,
      syncedUpdatedAt: project.updatedAt,
      ownerUserId: input.userId,
    });
    return { kind: "updated", project };
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      if (error.isOffline) return { kind: "offline" };

      if (error.code === "PROJECT_CONFLICT" && linkedId !== null) {
        return { kind: "conflict", projectId: linkedId };
      }

      /*
        The linked project is gone — deleted from another device, or the link
        is stale. The design itself is still on this device and still matters,
        so the link is dropped and it goes back to being unsaved work rather
        than silently reappearing as a new project.
      */
      if (error.status === 404) {
        link({ ownerUserId: input.userId });
        return { kind: "unsaved" };
      }
    }

    throw error;
  }
}
