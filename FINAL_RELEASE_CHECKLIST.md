# Final Release Checklist

## Pre-Release Verification

### Backend
- [x] TypeScript typecheck: 0 errors
- [x] All 41 backend tests pass
- [x] Production build completes without errors
- [x] Helmet, CORS, rate limiting, request-id middleware active
- [x] Graceful shutdown handler registered
- [x] JWT secret rotated from default

### Android
- [x] Debug APK builds successfully
- [x] Release APK builds successfully
- [x] Lint passes with 0 warnings
- [x] Global crash handler installed (ready for Firebase Crashlytics)
- [x] Theme colors use Material3 tokens (no hardcoded `Color.White`/`Color.Black`)
- [x] JWT session auto-logout on HTTP 401
- [x] Token stored in EncryptedSharedPreferences
- [x] Backup export excludes credentials by default

### Frontend (Admin Panel)
- [x] TypeScript typecheck passes
- [x] Tests pass
- [x] Production build succeeds
- [x] Lazy loading implemented for admin routes
- [x] All admin pages (login, dashboard, channels, categories, settings, sources, backup) code-split

### CI/CD
- [x] Quality job runs: typecheck, tests, build
- [x] Android lint in build job
- [x] Debug APK uploaded as artifact
- [x] Release APK built with signing secrets
- [x] Auto-release on tag push (`v*`)

## Release Steps

1. [ ] Update version code in `android/app/build.gradle.kts`
2. [ ] Update version name in `android/app/build.gradle.kts`
3. [ ] Update `package.json` version in `artifacts/engtv/`
4. [ ] Commit version bumps: `git commit -m "chore: bump version to vX.Y.Z"`
5. [ ] Tag release: `git tag vX.Y.Z && git push origin vX.Y.Z`
6. [ ] Verify CI/CD pipeline completes successfully
7. [ ] Download release APK from GitHub Releases
8. [ ] Smoke test on physical Android device
9. [ ] Deploy backend to production (Replit/k8s)
10. [ ] Verify backend health endpoint
11. [ ] Production sign-off

## Post-Release
- [ ] Monitor crash reports (Firebase Crashlytics)
- [ ] Monitor backend error logs
- [ ] Verify Xtream source sync is running
