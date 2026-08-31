import { useState } from 'react'
import {
  DISCIPLINE_LABELS,
  DISCIPLINE_ORDER,
  SENIORITY_LABELS,
  SENIORITY_ORDER,
  WORK_MODE_LABELS,
  WORK_MODE_ORDER,
} from '../model/jobs'

export interface FilterState {
  query: string
  discipline: string
  seniority: string
  workMode: string
  remoteOnly: boolean
  salaryMin: number
  skills: string[]
}

export const emptyFilters: FilterState = {
  query: '',
  discipline: '',
  seniority: '',
  workMode: '',
  remoteOnly: false,
  salaryMin: 0,
  skills: [],
}

export function filtersToArgs(f: FilterState): Record<string, unknown> {
  const args: Record<string, unknown> = {}
  if (f.query.trim()) args.query = f.query.trim()
  if (f.discipline) args.discipline = f.discipline
  if (f.seniority) args.seniority = f.seniority
  if (f.workMode) args.workMode = f.workMode
  if (f.remoteOnly) args.remoteOnly = true
  if (f.salaryMin > 0) args.salaryMin = f.salaryMin
  if (f.skills.length) args.skills = f.skills
  args.limit = 100
  return args
}

interface Facets {
  discipline: Record<string, number>
  seniority: Record<string, number>
  workMode: Record<string, number>
  topSkills: Array<{ name: string; count: number }>
}

const SALARY_STEPS = [0, 100000, 150000, 200000, 250000, 300000]

export function Filters({
  value,
  onChange,
  facets,
  onClearAll,
}: {
  value: FilterState
  onChange: (next: FilterState) => void
  facets: Facets | undefined
  onClearAll?: () => void
}) {
  // Accordion: only one filter group open at a time.
  const [open, setOpen] = useState<string>('Discipline')
  const set = (patch: Partial<FilterState>) => onChange({ ...value, ...patch })
  const pickOne = (key: 'discipline' | 'seniority' | 'workMode', v: string) =>
    set({ [key]: value[key] === v ? '' : v } as Partial<FilterState>)
  const toggleSkill = (name: string) =>
    set({
      skills: value.skills.includes(name)
        ? value.skills.filter((s) => s !== name)
        : [...value.skills, name],
    })

  const active =
    value.discipline ||
    value.seniority ||
    value.workMode ||
    value.remoteOnly ||
    value.salaryMin > 0 ||
    value.skills.length > 0 ||
    value.query

  return (
    <aside className="filters">
      <div className="filters-head">
        <h2>Filters</h2>
        {active ? (
          <button
            className="link"
            onClick={() => {
              onChange(emptyFilters)
              onClearAll?.()
            }}
          >
            Clear all
          </button>
        ) : null}
      </div>

      <FacetGroup title="Discipline" open={open} onToggle={setOpen}>
        {DISCIPLINE_ORDER.map((d) => (
          <FacetRow
            key={d}
            label={DISCIPLINE_LABELS[d]}
            count={facets?.discipline[d]}
            checked={value.discipline === d}
            onClick={() => pickOne('discipline', d)}
          />
        ))}
      </FacetGroup>

      <FacetGroup title="Seniority" open={open} onToggle={setOpen}>
        {SENIORITY_ORDER.map((s) => (
          <FacetRow
            key={s}
            label={SENIORITY_LABELS[s]}
            count={facets?.seniority[s]}
            checked={value.seniority === s}
            onClick={() => pickOne('seniority', s)}
          />
        ))}
      </FacetGroup>

      <FacetGroup title="Work mode" open={open} onToggle={setOpen}>
        {WORK_MODE_ORDER.map((w) => (
          <FacetRow
            key={w}
            label={WORK_MODE_LABELS[w]}
            count={facets?.workMode[w]}
            checked={value.workMode === w}
            onClick={() => pickOne('workMode', w)}
          />
        ))}
        <label className="toggle">
          <input
            type="checkbox"
            checked={value.remoteOnly}
            onChange={(e) => set({ remoteOnly: e.target.checked })}
          />
          Remote only
        </label>
      </FacetGroup>

      <FacetGroup title="Minimum salary" open={open} onToggle={setOpen}>
        <select
          className="select"
          value={value.salaryMin}
          onChange={(e) => set({ salaryMin: Number(e.target.value) })}
        >
          {SALARY_STEPS.map((s) => (
            <option key={s} value={s}>
              {s === 0 ? 'Any' : `$${s / 1000}k+`}
            </option>
          ))}
        </select>
      </FacetGroup>

      {facets?.topSkills?.length ? (
        <FacetGroup title="Skills" open={open} onToggle={setOpen}>
          <div className="chips">
            {facets.topSkills.slice(0, 18).map((s) => (
              <button
                key={s.name}
                className={`chip${value.skills.includes(s.name) ? ' chip-on' : ''}`}
                onClick={() => toggleSkill(s.name)}
              >
                {s.name}
              </button>
            ))}
          </div>
        </FacetGroup>
      ) : null}
    </aside>
  )
}

function FacetGroup({
  title,
  open,
  onToggle,
  children,
}: {
  title: string
  open: string
  onToggle: (t: string) => void
  children: React.ReactNode
}) {
  const isOpen = open === title
  return (
    <div className={`facet-group${isOpen ? ' facet-group-open' : ''}`}>
      <button className="facet-group-head" onClick={() => onToggle(isOpen ? '' : title)}>
        <h3>{title}</h3>
        <span className="facet-caret" aria-hidden>
          {isOpen ? '▾' : '▸'}
        </span>
      </button>
      {isOpen ? <div className="facet-group-body">{children}</div> : null}
    </div>
  )
}

function FacetRow({
  label,
  count,
  checked,
  onClick,
}: {
  label: string
  count: number | undefined
  checked: boolean
  onClick: () => void
}) {
  return (
    <button className={`facet-row${checked ? ' facet-on' : ''}`} onClick={onClick}>
      <span className="facet-check" aria-hidden>
        {checked ? '●' : '○'}
      </span>
      <span className="facet-label">{label}</span>
      {count != null ? <span className="facet-count">{count}</span> : null}
    </button>
  )
}
