import type { FormStore } from './store'
import type { AtsDeps, ValidationIssue } from './types'
import { validateForm } from './validation'
import { toApplication } from './submit'

export type SubmitOutcome =
  | { ok: true; applicationId: string }
  | { ok: false; reason: 'no_job' | 'validation_failed'; issues: ValidationIssue[] }

/** Single submit path shared by the WebMCP tool and the human Submit button. */
export async function runSubmit(store: FormStore, deps: AtsDeps): Promise<SubmitOutcome> {
  const already = store.isSubmitted()
  if (already) return { ok: true, applicationId: already.applicationId }

  const jobId = store.getJobId()
  if (!jobId) return { ok: false, reason: 'no_job', issues: [] }

  const issues = validateForm(store.config, store.getValues())
  if (issues.length) return { ok: false, reason: 'validation_failed', issues }

  const res = await deps.submit({ jobId, ...toApplication(store) })
  store.markSubmitted(res.applicationId)
  return { ok: true, applicationId: res.applicationId }
}
