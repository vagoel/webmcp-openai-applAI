// Self-contained WebMCP registration + MCP content helpers for THIS app.
//
// Feature-detects the WebMCP API: current spec + Chrome + ChatGPT expose it at
// document.modelContext.registerTool, while the first Chrome preview shipped
// navigator.modelContext. We register through whichever answers.

export interface McpToolDef {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  execute: (input: Record<string, unknown>, ctx?: { signal?: AbortSignal }) => Promise<unknown> | unknown
  annotations?: {
    readOnlyHint?: boolean
    untrustedContentHint?: boolean
  }
  title?: string
}

interface ModelContextLike {
  registerTool: (tool: unknown, options?: unknown) => Promise<unknown> | unknown
}

export function getModelContext(): ModelContextLike | null {
  const d = (globalThis as { document?: { modelContext?: ModelContextLike } }).document
  if (d && d.modelContext && typeof d.modelContext.registerTool === 'function') {
    return d.modelContext
  }
  const n = (globalThis as { navigator?: { modelContext?: ModelContextLike } }).navigator
  if (n && n.modelContext && typeof n.modelContext.registerTool === 'function') {
    return n.modelContext
  }
  return null
}

export function isWebmcpAvailable(): boolean {
  return getModelContext() !== null
}

export interface RegisterResult {
  available: boolean
  registered: string[]
  error?: string
}

let activeRegistration: AbortController | null = null

export async function registerTools(tools: McpToolDef[]): Promise<RegisterResult> {
  const mc = getModelContext()
  if (!mc) return { available: false, registered: [] }
  activeRegistration?.abort()
  const controller = new AbortController()
  activeRegistration = controller
  const registered: string[] = []
  const errors: string[] = []
  for (const t of tools) {
    try {
      await mc.registerTool(
        {
          name: t.name,
          title: t.title,
          description: t.description,
          inputSchema: t.inputSchema,
          annotations: t.annotations,
          execute: async (input: Record<string, unknown>, ctx?: { signal?: AbortSignal }) =>
            t.execute(input ?? {}, ctx),
        },
        { signal: controller.signal },
      )
      registered.push(t.name)
    } catch (err) {
      errors.push(`${t.name}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }
  return {
    available: true,
    registered,
    ...(errors.length ? { error: errors.join('; ') } : {}),
  }
}

// --- MCP content-envelope helpers ---

export interface McpContent {
  content: Array<{ type: 'text'; text: string }>
}

export function text(value: string): McpContent {
  return { content: [{ type: 'text', text: value }] }
}

export function json(value: unknown): McpContent {
  return text(JSON.stringify(value, null, 2))
}

/** Read a trimmed string off an untyped tool input, or '' when absent. */
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
