import { useState } from 'react'
import type { FormStore } from './store'

const DEFAULT_TERMS = `By submitting this application you acknowledge and agree to the following. \
The Company may collect, process, retain, and share the personal information you provide \
with its affiliates, subsidiaries, service providers, background-check vendors, and \
recruitment partners for the purposes of evaluating your candidacy and for other lawful \
business purposes. You confirm that all information provided is accurate and complete, and \
you understand that any misrepresentation may result in disqualification or, if hired, \
termination. You consent to being contacted by phone, email, and SMS regarding this and \
future opportunities. Your data may be stored for up to 24 months. This acknowledgment is \
required to proceed. Please read the entirety of this notice before continuing. \
Additional terms may apply depending on your jurisdiction. Thank you for reading to the end.`

/** A terms box whose checkbox only enables after the human scrolls to the bottom. UI-only. */
export function ScrollAgree({
  store,
  fieldId,
  label,
  text,
  checked,
}: {
  store: FormStore
  fieldId: string
  label: string
  text?: string
  checked: boolean
}) {
  const [scrolled, setScrolled] = useState(false)
  return (
    <div className="scroll-agree">
      <div
        className="terms-box"
        onScroll={(e) => {
          const el = e.currentTarget
          if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) setScrolled(true)
        }}
      >
        {text ?? DEFAULT_TERMS}
      </div>
      <label className={`check${scrolled ? '' : ' check-disabled'}`}>
        <input
          type="checkbox"
          disabled={!scrolled}
          checked={checked}
          onChange={(e) => store.setField(fieldId, e.target.checked)}
        />
        {label}
      </label>
      {!scrolled ? (
        <span className="field-help">Please scroll to the bottom of the terms to enable this checkbox.</span>
      ) : null}
    </div>
  )
}
