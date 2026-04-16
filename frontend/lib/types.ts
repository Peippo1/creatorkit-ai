export type AnalyzeInput = {
  platform: string
  content_type: string
  hook: string
  caption: string
  transcript: string
  duration_seconds: number
  niche: string
  has_cta: boolean
}

export type AnalyzeOutput = {
  overall_score: number
  hook_score: number
  clarity_score: number
  platform_fit_score: number
  strengths: string[]
  risks: string[]
  critique: string
  suggestions: string[]
}
