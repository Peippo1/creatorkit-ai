import "server-only"

const SECRET_NAME_MARKERS = [
  "API_KEY",
  "OPENAI_KEY",
  "OPENAI_API_KEY",
  "PASSWORD",
  "PRIVATE_KEY",
  "SECRET",
  "TOKEN",
]

type ServerEnv = {
  backendBaseUrl: string
  hasRedisRateLimit: boolean
  nodeEnv: string
  upstashRedisRestToken?: string
  upstashRedisRestUrl?: string
}

function isSecretName(name: string): boolean {
  return SECRET_NAME_MARKERS.some((marker) => name.toUpperCase().includes(marker))
}

function requireValidUrl(name: string, value: string): string {
  try {
    return new URL(value).toString().replace(/\/$/, "")
  } catch {
    throw new Error(`${name} must be a valid URL`)
  }
}

export function validateServerEnv(source: NodeJS.ProcessEnv = process.env): ServerEnv {
  const publicSecrets = Object.entries(source)
    .filter(([name, value]) => Boolean(value) && name.startsWith("NEXT_PUBLIC_") && isSecretName(name))
    .map(([name]) => name)
    .sort()

  if (publicSecrets.length > 0) {
    throw new Error(
      `Secret-like environment variables must not use NEXT_PUBLIC_: ${publicSecrets.join(", ")}`,
    )
  }

  const backendBaseUrl = requireValidUrl(
    "CREATORKIT_BACKEND_URL",
    source.CREATORKIT_BACKEND_URL ?? "http://localhost:8000",
  )

  const upstashRedisRestUrl = source.UPSTASH_REDIS_REST_URL
  const upstashRedisRestToken = source.UPSTASH_REDIS_REST_TOKEN
  if (Boolean(upstashRedisRestUrl) !== Boolean(upstashRedisRestToken)) {
    throw new Error("UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set together")
  }

  if (upstashRedisRestUrl) {
    requireValidUrl("UPSTASH_REDIS_REST_URL", upstashRedisRestUrl)
  }

  return {
    backendBaseUrl,
    hasRedisRateLimit: Boolean(upstashRedisRestUrl && upstashRedisRestToken),
    nodeEnv: source.NODE_ENV ?? "development",
    upstashRedisRestToken,
    upstashRedisRestUrl,
  }
}

export const serverEnv = validateServerEnv()
