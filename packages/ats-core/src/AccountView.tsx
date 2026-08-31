import { useEffect, useState } from 'react'
import type { AtsDeps, SubmittedApplication } from './types'

function fmtDate(ms: number): string {
  try {
    return new Date(ms).toLocaleString()
  } catch {
    return ''
  }
}

export function AccountView({
  email,
  provider,
  brand,
  deps,
  onBack,
}: {
  email: string
  provider: string
  brand: string
  deps: AtsDeps
  onBack: () => void
}) {
  const [apps, setApps] = useState<SubmittedApplication[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setApps(null)
    setError(null)
    deps
      .listApplications(email, provider)
      .then((r) => !cancelled && setApps(r))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : String(e)))
    return () => {
      cancelled = true
    }
  }, [email, provider, deps])

  return (
    <main className="ats-main">
      <div className="account-head">
        <button className="link-btn" onClick={onBack}>
          ← Back to application
        </button>
        <h1>My applications</h1>
        <div className="account-sub">
          Signed in as <strong>{email}</strong> · {brand}
        </div>
      </div>

      {error ? <div className="form-error">{error}</div> : null}

      {apps === null ? (
        <div className="ats-jobline">Loading your applications…</div>
      ) : apps.length === 0 ? (
        <div className="ats-jobline">No applications submitted under this email on {brand} yet.</div>
      ) : (
        <ul className="app-list">
          {apps.map((a) => (
            <li key={a._id} className="app-row">
              <button className="app-row-head" onClick={() => setOpenId(openId === a._id ? null : a._id)}>
                <div>
                  <div className="app-title">{a.jobTitle}</div>
                  <div className="app-company">{a.company}</div>
                </div>
                <div className="app-meta">
                  <span className="app-date">{fmtDate(a.submittedAt)}</span>
                  <span className="app-caret" aria-hidden>
                    {openId === a._id ? '▾' : '▸'}
                  </span>
                </div>
              </button>
              {openId === a._id ? <AppDetail app={a} /> : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

function AppDetail({ app }: { app: SubmittedApplication }) {
  const rows: Array<[string, string]> = []
  const push = (k: string, v: unknown) => {
    if (v !== undefined && v !== null && String(v) !== '') rows.push([k, String(v)])
  }
  push('Full name', app.fullName)
  push('First name', app.firstName)
  push('Last name', app.lastName)
  push('Email', app.email)
  push('Phone', app.phone)
  push('Location', app.location)
  if (app.links) for (const [k, v] of Object.entries(app.links)) push(`Link · ${k}`, v)
  if (app.answers)
    for (const [k, v] of Object.entries(app.answers)) push(k, typeof v === 'boolean' ? (v ? 'Yes' : 'No') : v)

  return (
    <div className="app-detail">
      <table className="app-table">
        <tbody>
          {rows.map(([k, v], i) => (
            <tr key={i}>
              <th>{k}</th>
              <td>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {app.resumeText ? (
        <div className="app-doc">
          <h4>Resume{app.resumeFilename ? ` (${app.resumeFilename})` : ''}</h4>
          <pre>{app.resumeText}</pre>
        </div>
      ) : null}
      {app.coverLetter ? (
        <div className="app-doc">
          <h4>Cover letter</h4>
          <pre>{app.coverLetter}</pre>
        </div>
      ) : null}
    </div>
  )
}
