const REDACTED = "[REDACTED]"

const SENSITIVE_KEY_MARKERS = [
  "api_key",
  "authorization",
  "cookie",
  "openai",
  "password",
  "private_key",
  "secret",
  "token",
]

const SECRET_LITERAL_PATTERNS = [/sk-[A-Za-z0-9_-]{20,}/g]

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function isSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase().replaceAll("-", "_")
  return SENSITIVE_KEY_MARKERS.some((marker) => normalized.includes(marker))
}

function redactSensitiveValues(value: string): string {
  return SECRET_LITERAL_PATTERNS.reduce(
    (redacted, pattern) => redacted.replace(pattern, REDACTED),
    value,
  )
}

export function redactForLog(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactForLog(item))
  }

  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        isSensitiveKey(key) ? REDACTED : redactForLog(item),
      ]),
    )
  }

  if (typeof value === "string") {
    return redactSensitiveValues(value)
  }

  return value
}
