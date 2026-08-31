import { FormStore, buildAtsTools } from '@webmcp-jobs/ats-core'
import { leverlyForm } from './config'
import { deps } from './deps'

export const store = new FormStore(leverlyForm)
export const tools = buildAtsTools(store, deps)
