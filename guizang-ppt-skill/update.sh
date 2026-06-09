#!/usr/bin/env bash
set -euo pipefail

ARCHIVE_URL="https://github.com/op7418/guizang-ppt-skill/archive/refs/heads/main.tar.gz"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TMP_DIR="$(mktemp -d)"
ARCHIVE_PATH="$TMP_DIR/source.tar.gz"

cleanup() {
  rm -rf "$TMP_DIR"
}

trap cleanup EXIT

mkdir -p "$TMP_DIR/repo"
curl -fL --retry 3 --connect-timeout 30 --output "$ARCHIVE_PATH" "$ARCHIVE_URL"
tar -tzf "$ARCHIVE_PATH" >/dev/null
tar -xzf "$ARCHIVE_PATH" --strip-components=1 -C "$TMP_DIR/repo"

rsync -a --delete \
  --exclude ".git/" \
  --exclude "update.sh" \
  "$TMP_DIR/repo/" \
  "$SCRIPT_DIR/"
