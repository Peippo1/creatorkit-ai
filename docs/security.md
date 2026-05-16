# CreatorKit Secret Handling

## Rules

- Keep API secrets, OpenAI keys, internal auth secrets, Redis tokens, and provider credentials server-side only.
- Do not create `NEXT_PUBLIC_*` variables for values containing `SECRET`, `TOKEN`, `PASSWORD`, `PRIVATE_KEY`, `API_KEY`, or OpenAI credentials.
- Do not import `frontend/lib/server-env.ts` from client components. It imports `server-only` and is reserved for Route Handlers, Server Components, and other server-only modules.
- Do not log secrets, request headers, cookies, authorization values, raw provider responses containing credentials, or full environment dumps.
- Use `redactForLog` before logging structured values that might include tokens or secret-like keys.
- Keep local env files untracked. Only `.env.example` should be committed.

## Current Server Env

- `CREATORKIT_BACKEND_URL`: server-only URL used by the Next.js proxy.
- `UPSTASH_REDIS_REST_URL`: server-only Redis REST URL for distributed proxy rate limiting.
- `UPSTASH_REDIS_REST_TOKEN`: server-only Redis token for distributed proxy rate limiting.
- `CREATORKIT_INTERNAL_API_SECRET`: server-only secret for the dormant signed internal auth flow.
- `CREATORKIT_SESSION_RETENTION_LIMIT`: server-only backend retention setting.
- `CREATORKIT_SESSION_RETENTION_DAYS`: server-only backend retention setting.

## Validation

The backend validates its environment on FastAPI startup. The Next.js proxy validates server env at module load. Both reject secret-like `NEXT_PUBLIC_*` variables.

The automated tests also scan tracked source for common accidental exposure patterns:

- tracked `.env` files other than `.env.example`
- `NEXT_PUBLIC_*` names that look like secrets
- client component imports of `frontend/lib/server-env.ts`
- committed OpenAI-style secret literals
