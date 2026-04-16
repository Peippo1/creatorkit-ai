import type { AnalyzeResponse } from "@/lib/types"

type ResultCardProps = {
  result: AnalyzeResponse | null
  isSubmitting: boolean
}

function scoreLabel(score: number): string {
  if (score >= 80) {
    return "Strong"
  }
  if (score >= 60) {
    return "Promising"
  }
  if (score >= 40) {
    return "Needs work"
  }
  return "Early"
}

export function ResultCard({ result, isSubmitting }: ResultCardProps) {
  if (isSubmitting && !result) {
    return (
      <aside className="panel result-card">
        <div>
          <h2>Analysis result</h2>
          <p className="muted">Analyzing your draft with the local backend...</p>
        </div>
        <div className="empty-state">
          Working on your score, critique, and suggestions.
        </div>
      </aside>
    )
  }

  if (!result) {
    return (
      <aside className="panel result-card">
        <div>
          <h2>Analysis result</h2>
          <p>Results will appear here after you submit a draft.</p>
        </div>
        <div className="empty-state">
          The backend returns a score, critique, strengths, risks, and suggestions.
        </div>
      </aside>
    )
  }

  const metrics = [
    { label: "Hook", value: result.hook_score },
    { label: "Clarity", value: result.clarity_score },
    { label: "Platform fit", value: result.platform_fit_score },
  ]

  return (
    <aside className="panel result-card">
      <div>
        <h2>Analysis result</h2>
        <p className="muted">A quick read on how the draft is likely to perform.</p>
      </div>

      <div className="score-hero">
        <div className="score-badge" aria-label={`Overall score ${result.overall_score}`}>
          <div>
            <strong>{result.overall_score}</strong>
            <span>/ 100</span>
          </div>
        </div>
        <div>
          <span className="tag">{scoreLabel(result.overall_score)}</span>
          <h3>Overall performance score</h3>
          <p className="muted">
            The score is based on hook quality, clarity, and platform fit.
          </p>
        </div>
      </div>

      <div className="metric-grid">
        {metrics.map((metric) => (
          <div className="metric" key={metric.label}>
            <div className="metric-top">
              <span>{metric.label}</span>
              <span>{metric.value}/100</span>
            </div>
            <div className="bar" aria-hidden="true">
              <span style={{ width: `${metric.value}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="columns">
        <div className="stack">
          <h3>Strengths</h3>
          <ul className="list">
            {result.strengths.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="stack">
          <h3>Risks</h3>
          <ul className="list">
            {result.risks.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <p className="critique">{result.critique}</p>

      <div className="stack">
        <h3>Suggestions</h3>
        <ul className="list">
          {result.suggestions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
