import { useEffect, useState } from 'react'
import type { FormStore } from './store'
import type { AtsDeps } from './types'
import { useFormStore } from './useFormStore'
import { FormRenderer } from './FormRenderer'
import { JobPosting } from './JobPosting'

export type WebmcpStatus = 'checking' | 'available' | 'unavailable'
type JobStatus = 'none' | 'loading' | 'ok' | 'missing'

/** Job id from the posting URL: /jobs/<id> (preferred) or ?job=<id> (fallback). */
function readJobId(): string | null {
  const m = window.location.pathname.match(/\/jobs\/([^/?#]+)/)
  if (m) return decodeURIComponent(m[1])
  return new URLSearchParams(window.location.search).get('job')
}

// Shared UI shell for both ATS sites. Each app registers its OWN WebMCP tools and
// passes the resulting status in; this component owns only the posting/form UI.
export function AtsApp({
  store,
  deps,
  webmcpStatus,
  backendReady = true,
}: {
  store: FormStore
  deps: AtsDeps
  webmcpStatus: WebmcpStatus
  backendReady?: boolean
}) {
  const snap = useFormStore(store)
  const [jobStatus, setJobStatus] = useState<JobStatus>('none')

  useEffect(() => {
    const jobId = readJobId()
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

  // Leave-guard: warn on navigating away from a started, unsubmitted application.
  const inProgress = snap.phase === 'form' && !snap.submitted
  useEffect(() => {
    if (!inProgress) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [inProgress])

  const cfg = snap.config
  const statusLabel =
    webmcpStatus === 'available'
      ? 'WebMCP connected'
      : webmcpStatus === 'unavailable'
        ? 'WebMCP not detected'
        : 'Checking WebMCP…'

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
        <span className={`badge badge-${webmcpStatus}`} title="Whether a WebMCP agent surface is present">
          <span className="badge-dot" />
          {statusLabel}
        </span>
      </header>

      {!backendReady ? (
        <div className="ats-notice">
          <h1>{cfg.brand}</h1>
          <p>The Convex backend isn't configured (missing VITE_CONVEX_URL). Start it in packages/convex.</p>
        </div>
      ) : snap.phase === 'posting' ? (
        <main className="ats-main">
          {snap.job ? (
            <JobPosting job={snap.job} config={cfg} onApply={() => store.startApplication()} />
          ) : jobStatus === 'loading' ? (
            <div className="ats-jobline">Loading role…</div>
          ) : (
            <div className="ats-jobline">
              {jobStatus === 'missing' ? 'That role could not be found. ' : 'No role attached. '}
              <button className="link-btn" onClick={() => store.startApplication()}>
                Continue to the form
              </button>
            </div>
          )}
        </main>
      ) : (
        <main className="ats-main">
          <div className="ats-jobline">
            {snap.job ? (
              <>
                Applying for <strong>{snap.job.title}</strong> at <strong>{snap.job.company}</strong>
              </>
            ) : (
              'Complete your application'
            )}
          </div>
          <FormRenderer store={store} deps={deps} />
        </main>
      )}
    </div>
  )
}
