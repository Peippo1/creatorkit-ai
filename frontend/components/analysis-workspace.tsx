"use client"

import { useEffect, useRef, useState } from "react"
import type { FormEvent } from "react"

import {
  analyzeContent,
  clearSession,
  createAnalysisJob,
  getAnalysisJob,
  listAnalysisHistory,
  listSavedDrafts,
  requestUploadUrl,
  saveDraft,
} from "@/lib/api"
import { clearAnalysisSession, getAnalysisSessionId } from "@/lib/session"
import { generateScriptDraft } from "@/lib/script-generator"
import type { ProcessingFlow, ProcessingState, ProcessingStep } from "@/lib/processing"
import { redactForLog } from "@/lib/redaction"
import type {
  AnalyzeRequest,
  AnalyzeResponse,
  AnalysisHistoryEntry,
  SavedDraftEntry,
} from "@/lib/types"

import { AnalysisForm } from "./analysis-form"
import { AnalysisHistory } from "./analysis-history"
import { DraftComparison } from "./draft-comparison"
import { ProcessingStatus } from "./processing-status"
import { ResultCard } from "./result-card"

const AUTO_RESCORE_ENABLED = true
const AUTO_RESCORE_DELAY_MS = 300
const VIDEO_JOB_POLL_INTERVAL_MS = 2500
const COMPLETION_HANDOFF_MS = 220

type CompletionContext = {
  flow: ProcessingFlow
  step: ProcessingStep
  fileName: string | null
}

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
  const [processingState, setProcessingState] = useState<ProcessingState>("idle")
  const [processingFlow, setProcessingFlow] = useState<ProcessingFlow | null>(null)
  const [processingStep, setProcessingStep] = useState<ProcessingStep | null>(null)
  const [processingError, setProcessingError] = useState<string | null>(null)
  const [videoJobId, setVideoJobId] = useState<string | null>(null)
  const [historyEntries, setHistoryEntries] = useState<AnalysisHistoryEntry[]>([])
  const [isHistoryLoading, setIsHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [draftEntries, setDraftEntries] = useState<SavedDraftEntry[]>([])
  const [isDraftsLoading, setIsDraftsLoading] = useState(true)
  const [draftsError, setDraftsError] = useState<string | null>(null)
  const [selectedDraftId, setSelectedDraftId] = useState<number | null>(null)
  const [pendingAutoRescoreHook, setPendingAutoRescoreHook] = useState<string | null>(null)
  const [autoRescoreNote, setAutoRescoreNote] = useState<string | null>(null)
  const [draftIdea, setDraftIdea] = useState("")
  const [isGeneratingScript, setIsGeneratingScript] = useState(false)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null)
  const [videoDurationSeconds, setVideoDurationSeconds] = useState<number | null>(null)
  const draftGenerationTimerRef = useRef<number | null>(null)
  const processingCompletionTimerRef = useRef<number | null>(null)
  const processingResetTimerRef = useRef<number | null>(null)
  const completionDismissTimerRef = useRef<number | null>(null)
  const videoJobTokenRef = useRef(0)
  const videoJobPollTimerRef = useRef<number | null>(null)
  const videoJobSnapshotRef = useRef<AnalyzeRequest | null>(null)
  const resultStackRef = useRef<HTMLDivElement | null>(null)
  const resultScrollRequestedRef = useRef(false)
  const [completionContext, setCompletionContext] = useState<CompletionContext | null>(null)
  const [completionHandoffPhase, setCompletionHandoffPhase] = useState<
    "hidden" | "visible" | "settling"
  >("hidden")

  useEffect(() => {
    setClientId(getAnalysisSessionId())
  }, [])

  useEffect(() => {
    return () => {
      if (draftGenerationTimerRef.current !== null) {
        window.clearTimeout(draftGenerationTimerRef.current)
      }
      if (processingCompletionTimerRef.current !== null) {
        window.clearTimeout(processingCompletionTimerRef.current)
      }
      if (processingResetTimerRef.current !== null) {
        window.clearTimeout(processingResetTimerRef.current)
      }
      if (completionDismissTimerRef.current !== null) {
        window.clearTimeout(completionDismissTimerRef.current)
      }
      if (videoJobPollTimerRef.current !== null) {
        window.clearTimeout(videoJobPollTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!videoFile) {
      setVideoPreviewUrl(null)
      setVideoDurationSeconds(null)
      return
    }

    const objectUrl = URL.createObjectURL(videoFile)
    setVideoPreviewUrl(objectUrl)

    const probe = document.createElement("video")
    probe.preload = "metadata"
    probe.src = objectUrl

    function handleMetadata() {
      setVideoDurationSeconds(Number.isFinite(probe.duration) ? Math.round(probe.duration) : null)
    }

    function handleError() {
      setVideoDurationSeconds(null)
    }

    probe.addEventListener("loadedmetadata", handleMetadata, { once: true })
    probe.addEventListener("error", handleError, { once: true })

    return () => {
      probe.removeEventListener("loadedmetadata", handleMetadata)
      probe.removeEventListener("error", handleError)
      probe.removeAttribute("src")
      probe.load()
      URL.revokeObjectURL(objectUrl)
    }
  }, [videoFile])

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
      console.warn("[AnalysisWorkspace] skipped history refresh without a valid session id", redactForLog({
        clientId: nextClientId,
      }))
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
      console.warn("[AnalysisWorkspace] skipped drafts refresh without a valid session id", redactForLog({
        clientId: nextClientId,
      }))
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

  function clearVideoJobTimer() {
    if (videoJobPollTimerRef.current !== null) {
      window.clearTimeout(videoJobPollTimerRef.current)
      videoJobPollTimerRef.current = null
    }
  }

  function clearProcessingCompletionTimer() {
    if (processingCompletionTimerRef.current !== null) {
      window.clearTimeout(processingCompletionTimerRef.current)
      processingCompletionTimerRef.current = null
    }
  }

  function clearProcessingResetTimer() {
    if (processingResetTimerRef.current !== null) {
      window.clearTimeout(processingResetTimerRef.current)
      processingResetTimerRef.current = null
    }
  }

  function clearCompletionDismissTimer() {
    if (completionDismissTimerRef.current !== null) {
      window.clearTimeout(completionDismissTimerRef.current)
      completionDismissTimerRef.current = null
    }
  }

  function resetProcessingState() {
    videoJobTokenRef.current += 1
    clearVideoJobTimer()
    clearProcessingCompletionTimer()
    clearProcessingResetTimer()
    clearCompletionDismissTimer()
    videoJobSnapshotRef.current = null
    resultScrollRequestedRef.current = false
    setCompletionContext(null)
    setCompletionHandoffPhase("hidden")
    setProcessingState("idle")
    setProcessingFlow(null)
    setProcessingStep(null)
    setProcessingError(null)
    setVideoJobId(null)
  }

  async function startVideoJob(nextFile: File) {
    const nextSessionId = clientId ?? getAnalysisSessionId()
    if (!clientId) {
      setClientId(nextSessionId)
    }

    if (completionContext !== null) {
      resetProcessingState()
    }

    if (!hasSessionId(nextSessionId)) {
      setProcessingState("error")
      setProcessingFlow("video")
      setProcessingStep("upload")
      setProcessingError("Unable to start video analysis: missing session identifier")
      return
    }

    const token = videoJobTokenRef.current + 1
    videoJobTokenRef.current = token
    videoJobSnapshotRef.current = { ...form }
    setProcessingFlow("video")
    setProcessingState("uploading")
    setProcessingStep("upload")
    setProcessingError(null)
    setVideoJobId(null)
    setAnalysisError(null)
      setPendingAutoRescoreHook(null)
      setAutoRescoreNote(null)
      clearVideoJobTimer()
      clearProcessingCompletionTimer()

    try {
      const upload = await requestUploadUrl(
        {
          file_name: nextFile.name,
          content_type: nextFile.type || "video/mp4",
        },
        nextSessionId,
      )

      if (token !== videoJobTokenRef.current) {
        return
      }

      setProcessingStep("transcript")
      setProcessingState("transcribing")

      const snapshot = videoJobSnapshotRef.current ?? form
      const job = await createAnalysisJob(
        {
          platform: snapshot.platform,
          content_type: snapshot.content_type,
          niche: snapshot.niche,
          duration_seconds: snapshot.duration_seconds,
          has_cta: snapshot.has_cta,
          upload_id: upload.upload_id,
          upload_filename: nextFile.name,
          idea: draftIdea.trim() || null,
          hook: snapshot.hook.trim() || null,
          caption: snapshot.caption.trim() || null,
          transcript: snapshot.transcript.trim() || null,
        },
        nextSessionId,
      )

      if (token !== videoJobTokenRef.current) {
        return
      }

      setVideoJobId(job.job_id)
      if (job.status === "failed") {
        setProcessingState("error")
        setProcessingFlow("video")
        setProcessingStep("transcript")
        setProcessingError(job.error ?? "Video analysis failed")
        setVideoJobId(null)
        setProcessingFlow("video")
      }
    } catch (jobStartError) {
      if (token !== videoJobTokenRef.current) {
        return
      }

      setProcessingState("error")
      setProcessingFlow("video")
      setProcessingStep("upload")
      setProcessingError(
        jobStartError instanceof Error ? jobStartError.message : "Unable to start video analysis",
      )
      setVideoJobId(null)
      setProcessingFlow("video")
    }
  }

  useEffect(() => {
    if (!videoJobId || processingState === "error" || processingState === "idle") {
      return
    }

    let cancelled = false
    const token = videoJobTokenRef.current
    const jobId = videoJobId as string

    async function pollVideoJob() {
      if (token !== videoJobTokenRef.current) {
        return
      }

      const nextSessionId = clientId ?? getAnalysisSessionId()
      const sessionId = hasSessionId(nextSessionId) ? nextSessionId : null

      if (!sessionId) {
        setProcessingState("error")
        setProcessingFlow("video")
        setProcessingStep("score")
        setProcessingError("Unable to check video analysis status: missing session identifier")
        setVideoJobId(null)
        return
      }

      try {
        const confirmedSessionId = sessionId as string
        const job = await getAnalysisJob(jobId, confirmedSessionId)

        if (cancelled) {
          return
        }

        if (token !== videoJobTokenRef.current) {
          return
        }

        if (job.status === "complete") {
          if (job.result) {
            if (result) {
              setPreviousResult(result)
            }
            setResult(job.result)
            setAnalyzedHook(videoJobSnapshotRef.current?.hook ?? "")
          }
          setPendingAutoRescoreHook(null)
          setAutoRescoreNote(null)
          setProcessingStep("feedback")
          setProcessingState("coaching")
          setProcessingFlow("video")
          setProcessingError(null)
          clearVideoJobTimer()
          clearProcessingCompletionTimer()
          clearProcessingResetTimer()
          setCompletionContext({
            flow: "video",
            step: "feedback",
            fileName: videoFile?.name ?? null,
          })
          setCompletionHandoffPhase("visible")
          resultScrollRequestedRef.current = true
          processingCompletionTimerRef.current = window.setTimeout(() => {
            if (token !== videoJobTokenRef.current) {
              return
            }
            setProcessingState("complete")
            setProcessingFlow("video")
            setProcessingStep("feedback")
          }, 250)
          processingResetTimerRef.current = window.setTimeout(() => {
            if (token !== videoJobTokenRef.current) {
              return
            }
            setProcessingState("idle")
            setProcessingFlow(null)
            setVideoJobId(null)
            setProcessingError(null)
            clearProcessingCompletionTimer()
            clearProcessingResetTimer()
          }, 1100)
          return
        }

        if (job.status === "failed") {
          setProcessingState("error")
          setProcessingFlow("video")
          setProcessingStep("score")
          setProcessingError(job.error ?? "Video analysis failed")
          setVideoJobId(null)
          setProcessingFlow("video")
          clearVideoJobTimer()
          return
        }

        setProcessingStep(job.status === "processing" ? "score" : "transcript")
        setProcessingState(job.status === "processing" ? "scoring" : "transcribing")
        setProcessingFlow("video")
        clearVideoJobTimer()
        videoJobPollTimerRef.current = window.setTimeout(() => {
          void pollVideoJob()
        }, VIDEO_JOB_POLL_INTERVAL_MS)
      } catch (jobPollError) {
        if (cancelled) {
          return
        }

        if (token !== videoJobTokenRef.current) {
          return
        }

        setProcessingState("error")
        setProcessingFlow("video")
        setProcessingStep("score")
        setProcessingError(
          jobPollError instanceof Error
            ? jobPollError.message
            : "Unable to load video analysis status",
        )
        setVideoJobId(null)
        setProcessingFlow("video")
        clearVideoJobTimer()
      }
    }

    void pollVideoJob()

    return () => {
      cancelled = true
      clearVideoJobTimer()
    }
  }, [videoJobId, clientId, result])

  function updateField<K extends keyof AnalyzeRequest>(field: K, nextValue: AnalyzeRequest[K]) {
    setForm((current) => ({
      ...current,
      [field]: nextValue,
    }))
    if (field === "hook") {
      setAppliedHook((current) => (current === nextValue ? current : null))
    }
    setPendingAutoRescoreHook((current) => (current && field === "hook" && current === nextValue ? current : null))
    setAutoRescoreNote(null)
  }

  async function runAnalysis(nextDraft: AnalyzeRequest) {
    const nextSessionId = clientId ?? getAnalysisSessionId()
    if (!clientId) {
      setClientId(nextSessionId)
    }

    if (completionContext !== null) {
      resetProcessingState()
    }

    if (!hasSessionId(nextSessionId)) {
      const message = "Unable to analyze draft: missing session identifier"
      setAnalysisError(message)
      console.warn("[AnalysisWorkspace] skipped analysis without a valid session id", redactForLog({
        clientId: nextSessionId,
        draft: nextDraft,
      }))
      return
    }

    setIsSubmitting(true)
    setAnalysisError(null)
    setProcessingFlow("analysis")
    setProcessingState("scoring")
    setProcessingStep("score")
    setProcessingError(null)
    clearProcessingCompletionTimer()
    clearProcessingResetTimer()
    if (result) {
      setPreviousResult(result)
    }

    try {
      const analysis = await analyzeContent(nextDraft, nextSessionId)
      setProcessingStep("feedback")
      setProcessingState("coaching")
      setProcessingFlow("analysis")
      setResult(analysis)
      setAnalyzedHook(nextDraft.hook)
      await refreshHistory(nextSessionId)
      clearProcessingCompletionTimer()
      clearProcessingResetTimer()
      setCompletionContext({
        flow: "analysis",
        step: "feedback",
        fileName: null,
      })
      setCompletionHandoffPhase("visible")
      resultScrollRequestedRef.current = true
      processingCompletionTimerRef.current = window.setTimeout(() => {
        setProcessingState("complete")
        setProcessingFlow("analysis")
        setProcessingStep("feedback")
        processingResetTimerRef.current = window.setTimeout(() => {
          setProcessingState("idle")
          setProcessingFlow(null)
          setProcessingStep(null)
        }, 900)
      }, 240)
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "Unable to analyze draft"
      setProcessingState("error")
      setProcessingFlow("analysis")
      setProcessingStep("score")
      setProcessingError(message)
      console.error("[AnalysisWorkspace] analyze draft failed", redactForLog({
        message,
        clientId: nextSessionId,
        draft: nextDraft,
      }))
    } finally {
      setPendingAutoRescoreHook(null)
      setAutoRescoreNote(null)
      setIsSubmitting(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (processingState !== "idle" || completionContext !== null) {
      resetProcessingState()
    }
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
      if (draftGenerationTimerRef.current !== null) {
        window.clearTimeout(draftGenerationTimerRef.current)
        draftGenerationTimerRef.current = null
      }
      resetProcessingState()
      setIsGeneratingScript(false)
      await clearSession(nextSessionId)
      const rotatedSessionId = clearAnalysisSession()
      setClientId(rotatedSessionId)
      setResult(null)
      setPreviousResult(null)
      setAnalyzedHook(null)
      setAppliedHook(null)
      setVideoFile(null)
      setVideoPreviewUrl(null)
      setAnalysisError(null)
      setHistoryError(null)
      setDraftsError(null)
      setHistoryEntries([])
      setDraftEntries([])
      setSelectedDraftId(null)
      setDraftIdea("")
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
    if (AUTO_RESCORE_ENABLED) {
      setPendingAutoRescoreHook(hook)
      setAutoRescoreNote("Updating the score...")
    }
  }

  function handleVideoSelect(nextFile: File | null) {
    if (!nextFile) {
      setVideoFile(null)
      resetProcessingState()
      return
    }

    setVideoFile(nextFile)
    void startVideoJob(nextFile)
  }

  const isProcessingActive = processingState !== "idle"
  const isCompletionHandoffVisible = completionContext !== null
  const showProcessingStatus = isProcessingActive || isCompletionHandoffVisible
  const visibleProcessingState =
    processingState === "idle" && completionContext !== null ? "complete" : processingState
  const visibleProcessingFlow =
    processingState === "idle" && completionContext !== null
      ? completionContext.flow
      : (processingFlow ?? "analysis")
  const visibleProcessingStep =
    processingState === "idle" && completionContext !== null ? completionContext.step : processingStep
  const visibleProcessingFileName =
    processingState === "idle" && completionContext !== null
      ? completionContext.fileName
      : (videoFile?.name ?? null)

  function retryProcessing() {
    if (processingFlow === "video") {
      if (videoFile) {
        void startVideoJob(videoFile)
      }
      return
    }

    if (processingFlow === "script") {
      resetProcessingState()
      handleGenerateScript()
      return
    }

    if (processingFlow === "analysis") {
      resetProcessingState()
      void runAnalysis(form)
    }
  }

  function handleGenerateScript() {
    if (isSubmitting || isSavingDraft || isGeneratingScript || isProcessingActive) {
      return
    }

    if (completionContext !== null) {
      resetProcessingState()
    }

    setIsGeneratingScript(true)
    setProcessingFlow("script")
    setProcessingState("scoring")
    setProcessingStep("score")
    setProcessingError(null)
    clearProcessingCompletionTimer()
    clearProcessingResetTimer()
    if (draftGenerationTimerRef.current !== null) {
      window.clearTimeout(draftGenerationTimerRef.current)
    }

    const nextDraftIdea = draftIdea
    const nextPlatform = form.platform
    const nextContentType = form.content_type
    const nextNiche = form.niche

    draftGenerationTimerRef.current = window.setTimeout(() => {
      const generated = generateScriptDraft({
        platform: nextPlatform,
        content_type: nextContentType,
        niche: nextNiche,
        idea: nextDraftIdea,
      })

      setForm((current) => ({
        ...current,
        hook: generated.hook,
        caption: generated.caption,
        transcript: generated.transcript,
      }))
      setProcessingStep("feedback")
      setProcessingState("coaching")
      setProcessingFlow("script")
      setAppliedHook(null)
      setPendingAutoRescoreHook(null)
      setAutoRescoreNote(null)
      setAnalysisError(null)
      setIsGeneratingScript(false)
      setCompletionContext({
        flow: "script",
        step: "feedback",
        fileName: null,
      })
      setCompletionHandoffPhase("visible")
      resultScrollRequestedRef.current = true
      processingCompletionTimerRef.current = window.setTimeout(() => {
        setProcessingState("complete")
        setProcessingFlow("script")
        setProcessingStep("feedback")
        processingResetTimerRef.current = window.setTimeout(() => {
          setProcessingState("idle")
          setProcessingFlow(null)
          setProcessingStep(null)
        }, 700)
      }, 220)
      draftGenerationTimerRef.current = null
    }, 140)
  }

  const canRescoreDraft =
    Boolean(result && analyzedHook && form.hook.trim() !== analyzedHook.trim())

  useEffect(() => {
    if (processingState !== "idle" || completionContext === null) {
      return
    }

    if (completionHandoffPhase === "visible") {
      setCompletionHandoffPhase("settling")
    }

    clearCompletionDismissTimer()
    completionDismissTimerRef.current = window.setTimeout(() => {
      setCompletionContext(null)
      setCompletionHandoffPhase("hidden")
      completionDismissTimerRef.current = null
    }, COMPLETION_HANDOFF_MS)

    return () => {
      clearCompletionDismissTimer()
    }
  }, [completionContext, completionHandoffPhase, processingState])

  useEffect(() => {
    if (
      processingState === "idle" &&
      completionContext === null &&
      completionHandoffPhase === "hidden" &&
      resultScrollRequestedRef.current &&
      resultStackRef.current
    ) {
      const reduceMotion =
        window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false

      window.requestAnimationFrame(() => {
        resultStackRef.current?.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "start",
        })
      })
      resultScrollRequestedRef.current = false
    }
  }, [completionContext, completionHandoffPhase, processingState])

  useEffect(() => {
    if (!AUTO_RESCORE_ENABLED || !pendingAutoRescoreHook || isSubmitting || isProcessingActive) {
      return
    }

    if (form.hook.trim() !== pendingAutoRescoreHook.trim()) {
      setPendingAutoRescoreHook(null)
      setAutoRescoreNote(null)
      return
    }

    const timeout = window.setTimeout(() => {
      void runAnalysis(form)
    }, AUTO_RESCORE_DELAY_MS)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [form, isSubmitting, pendingAutoRescoreHook, isProcessingActive])

  return (
    <div className="workspace-grid">
      <AnalysisForm
        value={form}
        isSubmitting={isSubmitting}
        isSavingDraft={isSavingDraft}
        isGeneratingScript={isGeneratingScript}
        isProcessingActive={isProcessingActive}
        draftIdea={draftIdea}
        onSubmit={handleSubmit}
        onGenerateScript={handleGenerateScript}
        onSaveDraft={handleSaveDraft}
        onDraftIdeaChange={setDraftIdea}
        onFieldChange={updateField}
        videoFile={videoFile}
        videoPreviewUrl={videoPreviewUrl}
        videoDurationSeconds={videoDurationSeconds}
        onVideoSelect={handleVideoSelect}
      />

      <div className="result-stack" ref={resultStackRef}>
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

        {showProcessingStatus ? (
          <div
            className={[
              "overflow-hidden transition-[max-height,opacity,transform] duration-300 ease-out",
              isCompletionHandoffVisible && processingState === "idle"
                ? "max-h-0 -translate-y-2 opacity-0"
                : "max-h-[40rem] translate-y-0 opacity-100",
            ].join(" ")}
            aria-hidden={isCompletionHandoffVisible && processingState === "idle"}
          >
            <ProcessingStatus
              state={visibleProcessingState}
              flow={visibleProcessingFlow}
              step={visibleProcessingStep}
              fileName={visibleProcessingFileName}
              error={processingError}
              onRetry={retryProcessing}
            />
          </div>
        ) : null}

        <ResultCard
          result={result}
          previousResult={previousResult}
          selectedHook={appliedHook}
          canRescore={canRescoreDraft}
          isProcessingActive={isProcessingActive}
          isProcessingVisible={isProcessingActive}
          isAutoRescoring={Boolean(pendingAutoRescoreHook)}
          autoRescoreNote={autoRescoreNote}
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
