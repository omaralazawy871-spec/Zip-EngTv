# EngTv User Guide

## Installing the APK

1. Download the latest `EngTv-release.apk` from GitHub Releases
2. On your Android device, enable **Install from unknown sources** in Settings
3. Open the downloaded APK file and follow the installation prompts
4. **Note**: Google Play Protect may show a warning for unsigned debug builds — use the **release APK** to avoid this

## First Launch

1. Open EngTv
2. The app loads channels from the server automatically
3. If no channels appear, check that the server URL is correct (configured by the APK builder)

## Home Screen

- **Categories**: Scroll horizontally through channel categories
- **Channels**: Browse the main channel grid — tap any channel to start watching
- **Search**: Tap the search icon to find channels by name
- **Favorites**: Tap the heart icon on any channel to add it to favorites
- **Watch History**: Recently watched channels appear at the top

## Watching Channels

### Player Controls
| Action | How |
|--------|-----|
| Play/Pause | Tap the center of the screen |
| Seek | Drag the progress bar |
| Quality | Tap the quality icon (gear) to select resolution |
| Audio | Tap the audio icon to change audio track |
| Subtitles | Tap the CC icon to enable/disable subtitles |
| Fullscreen | Rotate device or tap fullscreen icon |

### Features

- **Picture-in-Picture**: Press Home while watching to continue playback in a floating window
- **External Player**: Tap the external player icon to open the stream in VLC, MX Player, etc.
- **Auto-retry**: If a stream fails, the app automatically retries up to 3 times

## Favorites

1. While watching a channel, tap the **heart icon** to favorite it
2. Access favorites from the **Favorites** tab on the home screen
3. Tap the heart again to unfavorite

## Settings

| Setting | Description |
|---------|-------------|
| Theme | Switch between Light, Dark, or System default |
| Language | Switch between Arabic and English |
| Auto-play last | Resume last watched channel on app start |
| Default player | Choose Internal player or External (VLC, etc.) |
| Server URL | Configure the backend API address |

## Developer Mode

Access the admin panel from Settings → Developer Mode.

This is for **administrators only** — requires the admin password.

### Developer Features

- **Source Management**: Add, edit, and delete IPTV sources (M3U / Xtream Codes)
- **Sync**: Trigger manual sync or view sync history
- **Backup**: Export/restore all app data (channels, categories, settings)

## Troubleshooting

| Problem | Solution |
|---------|----------|
| No channels | Verify the server URL in Settings or contact your provider |
| Stream won't play | Check your internet connection; the app will auto-retry |
| App crashes | Ensure you're using the latest release APK |
| Arabic text issues | Set language to Arabic in Settings |
| Favorites not saving | Clear app cache in Android Settings → Apps → EngTv → Storage |
