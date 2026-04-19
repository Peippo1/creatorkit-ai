"use client"

import type { FormEvent } from "react"

import type { AnalyzeRequest } from "@/lib/types"

import { UploadCard } from "./upload-card"

type AnalysisFormProps = {
  value: AnalyzeRequest
  isSubmitting: boolean
  isSavingDraft: boolean
  isGeneratingScript: boolean
  isProcessingActive: boolean
  draftIdea: string
  videoFile: File | null
  videoPreviewUrl: string | null
  videoDurationSeconds: number | null
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onGenerateScript: () => void
  onSaveDraft: () => void
  onDraftIdeaChange: (value: string) => void
  onFieldChange: <K extends keyof AnalyzeRequest>(field: K, nextValue: AnalyzeRequest[K]) => void
  onVideoSelect: (file: File | null) => void
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
  { value: "short_video", label: "Short-form video" },
  { value: "hook_led_video", label: "Hook-led video" },
  { value: "educational_carousel", label: "Educational carousel" },
  { value: "tutorial", label: "Tutorial" },
  { value: "thread", label: "Thread" },
  { value: "text_post", label: "Post draft" },
  { value: "long_form", label: "Long-form script" },
]

export function AnalysisForm({
  value,
  isSubmitting,
  isSavingDraft,
  isGeneratingScript,
  isProcessingActive,
  draftIdea,
  videoFile,
  videoPreviewUrl,
  videoDurationSeconds,
  onSubmit,
  onGenerateScript,
  onSaveDraft,
  onDraftIdeaChange,
  onFieldChange,
  onVideoSelect,
}: AnalysisFormProps) {
  return (
    <form className="panel form" onSubmit={onSubmit}>
      <div className="form-intro">
        <span className="panel-label">Input</span>
        <h3>Upload a video or start with a script</h3>
        <p>Begin with a clip, or draft the script first and refine it before analysing.</p>
      </div>

      <section className="draft-generator" aria-label="Generate a draft">
        <div className="draft-generator__header">
          <div>
            <span className="panel-label">Generate a draft</span>
            <h4>What&apos;s your idea?</h4>
            <p>Turn a rough angle into a first draft using your current platform, format, and niche.</p>
          </div>
          <button
            className="button button--ghost"
            type="button"
            onClick={onGenerateScript}
            disabled={isSubmitting || isSavingDraft || isGeneratingScript || isProcessingActive}
          >
            {isGeneratingScript ? "Generating draft..." : "Generate script ✨"}
          </button>
        </div>

        <label className="field field--bare" htmlFor="draft_idea">
          <span className="sr-only">What&apos;s your idea?</span>
          <input
            id="draft_idea"
            value={draftIdea}
            onChange={(event) => onDraftIdeaChange(event.target.value)}
            placeholder="e.g. show creators how to turn one post into three hooks"
            autoComplete="off"
          />
        </label>

        <div className="draft-generator__meta">
          <span className="tag">{value.platform}</span>
          <span className="tag">
            {CONTENT_TYPE_OPTIONS.find((option) => option.value === value.content_type)?.label ??
              value.content_type}
          </span>
          <span className="tag">{value.niche || "Your niche"}</span>
        </div>

        <p className="form-note">Use this as a starting point — edit before analysing.</p>
      </section>

      <UploadCard
        videoFile={videoFile}
        videoPreviewUrl={videoPreviewUrl}
        videoDurationSeconds={videoDurationSeconds}
        onVideoSelect={onVideoSelect}
      />

      <div className="form-divider" aria-hidden="true">
        <span>OR</span>
      </div>

      <div className="form-grid form-grid--script">
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
              <option key={option.value} value={option.value}>
                {option.label}
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
        <button
          className="button"
          type="submit"
          disabled={isSubmitting || isGeneratingScript || isProcessingActive}
        >
          {isSubmitting ? "Analyzing..." : "Analyze draft"}
        </button>
        <button
          className="button button--ghost"
          type="button"
          onClick={onSaveDraft}
          disabled={isSavingDraft || isSubmitting || isGeneratingScript || isProcessingActive}
        >
          {isSavingDraft ? "Saving..." : "Save draft"}
        </button>
      </div>

      <div className="form-notes">
        <span className="helper">You can still write the draft manually below if you prefer.</span>
      </div>

      <p className="trust-note">
        <strong>Trust note:</strong> We do not use your content to train models.
      </p>
    </form>
  )
}
