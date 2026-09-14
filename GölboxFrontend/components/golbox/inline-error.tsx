export function InlineError({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-3 rounded-[var(--gol-radius-lg)] border border-border bg-card px-4 py-3"
    >
      <p className="text-sm text-muted-foreground">{message}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="min-h-11 shrink-0 text-sm font-semibold text-primary">
          Tekrar dene
        </button>
      ) : null}
    </div>
  )
}
