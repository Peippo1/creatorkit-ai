"use client"

import type { FormEvent } from "react"
import { useState } from "react"

import { analyzeContent } from "@/lib/api"
import type { AnalyzeInput, AnalyzeOutput } from "@/lib/types"

import { AnalysisForm } from "./analysis-form"
import { ResultCard } from "./result-card"

const DEFAULT_FORM: AnalyzeInput = {
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
  const [form, setForm] = useState<AnalyzeInput>(DEFAULT_FORM)
  const [result, setResult] = useState<AnalyzeOutput | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function updateField<K extends keyof AnalyzeInput>(field: K, nextValue: AnalyzeInput[K]) {
    setForm((current) => ({
      ...current,
      [field]: nextValue,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const analysis = await analyzeContent(form)
      setResult(analysis)
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

      <div className="stack">
        {error ? (
          <aside className="panel">
            <h2>Backend error</h2>
            <p>{error}</p>
            <p className="muted">Start the FastAPI backend and try again.</p>
          </aside>
        ) : null}

        <ResultCard result={result} />
      </div>
    </div>
  )
}
