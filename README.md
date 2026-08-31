# WebMCP job-hunt suite

Three WebMCP-enabled sites that let a browser agent run a job hunt end to end.

**Live:**
- Jobly (portal): https://webmcp-jobs-portal.vercel.app
- Greenhold (ATS): https://webmcp-jobs-greenhold.vercel.app
- Leverly (ATS): https://webmcp-jobs-leverly.vercel.app

Backend: one shared Convex production deployment (`sincere-rat-11`).

| App | Role | Port (dev) | WebMCP tools |
| --- | --- | --- | --- |
| **Jobly** (`apps/portal`) | Job board, Indeed-style | 5173 | `list_jobs`, `get_job`, `get_filter_options` |
| **Greenhold** (`apps/ats-greenhouse`) | Greenhouse-style ATS, 5-step wizard | 5174 | form tools (below) |
| **Leverly** (`apps/ats-lever`) | Lever-style ATS, single page | 5175 | form tools (below) |

Both ATS sites register the same tool names — `get_job`, `get_application_form`,
`get_page_fields`, `get_current_page`, `start_application`, `fill_fields`,
`attach_resume`, `attach_cover_letter`, `goto_page`, `next_page`, `prev_page`,
`validate_application`, `submit_application` — but expose **structurally different forms**,
so an agent must introspect and adapt rather than hardcode.

Each ATS listing lives at its own URL, `/jobs/<id>`, which opens the **job posting**
(description, requirements, salary, skills) with an "Apply for this role" button that
reveals the multi-page form — like a real Greenhouse/Lever page.

The agent flow: open Jobly → `list_jobs` with filters → read a job's `applyUrl` →
navigate to `/jobs/<id>` on the ATS → `get_job` (the posting) → `start_application` (or the
human clicks Apply) → `get_application_form` → `fill_fields` page by page + attach CV/cover
letter → `validate_application` → `submit_application`. Submissions persist to Convex.
(The mutating tools also open the form automatically, so the human view follows the agent.)

## Architecture

- **Monorepo** (npm workspaces): three Vite + React + TypeScript apps, three shared
  packages.
  - `packages/webmcp` — WebMCP registration glue, tool helpers, and the
    `Origin-Agent-Cluster` Vite plugin (WebMCP requires origin isolation).
  - `packages/convex` — the **shared** Convex backend (`jobs` + `applications`). The only
    package that deploys the backend; all three apps point at the same `VITE_CONVEX_URL`.
  - `packages/ats-core` — a config-driven form engine (store, validation, submit mapping,
    WebMCP tools, React renderer) shared by both ATS sites.
- WebMCP tools call Convex **imperatively** (`convex.query/mutation`), so the agent path
  and the React UI share one backend and, in the ATS apps, one in-page form store.

## Setup

Requires Node 18+ and a Convex account.

```bash
npm install

# 1. Backend: create a Convex dev deployment (writes VITE_CONVEX_URL to
#    packages/convex/.env.local). Leave running, or use --once.
cd packages/convex
npx convex dev --once        # or: npx convex dev  (watch mode)

# 2. Seed ~120 job listings
npm run gen                  # regenerate seed/jobs.jsonl (optional; already committed)
npm run seed                 # convex import --table jobs --replace
```

Each app reads `VITE_CONVEX_URL` from its own environment. In dev, copy the value Convex
wrote into `packages/convex/.env.local` into each app's `.env.local` (or export it), e.g.:

```
VITE_CONVEX_URL=https://<your-deployment>.convex.cloud
```

The portal also accepts `VITE_ATS_GREENHOUSE_URL` and `VITE_ATS_LEVER_URL` (default
`http://localhost:5174` / `:5175`).

## Run

```bash
npm run dev:portal       # http://localhost:5173
npm run dev:greenhouse   # http://localhost:5174
npm run dev:lever        # http://localhost:5175
```

Open in ChatGPT's in-app browser or Chrome with WebMCP testing enabled. Each page shows a
"WebMCP connected" badge when an agent surface is present.

### Drive the tools without an agent (dev)

Every app exposes its tools on `window` in dev: `__portal`, `__greenhold`, `__leverly`.

```js
await __portal.tools.list_jobs.execute({ discipline: 'backend', remoteOnly: true })
await __greenhold.tools.get_application_form.execute({})
await __greenhold.tools.fill_fields.execute({ values: { firstName: 'Jane', email: 'j@x.com' } })
```

## Deploy (Vercel)

Deploy the backend once from `packages/convex` (`npx convex deploy`), then create three
Vercel projects, each with **Root Directory** set to its app folder, a plain
`npm run build`, and `VITE_CONVEX_URL` set to the production deployment URL (plus the two
`VITE_ATS_*_URL` vars on the portal). The `Origin-Agent-Cluster: ?1` header ships via each
app's `vercel.json`.

## Build / typecheck

```bash
npm run build   # tsc --noEmit && vite build for all three apps
```
