import { useState } from 'react'
import {
  DISCIPLINE_LABELS,
  SENIORITY_LABELS,
  WORK_MODE_LABELS,
  applyUrl,
  fmtSalary,
  fmtPosted,
  type Job,
} from '../model/jobs'

const ATS_NAME: Record<string, string> = { greenhouse: 'Greenhold', lever: 'Leverly' }

export function JobDetail({ job }: { job: Job | null | undefined }) {
  const [redirecting, setRedirecting] = useState(false)
  if (!job) {
    return (
      <div className="detail detail-empty">
        <p>Select a job to see the full description and apply.</p>
      </div>
    )
  }
  const href = applyUrl(job)
  const atsName = ATS_NAME[job.atsProvider]
  const apply = () => {
    setRedirecting(true)
    window.setTimeout(() => {
      window.location.href = href
    }, 1200)
  }
  if (redirecting) {
    return (
      <div className="detail redirecting">
        <span className="spinner" />
        <p>
          Redirecting you to <strong>{atsName}</strong>…
        </p>
        <p className="apply-hint">Please do not close this window.</p>
      </div>
    )
  }
  return (
    <div className="detail">
      <div className="detail-head">
        <h2>{job.title}</h2>
        <div className="detail-company">{job.company}</div>
        <div className="detail-salary">{fmtSalary(job.salaryMin, job.salaryMax)} · base</div>
        <div className="job-tags">
          <span className="tag">{DISCIPLINE_LABELS[job.discipline]}</span>
          <span className="tag">{SENIORITY_LABELS[job.seniority]}</span>
          <span className="tag tag-mode">{WORK_MODE_LABELS[job.workMode]}</span>
          <span className="tag tag-loc">{job.location}</span>
        </div>
        <button className="apply-btn" onClick={apply}>
          Apply on {atsName} →
        </button>
        <div className="apply-hint">
          Posted {fmtPosted(job.postedAt).toLowerCase()} · applications open in {atsName}
        </div>
      </div>

      <section className="detail-section">
        <h3>About the role</h3>
        <p>{job.description}</p>
      </section>

      <section className="detail-section">
        <h3>Requirements</h3>
        <ul className="req-list">
          {job.requirements.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </section>

      <section className="detail-section">
        <h3>Skills</h3>
        <div className="job-skills">
          {job.skills.map((s) => (
            <span key={s} className="skill">
              {s}
            </span>
          ))}
        </div>
      </section>
    </div>
  )
}
