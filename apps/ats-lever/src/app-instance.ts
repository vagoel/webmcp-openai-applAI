import { FormStore, requireAll } from '@webmcp-jobs/ats-core'
import { leverlyForm } from './config'
import { deps } from './deps'
import { buildTools } from './webmcp/tools'

// Every field is mandatory.
export const store = new FormStore(requireAll(leverlyForm))
export const tools = buildTools(store, deps)
