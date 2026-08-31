// Lightweight "login": just an email id kept in localStorage (per app/origin).
// No password — this only identifies which applications to show the user.

const KEY = 'wmj_user_email'

export function getUserEmail(): string {
  try {
    return localStorage.getItem(KEY) || ''
  } catch {
    return ''
  }
}

export function setUserEmail(email: string): void {
  try {
    localStorage.setItem(KEY, email.trim())
  } catch {
    /* ignore */
  }
}

export function clearUserEmail(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}
