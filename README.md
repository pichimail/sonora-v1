# Sonora v1

Standalone AI music studio built with Next.js, TypeScript and the MusicGPT Public API.

This repository intentionally contains the **Sonora application only**. It does not carry the unrelated legacy Solimar pages/routes from the source workspace.

## Current implementation

- Responsive Sonora studio UI for desktop and mobile
- Fluid spring-based menus, nested tool navigation and hover motion
- Click-outside and `Escape` dismissal for open menus/popovers
- 25 Sonora workflows mapped across the documented MusicGPT endpoints
- MusicGPT safe/mock mode when no API key is configured
- Neon Postgres persistence for generation jobs
- Vercel Blob upload endpoint for audio/image inputs
- Health and job-history API routes
- Search/library side sheets and generation/player surfaces
- Reduced-motion support and keyboard `/` prompt focus

## Stack

- Next.js 16.2.6 App Router
- React 19.2.6
- TypeScript 5.9
- Framer Motion
- Lucide React
- Neon Serverless Postgres
- Upstash Redis dependency reserved for the rate-limit/cache integration pass
- Vercel Blob
- MusicGPT Public API
- Vercel deployment target

## Project structure

```text
src/
  app/
    api/sonora/
      [feature]/route.ts
      health/route.ts
      jobs/route.ts
      upload/route.ts
    globals.css
    layout.tsx
    page.tsx
    sonora.css
  components/sonora/
    GooeyMenu.tsx
    SonoraStudio.tsx
    modes.ts
  lib/sonora/
    musicgpt.ts
```

## Local development

Requirements:

- Node.js 24.x
- pnpm 11.8+

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open `http://localhost:3000`.

The application runs in safe/mock mode when `MUSICGPT_API_KEY` is not set.

## Verification

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## Environment variables

Copy `.env.example` and configure the values you need. Never commit real credentials.

Core variables:

```bash
MUSICGPT_API_KEY=
MUSICGPT_BASE_URL=https://api.musicgpt.com/api/public
MUSICGPT_MOCK=0

DATABASE_URL=
NEON_DATABASE_URL=

UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

BLOB_READ_WRITE_TOKEN=

AUTH_SECRET=
AUTH_URL=http://localhost:3000
AUTH_TRUST_HOST=true
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
WEBHOOK_SECRET=
```

`MUSICGPT_API_KEY`, database credentials, Redis tokens, Blob tokens and Google client secrets must remain server-only. Do not expose them through `NEXT_PUBLIC_*` variables.

## MusicGPT transport rules

The server adapter keeps the provider key private and sends the raw key through the `Authorization` header. It supports JSON, query-string, form-urlencoded and multipart endpoint families and falls back from `/v2/MusicAI` to `/v1/MusicAI` only when v2 returns HTTP 404.

## Database

When `DATABASE_URL` or `NEON_DATABASE_URL` is present, Sonora lazily creates the `sonora_jobs` table and stores generation requests/status metadata there.

## Storage

When `BLOB_READ_WRITE_TOKEN` is configured, uploads are stored under `sonora/` in Vercel Blob. Without the token, the upload route stays in safe mode so the UI can still be exercised without exposing local files.

## Google OAuth

Google OAuth is included in `.env.example` for the next authentication integration pass. The expected callback pattern will be:

```text
http://localhost:3000/api/auth/callback/google
https://YOUR_PRODUCTION_DOMAIN/api/auth/callback/google
```

The exact production URL should be added to Google Cloud after the dedicated Vercel project is deployed.

## Repository

https://github.com/pichimail/sonora-v1
