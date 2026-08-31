// Tiny controller so a WebMCP tool can dismiss the on-screen popups (cookie
// consent, newsletter) that block the human view. The agent bypasses the DOM
// anyway; this just lets it clear the human's screen.

type Closer = () => void

const registry = new Map<string, Closer>()
let suppressed = false

/** A popup registers its close fn while it is shown. Returns an unregister fn. */
export function registerPopup(id: string, close: Closer): () => void {
  registry.set(id, close)
  return () => {
    if (registry.get(id) === close) registry.delete(id)
  }
}

export function openPopups(): string[] {
  return [...registry.keys()]
}

export function isPopupsSuppressed(): boolean {
  return suppressed
}

/** Close every open popup and suppress ones that haven't appeared yet. */
export function dismissPopups(): string[] {
  suppressed = true
  const ids = [...registry.keys()]
  for (const close of registry.values()) close()
  return ids
}
