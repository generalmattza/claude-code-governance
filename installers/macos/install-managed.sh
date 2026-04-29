#!/usr/bin/env bash
set -euo pipefail

# Installs managed-settings.json to /Library/Application Support/ClaudeCode/.
# Requires sudo. For Jamf-deployed machines this is what Jamf runs as part of
# the configuration profile (or as a separately scoped policy).
#
# This script is admin-only and intentionally NOT covered by the bats suite.
# bats runs unprivileged and cannot exercise the system path or chflags uchg.
# Admins can sanity-check locally; see installers/macos/jamf/README.md.

PROFILE="regulated"
[[ "${1:-}" == "--profile" ]] && PROFILE="$2"

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TARGET_DIR="/Library/Application Support/ClaudeCode"
TARGET_FILE="$TARGET_DIR/managed-settings.json"
MANIFEST_FILE="$TARGET_DIR/.ccsec-manifest"

if [[ "$EUID" -ne 0 ]]; then
  echo "error: install-managed requires sudo" >&2
  exit 1
fi

mkdir -p "$TARGET_DIR"

# Compile the chosen profile
node "$REPO_ROOT/packages/cli/bin/ccsec.js" compile \
  --profile "$PROFILE" \
  --target managed \
  --os macos \
  --settings-root "$REPO_ROOT/packages/settings" \
  --out "$TARGET_FILE"

# Tamper protection: ownership root:wheel, mode 0644, immutable
chown root:wheel "$TARGET_FILE"
chmod 0644 "$TARGET_FILE"
chflags uchg "$TARGET_FILE"

# Manifest with sha256
sha=$(shasum -a 256 "$TARGET_FILE" | awk '{print $1}')
cat > "$MANIFEST_FILE" <<MANIFEST
{
  "profile": "$PROFILE",
  "installed_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "settings_sha256": "$sha"
}
MANIFEST
chown root:wheel "$MANIFEST_FILE"
chmod 0644 "$MANIFEST_FILE"

echo "managed install complete: $TARGET_FILE (profile=$PROFILE, sha=$sha)"
