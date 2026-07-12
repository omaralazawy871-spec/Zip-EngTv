---
name: EngTv Android
description: Native Kotlin Android app structure, build setup, and key decisions for the EngTv project
---

## Location
`android/` at the monorepo root — completely separate from the pnpm workspace (no package.json, no node_modules).

## Build system
- Gradle 8.9 wrapper (JAR already downloaded to `android/gradle/wrapper/gradle-wrapper.jar`)
- AGP 8.6.1, Kotlin 2.0.21, KSP 2.0.21-1.0.28
- Version catalog: `android/gradle/libs.versions.toml`
- To build debug APK: `cd android && ./gradlew assembleDebug`
- Requires `local.properties` (copy from `local.properties.template`); sets `sdk.dir` and `API_BASE_URL`

## Key architecture decisions

### Dynamic API URL (runtime-configurable)
- `ApiConfigHolder` — volatile singleton holding the effective base URL
- `UrlRewriteInterceptor` (in `ApiClient.kt`) — OkHttp interceptor rewrites host/scheme/port on every request from `ApiConfigHolder.baseUrl`
- `EngTvApp.onCreate()` reads saved URL from SharedPreferences into `ApiConfigHolder` at startup
- `SettingsRepository.saveApiUrl()` writes to SharedPreferences + DataStore + `ApiConfigHolder` simultaneously
- **Why:** Lets users change the backend URL in the Settings screen without reinstalling/rebuilding the APK; takes effect immediately (no restart needed)

### No IPTV stream URLs in APK source code
- `Channel.streamUrl` is fetched live from `GET /api/channels/{id}` when user taps a channel
- Room caches the URL locally (from API responses) for offline use — but it is never hardcoded in source
- **Why:** The spec requirement "Do not store IPTV URLs inside the APK" means no hardcoded URLs in source code

### Splash Screen
- Uses `androidx.core:core-splashscreen` (1.0.1)
- Activity in AndroidManifest uses `Theme.EngTv.Starting` (extends `Theme.SplashScreen`)
- `installSplashScreen()` called in `MainActivity.onCreate()` BEFORE `super.onCreate()`
- **Why:** Provides OS-level splash (icon on dark background) with zero jank before Compose renders

### RTL Arabic layout
- `CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl)` wraps all Compose content in `MainActivity`
- `android:supportsRtl="true"` set on the `<application>` tag in AndroidManifest
- **Why:** The entire UI is Arabic; without this wrapper, Compose defaults to LTR even on Arabic devices

### DI (Hilt)
- `@HiltAndroidApp` on `EngTvApp`, `@AndroidEntryPoint` on `MainActivity` and `EngTvPlaybackService`
- `@HiltViewModel` on all ViewModels, `@Singleton` on repositories/player/db
- `AppModule` in `di/` provides OkHttp, Retrofit, Room, DataStore, SharedPreferences

### Playback
- `PlayerManager` — Hilt singleton wrapping ExoPlayer with lazy init
- HLS streams detected by `.m3u8` in URL → `HlsMediaSource`; others → generic `MediaItem`
- `EngTvPlaybackService` (MediaSessionService) for background playback + lock-screen controls
- Service does NOT own/release the player — `PlayerManager` does

## Package structure
```
com.engtv/
  data/api/          EngTvApi (Retrofit), ApiClient, ApiConfigHolder, UrlRewriteInterceptor
  data/models/       Channel, Category, AppSettings (kotlinx.serialization)
  data/database/     AppDatabase (Room), DAOs, Entities
  data/repository/   ChannelRepository, CategoryRepository, SettingsRepository
  di/                AppModule (Hilt)
  player/            PlayerManager (ExoPlayer), EngTvPlaybackService
  ui/home/           HomeScreen + HomeViewModel (resume last channel featured card)
  ui/player/         PlayerScreen (full-screen ExoPlayer) + PlayerViewModel
  ui/search/         SearchScreen (debounced 300ms) + SearchViewModel
  ui/favorites/      FavoritesScreen + FavoritesViewModel
  ui/category/       CategoryScreen + CategoryViewModel
  ui/settings/       SettingsScreen (API URL editor) + SettingsViewModel
  ui/navigation/     Screen (sealed class), NavGraph (Compose Navigation)
  ui/theme/          Color, Theme, Type (Material3 dark, cinematic palette)
  MainActivity       installSplashScreen + RTL CompositionLocalProvider + BottomNav
  EngTvApp           HiltAndroidApp, reads saved URL from SharedPreferences at startup
```

## Permissions
INTERNET, ACCESS_NETWORK_STATE, WAKE_LOCK, FOREGROUND_SERVICE, FOREGROUND_SERVICE_MEDIA_PLAYBACK (Android 14+), POST_NOTIFICATIONS (Android 13+)

**How to apply:** Any future Android work should follow these patterns. Check this file before adding new network, DI, or navigation code.
