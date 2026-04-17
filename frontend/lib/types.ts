export type AnalyzeRequest = {
  platform: string
  content_type: string
  hook: string
  caption: string
  transcript: string
  duration_seconds: number
  niche: string
  has_cta: boolean
}

export type AnalyzeResponse = {
  overall_score: number
  hook_score: number
  clarity_score: number
  platform_fit_score: number
  strengths: string[]
  risks: string[]
  critique: string
  suggestions: string[]
}

export type AnalyzeInput = AnalyzeRequest
export type AnalyzeOutput = AnalyzeResponse

export type AnalysisHistoryEntry = {
  id: number
  created_at: string
  platform: string
  content_type: string
  niche: string
  duration_seconds: number
  overall_score: number
  hook_score: number
  clarity_score: number
  platform_fit_score: number
  critique: string
  top_suggestion: string
}

export type AnalysisHistoryResponse = {
  entries: AnalysisHistoryEntry[]
}
