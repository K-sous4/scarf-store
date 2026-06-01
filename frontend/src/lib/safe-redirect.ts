/** Allow only same-app relative paths (no protocol-relative or external URLs). */
export function safeRedirectPath(next: string | null, fallback = "/home"): string {
  if (!next) return fallback
  const trimmed = next.trim()
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return fallback
  if (trimmed.includes("://") || trimmed.includes("\\")) return fallback
  return trimmed
}
