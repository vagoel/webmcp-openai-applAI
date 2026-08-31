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
  if (!job) {
    return (
      <div className="detail detail-empty">
        <p>Select a job to see the full description and apply.</p>
      </div>
    )
  }
  const href = applyUrl(job)
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
        <a className="apply-btn" href={href} target="_blank" rel="noreferrer">
          Apply on {ATS_NAME[job.atsProvider]} →
        </a>
        <div className="apply-hint">
          Posted {fmtPosted(job.postedAt).toLowerCase()} · applications open in {ATS_NAME[job.atsProvider]}
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
