import { useMemo, useState, useSyncExternalStore } from 'react'
import type { FormStore } from './store'
import type { AtsDeps, Field, ValidationIssue } from './types'
import { useFormStore } from './useFormStore'
import { runSubmit } from './actions'
import { misparseResume } from './misparse'
import { ScrollAgree } from './ScrollAgree'
import { getUserEmail, subscribeAuth } from './account'

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

export function FormRenderer({ store, deps }: { store: FormStore; deps: AtsDeps }) {
  const snap = useFormStore(store)
  const signedIn = useSyncExternalStore(subscribeAuth, getUserEmail, getUserEmail)
  const [issues, setIssues] = useState<ValidationIssue[]>([])
  const [topError, setTopError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [stepping, setStepping] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const notify = (m: string) => {
    setToast(m)
    window.setTimeout(() => setToast((t) => (t === m ? null : t)), 3500)
  }

  const issueByField = useMemo(() => {
    const m: Record<string, ValidationIssue> = {}
    for (const i of issues) m[i.fieldId] = i
    return m
  }, [issues])

  if (snap.submitted) {
    return <SubmitSuccess store={store} />
  }

  const { config } = snap
  const isWizard = config.layout === 'wizard'
  const lastPage = config.pages.length - 1
  const page = config.pages[snap.currentPage]

  // UI-only checks the shared validation (used by the WebMCP tools) does NOT enforce.
  const computeUiIssues = (): ValidationIssue[] => {
    const values = store.getValues()
    const out: ValidationIssue[] = []
    config.pages.forEach((p, pageIndex) => {
      for (const f of p.fields) {
        if (f.matchField) {
          const other = p.fields.find((x) => x.id === f.matchField) || config.pages.flatMap((z) => z.fields).find((x) => x.id === f.matchField)
          if (String(values[f.id] ?? '') !== String(values[f.matchField] ?? '')) {
            out.push({ page: pageIndex, fieldId: f.id, label: f.label, issue: 'invalid', detail: `Must match ${other?.label ?? 'the field above'}.` })
          }
        }
        if (f.scrollGate && values[f.id] !== true) {
          out.push({ page: pageIndex, fieldId: f.id, label: f.label, issue: 'required', detail: 'You must agree to continue.' })
        }
      }
    })
    return out
  }

  const step = async (fn: () => void) => {
    setStepping(true)
    await sleep(600)
    fn()
    setStepping(false)
  }

  const doSubmit = async () => {
    if (!signedIn) {
      setTopError('Please sign in (top-right) to submit your application.')
      return
    }
    setSubmitting(true)
    setTopError(null)
    await sleep(700)
    const ui = computeUiIssues()
    if (ui.length) {
      setIssues(ui)
      if (isWizard) store.goto(ui[0].page)
      setTopError(`${ui.length} field${ui.length === 1 ? '' : 's'} need attention before submitting.`)
      setSubmitting(false)
      return
    }
    try {
      const outcome = await runSubmit(store, deps)
      if (outcome.ok) return
      if (outcome.reason === 'not_signed_in') {
        setTopError('Please sign in (top-right) to submit your application.')
        return
      }
      if (outcome.reason === 'no_job') {
        setTopError('No job is attached. Open this form from the portal (the URL needs ?job=<id>).')
        return
      }
      setIssues(outcome.issues)
      if (isWizard && outcome.issues.length) store.goto(outcome.issues[0].page)
      setTopError(`${outcome.issues.length} field${outcome.issues.length === 1 ? '' : 's'} need attention before submitting.`)
    } catch (e) {
      setTopError(e instanceof Error ? e.message : String(e))
    } finally {
      setSubmitting(false)
    }
  }

  const pagesToRender = isWizard ? [page] : config.pages
  const busy = stepping || submitting

  return (
    <div className="form">
      {toast ? <div className="toast">{toast}</div> : null}

      {isWizard ? (
        <ol className="stepper">
          {config.pages.map((p, i) => (
            <li
              key={p.id}
              className={`step${i === snap.currentPage ? ' step-on' : ''}${i < snap.currentPage ? ' step-done' : ''}`}
            >
              <button className="step-btn" onClick={() => store.goto(i)}>
                <span className="step-num">{i + 1}</span>
                <span className="step-title">{p.title}</span>
              </button>
            </li>
          ))}
        </ol>
      ) : null}

      {topError ? <div className="form-error">{topError}</div> : null}

      {pagesToRender.map((p) => (
        <PageBlock key={p.id} store={store} page={p} issueByField={issueByField} single={!isWizard} notify={notify} />
      ))}

      {busy ? <div className="step-busy">Saving this step…</div> : null}
      {!signedIn ? (
        <div className="form-error">You must sign in (top-right) before you can submit this application.</div>
      ) : null}

      <div className="form-actions">
        {isWizard ? (
          <>
            <button className="btn-ghost" disabled={snap.currentPage === 0 || busy} onClick={() => step(() => store.prev())}>
              Back
            </button>
            {snap.currentPage < lastPage ? (
              <button className="btn-primary" disabled={busy} onClick={() => step(() => store.next())}>
                {stepping ? 'Saving…' : 'Next'}
              </button>
            ) : (
              <button className="btn-primary" disabled={busy || !signedIn} onClick={doSubmit}>
                {!signedIn ? 'Sign in to submit' : submitting ? 'Submitting…' : 'Submit application'}
              </button>
            )}
          </>
        ) : (
          <button className="btn-primary" disabled={busy || !signedIn} onClick={doSubmit}>
            {!signedIn ? 'Sign in to submit' : submitting ? 'Submitting…' : 'Submit application'}
          </button>
        )}
      </div>
    </div>
  )
}

function PageBlock({
  store,
  page,
  issueByField,
  single,
  notify,
}: {
  store: FormStore
  page: { id: string; title: string; description?: string; fields: Field[] }
  issueByField: Record<string, ValidationIssue>
  single: boolean
  notify: (m: string) => void
}) {
  const groups: Array<{ name: string | null; fields: Field[] }> = []
  for (const f of page.fields) {
    const name = single ? f.group ?? null : null
    const last = groups[groups.length - 1]
    if (last && last.name === name) last.fields.push(f)
    else groups.push({ name, fields: [f] })
  }

  return (
    <section className="page-block">
      <div className="page-block-head">
        <h2>{page.title}</h2>
        {page.description ? <p className="page-desc">{page.description}</p> : null}
      </div>
      {groups.map((g, gi) => (
        <div key={gi} className="field-group">
          {g.name ? <h3 className="group-title">{g.name}</h3> : null}
          {g.fields.map((f) => (
            <FieldInput key={f.id} store={store} field={f} issue={issueByField[f.id]} notify={notify} />
          ))}
        </div>
      ))}
    </section>
  )
}

function FieldInput({
  store,
  field,
  issue,
  notify,
}: {
  store: FormStore
  field: Field
  issue?: ValidationIssue
  notify: (m: string) => void
}) {
  const snap = useFormStore(store)
  const value = snap.values[field.id]
  const fileMeta = snap.fileMeta[field.id]
  const invalid = Boolean(issue)

  const label = (
    <span className="field-label">
      {field.label}
      {field.required ? <span className="req">*</span> : null}
    </span>
  )

  const onText = (v: string) => store.setField(field.id, field.digitsOnly ? v.replace(/\D/g, '') : v)

  let control: React.ReactNode
  if (field.type === 'boolean' && field.scrollGate) {
    control = (
      <ScrollAgree store={store} fieldId={field.id} label={field.placeholder ?? field.label} text={field.gateText} checked={value === true} />
    )
  } else if (field.type === 'textarea' || field.kind === 'coverLetter') {
    control = (
      <textarea
        className={`input textarea${invalid ? ' input-invalid' : ''}`}
        rows={5}
        placeholder={field.placeholder}
        value={String(value ?? '')}
        onChange={(e) => onText(e.target.value)}
      />
    )
  } else if (field.type === 'file' || field.kind === 'resume') {
    control = (
      <div className="file-field">
        <label className="file-pick">
          <input
            type="file"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              let content = `[attached: ${file.name}]`
              if (/^text\//.test(file.type) || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
                content = await file.text()
              }
              store.attachFile(field.id, content, file.name)
              if (field.kind === 'resume') {
                misparseResume(store, file.name)
                notify('Resume parsed — please review your details below.')
              }
            }}
          />
          Choose file
        </label>
        {fileMeta?.filename ? <span className="file-name">{fileMeta.filename}</span> : null}
        <textarea
          className={`input textarea${invalid ? ' input-invalid' : ''}`}
          rows={4}
          placeholder="…or paste the text here"
          value={String(value ?? '')}
          onChange={(e) => onText(e.target.value)}
        />
      </div>
    )
  } else if (field.type === 'select' || field.type === 'radio') {
    control = (
      <select
        className={`input${invalid ? ' input-invalid' : ''}`}
        value={String(value ?? '')}
        onChange={(e) => onText(e.target.value)}
      >
        <option value="">Select…</option>
        {field.options?.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    )
  } else if (field.type === 'boolean') {
    control = (
      <label className="check">
        <input type="checkbox" checked={value === true} onChange={(e) => store.setField(field.id, e.target.checked)} />
        {field.placeholder ?? 'Yes'}
      </label>
    )
  } else {
    const noFill = Boolean(field.noPaste || field.noAutofill)
    const baseType =
      field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : field.type === 'url' ? 'url' : field.type === 'date' ? 'date' : 'text'
    // When suppressing autofill, render as plain text so the browser doesn't
    // recognize it as an email/tel field (and offer to fill it).
    const inputType = noFill ? 'text' : baseType
    control = (
      <input
        className={`input${invalid ? ' input-invalid' : ''}`}
        type={inputType}
        inputMode={field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : undefined}
        placeholder={field.placeholder}
        value={String(value ?? '')}
        autoComplete={noFill ? 'off' : undefined}
        name={noFill ? `nf_${field.id}` : undefined}
        data-lpignore={noFill ? 'true' : undefined}
        data-1p-ignore={noFill ? 'true' : undefined}
        onPaste={field.noPaste ? (e) => e.preventDefault() : undefined}
        onDrop={field.noPaste ? (e) => e.preventDefault() : undefined}
        onChange={(e) => onText(e.target.value)}
      />
    )
  }

  return (
    <label className="field">
      {label}
      {field.help ? <span className="field-help">{field.help}</span> : null}
      {control}
      {issue ? (
        <span className="field-error">{issue.issue === 'required' ? issue.detail ?? 'This field is required.' : issue.detail}</span>
      ) : null}
    </label>
  )
}

function SubmitSuccess({ store }: { store: FormStore }) {
  const snap = useFormStore(store)
  const job = snap.job
  return (
    <div className="success">
      <div className="success-check">✓</div>
      <h2>Application submitted</h2>
      {job ? (
        <p>
          Thanks for applying to <strong>{job.title}</strong> at <strong>{job.company}</strong>.
        </p>
      ) : (
        <p>Thanks for applying.</p>
      )}
      <p className="success-id">Confirmation id: {snap.submitted?.applicationId}</p>
    </div>
  )
}
