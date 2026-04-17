"use client"

import { useEffect, useState } from "react"
import type { FormEvent } from "react"

import { analyzeContent, listAnalysisHistory, listSavedDrafts, saveDraft } from "@/lib/api"
import { getAnalysisSessionId } from "@/lib/session"
import type {
  AnalyzeRequest,
  AnalyzeResponse,
  AnalysisHistoryEntry,
  SavedDraftEntry,
} from "@/lib/types"

import { AnalysisForm } from "./analysis-form"
import { AnalysisHistory } from "./analysis-history"
import { DraftComparison } from "./draft-comparison"
import { ResultCard } from "./result-card"

const DEFAULT_FORM: AnalyzeRequest = {
  platform: "TikTok",
  content_type: "Short-form video",
  hook: "Most creators miss this one edit before publishing.",
  caption: "A creator-focused draft that needs a fast pre-publish review.",
  transcript:
    "In this draft, we show how to tighten the opening, clarify the value, and end with a stronger call to action.",
  duration_seconds: 35,
  niche: "creator education",
  has_cta: true,
}

function chooseSelectedDraftId(
  currentId: number | null,
  drafts: SavedDraftEntry[],
): number | null {
  if (currentId !== null && drafts.some((draft) => draft.id === currentId)) {
    return currentId
  }

  return drafts[0]?.id ?? null
}

export function AnalysisWorkspace() {
  const [form, setForm] = useState<AnalyzeRequest>(DEFAULT_FORM)
  const [result, setResult] = useState<AnalyzeResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [clientId, setClientId] = useState<string | null>(null)
  const [historyEntries, setHistoryEntries] = useState<AnalysisHistoryEntry[]>([])
  const [isHistoryLoading, setIsHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [draftEntries, setDraftEntries] = useState<SavedDraftEntry[]>([])
  const [isDraftsLoading, setIsDraftsLoading] = useState(true)
  const [draftsError, setDraftsError] = useState<string | null>(null)
  const [selectedDraftId, setSelectedDraftId] = useState<number | null>(null)

  useEffect(() => {
    setClientId(getAnalysisSessionId())
  }, [])

  useEffect(() => {
    if (!clientId) {
      return
    }

    let cancelled = false

    async function loadWorkspaceData() {
      setIsHistoryLoading(true)
      setIsDraftsLoading(true)
      setHistoryError(null)
      setDraftsError(null)

      const [historyResult, draftsResult] = await Promise.allSettled([
        listAnalysisHistory(clientId),
        listSavedDrafts(clientId),
      ])

      if (cancelled) {
        return
      }

      if (historyResult.status === "fulfilled") {
        setHistoryEntries(historyResult.value.entries)
      } else {
        setHistoryError(
          historyResult.reason instanceof Error
            ? historyResult.reason.message
            : "Unable to load history",
        )
      }

      if (draftsResult.status === "fulfilled") {
        setDraftEntries(draftsResult.value.entries)
        setSelectedDraftId((current) =>
          chooseSelectedDraftId(current, draftsResult.value.entries),
        )
      } else {
        setDraftsError(
          draftsResult.reason instanceof Error
            ? draftsResult.reason.message
            : "Unable to load saved drafts",
        )
      }

      setIsHistoryLoading(false)
      setIsDraftsLoading(false)
    }

    void loadWorkspaceData()

    return () => {
      cancelled = true
    }
  }, [clientId])

  async function refreshHistory(nextClientId: string) {
    try {
      const response = await listAnalysisHistory(nextClientId)
      setHistoryEntries(response.entries)
      setHistoryError(null)
    } catch (historyLoadError) {
      setHistoryError(
        historyLoadError instanceof Error ? historyLoadError.message : "Unable to load history",
      )
    }
  }

  async function refreshDrafts(nextClientId: string, preferredDraftId: number | null = null) {
    try {
      const response = await listSavedDrafts(nextClientId)
      setDraftEntries(response.entries)
      setSelectedDraftId((current) =>
        preferredDraftId ?? chooseSelectedDraftId(current, response.entries),
      )
      setDraftsError(null)
    } catch (draftLoadError) {
      setDraftsError(
        draftLoadError instanceof Error ? draftLoadError.message : "Unable to load saved drafts",
      )
    }
  }

  function updateField<K extends keyof AnalyzeRequest>(field: K, nextValue: AnalyzeRequest[K]) {
    setForm((current) => ({
      ...current,
      [field]: nextValue,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setResult(null)

    try {
      const nextClientId = clientId ?? getAnalysisSessionId()
      if (!clientId) {
        setClientId(nextClientId)
      }
      const analysis = await analyzeContent(form, nextClientId)
      setResult(analysis)
      await refreshHistory(nextClientId)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to analyze draft")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSaveDraft() {
    setIsSavingDraft(true)
    setDraftsError(null)

    try {
      const nextClientId = clientId ?? getAnalysisSessionId()
      if (!clientId) {
        setClientId(nextClientId)
      }
      const saved = await saveDraft(form, nextClientId)
      await refreshDrafts(nextClientId, saved.entry.id)
    } catch (draftSaveError) {
      setDraftsError(
        draftSaveError instanceof Error ? draftSaveError.message : "Unable to save draft",
      )
    } finally {
      setIsSavingDraft(false)
    }
  }

  return (
    <div className="workspace-grid">
      <AnalysisForm
        value={form}
        isSubmitting={isSubmitting}
        isSavingDraft={isSavingDraft}
        onSubmit={handleSubmit}
        onSaveDraft={handleSaveDraft}
        onFieldChange={updateField}
      />

      <div className="result-stack">
        {error ? (
          <aside className="panel error-panel" role="alert">
            <h2>Backend error</h2>
            <p>{error}</p>
            <p className="muted">Start the FastAPI backend and try again.</p>
          </aside>
        ) : null}

        <ResultCard result={result} isSubmitting={isSubmitting} />
        <AnalysisHistory entries={historyEntries} isLoading={isHistoryLoading} error={historyError} />
        <DraftComparison
          drafts={draftEntries}
          selectedDraftId={selectedDraftId}
          currentDraft={form}
          isLoading={isDraftsLoading}
          error={draftsError}
          onSelectDraft={(draftId) => setSelectedDraftId(draftId)}
        />
      </div>
    </div>
  )
}
