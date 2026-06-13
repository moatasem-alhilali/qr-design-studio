# QR Design Studio Architecture

This project is a Vite + React + TypeScript app. It is not a Next.js App Router
project, so the production architecture is adapted to React Router while keeping
the same goals: clean boundaries, predictable routing, colocated feature logic,
and no behavior changes to the existing QR/barcode design studio.

## Product Boundary

The current app is a static QR and barcode design studio with templates, frames,
scan reliability feedback, batch generation, and local browser export workflows.
The visible UI, route paths, copy, generated file names, and export behavior are
treated as frozen unless a task explicitly asks to change them.

## Current Structure

```txt
src/
  App.tsx                    app shell composition only
  main.tsx                   Vite React entrypoint
  routes/                    React Router route table
  providers/                 app-level providers and QueryClient policy
  pages/                     route components; should stay thin
  features/
    designer/                QR/barcode editor state workflow
    batch/                   batch row state, CSV parsing, ZIP generation
    templates/               template catalog and apply-template navigation
  components/
    qr/                      QR-specific presentation controls
    barcode/                 barcode-specific presentation controls
    layout/                  app layout and navigation
    ui/                      shadcn/Radix primitives
  lib/                       domain engines, static presets, types, utilities
  shared/
    seo/                     route metadata helpers
```

## Dependency Direction

Allowed:

```txt
main -> App -> providers/routes
routes -> pages -> features/components/lib/shared
features -> components/lib/shared
components -> lib/shared
shared -> no pages/features imports
lib -> no pages imports
```

Pages should not own durable workflow logic. If a page needs parsing, export,
validation, persistence, or URL orchestration, put that code in its feature.

## Routing

Routes live in `src/routes/AppRoutes.tsx`.

Current public routes:

```txt
/             main designer
/templates    template picker
/batch        batch QR generator
/settings     local app settings/about
*             not found
```

Do not change route paths unless the user explicitly asks.

## State Management

- Local interactive UI state can live in feature hooks.
- Server state belongs in TanStack Query when real APIs are added.
- Query defaults live in `src/providers/query-client.ts`.
- Do not store API payloads in UI-only state once backend integration exists.
- Browser-only file workflows should stay in feature services.

Current query cache policy:

- `staleTime`: 5 minutes.
- `gcTime`: 30 minutes.
- No refetch on window focus.
- Refetch on reconnect.
- Retry transient failures up to 2 times; do not retry 4xx-style errors.

## Feature Rules

Feature folders may include only what they need:

```txt
features/<feature>/
  hooks/
  services/
  components/
  types/
  validations/
```

Do not create empty folders. Keep feature-specific logic colocated with the
feature, but keep reusable UI in `components/ui` or domain components under
`components/qr` and `components/barcode`.

## API Layer Rules

There is currently no backend API wired into this app. When an API is added:

- Create typed feature API functions under `features/<feature>/api`.
- Use TanStack Query for client server-state.
- Define cache keys and invalidation next to the feature.
- Keep response validation at the feature boundary when payloads affect rendering.
- Do not put raw `fetch` calls in pages.

## Batch Workflow

Batch generation is split by responsibility:

- `features/batch/hooks/useBatchRows.ts` owns row state operations.
- `features/batch/services/batch-rows.ts` owns CSV parsing, pasted-row parsing,
  QR ZIP generation, and browser download wiring.
- `pages/BatchPage.tsx` stays responsible for UI and event wiring.

## Designer Workflow

Designer state is owned by:

- `features/designer/hooks/useDesignerState.ts`

The hook owns QR/barcode/frame state and applies the `?template=<id>` URL
contract. Presentation controls remain in `components/qr` and
`components/barcode`.

## Templates Workflow

Template catalog helpers live in:

- `features/templates/services/template-catalog.ts`
- `features/templates/hooks/useApplyTemplate.ts`

The route contract remains `/?template=<id>`.

## SEO

Client-side metadata updates live in `shared/seo/page-meta.ts`. Layout consumes
that helper and should not contain route metadata tables directly.

## Coding Standards

- Prefer absolute imports through `@/`.
- Keep pages thin and readable.
- Keep browser file APIs in feature services.
- Do not alter file names, route paths, or export behavior without an explicit
  product request.
- Keep generated `dist/` out of hand edits.
- Before delivery, run the available project checks:

```bash
npm run lint
npm run test
npm run build
```

