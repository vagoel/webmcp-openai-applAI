import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AtsApp } from '@webmcp-jobs/ats-core'
import '@webmcp-jobs/ats-core/ats.css'
import { store, tools } from './app-instance'
import { deps } from './deps'
import { convexConfigured } from './convex'
import './theme.css'

// Dev-only console handle for driving the WebMCP tool path without an agent.
if (import.meta.env.DEV) {
  ;(window as unknown as Record<string, unknown>).__greenhold = {
    store,
    tools: Object.fromEntries(tools.map((t) => [t.name, t])),
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AtsApp store={store} deps={deps} tools={tools} backendReady={convexConfigured} />
  </StrictMode>,
)
