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
}

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
