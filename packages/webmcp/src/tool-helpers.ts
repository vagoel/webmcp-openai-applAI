// MCP content-envelope helpers shared by every site's tools. Every WebMCP tool
// returns { content: [{ type: 'text', text }] }; json() pretty-prints an object
// into that same text envelope.

export interface McpContent {
  content: Array<{ type: 'text'; text: string }>
}

export function text(value: string): McpContent {
  return { content: [{ type: 'text', text: value }] }
}

export function json(value: unknown): McpContent {
  return text(JSON.stringify(value, null, 2))
}

/** Read a value off an untyped tool input as a trimmed string, or '' when absent. */
export function str(input: Record<string, unknown>, key: string): string {
  const v = input[key]
  return typeof v === 'string' ? v.trim() : ''
}

/** Read a finite number off an untyped tool input, or undefined. */
export function num(input: Record<string, unknown>, key: string): number | undefined {
  const v = input[key]
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v)
  return undefined
}

/** Read a boolean off an untyped tool input (accepts real booleans + "true"/"false"). */
export function bool(input: Record<string, unknown>, key: string): boolean | undefined {
  const v = input[key]
  if (typeof v === 'boolean') return v
  if (v === 'true') return true
  if (v === 'false') return false
  return undefined
}
