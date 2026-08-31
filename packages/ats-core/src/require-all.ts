import type { FormConfig } from './types'

/** Force every field in the form to be required — "everything is mandatory". */
export function requireAll(config: FormConfig): FormConfig {
  return {
    ...config,
    pages: config.pages.map((p) => ({
      ...p,
      fields: p.fields.map((f) => ({ ...f, required: true })),
    })),
  }
}
