# EngTv Admin Guide

## Admin Login

1. Open the app → **Settings** → **Developer Mode**
2. Enter the **admin password** (set via `ADMIN_PASSWORD` environment variable on the server)
3. Tap **Login**

> **Security**: The admin password is stored only on the server. The app receives a JWT token (valid for 7 days) stored in encrypted device storage.

## Dashboard

After login, the admin panel shows:

| Section | Description |
|---------|-------------|
| Sources | IPTV source list and management |
| Sync Status | Last sync time, manual sync trigger |
| Sync History | Recent sync operation results |

## Adding an IPTV Source

### M3U Source

1. Tap **Add Source**
2. Name: Enter a descriptive name (e.g., "My Provider")
3. Type: Select `m3u`
4. URL: Paste the full M3U playlist URL
5. Filters (optional):
   - Language: `all`, `arabic`, `english`
   - Countries: comma-separated ISO codes (e.g., `SA,AE,US`)
   - Categories: comma-separated filter patterns
6. Auto-sync: Set interval in hours (0 = manual only)
7. Tap **Add**

### Xtream Codes Source

1. Tap **Add Source**
2. Name: Enter a descriptive name
3. Type: Select `xtream`
4. Server URL: Your Xtream server base URL
5. Username: Xtream account username
6. Password: Xtream account password
7. Filters: Same as M3U
8. Tap **Add**

> **Note**: Xtream passwords are encrypted (AES-256-GCM) before being stored in the database. They are never logged or exposed in API responses.

## Sync Management

### Manual Sync
- Tap **Sync** on any source to trigger immediate sync
- Tap **Sync All** to sync all active sources

### Auto-Sync
- Set `sync_interval_hours` on a source to enable automatic syncing
- The server checks for due syncs every 60 seconds

### Sync Results
Each sync creates a history record showing:
- Number of channels imported
- Number of categories created
- Number of channels deactivated (removed from source)
- Duration
- Error message (if failed)

## Backup & Restore

### Export Backup

1. In Settings → Backup, tap **Export**
2. Choose a location to save the `engtv_backup.json` file
3. All data (channels, categories, sources, settings) is exported

> **Security**: By default, backup excludes credential/sensitive data. To include credentials, modify the `includeCredentials` parameter in `BackupManager.exportBackup()` before building the APK.

### Import Backup

1. In Settings → Backup, tap **Import**
2. Select a previously exported JSON file
3. **Warning**: This replaces ALL existing data

## Health Checks

- The server runs periodic health checks on active channels
- Unhealthy channels are marked with their error status
- Configure concurrency via `HEALTH_CHECK_CONCURRENCY` env var (default: 10)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Login fails | Verify `ADMIN_PASSWORD` environment variable is set correctly |
| Sync fails | Check source URL/credentials in the source edit dialog |
| Channels not appearing | Run a manual sync and check Sync History for errors |
| Backup fails | Ensure storage permission is granted |
| "Source not found" | The source may have been deleted — check the sources list |
| Sync stuck on "running" | Restart the server to clear stuck state |
