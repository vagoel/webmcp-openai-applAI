import { useEffect, useState } from 'react'

const KEY = 'wmj_news'

/** "Get job alerts" modal that pops up a few seconds after load, once per session. */
export function NewsletterModal() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    try {
      if (sessionStorage.getItem(KEY) === '1') return
    } catch {
      /* ignore */
    }
    const t = window.setTimeout(() => setOpen(true), 4000)
    return () => window.clearTimeout(t)
  }, [])
  if (!open) return null
  const close = () => {
    try {
      sessionStorage.setItem(KEY, '1')
    } catch {
      /* ignore */
    }
    setOpen(false)
  }
  return (
    <div className="modal-overlay" onClick={close}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-x" onClick={close} aria-label="Close">
          ×
        </button>
        <h2>Never miss a job 🔔</h2>
        <p>Join 2.4 million job seekers getting personalized alerts in their inbox.</p>
        <input className="modal-input" type="email" placeholder="you@email.com" />
        <button className="modal-cta" onClick={close}>
          Subscribe for job alerts
        </button>
        <button className="modal-skip" onClick={close}>
          No thanks, I don't want a better career
        </button>
      </div>
    </div>
  )
}
