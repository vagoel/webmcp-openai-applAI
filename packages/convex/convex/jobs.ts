import { query } from './_generated/server'
import { v } from 'convex/values'
import type { Doc } from './_generated/dataModel'

const DEFAULT_LIMIT = 25
const MAX_LIMIT = 100

function matchesText(job: Doc<'jobs'>, q: string): boolean {
  if (!q) return true
  const hay = `${job.title} ${job.company} ${job.skills.join(' ')} ${job.location}`.toLowerCase()
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => hay.includes(term))
}

export const listJobs = query({
  args: {
    discipline: v.optional(v.string()),
    seniority: v.optional(v.string()),
    workMode: v.optional(v.string()),
    remoteOnly: v.optional(v.boolean()),
    skills: v.optional(v.array(v.string())),
    salaryMin: v.optional(v.number()),
    query: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Pick the narrowest available index, then finish in JS (dataset is small).
    let rows: Doc<'jobs'>[]
    if (args.discipline && args.seniority) {
      rows = await ctx.db
        .query('jobs')
        .withIndex('by_discipline_seniority', (ix) =>
          ix.eq('discipline', args.discipline as Doc<'jobs'>['discipline']).eq(
            'seniority',
            args.seniority as Doc<'jobs'>['seniority'],
          ),
        )
        .collect()
    } else if (args.discipline) {
      rows = await ctx.db
        .query('jobs')
        .withIndex('by_discipline', (ix) =>
          ix.eq('discipline', args.discipline as Doc<'jobs'>['discipline']),
        )
        .collect()
    } else if (args.seniority) {
      rows = await ctx.db
        .query('jobs')
        .withIndex('by_seniority', (ix) =>
          ix.eq('seniority', args.seniority as Doc<'jobs'>['seniority']),
        )
        .collect()
    } else {
      rows = await ctx.db.query('jobs').collect()
    }

    const skills = (args.skills ?? []).map((s) => s.toLowerCase()).filter(Boolean)
    const filtered = rows.filter((job) => {
      if (args.workMode && job.workMode !== args.workMode) return false
      if (args.remoteOnly && job.workMode !== 'remote') return false
      if (args.salaryMin != null && job.salaryMax < args.salaryMin) return false
      if (skills.length) {
        const have = job.skills.map((s) => s.toLowerCase())
        if (!skills.every((want) => have.some((h) => h.includes(want)))) return false
      }
      if (!matchesText(job, args.query ?? '')) return false
      return true
    })

    filtered.sort((a, b) => b.postedAt - a.postedAt)

    const total = filtered.length
    const offset = Math.max(0, args.offset ?? 0)
    const limit = Math.min(MAX_LIMIT, Math.max(1, args.limit ?? DEFAULT_LIMIT))
    const page = filtered.slice(offset, offset + limit)

    return {
      total,
      offset,
      limit,
      count: page.length,
      jobs: page,
    }
  },
})

export const getJob = query({
  args: { jobId: v.id('jobs') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.jobId)
  },
})

export const getFilterOptions = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query('jobs').collect()
    const bump = (m: Record<string, number>, k: string) => {
      m[k] = (m[k] ?? 0) + 1
    }
    const discipline: Record<string, number> = {}
    const seniority: Record<string, number> = {}
    const workMode: Record<string, number> = {}
    const skills: Record<string, number> = {}
    let salaryMin = Infinity
    let salaryMax = 0
    for (const j of rows) {
      bump(discipline, j.discipline)
      bump(seniority, j.seniority)
      bump(workMode, j.workMode)
      for (const s of j.skills) bump(skills, s)
      salaryMin = Math.min(salaryMin, j.salaryMin)
      salaryMax = Math.max(salaryMax, j.salaryMax)
    }
    const topSkills = Object.entries(skills)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 40)
      .map(([name, count]) => ({ name, count }))
    return {
      totalJobs: rows.length,
      discipline,
      seniority,
      workMode,
      salaryRange: { min: rows.length ? salaryMin : 0, max: salaryMax },
      topSkills,
    }
  },
})
