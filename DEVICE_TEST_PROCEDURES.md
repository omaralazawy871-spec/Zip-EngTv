# Device & Production Test Procedures

> These procedures require physical devices, real IPTV sources, and a production backend. They are documented here for the release manager to execute.

---

## P8.2 — Physical Device Test Procedure

### Preparation
- Install the **release APK** (not debug) on an Android 8.0+ device
- Ensure device has a working internet connection
- Have the server URL and admin password ready

### Test Cases

| # | Test | Expected | Result |
|---|------|----------|--------|
| 1 | First launch shows splash screen | Splash displays, then loads channels | ☐ |
| 2 | Permission prompt (if any) | App functions without crashes | ☐ |
| 3 | Browse home screen categories | Categories load and scroll horizontally | ☐ |
| 4 | Browse channel grid | Channels load with logos | ☐ |
| 5 | Tap a channel | Stream starts playing within 5 seconds | ☐ |
| 6 | Search for a channel | Results appear as you type | ☐ |
| 7 | Add channel to favorites | Heart icon fills; channel appears in Favorites tab | ☐ |
| 8 | Switch to System/Arabic/English | UI language changes correctly (RTL for Arabic) | ☐ |
| 9 | Toggle theme (Light/Dark) | UI colors update immediately | ☐ |
| 10 | Settings: Change server URL | App reconnects to new server | ☐ |
| 11 | Developer login with correct password | Admin panel loads with sources | ☐ |
| 12 | Developer login with wrong password | Error message shown; no access granted | ☐ |
| 13 | Press back button repeatedly | No crashes; exits at root | ☐ |
| 14 | Rotate device while playing | Player adapts without restart | ☐ |
| 15 | Enable PiP and press Home | Video continues in floating window | ☐ |

---

## P8.3 — IPTV Real Source Test Procedure

### M3U Tests

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 1 | Small playlist | Add M3U with ~100 channels | Sync completes < 10s; all channels appear |
| 2 | Medium playlist | Add M3U with ~1,000 channels | Sync completes < 60s; categories parsed |
| 3 | Large playlist | Add M3U with 5,000+ channels | Sync completes; no OOM; all channels imported |
| 4 | Duplicate detection | Add M3U, sync again | No duplicate channels created |
| 5 | Update existing | Modify source URL, re-sync | Channels updated, no duplicates |
| 6 | Filter by language | Set `arabic` filter | Only Arabic channels imported |

### Xtream Tests

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 1 | Valid credentials | Add Xtream source with valid username/password | Authenticates; channels sync |
| 2 | Invalid credentials | Add with wrong password | Sync fails with auth error |
| 3 | Expired subscription | Add expired Xtream account | Sync fails; error message clear |
| 4 | Encrypted storage | After adding, check DB | Password field contains encrypted value (not plaintext) |

---

## P8.4 — Streaming Reliability Test Procedure

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 1 | Normal HLS playback | Open any channel | Stream plays; quality selector shows options |
| 2 | Internet disconnect | Play channel → turn off WiFi | Video freezes; retry indicator appears |
| 3 | Internet reconnect | From above → turn WiFi back on | Player auto-recovers within 15s |
| 4 | Slow network | Throttle to 100kbps | Player adapts quality (if available) |
| 5 | Stream timeout | Point source to dead URL | Error message after 15s buffer timeout |
| 6 | External player | Tap external player icon | System chooser opens with VLC/MX options |
| 7 | Audio tracks | Play channel with multiple audio tracks | Switch tracks from audio selector |
| 8 | Subtitles | Play channel with subtitles | Toggle from CC selector |

---

## P8.5 — Large Dataset Performance Test Procedure

### Setup
Use a test M3U generator or real provider with 10,000+ channels.

### Measurements

| Metric | 10,000 channels | 20,000 channels |
|--------|----------------|----------------|
| App cold start time | ☐ __________ | ☐ __________ |
| Home screen load (channels visible) | ☐ __________ | ☐ __________ |
| Category list load | ☐ __________ | ☐ __________ |
| Search response (first result) | ☐ __________ | ☐ __________ |
| Memory usage (idle) | ☐ __________ | ☐ __________ |
| Memory usage (browsing) | ☐ __________ | ☐ __________ |
| Scroll smoothness (frame drops) | ☐ __________ | ☐ __________ |

### Pass Criteria
- App starts within 5 seconds
- No ANR (Application Not Responding) dialogs
- Scrolling LazyColumn stays at 60fps
- Memory stays under 256MB
- Search returns results within 2 seconds
- No OutOfMemoryError during sync
