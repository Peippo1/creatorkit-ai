"use client"

import { useId, useState } from "react"
import type { ChangeEvent, DragEvent, KeyboardEvent } from "react"

type UploadCardProps = {
  videoFile: File | null
  videoPreviewUrl: string | null
  videoDurationSeconds: number | null
  onVideoSelect: (file: File | null) => void
}

function isSupportedVideoFile(file: File | null): file is File {
  if (!file) {
    return false
  }

  const loweredName = file.name.toLowerCase()
  return file.type.startsWith("video/") || loweredName.endsWith(".mp4") || loweredName.endsWith(".mov")
}

function formatDuration(totalSeconds: number | null): string | null {
  if (!totalSeconds || !Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return null
  }

  const rounded = Math.round(totalSeconds)
  const minutes = Math.floor(rounded / 60)
  const seconds = rounded % 60

  if (minutes <= 0) {
    return `${seconds}s`
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`
}

export function UploadCard({
  videoFile,
  videoPreviewUrl,
  videoDurationSeconds,
  onVideoSelect,
}: UploadCardProps) {
  const inputId = useId()
  const [isDragOver, setIsDragOver] = useState(false)

  function openPicker() {
    const input = document.getElementById(inputId) as HTMLInputElement | null
    input?.click()
  }

  function handleVideoInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    onVideoSelect(isSupportedVideoFile(file) ? file : null)
    event.target.value = ""
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragOver(false)
    const file = event.dataTransfer.files?.[0] ?? null
    onVideoSelect(isSupportedVideoFile(file) ? file : null)
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragOver(true)
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragOver(false)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      openPicker()
    }
  }

  const durationLabel = formatDuration(videoDurationSeconds)

  return (
    <section className="upload-card" aria-label="Video upload">
      <input
        id={inputId}
        className="sr-only"
        type="file"
        accept=".mp4,.mov,video/mp4,video/quicktime"
        onChange={handleVideoInputChange}
      />

      <div
        className={[
          "upload-card__dropzone",
          videoFile ? "upload-card__dropzone--filled" : "",
          isDragOver ? "upload-card__dropzone--drag-over" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        role="button"
        tabIndex={0}
        onClick={openPicker}
        onKeyDown={handleKeyDown}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="upload-card__top">
          <div>
            <span className="panel-label">Video upload</span>
            <h3>{videoFile ? "Video added" : "Drop a video or tap to browse"}</h3>
          </div>
          <span className="upload-card__status">
            {videoFile ? "Added" : isDragOver ? "Drop now" : "Ready"}
          </span>
        </div>

        <p className="upload-card__copy">
          {videoFile
            ? "Add a transcript or description for best results."
            : "Drag and drop a video here, or click to choose a file."}
        </p>

        {videoFile ? (
          <div className="upload-card__meta" aria-live="polite">
            <strong title={videoFile.name}>{videoFile.name}</strong>
            {durationLabel ? <span>{durationLabel}</span> : null}
          </div>
        ) : null}

        <div className="upload-card__actions">
          <button
            className="button button--ghost button--tiny"
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              openPicker()
            }}
          >
            Browse files
          </button>
          {videoFile ? (
            <button
              className="button button--ghost button--tiny"
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                onVideoSelect(null)
              }}
            >
              Remove
            </button>
          ) : null}
        </div>
      </div>

      {videoFile && videoPreviewUrl ? (
        <div className="upload-card__preview" aria-live="polite">
          <video controls muted playsInline src={videoPreviewUrl} />
        </div>
      ) : null}

      {!videoFile ? (
        <p className="upload-card__hint">Mobile users can tap to browse. Files stay in your browser.</p>
      ) : null}
    </section>
  )
}
