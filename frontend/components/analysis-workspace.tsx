"use client"

import { useEffect, useState } from "react"
import type { FormEvent } from "react"

import { analyzeContent, listAnalysisHistory } from "@/lib/api"
import { getAnalysisSessionId } from "@/lib/session"
import type { AnalyzeRequest, AnalyzeResponse, AnalysisHistoryEntry } from "@/lib/types"

import { AnalysisForm } from "./analysis-form"
import { AnalysisHistory } from "./analysis-history"
import { ResultCard } from "./result-card"

const DEFAULT_FORM: AnalyzeRequest = {
  platform: "TikTok",
  content_type: "Short-form video",
  hook: "Most creators miss this one edit before publishing.",
  caption: "A creator-focused draft that needs a fast pre-publish review.",
  transcript: "In this draft, we show how to tighten the opening, clarify the value, and end with a stronger call to action.",
  duration_seconds: 35,
  niche: "creator education",
  has_cta: true,
}

export function AnalysisWorkspace() {
  const [form, setForm] = useState<AnalyzeRequest>(DEFAULT_FORM)
  const [result, setResult] = useState<AnalyzeResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clientId, setClientId] = useState<string | null>(null)
  const [historyEntries, setHistoryEntries] = useState<AnalysisHistoryEntry[]>([])
  const [isHistoryLoading, setIsHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState<string | null>(null)

  useEffect(() => {
    setClientId(getAnalysisSessionId())
  }, [])

  useEffect(() => {
    if (!clientId) {
      return
    }

    let cancelled = false

    async function loadHistory() {
      setIsHistoryLoading(true)
      setHistoryError(null)

      try {
        const response = await listAnalysisHistory(clientId)
        if (!cancelled) {
          setHistoryEntries(response.entries)
        }
      } catch (historyLoadError) {
        if (!cancelled) {
          setHistoryError(
            historyLoadError instanceof Error ? historyLoadError.message : "Unable to load history",
          )
        }
      } finally {
        if (!cancelled) {
          setIsHistoryLoading(false)
        }
      }
    }

    void loadHistory()

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

  return (
    <div className="workspace-grid">
      <AnalysisForm
        value={form}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
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
      </div>
    </div>
  )
}
