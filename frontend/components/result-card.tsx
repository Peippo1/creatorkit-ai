import type { AnalyzeResponse } from "@/lib/types"

type ResultCardProps = {
  result: AnalyzeResponse | null
  previousResult: AnalyzeResponse | null
  selectedHook: string | null
  isSubmitting: boolean
  onRescore: () => void
  onUseHook: (hook: string) => void
}

type Tone = "strong" | "steady" | "weak"

type TopFix = {
  title: string
  why: string
  nextStep: string
  impact: string
}

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

function splitLead(items: string[], fallback: string): { lead: string; remainder: string[] } {
  if (items.length === 0) {
    return { lead: fallback, remainder: [] }
  }

  return { lead: items[0], remainder: items.slice(1) }
}

function fixForResult(result: AnalyzeResponse): TopFix {
  const risks = `${result.risks.join(" ")} ${result.suggestions.join(" ")}`.toLowerCase()
  const weakestMetric = [
    { label: "hook", value: result.hook_score },
    { label: "clarity", value: result.clarity_score },
    { label: "platform", value: result.platform_fit_score },
  ].reduce((worst, current) => (current.value < worst.value ? current : worst))

  if (risks.includes("call to action") || risks.includes("cta")) {
    return {
      title: "Give the ending a clear direction",
      why: "When people know what to do next, they are more likely to keep moving.",
      nextStep: "Try ending with one simple action, such as save, comment, or click.",
      impact: "This can improve conversion and make the draft feel more complete.",
    }
  }

  if (weakestMetric.label === "hook") {
    return {
      title: "Strengthen the opening",
      why: "The first line decides whether people keep watching or scroll away.",
      nextStep: "Try starting with a surprising claim, a problem, or a clear promise.",
      impact: "A stronger opening can lift retention and give the rest of the draft a better chance.",
    }
  }

  if (weakestMetric.label === "clarity") {
    return {
      title: "Make the main idea easier to follow",
      why: "People stay longer when they can understand the point quickly.",
      nextStep: "Try trimming extra words and leading with the main takeaway.",
      impact: "Clearer framing can reduce drop-off and make the message easier to trust.",
    }
  }

  return {
    title: "Make it feel native to the platform",
    why: "When the framing matches the feed, the draft feels easier to trust and consume.",
    nextStep: "Try using the style that performs best on this platform, then re-score it.",
    impact: "Platform-fit improvements can make the content feel more natural and easier to engage with.",
  }
}

function coachInsight(result: AnalyzeResponse): string {
  const risks = `${result.risks.join(" ")} ${result.suggestions.join(" ")}`.toLowerCase()

  if (risks.includes("call to action") || risks.includes("cta")) {
    return "Coach Insight: A clear ending gives the viewer a next step, which makes the draft easier to act on."
  }

  if (result.hook_score <= result.clarity_score && result.hook_score <= result.platform_fit_score) {
    return "Coach Insight: Openings matter because they decide if someone keeps watching. Lead with a strong promise or a clear problem."
  }

  if (result.clarity_score <= result.hook_score && result.clarity_score <= result.platform_fit_score) {
    return "Coach Insight: Clarity helps the audience understand the idea quickly. When the point is obvious, people are less likely to drop off."
  }

  return "Coach Insight: Platform-native framing helps the content feel familiar and easier to trust. That usually makes the message land faster."
}

function deltaLabel(previous: number, current: number): { text: string; tone: "up" | "down" | "flat" } {
  const delta = current - previous
  if (delta > 0) {
    return { text: `Improved by +${delta}`, tone: "up" }
  }
  if (delta < 0) {
    return { text: `Down ${Math.abs(delta)}`, tone: "down" }
  }
  return { text: "No change", tone: "flat" }
}

function coachingLoopMessage(previous: AnalyzeResponse | null, current: AnalyzeResponse): string | null {
  if (!previous) {
    return null
  }

  const delta = current.overall_score - previous.overall_score

  if (delta > 0) {
    return `Nice improvement — tightening the hook increased your score by +${delta}.`
  }

  if (delta === 0) {
    return "The hook changed, but the draft may still need work elsewhere."
  }

  return "This version is less effective — try a stronger payoff or clearer promise."
}

export function ResultCard({
  result,
  previousResult,
  selectedHook,
  isSubmitting,
  onRescore,
  onUseHook,
}: ResultCardProps) {
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
  const strongestMetric = metrics.reduce((best, current) => (current.value > best.value ? current : best))
  const weakestMetric = metrics.reduce((worst, current) => (current.value < worst.value ? current : worst))
  const strengths = splitLead(result.strengths, "No strong signals yet.")
  const risks = splitLead(result.risks, "No obvious risks from the current draft.")
  const suggestions = splitLead(result.suggestions, "Try a tighter opener and a clearer CTA.")
  const rewrittenHooks = result.rewritten_hooks ?? []
  const topFix = fixForResult(result)
  const insight = coachInsight(result)
  const loopMessage = coachingLoopMessage(previousResult, result)
  const scoreDelta =
    previousResult !== null ? deltaLabel(previousResult.overall_score, result.overall_score) : null
  const hookLabels = ["Curiosity-led", "Direct", "Authority"]

  return (
    <aside className="panel result-card">
      <div className="result-top">
        <div>
          <span className="panel-label">Live result</span>
          <h3>Analysis result</h3>
        </div>
        <div className="result-top__right">
          <span className={`score-pill score-pill--${overallTone}`}>{scoreLabel(result.overall_score)}</span>
          {scoreDelta ? (
            <div className={`score-comparison score-comparison--${scoreDelta.tone}`}>
              <span>Previous</span>
              <strong>{previousResult?.overall_score}</strong>
              <span>Current</span>
              <strong>{result.overall_score}</strong>
              <span>Delta</span>
              <strong className="score-comparison__delta">{scoreDelta.text}</strong>
            </div>
          ) : null}
        </div>
      </div>

      {isSubmitting ? (
        <div className="result-rescoring">
          <span className="panel-label">Rescoring</span>
          <strong>Re-scoring your latest edit</strong>
          <p>Keep refining the draft above, then check the updated score right here.</p>
        </div>
      ) : null}

      {loopMessage ? (
        <article className={`result-loop-message result-loop-message--${scoreDelta?.tone ?? "flat"}`}>
          <span className="panel-label">Coaching loop</span>
          <p>{loopMessage}</p>
        </article>
      ) : null}

      <section className="result-summary" aria-label="Analysis summary">
        <div className="summary-stat">
          <span className="summary-label">Strongest area</span>
          <strong>{strongestMetric.label}</strong>
          <p>
            {strongestMetric.value}/100. {strongestMetric.label.toLowerCase()} is the clearest
            signal in the current draft.
          </p>
        </div>
        <div className="summary-stat summary-stat--weak">
          <span className="summary-label">Weakest area</span>
          <strong>{weakestMetric.label}</strong>
          <p>
            {weakestMetric.value}/100. This is the first place to spend editing time.
          </p>
        </div>
        <div className="summary-stat">
          <span className="summary-label">Top Fix</span>
          <strong>{topFix.title}</strong>
          <p>{topFix.why}</p>
        </div>
      </section>

      <div className={`score-hero score-hero--${overallTone}`}>
        <div
          className={`score-badge score-badge--${overallTone}`}
          aria-label={`Overall score ${result.overall_score}`}
        >
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

      <section className="result-next-step" aria-label="Next step">
        <div className="result-next-step__copy">
          <span className="panel-label">Top Fix</span>
          <h4>{topFix.title}</h4>
          <p>{topFix.why}</p>
          <div className="result-next-step__impact">
            <span>Expected impact</span>
            <strong>{topFix.impact}</strong>
          </div>
          <dl className="result-next-step__details">
            <div>
              <dt>Why this matters</dt>
              <dd>{topFix.why}</dd>
            </div>
            <div>
              <dt>What to try next</dt>
              <dd>{topFix.nextStep}</dd>
            </div>
          </dl>
        </div>
        <button className="button button--ghost" type="button" onClick={onRescore}>
          Re-score this draft
        </button>
      </section>

      <article className="coach-insight" aria-label="Coach insight">
        <span className="panel-label">Coach Insight</span>
        <p>{insight}</p>
      </article>

      <section className="hook-rewrite-panel" aria-label="Improved hooks">
        <div className="hook-rewrite-panel__top">
          <div>
            <span className="panel-label">Improved Hooks</span>
            <h4>Rewrite the opener</h4>
            <p>
              Pick the version that feels closest to your voice, then re-score the draft right here.
            </p>
          </div>
        </div>

        {selectedHook ? (
          <div className="hook-applied-banner" aria-live="polite">
            <div>
              <span className="panel-label">Applied hook</span>
              <strong>{selectedHook}</strong>
              <p>Use this version in the form above, then re-score when you’re ready.</p>
            </div>
            <button className="button" type="button" onClick={onRescore}>
              Re-score this draft
            </button>
          </div>
        ) : null}

        <div className="hook-rewrite-grid" id="rewritten-hooks">
          {rewrittenHooks.map((hook, index) => (
            <article
              className="hook-rewrite-card"
              data-applied={selectedHook === hook ? "true" : "false"}
              key={`${hook}-${index}`}
            >
              <div className="hook-rewrite-card__top">
                <div className="hook-rewrite-card__labels">
                  <span className="hook-rewrite-index">
                    {hookLabels[index] ?? `Variation ${index + 1}`}
                  </span>
                  {selectedHook === hook ? (
                    <span className="hook-rewrite-status">Applied</span>
                  ) : null}
                </div>
                <button
                  className="button button--ghost button--tiny"
                  type="button"
                  onClick={() => onUseHook(hook)}
                >
                  Use this hook
                </button>
              </div>
              <p className="hook-rewrite-card__text">{hook}</p>
            </article>
          ))}
        </div>
      </section>

      <article className="result-callout" id="analysis-critique">
        <div className="card-heading">
          <span className="panel-label">Backend readout</span>
          <h4>What the model is telling you</h4>
        </div>
        <p>{result.critique}</p>
        <div className="callout-quote">
          <span className="panel-label">Primary fix</span>
          <strong>{suggestions.lead}</strong>
        </div>
      </article>

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
          <p className="feedback-lead">{strengths.lead}</p>
          {strengths.remainder.length > 0 ? (
            <ul className="feedback-list">
              {strengths.remainder.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </article>

        <article className="feedback-card feedback-card--risks">
          <div className="card-heading">
            <span className="panel-label">Risks</span>
            <h4>What may hold it back</h4>
          </div>
          <p className="feedback-lead feedback-lead--warning">{risks.lead}</p>
          {risks.remainder.length > 0 ? (
            <ul className="feedback-list">
              {risks.remainder.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </article>
      </div>

      <article className="critique-card">
        <div className="card-heading">
          <span className="panel-label">Critique</span>
          <h4>Plain-language feedback</h4>
        </div>
        <p>{result.critique}</p>
      </article>

      <article className="suggestions-card" id="analysis-suggestions">
        <div className="card-heading">
          <span className="panel-label">Suggestions</span>
          <h4>Edits to try next</h4>
        </div>
        <p className="feedback-lead">{suggestions.lead}</p>
        {suggestions.remainder.length > 0 ? (
          <ul className="feedback-list">
            {suggestions.remainder.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
      </article>
    </aside>
  )
}
