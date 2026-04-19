const ANALYSIS_SESSION_KEY = "creatorkit-ai.analysis-session-id"
const SESSION_PREFIX = "session:"

function normalizeSessionId(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  if (trimmed === "anonymous" || trimmed.startsWith(SESSION_PREFIX)) {
    return trimmed
  }

  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) {
    return `${SESSION_PREFIX}${trimmed}`
  }

  return null
}

function generateSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${SESSION_PREFIX}${crypto.randomUUID()}`
  }

  return `${SESSION_PREFIX}${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function getAnalysisSessionId(): string {
  if (typeof window === "undefined") {
    return "anonymous"
  }

  const existing = window.localStorage.getItem(ANALYSIS_SESSION_KEY)
  if (existing) {
    const normalized = normalizeSessionId(existing)
    if (normalized) {
      if (normalized !== existing) {
        window.localStorage.setItem(ANALYSIS_SESSION_KEY, normalized)
      }
      return normalized
    }
  }

  const next = generateSessionId()
  window.localStorage.setItem(ANALYSIS_SESSION_KEY, next)
  return next
}
