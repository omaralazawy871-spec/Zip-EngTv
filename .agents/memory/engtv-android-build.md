---
name: EngTv Android build environment
description: How to build the EngTv native Android app (debug/release APK) in a Replit container, and two real bugs found while doing so
---

Building the native Kotlin app in `android/` from a bare Replit container requires manual setup — there's no Android module in `listAvailableModules`:

1. `installProgrammingLanguage({ language: "java-graalvm22.3" })` for a JDK (GraalVM 22.3 ships as Java 19 under the hood; works fine as the Gradle daemon JVM for AGP 8.6.1 / Gradle 8.9-targeted projects).
2. `installSystemDependencies({ packages: ["gradle"] })` — installs Gradle system-wide. **Necessary because the checked-in `gradle-wrapper.jar` (downloaded via `setup-wrapper.sh` from `github.com/gradle/gradle/raw/vX.Y.Z/...`) has no `Main-Class` manifest entry and fails with "no main manifest attribute" — the wrapper JAR from that GitHub raw path is not usable.** Use the system `gradle` binary directly instead of `./gradlew`.
3. Manually install the Android SDK cmdline-tools (download `commandlinetools-linux-*_latest.zip` from `dl.google.com/android/repository/`), then `sdkmanager --licenses` (auto-accept with `yes |`) and `sdkmanager "platform-tools" "platforms;android-35" "build-tools;35.0.0"` — no prebuilt SDK module exists in this environment.

Two real, build-blocking bugs found in the EngTv Android app itself (not environment issues):
- `android/app/src/main/res/values/themes.xml` referenced `android:Theme.Material.NoTitleBar.Fullscreen`, which does not exist in the Android API 35 android.jar (only `Theme.Material.NoActionBar.Fullscreen` exists). AAPT2 link fails with "resource ... not found". Fix: use `android:Theme.Material.NoActionBar.Fullscreen`.
- The release signing config's `STORE_FILE=../engtv-release.keystore` in `local.properties` resolves relative to `android/` (the Gradle rootProject), i.e. to the **workspace root**, not `android/`. Generate/keep the release keystore at the workspace root, not inside `android/`.
