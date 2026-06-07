import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

const BACKEND_URL = (process.env.BACKEND_URL ?? "http://localhost:8000").replace(/\/$/, "")

const FORWARD_REQUEST_HEADERS = ["content-type", "accept", "authorization", "cookie"]

function buildBackendUrl(request: NextRequest, pathSegments: string[]) {
  const path = pathSegments.join("/")
  const url = new URL(`${BACKEND_URL}/api/v1/${path}`)
  url.search = request.nextUrl.search
  return url
}

function forwardResponseHeaders(backend: Response, response: NextResponse) {
  const skip = new Set(["connection", "content-encoding", "content-length", "transfer-encoding"])
  backend.headers.forEach((value, key) => {
    const lower = key.toLowerCase()
    if (skip.has(lower) || lower === "set-cookie") return
    response.headers.set(key, value)
  })

  const setCookies =
    typeof backend.headers.getSetCookie === "function"
      ? backend.headers.getSetCookie()
      : []
  if (setCookies.length > 0) {
    for (const cookie of setCookies) {
      response.headers.append("set-cookie", cookie)
    }
  } else {
    const single = backend.headers.get("set-cookie")
    if (single) response.headers.append("set-cookie", single)
  }
}

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params
  const url = buildBackendUrl(request, path)

  const headers = new Headers()
  for (const name of FORWARD_REQUEST_HEADERS) {
    const value = request.headers.get(name)
    if (value) headers.set(name, value)
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    // Segue redirects só no servidor (com Cookie), sem expor onrender.com ao browser
    redirect: "follow",
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer()
  }

  const backend = await fetch(url, init)
  const response = new NextResponse(backend.body, { status: backend.status })
  forwardResponseHeaders(backend, response)
  return response
}

export const GET = proxy
export const POST = proxy
export const PUT = proxy
export const PATCH = proxy
export const DELETE = proxy
export const OPTIONS = proxy
