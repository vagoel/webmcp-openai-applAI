import type { Field, FieldValue, FormConfig, FormValues, ValidationIssue } from './types'

export function isFilled(field: Field, value: FieldValue | undefined): boolean {
  if (field.type === 'boolean') return value === true || value === false
  return typeof value === 'string' && value.trim() !== ''
}

function typeIssue(field: Field, value: FieldValue | undefined): string | null {
  if (value == null || value === '') return null
  const s = String(value)
  if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) {
    return 'Not a valid email address'
  }
  if (field.type === 'url' && !/^https?:\/\/.+/i.test(s)) {
    return 'Links must start with http:// or https://'
  }
  if ((field.type === 'select' || field.type === 'radio') && field.options) {
    if (!field.options.some((o) => o.value === s)) {
      return `Must be one of: ${field.options.map((o) => o.value).join(', ')}`
    }
  }
  return null
}

export function validateForm(config: FormConfig, values: FormValues): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  config.pages.forEach((page, pageIndex) => {
    for (const field of page.fields) {
      const value = values[field.id]
      if (field.required && !isFilled(field, value)) {
        issues.push({ page: pageIndex, fieldId: field.id, label: field.label, issue: 'required' })
        continue
      }
      const t = typeIssue(field, value)
      if (t) {
        issues.push({ page: pageIndex, fieldId: field.id, label: field.label, issue: 'invalid', detail: t })
      }
    }
  })
  return issues
}

export function pageIssues(
  config: FormConfig,
  values: FormValues,
  pageIndex: number,
): ValidationIssue[] {
  return validateForm(config, values).filter((i) => i.page === pageIndex)
}
