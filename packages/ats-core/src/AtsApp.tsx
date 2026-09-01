import { useEffect, useState, useSyncExternalStore } from 'react'
import type { FormStore } from './store'
import type { AtsDeps } from './types'
import { useFormStore } from './useFormStore'
import { FormRenderer } from './FormRenderer'
import { JobPosting } from './JobPosting'
import { AccountView } from './AccountView'
import { getUserEmail, setUserEmail, clearUserEmail, isValidEmail, subscribeAuth } from './account'

export type WebmcpStatus = 'checking' | 'available' | 'unavailable'
type JobStatus = 'none' | 'loading' | 'ok' | 'missing'

/** Job id from the posting URL: /jobs/<id> (preferred) or ?job=<id> (fallback). */
function readJobId(): string | null {
  const m = window.location.pathname.match(/\/jobs\/([^/?#]+)/)
  if (m) return decodeURIComponent(m[1])
  return new URLSearchParams(window.location.search).get('job')
}

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

  // Lightweight email "login" — reactive so an agent's sign_in tool updates the UI.
  const email = useSyncExternalStore(subscribeAuth, getUserEmail, getUserEmail)
  const [signingIn, setSigningIn] = useState(false)
  const [draft, setDraft] = useState('')
  const [showAccount, setShowAccount] = useState(false)

  const saveEmail = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValidEmail(draft)) return
    setUserEmail(draft.trim())
    setSigningIn(false)
    setDraft('')
  }
  const signOut = () => {
    clearUserEmail()
    setShowAccount(false)
  }

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

  // Pre-fill the form's email with the logged-in email (only when empty) so the
  // submitted application shows up under this account.
  useEffect(() => {
    if (!email) return
    const v = store.getValues()
    if (store.fieldById('email') && !String(v.email ?? '').trim()) store.setField('email', email)
    if (store.fieldById('confirmEmail') && !String(v.confirmEmail ?? '').trim()) store.setField('confirmEmail', email)
  }, [email, store, snap.phase])

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
        <div className="ats-top-right">
          {email ? (
            <>
              <button
                className={`account-btn${showAccount ? ' account-btn-on' : ''}`}
                onClick={() => setShowAccount((v) => !v)}
              >
                📄 My applications
              </button>
              <span className="account-email" title={email}>
                {email}
              </span>
              <button className="link-btn" onClick={signOut}>
                Sign out
              </button>
            </>
          ) : signingIn ? (
            <form className="account-signin" onSubmit={saveEmail}>
              <input
                className="account-input"
                type="email"
                placeholder="you@email.com"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                autoFocus
              />
              <button className="account-save" type="submit">
                Sign in
              </button>
            </form>
          ) : (
            <button className="account-btn" onClick={() => setSigningIn(true)}>
              Sign in
            </button>
          )}
          <span className={`badge badge-${webmcpStatus}`} title="Whether a WebMCP agent surface is present">
            <span className="badge-dot" />
            {statusLabel}
          </span>
        </div>
      </header>

      {!backendReady ? (
        <div className="ats-notice">
          <h1>{cfg.brand}</h1>
          <p>The Convex backend isn't configured (missing VITE_CONVEX_URL). Start it in packages/convex.</p>
        </div>
      ) : showAccount && email ? (
        <AccountView email={email} provider={cfg.provider} brand={cfg.brand} deps={deps} onBack={() => setShowAccount(false)} />
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
