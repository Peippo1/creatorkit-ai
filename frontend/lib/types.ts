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
  rewritten_hooks: string[]
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

export type SavedDraftEntry = {
  id: number
  created_at: string
  title: string
  request: AnalyzeRequest
}

export type SavedDraftResponse = {
  entry: SavedDraftEntry
}

export type SavedDraftsResponse = {
  entries: SavedDraftEntry[]
}

export type SessionClearResponse = {
  analyses_deleted: number
  drafts_deleted: number
  sessions_deleted: number
}

export type CreatorAccountEntry = {
  account_key: string
  provider: string
  email: string
  display_name: string
  niche: string
  brand_name: string
  preferred_platform: string
  created_at: string
  updated_at: string
}

export type CreatorAccountResponse = {
  account: CreatorAccountEntry
  analyses_count: number
  drafts_count: number
}

export type CreatorAccountUpdate = {
  email?: string | null
  display_name?: string | null
  niche?: string | null
  brand_name?: string | null
  preferred_platform?: string | null
}
