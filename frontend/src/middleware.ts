import { NextRequest, NextResponse } from "next/server"

// Rotas públicas por prefixo (ex: /login)
const PUBLIC_PREFIXES = ["/login"]

// Rotas públicas por correspondência exata
const PUBLIC_EXACT = ["/"]

const SESSION_COOKIE = "session_id"

const ADMIN_PREFIXES = ["/orders", "/stock", "/products", "/settings"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionId = request.cookies.get(SESSION_COOKIE)?.value
  const isAuthenticated = !!sessionId
  const isPublic =
    PUBLIC_EXACT.includes(pathname) ||
    PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))

  // /login sempre acessível: cookie pode existir sem sessão Redis válida

  // Não autenticado tentando acessar rota protegida → redireciona para /login
  if (!isPublic && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  const role = request.cookies.get("user_role")?.value
  const isAdminRoute = ADMIN_PREFIXES.some((p) => pathname.startsWith(p))
  if (isAuthenticated && isAdminRoute && role && role !== "admin") {
    return NextResponse.redirect(new URL("/home", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
}
