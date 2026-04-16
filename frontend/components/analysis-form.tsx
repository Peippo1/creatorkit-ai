import type { FormEvent } from "react"

import type { AnalyzeRequest } from "@/lib/types"

type AnalysisFormProps = {
  value: AnalyzeRequest
  isSubmitting: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
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
  onSubmit,
  onFieldChange,
}: AnalysisFormProps) {
  return (
    <form className="panel form" onSubmit={onSubmit}>
      <div>
        <h2>Draft analysis</h2>
        <p>Submit a draft or idea and get a quick pre-publish review.</p>
      </div>

      <div className="form-grid">
        <div className="field">
          <label htmlFor="platform">Platform</label>
          <select
            id="platform"
            value={value.platform}
            onChange={(event) => onFieldChange("platform", event.target.value)}
          >
            {PLATFORM_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="content_type">Content type</label>
          <select
            id="content_type"
            value={value.content_type}
            onChange={(event) => onFieldChange("content_type", event.target.value)}
          >
            {CONTENT_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="duration_seconds">Duration seconds</label>
          <input
            id="duration_seconds"
            type="number"
            min={1}
            step={1}
            value={value.duration_seconds}
            onChange={(event) => onFieldChange("duration_seconds", Number(event.target.value))}
          />
        </div>

        <div className="field">
          <label htmlFor="niche">Niche</label>
          <input
            id="niche"
            value={value.niche}
            onChange={(event) => onFieldChange("niche", event.target.value)}
            placeholder="e.g. fitness creators"
          />
        </div>

        <div className="field full">
          <label htmlFor="hook">Hook</label>
          <input
            id="hook"
            value={value.hook}
            onChange={(event) => onFieldChange("hook", event.target.value)}
            placeholder="The first line or opening angle"
          />
          <p className="help">Keep the hook tight and specific.</p>
        </div>

        <div className="field full">
          <label htmlFor="caption">Caption</label>
          <textarea
            id="caption"
            value={value.caption}
            onChange={(event) => onFieldChange("caption", event.target.value)}
            placeholder="Paste the caption or post copy"
          />
        </div>

        <div className="field full">
          <label htmlFor="transcript">Transcript</label>
          <textarea
            id="transcript"
            value={value.transcript}
            onChange={(event) => onFieldChange("transcript", event.target.value)}
            placeholder="Paste the spoken script or body copy"
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
        <span className="secondary">This connects to the local FastAPI backend.</span>
      </div>
    </form>
  )
}
