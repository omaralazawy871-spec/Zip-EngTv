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

## Android app

- Native Kotlin app in `android/` (Jetpack Compose, MVVM, Hilt, Room, Media3/ExoPlayer). Talks to the existing `artifacts/api-server` backend only — no admin endpoints.
- Build tooling installed in this environment: JDK (GraalVM, via `java-graalvm22.3` module) + Gradle 8.14.2 (system dependency) + Android SDK at `/home/runner/android-sdk` (platform-tools, `platforms;android-35`, `build-tools;35.0.0`).
- The project's own Gradle wrapper JAR (`android/gradle/wrapper/gradle-wrapper.jar`, downloaded via `setup-wrapper.sh`) has no `Main-Class` manifest entry and cannot run — use the system `gradle` binary instead of `./gradlew`.
- Build commands (from `android/`, with `JAVA_HOME`/`PATH` pointed at the GraalVM JDK and `ANDROID_HOME=/home/runner/android-sdk`):
  - Debug: `gradle assembleDebug --no-daemon` → `app/build/outputs/apk/debug/app-debug.apk`
  - Release: `gradle assembleRelease --no-daemon` → `app/build/outputs/apk/release/app-release.apk`
- `android/local.properties` (gitignored) holds `sdk.dir`, `API_BASE_URL` (currently the dev domain — point this at the real production URL once deployed and rebuild), and release signing (`STORE_FILE=../engtv-release.keystore`, pointing at `engtv-release.keystore` in the **workspace root**, not inside `android/`).
- The release keystore (`engtv-release.keystore`, workspace root, gitignored) was generated for this build — back it up; losing it means future releases can't update the same app install.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
