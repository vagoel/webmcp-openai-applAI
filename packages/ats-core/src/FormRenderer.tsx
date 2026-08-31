import { useMemo, useState } from 'react'
import type { FormStore } from './store'
import type { AtsDeps, Field, ValidationIssue } from './types'
import { useFormStore } from './useFormStore'
import { runSubmit } from './actions'

export function FormRenderer({ store, deps }: { store: FormStore; deps: AtsDeps }) {
  const snap = useFormStore(store)
  const [issues, setIssues] = useState<ValidationIssue[]>([])
  const [topError, setTopError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

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

  const doSubmit = async () => {
    setSubmitting(true)
    setTopError(null)
    try {
      const outcome = await runSubmit(store, deps)
      if (outcome.ok) return
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

  return (
    <div className="form">
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
        <PageBlock key={p.id} store={store} page={p} issueByField={issueByField} single={!isWizard} />
      ))}

      <div className="form-actions">
        {isWizard ? (
          <>
            <button className="btn-ghost" disabled={snap.currentPage === 0} onClick={() => store.prev()}>
              Back
            </button>
            {snap.currentPage < lastPage ? (
              <button className="btn-primary" onClick={() => store.next()}>
                Next
              </button>
            ) : (
              <button className="btn-primary" disabled={submitting} onClick={doSubmit}>
                {submitting ? 'Submitting…' : 'Submit application'}
              </button>
            )}
          </>
        ) : (
          <button className="btn-primary" disabled={submitting} onClick={doSubmit}>
            {submitting ? 'Submitting…' : 'Submit application'}
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
}: {
  store: FormStore
  page: { id: string; title: string; description?: string; fields: Field[] }
  issueByField: Record<string, ValidationIssue>
  single: boolean
}) {
  // Group fields by `group` for the single-page (Lever) layout; otherwise flat.
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
            <FieldInput key={f.id} store={store} field={f} issue={issueByField[f.id]} />
          ))}
        </div>
      ))}
    </section>
  )
}

function FieldInput({ store, field, issue }: { store: FormStore; field: Field; issue?: ValidationIssue }) {
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

  const onText = (v: string) => store.setField(field.id, v)

  let control: React.ReactNode
  if (field.type === 'textarea' || field.kind === 'coverLetter') {
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
        <input
          type="checkbox"
          checked={value === true}
          onChange={(e) => store.setField(field.id, e.target.checked)}
        />
        {field.placeholder ?? 'Yes'}
      </label>
    )
  } else {
    const inputType = field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : field.type === 'url' ? 'url' : field.type === 'date' ? 'date' : 'text'
    control = (
      <input
        className={`input${invalid ? ' input-invalid' : ''}`}
        type={inputType}
        placeholder={field.placeholder}
        value={String(value ?? '')}
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
        <span className="field-error">{issue.issue === 'required' ? 'This field is required.' : issue.detail}</span>
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
