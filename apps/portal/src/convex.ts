import { ConvexReactClient } from 'convex/react'

// Single client instance shared by React (via ConvexProvider) and the WebMCP
// tool handlers (which call convex.query(...) imperatively). Null when the
// backend URL is not configured yet, so the UI can show a friendly hint.
const url = import.meta.env.VITE_CONVEX_URL as string | undefined

export const convex = url ? new ConvexReactClient(url) : null
export const convexConfigured = Boolean(url)
