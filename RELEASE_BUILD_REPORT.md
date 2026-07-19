# Release Build Verification Report

## Build Configuration

| Property | Value | Status |
|----------|-------|--------|
| applicationId | `com.engtv` | ✅ |
| compileSdk | 35 | ✅ |
| minSdk | 26 (Android 8.0) | ✅ |
| targetSdk | 35 | ✅ |
| versionCode | 1 | ⚠️ Set to appropriate value before release |
| versionName | `1.0.0` | ⚠️ Update to match semantic version |
| Minification (R8) | `true` | ✅ |
| Resource shrinking | `true` | ✅ |

## Signing Configuration

| Aspect | Detail | Status |
|--------|--------|--------|
| Signing config | From `local.properties` | ✅ |
| Keystore file | Configurable via `STORE_FILE` | ✅ |
| Key alias | `engtv` (configurable) | ✅ |
| Default | Falls back to unsigned when properties missing | ✅ |
| CI support | GitHub Secrets `STORE_*` for release workflow | ✅ |

## ProGuard / R8 Rules

| Library | Rules | Status |
|---------|-------|--------|
| Retrofit | Signature + Annotation keep | ✅ |
| OkHttp | dontwarn rules | ✅ |
| Kotlin Serialization | Serializer companion keep | ✅ |
| Hilt/Dagger | Class keep rules | ✅ |
| Media3 (ExoPlayer) | Full library keep | ✅ |
| Room | Entity + Database keep | ✅ |
| Paging 3 | Full library keep | ✅ |

**Risk**: Kotlin Serialization keep rules must cover all `@Serializable` data classes. Review if new models have been added since rules were written.

## Build Artifacts

| Artifact | Path | CI Generated |
|----------|------|-------------|
| Debug APK | `app/build/outputs/apk/debug/*.apk` | ✅ |
| Release APK | `app/build/outputs/apk/release/*.apk` | ✅ (with signing secrets) |
| APK Checksums | Included in GitHub Release | ✅ |

## CI/CD Release Workflow

| Step | Status |
|------|--------|
| Android lint | ✅ Runs before build |
| assembleDebug | ✅ |
| assembleRelease | ✅ (conditional on signing secrets) |
| APK upload (debug) | ✅ 30-day retention |
| APK upload (release) | ✅ 90-day retention |
| Release notes | ✅ Auto-generated from git log |
| GitHub Release | ✅ On `v*` tags |
| Checksums | ✅ Included in release body |

## Pre-Release Checklist

- [ ] Set `versionCode` to current build number (increment per release)
- [ ] Set `versionName` to semantic version (e.g., `1.0.0`)
- [ ] Verify keystore exists and passwords are correct
- [ ] Test debug APK on physical device
- [ ] Test release APK on physical device
- [ ] Verify ProGuard hasn't stripped necessary classes (test all screens)
- [ ] Verify `API_BASE_URL` in CI secrets or local.properties
- [ ] Push version tag to trigger release workflow

## Known Build Warnings

- `compose.ui.tooling` is a `debugImplementation` — correct, excluded from release
- Firebase Crashlytics dependencies are commented out — intentional
