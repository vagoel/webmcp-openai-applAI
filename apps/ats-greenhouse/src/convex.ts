import { ConvexReactClient } from 'convex/react'

const url = import.meta.env.VITE_CONVEX_URL as string | undefined

export const convex = url ? new ConvexReactClient(url) : null
export const convexConfigured = Boolean(url)
