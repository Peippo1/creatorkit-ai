"use client"

import {
  PROCESSING_STEP_LABELS,
  PROCESSING_STEP_ORDER,
  type ProcessingFlow,
  type ProcessingState,
  type ProcessingStep,
} from "@/lib/processing"

type ProcessingStatusProps = {
  flow: ProcessingFlow
  state: ProcessingState
  step: ProcessingStep | null
  fileName?: string | null
  error?: string | null
  onRetry?: () => void
}

type ProcessingFlowConfig = {
  title: string
  subtitle: string
  helperText: string
  progress: Record<ProcessingState, number>
  stepLabels: Partial<Record<ProcessingState, string>>
  accentClass: string
}

const FLOW_CONFIG: Record<ProcessingFlow, ProcessingFlowConfig> = {
  script: {
    title: "Generating your draft",
    subtitle: "We are shaping your idea into a first pass and checking where coaching will help.",
    helperText: "This usually takes a few seconds.",
    progress: {
      idle: 0,
      uploading: 20,
      transcribing: 35,
      scoring: 55,
      coaching: 82,
      complete: 100,
      error: 100,
    },
    stepLabels: {
      scoring: "Writing your draft",
      coaching: "Preparing coaching feedback",
      complete: "Your draft is ready",
    },
    accentClass:
      "border-[rgba(31,94,255,0.18)] bg-[linear-gradient(135deg,rgba(31,94,255,0.08),rgba(255,255,255,0.9))]",
  },
  analysis: {
    title: "Scoring your draft",
    subtitle: "We are reading the draft, checking the structure, and preparing the next edit.",
    helperText: "This usually takes a few seconds.",
    progress: {
      idle: 0,
      uploading: 18,
      transcribing: 32,
      scoring: 58,
      coaching: 84,
      complete: 100,
      error: 100,
    },
    stepLabels: {
      scoring: "Scoring your draft",
      coaching: "Preparing coaching feedback",
      complete: "Your draft is ready",
    },
    accentClass:
      "border-[rgba(31,94,255,0.14)] bg-[linear-gradient(135deg,rgba(31,94,255,0.06),rgba(255,255,255,0.92))]",
  },
  video: {
    title: "Processing your video",
    subtitle: "We are uploading the file, turning it into text, and moving it through scoring.",
    helperText: "Larger files can take a little longer.",
    progress: {
      idle: 0,
      uploading: 16,
      transcribing: 36,
      scoring: 64,
      coaching: 86,
      complete: 100,
      error: 100,
    },
    stepLabels: {
      uploading: "Uploading your video",
      transcribing: "Turning video into draft text",
      scoring: "Scoring your draft",
      coaching: "Preparing coaching feedback",
      complete: "Your draft is ready",
    },
    accentClass:
      "border-[rgba(15,157,88,0.16)] bg-[linear-gradient(135deg,rgba(15,157,88,0.08),rgba(255,255,255,0.92))]",
  },
}

function titleFor(flow: ProcessingFlow, state: ProcessingState): string {
  if (state === "error") {
    return flow === "video" ? "Video processing paused" : "Processing paused"
  }

  return FLOW_CONFIG[flow].title
}

function subtitleFor(
  flow: ProcessingFlow,
  state: ProcessingState,
  error: string | null | undefined,
): string {
  if (state === "error") {
    return error ?? "We hit a problem while handling your draft. You can retry without losing your work."
  }

  return FLOW_CONFIG[flow].subtitle
}

function helperTextFor(flow: ProcessingFlow, state: ProcessingState): string {
  switch (state) {
    case "complete":
      return "Review the result below and keep iterating."
    case "error":
      return "Retry to continue from the same draft."
    case "uploading":
      return flow === "video" ? "This usually takes a few seconds." : "Preparing your draft now."
    case "transcribing":
      return flow === "video"
        ? "Turning the source into usable text."
        : "Organizing the draft for scoring."
    case "scoring":
      return "Measuring the draft before coaching feedback is assembled."
    case "coaching":
      return "Finishing the feedback so you can act on the next step."
    case "idle":
    default:
      return FLOW_CONFIG[flow].helperText
  }
}

function progressFor(flow: ProcessingFlow, state: ProcessingState): number {
  return FLOW_CONFIG[flow].progress[state]
}

function currentStepLabel(flow: ProcessingFlow, state: ProcessingState): string {
  if (state === "error") {
    return "Retry available"
  }

  return FLOW_CONFIG[flow].stepLabels[state] ?? FLOW_CONFIG[flow].title
}

function stepIndex(step: ProcessingStep | null): number {
  if (!step) {
    return -1
  }

  return PROCESSING_STEP_ORDER.indexOf(step)
}

export function ProcessingStatus({
  flow,
  state,
  step,
  fileName,
  error,
  onRetry,
}: ProcessingStatusProps) {
  if (state === "idle") {
    return null
  }

  const progress = progressFor(flow, state)
  const activeStepIndex = stepIndex(step)
  const showErrorTone = state === "error"

  return (
    <aside
      className={[
        "mx-auto w-full max-w-[560px] justify-self-center rounded-[28px] border p-5 shadow-[0_20px_60px_rgba(23,19,18,0.12)] backdrop-blur-md transition-[background-color,border-color,opacity,transform] duration-200 ease-out md:p-6",
        "border-[color:var(--line)] bg-[color:var(--panel)]",
        FLOW_CONFIG[flow].accentClass,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-live={showErrorTone ? "assertive" : "polite"}
      aria-busy={!showErrorTone && state !== "complete"}
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4">
          <div className="min-w-0">
            <span className="inline-flex items-center rounded-full bg-[rgba(31,94,255,0.1)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[color:var(--accent)]">
              Processing
            </span>
            <h4 className="mt-3 text-[1.05rem] font-semibold tracking-[-0.03em] text-[color:var(--text)]">
              {titleFor(flow, state)}
            </h4>
            <p className="mt-2 max-w-[62ch] text-sm leading-6 text-[color:var(--muted)]">
              {subtitleFor(flow, state, error)}
            </p>
          </div>

          {fileName ? (
            <span className="inline-flex max-w-full items-center overflow-hidden rounded-full border border-[rgba(23,19,18,0.08)] bg-[rgba(255,255,255,0.82)] px-3 py-2 text-xs font-semibold text-[color:var(--muted)]">
              <span className="truncate" title={fileName}>
                {fileName}
              </span>
            </span>
          ) : null}
        </div>

        <div
          className="h-2.5 overflow-hidden rounded-full bg-[rgba(23,19,18,0.08)]"
          aria-label={`Processing progress ${progress}%`}
        >
          <span
            className="block h-full rounded-full bg-gradient-to-r from-[color:var(--accent)] to-[color:var(--accent-2)] transition-[width] duration-200 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="rounded-2xl border border-[rgba(23,19,18,0.08)] bg-[rgba(255,255,255,0.72)] p-4">
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[color:var(--muted)]">
            Current step
          </span>
          <strong className="mt-2 block text-sm font-semibold text-[color:var(--text)]">
            {currentStepLabel(flow, state)}
          </strong>
          <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
            {helperTextFor(flow, state)}
          </p>
        </div>

        <div className="relative">
          <div className="absolute left-2.5 top-3 bottom-3 w-px bg-[rgba(23,19,18,0.08)] sm:hidden" />
          <div className="absolute left-4 right-4 top-[0.875rem] hidden h-px bg-[rgba(23,19,18,0.08)] sm:block" />

          <ol className="grid gap-2 sm:grid-cols-4 sm:gap-3" aria-label="Processing steps">
            {PROCESSING_STEP_ORDER.map((stage, index) => {
              const isActive = index === activeStepIndex
              const isComplete = activeStepIndex >= 0 && index < activeStepIndex

              return (
                <li
                  className="relative flex items-start gap-3 rounded-2xl px-1 py-1 sm:flex-col sm:items-start sm:px-0 sm:py-0"
                  key={stage}
                >
                  <span
                    className={[
                      "mt-0.5 inline-flex h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-[rgba(255,255,255,0.72)] transition-colors duration-200 sm:mt-0",
                      isActive
                        ? "bg-[color:var(--accent)] ring-[rgba(31,94,255,0.14)]"
                        : isComplete
                          ? "bg-[color:var(--success)] ring-[rgba(15,157,88,0.12)]"
                          : "bg-[rgba(23,19,18,0.22)] ring-[rgba(255,255,255,0.72)]",
                    ].join(" ")}
                    aria-hidden="true"
                  />

                  <div className="min-w-0">
                    <span
                      className={[
                        "block text-xs font-semibold tracking-[0.01em] transition-colors duration-200",
                        isActive || isComplete
                          ? "text-[color:var(--text)]"
                          : "text-[color:var(--muted)]",
                      ].join(" ")}
                    >
                      {PROCESSING_STEP_LABELS[stage]}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-4 text-[color:var(--muted)]">
                      {isActive ? "Current" : isComplete ? "Completed" : "Upcoming"}
                    </span>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>

        {error ? <p className="text-sm leading-6 text-[#9a3412]">{error}</p> : null}

        {state === "error" && onRetry ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              className="inline-flex items-center justify-center rounded-full border border-[rgba(31,94,255,0.22)] bg-[rgba(31,94,255,0.08)] px-4 py-2 text-sm font-semibold text-[color:var(--accent)] transition duration-200 ease-out hover:bg-[rgba(31,94,255,0.14)]"
              type="button"
              onClick={onRetry}
            >
              Retry
            </button>
          </div>
        ) : null}
      </div>
    </aside>
  )
}
