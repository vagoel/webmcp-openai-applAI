import { useEffect, useState } from 'react'
import { AtsApp } from '@webmcp-jobs/ats-core'
import { registerTools } from './webmcp/register'
import { store, tools } from './app-instance'
import { deps } from './deps'
import { convexConfigured } from './convex'

type Status = 'checking' | 'available' | 'unavailable'
let registered = false

export function App() {
  const [status, setStatus] = useState<Status>('checking')

  useEffect(() => {
    if (registered) return
    registered = true
    registerTools(tools).then((r) => {
      setStatus(r.available ? 'available' : 'unavailable')
      if (r.error) console.warn('WebMCP registration issue:', r.error)
      else console.info('WebMCP tools registered:', r.registered.join(', ') || '(none)')
    })
  }, [])

  return <AtsApp store={store} deps={deps} webmcpStatus={status} backendReady={convexConfigured} />
}
