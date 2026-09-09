/** Only http(s) or same-origin paths. Empty / junk URLs return null so capture can continue. */
export function safeModelUrl(raw?: string | null): string | null {
  if (!raw || typeof raw !== "string") return null
  const value = raw.trim()
  if (!value) return null
  if (/^(javascript|data|vbscript|file):/i.test(value)) return null
  if (value.startsWith("/") && !value.startsWith("//")) return value
  try {
    const parsed = new URL(value)
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null
    return parsed.href
  } catch {
    return null
  }
}
