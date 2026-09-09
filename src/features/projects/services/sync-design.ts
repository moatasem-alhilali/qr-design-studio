import {
  createProject,
  saveProject,
  type Project,
  type ProjectPayload,
} from "@/features/projects/api/projects-api";
import { fingerprintDesign, isPristineDesign } from "@/features/projects/services/design-fingerprint";
import { readSyncState, writeSyncState, type SyncState } from "@/features/projects/services/sync-state";
import { ApiError } from "@/shared/api/console-client";

/**
 * Reconciling the design on the bench with the account, on sign-in.
 *
 * The rule the whole module is built around: **local work is never discarded**.
 * When in doubt the design becomes a new project, because an extra project is
 * an annoyance while a lost design is the user's afternoon.
 */

export type SyncOutcome =
  /** Nothing was worth saving — the design is still the untouched default. */
  | { kind: "pristine" }
  /** Local work had no home, so it became a project. */
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
  /** Used when local work has to become a new project. */
  fallbackName: string;
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

  try {
    if (linkedId === null) {
      const project = await createProject(input.token, {
        name: input.fallbackName,
        payload: input.payload,
      });
      link({
        projectId: project.id,
        syncedFingerprint: fingerprint,
        syncedUpdatedAt: project.updatedAt,
        ownerUserId: input.userId,
      });
      return { kind: "created", project };
    }

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
        is stale. The local design still exists and still matters, so it gets a
        home of its own rather than being dropped on the floor.
      */
      if (error.status === 404 && linkedId !== null) {
        const project = await createProject(input.token, {
          name: input.fallbackName,
          payload: input.payload,
        });
        link({
          projectId: project.id,
          syncedFingerprint: fingerprint,
          syncedUpdatedAt: project.updatedAt,
          ownerUserId: input.userId,
        });
        return { kind: "created", project };
      }
    }

    throw error;
  }
}
