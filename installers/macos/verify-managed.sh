#!/usr/bin/env bash
set -euo pipefail

# Verifies managed-settings.json against its manifest. Reports tamper.
# Requires read access to /Library/Application Support/ClaudeCode/ (sudo for
# parity with install-managed.sh, though the file is mode 0644 by design).
#
# Exit codes:
#   0  OK
#   1  missing file or manifest
#   2  hash mismatch (tamper detected)

TARGET_DIR="/Library/Application Support/ClaudeCode"
TARGET_FILE="$TARGET_DIR/managed-settings.json"
MANIFEST_FILE="$TARGET_DIR/.ccsec-manifest"

if [[ ! -f "$TARGET_FILE" ]]; then
  echo "ERROR: $TARGET_FILE missing"
  exit 1
fi
if [[ ! -f "$MANIFEST_FILE" ]]; then
  echo "ERROR: $MANIFEST_FILE missing"
  exit 1
fi

expected=$(grep -o '"settings_sha256":[^"]*"[^"]*"' "$MANIFEST_FILE" | sed -E 's/.*"([a-f0-9]+)"$/\1/')
actual=$(shasum -a 256 "$TARGET_FILE" | awk '{print $1}')

if [[ "$expected" != "$actual" ]]; then
  echo "ERROR: tamper detected. Expected $expected, got $actual"
  exit 2
fi

# Check immutability
if ! ls -lO "$TARGET_FILE" | grep -q uchg; then
  echo "WARN: $TARGET_FILE is not flagged uchg (immutable). Reinstall managed config."
fi

echo "OK"
