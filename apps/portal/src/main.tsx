import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConvexProvider } from 'convex/react'
import { App } from './ui/App'
import { ConfigNotice } from './ui/ConfigNotice'
import { convex } from './convex'
import './styles.css'

// Dev-only console handle for driving the WebMCP tool path without an agent.
if (import.meta.env.DEV) {
  import('./webmcp/tools').then(({ buildTools }) => {
    const tools = Object.fromEntries(buildTools().map((t) => [t.name, t]))
    ;(window as unknown as Record<string, unknown>).__portal = { tools }
  })
}

const root = convex ? (
  <ConvexProvider client={convex}>
    <App />
  </ConvexProvider>
) : (
  <ConfigNotice app="Jobly" />
)

createRoot(document.getElementById('root')!).render(<StrictMode>{root}</StrictMode>)
