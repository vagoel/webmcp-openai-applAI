import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const submitApplication = mutation({
  args: {
    jobId: v.id('jobs'),
    fullName: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.string(),
    phone: v.optional(v.string()),
    location: v.optional(v.string()),
    links: v.optional(v.any()),
    resumeText: v.optional(v.string()),
    resumeFilename: v.optional(v.string()),
    coverLetter: v.optional(v.string()),
    answers: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId)
    if (!job) throw new Error(`Unknown jobId: ${args.jobId}`)
    const id = await ctx.db.insert('applications', {
      ...args,
      jobTitle: job.title,
      company: job.company,
      atsProvider: job.atsProvider,
      submittedAt: Date.now(),
    })
    return { applicationId: id }
  },
})

// Handy for verifying submissions during development / the demo.
export const listApplications = query({
  args: { jobId: v.optional(v.id('jobs')) },
  handler: async (ctx, args) => {
    if (args.jobId) {
      const jobId = args.jobId
      return await ctx.db
        .query('applications')
        .withIndex('by_job', (ix) => ix.eq('jobId', jobId))
        .order('desc')
        .collect()
    }
    return await ctx.db.query('applications').order('desc').take(50)
  },
})
