import { useEffect, useState } from 'react'

/** Returns true for `ms` after `key` changes — a purely cosmetic loading delay. */
export function useMinLoading(key: string, ms = 700): boolean {
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    setLoading(true)
    const t = window.setTimeout(() => setLoading(false), ms)
    return () => window.clearTimeout(t)
  }, [key, ms])
  return loading
}
