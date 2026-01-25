# Gym Log

A mobile-first, offline-friendly gym log built with Next.js App Router, React 19, TypeScript, and Tailwind v4. It focuses on ultra-fast set logging with barbell math (per-side plates + bar weight) and automatic kg conversions.

## Features
- One-tap repeat (+ Same) and batch logging via reps chips
- Barbell math: per-side input + bar weight snapshot stored per set
- IndexedDB persistence, offline-first PWA with install prompt
- History edit with swipe-to-delete + undo
- Progress view with lightweight SVG trend
- Backup export/import (JSON + CSV)

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Build & Run

```bash
npm run build
npm run start
```

## PWA Notes
- Manifest: `public/manifest.json`
- Service worker: `public/sw.js`
- Install prompt appears in Settings when supported

## Deploy

### Vercel
1. Import the repo in Vercel.
2. Framework preset: Next.js.
3. Build command: `npm run build`.
4. Output: `.next` (auto-detected).

### Cloudflare Pages (Next.js support)
1. Create a Pages project from your repo.
2. Framework preset: Next.js.
3. Build command: `npm run build`.
4. Output directory: `.next`.
5. Enable the Next.js runtime in Pages settings if prompted.

### Netlify
1. Create a new site from your repo.
2. Build command: `npm run build`.
3. Publish directory: `.next`.
4. Ensure the Netlify Next.js runtime is enabled (Netlify auto-detects Next projects).

## Data Storage
IndexedDB database `gymlog` with stores:
- `exercises`
- `sets`
- `settings`

## License
Personal-use project.
