import { FormStore } from '@webmcp-jobs/ats-core'
import { leverlyForm } from './config'
import { deps } from './deps'
import { buildTools } from './webmcp/tools'

export const store = new FormStore(leverlyForm)
export const tools = buildTools(store, deps)
