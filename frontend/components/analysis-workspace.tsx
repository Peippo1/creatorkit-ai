"use client"

import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { useUser } from "@clerk/nextjs"

import {
  analyzeContent,
  getCreatorAccount,
  listAnalysisHistory,
  listSavedDrafts,
  saveDraft,
} from "@/lib/api"
import { getAnalysisSessionId } from "@/lib/session"
import type {
  AnalyzeRequest,
  AnalyzeResponse,
  CreatorAccountResponse,
  AnalysisHistoryEntry,
  SavedDraftEntry,
} from "@/lib/types"

import { CreatorAccountPanel } from "./creator-account-panel"
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
  const { user, isLoaded } = useUser()
  const [form, setForm] = useState<AnalyzeRequest>(DEFAULT_FORM)
  const [result, setResult] = useState<AnalyzeResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [clientId, setClientId] = useState<string | null>(null)
  const [creatorAccount, setCreatorAccount] = useState<CreatorAccountResponse | null>(null)
  const [isAccountLoading, setIsAccountLoading] = useState(true)
  const [accountError, setAccountError] = useState<string | null>(null)
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

  const isAuthenticated = Boolean(isLoaded && user?.id)

  useEffect(() => {
    if (!isAuthenticated && !clientId) {
      return
    }

    let cancelled = false

    async function loadWorkspaceData() {
      const sessionId = isAuthenticated ? undefined : clientId
      setIsHistoryLoading(true)
      setIsDraftsLoading(true)
      setIsAccountLoading(true)
      setAccountError(null)
      setHistoryError(null)
      setDraftsError(null)

      const historyRequest = listAnalysisHistory(sessionId)
      const draftsRequest = listSavedDrafts(sessionId)
      const accountRequest = isAuthenticated ? getCreatorAccount() : null

      const [historyResult, draftsResult] = await Promise.allSettled([historyRequest, draftsRequest])
      const accountResult = accountRequest ? await Promise.allSettled([accountRequest]) : null

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

      if (accountResult) {
        const [creatorResult] = accountResult
        if (creatorResult.status === "fulfilled") {
          setCreatorAccount(creatorResult.value)
        } else {
          setAccountError(
            creatorResult.reason instanceof Error
              ? creatorResult.reason.message
              : "Unable to load creator account",
          )
        }
      } else if (!accountRequest) {
        setCreatorAccount(null)
      }

      setIsHistoryLoading(false)
      setIsDraftsLoading(false)
      setIsAccountLoading(false)
    }

    void loadWorkspaceData()

    return () => {
      cancelled = true
    }
  }, [clientId, isAuthenticated])

  async function refreshHistory(nextClientId?: string) {
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

  async function refreshDrafts(nextClientId?: string, preferredDraftId: number | null = null) {
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

  async function refreshAccount() {
    try {
      const response = await getCreatorAccount()
      setCreatorAccount(response)
      setAccountError(null)
    } catch (accountLoadError) {
      setAccountError(
        accountLoadError instanceof Error
          ? accountLoadError.message
          : "Unable to load creator account",
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
      const nextSessionId = clientId ?? getAnalysisSessionId()
      if (!clientId && !isAuthenticated) {
        setClientId(nextSessionId)
      }
      const analysis = await analyzeContent(form, isAuthenticated ? undefined : nextSessionId)
      setResult(analysis)
      await refreshHistory(isAuthenticated ? undefined : nextSessionId)
      if (isAuthenticated) {
        await refreshAccount()
      }
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
      const nextSessionId = clientId ?? getAnalysisSessionId()
      if (!clientId && !isAuthenticated) {
        setClientId(nextSessionId)
      }
      const saved = await saveDraft(form, isAuthenticated ? undefined : nextSessionId)
      await refreshDrafts(isAuthenticated ? undefined : nextSessionId, saved.entry.id)
      if (isAuthenticated) {
        await refreshAccount()
      }
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
        {isAuthenticated ? (
          <CreatorAccountPanel
            account={creatorAccount}
            isLoading={isAccountLoading}
            error={accountError}
            onUpdated={(nextAccount) => setCreatorAccount(nextAccount)}
          />
        ) : (
          <aside className="panel account-cta">
            <span className="panel-label">Accounts</span>
            <h2>Sign in to sync your work</h2>
            <p>
              Create a creator account to keep history, saved drafts, and profile details attached
              to your identity instead of a temporary session.
            </p>
            <p className="muted">
              Sign-in buttons are available in the top bar. Anonymous analysis still works for the
              demo flow.
            </p>
          </aside>
        )}
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
