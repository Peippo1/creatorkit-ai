# CreatorKit AI Architecture

## Current Shape

- `backend/` contains a FastAPI service
- `frontend/` contains a Next.js app
- `research/` preserves the legacy notebook work
- `assets/images/` stores shared visual exports
- `docs/` stores product and architecture notes

## Request Flow

1. User opens the frontend.
2. User fills out the analysis form.
3. The browser sends requests to the same-origin Next.js proxy under `/api/backend/*`.
4. The proxy rate-limits requests with distributed Upstash Redis keys when the Vercel env vars are present.
5. The proxy forwards anonymous session requests to the Python backend.
6. The backend scores the draft with a lightweight heuristic predictor and stores the analysis in SQLite.
7. The backend returns scores, critique, suggestions, and rewritten hooks.
8. The frontend renders the result card, refreshes the session-scoped history list, and keeps draft snapshots available for comparison.

## Backend

- FastAPI application entry point at `backend/app/main.py`
- `/health` endpoint for simple uptime checks
- `/analyze` endpoint for content scoring and feedback
- `/history` endpoint for recent analyses scoped to a session or creator account
- `/drafts` endpoint for saved draft snapshots
- `/account` endpoint for the current creator profile and activity summary
- service layer split into scoring and critique helpers
- profile-aware scoring profiles for short-form, long-form, text-first, and general drafts
- creator account and auth code kept in the repo for later reactivation, but not imported by the anonymous deployment
- SQLite-backed persistence for analysis history and draft snapshots

## Deployment Checklist

See [`docs/DEPLOYMENT.md`](./DEPLOYMENT.md) for the current Vercel checklist covering:

- `CREATORKIT_BACKEND_URL`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `CREATORKIT_SESSION_RETENTION_LIMIT`
- `CREATORKIT_SESSION_RETENTION_DAYS`

Secret handling rules and validation behavior are documented in [`docs/security.md`](./security.md).

## Frontend

- Next.js App Router scaffold
- single page landing experience
- client-side form submission through a same-origin Next.js backend proxy
- distributed proxy rate limiting backed by Upstash Redis when configured
- result panel for score and feedback display
- session-scoped history panel for recent analyses
- saved draft library with current-form comparison
- anonymous session flow only in the current deployed UI

## Next Step

The planned sequence of product and platform work lives in [`docs/ROADMAP.md`](./ROADMAP.md). The current scorer is profile-aware and can later be replaced with a trained model or rules engine without changing the frontend contract. The deployed UI is anonymous; creator auth/account code remains in the repository for later reactivation but is not imported into the current frontend.
