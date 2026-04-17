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
3. The frontend sends the payload to `POST /analyze`.
4. The backend scores the draft with a lightweight heuristic predictor that calibrates weights by content profile.
5. The backend stores the analysis in SQLite, links it to a creator account key, and returns scores plus critique and suggestions.
6. The frontend renders the result card, refreshes the account-scoped history list, and keeps draft snapshots available for comparison.

## Backend

- FastAPI application entry point at `backend/app/main.py`
- `/health` endpoint for simple uptime checks
- `/analyze` endpoint for content scoring and feedback
- `/history` endpoint for recent analyses scoped to a session or creator account
- `/drafts` endpoint for saved draft snapshots
- `/account` endpoint for the current creator profile and activity summary
- service layer split into scoring and critique helpers
- profile-aware scoring profiles for short-form, long-form, text-first, and general drafts
- creator accounts backed by SQLite and Clerk-authenticated sign-in/sign-up pages
- SQLite-backed persistence for analysis history and draft snapshots

## Frontend

- Next.js App Router scaffold
- single page landing experience
- client-side form submission with local API wiring
- result panel for score and feedback display
- session- or account-scoped history panel for recent analyses
- saved draft library with current-form comparison
- creator account panel for profile editing and activity counts

## Next Step

The planned sequence of product and platform work lives in [`docs/ROADMAP.md`](./ROADMAP.md). The current scorer is profile-aware and can later be replaced with a trained model or rules engine without changing the frontend contract. Authentication is layered on top of the account key flow so the backend can keep a stable contract while moving from anonymous sessions to named creators.
