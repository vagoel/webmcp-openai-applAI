// Thin, defensive wrapper over the WebMCP registration API.
//
// The API is young and has already shifted shape: current spec + Chrome + ChatGPT
// expose it at document.modelContext.registerTool, but the first Chrome preview
// shipped navigator.modelContext. We feature-detect both and register through
// whichever answers, so the same build works across the flag preview, the origin
// trial, and ChatGPT's in-app browser.

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
