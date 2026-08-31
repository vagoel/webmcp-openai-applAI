import { useEffect, useState } from 'react'
import { registerPopup, isPopupsSuppressed } from './popups'

const KEY = 'wmj_cookie_ack'

function acknowledged(): boolean {
  try {
    return sessionStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

const CATEGORIES = ['Functional', 'Performance & analytics', 'Targeting & advertising', 'Social media']

/** A big, blocking consent modal on load. "Accept all" is prominent; UI-only. */
export function CookieBanner() {
  const [hidden, setHidden] = useState(() => acknowledged() || isPopupsSuppressed())

  const dismiss = () => {
    try {
      sessionStorage.setItem(KEY, '1')
    } catch {
      /* ignore */
    }
    setHidden(true)
  }

  // Register with the popup controller while shown, so the dismiss_popups tool
  // can close it on the human's behalf.
  useEffect(() => {
    if (hidden) return
    return registerPopup('cookies', dismiss)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hidden])

  if (hidden) return null
  return (
    <div className="cookie-overlay" role="dialog" aria-modal="true" aria-label="Cookie consent">
      <div className="cookie-modal">
        <div className="cookie-emoji" aria-hidden>
          🍪
        </div>
        <h2>We value your privacy</h2>
        <p className="cookie-blurb">
          We and our 1,300+ carefully selected partners store and/or access information on your
          device — such as cookies, device identifiers, and browsing behavior — to personalize
          content and advertising, measure performance, and develop new products, including on the
          basis of legitimate interest. You can accept, reject, or manage your preferences below.
        </p>
        <ul className="cookie-cats">
          <li>
            <span>Strictly necessary</span>
            <span className="cookie-on">Always on</span>
          </li>
          {CATEGORIES.map((c) => (
            <li key={c}>
              <span>{c}</span>
              <input type="checkbox" defaultChecked aria-label={c} />
            </li>
          ))}
        </ul>
        <div className="cookie-modal-actions">
          <button className="cookie-reject" onClick={dismiss}>
            Reject all non-essential
          </button>
          <button className="cookie-accept-big" onClick={dismiss}>
            Accept all cookies
          </button>
        </div>
        <p className="cookie-fine">
          By clicking “Accept all cookies” you agree to the storing of cookies on your device. See
          our Cookie Policy, Privacy Policy, and full list of 1,300 partners.
        </p>
      </div>
    </div>
  )
}
