import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { trackProductEvent } from "@/features/analytics/services/product-events";
import { useAuth } from "@/features/auth/auth-context";
import {
  createProject,
  deleteProject,
  listProjects,
  openProject,
  saveProject,
  type Project,
  type ProjectPayload,
  type ProjectSummary,
} from "@/features/projects/api/projects-api";
import { fingerprintDesign } from "@/features/projects/services/design-fingerprint";
import { clearSyncState, readSyncState, writeSyncState } from "@/features/projects/services/sync-state";
import { syncDesignOnSignIn, type SyncOutcome } from "@/features/projects/services/sync-design";
import { ApiError } from "@/shared/api/console-client";

interface ProjectsContextValue {
  projects: ProjectSummary[];
  loading: boolean;
  /** The project the studio is currently editing, if any. */
  activeProjectId: number | null;
  activeProject: ProjectSummary | null;
  /** Last sync result, so the UI can say what happened on sign-in. */
  lastSync: SyncOutcome | null;
  acknowledgeSync: () => void;
  refresh: () => Promise<void>;
  open: (id: number) => Promise<ProjectPayload>;
  create: (name: string, payload: ProjectPayload) => Promise<Project>;
  rename: (id: number, name: string) => Promise<void>;
  remove: (id: number) => Promise<void>;
  /** Detach from the active project without deleting it. */
  closeActive: () => void;
  /** Called by the studio autosave. Debounced; a no-op when signed out. */
  recordDesign: (payload: ProjectPayload) => void;
  /** Resolve a conflict by overwriting whatever the server holds. */
  forceSaveActive: (payload: ProjectPayload) => Promise<void>;
  /** True while a push is in flight. */
  saving: boolean;
  /** Set when the active project changed elsewhere and needs a decision. */
  conflict: boolean;
}

const ProjectsContext = createContext<ProjectsContextValue | null>(null);

/*
  Autosave interval. A design carries its logo as an embedded data URL, so a
  push can be close to a megabyte — at a couple of seconds per edit that was
  saturating the connection and making the studio feel slow. Saves are rare
  events from the user's point of view; the wait costs nothing and the local
  autosave already holds the work in the meantime.
*/
const PUSH_DELAY_MS = 10000;

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const { token, user, signedIn } = useAuth();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<number | null>(() => readSyncState().projectId);
  const [lastSync, setLastSync] = useState<SyncOutcome | null>(null);

  // The newest design the studio has handed over, and the timer that pushes it.
  const pendingRef = useRef<ProjectPayload | null>(null);
  const timerRef = useRef<number | null>(null);
  const syncedForRef = useRef<number | null>(null);
  // A push in flight blocks the next one, so a slow save cannot pile up.
  const inFlightRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      setProjects(await listProjects(token));
    } catch {
      // A failed list is not worth an error banner over the studio; the page
      // that shows projects reports its own empty state.
    } finally {
      setLoading(false);
    }
  }, [token]);

  /*
    Sign-in reconciliation. It runs once per account per session: the studio
    hands over whatever is on the bench, and `syncDesignOnSignIn` decides
    whether that is new work, an edit to a saved project, or nothing at all.
  */
  useEffect(() => {
    if (!signedIn || !token || !user) {
      syncedForRef.current = null;
      return;
    }
    if (syncedForRef.current === user.id) return;
    syncedForRef.current = user.id;

    let cancelled = false;
    void (async () => {
      const payload = pendingRef.current;
      if (payload) {
        try {
          const outcome = await syncDesignOnSignIn({ token, userId: user.id, payload });
          if (cancelled) return;
          setLastSync(outcome);
          if (outcome.kind === "created" || outcome.kind === "updated") {
            setActiveProjectId(outcome.project.id);
          } else if (outcome.kind === "unchanged" || outcome.kind === "conflict") {
            setActiveProjectId(outcome.projectId);
            if (outcome.kind === "conflict") setConflict(true);
          }
        } catch {
          // Surfaced by the list below; the local design is untouched either way.
        }
      }
      if (!cancelled) await refresh();
    })();

    return () => {
      cancelled = true;
    };
  }, [refresh, signedIn, token, user]);

  // Signing out drops the link so the next account starts clean.
  useEffect(() => {
    if (signedIn) return;
    setProjects([]);
    setActiveProjectId(null);
    setConflict(false);
    setLastSync(null);
    clearSyncState();
  }, [signedIn]);

  /*
    Drops a push that is still waiting on the timer. It must run every time the
    active project changes: the waiting push carries the previous project's
    design, and firing it after the switch wrote that design into the new one.
  */
  const cancelPending = useCallback(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    pendingRef.current = null;
  }, []);

  const pushNow = useCallback(
    async (payload: ProjectPayload, force: boolean, targetId?: number) => {
      if (!token || !user) return;
      const state = readSyncState();
      const id = state.ownerUserId === user.id ? state.projectId : null;
      if (id === null) return;
      // The design was recorded for another project; never cross-write it.
      if (targetId !== undefined && targetId !== id) return;

      const fingerprint = fingerprintDesign(payload.config, payload.frame);
      if (!force && state.syncedFingerprint === fingerprint) return;
      if (inFlightRef.current) return;

      inFlightRef.current = true;
      setSaving(true);
      try {
        const project = await saveProject(token, id, {
          payload,
          expectedUpdatedAt: force ? null : state.syncedUpdatedAt,
        });
        writeSyncState({
          projectId: project.id,
          syncedFingerprint: fingerprint,
          syncedUpdatedAt: project.updatedAt,
          ownerUserId: user.id,
        });
        setConflict(false);
        setProjects((current) =>
          current.map((item) =>
            item.id === project.id ? { ...item, name: project.name, updatedAt: project.updatedAt } : item,
          ),
        );
      } catch (error: unknown) {
        if (error instanceof ApiError && error.code === "PROJECT_CONFLICT") {
          // Stop pushing and let the user decide; nothing was overwritten.
          setConflict(true);
        }
        // Offline or anything else: the local autosave already holds the work.
      } finally {
        inFlightRef.current = false;
        setSaving(false);
      }
    },
    [token, user],
  );

  const recordDesign = useCallback(
    (payload: ProjectPayload) => {
      pendingRef.current = payload;
      if (!signedIn || activeProjectId === null || conflict) return;

      const targetId = activeProjectId;
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        void pushNow(payload, false, targetId);
      }, PUSH_DELAY_MS);
    },
    [activeProjectId, conflict, pushNow, signedIn],
  );

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  const open = useCallback(
    async (id: number): Promise<ProjectPayload> => {
      if (!token || !user) throw new ApiError("unauthenticated", 401);
      cancelPending();
      const project = await openProject(token, id);
      writeSyncState({
        projectId: project.id,
        syncedFingerprint: fingerprintDesign(project.payload.config, project.payload.frame),
        syncedUpdatedAt: project.updatedAt,
        ownerUserId: user.id,
      });
      setActiveProjectId(project.id);
      setConflict(false);
      trackProductEvent("project_opened", { dataType: project.dataType ?? "unknown" });
      return project.payload;
    },
    [cancelPending, token, user],
  );

  const create = useCallback(
    async (name: string, payload: ProjectPayload): Promise<Project> => {
      if (!token || !user) throw new ApiError("unauthenticated", 401);
      cancelPending();
      const project = await createProject(token, { name, payload });
      writeSyncState({
        projectId: project.id,
        syncedFingerprint: fingerprintDesign(payload.config, payload.frame),
        syncedUpdatedAt: project.updatedAt,
        ownerUserId: user.id,
      });
      setActiveProjectId(project.id);
      setConflict(false);
      trackProductEvent("project_created", { dataType: project.dataType ?? "unknown" });
      await refresh();
      return project;
    },
    [cancelPending, refresh, token, user],
  );

  const rename = useCallback(
    async (id: number, name: string) => {
      if (!token) throw new ApiError("unauthenticated", 401);
      const project = await saveProject(token, id, { name });
      setProjects((current) =>
        current.map((item) => (item.id === id ? { ...item, name: project.name } : item)),
      );
    },
    [token],
  );

  const remove = useCallback(
    async (id: number) => {
      if (!token) throw new ApiError("unauthenticated", 401);
      await deleteProject(token, id);
      setProjects((current) => current.filter((item) => item.id !== id));
      if (activeProjectId === id) {
        cancelPending();
        setActiveProjectId(null);
        clearSyncState();
      }
    },
    [activeProjectId, cancelPending, token],
  );

  const closeActive = useCallback(() => {
    cancelPending();
    setActiveProjectId(null);
    setConflict(false);
    clearSyncState();
  }, [cancelPending]);

  const forceSaveActive = useCallback(
    async (payload: ProjectPayload) => {
      await pushNow(payload, true);
    },
    [pushNow],
  );

  const acknowledgeSync = useCallback(() => setLastSync(null), []);

  const activeProject = useMemo(
    () => projects.find((item) => item.id === activeProjectId) ?? null,
    [activeProjectId, projects],
  );

  const value = useMemo<ProjectsContextValue>(
    () => ({
      projects,
      loading,
      activeProjectId,
      activeProject,
      lastSync,
      acknowledgeSync,
      refresh,
      open,
      create,
      rename,
      remove,
      closeActive,
      recordDesign,
      forceSaveActive,
      saving,
      conflict,
    }),
    [
      acknowledgeSync,
      activeProject,
      activeProjectId,
      closeActive,
      conflict,
      create,
      forceSaveActive,
      lastSync,
      loading,
      open,
      projects,
      recordDesign,
      refresh,
      remove,
      rename,
      saving,
    ],
  );

  return <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>;
}

export function useProjects(): ProjectsContextValue {
  const context = useContext(ProjectsContext);
  if (!context) throw new Error("useProjects must be used inside ProjectsProvider");
  return context;
}
