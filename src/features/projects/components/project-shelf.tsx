import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, CloudOff, FolderPlus, Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/features/auth/auth-context";
import { useProjects } from "@/features/projects/projects-context";
import { Tool } from "@/components/workshop/Tool";
import type { QRConfig } from "@/lib/qr-engine";
import type { FrameConfig } from "@/lib/types";
import { useI18n } from "@/shared/i18n/i18n";

interface ProjectShelfProps {
  config: QRConfig;
  frame: FrameConfig;
}

/**
 * Where the design on the bench meets the account.
 *
 * Saving is otherwise invisible — the studio pushes the open project on a
 * timer — so this is the one place that says which project is open, whether it
 * is saved, and how to start a separate one.
 */
export function ProjectShelf({ config, frame }: ProjectShelfProps) {
  const { t } = useI18n();
  const { signedIn } = useAuth();
  const {
    activeProject,
    activeProjectId,
    create,
    saving,
    conflict,
    forceSaveActive,
    lastSync,
    open,
  } = useProjects();

  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  if (!signedIn) {
    return (
      <div className="sheet-sunk space-y-2.5 p-3">
        <p className="text-[0.8rem] leading-snug text-ink-mid">{t.projects.signInToSave}</p>
        <Link to="/login" className="tool tool-wide w-full px-3">
          <LogIn className="h-4 w-4" />
          {t.auth.signIn}
        </Link>
      </div>
    );
  }

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed || busy) return;

    setBusy(true);
    try {
      await create(trimmed, { config, frame });
      setName("");
      toast.success(t.projects.savedJustNow);
    } catch {
      toast.error(t.projects.saveFailed);
    } finally {
      setBusy(false);
    }
  }

  async function handleKeepMine() {
    setBusy(true);
    try {
      await forceSaveActive({ config, frame });
      toast.success(t.projects.savedJustNow);
    } catch {
      toast.error(t.projects.saveFailed);
    } finally {
      setBusy(false);
    }
  }

  async function handleTakeTheirs() {
    if (activeProjectId === null) return;
    setBusy(true);
    try {
      // `open` rewrites the local link and returns the stored document; the
      // studio picks it up on the next load of the bench.
      await open(activeProjectId);
      toast.success(t.projects.savedJustNow);
      window.location.assign("/");
    } catch {
      toast.error(t.projects.openFailed);
    } finally {
      setBusy(false);
    }
  }

  const unsaved = lastSync?.kind === "unsaved" && activeProjectId === null;

  return (
    <div className="space-y-3">
      {/*
        Work that belongs to no project. Signing in used to create one silently,
        which filled the rack with throwaway designs — so it asks instead, and
        says plainly that nothing is lost in the meantime.
      */}
      {unsaved && (
        <div className="sheet-sunk space-y-1 p-3">
          <p className="text-[0.82rem] font-semibold text-ink">{t.projects.unsavedTitle}</p>
          <p className="text-[11px] leading-snug text-ink-mid">{t.projects.unsavedHint}</p>
        </div>
      )}

      {/* Which project this design belongs to, and whether it is safe. */}
      <div className="sheet-sunk flex items-center gap-2.5 p-3">
        <div className="min-w-0 flex-1">
          <p className="spec">{t.projects.activeProject}</p>
          <p className="mt-0.5 truncate text-[0.85rem] font-medium text-ink">
            {activeProject?.name ?? (activeProjectId !== null ? "—" : t.projects.empty)}
          </p>
        </div>
        {activeProjectId !== null && (
          <span className="shrink-0 text-[11px] text-ink-faint" aria-live="polite">
            {saving ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {t.projects.saving}
              </span>
            ) : conflict ? (
              <CloudOff className="h-4 w-4 text-destructive" />
            ) : (
              <span className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" />
                {t.projects.savedJustNow}
              </span>
            )}
          </span>
        )}
      </div>

      {/*
        A conflict is never resolved silently. Both versions still exist at this
        point: one on this device, one on the server.
      */}
      {conflict && (
        <div
          className="space-y-2 rounded-[3px] p-3"
          style={{ background: "color-mix(in srgb, hsl(var(--destructive)) 12%, transparent)" }}
          role="alert"
        >
          <p className="text-[0.8rem] font-semibold" style={{ color: "hsl(var(--destructive))" }}>
            {t.projects.conflictTitle}
          </p>
          <p className="text-[11px] leading-snug text-ink-mid">{t.projects.conflictHint}</p>
          <div className="flex flex-wrap gap-1.5">
            <Tool onClick={() => void handleKeepMine()} disabled={busy}>
              {t.projects.keepMine}
            </Tool>
            <Tool onClick={() => void handleTakeTheirs()} disabled={busy}>
              {t.projects.takeTheirs}
            </Tool>
          </div>
        </div>
      )}

      {/* Start a separate project from whatever is on the bench right now. */}
      <div className="space-y-2">
        <label htmlFor="project-name" className="spec block">
          {t.projects.saveCurrent}
        </label>
        <div className="flex gap-1.5">
          <input
            id="project-name"
            className="field"
            value={name}
            placeholder={t.projects.namePlaceholder}
            disabled={busy}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void handleCreate();
            }}
          />
          <Tool
            onClick={() => void handleCreate()}
            disabled={busy || name.trim().length === 0}
            aria-label={t.projects.newProject}
            className="shrink-0 px-3"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderPlus className="h-4 w-4" />}
          </Tool>
        </div>
      </div>

      <Link to="/profile" className="tool tool-wide w-full px-3">
        {t.auth.myProjects}
      </Link>
    </div>
  );
}
