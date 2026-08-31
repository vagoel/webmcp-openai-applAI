import { useState } from 'react'

const KEY = 'wmj_cookie_ack'

function acknowledged(): boolean {
  try {
    return sessionStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

/** A consent bar where "Accept all" is one click and rejecting takes two. UI-only. */
export function CookieBanner() {
  const [hidden, setHidden] = useState(acknowledged)
  const [prefs, setPrefs] = useState(false)
  if (hidden) return null
  const dismiss = () => {
    try {
      sessionStorage.setItem(KEY, '1')
    } catch {
      /* ignore */
    }
    setHidden(true)
  }
  return (
    <div className="cookie-bar" role="dialog" aria-label="Cookie consent">
      <span className="cookie-text">
        We and our 47 carefully selected partners use cookies to enhance your experience,
        personalize content, and measure performance.
      </span>
      {!prefs ? (
        <div className="cookie-actions">
          <button className="cookie-link" onClick={() => setPrefs(true)}>
            Manage preferences
          </button>
          <button className="cookie-accept" onClick={dismiss}>
            Accept all
          </button>
        </div>
      ) : (
        <div className="cookie-actions">
          <button className="cookie-link" onClick={dismiss}>
            Reject non-essential
          </button>
          <button className="cookie-accept" onClick={dismiss}>
            Save &amp; accept all
          </button>
        </div>
      )}
    </div>
  )
}
