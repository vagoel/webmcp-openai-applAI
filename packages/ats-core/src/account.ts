// Lightweight "login": just an email id kept in localStorage (per app/origin).
// No password — it identifies which applications to show, and gates submission.
// Observable so an agent's sign_in tool call updates the human view live.

const KEY = 'wmj_user_email'

function load(): string {
  try {
    return localStorage.getItem(KEY) || ''
  } catch {
    return ''
  }
}

let current = load()
const listeners = new Set<() => void>()
function emit() {
  for (const fn of listeners) fn()
}

export function getUserEmail(): string {
  return current
}

export function setUserEmail(email: string): void {
  current = email.trim()
  try {
    localStorage.setItem(KEY, current)
  } catch {
    /* ignore */
  }
  emit()
}

export function clearUserEmail(): void {
  current = ''
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
  emit()
}

export function subscribeAuth(fn: () => void): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}
