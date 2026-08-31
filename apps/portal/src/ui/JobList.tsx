import {
  DISCIPLINE_LABELS,
  SENIORITY_LABELS,
  WORK_MODE_LABELS,
  fmtSalary,
  fmtPosted,
  type Job,
} from '../model/jobs'

export function JobList({
  jobs,
  selectedId,
  onSelect,
}: {
  jobs: Job[]
  selectedId: string | null
  onSelect: (job: Job) => void
}) {
  if (!jobs.length) {
    return <div className="empty">No jobs match these filters.</div>
  }
  return (
    <ul className="job-list">
      {jobs.map((job, i) => (
        <li key={job._id}>
          <button
            className={`job-card${selectedId === job._id ? ' job-card-on' : ''}`}
            onClick={() => onSelect(job)}
          >
            {i % 4 === 1 ? <div className="urgent-badge">🔥 URGENT · apply today</div> : null}
            <div className="job-card-top">
              <span className="job-title">{job.title}</span>
              <span className="job-salary">{fmtSalary(job.salaryMin, job.salaryMax)}</span>
            </div>
            <div className="job-company">{job.company}</div>
            <div className="job-tags">
              <span className="tag">{DISCIPLINE_LABELS[job.discipline]}</span>
              <span className="tag">{SENIORITY_LABELS[job.seniority]}</span>
              <span className="tag tag-mode">{WORK_MODE_LABELS[job.workMode]}</span>
              <span className="tag tag-loc">{job.location}</span>
            </div>
            <div className="job-skills">
              {job.skills.slice(0, 5).map((s) => (
                <span key={s} className="skill">
                  {s}
                </span>
              ))}
            </div>
            <div className="job-posted">{fmtPosted(job.postedAt)}</div>
          </button>
        </li>
      ))}
    </ul>
  )
}
