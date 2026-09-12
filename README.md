# Sonora v1

Sonora is an AI music studio web application built around a production-grade Next.js stack, with MusicGPT-powered generation workflows, persistent job history, managed storage, authentication, and a responsive studio UI.

## Target stack

- Next.js 15 App Router
- TypeScript (strict)
- Tailwind CSS
- Radix UI / accessible primitives
- Framer Motion for transitions
- Zustand + TanStack Query
- Prisma + Neon Postgres
- Upstash Redis
- Vercel Blob
- Auth.js with Google OAuth
- MusicGPT Public API
- Vitest + Playwright
- Vercel deployment

## Planned platform integrations

The production deployment is intended to use Vercel-managed integrations where possible:

- **Neon Postgres** — users, jobs, outputs, tracks, playlists, comments, likes, notifications, voices, drafts, webhook events, and application state.
- **Upstash Redis** — rate limiting, short-lived coordination, cache/queue support, and concurrency controls.
- **Vercel Blob** — uploaded audio, generated assets, persisted media, and downloadable output files.
- **Google OAuth via Auth.js** — primary user authentication.
- **MusicGPT Public API** — music generation and audio-processing capabilities.

## Local development

Requirements:

- Node.js 22+
- pnpm 10+
- PostgreSQL-compatible `DATABASE_URL`

Install and run:

```bash
pnpm install
pnpm prisma generate
pnpm prisma migrate dev
pnpm dev
```

Then open:

```text
http://localhost:3000
```

## Environment variables

Do not commit secrets. The repository ignores all local `.env*` files except `.env.example`.

The final `.env.example` will include the variables required for:

- Neon / Prisma
- Upstash Redis
- Vercel Blob
- Auth.js
- Google OAuth
- MusicGPT
- public deployment URLs
- webhook verification

Typical variables will include:

```bash
DATABASE_URL=
AUTH_SECRET=
AUTH_URL=http://localhost:3000
AUTH_TRUST_HOST=true

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

BLOB_READ_WRITE_TOKEN=

MUSICGPT_API_KEY=
MUSICGPT_BASE_URL=
MUSICGPT_PLAN=
WEBHOOK_SECRET=
PUBLIC_BASE_URL=http://localhost:3000
```

Never place provider secrets in `NEXT_PUBLIC_*` variables.

## Google OAuth redirect URLs

For local development:

```text
http://localhost:3000/api/auth/callback/google
```

After the Vercel project receives its final production domain, add this pattern to the Google OAuth application's **Authorized redirect URIs**:

```text
https://YOUR_PRODUCTION_DOMAIN/api/auth/callback/google
```

The exact production redirect URL will be documented here after deployment.

## Production workflow

Before deployment, the project should pass:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Then deploy through the connected Vercel project with the required environment variables configured for the correct environments.

## Security rules

- Keep `MUSICGPT_API_KEY`, Google client secret, database credentials, Redis tokens, Blob tokens, and Auth.js secrets server-only.
- Never commit `.env.local` or production credentials.
- Validate uploads and provider payloads server-side.
- Verify webhook signatures before persisting provider callbacks.
- Apply rate limits to authentication, uploads, and generation endpoints.

## Repository

GitHub: https://github.com/pichimail/sonora-v1

## License

Private product code unless a separate license is added to this repository.
