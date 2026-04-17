export function getAccountKey(userId: string | null, sessionId: string | null): string | null {
  if (userId) {
    return `user:${userId}`
  }

  if (sessionId) {
    return `session:${sessionId}`
  }

  return null
}
