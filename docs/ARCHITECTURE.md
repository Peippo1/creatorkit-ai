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
4. The Next.js server verifies Clerk for signed-in users and forwards a short-lived internal assertion to the Python backend.
5. The backend verifies that assertion for creator-account requests, scores the draft with a lightweight heuristic predictor, and stores the analysis in SQLite.
6. The backend returns scores, critique, suggestions, and rewritten hooks.
7. The frontend renders the result card, refreshes the account-scoped history list, and keeps draft snapshots available for comparison.

## Backend

- FastAPI application entry point at `backend/app/main.py`
- `/health` endpoint for simple uptime checks
- `/analyze` endpoint for content scoring and feedback
- `/history` endpoint for recent analyses scoped to a session or creator account
- `/drafts` endpoint for saved draft snapshots
- `/account` endpoint for the current creator profile and activity summary
- internal assertion verification for signed-in creator requests from the Next.js proxy
- service layer split into scoring and critique helpers
- profile-aware scoring profiles for short-form, long-form, text-first, and general drafts
- creator accounts backed by SQLite with Clerk-authenticated sign-in/sign-up pages
- SQLite-backed persistence for analysis history and draft snapshots

## Frontend

- Next.js App Router scaffold
- single page landing experience
- client-side form submission through a same-origin Next.js backend proxy
- result panel for score and feedback display
- session- or account-scoped history panel for recent analyses
- saved draft library with current-form comparison
- creator account panel for profile editing and activity counts

## Next Step

The planned sequence of product and platform work lives in [`docs/ROADMAP.md`](./ROADMAP.md). The current scorer is profile-aware and can later be replaced with a trained model or rules engine without changing the frontend contract. Authentication is enforced at the Next.js proxy boundary and re-verified by the backend with a signed internal assertion, so the frontend no longer supplies creator account keys directly.
