import type { AnalyzeInput, AnalyzeOutput } from "@/lib/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"

export async function analyzeContent(payload: AnalyzeInput): Promise<AnalyzeOutput> {
  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const fallback = await response.text()
    throw new Error(fallback || "Analysis request failed")
  }

  return response.json()
}
