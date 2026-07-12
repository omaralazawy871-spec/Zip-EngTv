# EngTv Android — Build Guide

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| JDK | 17+ | `sdk install java 17-graalce` (sdkman) or Android Studio bundled JDK |
| Android SDK | API 35 | Android Studio SDK Manager or `sdkmanager "platforms;android-35"` |
| Android Build Tools | 35.0.0 | `sdkmanager "build-tools;35.0.0"` |
| Gradle Wrapper | 8.9 | auto-downloaded on first build |

---

## 1 — Set up local.properties

```bash
cd android
cp local.properties.template local.properties
```

Edit `local.properties` and set:

```properties
sdk.dir=/path/to/your/Android/sdk
API_BASE_URL=https://your-engtv-backend.replit.app/api/
```

> **For an Android Emulator (local dev):** use `http://10.0.2.2:8080/api/` as the URL  
> so the emulator can reach your host machine's API server.

---

## 2 — Download the Gradle Wrapper JAR

The wrapper JAR is a binary not stored in source control. Run the setup script once:

```bash
cd android
chmod +x setup-wrapper.sh
./setup-wrapper.sh
```

Or download it manually:

```bash
mkdir -p gradle/wrapper
curl -Lo gradle/wrapper/gradle-wrapper.jar \
  "https://github.com/gradle/gradle/raw/v8.9.0/gradle/wrapper/gradle-wrapper.jar"
```

---

## 3 — Build the APK

### Debug APK (for sideloading / testing)

```bash
cd android
./gradlew assembleDebug
```

Output: `app/build/outputs/apk/debug/app-debug.apk`

### Release APK (for distribution)

1. Create a keystore (first time only):

```bash
keytool -genkey -v -keystore engtv-release.keystore \
        -alias engtv -keyalg RSA -keysize 2048 -validity 10000
```

2. Add to `local.properties`:

```properties
STORE_FILE=../engtv-release.keystore
STORE_PASSWORD=your_keystore_password
KEY_ALIAS=engtv
KEY_PASSWORD=your_key_password
```

3. Update `app/build.gradle.kts` signing config (already scaffolded), then:

```bash
./gradlew assembleRelease
```

Output: `app/build/outputs/apk/release/app-release.apk`

---

## 4 — Install on a device

```bash
adb install app/build/outputs/apk/debug/app-debug.apk
```

---

## Project Structure

```
android/
├── app/
│   └── src/main/kotlin/com/engtv/
│       ├── data/
│       │   ├── api/           Retrofit interface + OkHttp client
│       │   ├── models/        Kotlinx-Serialization data classes
│       │   ├── repository/    Repository layer (single source of truth)
│       │   └── database/      Room DB + DAOs + Entities
│       ├── di/                Hilt AppModule
│       ├── player/            ExoPlayer + HLS + MediaSession service
│       └── ui/
│           ├── home/          HomeScreen + HomeViewModel
│           ├── player/        PlayerScreen + PlayerViewModel
│           ├── search/        SearchScreen + SearchViewModel
│           ├── favorites/     FavoritesScreen + FavoritesViewModel
│           ├── category/      CategoryScreen + CategoryViewModel
│           ├── settings/      SettingsScreen + SettingsViewModel
│           ├── navigation/    NavGraph + Screen sealed class
│           └── theme/         Material3 dark theme (cinematic palette)
├── gradle/
│   ├── libs.versions.toml     Version catalog
│   └── wrapper/               Gradle wrapper (JAR downloaded separately)
├── BUILD.md                   ← you are here
├── local.properties.template  Copy → local.properties and fill in values
├── gradlew / gradlew.bat      Gradle wrapper scripts
└── settings.gradle.kts
```

## Architecture

- **MVVM**: each screen has a ViewModel (Hilt-injected) that holds UI state as `StateFlow`
- **Repository pattern**: single source of truth; API data flows through repositories into Room cache
- **No hardcoded stream URLs**: `Channel.streamUrl` is fetched live from the API when the user taps a channel; Room caches it locally but the source is always the server
- **Offline support**: Room DB caches channel/category lists; favorites stored as IDs only
- **HLS playback**: ExoPlayer with `HlsMediaSource`; falls back to direct URI for non-HLS streams
- **Background playback**: `EngTvPlaybackService` (MediaSessionService) exposes controls to the system

## Connecting to the Backend

The EngTv API is the **existing** Express backend in `artifacts/api-server`.  
The Android app only calls public endpoints:

| Endpoint | Used by |
|----------|---------|
| `GET /api/settings` | Settings screen + app name |
| `GET /api/categories` | Home screen category chips |
| `GET /api/categories/{id}` | Category screen |
| `GET /api/channels` | Home + Search + Favorites |
| `GET /api/channels/{id}` | Player screen (fresh stream URL fetch) |

Admin endpoints are not used by the Android app.
