// A form is defined once as data. Both the React renderer and the WebMCP tools
// derive everything (schema, validation, submit payload) from this config, so an
// agent can introspect and complete any form it has never seen before.

export type FieldType =
  | 'text'
  | 'email'
  | 'tel'
  | 'url'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'boolean'
  | 'date'
  | 'file'

export interface FieldOption {
  value: string
  label: string
}

/** Marks fields with special submit/attachment handling. */
export type FieldKind = 'resume' | 'coverLetter' | 'link'

export interface Field {
  id: string
  label: string
  type: FieldType
  required?: boolean
  options?: FieldOption[]
  placeholder?: string
  help?: string
  kind?: FieldKind
  /** Visual sub-grouping within a page (used by the single-page Lever layout). */
  group?: string
  // --- UI-only friction hints (ignored by the WebMCP tools / shared validation) ---
  /** Must equal the value of this other field id (human-only submit check). */
  matchField?: string
  /** Boolean field whose checkbox stays disabled until a terms box is scrolled. */
  scrollGate?: boolean
  /** Long text shown in the scroll gate. */
  gateText?: string
  /** Strip everything but digits as the human types (UI-only). */
  digitsOnly?: boolean
}

export interface Page {
  id: string
  title: string
  description?: string
  fields: Field[]
}

export interface FormConfig {
  provider: 'greenhouse' | 'lever'
  brand: string
  tagline?: string
  layout: 'wizard' | 'single'
  pages: Page[]
}

export type FieldValue = string | boolean
export type FormValues = Record<string, FieldValue>

export interface FormSnapshot {
  config: FormConfig
  jobId: string | null
  job: JobInfo | null
  phase: ApplicationPhase
  values: FormValues
  fileMeta: Record<string, { filename?: string }>
  currentPage: number
  submitted: { applicationId: string } | null
}

export interface JobInfo {
  _id: string
  title: string
  company: string
  atsProvider: string
  location?: string
  workMode?: string
  salaryMin?: number
  salaryMax?: number
  skills?: string[]
  description?: string
  requirements?: string[]
}

/** The human view: read the posting first, then open the form. */
export type ApplicationPhase = 'posting' | 'form'

/** Backend calls the ATS tools + UI need, injected by each app (keeps ats-core backend-agnostic). */
export interface AtsDeps {
  fetchJob: (jobId: string) => Promise<JobInfo | null>
  submit: (args: Record<string, unknown>) => Promise<{ applicationId: string }>
}

export interface ValidationIssue {
  page: number
  fieldId: string
  label: string
  issue: 'required' | 'invalid'
  detail?: string
}

/** Canonical field ids the submit mapper understands across both providers. */
export const CANON = {
  fullName: 'fullName',
  firstName: 'firstName',
  lastName: 'lastName',
  email: 'email',
  phone: 'phone',
  location: 'location',
} as const
