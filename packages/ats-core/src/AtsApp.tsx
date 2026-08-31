import { useEffect, useState } from 'react'
import { registerTools, type McpToolDef } from '@webmcp-jobs/webmcp/register'
import type { FormStore } from './store'
import type { AtsDeps } from './types'
import { useFormStore } from './useFormStore'
import { FormRenderer } from './FormRenderer'

type WebmcpStatus = 'checking' | 'available' | 'unavailable'
type JobStatus = 'none' | 'loading' | 'ok' | 'missing'

let toolsRegistered = false

export function AtsApp({
  store,
  deps,
  tools,
  backendReady = true,
}: {
  store: FormStore
  deps: AtsDeps
  tools: McpToolDef[]
  backendReady?: boolean
}) {
  const snap = useFormStore(store)
  const [status, setStatus] = useState<WebmcpStatus>('checking')
  const [jobStatus, setJobStatus] = useState<JobStatus>('none')

  useEffect(() => {
    if (toolsRegistered) return
    toolsRegistered = true
    registerTools(tools).then((r) => {
      setStatus(r.available ? 'available' : 'unavailable')
      if (r.error) console.warn('WebMCP registration issue:', r.error)
      else console.info('WebMCP tools registered:', r.registered.join(', ') || '(none)')
    })
  }, [tools])

  useEffect(() => {
    const jobId = new URLSearchParams(window.location.search).get('job')
    if (!jobId || !backendReady) return
    setJobStatus('loading')
    let cancelled = false
    deps
      .fetchJob(jobId)
      .then((job) => {
        if (cancelled) return
        store.setJob(jobId, job)
        setJobStatus(job ? 'ok' : 'missing')
      })
      .catch(() => !cancelled && setJobStatus('missing'))
    return () => {
      cancelled = true
    }
  }, [store, deps, backendReady])

  const cfg = snap.config
  const statusLabel =
    status === 'available' ? 'WebMCP connected' : status === 'unavailable' ? 'WebMCP not detected' : 'Checking WebMCP…'

  return (
    <div className={`ats ats-${cfg.provider}`}>
      <header className="ats-top">
        <div className="ats-brand">
          <span className="ats-mark" aria-hidden>
            {cfg.provider === 'greenhouse' ? '❖' : '▸'}
          </span>
          {cfg.brand}
          {cfg.tagline ? <span className="ats-tag">{cfg.tagline}</span> : null}
        </div>
        <span className={`badge badge-${status}`} title="Whether a WebMCP agent surface is present">
          <span className="badge-dot" />
          {statusLabel}
        </span>
      </header>

      {!backendReady ? (
        <div className="ats-notice">
          <h1>{cfg.brand}</h1>
          <p>The Convex backend isn't configured (missing VITE_CONVEX_URL). Start it in packages/convex.</p>
        </div>
      ) : (
        <main className="ats-main">
          <div className="ats-jobline">
            {snap.job ? (
              <>
                Applying for <strong>{snap.job.title}</strong> at <strong>{snap.job.company}</strong>
              </>
            ) : jobStatus === 'loading' ? (
              'Loading role…'
            ) : jobStatus === 'missing' ? (
              'That role could not be found. You can still preview the form.'
            ) : (
              'No role attached — open this form from a job on the portal.'
            )}
          </div>
          <FormRenderer store={store} deps={deps} />
        </main>
      )}
    </div>
  )
}
