import { useSyncExternalStore } from 'react'
import type { FormStore } from './store'
import type { FormSnapshot } from './types'

export function useFormStore(store: FormStore): FormSnapshot {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
}
