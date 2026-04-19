# CreatorKit AI Deployment Checklist

Use this as the quick reference before deploying the app to Vercel.

## Vercel Frontend

- `CREATORKIT_BACKEND_URL`
  - set to the production FastAPI base URL
  - the Next.js proxy in `frontend/app/api/backend/[...path]/route.ts` forwards browser requests there
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
  - required for distributed proxy rate limiting
  - if these are missing, the proxy skips distributed limiting and logs a warning

## Anonymous Session Storage

- `CREATORKIT_SESSION_RETENTION_LIMIT`
  - controls how many recent anonymous sessions are retained in SQLite
  - default: `5`
- `CREATORKIT_SESSION_RETENTION_DAYS`
  - controls how long inactive anonymous sessions are kept before cleanup
  - default: `30`

## Backend Notes

- The backend uses SQLite for recent analyses and saved draft snapshots.
- If you want the data to survive host redeploys, make sure the SQLite file lives on persistent storage.
- `CREATORKIT_INTERNAL_API_SECRET` is only needed if you re-enable the signed internal auth flow for creator-account features.

## Quick Preflight

1. Confirm the frontend has `CREATORKIT_BACKEND_URL` pointing at the live backend.
2. Confirm Upstash env vars are set if you want distributed rate limiting enabled.
3. Confirm the backend has persistent storage if you want session history and drafts to survive restarts.
4. Confirm the live UI matches the current anonymous deployment mode.
