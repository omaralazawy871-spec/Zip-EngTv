---
name: EngTv architecture
description: Key decisions, naming conventions, and gotchas for the EngTv IPTV platform
---

## Structure
- `artifacts/api-server` — Express 5 + Drizzle ORM backend, serves at `/api`
- `artifacts/engtv` — React + Vite + Tailwind viewer, always-dark, RTL Arabic (Cairo font)
- `lib/api-spec/openapi.yaml` — source of truth for all endpoints; run `pnpm --filter @workspace/api-spec run codegen` after changes
- `lib/api-zod/src/generated/api.ts` — Zod schemas used in backend routes for validation
- `lib/api-client-react/src/generated/api.ts` — React Query hooks used in frontend

## Orval-generated Zod schema naming
- Schema names follow the **operation** pattern, NOT the TypeScript type names
- Example: TypeScript type `AdminLoginInput` → Zod schema `AdminLoginBody`; type `AdminLoginResult` → Zod schema `AdminLoginResponse`
- Pattern: `{OperationId}{Body|Response|Params|QueryParams}` — always check `lib/api-zod/src/generated/api.ts` before importing
- Array responses generate `{Name}ResponseItem` + `{Name}Response = zod.array(...)` 

## Package exports gotcha
- `lib/api-client-react/package.json` must export `"./src/custom-fetch": "./src/custom-fetch.ts"` for auth token getter to be importable by the frontend

## CSS import order
- Google Fonts `@import url(...)` must come BEFORE `@import 'tailwindcss'` in index.css — PostCSS enforces this

## Admin auth
- `ADMIN_PASSWORD` secret → checked at login; `ADMIN_JWT_SECRET` secret → signs 7d JWT tokens
- Token stored in `localStorage` as `engtv_admin_token`; `setAuthTokenGetter` in App.tsx attaches it to all API calls

## DB tables
- categories, channels, settings, sources, sync_history — all pushed to Postgres via `pnpm --filter @workspace/db run push`

## Sync engine
- `artifacts/api-server/src/lib/sync-engine.ts` — handles M3U parsing and Xtream Codes API calls
- Creates sync_history records; upserts channels by external_id or name per source

**Why:** Source of truth so future work doesn't guess schema names or break imports.
