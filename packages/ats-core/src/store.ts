import type {
  ApplicationPhase,
  Field,
  FieldValue,
  FormConfig,
  FormSnapshot,
  FormValues,
  JobInfo,
} from './types'

function findField(config: FormConfig, id: string): { field: Field; page: number } | null {
  for (let p = 0; p < config.pages.length; p++) {
    const field = config.pages[p].fields.find((f) => f.id === id)
    if (field) return { field, page: p }
  }
  return null
}

/** Coerce an incoming (possibly agent-supplied) value to the field's shape. */
function coerce(field: Field, raw: unknown): FieldValue {
  if (field.type === 'boolean') {
    if (typeof raw === 'boolean') return raw
    if (raw === 'true') return true
    if (raw === 'false') return false
    return Boolean(raw)
  }
  if (typeof raw === 'string') return raw
  if (raw == null) return ''
  return String(raw)
}

export class FormStore {
  readonly config: FormConfig
  private values: FormValues = {}
  private fileMeta: Record<string, { filename?: string }> = {}
  private currentPage = 0
  private jobId: string | null = null
  private job: JobInfo | null = null
  private phase: ApplicationPhase = 'posting'
  private submitted: { applicationId: string } | null = null

  private listeners = new Set<() => void>()
  private snap: FormSnapshot

  constructor(config: FormConfig) {
    this.config = config
    for (const page of config.pages) {
      for (const f of page.fields) {
        this.values[f.id] = f.type === 'boolean' ? false : ''
      }
    }
    this.snap = this.build()
  }

  private build(): FormSnapshot {
    return {
      config: this.config,
      jobId: this.jobId,
      job: this.job,
      phase: this.phase,
      values: { ...this.values },
      fileMeta: { ...this.fileMeta },
      currentPage: this.currentPage,
      submitted: this.submitted,
    }
  }

  private emit() {
    this.snap = this.build()
    for (const fn of this.listeners) fn()
  }

  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  getSnapshot = (): FormSnapshot => this.snap

  // --- reads used by tools ---
  get pageCount(): number {
    return this.config.pages.length
  }
  get current(): number {
    return this.currentPage
  }
  getValues(): FormValues {
    return this.values
  }
  fieldById(id: string) {
    return findField(this.config, id)
  }
  getJob(): JobInfo | null {
    return this.job
  }
  getJobId(): string | null {
    return this.jobId
  }
  getFileMeta(id: string) {
    return this.fileMeta[id]
  }
  isSubmitted() {
    return this.submitted
  }
  getPhase(): ApplicationPhase {
    return this.phase
  }

  // --- mutations ---
  setJob(jobId: string | null, job: JobInfo | null) {
    this.jobId = jobId
    this.job = job
    this.emit()
  }

  /** Move from the job posting to the application form (idempotent). */
  startApplication() {
    if (this.phase !== 'form') {
      this.phase = 'form'
      this.emit()
    }
  }

  /** Returns { applied, rejected } so tools can report what stuck. */
  setFields(patch: Record<string, unknown>): {
    applied: Array<{ id: string; value: FieldValue }>
    rejected: Array<{ id: string; reason: string }>
  } {
    const applied: Array<{ id: string; value: FieldValue }> = []
    const rejected: Array<{ id: string; reason: string }> = []
    for (const [id, raw] of Object.entries(patch)) {
      const found = findField(this.config, id)
      if (!found) {
        rejected.push({ id, reason: 'no such field' })
        continue
      }
      const value = coerce(found.field, raw)
      this.values[id] = value
      applied.push({ id, value })
    }
    if (applied.length) this.emit()
    return { applied, rejected }
  }

  setField(id: string, value: FieldValue) {
    const found = findField(this.config, id)
    if (!found) return false
    this.values[id] = coerce(found.field, value)
    this.emit()
    return true
  }

  attachFile(id: string, content: string, filename?: string): boolean {
    const found = findField(this.config, id)
    if (!found) return false
    this.values[id] = content
    this.fileMeta[id] = { filename }
    this.emit()
    return true
  }

  goto(page: number): number {
    this.currentPage = Math.max(0, Math.min(this.config.pages.length - 1, page))
    this.emit()
    return this.currentPage
  }
  next(): number {
    return this.goto(this.currentPage + 1)
  }
  prev(): number {
    return this.goto(this.currentPage - 1)
  }

  markSubmitted(applicationId: string) {
    this.submitted = { applicationId }
    this.emit()
  }

  reset() {
    for (const page of this.config.pages) {
      for (const f of page.fields) this.values[f.id] = f.type === 'boolean' ? false : ''
    }
    this.fileMeta = {}
    this.currentPage = 0
    this.phase = 'posting'
    this.submitted = null
    this.emit()
  }
}
