import { createHash, createHmac, randomBytes } from "crypto"

import { auth, currentUser } from "@clerk/nextjs/server"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

const BACKEND_BASE_URL = process.env.CREATORKIT_BACKEND_URL ?? "http://localhost:8000"
const INTERNAL_API_SECRET = process.env.CREATORKIT_INTERNAL_API_SECRET
const INTERNAL_ASSERTION_HEADER = "X-Creatorkit-Assertion"

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => canonicalize(item))
  }

  if (value && typeof value === "object" && value.constructor === Object) {
    const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
      left.localeCompare(right),
    )

    return entries.reduce<Record<string, unknown>>((accumulator, [key, entry]) => {
      accumulator[key] = canonicalize(entry)
      return accumulator
    }, {})
  }

  return value
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex")
}

function buildAssertion(payload: Record<string, unknown>): string {
  if (!INTERNAL_API_SECRET) {
    throw new Error("Internal API secret is not configured")
  }

  const payloadJson = JSON.stringify(payload)
  const signature = createHmac("sha256", INTERNAL_API_SECRET).update(payloadJson).digest("base64url")
  const encodedPayload = Buffer.from(payloadJson, "utf8").toString("base64url")
  return `${encodedPayload}.${signature}`
}

async function proxyRequest(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  const { path = [] } = await context.params
  const targetPath = `/${path.join("/")}`
  const targetUrl = new URL(BACKEND_BASE_URL)
  targetUrl.pathname = targetPath
  targetUrl.search = request.nextUrl.search

  const { userId } = await auth()
  const bodyText = request.method === "GET" || request.method === "HEAD" ? "" : await request.text()
  const forwardedHeaders = new Headers()
  const needsAccountMetadata = targetPath === "/account"

  const contentType = request.headers.get("content-type")
  if (contentType) {
    forwardedHeaders.set("content-type", contentType)
  }

  const accept = request.headers.get("accept")
  if (accept) {
    forwardedHeaders.set("accept", accept)
  }

  const clientId = request.headers.get("X-Client-Id")
  if (!userId && clientId) {
    forwardedHeaders.set("X-Client-Id", clientId)
  }

  if (userId) {
    if (!INTERNAL_API_SECRET) {
      return NextResponse.json(
        { detail: "Internal API secret is not configured" },
        { status: 500 },
      )
    }

    const accountKey = `user:${userId}`
    const route = `${targetPath}${request.nextUrl.search}`
    const bodyDigest =
      bodyText.length === 0
        ? ""
        : (() => {
            try {
              return canonicalJson(JSON.parse(bodyText))
            } catch {
              return bodyText
            }
          })()
    const assertionPayload = {
      v: 1,
      sub: userId,
      account_key: accountKey,
      route,
      method: request.method,
      body_sha256: sha256Hex(bodyDigest),
      ts: Math.floor(Date.now() / 1000),
      nonce: randomBytes(16).toString("base64url"),
    }

    forwardedHeaders.set(INTERNAL_ASSERTION_HEADER, buildAssertion(assertionPayload))

    if (needsAccountMetadata) {
      const user = await currentUser()
      forwardedHeaders.set("X-Account-Email", user?.primaryEmailAddress?.emailAddress ?? "")
      forwardedHeaders.set("X-Account-Name", user?.fullName ?? user?.username ?? "")
    }
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
