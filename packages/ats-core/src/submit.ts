import type { FormStore } from './store'
import { CANON, type FieldValue } from './types'

const s = (v: FieldValue | undefined): string | undefined => {
  if (typeof v === 'string' && v.trim() !== '') return v.trim()
  return undefined
}

/**
 * Flatten the store's values into the shared submitApplication payload.
 * Uses field.kind (resume / coverLetter / link) and the canonical identity ids;
 * every other answered field falls through into `answers`.
 */
export function toApplication(store: FormStore): Record<string, unknown> {
  const values = store.getValues()
  const links: Record<string, string> = {}
  const answers: Record<string, FieldValue> = {}
  let resumeText: string | undefined
  let resumeFilename: string | undefined
  let coverLetter: string | undefined
  let firstName: string | undefined
  let lastName: string | undefined
  let fullName: string | undefined
  let email: string | undefined
  let phone: string | undefined
  let location: string | undefined

  for (const page of store.config.pages) {
    for (const f of page.fields) {
      const v = values[f.id]
      if (f.kind === 'resume') {
        const t = s(v)
        if (t) {
          resumeText = t
          resumeFilename = store.getFileMeta(f.id)?.filename
        }
        continue
      }
      if (f.kind === 'coverLetter') {
        const t = s(v)
        if (t) coverLetter = t
        continue
      }
      if (f.kind === 'link' || f.type === 'url') {
        const t = s(v)
        if (t) links[f.id] = t
        continue
      }
      switch (f.id) {
        case CANON.firstName:
          firstName = s(v)
          break
        case CANON.lastName:
          lastName = s(v)
          break
        case CANON.fullName:
          fullName = s(v)
          break
        case CANON.email:
          email = s(v)
          break
        case CANON.phone:
          phone = s(v)
          break
        case CANON.location:
          location = s(v)
          break
        default:
          if (typeof v === 'boolean') answers[f.id] = v
          else if (s(v) !== undefined) answers[f.id] = v
      }
    }
  }

  const finalFull = fullName || [firstName, lastName].filter(Boolean).join(' ')

  return {
    fullName: finalFull,
    ...(firstName ? { firstName } : {}),
    ...(lastName ? { lastName } : {}),
    ...(email ? { email } : {}),
    ...(phone ? { phone } : {}),
    ...(location ? { location } : {}),
    ...(Object.keys(links).length ? { links } : {}),
    ...(resumeText ? { resumeText } : {}),
    ...(resumeFilename ? { resumeFilename } : {}),
    ...(coverLetter ? { coverLetter } : {}),
    ...(Object.keys(answers).length ? { answers } : {}),
  }
}

/** Best-effort extraction of document text from one of text / data URL / URL. */
export function resolveDocInput(input: {
  text?: string
  dataUrl?: string
  url?: string
  filename?: string
}): { content: string; filename?: string } | null {
  if (input.text && input.text.trim()) {
    return { content: input.text, filename: input.filename }
  }
  if (input.dataUrl && input.dataUrl.startsWith('data:')) {
    const comma = input.dataUrl.indexOf(',')
    const meta = input.dataUrl.slice(5, comma)
    const payload = input.dataUrl.slice(comma + 1)
    const isBase64 = /;base64/i.test(meta)
    const isText = /^text\//i.test(meta) || /application\/(json|xml)/i.test(meta)
    if (isBase64 && isText) {
      try {
        const decoded = typeof atob === 'function' ? atob(payload) : payload
        return { content: decoded, filename: input.filename }
      } catch {
        /* fall through */
      }
    }
    // Binary (e.g. PDF): keep a readable marker rather than raw bytes.
    return { content: `[attached file${input.filename ? `: ${input.filename}` : ''} (${meta})]`, filename: input.filename }
  }
  if (input.url && input.url.trim()) {
    return { content: `[attached file at ${input.url.trim()}]`, filename: input.filename }
  }
  return null
}
