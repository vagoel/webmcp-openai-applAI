export type WebmcpStatus = 'checking' | 'available' | 'unavailable'

export function StatusBadge({ status }: { status: WebmcpStatus }) {
  const label =
    status === 'available'
      ? 'WebMCP connected'
      : status === 'unavailable'
        ? 'WebMCP not detected'
        : 'Checking WebMCP…'
  return (
    <span className={`badge badge-${status}`} title="Whether a WebMCP agent surface is present">
      <span className="badge-dot" />
      {label}
    </span>
  )
}
