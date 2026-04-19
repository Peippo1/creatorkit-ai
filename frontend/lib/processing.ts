export type ProcessingState =
  | "idle"
  | "uploading"
  | "transcribing"
  | "scoring"
  | "coaching"
  | "complete"
  | "error"

export type ProcessingFlow = "script" | "analysis" | "video"

export type ProcessingStep = "upload" | "transcript" | "score" | "feedback"

export const PROCESSING_STEP_ORDER: ProcessingStep[] = [
  "upload",
  "transcript",
  "score",
  "feedback",
]

export const PROCESSING_STEP_LABELS: Record<ProcessingStep, string> = {
  upload: "Upload",
  transcript: "Transcript",
  score: "Score",
  feedback: "Feedback",
}
