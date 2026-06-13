# Batch QR Generator

Source URL: https://qr-design-dun.vercel.app/batch

Description: Public page for generating multiple static QR codes locally from pasted rows or CSV files and downloading them as a ZIP archive.

## Important Links

- Home designer: https://qr-design-dun.vercel.app/
- Templates: https://qr-design-dun.vercel.app/templates
- Batch guidance skill: https://qr-design-dun.vercel.app/.well-known/agent-skills/batch-guidance.md

## Public Capabilities

- Add QR rows manually.
- Paste multiple values.
- Import a local CSV file in `data,label` format.
- Generate a local ZIP download through the visible UI.

## Agent Safety

- Do not read local files or pasted rows automatically.
- Do not import CSV files, generate ZIP files, clear rows, or trigger downloads without explicit user confirmation.
- Treat QR payloads and batch rows as potentially sensitive.
