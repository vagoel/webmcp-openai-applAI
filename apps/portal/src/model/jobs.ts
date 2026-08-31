import type { Doc } from '@webmcp-jobs/convex/dataModel'

export type Job = Doc<'jobs'>

export const DISCIPLINE_LABELS: Record<string, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  fullstack: 'Full Stack',
  mobile: 'Mobile',
  ml: 'ML / AI',
  data_eng: 'Data Engineering',
  data_science: 'Data Science',
  devops: 'DevOps / SRE',
  security: 'Security',
  platform: 'Platform',
  embedded: 'Embedded',
}

export const SENIORITY_LABELS: Record<string, string> = {
  intern: 'Intern',
  junior: 'Junior',
  mid: 'Mid',
  senior: 'Senior',
  staff: 'Staff',
  principal: 'Principal',
  manager: 'Manager',
}

export const WORK_MODE_LABELS: Record<string, string> = {
  remote: 'Remote',
  hybrid: 'Hybrid',
  onsite: 'On-site',
}

export const DISCIPLINE_ORDER = Object.keys(DISCIPLINE_LABELS)
export const SENIORITY_ORDER = Object.keys(SENIORITY_LABELS)
export const WORK_MODE_ORDER = Object.keys(WORK_MODE_LABELS)

const ATS_BASE: Record<string, string> = {
  greenhouse: (import.meta.env.VITE_ATS_GREENHOUSE_URL as string) || 'http://localhost:5174',
  lever: (import.meta.env.VITE_ATS_LEVER_URL as string) || 'http://localhost:5175',
}

export function applyUrl(job: Pick<Job, '_id' | 'atsProvider'>): string {
  return `${ATS_BASE[job.atsProvider]}/?job=${job._id}`
}

export function fmtSalary(min: number, max: number): string {
  const k = (n: number) => `$${Math.round(n / 1000)}k`
  return `${k(min)}–${k(max)}`
}

export function fmtPosted(postedAt: number, now = Date.now()): string {
  const days = Math.max(0, Math.floor((now - postedAt) / 86_400_000))
  if (days === 0) return 'Today'
  if (days === 1) return '1 day ago'
  if (days < 30) return `${days} days ago`
  const weeks = Math.floor(days / 7)
  return `${weeks} week${weeks === 1 ? '' : 's'} ago`
}
