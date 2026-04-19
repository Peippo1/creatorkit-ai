"use client"

import { useEffect, useState } from "react"
import type { FormEvent } from "react"

import {
  analyzeContent,
  clearSession,
  listAnalysisHistory,
  listSavedDrafts,
  saveDraft,
} from "@/lib/api"
import { clearAnalysisSession, getAnalysisSessionId } from "@/lib/session"
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
  content_type: "short_video",
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

function hasSessionId(value: string | null): value is string {
  return typeof value === "string" && /^session:[A-Za-z0-9._:-]{8,160}$/.test(value)
}

export function AnalysisWorkspace() {
  const [form, setForm] = useState<AnalyzeRequest>(DEFAULT_FORM)
  const [result, setResult] = useState<AnalyzeResponse | null>(null)
  const [previousResult, setPreviousResult] = useState<AnalyzeResponse | null>(null)
  const [analyzedHook, setAnalyzedHook] = useState<string | null>(null)
  const [appliedHook, setAppliedHook] = useState<string | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [isClearingSession, setIsClearingSession] = useState(false)
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
    if (!hasSessionId(clientId)) {
      return
    }

    let cancelled = false

    async function loadWorkspaceData() {
      setIsHistoryLoading(true)
      setIsDraftsLoading(true)
      setHistoryError(null)
      setDraftsError(null)

      const historyRequest = listAnalysisHistory(clientId ?? undefined)
      const draftsRequest = listSavedDrafts(clientId ?? undefined)

      const [historyResult, draftsResult] = await Promise.allSettled([historyRequest, draftsRequest])

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
    if (!hasSessionId(nextClientId)) {
      console.warn("[AnalysisWorkspace] skipped history refresh without a valid session id", {
        clientId: nextClientId,
      })
      return
    }

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
    if (!hasSessionId(nextClientId)) {
      console.warn("[AnalysisWorkspace] skipped drafts refresh without a valid session id", {
        clientId: nextClientId,
      })
      return
    }

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
    if (field === "hook") {
      setAppliedHook((current) => (current === nextValue ? current : null))
    }
  }

  async function runAnalysis(nextDraft: AnalyzeRequest) {
    const nextSessionId = clientId ?? getAnalysisSessionId()
    if (!clientId) {
      setClientId(nextSessionId)
    }

    if (!hasSessionId(nextSessionId)) {
      const message = "Unable to analyze draft: missing session identifier"
      setAnalysisError(message)
      console.warn("[AnalysisWorkspace] skipped analysis without a valid session id", {
        clientId: nextSessionId,
        draft: nextDraft,
      })
      return
    }

    setIsSubmitting(true)
    setAnalysisError(null)
    if (result) {
      setPreviousResult(result)
    }

    try {
      const analysis = await analyzeContent(nextDraft, nextSessionId)
      setResult(analysis)
      setAnalyzedHook(nextDraft.hook)
      await refreshHistory(nextSessionId)
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "Unable to analyze draft"
      setAnalysisError(message)
      console.error("[AnalysisWorkspace] analyze draft failed", {
        message,
        clientId: nextSessionId,
        draft: nextDraft,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await runAnalysis(form)
  }

  async function handleSaveDraft() {
    setIsSavingDraft(true)
    setDraftsError(null)

    try {
      const nextSessionId = clientId ?? getAnalysisSessionId()
      if (!clientId) {
        setClientId(nextSessionId)
      }
      if (!hasSessionId(nextSessionId)) {
        throw new Error("Unable to save draft: missing session identifier")
      }
      const saved = await saveDraft(form, nextSessionId)
      await refreshDrafts(nextSessionId, saved.entry.id)
    } catch (draftSaveError) {
      setDraftsError(
        draftSaveError instanceof Error ? draftSaveError.message : "Unable to save draft",
      )
    } finally {
      setIsSavingDraft(false)
    }
  }

  async function handleClearSession() {
    const nextSessionId = clientId ?? getAnalysisSessionId()
    if (!hasSessionId(nextSessionId)) {
      setAnalysisError("Unable to clear session: missing session identifier")
      return
    }

    setIsClearingSession(true)
    try {
      await clearSession(nextSessionId)
      const rotatedSessionId = clearAnalysisSession()
      setClientId(rotatedSessionId)
      setResult(null)
      setPreviousResult(null)
      setAnalyzedHook(null)
      setAppliedHook(null)
      setAnalysisError(null)
      setHistoryError(null)
      setDraftsError(null)
      setHistoryEntries([])
      setDraftEntries([])
      setSelectedDraftId(null)
    } catch (clearError) {
      setAnalysisError(
        clearError instanceof Error ? clearError.message : "Unable to clear session",
      )
    } finally {
      setIsClearingSession(false)
    }
  }

  async function handleApplyFixAndRescore() {
    await runAnalysis(form)
  }

  function handleUseHook(hook: string) {
    setForm((current) => ({
      ...current,
      hook,
    }))
    setAppliedHook(hook)
  }

  const canRescoreDraft =
    Boolean(result && analyzedHook && form.hook.trim() !== analyzedHook.trim())

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
        {analysisError ? (
          <aside className="panel error-panel" role="alert">
            <h2>Analysis failed</h2>
            <p>{analysisError}</p>
            <p className="muted">
              History and saved drafts load separately, so a secondary fetch will not clear a
              successful result.
            </p>
          </aside>
        ) : null}

        <ResultCard
          result={result}
          previousResult={previousResult}
          selectedHook={appliedHook}
          canRescore={canRescoreDraft}
          isSubmitting={isSubmitting}
          onRescore={handleApplyFixAndRescore}
          onUseHook={handleUseHook}
        />

        <aside className="panel account-cta">
          <span className="panel-label">Sessions</span>
          <h2>Anonymous history stays local to this browser.</h2>
          <p>
            Saved drafts and recent analyses are tied to a temporary browser session for the
            current deployment.
          </p>
          <button
            className="button button--ghost"
            type="button"
            onClick={handleClearSession}
            disabled={isClearingSession || isSubmitting || isSavingDraft}
          >
            {isClearingSession ? "Clearing..." : "Clear session"}
          </button>
        </aside>

        <AnalysisHistory
          entries={historyEntries}
          isLoading={isHistoryLoading}
          error={historyError}
        />
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
