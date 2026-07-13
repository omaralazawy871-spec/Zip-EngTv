# EngTv

An Arabic (RTL) IPTV/channel viewer with an admin-managed backend that syncs channels from M3U playlists and Xtream Codes sources.

## Run & Operate

- Workflows (already configured, start automatically): `artifacts/api-server: API Server`, `artifacts/engtv: web`, `artifacts/mockup-sandbox: Component Preview Server`
- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm --filter @workspace/engtv run dev` — run the frontend viewer
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (already provisioned)
- Optional env for admin login: `ADMIN_PASSWORD`, `ADMIN_JWT_SECRET` (not yet set — admin auth won't work until these are added)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Imported from GitHub: the artifact registry (`listArtifacts()`) didn't carry over, so the three workflows were recreated manually with `configureWorkflow` using the exact `PORT`/`BASE_PATH` values from each `artifacts/*/.replit-artifact/artifact.toml`. Path-based routing (`/`, `/api`, `/__mockup`) still works correctly.
- `DATABASE_URL` was already provisioned; schema was pushed with `pnpm --filter db run push`. The DB is empty — no channels/categories exist yet (add via admin panel or seed).
- Admin login (`ADMIN_PASSWORD`, `ADMIN_JWT_SECRET`) falls back to a dev default when unset, so it works locally without configuration. Set both before deploying to production — the server throws on startup in production if they're missing.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
