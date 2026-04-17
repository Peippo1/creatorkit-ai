import type {
  AnalyzeRequest,
  AnalyzeResponse,
  AnalysisHistoryResponse,
} from "@/lib/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"

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
  clientId?: string,
): Promise<AnalyzeResponse> {
  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(clientId ? { "X-Client-Id": clientId } : {}),
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  return (await response.json()) as AnalyzeResponse
}

export async function listAnalysisHistory(clientId: string, limit = 5): Promise<AnalysisHistoryResponse> {
  const response = await fetch(
    `${API_BASE_URL}/history?client_id=${encodeURIComponent(clientId)}&limit=${limit}`,
    {
      method: "GET",
      cache: "no-store",
    },
  )

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  return (await response.json()) as AnalysisHistoryResponse
}
