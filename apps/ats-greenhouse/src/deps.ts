import { api } from '@webmcp-jobs/convex/api'
import type { Id } from '@webmcp-jobs/convex/dataModel'
import type { AtsDeps } from '@webmcp-jobs/ats-core'
import { convex } from './convex'

// convex.mutation's arg typing is generated; we call it structurally to avoid
// re-declaring the full application argument shape here.
type SubmitFn = (ref: unknown, args: unknown) => Promise<{ applicationId: string }>

export const deps: AtsDeps = {
  async fetchJob(jobId) {
    if (!convex) return null
    const job = await convex.query(api.jobs.getJob, { jobId: jobId as Id<'jobs'> })
    if (!job) return null
    return { _id: job._id, title: job.title, company: job.company, atsProvider: job.atsProvider }
  },
  async submit(args) {
    if (!convex) throw new Error('Backend not configured (missing VITE_CONVEX_URL).')
    return (convex.mutation as unknown as SubmitFn)(api.applications.submitApplication, args)
  },
}
