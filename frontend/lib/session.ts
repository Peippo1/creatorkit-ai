const ANALYSIS_SESSION_KEY = "creatorkit-ai.analysis-session-id"

function generateSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }

  return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function getAnalysisSessionId(): string {
  if (typeof window === "undefined") {
    return "anonymous"
  }

  const existing = window.localStorage.getItem(ANALYSIS_SESSION_KEY)
  if (existing) {
    return existing
  }

  const next = generateSessionId()
  window.localStorage.setItem(ANALYSIS_SESSION_KEY, next)
  return next
}
