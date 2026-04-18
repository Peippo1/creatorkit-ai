import type { FormEvent } from "react"

import type { AnalyzeRequest } from "@/lib/types"

type AnalysisFormProps = {
  value: AnalyzeRequest
  isSubmitting: boolean
  isSavingDraft: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onSaveDraft: () => void
  onFieldChange: <K extends keyof AnalyzeRequest>(field: K, nextValue: AnalyzeRequest[K]) => void
}

const PLATFORM_OPTIONS = [
  "TikTok",
  "Instagram Reels",
  "YouTube Shorts",
  "YouTube",
  "LinkedIn",
  "X",
  "Threads",
]

const CONTENT_TYPE_OPTIONS = [
  "Short-form video",
  "Hook-led video",
  "Educational carousel",
  "Tutorial",
  "Thread",
  "Post draft",
  "Long-form script",
]

export function AnalysisForm({
  value,
  isSubmitting,
  isSavingDraft,
  onSubmit,
  onSaveDraft,
  onFieldChange,
}: AnalysisFormProps) {
  return (
    <form className="panel form" onSubmit={onSubmit}>
      <div className="form-intro">
        <span className="panel-label">Input</span>
        <h3>Draft analysis</h3>
        <p>Submit a draft or idea and get a quick pre-publish review.</p>
      </div>

      <div className="form-grid">
        <div className="field">
          <label htmlFor="platform">Publishing platform</label>
          <select
            id="platform"
            value={value.platform}
            onChange={(event) => onFieldChange("platform", event.target.value)}
            required
          >
            {PLATFORM_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="content_type">Content format</label>
          <select
            id="content_type"
            value={value.content_type}
            onChange={(event) => onFieldChange("content_type", event.target.value)}
            required
          >
            {CONTENT_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="duration_seconds">Duration in seconds</label>
          <input
            id="duration_seconds"
            type="number"
            min={1}
            step={1}
            value={value.duration_seconds}
            onChange={(event) => onFieldChange("duration_seconds", Number(event.target.value))}
            required
            placeholder="35"
          />
        </div>

        <div className="field">
          <label htmlFor="niche">Audience niche</label>
          <input
            id="niche"
            value={value.niche}
            onChange={(event) => onFieldChange("niche", event.target.value)}
            placeholder="e.g. fitness creators"
            required
          />
        </div>

        <div className="field full">
          <label htmlFor="hook">Hook / opener</label>
          <input
            id="hook"
            value={value.hook}
            onChange={(event) => onFieldChange("hook", event.target.value)}
            placeholder="Lead with the strongest idea"
            required
          />
          <small>Keep this tight, specific, and worth stopping for.</small>
        </div>

        <div className="field full">
          <label htmlFor="caption">Caption / post copy</label>
          <textarea
            id="caption"
            value={value.caption}
            onChange={(event) => onFieldChange("caption", event.target.value)}
            placeholder="Paste the caption or post copy"
            required
          />
          <small>Short captions can still be useful if they carry the idea clearly.</small>
        </div>

        <div className="field full">
          <label htmlFor="transcript">Transcript / long-form copy</label>
          <textarea
            id="transcript"
            value={value.transcript}
            onChange={(event) => onFieldChange("transcript", event.target.value)}
            placeholder="Paste the spoken script or body copy"
            required
          />
        </div>
      </div>

      <label className="check-row" htmlFor="has_cta">
        <input
          id="has_cta"
          type="checkbox"
          checked={value.has_cta}
          onChange={(event) => onFieldChange("has_cta", event.target.checked)}
        />
        Includes a clear call to action
      </label>

      <div className="actions">
        <button className="button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Analyzing..." : "Analyze draft"}
        </button>
        <button
          className="button button--ghost"
          type="button"
          onClick={onSaveDraft}
          disabled={isSavingDraft || isSubmitting}
        >
          {isSavingDraft ? "Saving..." : "Save draft"}
        </button>
        <span className="helper">Uses your configured API endpoint.</span>
      </div>
    </form>
  )
}
