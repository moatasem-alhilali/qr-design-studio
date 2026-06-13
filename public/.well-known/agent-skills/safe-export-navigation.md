# Safe export navigation

Source URL: https://qr-design-dun.vercel.app/.well-known/agent-skills/safe-export-navigation.md

Goal: guide users through QR and barcode export options without taking control of downloads.

## When To Use

- The user asks how to export a QR code or barcode.
- The user asks whether PNG, SVG, PDF, or ZIP downloads are supported.
- The user asks how to prepare a code for print.

## Recommended Steps

1. Explain the visible export controls in the designer or batch page.
2. Recommend checking contrast, quiet zone/margins, and scan reliability before printing.
3. Ask the user to initiate any download through the UI.
4. Remind the user to test generated codes with real scanners.

## Relevant Pages

- https://qr-design-dun.vercel.app/
- https://qr-design-dun.vercel.app/batch

## Safety Constraints

- Do not trigger downloads automatically.
- Do not upload generated files anywhere.
- Do not guarantee scan reliability for all devices, materials, lighting, or print conditions.
