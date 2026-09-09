import { requestConsole } from "@/shared/api/console-client";
import type { QRConfig } from "@/lib/qr-engine";
import type { FrameConfig } from "@/lib/types";

/**
 * Typed client for saved designs.
 *
 * The document a project stores is exactly the studio's local job ticket, so
 * opening a project and restoring a local autosave take the same code path.
 */

export interface ProjectPayload {
  config: QRConfig;
  frame: FrameConfig;
}

/** What the list returns: no design document, so a long list stays small. */
export interface ProjectSummary {
  id: number;
  name: string;
  dataType: string | null;
  preview: {
    color1: string | null;
    color2: string | null;
    colorMode: string | null;
    moduleStyle: string | null;
    hasLogo: boolean;
  };
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Project extends Omit<ProjectSummary, "preview"> {
  payload: ProjectPayload;
}

export function listProjects(token: string): Promise<ProjectSummary[]> {
  return requestConsole<ProjectSummary[]>("projects", { method: "GET", token });
}

export function openProject(token: string, id: number): Promise<Project> {
  return requestConsole<Project>(`projects/${id}`, { method: "GET", token });
}

export function createProject(
  token: string,
  input: { name: string; payload: ProjectPayload },
): Promise<Project> {
  return requestConsole<Project>("projects", { method: "POST", token, body: input });
}

export interface UpdateProjectInput {
  name?: string;
  payload?: ProjectPayload;
  /**
   * The version the client edited. The server answers 409 when the stored row
   * has moved on, which is what stops a second device overwriting edits it
   * never loaded. Omit it to save regardless — a deliberate "keep mine".
   */
  expectedUpdatedAt?: string | null;
}

export function saveProject(token: string, id: number, input: UpdateProjectInput): Promise<Project> {
  return requestConsole<Project>(`projects/${id}`, { method: "PUT", token, body: input });
}

export function deleteProject(token: string, id: number): Promise<unknown> {
  return requestConsole<unknown>(`projects/${id}`, { method: "DELETE", token });
}
