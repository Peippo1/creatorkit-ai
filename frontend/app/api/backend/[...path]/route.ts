import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

const BACKEND_BASE_URL = process.env.CREATORKIT_BACKEND_URL ?? "http://localhost:8000"

async function proxyRequest(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  const { path = [] } = await context.params
  const targetUrl = new URL(BACKEND_BASE_URL)
  targetUrl.pathname = `/${path.join("/")}`
  targetUrl.search = request.nextUrl.search

  const bodyText =
    request.method === "GET" || request.method === "HEAD" ? "" : await request.text()
  const forwardedHeaders = new Headers()

  const contentType = request.headers.get("content-type")
  if (contentType) {
    forwardedHeaders.set("content-type", contentType)
  }

  const accept = request.headers.get("accept")
  if (accept) {
    forwardedHeaders.set("accept", accept)
  }

  const clientId = request.headers.get("X-Client-Id")
  if (clientId) {
    forwardedHeaders.set("X-Client-Id", clientId)
  }

  const backendResponse = await fetch(targetUrl, {
    method: request.method,
    headers: forwardedHeaders,
    body: bodyText || undefined,
    cache: "no-store",
  })

  return new NextResponse(backendResponse.body, {
    status: backendResponse.status,
    headers: backendResponse.headers,
  })
}

export async function GET(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  return proxyRequest(request, context)
}

export async function POST(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  return proxyRequest(request, context)
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  return proxyRequest(request, context)
}
