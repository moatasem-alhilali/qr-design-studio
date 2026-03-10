# QR Design Studio

QR Design Studio is a Vite + React application for creating branded QR codes, previewing them live, exporting them as `PNG` or `SVG`, and optionally managing dynamic QR campaigns with Firebase-powered authentication, storage, redirects, and scan analytics.

![QR Design Studio screenshot](./public/images/screenshots/screenshot.png)

## What this project includes

### QR creation and styling

- Generate QR codes for `URL`, `email`, `phone`, `WhatsApp`, `plain text`, `WiFi`, and a basic `vCard` format.
- Choose from multiple module shapes: `square`, `rounded`, `dots`, `diamond`, and `extra-rounded`.
- Customize finder corner styles, single-color or gradient fills, background color, transparency, size, and error-correction level.
- Upload a center logo and control its size in the preview.
- Add digital-only preview animations such as pulse, glow, gradient, float, and reveal.
- Export individual QR codes as `PNG` or `SVG`.

### Templates, frames, and quality checks

- Start from curated templates for business, communication, social, hospitality, events, finance, and utility use cases.
- Apply style presets for faster branding.
- Wrap QR codes in customizable frames with top/bottom text, colors, padding, and typography controls.
- Review scan reliability feedback before exporting or printing.

### Saved QR codes and campaign workflow

- Sign in with `email/password` or `Google`.
- Save QR codes to Firestore.
- Search, favorite, archive, restore, edit, and delete saved QR codes from the dashboard.
- Create dynamic QR codes that redirect through `/r/:code` so the destination can be updated later.
- Track scans with analytics charts and recent scan history.

### Batch generation

- Import `CSV` files using the format `data,label`.
- Paste multiple rows at once.
- Generate a ZIP archive of QR code images in one run.

## Integrations

- `Firebase Authentication`
  Email/password auth, Google sign-in, and password reset.
- `Cloud Firestore`
  Persists saved QR codes, short links, and scan events.
- `Firebase Storage SDK`
  Initialized in the app config for future asset workflows, but the current UI does not upload files there.
- `ipapi.co`
  Used during dynamic redirects to resolve coarse scan location data (`country`, `city`) from the client IP.
- `JSZip`
  Creates downloadable ZIP files for batch QR export.

## Tech stack

- `React 18`
- `TypeScript`
- `Vite`
- `React Router`
- `Tailwind CSS`
- `shadcn/ui`
- `Framer Motion`
- `Recharts`
- `Firebase`
- `Vitest`
- `Playwright` scaffolding

## Getting started

### Prerequisites

- `Node.js 18+`
- `npm` or `bun`

### Install and run

```bash
git clone <your-repo-url>
cd qr-design-studio
npm install
npm run dev
```

The app runs on `http://localhost:8080`.

### Available scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run test
```

## Firebase setup

Firebase is optional for local QR design. Without Firebase, the app still supports live preview, styling, exports, templates, frames, reliability checks, and batch generation.

Firebase is required for:

- authentication
- saved QR codes
- dynamic QR redirects
- analytics
- dashboard management

### 1. Add environment variables

Copy `.env.example` to `.env.local` and fill in your Firebase web app credentials:

```bash
cp .env.example .env.local
```

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

### 2. Enable Firebase services

- Create a Firebase project and register a web app.
- Enable `Authentication`.
- Turn on the `Email/Password` provider.
- Turn on the `Google` provider if you want Google sign-in.
- Create a `Cloud Firestore` database.

### 3. Firestore collections used by the app

- `qr_codes`
  Stores saved QR configurations and dashboard metadata.
- `short_links`
  Stores dynamic redirect codes for `/r/:code`.
- `qr_scans`
  Stores scan events used by the analytics page.

### 4. Firestore indexes

You will likely need these composite indexes:

- `qr_codes`: `userId` ascending, `createdAt` descending
- `qr_scans`: `qrCodeId` ascending, `timestamp` descending

If they are missing, Firestore usually returns a direct link in the console to create them.

## Project structure

```text
src/
  components/
    auth/
    layout/
    qr/
    ui/
  contexts/
  lib/
    services/
  pages/
  test/
public/
```

## Implementation notes

- This repository is a `Vite` app, not a Next.js app.
- Dynamic QR codes use `window.location.origin` to build redirect links. Generate production dynamic QR codes from the final deployed domain, not from localhost.
- Batch generation is fully client-side.
- Logo uploads are currently stored as in-memory data URLs in the browser session, not in Firebase Storage.
- The `WiFi` and `vCard` modes are intentionally lightweight in the current UI:
  `WiFi` uses a single input and `vCard` currently captures only a name field.
- Scan location lookup depends on `https://ipapi.co/json/`. If that service is unavailable, analytics still work but location data falls back to `Unknown`.
- Automated testing exists, but current coverage is minimal.

## Before publishing

- Add a `LICENSE` file if you want reuse terms to be clear on GitHub.
- Set your final production domain before generating public dynamic QR codes.
- Review Firebase Auth and Firestore security rules for production use; this repo does not include Firebase rules files.
