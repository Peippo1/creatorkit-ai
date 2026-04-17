import type {
  AnalyzeRequest,
  AnalyzeResponse,
  CreatorAccountResponse,
  CreatorAccountUpdate,
  AnalysisHistoryResponse,
  SavedDraftResponse,
  SavedDraftsResponse,
} from "@/lib/types"

const API_BASE_PATH = "/api/backend"

function buildClientHeaders(clientId?: string) {
  return {
    ...(clientId ? { "X-Client-Id": clientId } : {}),
  }
}

async function readErrorMessage(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") ?? ""

  if (contentType.includes("application/json")) {
    try {
      const data = (await response.json()) as { detail?: string; message?: string }
      return data.detail ?? data.message ?? "Analysis request failed"
    } catch {
      return "Analysis request failed"
    }
  }

  const text = await response.text()
  return text.trim() || "Analysis request failed"
}

async function requestBackend(
  path: string,
  init: RequestInit,
  clientId?: string,
): Promise<Response> {
  const response = await fetch(`${API_BASE_PATH}${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      ...buildClientHeaders(clientId),
    },
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  return response
}

export async function analyzeContent(
  payload: AnalyzeRequest,
  clientId?: string,
): Promise<AnalyzeResponse> {
  const response = await requestBackend(
    "/analyze",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    clientId,
  )

  return (await response.json()) as AnalyzeResponse
}

export async function listAnalysisHistory(
  clientId?: string,
  limit = 5,
): Promise<AnalysisHistoryResponse> {
  const query = new URLSearchParams()
  query.set("limit", String(limit))

  const response = await requestBackend(
    `/history?${query.toString()}`,
    {
      method: "GET",
    },
    clientId,
  )

  return (await response.json()) as AnalysisHistoryResponse
}

export async function saveDraft(
  payload: AnalyzeRequest,
  clientId?: string,
): Promise<SavedDraftResponse> {
  const response = await requestBackend(
    "/drafts",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    clientId,
  )

  return (await response.json()) as SavedDraftResponse
}

export async function listSavedDrafts(clientId?: string, limit = 10): Promise<SavedDraftsResponse> {
  const query = new URLSearchParams()
  query.set("limit", String(limit))

  const response = await requestBackend(
    `/drafts?${query.toString()}`,
    {
      method: "GET",
    },
    clientId,
  )

  return (await response.json()) as SavedDraftsResponse
}

export async function getCreatorAccount(): Promise<CreatorAccountResponse> {
  const response = await requestBackend("/account", {
    method: "GET",
  })

  return (await response.json()) as CreatorAccountResponse
}

export async function updateCreatorAccount(payload: CreatorAccountUpdate): Promise<CreatorAccountResponse> {
  const response = await requestBackend("/account", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  return (await response.json()) as CreatorAccountResponse
}
