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

type BackendRequestOptions = {
  clientId?: string
  endpointLabel: string
  fallbackMessage: string
}

function buildClientHeaders(clientId?: string) {
  return {
    ...(clientId ? { "X-Client-Id": clientId } : {}),
  }
}

function formatStatus(response: Response): string {
  return response.statusText ? `${response.status} ${response.statusText}` : String(response.status)
}

function normalizeErrorDetail(detail: unknown): string {
  if (typeof detail === "string") {
    return detail.trim()
  }

  if (Array.isArray(detail)) {
    return detail.map((item) => normalizeErrorDetail(item)).filter(Boolean).join("; ")
  }

  if (detail && typeof detail === "object") {
    const record = detail as Record<string, unknown>
    const nestedDetail = record.detail ?? record.message ?? record.error
    if (nestedDetail !== undefined) {
      return normalizeErrorDetail(nestedDetail)
    }

    try {
      return JSON.stringify(detail)
    } catch {
      return ""
    }
  }

  if (typeof detail === "number" || typeof detail === "boolean") {
    return String(detail)
  }

  return ""
}

async function readErrorMessage(
  response: Response,
  fallbackMessage: string,
): Promise<{ message: string; body: string }> {
  const contentType = response.headers.get("content-type") ?? ""
  const statusInfo = formatStatus(response)

  if (contentType.includes("application/json")) {
    try {
      const data = (await response.json()) as Record<string, unknown>
      const detail = normalizeErrorDetail(data.detail ?? data.message ?? data.error)
      return {
        message: detail
          ? `${fallbackMessage}: ${detail} (${statusInfo})`
          : `${fallbackMessage} (${statusInfo})`,
        body: detail || statusInfo,
      }
    } catch {
      return {
        message: `${fallbackMessage} (${statusInfo})`,
        body: statusInfo,
      }
    }
  }

  const text = await response.text()
  const detail = text.trim()
  return {
    message: detail
      ? `${fallbackMessage}: ${detail} (${statusInfo})`
      : `${fallbackMessage} (${statusInfo})`,
    body: detail || statusInfo,
  }
}

async function requestBackend(
  path: string,
  init: RequestInit,
  options: BackendRequestOptions,
): Promise<Response> {
  const response = await fetch(`${API_BASE_PATH}${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      ...buildClientHeaders(options.clientId),
    },
    cache: "no-store",
  })

  if (!response.ok) {
    const errorInfo = await readErrorMessage(response, options.fallbackMessage)
    console.error("[CreatorKit API] request failed", {
      endpoint: options.endpointLabel,
      path: `${API_BASE_PATH}${path}`,
      method: init.method ?? "GET",
      status: response.status,
      statusText: response.statusText,
      responseBody: errorInfo.body,
      message: errorInfo.message,
    })
    throw new Error(errorInfo.message)
  }

  return response
}

export async function analyzeContent(
  payload: AnalyzeRequest,
  clientId?: string,
): Promise<AnalyzeResponse> {
  console.info("[CreatorKit API] analyze request", {
    clientId,
    payload,
  })

  const response = await requestBackend(
    "/analyze",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    {
      clientId,
      endpointLabel: "analyze",
      fallbackMessage: "Unable to analyze draft",
    },
  )

  return (await response.json()) as AnalyzeResponse
}

export async function listAnalysisHistory(
  clientId?: string,
  limit = 5,
): Promise<AnalysisHistoryResponse> {
  const query = new URLSearchParams()
  query.set("limit", String(limit))
  console.info("[CreatorKit API] history request", {
    clientId,
    query: query.toString(),
  })

  const response = await requestBackend(
    `/history?${query.toString()}`,
    {
      method: "GET",
    },
    {
      clientId,
      endpointLabel: "history",
      fallbackMessage: "Unable to load recent analyses",
    },
  )

  return (await response.json()) as AnalysisHistoryResponse
}

export async function saveDraft(
  payload: AnalyzeRequest,
  clientId?: string,
): Promise<SavedDraftResponse> {
  console.info("[CreatorKit API] save draft request", {
    clientId,
    payload,
  })

  const response = await requestBackend(
    "/drafts",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    {
      clientId,
      endpointLabel: "save-draft",
      fallbackMessage: "Unable to save draft",
    },
  )

  return (await response.json()) as SavedDraftResponse
}

export async function listSavedDrafts(clientId?: string, limit = 10): Promise<SavedDraftsResponse> {
  const query = new URLSearchParams()
  query.set("limit", String(limit))
  console.info("[CreatorKit API] drafts request", {
    clientId,
    query: query.toString(),
  })

  const response = await requestBackend(
    `/drafts?${query.toString()}`,
    {
      method: "GET",
    },
    {
      clientId,
      endpointLabel: "drafts",
      fallbackMessage: "Unable to load saved drafts",
    },
  )

  return (await response.json()) as SavedDraftsResponse
}

export async function getCreatorAccount(): Promise<CreatorAccountResponse> {
  const response = await requestBackend("/account", {
    method: "GET",
  }, {
    endpointLabel: "account",
    fallbackMessage: "Unable to load creator account",
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
  }, {
    endpointLabel: "account-update",
    fallbackMessage: "Unable to update creator account",
  })

  return (await response.json()) as CreatorAccountResponse
}
