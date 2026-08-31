import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { originAgentCluster } from '@webmcp-jobs/webmcp/vite'

export default defineConfig({
  plugins: [react(), originAgentCluster()],
  server: { host: true, port: 5175 },
  preview: { host: true, port: 5175 },
})
