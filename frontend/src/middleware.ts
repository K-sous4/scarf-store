import { NextRequest, NextResponse } from "next/server"

// Rotas acessíveis apenas para não-autenticados
const AUTH_ONLY_PATHS = ["/login"]

// Rotas públicas por prefixo (ex: /login)
const PUBLIC_PREFIXES = ["/login"]

// Rotas públicas por correspondência exata
const PUBLIC_EXACT = ["/"]

const SESSION_COOKIE = "session_id"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionId = request.cookies.get(SESSION_COOKIE)?.value
  const isAuthenticated = !!sessionId
  const isPublic =
    PUBLIC_EXACT.includes(pathname) ||
    PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))

  // Já autenticado tentando acessar /login → redireciona para /home
  if (AUTH_ONLY_PATHS.some((p) => pathname.startsWith(p)) && isAuthenticated) {
    return NextResponse.redirect(new URL("/home", request.url))
  }

  // Não autenticado tentando acessar rota protegida → redireciona para /login
  if (!isPublic && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
}
