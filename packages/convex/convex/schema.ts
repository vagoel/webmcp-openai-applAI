import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export const DISCIPLINES = [
  'frontend',
  'backend',
  'fullstack',
  'mobile',
  'ml',
  'data_eng',
  'data_science',
  'devops',
  'security',
  'platform',
  'embedded',
] as const

export const SENIORITIES = [
  'intern',
  'junior',
  'mid',
  'senior',
  'staff',
  'principal',
  'manager',
] as const

export const WORK_MODES = ['remote', 'hybrid', 'onsite'] as const
export const ATS_PROVIDERS = ['greenhouse', 'lever'] as const

const disciplineValidator = v.union(...DISCIPLINES.map((d) => v.literal(d)))
const seniorityValidator = v.union(...SENIORITIES.map((s) => v.literal(s)))
const workModeValidator = v.union(...WORK_MODES.map((w) => v.literal(w)))
const atsValidator = v.union(...ATS_PROVIDERS.map((a) => v.literal(a)))

export default defineSchema({
  jobs: defineTable({
    title: v.string(),
    company: v.string(),
    discipline: disciplineValidator,
    seniority: seniorityValidator,
    workMode: workModeValidator,
    location: v.string(),
    salaryMin: v.number(),
    salaryMax: v.number(),
    skills: v.array(v.string()),
    description: v.string(),
    requirements: v.array(v.string()),
    atsProvider: atsValidator,
    postedAt: v.number(),
  })
    .index('by_discipline', ['discipline'])
    .index('by_seniority', ['seniority'])
    .index('by_discipline_seniority', ['discipline', 'seniority'])
    .searchIndex('search_title', {
      searchField: 'title',
      filterFields: ['discipline', 'workMode'],
    }),

  applications: defineTable({
    jobId: v.id('jobs'),
    jobTitle: v.string(),
    company: v.string(),
    atsProvider: atsValidator,
    // Identity — Greenhouse splits first/last; Lever uses a single fullName.
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
    // All remaining page/section answers, keyed by field id.
    answers: v.optional(v.any()),
    submittedAt: v.number(),
  }).index('by_job', ['jobId']),
})
