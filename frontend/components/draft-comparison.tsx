import type { AnalyzeRequest, SavedDraftEntry } from "@/lib/types"

type DraftComparisonProps = {
  drafts: SavedDraftEntry[]
  selectedDraftId: number | null
  currentDraft: AnalyzeRequest
  isLoading: boolean
  error: string | null
  onSelectDraft: (draftId: number) => void
}

type DraftDiff = {
  field: string
  saved: string
  current: string
  changed: boolean
}

const FIELD_LABELS: Record<keyof AnalyzeRequest, string> = {
  platform: "Platform",
  content_type: "Content type",
  hook: "Hook",
  caption: "Caption",
  transcript: "Transcript",
  duration_seconds: "Duration",
  niche: "Niche",
  has_cta: "CTA",
}

const COMPARISON_FIELDS: Array<keyof AnalyzeRequest> = [
  "platform",
  "content_type",
  "hook",
  "caption",
  "transcript",
  "duration_seconds",
  "niche",
  "has_cta",
]

function formatValue(field: keyof AnalyzeRequest, value: AnalyzeRequest[keyof AnalyzeRequest]): string {
  if (field === "has_cta") {
    return value ? "Yes" : "No"
  }

  if (field === "duration_seconds") {
    return `${value}s`
  }

  return String(value)
}

function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0
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

function buildDiff(selectedDraft: SavedDraftEntry | undefined, currentDraft: AnalyzeRequest): DraftDiff[] {
  if (!selectedDraft) {
    return []
  }

  return COMPARISON_FIELDS.map((field) => {
    const savedValue = selectedDraft.request[field]
    const currentValue = currentDraft[field]
    const changed = savedValue !== currentValue

    if (field === "hook" || field === "caption" || field === "transcript") {
      const savedText = String(savedValue)
      const currentText = String(currentValue)
      return {
        field: FIELD_LABELS[field],
        saved: `${wordCount(savedText)} words`,
        current: `${wordCount(currentText)} words`,
        changed,
      }
    }

    return {
      field: FIELD_LABELS[field],
      saved: formatValue(field, savedValue),
      current: formatValue(field, currentValue),
      changed,
    }
  })
}

export function DraftComparison({
  drafts,
  selectedDraftId,
  currentDraft,
  isLoading,
  error,
  onSelectDraft,
}: DraftComparisonProps) {
  const selectedDraft =
    drafts.find((draft) => draft.id === selectedDraftId) ?? drafts[0] ?? null
  const comparison = buildDiff(selectedDraft ?? undefined, currentDraft)
  const changedCount = comparison.filter((item) => item.changed).length

  return (
    <aside className="panel draft-panel" aria-label="Saved drafts">
      <div className="card-heading">
        <span className="panel-label">Saved drafts</span>
        <h3>Draft library</h3>
      </div>
      <p className="history-copy">
        Save snapshots of the current form, then compare any saved version against what you are
        editing now.
      </p>

      {error ? <div className="empty-state history-empty">{error}</div> : null}

      {isLoading ? <div className="empty-state history-empty">Loading saved drafts...</div> : null}

      {!isLoading && !error && drafts.length === 0 ? (
        <div className="empty-state history-empty">
          Save a draft to create a comparison baseline and revisit prior iterations.
        </div>
      ) : null}

      {!isLoading && drafts.length > 0 ? (
        <ul className="draft-list">
          {drafts.map((draft) => {
            const selected = draft.id === selectedDraft?.id
            return (
              <li key={draft.id}>
                <button
                  className={`draft-item${selected ? " draft-item--selected" : ""}`}
                  type="button"
                  onClick={() => onSelectDraft(draft.id)}
                >
                  <div className="draft-item-top">
                    <strong>{draft.title}</strong>
                    <span>{formatTimestamp(draft.created_at)}</span>
                  </div>
                  <div className="draft-item-meta">
                    <span>{draft.request.niche}</span>
                    <span>{draft.request.duration_seconds}s</span>
                    <span>{draft.request.has_cta ? "CTA" : "No CTA"}</span>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}

      {selectedDraft ? (
        <div className="draft-comparison">
          <div className="card-heading">
            <span className="panel-label">Comparison</span>
            <h4>Against current form</h4>
          </div>
          <p className="history-copy">
            {changedCount === 0
              ? "This saved draft matches the current form."
              : `${changedCount} field${changedCount === 1 ? "" : "s"} changed between the saved draft and the current form.`}
          </p>

          <ul className="comparison-list">
            {comparison.map((item) => (
              <li className={`comparison-item${item.changed ? " comparison-item--changed" : ""}`} key={item.field}>
                <div className="comparison-label">{item.field}</div>
                <div className="comparison-values">
                  <span>
                    <strong>Saved</strong>
                    {item.saved}
                  </span>
                  <span>
                    <strong>Current</strong>
                    {item.current}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </aside>
  )
}
