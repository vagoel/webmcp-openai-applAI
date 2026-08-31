// Generates ~120 realistic software-engineering job listings as JSONL for
// `convex import --table jobs`. Deterministic (fixed PRNG seed) so reruns are
// stable. Salary bands + taxonomy grounded in 2025 US market data.
//
//   node seed/generate.mjs           -> writes seed/jobs.jsonl
//
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const COUNT = 120
const NOW = Date.parse('2026-08-31T12:00:00Z')

// Deterministic PRNG (mulberry32).
let _s = 0x9e3779b9
function rnd() {
  _s |= 0
  _s = (_s + 0x6d2b79f5) | 0
  let t = Math.imul(_s ^ (_s >>> 15), 1 | _s)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const pick = (arr) => arr[Math.floor(rnd() * arr.length)]
const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1))
const round = (n, step) => Math.round(n / step) * step
function weightedPick(pairs) {
  const total = pairs.reduce((s, [, w]) => s + w, 0)
  let r = rnd() * total
  for (const [val, w] of pairs) {
    if ((r -= w) <= 0) return val
  }
  return pairs[pairs.length - 1][0]
}
function sample(arr, lo, hi) {
  const n = Math.min(arr.length, int(lo, hi))
  const copy = [...arr]
  const out = []
  for (let i = 0; i < n; i++) out.push(copy.splice(Math.floor(rnd() * copy.length), 1)[0])
  return out
}

const DISCIPLINES = [
  ['frontend', 12],
  ['backend', 16],
  ['fullstack', 14],
  ['mobile', 9],
  ['ml', 12],
  ['data_eng', 9],
  ['data_science', 8],
  ['devops', 10],
  ['security', 6],
  ['platform', 8],
  ['embedded', 6],
]

const SENIORITY = [
  ['intern', 5],
  ['junior', 12],
  ['mid', 26],
  ['senior', 28],
  ['staff', 14],
  ['principal', 7],
  ['manager', 8],
]

// Base-salary bands (USD) per seniority.
const BANDS = {
  intern: [70000, 120000],
  junior: [95000, 140000],
  mid: [130000, 190000],
  senior: [170000, 240000],
  staff: [210000, 300000],
  principal: [250000, 400000],
  manager: [200000, 320000],
}

const SENIORITY_PREFIX = {
  intern: '',
  junior: 'Junior ',
  mid: '',
  senior: 'Senior ',
  staff: 'Staff ',
  principal: 'Principal ',
  manager: '',
}

const STEMS = {
  frontend: ['Frontend Engineer', 'UI Engineer', 'Web Engineer', 'Frontend Developer'],
  backend: ['Backend Engineer', 'Software Engineer', 'API Engineer', 'Backend Developer'],
  fullstack: ['Full Stack Engineer', 'Product Engineer', 'Full Stack Developer'],
  mobile: ['iOS Engineer', 'Android Engineer', 'Mobile Engineer'],
  ml: ['Machine Learning Engineer', 'AI Engineer', 'Applied Scientist', 'Research Engineer'],
  data_eng: ['Data Engineer', 'Analytics Engineer'],
  data_science: ['Data Scientist', 'ML Data Scientist'],
  devops: ['DevOps Engineer', 'Site Reliability Engineer', 'Cloud Engineer'],
  security: ['Security Engineer', 'AppSec Engineer', 'Product Security Engineer'],
  platform: ['Platform Engineer', 'Infrastructure Engineer', 'Developer Experience Engineer'],
  embedded: ['Embedded Engineer', 'Firmware Engineer'],
}

const SKILLS = {
  frontend: ['React', 'TypeScript', 'Next.js', 'Vite', 'CSS', 'Tailwind', 'Redux', 'Accessibility', 'Web Vitals', 'GraphQL'],
  backend: ['Go', 'Java', 'Python', 'Node.js', 'PostgreSQL', 'gRPC', 'Redis', 'Kafka', 'Microservices', 'REST'],
  fullstack: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'GraphQL', 'REST', 'AWS', 'Docker'],
  mobile: ['Swift', 'SwiftUI', 'Kotlin', 'Jetpack Compose', 'Coroutines', 'UIKit', 'CoreData', 'Xcode'],
  ml: ['PyTorch', 'TensorFlow', 'LLMs', 'CUDA', 'Hugging Face', 'RAG', 'Vector DBs', 'MLOps', 'Python'],
  data_eng: ['Spark', 'Airflow', 'dbt', 'Snowflake', 'Kafka', 'Python', 'SQL', 'ETL'],
  data_science: ['Python', 'pandas', 'scikit-learn', 'SQL', 'Statistics', 'A/B Testing', 'Experimentation'],
  devops: ['Kubernetes', 'Terraform', 'AWS', 'GCP', 'Docker', 'CI/CD', 'Prometheus', 'Grafana'],
  security: ['SAST', 'DAST', 'Threat Modeling', 'OWASP', 'IAM', 'Cryptography', 'Pentesting'],
  platform: ['Go', 'Kubernetes', 'Bazel', 'gRPC', 'Service Mesh', 'Internal Tooling', 'Terraform'],
  embedded: ['C', 'C++', 'RTOS', 'ARM', 'I2C', 'SPI', 'Rust', 'Firmware'],
}

const COMPANIES = [
  'Northstar', 'Meridian Labs', 'Helio', 'Vantage', 'Aperture Systems', 'Flowbase',
  'Loopwork', 'Cortex AI', 'Pinecrest', 'Bytemark', 'Nimbus', 'Quanta', 'Driftwood',
  'Solstice', 'Fathom', 'Ledgerline', 'Payframe', 'Vaultpay', 'Coreledger', 'Deployr',
  'Forgeworks', 'Traceloop', 'Stackforge', 'Beacon', 'Orbital', 'Riverstone', 'Alto',
  'Kindred Systems', 'Lumen Data', 'Signalfire',
]

const LOCATIONS = [
  'San Francisco, CA', 'Mountain View, CA', 'Seattle, WA', 'New York, NY', 'Austin, TX',
  'Boston, MA', 'Denver, CO', 'Chicago, IL', 'Los Angeles, CA', 'Atlanta, GA',
]

const YEARS = { intern: '0', junior: '0-2', mid: '2-5', senior: '5-8', staff: '8-12', principal: '12+', manager: '8+' }

function makeTitle(discipline, seniority) {
  if (seniority === 'intern') return `${pick(STEMS[discipline])} Intern`
  if (seniority === 'manager') return `Engineering Manager, ${discipline.replace('_', ' ')}`
  return `${SENIORITY_PREFIX[seniority]}${pick(STEMS[discipline])}`.trim()
}

function makeSalary(seniority, discipline) {
  const [lo, hi] = BANDS[seniority]
  const premium = discipline === 'ml' ? 1.3 + rnd() * 0.25 : 1
  const width = hi - lo
  let min = lo + rnd() * width * 0.35
  let max = min + width * (0.3 + rnd() * 0.4) + 15000
  min = round(min * premium, 5000)
  max = round(Math.min(hi * premium * 1.05, max * premium), 5000)
  if (max <= min) max = min + 20000
  return [min, max]
}

function makeDescription(title, company, discipline, workMode, skills) {
  const modeText = { remote: 'fully remote (US)', hybrid: 'hybrid', onsite: 'on-site' }[workMode]
  return (
    `${company} is hiring a ${title} to join our ${discipline.replace('_', ' ')} team. ` +
    `This is a ${modeText} role. You will design, build, and ship product features end to end, ` +
    `collaborating closely with design, product, and other engineers. ` +
    `Our stack includes ${skills.slice(0, 4).join(', ')}.`
  )
}

function makeRequirements(seniority, skills) {
  const reqs = [
    `${YEARS[seniority]} years of relevant experience`,
    `Strong proficiency with ${skills.slice(0, 3).join(', ')}`,
    'Solid communication and collaboration skills',
  ]
  if (['senior', 'staff', 'principal', 'manager'].includes(seniority)) {
    reqs.push('Track record of leading projects and mentoring engineers')
  }
  return reqs
}

const jobs = []
for (let i = 0; i < COUNT; i++) {
  const discipline = weightedPick(DISCIPLINES)
  const seniority = weightedPick(SENIORITY)
  const workMode = weightedPick([
    ['remote', 35],
    ['hybrid', 40],
    ['onsite', 25],
  ])
  const company = pick(COMPANIES)
  const location = workMode === 'remote' ? 'Remote (US)' : pick(LOCATIONS)
  const skills = sample(SKILLS[discipline], 4, 7)
  const title = makeTitle(discipline, seniority)
  const [salaryMin, salaryMax] = makeSalary(seniority, discipline)
  const atsProvider = rnd() < 0.5 ? 'greenhouse' : 'lever'
  const postedAt = NOW - int(0, 720) * 3600 * 1000
  jobs.push({
    title,
    company,
    discipline,
    seniority,
    workMode,
    location,
    salaryMin,
    salaryMax,
    skills,
    description: makeDescription(title, company, discipline, workMode, skills),
    requirements: makeRequirements(seniority, skills),
    atsProvider,
    postedAt,
  })
}

const outPath = join(dirname(fileURLToPath(import.meta.url)), 'jobs.jsonl')
writeFileSync(outPath, jobs.map((j) => JSON.stringify(j)).join('\n') + '\n')
const counts = jobs.reduce((m, j) => ((m[j.discipline] = (m[j.discipline] || 0) + 1), m), {})
console.log(`Wrote ${jobs.length} jobs to ${outPath}`)
console.log('By discipline:', counts)
console.log('ATS split:', jobs.filter((j) => j.atsProvider === 'greenhouse').length, 'greenhouse /', jobs.filter((j) => j.atsProvider === 'lever').length, 'lever')
