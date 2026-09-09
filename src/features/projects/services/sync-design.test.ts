import { beforeEach, describe, expect, it, vi } from "vitest";

import { defaultConfig } from "@/lib/qr-engine";
import { defaultFrameConfig } from "@/lib/types";
import { fingerprintDesign, isPristineDesign } from "@/features/projects/services/design-fingerprint";
import { readSyncState, writeSyncState } from "@/features/projects/services/sync-state";
import { syncDesignOnSignIn } from "@/features/projects/services/sync-design";
import { ApiError } from "@/shared/api/console-client";
import * as api from "@/features/projects/api/projects-api";

/**
 * Sync is the one place in the studio where a user's work can be destroyed, so
 * these tests are written around that: every branch either saves the local
 * design somewhere, or provably leaves it alone.
 */

vi.mock("@/features/projects/api/projects-api", () => ({
  createProject: vi.fn(),
  saveProject: vi.fn(),
}));

const createProject = vi.mocked(api.createProject);
const saveProject = vi.mocked(api.saveProject);

const edited = {
  config: { ...defaultConfig, data: "https://a-real-edit.example", color1: "#123456" },
  frame: { ...defaultFrameConfig },
};

function project(id: number, updatedAt = "2026-09-09T10:00:00.000Z") {
  return {
    id,
    name: "n",
    dataType: "url",
    payload: edited,
    createdAt: updatedAt,
    updatedAt,
  } as api.Project;
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe("design fingerprint", () => {
  it("is stable across key order", () => {
    const a = fingerprintDesign({ ...defaultConfig }, { ...defaultFrameConfig });
    const reordered = Object.fromEntries(
      Object.entries(defaultConfig).reverse(),
    ) as typeof defaultConfig;
    expect(fingerprintDesign(reordered, { ...defaultFrameConfig })).toBe(a);
  });

  it("changes when the design changes", () => {
    expect(fingerprintDesign(edited.config, edited.frame)).not.toBe(
      fingerprintDesign(defaultConfig, defaultFrameConfig),
    );
  });

  it("recognises an untouched design", () => {
    expect(isPristineDesign(defaultConfig, defaultFrameConfig)).toBe(true);
    expect(isPristineDesign(edited.config, edited.frame)).toBe(false);
  });
});

describe("sync on sign-in", () => {
  const input = { token: "t", userId: 1, fallbackName: "Local design" };

  it("saves nothing when the design was never touched", async () => {
    const outcome = await syncDesignOnSignIn({
      ...input,
      payload: { config: defaultConfig, frame: defaultFrameConfig },
    });

    expect(outcome).toEqual({ kind: "pristine" });
    expect(createProject).not.toHaveBeenCalled();
    expect(saveProject).not.toHaveBeenCalled();
  });

  it("turns unlinked local work into a new project", async () => {
    createProject.mockResolvedValue(project(7));

    const outcome = await syncDesignOnSignIn({ ...input, payload: edited });

    expect(outcome).toMatchObject({ kind: "created" });
    expect(createProject).toHaveBeenCalledWith("t", { name: "Local design", payload: edited });
    // The link is recorded, so the next edit updates instead of duplicating.
    expect(readSyncState()).toMatchObject({ projectId: 7, ownerUserId: 1 });
  });

  it("pushes edits into the project they came from", async () => {
    writeSyncState({
      projectId: 7,
      syncedFingerprint: "stale-fingerprint",
      syncedUpdatedAt: "2026-09-09T09:00:00.000Z",
      ownerUserId: 1,
    });
    saveProject.mockResolvedValue(project(7));

    const outcome = await syncDesignOnSignIn({ ...input, payload: edited });

    expect(outcome).toMatchObject({ kind: "updated" });
    expect(createProject).not.toHaveBeenCalled();
    expect(saveProject).toHaveBeenCalledWith("t", 7, {
      payload: edited,
      expectedUpdatedAt: "2026-09-09T09:00:00.000Z",
    });
  });

  it("writes nothing when the design already matches what was pushed", async () => {
    writeSyncState({
      projectId: 7,
      syncedFingerprint: fingerprintDesign(edited.config, edited.frame),
      syncedUpdatedAt: "2026-09-09T09:00:00.000Z",
      ownerUserId: 1,
    });

    const outcome = await syncDesignOnSignIn({ ...input, payload: edited });

    expect(outcome).toEqual({ kind: "unchanged", projectId: 7 });
    expect(saveProject).not.toHaveBeenCalled();
    expect(createProject).not.toHaveBeenCalled();
  });

  it("ignores a link left behind by a different account", async () => {
    // Two people on one browser: user 2 must not push into user 1's project.
    writeSyncState({
      projectId: 7,
      syncedFingerprint: "whatever",
      syncedUpdatedAt: "2026-09-09T09:00:00.000Z",
      ownerUserId: 1,
    });
    createProject.mockResolvedValue(project(9));

    const outcome = await syncDesignOnSignIn({ ...input, userId: 2, payload: edited });

    expect(outcome).toMatchObject({ kind: "created" });
    expect(saveProject).not.toHaveBeenCalled();
    expect(readSyncState()).toMatchObject({ projectId: 9, ownerUserId: 2 });
  });

  it("reports a conflict without overwriting the other device", async () => {
    writeSyncState({
      projectId: 7,
      syncedFingerprint: "stale",
      syncedUpdatedAt: "2026-09-09T09:00:00.000Z",
      ownerUserId: 1,
    });
    saveProject.mockRejectedValue(new ApiError("conflict", 409, "PROJECT_CONFLICT"));

    const outcome = await syncDesignOnSignIn({ ...input, payload: edited });

    expect(outcome).toEqual({ kind: "conflict", projectId: 7 });
    // The stored link is untouched, so the local design is still recoverable.
    expect(readSyncState()).toMatchObject({ projectId: 7, syncedFingerprint: "stale" });
  });

  it("re-homes the design when its project was deleted elsewhere", async () => {
    writeSyncState({
      projectId: 7,
      syncedFingerprint: "stale",
      syncedUpdatedAt: "2026-09-09T09:00:00.000Z",
      ownerUserId: 1,
    });
    saveProject.mockRejectedValue(new ApiError("gone", 404, "PROJECT_NOT_FOUND"));
    createProject.mockResolvedValue(project(11));

    const outcome = await syncDesignOnSignIn({ ...input, payload: edited });

    expect(outcome).toMatchObject({ kind: "created" });
    expect(createProject).toHaveBeenCalled();
    expect(readSyncState()).toMatchObject({ projectId: 11 });
  });

  it("keeps the local design and the link when the API is unreachable", async () => {
    writeSyncState({
      projectId: 7,
      syncedFingerprint: "stale",
      syncedUpdatedAt: "2026-09-09T09:00:00.000Z",
      ownerUserId: 1,
    });
    saveProject.mockRejectedValue(new ApiError("network", 0));

    const outcome = await syncDesignOnSignIn({ ...input, payload: edited });

    expect(outcome).toEqual({ kind: "offline" });
    expect(readSyncState()).toMatchObject({ projectId: 7, syncedFingerprint: "stale" });
  });
});
