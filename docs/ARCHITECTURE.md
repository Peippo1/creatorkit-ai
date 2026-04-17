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
4. The backend scores the draft with a lightweight heuristic predictor.
5. The backend stores the analysis in a local SQLite history table and returns scores plus critique and suggestions.
6. The frontend renders the result card and refreshes the session history list.

## Backend

- FastAPI application entry point at `backend/app/main.py`
- `/health` endpoint for simple uptime checks
- `/analyze` endpoint for content scoring and feedback
- `/history` endpoint for the current browser session's recent analyses
- service layer split into scoring and critique helpers
- SQLite-backed persistence for analysis history

## Frontend

- Next.js App Router scaffold
- single page landing experience
- client-side form submission with local API wiring
- result panel for score and feedback display
- session-scoped history panel for recent analyses

## Next Step

The planned sequence of product and platform work lives in [`docs/ROADMAP.md`](./ROADMAP.md). The heuristic scoring service can later be replaced with a trained model or rules engine without changing the frontend contract.
