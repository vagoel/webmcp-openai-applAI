import { useState } from 'react'
import type { FormConfig, JobInfo } from './types'

const WORK_MODE: Record<string, string> = { remote: 'Remote', hybrid: 'Hybrid', onsite: 'On-site' }

function salary(min?: number, max?: number): string | null {
  if (min == null || max == null) return null
  const k = (n: number) => `$${Math.round(n / 1000)}k`
  return `${k(min)}–${k(max)}`
}

// The ATS job posting: what a candidate sees on the job URL before applying.
export function JobPosting({
  job,
  config,
  onApply,
}: {
  job: JobInfo
  config: FormConfig
  onApply: () => void
}) {
  const pay = salary(job.salaryMin, job.salaryMax)
  const [loading, setLoading] = useState(false)
  const doApply = () => {
    setLoading(true)
    window.setTimeout(() => onApply(), 800)
  }
  const applyBtn = (
    <button className="btn-primary posting-apply" disabled={loading} onClick={doApply}>
      {loading ? 'Loading application…' : 'Apply for this role'}
    </button>
  )
  return (
    <div className="posting">
      <div className="urgency-strip">🔥 High demand — applications close soon!</div>
      <div className="posting-head">
        <h1>{job.title}</h1>
        <div className="posting-company">
          {job.company}
          {job.location ? <span className="posting-dot">·</span> : null}
          {job.location}
        </div>
        <div className="posting-meta">
          {job.workMode ? <span className="tag tag-mode">{WORK_MODE[job.workMode] ?? job.workMode}</span> : null}
          {pay ? <span className="posting-pay">{pay} · base</span> : null}
        </div>
        {applyBtn}
        <div className="posting-note">Applying through {config.brand}</div>
      </div>

      {job.description ? (
        <section className="posting-section">
          <h2>About the role</h2>
          <p>{job.description}</p>
        </section>
      ) : null}

      {job.requirements?.length ? (
        <section className="posting-section">
          <h2>Requirements</h2>
          <ul className="posting-reqs">
            {job.requirements.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {job.skills?.length ? (
        <section className="posting-section">
          <h2>Skills</h2>
          <div className="posting-skills">
            {job.skills.map((s) => (
              <span key={s} className="skill">
                {s}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <div className="posting-foot">{applyBtn}</div>
    </div>
  )
}
