import { FormStore, buildAtsTools } from '@webmcp-jobs/ats-core'
import { greenholdForm } from './config'
import { deps } from './deps'

// One store + tool set shared by React rendering, the WebMCP tool handlers, and
// the dev console hook.
export const store = new FormStore(greenholdForm)
export const tools = buildAtsTools(store, deps)
