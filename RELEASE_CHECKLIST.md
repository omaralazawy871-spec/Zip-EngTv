# EngTv Release Checklist

## Security
- [x] No hardcoded secrets in source code
- [x] JWT secret requires `ADMIN_JWT_SECRET` env var (no fallback)
- [x] Admin password requires `ADMIN_PASSWORD` env var (no fallback)
- [x] Xtream credentials encrypted via AES-256-GCM (`lib/crypto.ts`)
- [x] EncryptedSharedPreferences used for Android JWT storage
- [x] Network Security Config: cleartext disabled for release builds
- [x] CORS restricted in production via `CORS_ORIGIN` env var
- [x] Helmet security headers enabled
- [x] Rate limiting on admin login (10 req / 15 min)
- [x] Sensitive redaction in logs (auth headers, cookies)
- [x] Release keystore excluded from git tracking

## Backend
- [x] Production build succeeds
- [x] Database migrations exist (Drizzle: `0000_serious_master_chief.sql`)
- [x] API health check endpoint (`GET /api/healthz`)
- [x] Graceful shutdown handling (SIGTERM/SIGINT)
- [x] Request ID middleware for tracing
- [x] Consistent error response format
- [x] Stack traces hidden in production (controlled by `NODE_ENV`)
- [x] No development passwords or defaults in production

## Frontend (Admin Panel)
- [x] Admin panel builds for production
- [x] Backup/restore functionality works
- [x] i18n support enabled
- [x] Source management CRUD works
- [x] Channel management works
- [x] Category management works
- [x] Health check dashboard works

## Android
- [x] Debug APK builds successfully
- [x] Release APK builds with ProGuard/R8 minification
- [x] Shrink resources enabled for release
- [x] ProGuard rules cover: Retrofit, OkHttp, Kotlin Serialization, Hilt, Media3, Room
- [x] Signing config reads from `local.properties` (not hardcoded)
- [x] API base URL configurable via `local.properties` / build config
- [x] Player: internal + external player support
- [x] Picture-in-Picture support
- [x] Developer mode with JWT auth
- [x] Settings: theme (dark/light/system), language, player type
- [x] Backup/restore via Room database export
- [x] WorkManager periodic sync
- [x] Notification channels for sync and source status
- [x] Empty states and retry actions in UI
- [x] Global error handling (uncaught exceptions logged)

## CI/CD
- [x] Quality job: typecheck + tests (backend + frontend)
- [x] Backend build job
- [x] Android build job (debug + release)
- [x] APK artifact upload
- [x] Gradle cache
- [x] pnpm cache
- [x] Workflow fails on test/typecheck/build failure

## Database
- [x] Drizzle migration exists and matches schema
- [x] Room migration path validated (`MIGRATION_1_2`)
- [x] No destructive migration in production
- [x] Backup restore does not corrupt database (transactional)

## Known Limitations
1. **No automated UI tests** — Compose UI tests exist as stubs but need device/emulator to run
2. **No Firebase Crashlytics** — crash reporting relies on Android's built-in `Thread.setDefaultUncaughtExceptionHandler`
3. **No Play Store integration** — APK must be sideloaded or published manually
4. **JWT 7-day expiry** — no refresh token rotation; re-login required after expiry
5. **No WebSocket** — push notifications use polling via WorkManager; FCM ready but not enabled
6. **No health check for individual channels** — server-side batch health check exists but client doesn't expose it per channel
7. **No automated Android tests in CI** — requires physical device or emulator

## Signing & Distribution
1. Generate release keystore (if not already done):
   ```bash
   keytool -genkey -v -keystore engtv-release.keystore \
           -alias engtv -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Copy `local.properties.template` → `local.properties` and fill in:
   - `sdk.dir` — Android SDK path
   - `API_BASE_URL` — your deployed backend URL
   - `STORE_FILE`, `STORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD` — signing info
3. Build release APK:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```
4. APK output: `android/app/build/outputs/apk/release/app-release.apk`
5. Sign and zipalign if building manually (Android Studio / Gradle handles this automatically)

**Never commit `local.properties`, `keystore.properties`, or any `.keystore`/`.jks` file.**
