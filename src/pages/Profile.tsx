import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FolderOpen, Loader2, Pencil, Trash2, UserRound } from "lucide-react";

import { useAuth } from "@/features/auth/auth-context";
import { saveDesignLocally } from "@/features/designer/services/design-file";
import { useProjects } from "@/features/projects/projects-context";
import { Stamp } from "@/components/workshop/Stamp";
import { Tool } from "@/components/workshop/Tool";
import { useI18n } from "@/shared/i18n/i18n";
import type { ProjectSummary } from "@/features/projects/api/projects-api";

/**
 * The account drawer: who is signed in, and every design they have saved.
 *
 * Opening a project hands its document to the studio, so this page never edits
 * a design itself — it only decides which one is on the bench.
 */
const Profile = () => {
  const { locale, t } = useI18n();
  const { signedIn, loading: authLoading, user } = useAuth();
  const { projects, loading, activeProjectId, open, rename, remove, refresh, closeActive } = useProjects();
  const navigate = useNavigate();

  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [draftName, setDraftName] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !signedIn) navigate("/login", { replace: true });
  }, [authLoading, navigate, signedIn]);

  useEffect(() => {
    if (signedIn) void refresh();
  }, [refresh, signedIn]);

  function formatDate(value: string | null): string {
    if (!value) return "—";
    try {
      return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value));
    } catch {
      return value;
    }
  }

  async function handleOpen(project: ProjectSummary) {
    setBusyId(project.id);
    setError(null);
    try {
      const payload = await open(project.id);
      // The studio reads its starting design from local storage, so the opened
      // document is written there before handing over.
      saveDesignLocally(payload.config, payload.frame);
      navigate("/", { replace: true });
    } catch {
      setError(t.projects.openFailed);
    } finally {
      setBusyId(null);
    }
  }

  async function handleRename(id: number) {
    const name = draftName.trim();
    if (!name) return;
    setBusyId(id);
    setError(null);
    try {
      await rename(id, name);
      setRenamingId(null);
    } catch {
      setError(t.projects.saveFailed);
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemove(id: number) {
    if (!window.confirm(t.projects.removeConfirm)) return;
    setBusyId(id);
    setError(null);
    try {
      await remove(id);
    } catch {
      setError(t.projects.saveFailed);
    } finally {
      setBusyId(null);
    }
  }

  if (authLoading || !signedIn) return null;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      {/* The account plate. */}
      <div className="sheet tex-grain p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="plate-title letterpress text-[1.6rem] leading-none">{t.projects.accountTitle}</h1>
            <p className="mt-2 text-sm text-ink-mid">{t.projects.accountSubtitle}</p>
          </div>
          <span
            className="grid h-12 w-12 shrink-0 place-items-center rounded-[3px] bg-ink text-paper"
            aria-hidden
          >
            <UserRound className="h-6 w-6" />
          </span>
        </div>

        <hr className="perf my-5" />

        <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
          <div>
            <dt className="spec">{t.auth.name}</dt>
            <dd className="truncate text-sm font-medium text-ink">{user?.name}</dd>
          </div>
          <div>
            <dt className="spec">{t.auth.email}</dt>
            <dd className="truncate font-mono text-[0.8rem] text-ink">{user?.email}</dd>
          </div>
          <div>
            <dt className="spec">{t.projects.memberSince}</dt>
            <dd className="font-mono text-[0.8rem] text-ink">{formatDate(user?.createdAt ?? null)}</dd>
          </div>
        </dl>
      </div>

      {/* The rack of saved designs. */}
      <div className="mt-6 flex items-end justify-between gap-3">
        <h2 className="plate-title text-[1.2rem] leading-none">{t.projects.title}</h2>
        <Link to="/" className="tool tool-wide px-3">
          <FolderOpen className="h-4 w-4" />
          {t.projects.newProject}
        </Link>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-[3px] p-2.5 text-[0.8rem]"
          style={{
            color: "hsl(var(--destructive))",
            background: "color-mix(in srgb, hsl(var(--destructive)) 12%, transparent)",
          }}
        >
          {error}
        </p>
      )}

      {loading && projects.length === 0 ? (
        <p className="mt-6 flex items-center gap-2 text-sm text-ink-mid">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t.projects.loading}
        </p>
      ) : projects.length === 0 ? (
        <div className="sheet-sunk mt-4 p-6 text-center">
          <p className="text-sm font-medium text-ink">{t.projects.empty}</p>
          <p className="mt-1 text-[0.8rem] text-ink-mid">{t.projects.emptyHint}</p>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {projects.map((project) => {
            const active = project.id === activeProjectId;
            const swatch =
              project.preview.colorMode === "gradient" && project.preview.color2
                ? `linear-gradient(135deg, ${project.preview.color1 ?? "#000"}, ${project.preview.color2})`
                : project.preview.color1 ?? "#000";

            return (
              <li
                key={project.id}
                className="sheet flex items-stretch gap-0 overflow-hidden"
                style={
                  active
                    ? { boxShadow: "0 0 0 2px hsl(var(--press-red)) inset" }
                    : undefined
                }
              >
                {/* Ink stripe: the design's own colour, as on the preset chips. */}
                <span className="w-2.5 shrink-0" style={{ background: swatch }} aria-hidden />

                <div className="min-w-0 flex-1 p-3">
                  {renamingId === project.id ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        className="field max-w-xs flex-1"
                        value={draftName}
                        autoFocus
                        onChange={(event) => setDraftName(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") void handleRename(project.id);
                          if (event.key === "Escape") setRenamingId(null);
                        }}
                        aria-label={t.projects.projectName}
                      />
                      <Tool onClick={() => void handleRename(project.id)} disabled={busyId === project.id}>
                        {t.projects.save}
                      </Tool>
                      <Tool onClick={() => setRenamingId(null)}>{t.projects.cancel}</Tool>
                    </div>
                  ) : (
                    <>
                      <p className="truncate text-sm font-semibold text-ink">{project.name}</p>
                      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-faint">
                        {project.dataType ?? "—"}
                        {project.preview.hasLogo && <> · {t.projects.withLogo}</>}
                        {active && <> · {t.projects.activeProject}</>}
                      </p>
                      <p className="mt-1 text-[11px] text-ink-mid">
                        {t.projects.lastEdited}: {formatDate(project.updatedAt)}
                      </p>
                    </>
                  )}
                </div>

                {renamingId !== project.id && (
                  <div className="flex shrink-0 items-center gap-1.5 p-3">
                    {busyId === project.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-ink-faint" />
                    ) : (
                      <>
                        <Tool onClick={() => void handleOpen(project)} className="px-3">
                          {t.projects.open}
                        </Tool>
                        <Tool
                          onClick={() => {
                            setRenamingId(project.id);
                            setDraftName(project.name);
                          }}
                          aria-label={t.projects.rename}
                          className="px-2.5 py-2"
                        >
                          <Pencil className="h-4 w-4" />
                        </Tool>
                        <Tool
                          onClick={() => void handleRemove(project.id)}
                          aria-label={t.projects.remove}
                          className="px-2.5 py-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Tool>
                      </>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {activeProjectId !== null && (
        <div className="mt-5 flex justify-center">
          <Stamp onClick={closeActive}>{t.projects.closeProject}</Stamp>
        </div>
      )}
    </div>
  );
};

export default Profile;
