# Sonora v1

Standalone AI music studio built with Next.js, TypeScript and the MusicGPT Public API.

This repository contains the Sonora application only. It does not carry unrelated legacy Solimar pages or routes from the source workspace.

## Current implementation

- Responsive Sonora studio UI for desktop and mobile
- Fluid spring-based menus, nested tool navigation and hover motion
- Click-outside and `Escape` dismissal for menus/popovers
- 25 Sonora workflows mapped across the documented MusicGPT endpoints
- Google OAuth authentication with Auth.js v5
- Neon-backed Sonora user records and per-user generation history
- Upstash Redis fixed-window rate limiting for generation, reads and uploads
- Vercel Blob uploads namespaced by authenticated user
- MusicGPT safe/mock mode when no API key is configured
- Integration health endpoint for Neon, Redis, Blob, Auth and MusicGPT
- Reduced-motion support and keyboard `/` prompt focus

## Stack

- Next.js 16.2.6 App Router
- React 19.2.6
- TypeScript 5.9
- Auth.js / `next-auth` v5 beta
- Framer Motion
- Lucide React
- Neon Serverless Postgres
- Upstash Redis
- Vercel Blob
- MusicGPT Public API
- Vitest
- Vercel deployment target

## Project structure

```text
src/
  app/
    api/auth/[...nextauth]/route.ts
    api/sonora/
      [feature]/route.ts
      health/route.ts
      jobs/route.ts
      upload/route.ts
    signin/page.tsx
    page.tsx
  auth.ts
  components/sonora/
    AuthBadge.tsx
    GooeyMenu.tsx
    SonoraStudio.tsx
    modes.ts
  lib/sonora/
    auth-db.ts
    musicgpt.ts
    redis.ts
    redis.test.ts
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

## Verification

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Environment variables

Copy `.env.example` and configure the values in Vercel Project Settings > Environment Variables.

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
PUBLIC_BASE_URL=http://localhost:3000

AUTH_SECRET=
AUTH_URL=http://localhost:3000
AUTH_TRUST_HOST=true
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

DATABASE_URL=
NEON_DATABASE_URL=

UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

BLOB_READ_WRITE_TOKEN=

MUSICGPT_API_KEY=
MUSICGPT_BASE_URL=https://api.musicgpt.com/api/public
MUSICGPT_PLAN=
MUSICGPT_MOCK=0
MUSICGPT_LIVE_TEST=0

WEBHOOK_SECRET=
```

Never expose provider keys, OAuth client secrets, database credentials, Redis tokens or Blob tokens through `NEXT_PUBLIC_*` variables.

## Neon database

Dedicated project:

```text
sonora-ai-music-studio
```

Target database:

```text
sonora_v2
```

The database contains `sonora_users` and `sonora_jobs`, with job ownership linked to the authenticated Sonora user.

## Google OAuth

Local authorized JavaScript origin:

```text
http://localhost:3000
```

Local authorized redirect URI:

```text
http://localhost:3000/api/auth/callback/google
```

For production, use:

```text
https://YOUR_PRODUCTION_DOMAIN
https://YOUR_PRODUCTION_DOMAIN/api/auth/callback/google
```

Replace `YOUR_PRODUCTION_DOMAIN` after the dedicated Vercel project is deployed.

## Storage

With `BLOB_READ_WRITE_TOKEN`, uploads are stored under:

```text
sonora/<authenticated-user-id>/...
```

## Redis

When `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are configured, Sonora applies server-side fixed-window rate limits. If Redis is not configured, the application remains functional but reports Redis as unconfigured through the health endpoint.

## Repository

https://github.com/pichimail/sonora-v1
