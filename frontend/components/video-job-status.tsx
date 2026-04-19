"use client"

type VideoJobPhase = "idle" | "uploading" | "processing" | "generating" | "failed"

type VideoJobStatusProps = {
  phase: VideoJobPhase
  fileName: string | null
  error: string | null
  onRetry: () => void
}

function statusTitle(phase: VideoJobPhase): string | null {
  switch (phase) {
    case "uploading":
      return "Uploading..."
    case "processing":
      return "Processing video..."
    case "generating":
      return "Generating analysis..."
    case "failed":
      return "Video analysis failed"
    case "idle":
    default:
      return null
  }
}

function statusCopy(phase: VideoJobPhase): string | null {
  switch (phase) {
    case "uploading":
      return "We are preparing your video upload and starting the async job."
    case "processing":
      return "The video is being prepared for transcription and scoring."
    case "generating":
      return "The transcript is moving through the scoring pipeline now."
    case "failed":
      return "Try again with the same video or upload a new one."
    case "idle":
    default:
      return null
  }
}

export function VideoJobStatus({
  phase,
  fileName,
  error,
  onRetry,
}: VideoJobStatusProps) {
  if (phase === "idle") {
    return null
  }

  const title = statusTitle(phase)
  const copy = statusCopy(phase)

  return (
    <aside
      className={`panel video-job-status video-job-status--${phase}`}
      aria-live={phase === "failed" ? "assertive" : "polite"}
    >
      <div className="video-job-status__head">
        <div>
          <span className="panel-label">Video analysis</span>
          {title ? <h4>{title}</h4> : null}
        </div>
        {fileName ? <span className="video-job-status__file">{fileName}</span> : null}
      </div>

      {copy ? <p>{copy}</p> : null}

      {error ? <p className="video-job-status__error">{error}</p> : null}

      {phase === "failed" ? (
        <div className="video-job-status__actions">
          <button className="button button--ghost button--tiny" type="button" onClick={onRetry}>
            Retry analysis
          </button>
        </div>
      ) : null}
    </aside>
  )
}
