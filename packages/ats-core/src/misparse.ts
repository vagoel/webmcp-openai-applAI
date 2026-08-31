import type { FormStore } from './store'

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s)

function trySet(store: FormStore, id: string, value: string) {
  if (store.fieldById(id)) store.setField(id, value)
}

/**
 * UI-only "resume parser" that fills identity fields from the filename — the way a
 * mediocre real ATS mangles your details so you have to fix them by hand. Only ever
 * invoked from the human file-input onChange, never from the WebMCP attach_resume tool.
 */
export function misparseResume(store: FormStore, filename: string) {
  const base = filename.replace(/\.[^.]+$/, '').replace(/[_\-.]+/g, ' ').trim()
  const parts = base.split(/\s+/).filter(Boolean)
  const first = cap(parts[0] || 'Applicant')
  const last = cap(parts[1] || 'Candidate')
  trySet(store, 'firstName', first)
  trySet(store, 'lastName', last)
  trySet(store, 'fullName', `${first} ${last}`)
  trySet(store, 'recentTitle', 'Software Engineer')
  trySet(store, 'recentCompany', 'Previous Employer')
  trySet(store, 'currentCompany', 'Previous Employer')
}
