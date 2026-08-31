import type { PluginOption } from 'vite'

// WebMCP requires an origin-isolated document. The browser opts a document into
// its own origin-keyed agent cluster only when the response carries this header.
// Without it, document.modelContext.registerTool rejects with a SecurityError.
// (Cloudflare Pages / Netlify get the same header from public/_headers; Vercel
// from vercel.json.) This plugin covers `vite` (dev) and `vite preview`.
export function originAgentCluster(): PluginOption {
  const setHeader = (
    _req: unknown,
    res: { setHeader: (k: string, v: string) => void },
    next: () => void,
  ) => {
    res.setHeader('Origin-Agent-Cluster', '?1')
    next()
  }
  return {
    name: 'origin-agent-cluster-header',
    configureServer(server) {
      server.middlewares.use(setHeader)
    },
    configurePreviewServer(server) {
      server.middlewares.use(setHeader)
    },
  }
}
