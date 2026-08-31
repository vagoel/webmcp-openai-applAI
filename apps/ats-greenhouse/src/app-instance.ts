import { FormStore, requireAll } from '@webmcp-jobs/ats-core'
import { greenholdForm } from './config'
import { deps } from './deps'
import { buildTools } from './webmcp/tools'

// One store + tool set shared by React rendering, the WebMCP tool handlers, and
// the dev console hook. Every field is mandatory.
export const store = new FormStore(requireAll(greenholdForm))
export const tools = buildTools(store, deps)
