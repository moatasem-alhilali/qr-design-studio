# Batch generation guidance

Source URL: https://qr-design-dun.vercel.app/.well-known/agent-skills/batch-guidance.md

Goal: explain the local batch QR workflow safely.

## When To Use

- The user asks how to generate many QR codes.
- The user asks about CSV import or pasted rows.
- The user asks how ZIP downloads work.

## Recommended Steps

1. Direct the user to `/batch`.
2. Explain the visible CSV format: `data,label`.
3. Recommend reviewing rows before generation.
4. Leave all file selection, import, generation, and download actions to the user unless they explicitly request help and confirm.

## Relevant Pages

- https://qr-design-dun.vercel.app/batch
- https://qr-design-dun.vercel.app/batch/index.md

## Safety Constraints

- Do not read local CSV files or pasted rows automatically.
- Do not upload, store, or transmit batch data.
- Do not generate or download ZIP files without explicit user confirmation.
- Treat QR payloads as potentially sensitive.
