import type {
  AnalyzeRequest,
  AnalyzeResponse,
  CreatorAccountResponse,
  CreatorAccountUpdate,
  AnalysisHistoryResponse,
  SavedDraftResponse,
  SavedDraftsResponse,
} from "@/lib/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"

function buildIdentityHeaders(accountKey?: string, email?: string, displayName?: string) {
  return {
    ...(accountKey ? { "X-Account-Key": accountKey, "X-Client-Id": accountKey } : {}),
    ...(email ? { "X-Account-Email": email } : {}),
    ...(displayName ? { "X-Account-Name": displayName } : {}),
  }
}

type AccountMetadata = {
  email?: string
  displayName?: string
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

export async function analyzeContent(
  payload: AnalyzeRequest,
  accountKey?: string,
): Promise<AnalyzeResponse> {
  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildIdentityHeaders(accountKey),
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  return (await response.json()) as AnalyzeResponse
}

export async function listAnalysisHistory(accountKey: string, limit = 5): Promise<AnalysisHistoryResponse> {
  const response = await fetch(
    `${API_BASE_URL}/history?account_key=${encodeURIComponent(accountKey)}&limit=${limit}`,
    {
      method: "GET",
      headers: buildIdentityHeaders(accountKey),
      cache: "no-store",
    },
  )

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  return (await response.json()) as AnalysisHistoryResponse
}

export async function saveDraft(
  payload: AnalyzeRequest,
  accountKey?: string,
): Promise<SavedDraftResponse> {
  const response = await fetch(`${API_BASE_URL}/drafts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildIdentityHeaders(accountKey),
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  return (await response.json()) as SavedDraftResponse
}

export async function listSavedDrafts(accountKey: string, limit = 10): Promise<SavedDraftsResponse> {
  const response = await fetch(
    `${API_BASE_URL}/drafts?account_key=${encodeURIComponent(accountKey)}&limit=${limit}`,
    {
      method: "GET",
      headers: buildIdentityHeaders(accountKey),
      cache: "no-store",
    },
  )

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  return (await response.json()) as SavedDraftsResponse
}

export async function getCreatorAccount(accountKey: string): Promise<CreatorAccountResponse> {
  return getCreatorAccountWithMetadata(accountKey)
}

export async function getCreatorAccountWithMetadata(
  accountKey: string,
  metadata: AccountMetadata = {},
): Promise<CreatorAccountResponse> {
  const response = await fetch(
    `${API_BASE_URL}/account?account_key=${encodeURIComponent(accountKey)}`,
    {
      method: "GET",
      headers: buildIdentityHeaders(accountKey, metadata.email, metadata.displayName),
      cache: "no-store",
    },
  )

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  return (await response.json()) as CreatorAccountResponse
}

export async function updateCreatorAccount(
  payload: CreatorAccountUpdate,
  accountKey: string,
  metadata: AccountMetadata = {},
): Promise<CreatorAccountResponse> {
  const response = await fetch(`${API_BASE_URL}/account?account_key=${encodeURIComponent(accountKey)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...buildIdentityHeaders(
        accountKey,
        metadata.email ?? payload.email ?? undefined,
        metadata.displayName ?? payload.display_name ?? undefined,
      ),
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  return (await response.json()) as CreatorAccountResponse
}
