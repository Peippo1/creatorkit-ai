import type { AnalyzeResponse } from "@/lib/types"

type ResultCardProps = {
  result: AnalyzeResponse | null
  isSubmitting: boolean
}

type Tone = "strong" | "steady" | "weak"

function scoreTone(score: number): Tone {
  if (score >= 80) {
    return "strong"
  }
  if (score >= 60) {
    return "steady"
  }
  return "weak"
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

function fallbackList(items: string[], fallback: string): string[] {
  return items.length > 0 ? items : [fallback]
}

export function ResultCard({ result, isSubmitting }: ResultCardProps) {
  if (isSubmitting && !result) {
    return (
      <aside className="panel result-card">
        <div className="result-top">
          <div>
            <span className="panel-label">Live result</span>
            <h3>Analysis in progress</h3>
          </div>
        </div>
        <div className="empty-state">Working on your score, critique, and suggestions.</div>
      </aside>
    )
  }

  if (!result) {
    return (
      <aside className="panel result-card">
        <div className="result-top">
          <div>
            <span className="panel-label">Live result</span>
            <h3>Analysis result</h3>
          </div>
        </div>
        <div className="empty-state">
          The backend returns a score, critique, strengths, risks, and suggestions.
        </div>
      </aside>
    )
  }

  const overallTone = scoreTone(result.overall_score)
  const metrics = [
    { label: "Hook", value: result.hook_score },
    { label: "Clarity", value: result.clarity_score },
    { label: "Platform fit", value: result.platform_fit_score },
  ]

  return (
    <aside className="panel result-card">
      <div className="result-top">
        <div>
          <span className="panel-label">Live result</span>
          <h3>Analysis result</h3>
        </div>
        <span className={`score-pill score-pill--${overallTone}`}>{scoreLabel(result.overall_score)}</span>
      </div>

      <div className={`score-hero score-hero--${overallTone}`}>
        <div className={`score-badge score-badge--${overallTone}`} aria-label={`Overall score ${result.overall_score}`}>
          <div>
            <strong>{result.overall_score}</strong>
            <span>/ 100</span>
          </div>
        </div>
        <div className="score-copy">
          <h4>Overall performance score</h4>
          <p>
            This score combines hook quality, clarity, and platform fit so you can see if the
            draft is ready to publish or needs another pass.
          </p>
        </div>
      </div>

      <div className="mini-score-grid">
        {metrics.map((metric) => {
          const tone = scoreTone(metric.value)
          return (
            <article className="mini-score" data-tone={tone} key={metric.label}>
              <div className="mini-score-top">
                <span>{metric.label}</span>
                <strong>{metric.value}/100</strong>
              </div>
              <div className="mini-score-bar" aria-hidden="true">
                <span style={{ width: `${metric.value}%` }} />
              </div>
            </article>
          )
        })}
      </div>

      <div className="feedback-grid">
        <article className="feedback-card feedback-card--strengths">
          <div className="card-heading">
            <span className="panel-label">Strengths</span>
            <h4>What is working</h4>
          </div>
          <ul className="feedback-list">
            {fallbackList(result.strengths, "No strong signals yet.").map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="feedback-card feedback-card--risks">
          <div className="card-heading">
            <span className="panel-label">Risks</span>
            <h4>What may hold it back</h4>
          </div>
          <ul className="feedback-list">
            {fallbackList(result.risks, "No obvious risks from the current draft.").map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </div>

      <article className="critique-card">
        <div className="card-heading">
          <span className="panel-label">Critique</span>
          <h4>Plain-language feedback</h4>
        </div>
        <p>{result.critique}</p>
      </article>

      <article className="suggestions-card">
        <div className="card-heading">
          <span className="panel-label">Suggestions</span>
          <h4>Edits to try next</h4>
        </div>
        <ul className="feedback-list">
          {fallbackList(result.suggestions, "Try a tighter opener and a clearer CTA.").map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </article>
    </aside>
  )
}
