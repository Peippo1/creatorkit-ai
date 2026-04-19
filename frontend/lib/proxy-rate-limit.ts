import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { NextResponse, type NextRequest } from "next/server"

type RateLimitRule = {
  scope: string
  limit: number
  window: typeof RATE_LIMIT_WINDOW
  message: string
}

const RATE_LIMIT_WINDOW = "60 s" as const

const RATE_LIMIT_RULES: Record<string, RateLimitRule> = {
  analyze: {
    scope: "analyze",
    limit: 12,
    window: RATE_LIMIT_WINDOW,
    message: "Too many analysis requests.",
  },
  history: {
    scope: "history",
    limit: 30,
    window: RATE_LIMIT_WINDOW,
    message: "Too many history requests.",
  },
  "drafts-read": {
    scope: "drafts-read",
    limit: 30,
    window: RATE_LIMIT_WINDOW,
    message: "Too many draft history requests.",
  },
  "drafts-write": {
    scope: "drafts-write",
    limit: 15,
    window: RATE_LIMIT_WINDOW,
    message: "Too many draft save requests.",
  },
  account: {
    scope: "account",
    limit: 10,
    window: RATE_LIMIT_WINDOW,
    message: "Too many account requests.",
  },
  "session-clear": {
    scope: "session-clear",
    limit: 5,
    window: RATE_LIMIT_WINDOW,
    message: "Too many session reset requests.",
  },
}

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null

const limiterCache = new Map<string, Ratelimit>()
let warnedMissingRedis = false

function getRateLimitRule(method: string, pathSegments: string[]): RateLimitRule | null {
  const resource = pathSegments[0] ?? ""

  if (resource === "analyze" && method === "POST") {
    return RATE_LIMIT_RULES.analyze
  }

  if (resource === "history" && method === "GET") {
    return RATE_LIMIT_RULES.history
  }

  if (resource === "drafts" && method === "POST") {
    return RATE_LIMIT_RULES["drafts-write"]
  }

  if (resource === "drafts" && method === "GET") {
    return RATE_LIMIT_RULES["drafts-read"]
  }

  if (resource === "account" && (method === "GET" || method === "PATCH")) {
    return RATE_LIMIT_RULES.account
  }

  if (resource === "session" && method === "DELETE") {
    return RATE_LIMIT_RULES["session-clear"]
  }

  return null
}

function getClientIp(request: NextRequest): string {
  const headersToCheck = [
    "x-vercel-forwarded-for",
    "x-forwarded-for",
    "x-real-ip",
    "cf-connecting-ip",
  ]

  for (const headerName of headersToCheck) {
    const headerValue = request.headers.get(headerName)
    if (headerValue) {
      const candidate = headerValue.split(",")[0]?.trim()
      if (candidate) {
        return candidate
      }
    }
  }

  return "unknown"
}

function getClientId(request: NextRequest): string {
  return request.headers.get("x-client-id")?.trim() || "anonymous"
}

function getLimiter(rule: RateLimitRule): Ratelimit | null {
  if (!redis) {
    if (!warnedMissingRedis && process.env.NODE_ENV === "production") {
      console.warn(
        "[CreatorKit Proxy] Upstash Redis env vars are missing; distributed rate limiting is disabled.",
      )
      warnedMissingRedis = true
    }
    return null
  }

  const cacheKey = `${rule.scope}:${rule.limit}:${rule.window}`
  const cached = limiterCache.get(cacheKey)
  if (cached) {
    return cached
  }

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(rule.limit, rule.window),
    prefix: `creatorkit-ai:${rule.scope}`,
  })
  limiterCache.set(cacheKey, limiter)
  return limiter
}

export async function enforceProxyRateLimit(
  request: NextRequest,
  pathSegments: string[],
): Promise<NextResponse | null> {
  const rule = getRateLimitRule(request.method, pathSegments)
  if (!rule) {
    return null
  }

  const limiter = getLimiter(rule)
  if (!limiter) {
    return null
  }

  const key = `${rule.scope}:${getClientId(request)}:${getClientIp(request)}`
  const result = await limiter.limit(key)

  if (result.success) {
    return null
  }

  const retryAfterSeconds =
    typeof result.reset === "number" ? Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)) : 60

  const response = NextResponse.json(
    {
      detail: `${rule.message} Please try again in ${retryAfterSeconds} seconds.`,
    },
    { status: 429 },
  )
  response.headers.set("retry-after", String(retryAfterSeconds))
  response.headers.set("x-ratelimit-limit", String(result.limit))
  response.headers.set("x-ratelimit-remaining", String(result.remaining))
  return response
}
