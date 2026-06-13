# Public feature discovery

Source URL: https://qr-design-dun.vercel.app/.well-known/agent-skills/public-feature-discovery.md

Goal: help agents understand the public QR Design Studio surface without claiming unavailable backend or account features.

## When To Use

- The user asks what QR Design Studio can do.
- The user asks whether the app supports QR codes, barcodes, templates, frames, scan guidance, or batch generation.
- The user wants a safe summary of the visible public pages.

## Recommended Steps

1. Read `/llms.txt`.
2. Check `/sitemap.xml` for public pages.
3. Prefer Markdown fallbacks such as `/index.md`, `/templates/index.md`, `/batch/index.md`, and `/settings/index.md`.
4. Summarize only visible public capabilities.

## Relevant Pages

- https://qr-design-dun.vercel.app/
- https://qr-design-dun.vercel.app/templates
- https://qr-design-dun.vercel.app/batch
- https://qr-design-dun.vercel.app/settings

## Safety Constraints

- Do not claim Firebase, auth, dashboard, dynamic redirect, analytics, payment, or API features are active in this build.
- Do not collect QR payloads, CSV rows, uploaded logos, filenames, WiFi passwords, vCard fields, or private business data.
- Do not mutate the current design or trigger exports unless the user explicitly asks and confirms.
