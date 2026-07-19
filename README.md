# EngTv — IPTV Streaming Application

Live TV streaming platform with Android app and admin panel.

## Architecture

See [FINAL_ARCHITECTURE.md](FINAL_ARCHITECTURE.md) for complete system documentation.

## Quick Start

### Prerequisites

- Node.js 22
- pnpm 9+
- PostgreSQL 16+
- Android Studio (for app development)
- JDK 17

### Backend Setup

```bash
# Install dependencies
pnpm install

# Set environment variables (see .env.example or FINAL_ARCHITECTURE.md)
export DATABASE_URL="postgresql://..."
export ADMIN_JWT_SECRET="your-secret"
export ADMIN_PASSWORD="your-password"
export PORT="3000"

# Run database migrations
pnpm --filter @workspace/db push

# Start development server
pnpm --filter @workspace/api-server dev
```

### Frontend (Admin Panel) Setup

```bash
pnpm --filter @workspace/engtv dev
```

Opens at `http://localhost:5173`.

### Android App Setup

1. Open `android/` in Android Studio
2. Copy `local.properties.template` → `local.properties`
3. Fill in `API_BASE_URL` pointing to your backend
4. Build & run on device/emulator

## Building for Production

### Backend
```bash
pnpm --filter @workspace/api-server build
node artifacts/api-server/dist/index.js
```

### Android
```bash
cd android
# Debug
./gradlew assembleDebug
# Release (requires signing config in local.properties)
./gradlew assembleRelease
```

### Frontend
```bash
pnpm --filter @workspace/engtv build
# Output in artifacts/engtv/dist/public/
```

## Testing

```bash
# Backend tests (41 tests)
pnpm --filter @workspace/api-server test

# Frontend tests
pnpm --filter @workspace/engtv test

# Typecheck all
pnpm run typecheck:libs
pnpm --filter @workspace/api-server typecheck
pnpm --filter @workspace/engtv typecheck
```

## Admin Panel Login

1. Navigate to `/admin`
2. Enter the `ADMIN_PASSWORD` configured on the server
3. Manage sources, channels, and settings

## Release Process

1. Update version in `android/app/build.gradle.kts` and `artifacts/engtv/package.json`
2. Commit: `git commit -m "chore: bump version to vX.Y.Z"`
3. Tag: `git tag vX.Y.Z && git push origin vX.Y.Z`
4. CI/CD creates a GitHub Release with APK + checksums

## Security Notes

- Never commit `local.properties` — it contains API URLs and signing keys
- `ADMIN_JWT_SECRET` must be a strong random string in production
- Source passwords are encrypted at rest using AES-256-GCM
- Backup exports exclude sensitive credentials by default
