"use client"

import type { DragEvent, ChangeEvent, FormEvent } from "react"

import type { AnalyzeRequest } from "@/lib/types"

type AnalysisFormProps = {
  value: AnalyzeRequest
  isSubmitting: boolean
  isSavingDraft: boolean
  videoFile: File | null
  videoPreviewUrl: string | null
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onSaveDraft: () => void
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

function isSupportedVideoFile(file: File | null): file is File {
  if (!file) {
    return false
  }

  const loweredName = file.name.toLowerCase()
  return file.type.startsWith("video/") || loweredName.endsWith(".mp4") || loweredName.endsWith(".mov")
}

export function AnalysisForm({
  value,
  isSubmitting,
  isSavingDraft,
  videoFile,
  videoPreviewUrl,
  onSubmit,
  onSaveDraft,
  onFieldChange,
  onVideoSelect,
}: AnalysisFormProps) {
  function handleVideoInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    onVideoSelect(isSupportedVideoFile(file) ? file : null)
  }

  function handleVideoDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0] ?? null
    onVideoSelect(isSupportedVideoFile(file) ? file : null)
  }

  function handleVideoDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
  }

  return (
    <form className="panel form" onSubmit={onSubmit}>
      <div className="form-intro">
        <span className="panel-label">Input</span>
        <h3>Upload your video or paste your script</h3>
        <p>Analyze the hook, caption, and transcript while keeping video uploads local for now.</p>
      </div>

      <section className="video-upload" aria-label="Video upload">
        <input
          id="video_upload"
          className="sr-only"
          type="file"
          accept=".mp4,.mov,video/mp4,video/quicktime"
          onChange={handleVideoInputChange}
        />
        <div
          className={`video-upload__dropzone${videoFile ? " video-upload__dropzone--active" : ""}`}
          onDrop={handleVideoDrop}
          onDragOver={handleVideoDragOver}
        >
          <span className="panel-label">Video upload</span>
          <strong>{videoFile ? "Video selected" : "Drag and drop a video here"}</strong>
          <p>{videoFile ? videoFile.name : "MP4 or MOV files only. The file stays in your browser."}</p>
          <div className="video-upload__actions">
            <label className="button button--ghost button--tiny video-upload__button" htmlFor="video_upload">
              Choose video
            </label>
            {videoFile ? (
              <button
                className="button button--ghost button--tiny"
                type="button"
                onClick={(event) => {
                  event.preventDefault()
                  onVideoSelect(null)
                }}
              >
                Remove
              </button>
            ) : null}
          </div>
        </div>

        {videoFile ? (
          <div className="video-upload__preview" aria-live="polite">
            {videoPreviewUrl ? (
              <video controls muted playsInline src={videoPreviewUrl} />
            ) : null}
            <p className="video-upload__note">Add a transcript or description for best results.</p>
          </div>
        ) : (
          <p className="video-upload__note">Upload your video, or keep working with a script-only draft.</p>
        )}
      </section>

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

      <p className="trust-note">
        <strong>Trust note:</strong> We do not use your content to train models.
      </p>
    </form>
  )
}
