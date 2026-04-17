import type { AnalysisHistoryEntry } from "@/lib/types"

type AnalysisHistoryProps = {
  entries: AnalysisHistoryEntry[]
  isLoading: boolean
  error: string | null
}

function formatTimestamp(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed)
}

function scoreTone(score: number): "strong" | "steady" | "weak" {
  if (score >= 80) {
    return "strong"
  }
  if (score >= 60) {
    return "steady"
  }
  return "weak"
}

export function AnalysisHistory({ entries, isLoading, error }: AnalysisHistoryProps) {
  return (
    <aside className="panel history-panel" aria-label="Recent analyses">
      <div className="card-heading">
        <span className="panel-label">Recent analyses</span>
        <h3>Session history</h3>
      </div>
      <p className="history-copy">
        Saved locally for this browser session and backed by the API so you can revisit recent
        drafts without resubmitting them.
      </p>

      {error ? <div className="empty-state history-empty">{error}</div> : null}

      {isLoading ? (
        <div className="empty-state history-empty">Loading recent analyses...</div>
      ) : null}

      {!isLoading && !error && entries.length === 0 ? (
        <div className="empty-state history-empty">
          Submit a draft and it will appear here with its score and next step.
        </div>
      ) : null}

      {!isLoading && entries.length > 0 ? (
        <ul className="history-list">
          {entries.map((entry) => {
            const tone = scoreTone(entry.overall_score)
            return (
              <li className="history-item" key={entry.id}>
                <div className="history-item-top">
                  <div>
                    <strong>
                      {entry.platform} · {entry.content_type}
                    </strong>
                    <span>{formatTimestamp(entry.created_at)}</span>
                  </div>
                  <span className={`score-pill score-pill--${tone}`}>{entry.overall_score}/100</span>
                </div>

                <div className="history-meta">
                  <span>{entry.niche}</span>
                  <span>{entry.duration_seconds}s</span>
                </div>

                <p className="history-suggestion">{entry.top_suggestion}</p>
              </li>
            )
          })}
        </ul>
      ) : null}
    </aside>
  )
}
