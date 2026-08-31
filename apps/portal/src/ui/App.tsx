import { useEffect, useMemo, useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@webmcp-jobs/convex/api'
import type { Id } from '@webmcp-jobs/convex/dataModel'
import { registerTools } from '@webmcp-jobs/webmcp/register'
import { buildTools } from '../webmcp/tools'
import { Filters, emptyFilters, filtersToArgs, type FilterState } from './Filters'
import { JobList } from './JobList'
import { JobDetail } from './JobDetail'
import { StatusBadge, type WebmcpStatus } from './StatusBadge'
import type { Job } from '../model/jobs'

const tools = buildTools()
let toolsRegistered = false

function initialSelected(): Id<'jobs'> | null {
  const p = new URLSearchParams(window.location.search).get('job')
  return p ? (p as Id<'jobs'>) : null
}

export function App() {
  const [status, setStatus] = useState<WebmcpStatus>('checking')
  const [filters, setFilters] = useState<FilterState>(emptyFilters)
  const [selectedId, setSelectedId] = useState<Id<'jobs'> | null>(initialSelected)

  useEffect(() => {
    if (toolsRegistered) return
    toolsRegistered = true
    registerTools(tools).then((r) => {
      setStatus(r.available ? 'available' : 'unavailable')
      if (r.error) console.warn('WebMCP registration issue:', r.error)
      else console.info('WebMCP tools registered:', r.registered.join(', ') || '(none)')
    })
  }, [])

  const args = useMemo(() => filtersToArgs(filters), [filters])
  const result = useQuery(api.jobs.listJobs, args)
  const facets = useQuery(api.jobs.getFilterOptions, {})
  const selected = useQuery(api.jobs.getJob, selectedId ? { jobId: selectedId } : 'skip')

  const jobs: Job[] = result?.jobs ?? []
  const loading = result === undefined

  const onSelect = (job: Job) => {
    setSelectedId(job._id)
    const url = new URL(window.location.href)
    url.searchParams.set('job', job._id)
    window.history.replaceState({}, '', url)
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">◆</span> Jobly
        </div>
        <input
          className="search"
          type="search"
          placeholder="Search title, company, skill…"
          value={filters.query}
          onChange={(e) => setFilters({ ...filters, query: e.target.value })}
        />
        <StatusBadge status={status} />
      </header>

      <div className="layout">
        <Filters value={filters} onChange={setFilters} facets={facets} />

        <main className="results">
          <div className="results-head">
            <h1>Software engineering jobs</h1>
            <span className="results-count">
              {loading ? 'Loading…' : `${result?.total ?? 0} matching`}
            </span>
          </div>
          <JobList jobs={jobs} selectedId={selectedId} onSelect={onSelect} />
        </main>

        <section className="detail-pane">
          <JobDetail job={selected} />
        </section>
      </div>
    </div>
  )
}
