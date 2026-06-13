import { useEffect } from "react";

type ToolInput = Record<string, unknown>;

type WebMcpTool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: {
    readOnlyHint: boolean;
    destructiveHint: boolean;
    idempotentHint: boolean;
    openWorldHint: boolean;
  };
  execute: (input?: ToolInput) => Promise<unknown> | unknown;
};

type ModelContextLike = {
  registerTool?: (tool: WebMcpTool) => void | Promise<void>;
  register?: (tool: WebMcpTool) => void | Promise<void>;
  tools?: {
    register?: (tool: WebMcpTool) => void | Promise<void>;
  };
};

declare global {
  interface Navigator {
    modelContext?: ModelContextLike;
  }

  interface Window {
    __qrDesignStudioWebMcpToolsRegistered?: boolean;
  }
}

const SITE_URL = "https://qr-design-dun.vercel.app";

const readOnlyAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

const publicPages = [
  {
    path: "/",
    title: "QR Designer",
    description: "Create styled static QR codes and barcodes.",
    markdown: "/index.md",
  },
  {
    path: "/templates",
    title: "Templates",
    description: "Browse public QR templates and suggested frames.",
    markdown: "/templates/index.md",
  },
  {
    path: "/batch",
    title: "Batch Generator",
    description: "Generate multiple static QR codes locally from pasted rows or CSV files.",
    markdown: "/batch/index.md",
  },
  {
    path: "/settings",
    title: "Settings And About",
    description: "Current build notes and local generation mode.",
    markdown: "/settings/index.md",
  },
] as const;

function absolute(path: string): string {
  return new URL(path, SITE_URL).toString();
}

function registerTool(modelContext: ModelContextLike, tool: WebMcpTool): void {
  if (modelContext.registerTool) {
    void modelContext.registerTool(tool);
    return;
  }

  if (modelContext.tools?.register) {
    void modelContext.tools.register(tool);
    return;
  }

  if (modelContext.register) {
    void modelContext.register(tool);
  }
}

export function WebMcpTools() {
  useEffect(() => {
    if (window.__qrDesignStudioWebMcpToolsRegistered) return;

    const modelContext = navigator.modelContext;
    if (!modelContext) return;

    const tools: WebMcpTool[] = [
      {
        name: "get_site_guide",
        description: "Return public QR Design Studio guidance, safety rules, and discovery URLs.",
        inputSchema: { type: "object", additionalProperties: false, properties: {} },
        annotations: readOnlyAnnotations,
        execute: () => ({
          site: {
            name: "QR Design Studio",
            url: SITE_URL,
            description: "Static browser-based QR and barcode design studio.",
          },
          discovery: {
            llms: absolute("/llms.txt"),
            apiCatalog: absolute("/.well-known/api-catalog"),
            openApi: absolute("/openapi.json"),
            agentSkills: absolute("/.well-known/agent-skills/index.json"),
            mcpServerCard: absolute("/.well-known/mcp/server-card.json"),
          },
          safety: [
            "Read public pages and discovery files only by default.",
            "Do not upload logos, import CSV files, trigger downloads, clear rows, or mutate design settings without explicit user action.",
            "Do not collect QR payloads, CSV contents, filenames, WiFi passwords, vCard fields, secrets, tokens, or private business data.",
          ],
        }),
      },
      {
        name: "list_public_pages",
        description: "List public pages and Markdown fallbacks safe for agent discovery.",
        inputSchema: { type: "object", additionalProperties: false, properties: {} },
        annotations: readOnlyAnnotations,
        execute: () => ({
          pages: publicPages.map((page) => ({
            ...page,
            url: absolute(page.path),
            markdownUrl: absolute(page.markdown),
          })),
        }),
      },
      {
        name: "get_markdown_page",
        description: "Fetch Markdown for a safe public QR Design Studio page.",
        inputSchema: {
          type: "object",
          additionalProperties: false,
          required: ["path"],
          properties: {
            path: {
              type: "string",
              description: "Use /, /templates, /batch, /settings, or their /index.md fallback paths.",
            },
          },
        },
        annotations: readOnlyAnnotations,
        execute: async (input) => {
          const rawPath = typeof input?.path === "string" ? input.path : "/";
          const match = publicPages.find((page) => rawPath === page.path || rawPath === page.markdown);

          if (!match) {
            return {
              ok: false,
              message: "Markdown is available only for safe public pages.",
            };
          }

          const response = await fetch(match.markdown, {
            cache: "no-store",
            headers: { Accept: "text/markdown" },
          });

          if (!response.ok) {
            return { ok: false, status: response.status };
          }

          return { ok: true, path: match.markdown, markdown: await response.text() };
        },
      },
      {
        name: "get_public_api_catalog",
        description: "Return public discovery URLs. No executable public API paths are advertised.",
        inputSchema: { type: "object", additionalProperties: false, properties: {} },
        annotations: readOnlyAnnotations,
        execute: () => ({
          apiCatalog: absolute("/.well-known/api-catalog"),
          openApi: absolute("/openapi.json"),
          scope: "Discovery only. OpenAPI currently has no executable public paths.",
        }),
      },
    ];

    for (const tool of tools) registerTool(modelContext, tool);
    window.__qrDesignStudioWebMcpToolsRegistered = true;
  }, []);

  return null;
}
