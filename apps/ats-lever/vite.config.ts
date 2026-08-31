import { defineConfig, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'

// WebMCP requires an origin-isolated document. Send Origin-Agent-Cluster: ?1 in
// dev and preview; production gets it from vercel.json / public/_headers.
function originAgentCluster(): PluginOption {
  const set = (
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
      server.middlewares.use(set)
    },
    configurePreviewServer(server) {
      server.middlewares.use(set)
    },
  }
}

export default defineConfig({
  plugins: [react(), originAgentCluster()],
  server: { host: true, port: 5175 },
  preview: { host: true, port: 5175 },
})
