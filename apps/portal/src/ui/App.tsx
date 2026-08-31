import { useEffect, useMemo, useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@webmcp-jobs/convex/api'
import type { Id } from '@webmcp-jobs/convex/dataModel'
import { registerTools } from '../webmcp/register'
import { buildTools } from '../webmcp/tools'
import { Filters, emptyFilters, filtersToArgs, type FilterState } from './Filters'
import { JobList } from './JobList'
import { JobDetail } from './JobDetail'
import { StatusBadge, type WebmcpStatus } from './StatusBadge'
import { useMinLoading } from './useMinLoading'
import type { Job } from '../model/jobs'

const tools = buildTools()
let toolsRegistered = false
const PAGE = 8

function initialSelected(): Id<'jobs'> | null {
  const p = new URLSearchParams(window.location.search).get('job')
  return p ? (p as Id<'jobs'>) : null
}

export function App() {
  const [status, setStatus] = useState<WebmcpStatus>('checking')
  const [filters, setFilters] = useState<FilterState>(emptyFilters)
  const [selectedId, setSelectedId] = useState<Id<'jobs'> | null>(initialSelected)
  const [visibleCount, setVisibleCount] = useState(PAGE)
  const [loadingMore, setLoadingMore] = useState(false)

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
  const filterKey = JSON.stringify(args)
  const result = useQuery(api.jobs.listJobs, args)
  const facets = useQuery(api.jobs.getFilterOptions, {})
  const selected = useQuery(api.jobs.getJob, selectedId ? { jobId: selectedId } : 'skip')

  // Cosmetic loading delays.
  const filtersLoading = useMinLoading(filterKey, 700)
  const detailLoading = useMinLoading(`sel:${selectedId ?? ''}`, 500)

  // Re-collapse the list to the first page whenever the filters change.
  useEffect(() => {
    setVisibleCount(PAGE)
  }, [filterKey])

  const jobs: Job[] = result?.jobs ?? []
  const showSpinner = filtersLoading || result === undefined
  const displayed = jobs.slice(0, visibleCount)

  const onSelect = (job: Job) => {
    setSelectedId(job._id)
    const url = new URL(window.location.href)
    url.searchParams.set('job', job._id)
    window.history.replaceState({}, '', url)
    document.querySelector('.results')?.scrollTo({ top: 0 })
  }

  const loadMore = () => {
    setLoadingMore(true)
    window.setTimeout(() => {
      setVisibleCount((v) => v + PAGE)
      setLoadingMore(false)
    }, 500)
  }

  const clearSelection = () => {
    setSelectedId(null)
    const url = new URL(window.location.href)
    url.searchParams.delete('job')
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
        <Filters value={filters} onChange={setFilters} facets={facets} onClearAll={clearSelection} />

        <main className="results">
          <div className="results-head">
            <h1>Software engineering jobs</h1>
            <span className="results-count">
              {showSpinner ? 'Loading…' : `${result?.total ?? 0} matching`}
            </span>
          </div>

          {showSpinner ? (
            <div className="results-spinner">
              <span className="spinner" />
              <span>Finding the best jobs for you…</span>
            </div>
          ) : (
            <>
              <JobList jobs={displayed} selectedId={selectedId} onSelect={onSelect} />
              {visibleCount < jobs.length ? (
                <button className="load-more" disabled={loadingMore} onClick={loadMore}>
                  {loadingMore ? 'Loading…' : `Load more (${jobs.length - visibleCount} left)`}
                </button>
              ) : null}
            </>
          )}
        </main>

        <section className="detail-pane">
          {selectedId && detailLoading ? (
            <div className="detail detail-skeleton">
              <div className="sk sk-title" />
              <div className="sk sk-line" />
              <div className="sk sk-line" />
              <div className="sk sk-block" />
            </div>
          ) : (
            <JobDetail job={selected} />
          )}
        </section>
      </div>
    </div>
  )
}
