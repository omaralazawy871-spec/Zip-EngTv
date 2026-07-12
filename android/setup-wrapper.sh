#!/usr/bin/env bash
# Downloads the Gradle wrapper JAR — run once before your first build.
# The JAR is a binary not stored in source control.
set -euo pipefail

WRAPPER_DIR="$(dirname "$0")/gradle/wrapper"
JAR="$WRAPPER_DIR/gradle-wrapper.jar"
GRADLE_VERSION="8.9"
URL="https://github.com/gradle/gradle/raw/v${GRADLE_VERSION}.0/gradle/wrapper/gradle-wrapper.jar"

mkdir -p "$WRAPPER_DIR"

if [ -f "$JAR" ]; then
  echo "gradle-wrapper.jar already exists — skipping download."
  exit 0
fi

echo "Downloading Gradle ${GRADLE_VERSION} wrapper JAR…"
if command -v curl &>/dev/null; then
  curl -fsSL -o "$JAR" "$URL"
elif command -v wget &>/dev/null; then
  wget -q -O "$JAR" "$URL"
else
  echo "ERROR: neither curl nor wget found. Please install one and retry." >&2
  exit 1
fi

echo "Done. gradle-wrapper.jar written to $WRAPPER_DIR"
echo ""
echo "Next steps:"
echo "  1. Edit local.properties (copy from local.properties.template)"
echo "  2. chmod +x gradlew && ./gradlew assembleDebug"
