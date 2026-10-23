#!/bin/sh
# Install Rocsy from the terminal, without downloading the release by hand:
#
#   curl -fsSL https://rocsy.rocks/install.sh | sh
#   curl -fsSL https://rocsy.rocks/install.sh | sh -s -- --defaults      no questions
#   curl -fsSL https://rocsy.rocks/install.sh | sh -s -- --dir ~/AI/Rocsy
#
# It fetches the latest installer from GitHub Releases into a temporary folder, checks it
# against the release's SHA256SUMS, runs it in the terminal and removes the temporary folder.
# Options after `--` go to the installer (--defaults, --dir PATH, --verbose, --help).
# ROCSY_VERSION=v1.2 installs that release instead of the latest one.
set -eu

REPO=BittyBunnyBytes/Rocsy
VERSION=${ROCSY_VERSION:-latest}
if [ "$VERSION" = latest ]; then
    BASE="https://github.com/$REPO/releases/latest/download"
else
    BASE="https://github.com/$REPO/releases/download/$VERSION"
fi

say() { printf '%s\n' "$*" >&2; }
fail() { say "Rocsy: $*"; exit 1; }

fetch() {  # fetch URL FILE
    if command -v curl >/dev/null 2>&1; then
        curl -fsSL --retry 3 -o "$2" "$1"
    elif command -v wget >/dev/null 2>&1; then
        wget -q --tries=3 -O "$2" "$1"
    else
        fail "curl or wget is needed to download the installer."
    fi
}

sha256() {
    if command -v sha256sum >/dev/null 2>&1; then
        sha256sum "$1" | cut -d' ' -f1
    elif command -v shasum >/dev/null 2>&1; then
        shasum -a 256 "$1" | cut -d' ' -f1
    else
        fail "sha256sum is needed to check the download."
    fi
}

[ "$(uname -s)" = Linux ] || fail "this installs on Linux. On Windows, use 'Install Rocsy (Windows).cmd' from the release (untested)."
command -v tar >/dev/null 2>&1 || fail "tar is needed to unpack the installer."

WORK=$(mktemp -d "${TMPDIR:-/tmp}/rocsy-install.XXXXXX")
trap 'rm -rf "$WORK"' EXIT INT TERM

say "Rocsy: finding the $VERSION installer…"
fetch "$BASE/SHA256SUMS" "$WORK/SHA256SUMS" || fail "couldn't reach GitHub Releases ($BASE)."
LINE=$(grep -E '  rocsy-.*-installer\.tar\.gz$' "$WORK/SHA256SUMS" | head -n 1)
[ -n "$LINE" ] || fail "the release has no installer listed in SHA256SUMS."
EXPECTED=${LINE%%  *}
ASSET=${LINE#*  }

say "Rocsy: downloading $ASSET…"
fetch "$BASE/$ASSET" "$WORK/$ASSET" || fail "the download failed."
[ "$(sha256 "$WORK/$ASSET")" = "$EXPECTED" ] || fail "the download doesn't match its checksum; nothing was installed."
tar -xzf "$WORK/$ASSET" -C "$WORK"
INSTALLER="$WORK/Rocsy Installer/Install Rocsy.sh"
[ -f "$INSTALLER" ] || fail "the download doesn't contain the installer."

# Ask the questions in this terminal unless the options already say what to do.
MODE=--terminal
for arg in "$@"; do
    case "$arg" in --defaults|-y|--help|-h) MODE= ;; esac
done

say "Rocsy: starting the installer."
# Piped through `| sh`, stdin is this script, so questions and sudo read from the terminal itself.
# (Checked in a subshell: a failed redirect on a builtin would end this script silently.)
has_tty() { (exec </dev/tty) 2>/dev/null; }
if [ -n "$MODE" ]; then
    if ! has_tty; then
        fail "no terminal to ask questions in. Run it with:  curl -fsSL https://rocsy.rocks/install.sh | sh -s -- --defaults"
    fi
    sh "$INSTALLER" "$MODE" "$@" </dev/tty
elif has_tty; then
    sh "$INSTALLER" "$@" </dev/tty
else
    sh "$INSTALLER" "$@"
fi
