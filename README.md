

# CreatorKit AI

CreatorKit AI is the next-stage product built from the StreamSense notebook prototype. The original notebook work is preserved under `research/` as legacy research artifacts, while the repo now also contains a clean web app scaffold for scoring creator content before publication.

The app direction is simple:

- users submit a content idea, draft, hook, caption, or transcript
- the system returns a performance score
- the system explains the weak points
- the system suggests edits before publishing

## Repository Layout

- `backend/` contains the FastAPI service
- `frontend/` contains the Next.js + TypeScript app
- `research/` contains preserved notebooks, query notebooks, and dashboard exports
- `assets/images/` contains exported plots and shared images
- `docs/` contains product vision, MVP, and architecture notes
- `streamsense/` remains in place for the legacy notebook helpers

## Setup

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend endpoints:

- `GET /health`
- `POST /analyze`
- `GET /history`
- `GET /drafts`
- `POST /drafts`
- `GET /account`
- `PATCH /account`

The frontend talks to these routes through a same-origin Next.js proxy at `/api/backend/*` that forwards anonymous session requests to FastAPI.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The Next.js proxy expects the backend at `http://localhost:8000` by default. You can override that server-side with `CREATORKIT_BACKEND_URL`.

The deployment checklist lives in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## What the First Version Does

- accepts platform, content type, hook, caption, transcript, duration, niche, and CTA intent
- returns an overall score and sub-scores for hook, clarity, and platform fit
- uses profile-aware scoring so short-form, long-form, and text-first drafts are weighted differently
- returns strengths, risks, critique, and suggestions
- returns three rewritten hook variations for a faster next edit
- persists recent analyses for the current browser session and shows history
- saves draft snapshots for later comparison
- compares the selected saved draft against the current form
- provides a clean landing page and analysis form

## Legacy Research

The original StreamSense notebooks are kept intact under `research/` so the repo still preserves the full notebook-based exploration history. The `streamsense` Python package also stays in place for compatibility with those artifacts.

## Roadmap

The ordered roadmap lives in [`docs/ROADMAP.md`](docs/ROADMAP.md). The short version:

1. Surface the top fix more prominently in the frontend
2. Persist analyses and user history
3. Add saved drafts and comparison
4. Replace or augment the heuristic scorer
5. Add authentication and creator accounts
6. Deploy the product
